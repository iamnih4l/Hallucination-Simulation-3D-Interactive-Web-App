/* ============================================
   COMPARISON — Overlay Mode
   ============================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { comparisons } from './scenarios.js';

export class ComparisonOverlay {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;
    this.time = 0;
    this.connectionLines = [];

    this._init();
    this._buildComparisonCards();
  }

  _init() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a0f, 1);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.01);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    this.camera.position.set(0, 0, 30);
    this.camera.lookAt(0, 0, 0);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.enablePan = true;
    this.controls.maxDistance = 60;
    this.controls.minDistance = 10;

    // Ambient
    this.scene.add(new THREE.AmbientLight(0x334466, 0.5));

    // AI side (left) — simple neural net
    this._buildMiniNetwork(-8, 0x2299ff);
    // Brain side (right) — simple brain
    this._buildMiniBrain(8, 0xa855f7);
    // Connection lines between them
    this._buildConnections();
    // Particles
    this._buildParticles();
  }

  _buildMiniNetwork(offsetX, color) {
    const geo = new THREE.SphereGeometry(0.25, 12, 12);
    const layers = [3, 5, 5, 3];
    const spacing = 3;
    layers.forEach((count, li) => {
      const x = offsetX + (li - 1.5) * spacing;
      for (let ni = 0; ni < count; ni++) {
        const y = (ni - (count - 1) / 2) * 1.5;
        const mat = new THREE.MeshStandardMaterial({
          color, emissive: color, emissiveIntensity: 0.3,
          transparent: true, opacity: 0.7, metalness: 0.8, roughness: 0.2,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, 0);
        this.scene.add(mesh);
      }
    });

    // Label
    const label = this._createTextSprite('AI Network', offsetX, -5.5);
    this.scene.add(label);
  }

  _buildMiniBrain(offsetX, color) {
    const geo = new THREE.SphereGeometry(1, 20, 20);
    const parts = [
      { pos: [offsetX - 1.5, 0, 0], scale: [2, 1.8, 1.8] },
      { pos: [offsetX + 1.5, 0, 0], scale: [2, 1.8, 1.8] },
      { pos: [offsetX, -2, -1], scale: [1.5, 1, 1] },
    ];
    parts.forEach(p => {
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.15,
        transparent: true, opacity: 0.3, metalness: 0.3, roughness: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...p.pos);
      mesh.scale.set(...p.scale);
      this.scene.add(mesh);
    });

    const label = this._createTextSprite('Human Brain', offsetX, -5.5);
    this.scene.add(label);
  }

  _createTextSprite(text, x, y) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#888899';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 40);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8 });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, 0);
    sprite.scale.set(6, 1.5, 1);
    return sprite;
  }

  _buildConnections() {
    const pairs = [
      { from: [-4, 3], to: [4, 3] },
      { from: [-4, 1], to: [4, 1] },
      { from: [-4, -1], to: [4, -1] },
      { from: [-4, -3], to: [4, -3] },
    ];
    pairs.forEach((p, i) => {
      const mat = new THREE.LineDashedMaterial({
        color: i < 2 ? 0x00e5cc : 0xff8833,
        dashSize: 0.3, gapSize: 0.2,
        transparent: true, opacity: 0.3,
      });
      const mid = [(p.from[0] + p.to[0]) / 2, (p.from[1] + p.to[1]) / 2 + 1];
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(p.from[0], p.from[1], 0),
        new THREE.Vector3(mid[0], mid[1], 2),
        new THREE.Vector3(p.to[0], p.to[1], 0),
      );
      const points = curve.getPoints(30);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      this.scene.add(line);
      this.connectionLines.push(line);
    });
  }

  _buildParticles() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.06, color: 0x556677, transparent: true, opacity: 0.25, sizeAttenuation: true,
    });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  _buildComparisonCards() {
    const container = document.getElementById('comparison-cards');
    container.innerHTML = '';
    comparisons.forEach(c => {
      const card = document.createElement('div');
      card.className = 'comparison-card';
      card.innerHTML = `
        <div class="cc-label">${c.label}</div>
        <div class="cc-ai">${c.ai}</div>
        <div class="cc-brain">${c.brain}</div>
      `;
      container.appendChild(card);
    });
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setActive(active) {
    this.active = active;
  }

  update(dt) {
    if (!this.active) return;
    this.time += dt;

    // Animate connection opacity
    this.connectionLines.forEach((line, i) => {
      line.material.opacity = 0.2 + Math.sin(this.time * 2 + i * 1.5) * 0.15;
    });

    // Gentle auto rotation and damping
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
