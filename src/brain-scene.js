/* ============================================
   BRAIN SCENE — 3D Human Brain Visualization
   ============================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class BrainScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.regions = [];
    this.neurons = [];
    this.signals = [];
    this.imagined = [];
    this.hallucinationLevel = 0;
    this.targetHallucinationLevel = 0;
    this.playing = false;
    this.time = 0;
    this.simProgress = 0;
    this.activeScenario = null;
    this.params = { stress: 0, fatigue: 0, sensory: 100 };
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this._init();
  }

  _init() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a0f, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.6;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.006);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    this.camera.position.set(0, 3, 18);
    this.camera.lookAt(0, 0, 0);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.enablePan = true;
    this.controls.maxDistance = 40;
    this.controls.minDistance = 4;

    // Lights
    const ambient = new THREE.AmbientLight(0x334466, 1.0);
    this.scene.add(ambient);

    const mainLight = new THREE.PointLight(0xa855f7, 3, 80);
    mainLight.position.set(8, 10, 10);
    this.scene.add(mainLight);

    const fillLight = new THREE.PointLight(0x22d97c, 1.5, 60);
    fillLight.position.set(-8, -5, 8);
    this.scene.add(fillLight);

    this.hallucinationLight = new THREE.PointLight(0xff4466, 0, 60);
    this.hallucinationLight.position.set(0, 0, 5);
    this.scene.add(this.hallucinationLight);

    this._buildBrain();
    this._buildNeurons();
    this._buildSignals();
    this._buildImaginedObjects();
    this._buildParticles();
  }

  _buildBrain() {
    // Brain structure: major regions as translucent shapes
    const regionData = [
      { name: 'Left Hemisphere', pos: [-2.5, 0, 0], scale: [3.8, 3.2, 3.5], color: 0x6c3fa0, label: 'Left Hemisphere', desc: 'Controls right side of body, language, logic' },
      { name: 'Right Hemisphere', pos: [2.5, 0, 0], scale: [3.8, 3.2, 3.5], color: 0x7c4fb0, label: 'Right Hemisphere', desc: 'Controls left side of body, creativity, spatial awareness' },
      { name: 'Prefrontal Cortex', pos: [0, 1.5, 3], scale: [2.5, 1.5, 1.5], color: 0x4da6ff, label: 'Prefrontal Cortex', desc: 'Decision making, working memory, personality' },
      { name: 'Visual Cortex', pos: [0, -0.5, -3.5], scale: [2, 1.5, 1.2], color: 0x22d97c, label: 'Visual Cortex', desc: 'Processes visual information from the eyes' },
      { name: 'Temporal Lobe L', pos: [-3.5, -1.5, 1], scale: [1.5, 1.2, 2], color: 0xe5a700, label: 'Temporal Lobe (L)', desc: 'Memory, hearing, language comprehension' },
      { name: 'Temporal Lobe R', pos: [3.5, -1.5, 1], scale: [1.5, 1.2, 2], color: 0xe5a700, label: 'Temporal Lobe (R)', desc: 'Face recognition, emotional processing' },
      { name: 'Cerebellum', pos: [0, -3, -2], scale: [2.5, 1.5, 1.5], color: 0x8866aa, label: 'Cerebellum', desc: 'Motor control, balance, coordination' },
      { name: 'Brain Stem', pos: [0, -4, -0.5], scale: [0.8, 1.5, 0.8], color: 0x556688, label: 'Brain Stem', desc: 'Basic life functions: breathing, heartbeat, consciousness' },
    ];

    const geo = new THREE.SphereGeometry(1, 24, 24);

    regionData.forEach(r => {
      const mat = new THREE.MeshStandardMaterial({
        color: r.color,
        emissive: r.color,
        emissiveIntensity: 0.3,
        metalness: 0.3,
        roughness: 0.6,
        transparent: true,
        opacity: 0.5,
        wireframe: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...r.pos);
      mesh.scale.set(...r.scale);
      mesh.userData = {
        baseColor: new THREE.Color(r.color),
        baseOpacity: 0.5,
        baseEmissive: 0.3,
        label: r.label,
        desc: r.desc,
        regionName: r.name,
      };
      this.scene.add(mesh);
      this.regions.push(mesh);

      // Wireframe overlay
      const wireMat = new THREE.MeshBasicMaterial({
        color: r.color,
        wireframe: true,
        transparent: true,
        opacity: 0.06,
      });
      const wire = new THREE.Mesh(geo, wireMat);
      wire.position.copy(mesh.position);
      wire.scale.copy(mesh.scale).multiplyScalar(1.02);
      this.scene.add(wire);
    });
  }

  _buildNeurons() {
    // Small glowing neurons scattered inside brain
    const neuronGeo = new THREE.SphereGeometry(0.12, 8, 8);
    for (let i = 0; i < 120; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xaabbff,
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(neuronGeo, mat);
      // Position within brain volume
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 2 + Math.random() * 4;
      mesh.position.set(
        Math.sin(phi) * Math.cos(theta) * r * 0.8,
        Math.sin(phi) * Math.sin(theta) * r * 0.5 - 0.5,
        Math.cos(phi) * r * 0.6
      );
      mesh.userData = {
        basePos: mesh.position.clone(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 2,
        firingRate: 0.02,
      };
      this.scene.add(mesh);
      this.neurons.push(mesh);
    }
  }

  _buildSignals() {
    // Signal propagation lines between neurons
    const sigMat = new THREE.LineBasicMaterial({
      color: 0x4da6ff,
      transparent: true,
      opacity: 0.15,
    });
    for (let i = 0; i < 60; i++) {
      const n1 = this.neurons[Math.floor(Math.random() * this.neurons.length)];
      const n2 = this.neurons[Math.floor(Math.random() * this.neurons.length)];
      if (n1 === n2) continue;
      const mid = new THREE.Vector3().lerpVectors(n1.position, n2.position, 0.5);
      mid.y += (Math.random() - 0.5) * 1;
      const curve = new THREE.QuadraticBezierCurve3(n1.position, mid, n2.position);
      const points = curve.getPoints(12);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, sigMat.clone());
      line.userData = { fromNeuron: n1, toNeuron: n2, t: Math.random() };
      this.scene.add(line);
      this.signals.push(line);
    }
  }

  _buildImaginedObjects() {
    // "Imagined" objects that appear during hallucination
    const shapes = [
      new THREE.TetrahedronGeometry(0.5),
      new THREE.OctahedronGeometry(0.4),
      new THREE.IcosahedronGeometry(0.35),
      new THREE.TorusGeometry(0.3, 0.1, 8, 16),
      new THREE.DodecahedronGeometry(0.35),
    ];
    shapes.forEach((geo, i) => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff4466,
        emissive: 0xff4466,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0,
        metalness: 0.5,
        roughness: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4 + 5
      );
      mesh.userData = { targetOpacity: 0, rotSpeed: 0.5 + Math.random() * 2 };
      this.scene.add(mesh);
      this.imagined.push(mesh);
    });
  }

  _buildParticles() {
    const geo = new THREE.BufferGeometry();
    const count = 400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.06,
      color: 0x665588,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
    });
    this.particleSystem = new THREE.Points(geo, mat);
    this.scene.add(this.particleSystem);
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

  setParams(stress, fatigue, sensory) {
    this.params = { stress, fatigue, sensory };
    this.targetHallucinationLevel = Math.max(
      stress / 100,
      fatigue / 100,
      (100 - sensory) / 100
    ) * 0.8;
  }

  runScenario(scenario) {
    this.activeScenario = scenario;
    this.simProgress = 0;
    this.time = 0;
    this.playing = true;
    this.setParams(scenario.params.stress, scenario.params.fatigue, scenario.params.sensory);
  }

  stop() {
    this.playing = false;
    this.targetHallucinationLevel = 0;
  }

  rewind() {
    this.simProgress = 0;
    this.time = 0;
  }

  step() {
    this.simProgress = Math.min(1, this.simProgress + 0.1);
  }

  getNodeAt(x, y) {
    this.mouse.set(x, y);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.regions);
    if (intersects.length > 0) return intersects[0].object;
    return null;
  }

  update(dt) {
    if (!dt) dt = 0.016;
    this.time += dt;

    this.hallucinationLevel += (this.targetHallucinationLevel - this.hallucinationLevel) * dt * 3;

    if (this.playing && this.activeScenario) {
      this.simProgress = Math.min(1, this.simProgress + dt / this.activeScenario.duration);
    }

    this.hallucinationLight.intensity = this.hallucinationLevel * 3;

    const behavior = this.activeScenario?.behavior || 'none';

    // Update brain regions
    this.regions.forEach((region, i) => {
      const ud = region.userData;
      let targetEmissive = ud.baseEmissive;
      let targetOpacity = ud.baseOpacity;
      let targetColor = ud.baseColor.clone();

      if (this.playing) {
        switch (behavior) {
          case 'sleep':
            // Flickering, slowed
            targetEmissive = 0.1 + Math.sin(this.time * 1 + i) * 0.05;
            targetOpacity = 0.2 + Math.sin(this.time * 0.5 + i * 2) * 0.1;
            if (ud.regionName.includes('Visual')) {
              targetColor = new THREE.Color(0xff8833);
              targetEmissive = 0.3 + Math.sin(this.time * 3) * 0.2;
            }
            break;
          case 'pareidolia':
            // Pattern completion in temporal/visual
            if (ud.regionName.includes('Temporal') || ud.regionName.includes('Visual')) {
              targetColor = new THREE.Color(0xff8833);
              targetEmissive = 0.4 + Math.sin(this.time * 4 + i) * 0.2;
              targetOpacity = 0.5;
            } else {
              targetEmissive = 0.2 + Math.sin(this.time * 2 + i) * 0.05;
            }
            break;
          case 'stress':
            // All regions hyperactive
            targetEmissive = 0.35 + Math.sin(this.time * 6 + i * 3) * 0.25;
            targetOpacity = 0.4 + Math.sin(this.time * 8 + i) * 0.15;
            if (Math.random() < 0.05) {
              targetColor = new THREE.Color(0xff4466);
            }
            break;
          case 'sensory':
            // Internal generation — visual cortex and prefrontal light up
            if (ud.regionName.includes('Visual') || ud.regionName.includes('Prefrontal')) {
              targetColor = new THREE.Color(0xff4466);
              targetEmissive = 0.5 + Math.sin(this.time * 3 + i) * 0.3;
              targetOpacity = 0.6;
            } else {
              targetEmissive = 0.05;
              targetOpacity = 0.15;
            }
            break;
          case 'memory':
            // Temporal lobes and prefrontal — unstable rewiring
            if (ud.regionName.includes('Temporal') || ud.regionName.includes('Prefrontal')) {
              targetColor = new THREE.Color().lerpColors(
                ud.baseColor, new THREE.Color(0xff8833),
                Math.sin(this.time * 2) * 0.5 + 0.5
              );
              targetEmissive = 0.3 + Math.sin(this.time * 5 + i * 2) * 0.2;
              targetOpacity = 0.5;
            }
            break;
          default:
            targetEmissive = 0.2 + Math.sin(this.time * 2 + i) * 0.05;
        }
      }

      region.material.emissiveIntensity += (targetEmissive - region.material.emissiveIntensity) * dt * 4;
      region.material.opacity += (targetOpacity - region.material.opacity) * dt * 4;
      region.material.emissive.lerp(targetColor, dt * 3);
    });

    // Update neurons — firing
    this.neurons.forEach((neuron, i) => {
      const ud = neuron.userData;
      const firing = this.playing && Math.sin(this.time * ud.speed + ud.phase) > (1 - this.hallucinationLevel * 2 - 0.3);

      if (firing) {
        neuron.material.opacity = 0.9;
        neuron.material.color.lerp(
          this.hallucinationLevel > 0.3 ? new THREE.Color(0xff4466) : new THREE.Color(0x88ccff),
          dt * 10
        );
        neuron.scale.setScalar(1.5 + Math.sin(this.time * 10 + i) * 0.3);
      } else {
        neuron.material.opacity = 0.2 + this.hallucinationLevel * 0.3;
        neuron.material.color.lerp(new THREE.Color(0x445566), dt * 3);
        neuron.scale.setScalar(1);
      }

      // Stress jitter
      if (behavior === 'stress' && this.playing) {
        neuron.position.x = ud.basePos.x + (Math.random() - 0.5) * 0.1 * this.hallucinationLevel;
        neuron.position.y = ud.basePos.y + (Math.random() - 0.5) * 0.1 * this.hallucinationLevel;
      }
    });

    // Signals
    this.signals.forEach((sig, i) => {
      if (this.playing) {
        const brightness = 0.1 + Math.sin(this.time * 3 + i * 0.5) * 0.08 + this.hallucinationLevel * 0.1;
        sig.material.opacity = brightness;
        if (this.hallucinationLevel > 0.4) {
          sig.material.color.lerp(new THREE.Color(0xff6644), dt * 3);
        } else {
          sig.material.color.lerp(new THREE.Color(0x4da6ff), dt * 2);
        }
      } else {
        sig.material.opacity = 0.05;
        sig.material.color.lerp(new THREE.Color(0x334455), dt * 2);
      }
    });

    // Imagined objects (appear during sensory deprivation / pareidolia)
    this.imagined.forEach((obj, i) => {
      let showImagined = false;
      if (this.playing && (behavior === 'sensory' || behavior === 'pareidolia')) {
        showImagined = this.simProgress > 0.3;
      }
      const targetOp = showImagined ? 0.6 + Math.sin(this.time * 2 + i) * 0.2 : 0;
      obj.material.opacity += (targetOp - obj.material.opacity) * dt * 3;
      obj.rotation.x += dt * obj.userData.rotSpeed;
      obj.rotation.y += dt * obj.userData.rotSpeed * 0.7;

      // Float animation
      obj.position.y += Math.sin(this.time + i * 2) * dt * 0.3;
    });

    // Background particles
    if (this.particleSystem) {
      const positions = this.particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(this.time * 0.15 + i) * 0.002;
        positions[i + 1] += Math.cos(this.time * 0.12 + i) * 0.002;
      }
      this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Gentle auto rotation and damping
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  getProgress() {
    return this.simProgress;
  }

  dispose() {
    this.renderer.dispose();
  }
}
