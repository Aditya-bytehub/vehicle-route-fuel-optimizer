// 3D hero scene — vanilla Three.js, no framework.
// Particle network + glowing wireframe core + animated route arcs.

(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050608, 8, 25);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 12);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene.add(new THREE.AmbientLight(0xffffff, 0.2));

  // --- Helpers ---
  function randomInSphere(radius, count) {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * Math.cbrt(Math.random());
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }

  // --- Cyan particle field ---
  const PARTICLE_COUNT = 1800;
  const SPHERE_RADIUS = 9;
  const cyanPositions = randomInSphere(SPHERE_RADIUS, PARTICLE_COUNT);
  const cyanGeom = new THREE.BufferGeometry();
  cyanGeom.setAttribute('position', new THREE.BufferAttribute(cyanPositions, 3));
  const cyanMat = new THREE.PointsMaterial({
    color: 0x22d3ee, size: 0.035, sizeAttenuation: true,
    transparent: true, opacity: 0.7, depthWrite: false,
  });
  const cyanPoints = new THREE.Points(cyanGeom, cyanMat);
  scene.add(cyanPoints);

  // --- Ember particles (outer shell) ---
  const emberPositions = new Float32Array(300 * 3);
  for (let i = 0; i < 300; i++) {
    const r = 4 + Math.random() * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    emberPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    emberPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    emberPositions[i * 3 + 2] = r * Math.cos(phi);
  }
  const emberGeom = new THREE.BufferGeometry();
  emberGeom.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
  const emberMat = new THREE.PointsMaterial({
    color: 0xff6b35, size: 0.06, sizeAttenuation: true,
    transparent: true, opacity: 0.85, depthWrite: false,
  });
  const emberPoints = new THREE.Points(emberGeom, emberMat);
  scene.add(emberPoints);

  // --- Connection lines ---
  const MAX_LINK_DIST = 1.6;
  const linkNodes = [];
  const linkPos = randomInSphere(SPHERE_RADIUS * 0.7, 120);
  for (let i = 0; i < 120; i++) {
    linkNodes.push(new THREE.Vector3(linkPos[i * 3], linkPos[i * 3 + 1], linkPos[i * 3 + 2]));
  }
  const linePositions = [];
  for (let i = 0; i < linkNodes.length; i++) {
    for (let j = i + 1; j < linkNodes.length; j++) {
      if (linkNodes[i].distanceTo(linkNodes[j]) < MAX_LINK_DIST) {
        linePositions.push(linkNodes[i].x, linkNodes[i].y, linkNodes[i].z);
        linePositions.push(linkNodes[j].x, linkNodes[j].y, linkNodes[j].z);
      }
    }
  }
  const lineGeom = new THREE.BufferGeometry();
  lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.15 });
  const lineSegments = new THREE.LineSegments(lineGeom, lineMat);
  const lineGroup = new THREE.Group();
  lineGroup.add(lineSegments);
  scene.add(lineGroup);

  // --- Central wireframe core ---
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const outerGeom = new THREE.IcosahedronGeometry(2.2, 1);
  const outerMat = new THREE.MeshBasicMaterial({ color: 0xff6b35, wireframe: true, transparent: true, opacity: 0.4 });
  const outerMesh = new THREE.Mesh(outerGeom, outerMat);
  coreGroup.add(outerMesh);

  const innerGeom = new THREE.IcosahedronGeometry(1.5, 0);
  const innerMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.3 });
  const innerMesh = new THREE.Mesh(innerGeom, innerMat);
  coreGroup.add(innerMesh);

  const glowGeom = new THREE.SphereGeometry(0.8, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6b35, transparent: true, opacity: 0.15 });
  const glowMesh = new THREE.Mesh(glowGeom, glowMat);
  coreGroup.add(glowMesh);

  const coreLight = new THREE.PointLight(0xff6b35, 2, 10);
  coreGroup.add(coreLight);

  // --- Route arcs (nearest-neighbor visualization) ---
  const arcGroup = new THREE.Group();
  scene.add(arcGroup);

  const arcStops = 6;
  const arcRadius = 3.5;
  const arcPoints = [];
  for (let i = 0; i < arcStops; i++) {
    const angle = (i / arcStops) * Math.PI * 2;
    arcPoints.push(new THREE.Vector3(
      Math.cos(angle) * arcRadius,
      (Math.random() - 0.5) * 1.5,
      Math.sin(angle) * arcRadius
    ));
  }
  // nearest-neighbor ordering
  const ordered = [arcPoints[0]];
  const remaining = arcPoints.slice(1);
  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((p, idx) => {
      const d = last.distanceTo(p);
      if (d < nearestDist) { nearestDist = d; nearestIdx = idx; }
    });
    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  }
  ordered.push(ordered[0]);

  for (let i = 0; i < ordered.length - 1; i++) {
    const start = ordered[i];
    const end = ordered[i + 1];
    const mid = start.clone().add(end).multiplyScalar(0.5);
    mid.y += 1.2;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts = curve.getPoints(20);
    const positions = new Float32Array(pts.length * 3);
    pts.forEach((p, idx) => {
      positions[idx * 3] = p.x;
      positions[idx * 3 + 1] = p.y;
      positions[idx * 3 + 2] = p.z;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const m = new THREE.LineBasicMaterial({ color: 0xff6b35, transparent: true, opacity: 0.6 });
    arcGroup.add(new THREE.Line(g, m));
  }

  // --- Mouse interaction ---
  let mouseX = 0, mouseY = 0;
  let targetRotX = 0, targetRotY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    targetRotY = mouseX * 0.15;
    targetRotX = -mouseY * 0.1;
  });

  // --- Resize ---
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- Animation loop ---
  let currentRotX = 0, currentRotY = 0;
  function animate() {
    requestAnimationFrame(animate);
    const t = performance.now() * 0.001;

    cyanPoints.rotation.y = t * 0.04;
    cyanPoints.rotation.x = Math.sin(t * 0.15) * 0.1;

    emberPoints.rotation.y = -t * 0.06;
    emberPoints.rotation.z = t * 0.02;

    lineGroup.rotation.y = t * 0.03;
    lineGroup.rotation.x = Math.sin(t * 0.1) * 0.15;

    outerMesh.rotation.x = t * 0.15;
    outerMesh.rotation.y = t * 0.2;

    innerMesh.rotation.x = -t * 0.25;
    innerMesh.rotation.y = -t * 0.18;
    const s = 1 + Math.sin(t * 1.5) * 0.04;
    innerMesh.scale.setScalar(s);

    arcGroup.rotation.y = t * 0.1;

    // Smooth mouse-following rotation on the whole scene
    currentRotY += (targetRotY - currentRotY) * 0.05;
    currentRotX += (targetRotX - currentRotX) * 0.05;
    scene.rotation.y = currentRotY;
    scene.rotation.x = currentRotX;

    renderer.render(scene, camera);
  }
  animate();
})();
