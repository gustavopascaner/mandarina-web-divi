/* Mandarina · escenas 3D (Three.js)
   El isotipo de Mandarina —una rodaja con 8 gajos en espiral— construido en 3D.
   - Hero: sigue al puntero, el gajo bajo el mouse se levanta y con un clic la rodaja se desarma y se vuelve a armar.
   - Proceso: la rodaja se arma con el scroll.
   Se pausa sola cuando no está en pantalla. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SEGMENTS = 8;
const R_IN = 1.0;   // radio interno (donde terminan los gajos)
const R_OUT = 1.17; // radio de la cáscara

/* ---------- Geometría ---------- */

function petalShape(i) {
  const step = (Math.PI * 2) / SEGMENTS;
  const span = step - 0.2;
  const twist = 1.05;
  const r0 = 0.07, R = R_IN - 0.045;
  const theta = i * step;
  const left = [], right = [];
  const N = 28;
  for (let k = 0; k <= N; k++) {
    const s = k / N;
    const r = r0 + (R - r0) * s;
    const fl = theta + twist * Math.pow(s, 1.25);
    const fr = fl + span * Math.pow(s, 0.5);
    left.push(new THREE.Vector2(Math.cos(fl) * r, Math.sin(fl) * r));
    right.push(new THREE.Vector2(Math.cos(fr) * r, Math.sin(fr) * r));
  }
  const shape = new THREE.Shape(left);
  // borde exterior curvo, apenas abombado
  const a0 = theta + twist, a1 = a0 + span;
  for (let k = 1; k < 16; k++) {
    const a = a0 + (a1 - a0) * (k / 16);
    shape.lineTo(Math.cos(a) * R, Math.sin(a) * R);
  }
  for (let k = right.length - 1; k >= 0; k--) shape.lineTo(right[k].x, right[k].y);
  return shape;
}

function centered(geo) {
  geo.computeBoundingBox();
  const c = new THREE.Vector3();
  geo.boundingBox.getCenter(c);
  geo.translate(-c.x, -c.y, -c.z);
  return c;
}

function buildEnvironment(renderer) {
  // Estudio simple hecho a mano para los reflejos (evita depender de addons)
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: 0x1a1210, side: THREE.BackSide }));
  env.add(room);
  const panel = (color, intensity, w, h, pos, look) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...look); env.add(m);
  };
  panel(0xffffff, 6, 5, 3, [-3, 4, 4], [0, 0, 0]);
  panel(0xffc58a, 4, 4, 4, [5, 1, 2], [0, 0, 0]);
  panel(0xff7300, 3, 6, 2, [0, -4, -3], [0, 0, 0]);
  panel(0xffffff, 2, 2, 6, [-5, 0, -2], [0, 0, 0]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.035).texture;
  pmrem.dispose();
  return tex;
}

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,200,140,.8)');
  grd.addColorStop(1, 'rgba(255,115,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function rollFlight(dir) {
  return {
    dir,
    dist: 0.55 + Math.random() * 0.6,
    z: -0.8 + Math.random() * 1.6,
    rot: new THREE.Vector3((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 6),
    delay: Math.random() * 600,
  };
}

/* ---------- Escena ---------- */

function mountMandarina(canvas, opts) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.classList.add('mnd-no-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = buildEnvironment(renderer);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  const key = new THREE.DirectionalLight(0xfff1e0, 2.2); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0xff7300, 30, 12); rim.position.set(2.5, -1.5, -2); scene.add(rim);
  const fill = new THREE.PointLight(0xffb547, 10, 10); fill.position.set(3, 2, 3); scene.add(fill);
  scene.add(new THREE.AmbientLight(0x331a0a, 0.6));

  const root = new THREE.Group();   // posición en pantalla
  const tilt = new THREE.Group();   // inclinación por puntero
  const fruit = new THREE.Group();  // giro lento
  root.add(tilt); tilt.add(fruit); scene.add(root);

  const pulpMat = new THREE.MeshPhysicalMaterial({
    color: 0xff8410, roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.18,
    sheen: 1, sheenColor: new THREE.Color(0xffc27a), sheenRoughness: 0.4,
    emissive: 0xff5a00, emissiveIntensity: 0.18,
  });
  const peelMat = new THREE.MeshPhysicalMaterial({ color: 0xff7300, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3, emissive: 0xc94400, emissiveIntensity: 0.12 });
  const pithMat = new THREE.MeshStandardMaterial({ color: 0xfff1e2, roughness: 0.7, emissive: 0xffd2a8, emissiveIntensity: 0.35 });
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x5c1d00, roughness: 0.6, emissive: 0xff5a00, emissiveIntensity: 0.6 });

  const pieces = [];
  const extrude = { depth: 0.2, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.045, bevelSegments: 5, curveSegments: 24 };

  for (let i = 0; i < SEGMENTS; i++) {
    const geo = new THREE.ExtrudeGeometry(petalShape(i), extrude);
    const c = centered(geo);
    const mesh = new THREE.Mesh(geo, pulpMat);
    mesh.position.copy(c);
    const dir = new THREE.Vector2(c.x, c.y).normalize();
    pieces.push({ mesh, home: c.clone(), dir, flight: rollFlight(dir), lift: 0, isPetal: true });
    fruit.add(mesh);
  }

  // Cáscara: dos medias lunas para que también vuelen
  for (let h = 0; h < 2; h++) {
    const s = new THREE.Shape();
    const a0 = h * Math.PI, a1 = a0 + Math.PI;
    s.absarc(0, 0, R_OUT, a0, a1, false);
    s.absarc(0, 0, R_IN, a1, a0, true);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 5, curveSegments: 64 });
    geo.translate(0, 0, -0.05);
    const c = centered(geo);
    const mesh = new THREE.Mesh(geo, peelMat);
    mesh.position.copy(c);
    const dir = new THREE.Vector2(c.x, c.y).normalize();
    pieces.push({ mesh, home: c.clone(), dir, flight: rollFlight(dir), lift: 0 });
    fruit.add(mesh);
  }

  // Fondo blanco (albedo) que se ve entre gajos, como en el logo
  const pith = new THREE.Mesh(new THREE.CylinderGeometry(R_IN + 0.01, R_IN + 0.01, 0.12, 64), pithMat);
  pith.rotation.x = Math.PI / 2; pith.position.z = 0.0;
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 24), coreMat);
  core.position.z = 0.2;
  const back = new THREE.Group(); back.add(pith, core); fruit.add(back);
  pieces.push({ mesh: back, home: new THREE.Vector3(), dir: new THREE.Vector2(0, 0), flight: { ...rollFlight(new THREE.Vector2()), dist: 0, z: -1.2 }, lift: 0 });

  // Partículas de jugo
  const COUNT = opts.particles ?? 420;
  const pos = new Float32Array(COUNT * 3), seeds = [];
  for (let i = 0; i < COUNT; i++) {
    seeds.push({ a: Math.random() * Math.PI * 2, r: 1.5 + Math.random() * 2.6, y: (Math.random() - 0.5) * 4, s: 0.05 + Math.random() * 0.18, z: (Math.random() - 0.5) * 3 });
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dots = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.05, map: dotTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffa040 }));
  root.add(dots);

  /* ----- estado ----- */
  const state = { tx: 0, ty: 0, x: 0, y: 0, blastAt: -1e9, assembled: opts.mode === 'scroll' ? 0 : 1, intro: 0 };
  const pointer = new THREE.Vector2(-9, -9);
  const ray = new THREE.Raycaster();
  let hovered = null;

  function layout() {
    const box = canvas.getBoundingClientRect();
    const w = box.width, h = box.height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visW = visH * camera.aspect;
    const l = opts.layout(w, h, visW, visH);
    root.position.set(l.x, l.y, 0);
    root.scale.setScalar(l.scale);
  }

  const BLAST_OUT = 450, BLAST_HOLD = 300, BLAST_RETURN = 3200;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function blastLevel(p, ms) {
    const e = ms - state.blastAt;
    if (e < 0) return 0;
    if (e < BLAST_OUT) return 1 - Math.pow(1 - e / BLAST_OUT, 4);
    const back = (e - BLAST_OUT - BLAST_HOLD - p.flight.delay) / BLAST_RETURN;
    if (back <= 0) return 1;
    if (back >= 1) return 0;
    return 1 - easeInOut(back);
  }

  function draw(ms) {
    const t = ms / 1000;
    state.x += (state.tx - state.x) * 0.06;
    state.y += (state.ty - state.y) * 0.06;
    if (state.start == null) state.start = ms;
    state.intro = reduce ? 1 : Math.min(1, (ms - state.start) / 1800);

    const baseY = opts.mode === 'scroll' ? 0 : -0.38, baseX = opts.mode === 'scroll' ? -0.35 + state.assembled * 0.35 : -0.18;
    tilt.rotation.y = baseY + state.x * 0.55;
    tilt.rotation.x = baseX - state.y * 0.45;
    fruit.rotation.z = (reduce ? 0 : t * 0.12) + (opts.mode === 'scroll' ? state.assembled * Math.PI * 1.2 : 0);
    if (opts.mode !== 'scroll') {
      fruit.position.y = reduce ? 0 : Math.sin(t * 0.9) * 0.05;
      const k = easeInOut(state.intro);
      root.rotation.set((1 - k) * -0.9, (1 - k) * 0.6, 0);
    }

    // gajo bajo el puntero
    if (opts.mode !== 'scroll') {
      ray.setFromCamera(pointer, camera);
      const hits = ray.intersectObjects(pieces.filter((p) => p.isPetal).map((p) => p.mesh), false);
      hovered = hits.length ? hits[0].object : null;
      canvas.style.cursor = hovered ? 'pointer' : '';
    }

    for (const p of pieces) {
      const blast = opts.mode === 'scroll' ? 1 - state.assembled : Math.max(blastLevel(p, ms), 1 - easeInOut(state.intro));
      p.lift += ((hovered === p.mesh ? 1 : 0) - p.lift) * 0.12;
      const f = p.flight;
      const d = blast * f.dist;
      p.mesh.position.set(
        p.home.x + p.dir.x * (d + p.lift * 0.08),
        p.home.y + p.dir.y * (d + p.lift * 0.08),
        p.home.z + blast * f.z + p.lift * 0.28
      );
      p.mesh.rotation.set(blast * f.rot.x, blast * f.rot.y, blast * f.rot.z);
    }

    // partículas en espiral
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const a = s.a + t * s.s;
      const burst = opts.mode === 'scroll' ? 0 : Math.max(0, 1 - (ms - state.blastAt) / 1600) * 1.4;
      arr[i * 3] = Math.cos(a) * (s.r + burst);
      arr[i * 3 + 1] = s.y + Math.sin(t * 0.4 + s.a) * 0.15;
      arr[i * 3 + 2] = Math.sin(a) * (s.r + burst) * 0.6 + s.z * 0.3 - 1;
    }
    pGeo.attributes.position.needsUpdate = true;

    rim.intensity = 30 + Math.sin(t * 1.3) * 6;
    renderer.render(scene, camera);
  }

  /* ----- eventos ----- */
  const target = opts.eventTarget || canvas;
  target.addEventListener('pointermove', (e) => {
    const b = canvas.getBoundingClientRect();
    const nx = ((e.clientX - b.left) / b.width) * 2 - 1;
    const ny = ((e.clientY - b.top) / b.height) * 2 - 1;
    state.tx = nx; state.ty = ny;
    pointer.set(nx, -ny);
  }, { passive: true });
  target.addEventListener('pointerleave', () => { state.tx = 0; state.ty = 0; pointer.set(-9, -9); });

  if (opts.mode !== 'scroll') {
    target.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      const now = performance.now();
      if (now - state.blastAt < BLAST_OUT + BLAST_HOLD) return;
      pieces.forEach((p) => { p.flight = { ...rollFlight(p.dir), ...(p.dir.lengthSq() ? {} : { dist: 0, z: -1.2 }) }; });
      state.blastAt = now;
    });
  }

  if (opts.mode === 'scroll') {
    const section = opts.scrollSection;
    const onScroll = () => {
      const b = section.getBoundingClientRect();
      const total = b.height - innerHeight;
      const p = Math.min(1, Math.max(0, -b.top / total));
      state.assembled = Math.min(1, p / 0.8);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----- loop con pausa fuera de pantalla ----- */
  let visible = false, raf = 0;
  const loop = (ms) => { draw(ms); raf = visible ? requestAnimationFrame(loop) : 0; };
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  }, { rootMargin: '100px' }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) visible = false; });

  new ResizeObserver(layout).observe(canvas);
  layout();
}

/* ---------- Montaje ---------- */

const hero = document.querySelector('[data-mnd-3d="hero"]');
if (hero) {
  mountMandarina(hero, {
    eventTarget: hero.closest('.mnd-hero'),
    layout: hero.dataset.layout === 'landing'
      // landing: la rodaja queda de fondo, arriba a la derecha, para no tapar el video
      ? (w, h, vw, vh) => {
        // en píxeles: centro y radio de la rodaja, pegada a la esquina superior derecha
        const px = vh / h;
        const r = w > 900 ? Math.min(170, w * 0.12) : 85;
        // en celular va asomando por la izquierda, detrás del texto, para no tapar el menú
        const cx = w > 900 ? w - r * 0.75 : 4, cy = w > 900 ? 150 + r * 0.4 : 330;
        return { x: (cx - w / 2) * px, y: (h / 2 - cy) * px, scale: (r * px) / R_OUT };
      }
      : (w, h, vw, vh) => (w > 900
      ? { x: vw * 0.25, y: 0, scale: Math.min(1.35, vh * 0.2, vw * 0.15) }
      : { x: 0, y: vh * 0.25, scale: Math.min(0.9, vw * 0.24) }),
  });
}

const proc = document.querySelector('[data-mnd-3d="process"]');
if (proc) {
  mountMandarina(proc, {
    mode: 'scroll',
    particles: 260,
    scrollSection: proc.closest('.mnd-process-track'),
    layout: (w, h, vw, vh) => (w > 900
      ? { x: -vw * 0.25, y: 0, scale: Math.min(1.3, vh * 0.2, vw * 0.14) }
      : { x: 0, y: vh * 0.27, scale: Math.min(0.8, vw * 0.25) }),
  });
}
