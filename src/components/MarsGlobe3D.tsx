import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  RotateCcw,
  Globe,
  Grid,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  X,
  Compass,
  Mountain,
  ChevronDown,
  ChevronUp,
  Play,
  Pause
} from 'lucide-react';
import { MARS_LOCATIONS, MarsLocation } from '../data/marsLocations';

interface MarsGlobe3DProps {
  mode: 'hero' | 'explorer';
  initialLocationId?: string;
  onNavigateTo2DMap?: () => void;
  onNavigateToExplorer?: (locationId?: string) => void;
}

const MARS_RADIUS = 1.0;

// Convert planetocentric latitude [-90..90] and longitude [-180..180]
// to exact Three.js SphereGeometry local coordinates matching equirectangular Mars Trek UV mapping.
export function latLonToMarsVector(latDeg: number, lonDeg: number, radius = MARS_RADIUS): THREE.Vector3 {
  const phi = ((lonDeg + 180) * Math.PI) / 180;
  const theta = ((90 - latDeg) * Math.PI) / 180;
  const x = -radius * Math.cos(phi) * Math.sin(theta);
  const y = radius * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

// Reusable math scratchpad outside render loop (zero GC)
const _targetWorldNormal = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _targetDir = new THREE.Vector3();
const _quatStep = new THREE.Quaternion();

export default function MarsGlobe3D({
  mode,
  initialLocationId,
  onNavigateTo2DMap,
  onNavigateToExplorer
}: MarsGlobe3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    mode === 'explorer' ? initialLocationId ?? 'olympus-mons' : null
  );
  const [hoveredLocation, setHoveredLocation] = useState<{
    loc: MarsLocation;
    x: number;
    y: number;
  } | null>(null);
  const [surfaceMode, setSurfaceMode] = useState<'viking' | 'mola'>('viking');
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(mode === 'hero');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Mutable refs for Three.js communication without re-initializing WebGL
  const selectedIdRef = useRef<string | null>(selectedId);
  selectedIdRef.current = selectedId;

  const autoRotateRef = useRef<boolean>(autoRotate);
  autoRotateRef.current = autoRotate;

  const surfaceModeRef = useRef<'viking' | 'mola'>(surfaceMode);
  surfaceModeRef.current = surfaceMode;

  const showGridRef = useRef<boolean>(showGrid);
  showGridRef.current = showGrid;

  const sceneRefs = useRef<{
    focusOnLocation?: (loc: MarsLocation) => void;
    resetCamera?: () => void;
    zoomBy?: (factor: number) => void;
    updateTextures?: (mode: 'viking' | 'mola') => void;
    updateGridVisibility?: (visible: boolean) => void;
    updateMarkerHighlights?: (activeId: string | null) => void;
  }>({});

  const selectedLocation = MARS_LOCATIONS.find((l) => l.id === selectedId) ?? null;

  useEffect(() => {
    const mount = containerRef.current;
    if (!mount) return;

    // Detect software WebGL cleanly via GPU renderer string
    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // Default view facing Tharsis / Olympus Mons / Valles Marineris / Arcadia hemisphere
    const defaultCamPos = latLonToMarsVector(16, -95, mode === 'hero' ? 2.85 : 2.95);
    camera.position.copy(defaultCamPos);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance'
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // Studio environment reflection for crisp PBR materials
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Subtle procedural starfield backdrop (Instanced / Points outside MarsGroup so background stars stay in deep space)
    const starCount = 1100;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 24 + (i % 13) * 1.4;
      const u = ((i * 7919) % 1000) / 1000;
      const v = ((i * 3571) % 1000) / 1000;
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const tint = 0.72 + (i % 5) * 0.06;
      starColors[i * 3] = tint;
      starColors[i * 3 + 1] = tint;
      starColors[i * 3 + 2] = Math.min(1, tint + 0.08);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Three-point solar + space lighting rig
    const keyLight = new THREE.DirectionalLight(0xfff1e3, 2.35);
    keyLight.position.set(5.5, 2.6, 4.2);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x4f6d9a, 0x1a1210, 0.72);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x7aa4d6, 0.55);
    rimLight.position.set(-4.5, -1.5, -4.0);
    scene.add(rimLight);

    // =========================================================================
    // SINGLE COHERENT PLANETARY PARENT GROUP (marsGroup)
    // Surface sphere + Bump relief + Lat/Lon Graticule + Arcadia boundary + ALL Markers
    // live inside this ONE group so rotation/orbit keeps every geographical feature locked!
    // =========================================================================
    const marsGroup = new THREE.Group();
    scene.add(marsGroup);

    // Load real NASA Mars Trek textures
    const textureLoader = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const vikingTex = textureLoader.load(`${import.meta.env.BASE_URL}assets/mars/mars_viking_2k.jpg`, () => {
      setIsLoaded(true);
      requestRender();
    });
    vikingTex.colorSpace = THREE.SRGBColorSpace;
    vikingTex.anisotropy = maxAniso;

    const molaTex = textureLoader.load(`${import.meta.env.BASE_URL}assets/mars/mars_mola_2k.jpg`, () => {
      requestRender();
    });
    molaTex.colorSpace = THREE.SRGBColorSpace;
    molaTex.anisotropy = maxAniso;

    const bumpTex = textureLoader.load(`${import.meta.env.BASE_URL}assets/mars/mars_bump_2k.jpg`, () => {
      requestRender();
    });
    bumpTex.anisotropy = maxAniso;

    const sphereGeo = new THREE.SphereGeometry(MARS_RADIUS, 96, 64);
    const marsMat = new THREE.MeshStandardMaterial({
      map: surfaceModeRef.current === 'viking' ? vikingTex : molaTex,
      bumpMap: bumpTex,
      bumpScale: 0.022,
      roughness: 0.88,
      metalness: 0.04
    });
    const marsMesh = new THREE.Mesh(sphereGeo, marsMat);
    marsGroup.add(marsMesh);

    // Subtle thin Martian atmospheric dust limb shell
    const atmosGeo = new THREE.SphereGeometry(MARS_RADIUS * 1.022, 64, 48);
    const atmosMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(0xd96b43) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float rim = clamp(0.62 - dot(vNormal, -vViewDir), 0.0, 1.0);
          float alpha = pow(rim, 3.0) * 0.42;
          gl_FragColor = vec4(uColor, alpha);
        }
      `
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    marsGroup.add(atmosMesh);

    // Latitude / Longitude Coordinate Graticule inside marsGroup
    const graticuleGroup = new THREE.Group();
    graticuleGroup.visible = showGridRef.current;
    const gridRadius = MARS_RADIUS * 1.004;

    const regularLineMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.16
    });
    const majorLineMat = new THREE.LineBasicMaterial({
      color: 0xe05a2b,
      transparent: true,
      opacity: 0.34
    });

    // Latitude parallels (-60, -30, 0, +30, +60)
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lon = -180; lon <= 180; lon += 4) {
        pts.push(latLonToMarsVector(lat, lon, gridRadius));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      graticuleGroup.add(new THREE.Line(lineGeo, lat === 0 ? majorLineMat : regularLineMat));
    }

    // Longitude meridians every 30°
    for (let lon = -180; lon < 180; lon += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -88; lat <= 88; lat += 4) {
        pts.push(latLonToMarsVector(lat, lon, gridRadius));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      graticuleGroup.add(new THREE.Line(lineGeo, lon === 0 ? majorLineMat : regularLineMat));
    }

    // Arcadia Planitia Study Region bounding outline (38°N–48°N, 172°E–192°E = -168°W)
    const arcadiaRectPts: THREE.Vector3[] = [];
    for (let lon = 172; lon <= 192; lon += 2) arcadiaRectPts.push(latLonToMarsVector(38, lon > 180 ? lon - 360 : lon, MARS_RADIUS * 1.006));
    for (let lat = 38; lat <= 48; lat += 1) arcadiaRectPts.push(latLonToMarsVector(lat, -168, MARS_RADIUS * 1.006));
    for (let lon = 192; lon >= 172; lon -= 2) arcadiaRectPts.push(latLonToMarsVector(48, lon > 180 ? lon - 360 : lon, MARS_RADIUS * 1.006));
    for (let lat = 48; lat >= 38; lat -= 1) arcadiaRectPts.push(latLonToMarsVector(lat, 172, MARS_RADIUS * 1.006));
    const arcadiaOutline = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arcadiaRectPts),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.72 })
    );
    marsGroup.add(arcadiaOutline);
    marsGroup.add(graticuleGroup);

    // =========================================================================
    // SURFACE MARKERS (Red = Landmarks, Green = Exploration / Landing Sites)
    // Attached directly to marsGroup so they remain locked to exact lat/lon!
    // =========================================================================
    const markersGroup = new THREE.Group();
    marsGroup.add(markersGroup);

    const clickableHitTargets: THREE.Mesh[] = [];
    const markerEntries = new Map<
      string,
      {
        pinHead: THREE.Mesh;
        ring: THREE.Mesh;
        baseColor: number;
        loc: MarsLocation;
      }
    >();

    const pinHeadGeo = new THREE.SphereGeometry(0.019, 16, 16);
    const stemGeo = new THREE.CylinderGeometry(0.0025, 0.0025, 0.026, 8);
    const ringGeo = new THREE.RingGeometry(0.024, 0.033, 24);
    const hitGeo = new THREE.SphereGeometry(0.048, 12, 12);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    for (const loc of MARS_LOCATIONS) {
      const surfacePos = latLonToMarsVector(loc.lat, loc.lon, MARS_RADIUS);
      const normal = surfacePos.clone().normalize();
      const baseColor = loc.markerCategory === 'landmark' ? 0xef4444 : 0x22c55e;

      const markerAnchor = new THREE.Group();
      markerAnchor.position.copy(surfacePos);
      // Align local +Y along outward surface normal
      markerAnchor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      const stemMat = new THREE.MeshStandardMaterial({
        color: 0xdbeafe,
        roughness: 0.4,
        metalness: 0.6
      });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.013;
      markerAnchor.add(stem);

      const headMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: loc.id === selectedIdRef.current ? 0.85 : 0.35,
        roughness: 0.3,
        metalness: 0.2
      });
      const pinHead = new THREE.Mesh(pinHeadGeo, headMat);
      pinHead.position.y = 0.028;
      markerAnchor.add(pinHead);

      const ringMat = new THREE.MeshBasicMaterial({
        color: loc.id === selectedIdRef.current ? 0xfbbf24 : baseColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: loc.id === selectedIdRef.current ? 0.95 : 0.48
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.005;
      markerAnchor.add(ring);

      const hitSphere = new THREE.Mesh(hitGeo, hitMat);
      hitSphere.position.y = 0.025;
      hitSphere.layers.set(1);
      hitSphere.userData = { locationId: loc.id };
      markerAnchor.add(hitSphere);
      clickableHitTargets.push(hitSphere);

      markersGroup.add(markerAnchor);
      markerEntries.set(loc.id, { pinHead, ring, baseColor, loc });
    }

    // OrbitControls around origin (0, 0, 0)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.65;
    controls.zoomSpeed = 0.85;
    controls.minDistance = 1.48;
    controls.maxDistance = 5.4;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;

    // Smooth camera glide state
    let focusActive = false;
    const focusTargetDir = new THREE.Vector3();
    let focusTargetDistance = 2.15;

    const cancelFocus = () => {
      focusActive = false;
    };
    controls.addEventListener('start', cancelFocus);
    controls.addEventListener('change', () => requestRender());

    const focusOnLocation = (loc: MarsLocation) => {
      marsGroup.updateMatrixWorld(true);
      const localPos = latLonToMarsVector(loc.lat, loc.lon, 1);
      _targetWorldNormal.copy(localPos).applyMatrix4(marsGroup.matrixWorld).normalize();
      focusTargetDir.copy(_targetWorldNormal);
      focusTargetDistance = Math.abs(loc.lat) > 75 ? 2.45 : 2.08;
      focusActive = true;
      setAutoRotate(false);
      autoRotateRef.current = false;
      requestRender();
    };

    const resetCamera = () => {
      focusTargetDir.copy(defaultCamPos).normalize();
      focusTargetDistance = defaultCamPos.length();
      focusActive = true;
      requestRender();
    };

    const zoomBy = (factor: number) => {
      const dist = camera.position.length();
      const nextDist = THREE.MathUtils.clamp(dist * factor, controls.minDistance, controls.maxDistance);
      camera.position.normalize().multiplyScalar(nextDist);
      controls.update();
      requestRender();
    };

    const updateTextures = (m: 'viking' | 'mola') => {
      marsMat.map = m === 'viking' ? vikingTex : molaTex;
      marsMat.needsUpdate = true;
      requestRender();
    };

    const updateGridVisibility = (visible: boolean) => {
      graticuleGroup.visible = visible;
      requestRender();
    };

    const updateMarkerHighlights = (activeId: string | null) => {
      markerEntries.forEach((entry, id) => {
        const isSel = id === activeId;
        const headMat = entry.pinHead.material as THREE.MeshStandardMaterial;
        const ringMat = entry.ring.material as THREE.MeshBasicMaterial;
        headMat.emissiveIntensity = isSel ? 1.15 : 0.35;
        entry.pinHead.scale.setScalar(isSel ? 1.45 : 1.0);
        ringMat.color.setHex(isSel ? 0xfbbf24 : entry.baseColor);
        ringMat.opacity = isSel ? 0.95 : 0.45;
        entry.ring.scale.setScalar(isSel ? 1.55 : 1.0);
      });
      requestRender();
    };

    sceneRefs.current = {
      focusOnLocation,
      resetCamera,
      zoomBy,
      updateTextures,
      updateGridVisibility,
      updateMarkerHighlights
    };

    // Raycasting for click & hover on markers
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNdc = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let lastHoverCheck = 0;

    const getCanvasNdc = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      return rect;
    };

    // Only select markers on the front-facing hemisphere of Mars relative to camera
    const pickVisibleMarker = (clientX: number, clientY: number): MarsLocation | null => {
      getCanvasNdc(clientX, clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickableHitTargets, false);
      if (hits.length === 0) return null;

      for (const hit of hits) {
        const locId = hit.object.userData?.locationId as string | undefined;
        if (!locId) continue;
        const loc = MARS_LOCATIONS.find((l) => l.id === locId);
        if (!loc) continue;
        // Hemisphere occlusion check: dot(markerNormal, toCamera) > -0.05
        const worldPos = new THREE.Vector3();
        hit.object.getWorldPosition(worldPos);
        const toCam = camera.position.clone().sub(worldPos).normalize();
        const surfNorm = worldPos.clone().normalize();
        if (surfNorm.dot(toCam) > -0.02) {
          return loc;
        }
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (moved > 6) return; // Dragged globe — do not trigger marker click
      const loc = pickVisibleMarker(e.clientX, e.clientY);
      if (loc) {
        setSelectedId(loc.id);
        updateMarkerHighlights(loc.id);
        focusOnLocation(loc);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = Date.now();
      if (now - lastHoverCheck < 45) return;
      lastHoverCheck = now;
      const loc = pickVisibleMarker(e.clientX, e.clientY);
      if (loc) {
        const rect = renderer.domElement.getBoundingClientRect();
        renderer.domElement.style.cursor = 'pointer';
        setHoveredLocation({
          loc,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredLocation(null);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // ResizeObserver for crisp layout across split panels and responsive screens
    const resizeObserver = new ResizeObserver(() => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    });
    resizeObserver.observe(mount);

    // On-demand render + software WebGL pacing
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        if (disposed) return;
        renderDirty = false;
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        let keepAnimating = false;

        // Coherent planetary spin: rotates marsGroup (sphere + textures + grid + markers together!)
        if (autoRotateRef.current && !focusActive) {
          marsGroup.rotation.y += dt * 0.085;
          keepAnimating = !isSoftwareGl;
        }

        // Smooth spherical camera focus glide
        if (focusActive) {
          const currDist = camera.position.length();
          _camDir.copy(camera.position).normalize();
          _targetDir.copy(focusTargetDir).normalize();
          const angle = _camDir.angleTo(_targetDir);
          const distDelta = Math.abs(currDist - focusTargetDistance);

          if (angle < 0.008 && distDelta < 0.01) {
            _desiredCamPos.copy(_targetDir).multiplyScalar(focusTargetDistance);
            camera.position.copy(_desiredCamPos);
            focusActive = false;
          } else {
            const alpha = 1 - Math.exp(-6.5 * dt);
            _quatStep.setFromUnitVectors(_camDir, _targetDir);
            const identityQ = new THREE.Quaternion();
            identityQ.slerp(_quatStep, alpha);
            _camDir.applyQuaternion(identityQ).normalize();
            const nextDist = THREE.MathUtils.damp(currDist, focusTargetDistance, 6.5, dt);
            camera.position.copy(_camDir).multiplyScalar(nextDist);
            keepAnimating = true;
          }
        }

        const dampingChanged = controls.update();
        if (dampingChanged && controls.enableDamping) {
          keepAnimating = true;
        }

        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty || keepAnimating) {
            requestRender();
          }
        };

        if (isSoftwareGl && keepAnimating) {
          afterDraw(done);
        } else {
          done();
        }
      });
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Initial focus if opened with a preset location in explorer mode
    if (mode === 'explorer' && initialLocationId) {
      const initLoc = MARS_LOCATIONS.find((l) => l.id === initialLocationId);
      if (initLoc) {
        updateMarkerHighlights(initLoc.id);
        focusOnLocation(initLoc);
      }
    }

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();

      sphereGeo.dispose();
      marsMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      pinHeadGeo.dispose();
      stemGeo.dispose();
      ringGeo.dispose();
      hitGeo.dispose();
      hitMat.dispose();
      regularLineMat.dispose();
      majorLineMat.dispose();
      vikingTex.dispose();
      molaTex.dispose();
      bumpTex.dispose();
      renderer.dispose();
    };
  }, [mode, initialLocationId]);

  // Sync React controls with live Three.js refs
  useEffect(() => {
    sceneRefs.current.updateTextures?.(surfaceMode);
  }, [surfaceMode]);

  useEffect(() => {
    sceneRefs.current.updateGridVisibility?.(showGrid);
  }, [showGrid]);

  useEffect(() => {
    sceneRefs.current.updateMarkerHighlights?.(selectedId);
  }, [selectedId]);

  const handleSelectLocation = (loc: MarsLocation) => {
    setSelectedId(loc.id);
    sceneRefs.current.focusOnLocation?.(loc);
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#07090E] ${
        mode === 'explorer' ? 'h-[calc(100vh-61px)] min-h-[620px]' : 'h-[520px] lg:h-[620px] rounded-xl border border-white/10'
      }`}
    >
      {/* Dedicated WebGL Mount Container (isolated from React HUD siblings) */}
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D Mars globe"
      />

      {/* Loading / Context Lost Fallback */}
      {(!isLoaded || contextLost) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#07090E]/90 z-20">
          <div className="text-center space-y-2 px-4">
            <Globe className="h-8 w-8 text-[#E05A2B] mx-auto" />
            <p className="text-sm font-medium text-slate-200">
              {contextLost
                ? 'WebGL graphics context paused — restoring planetary renderer...'
                : 'Loading NASA Mars Viking & MOLA surface textures...'}
            </p>
          </div>
        </div>
      )}

      {/* Hover Tooltip on 3D Marker */}
      {hoveredLocation && (
        <div
          className="pointer-events-none absolute z-20 rounded-md border border-white/15 bg-[#0B0E15]/95 px-2.5 py-1.5 text-xs shadow-lg"
          style={{
            left: Math.min(hoveredLocation.x + 14, (containerRef.current?.clientWidth || 600) - 210),
            top: Math.max(hoveredLocation.y - 36, 12)
          }}
        >
          <div className="flex items-center gap-2 font-semibold text-white">
            <span
              className={`h-2 w-2 rounded-full ${
                hoveredLocation.loc.markerCategory === 'landmark' ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            />
            <span>{hoveredLocation.loc.name}</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 tabular-nums mt-0.5">
            {Math.abs(hoveredLocation.loc.lat).toFixed(2)}°{hoveredLocation.loc.lat >= 0 ? 'N' : 'S'},{' '}
            {hoveredLocation.loc.lonEast360.toFixed(1)}°E · {hoveredLocation.loc.elevationKm >= 0 ? '+' : ''}
            {hoveredLocation.loc.elevationKm} km
          </div>
        </div>
      )}

      {/* Top-Left Minimal Legend & Surface Attribution (Non-obstructive) */}
      <div className="pointer-events-auto absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-[300px]">
        <div className="rounded-lg border border-white/12 bg-[#0B0E15]/90 px-3.5 py-2.5 text-xs">
          <div className="font-display font-semibold text-white text-xs tracking-wide mb-2">
            Planetary Marker Legend
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
              <span>Major Geological Landmarks</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>NASA Landing & Study Sites</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm border border-sky-400 shrink-0" />
              <span>Arcadia Planitia 2D Study Area</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Location Scientific Side Panel (Leaves Mars clearly visible!) */}
      {selectedLocation && (
        <aside
          aria-label="Selected Mars location details"
          className={`pointer-events-auto absolute z-30 flex flex-col rounded-lg border border-white/12 bg-[#0B0E15]/96 shadow-2xl ${
            mode === 'explorer'
              ? 'top-4 right-4 bottom-24 w-[calc(100%-2rem)] sm:w-[390px]'
              : 'top-4 right-4 bottom-20 w-[calc(100%-2rem)] sm:w-[340px]'
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3.5 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    selectedLocation.markerCategory === 'landmark' ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                />
                <span className="truncate">{selectedLocation.type}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-white mt-0.5 truncate">
                {selectedLocation.name}
              </h3>
            </div>
            <button
              type="button"
              aria-label="Close location details"
              onClick={() => setSelectedId(null)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
            {/* Real NASA Photo */}
            <figure className="space-y-1.5">
              <div className="overflow-hidden rounded-md border border-white/10 bg-[#121723] aspect-[16/10]">
                <img
                  src={selectedLocation.imageUrl}
                  alt={selectedLocation.name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <figcaption className="text-[11px] text-slate-400 leading-snug">
                {selectedLocation.imageCaption}{' '}
                <a
                  href={selectedLocation.imageSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#F4845F] hover:underline inline-flex items-center gap-0.5"
                >
                  {selectedLocation.imageSourceLabel}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </figcaption>
            </figure>

            {/* Coordinates & Elevation */}
            <div className="grid grid-cols-3 gap-2 rounded-md border border-white/10 bg-[#111622] p-2.5 text-xs">
              <div>
                <div className="text-slate-400 text-[11px]">Latitude</div>
                <div className="font-mono font-semibold text-white tabular-nums mt-0.5">
                  {Math.abs(selectedLocation.lat).toFixed(2)}°{selectedLocation.lat >= 0 ? 'N' : 'S'}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Longitude</div>
                <div className="font-mono font-semibold text-white tabular-nums mt-0.5">
                  {selectedLocation.lonEast360.toFixed(1)}°E
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">MOLA Datum</div>
                <div className="font-mono font-semibold text-[#F4845F] tabular-nums mt-0.5">
                  {selectedLocation.elevationKm >= 0 ? '+' : ''}
                  {selectedLocation.elevationKm} km
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-200 font-medium">Elevation reference:</strong>{' '}
              {selectedLocation.elevationNote}
            </p>

            <div>
              <h4 className="font-display text-xs font-semibold text-slate-200 mb-1">Overview</h4>
              <p className="text-slate-300 text-xs leading-relaxed">{selectedLocation.summary}</p>
            </div>

            <div>
              <h4 className="font-display text-xs font-semibold text-slate-200 mb-1">
                Geological Characteristics
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">{selectedLocation.geology}</p>
            </div>

            <div>
              <h4 className="font-display text-xs font-semibold text-slate-200 mb-1.5">
                Key Scientific Facts
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                {selectedLocation.facts.map((fact, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {fact}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-display text-xs font-semibold text-slate-200 mb-1">
                Scientific Importance
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                {selectedLocation.scientificImportance}
              </p>
            </div>

            <div>
              <h4 className="font-display text-xs font-semibold text-slate-200 mb-1">
                Future NASA Exploration Relevance
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                {selectedLocation.futureExploration}
              </p>
            </div>

            {/* Action links */}
            {selectedLocation.id === 'arcadia-planitia' && onNavigateTo2DMap && (
              <button
                type="button"
                onClick={onNavigateTo2DMap}
                className="w-full rounded-md bg-[#E05A2B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#c94c21] transition-colors cursor-pointer"
              >
                Open Arcadia Planitia 2D Expedition Map
              </button>
            )}

            {mode === 'hero' && onNavigateToExplorer && (
              <button
                type="button"
                onClick={() => onNavigateToExplorer(selectedLocation.id)}
                className="w-full rounded-md border border-white/15 bg-[#161C2B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1E263A] transition-colors cursor-pointer"
              >
                Open Full 3D Mars Explorer
              </button>
            )}

            <div className="pt-2 border-t border-white/10 space-y-1">
              <div className="text-[11px] font-medium text-slate-400">Scientific Sources</div>
              <div className="flex flex-col gap-1">
                {selectedLocation.sourceLinks.map((src) => (
                  <a
                    key={src.url}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#F4845F] hover:underline"
                  >
                    <span>{src.label}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Collapsible Unified Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center w-[min(940px,calc(100%-1.5rem))]">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="mb-1.5 inline-flex items-center gap-1.5 rounded-t-md border border-white/12 bg-[#0B0E15]/95 px-3 py-1 text-[11px] font-medium text-slate-300 hover:text-white cursor-pointer"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Show Globe Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="w-full rounded-lg border border-white/12 bg-[#0B0E15]/95 p-2.5 shadow-2xl space-y-2">
            {/* Primary controls row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Surface dataset toggle */}
                <div className="inline-flex rounded-md border border-white/10 bg-[#121723] p-0.5">
                  <button
                    type="button"
                    onClick={() => setSurfaceMode('viking')}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      surfaceMode === 'viking'
                        ? 'bg-[#E05A2B] text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Viking Surface</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurfaceMode('mola')}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      surfaceMode === 'mola'
                        ? 'bg-[#E05A2B] text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Mountain className="h-3.5 w-3.5" />
                    <span>MOLA Elevation</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGrid((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    showGrid
                      ? 'border-[#E05A2B]/60 bg-[#E05A2B]/15 text-white'
                      : 'border-white/10 bg-[#121723] text-slate-300 hover:text-white'
                  }`}
                >
                  <Grid className="h-3.5 w-3.5" />
                  <span>Lat/Lon Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAutoRotate((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    autoRotate
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/10 bg-[#121723] text-slate-300 hover:text-white'
                  }`}
                >
                  {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{autoRotate ? 'Spin On' : 'Spin Paused'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => sceneRefs.current.zoomBy?.(0.82)}
                  className="inline-flex items-center justify-center rounded-md border border-white/10 bg-[#121723] p-1.5 text-slate-300 hover:text-white cursor-pointer"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => sceneRefs.current.zoomBy?.(1.22)}
                  className="inline-flex items-center justify-center rounded-md border border-white/10 bg-[#121723] p-1.5 text-slate-300 hover:text-white cursor-pointer"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sceneRefs.current.resetCamera?.();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#121723] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1A2133] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset View</span>
                </button>
              </div>
            </div>

            {/* Quick Location Jump Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 shrink-0 mr-1">
                <Compass className="h-3 w-3" />
                Focus:
              </span>
              {MARS_LOCATIONS.map((loc) => {
                const isSelected = loc.id === selectedId;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-white text-[#07090E]'
                        : 'bg-[#121723] text-slate-300 hover:bg-[#1B2234] hover:text-white'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        loc.markerCategory === 'landmark' ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span>{loc.name.replace(' (Viking 1 Site)', '').replace(' (InSight Site)', '').replace(' (Spirit Site)', '').replace(' (Opportunity Site)', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
