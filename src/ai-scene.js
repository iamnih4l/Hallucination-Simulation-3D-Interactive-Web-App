/* ============================================
   AI SCENE — 3D Neural Network Visualization
   ============================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class AIScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.nodes = [];
    this.edges = [];
    this.particles = [];
    this.dataFlowParticles = [];
    this.hallucinationLevel = 0;
    this.targetHallucinationLevel = 0;
    this.playing = false;
    this.time = 0;
    this.simProgress = 0;
    this.activeScenario = null;
    this.params = { noise: 0, quality: 100, context: 100 };
    this.hoveredNode = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.wrongPathIndices = [];
    this.attentionPath = [];

    this._init();
  }

  _init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a0f, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.6;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.006);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    this.camera.position.set(0, 2, 22);
    this.camera.lookAt(0, 0, 0);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.enablePan = true;
    this.controls.maxDistance = 50;
    this.controls.minDistance = 5;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x4466aa, 1.0);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x2299ff, 3, 80);
    pointLight1.position.set(10, 10, 10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00e5cc, 2, 60);
    pointLight2.position.set(-10, -5, 5);
    this.scene.add(pointLight2);

    this.hallucinationLight = new THREE.PointLight(0xff4466, 0, 60);
    this.hallucinationLight.position.set(0, 0, 5);
    this.scene.add(this.hallucinationLight);

    // Build neural network
    this._buildNetwork();
    this._buildParticles();
    this._buildDataFlowParticles();

    // Grid floor
    this._buildGrid();
  }

  _buildNetwork() {
    const layers = [4, 8, 12, 10, 8, 6, 4];
    const layerSpacing = 6;
    const startX = -(layers.length - 1) * layerSpacing / 2;

    // Node material (shared, will be per-instance colored)
    const nodeGeo = new THREE.SphereGeometry(0.5, 16, 16);

    layers.forEach((count, li) => {
      const x = startX + li * layerSpacing;
      const startY = -(count - 1) * 1.5 / 2;
      for (let ni = 0; ni < count; ni++) {
        const y = startY + ni * 1.5;
        const z = (Math.random() - 0.5) * 2;

        const mat = new THREE.MeshStandardMaterial({
          color: 0x2299ff,
          emissive: 0x2299ff,
          emissiveIntensity: 0.6,
          metalness: 0.8,
          roughness: 0.2,
          transparent: true,
          opacity: 0.9,
        });

        const mesh = new THREE.Mesh(nodeGeo, mat);
        mesh.position.set(x, y, z);
        mesh.userData = {
          layer: li,
          index: ni,
          baseColor: new THREE.Color(0x2299ff),
          baseEmissive: 0.6,
          label: `Layer ${li + 1}, Node ${ni + 1}`,
          desc: li === 0 ? 'Input Layer — receives tokens/data' :
                li === layers.length - 1 ? 'Output Layer — generates predictions' :
                `Hidden Layer ${li} — transforms representations`,
        };
        this.scene.add(mesh);
        this.nodes.push(mesh);
      }
    });

    // Edges: connect each node to nodes in next layer
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x2299ff,
      transparent: true,
      opacity: 0.15,
    });

    let nodeIdx = 0;
    for (let li = 0; li < layers.length - 1; li++) {
      const currCount = layers[li];
      const nextCount = layers[li + 1];
      const nextStart = nodeIdx + currCount;
      for (let ci = 0; ci < currCount; ci++) {
        // Connect to a subset of next layer nodes
        const connections = Math.min(nextCount, 4 + Math.floor(Math.random() * 3));
        const connected = new Set();
        for (let c = 0; c < connections; c++) {
          let target;
          do { target = Math.floor(Math.random() * nextCount); } while (connected.has(target));
          connected.add(target);
          const from = this.nodes[nodeIdx + ci];
          const to = this.nodes[nextStart + target];
          const geo = new THREE.BufferGeometry().setFromPoints([from.position, to.position]);
          const line = new THREE.Line(geo, edgeMat.clone());
          line.userData = { fromIdx: nodeIdx + ci, toIdx: nextStart + target };
          this.scene.add(line);
          this.edges.push(line);
        }
      }
      nodeIdx += currCount;
    }
  }

  _buildParticles() {
    const geo = new THREE.BufferGeometry();
    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x446688,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });
    this.particleSystem = new THREE.Points(geo, mat);
    this.scene.add(this.particleSystem);
  }

  _buildDataFlowParticles() {
    // Particles that flow along edges
    const geo = new THREE.SphereGeometry(0.1, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00e5cc,
      transparent: true,
      opacity: 0.8,
    });
    for (let i = 0; i < 30; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.visible = false;
      mesh.userData = { edgeIdx: 0, t: 0, speed: 0.5 + Math.random() * 1.5, active: false };
      this.scene.add(mesh);
      this.dataFlowParticles.push(mesh);
    }
  }

  _buildGrid() {
    const gridGeo = new THREE.PlaneGeometry(80, 40, 40, 20);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x111122,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -10;
    this.scene.add(grid);
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

  setParams(noise, quality, context) {
    this.params = { noise, quality, context };
    this.targetHallucinationLevel = Math.max(
      noise / 100,
      (100 - quality) / 100,
      (100 - context) / 100
    ) * 0.8;
  }

  runScenario(scenario) {
    this.activeScenario = scenario;
    this.simProgress = 0;
    this.time = 0;
    this.playing = true;
    this.setParams(scenario.params.noise, scenario.params.quality, scenario.params.context);

    // Set wrong paths based on scenario
    this.wrongPathIndices = [];
    this.attentionPath = [];

    const totalNodes = this.nodes.length;
    switch (scenario.behavior) {
      case 'incomplete':
        // Sparse attention, random jumps
        this.wrongPathIndices = Array.from({ length: 8 }, () => Math.floor(Math.random() * totalNodes));
        break;
      case 'conflicting':
        // Two competing paths
        this.wrongPathIndices = Array.from({ length: 5 }, () => Math.floor(Math.random() * totalNodes));
        this.attentionPath = Array.from({ length: 5 }, () => Math.floor(Math.random() * totalNodes));
        break;
      case 'ood':
        // Expansive sparse activation
        this.wrongPathIndices = Array.from({ length: 15 }, () => Math.floor(Math.random() * totalNodes));
        break;
      case 'highconf':
        // Single bright wrong path
        const wrongStart = Math.floor(Math.random() * 4);
        this.wrongPathIndices = [wrongStart];
        for (let i = 0; i < 6; i++) {
          this.wrongPathIndices.push(Math.min(wrongStart + (i + 1) * 8 + Math.floor(Math.random() * 3), totalNodes - 1));
        }
        break;
      case 'noisy':
        // Lots of random wrong nodes
        this.wrongPathIndices = Array.from({ length: 20 }, () => Math.floor(Math.random() * totalNodes));
        break;
    }
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
    const intersects = this.raycaster.intersectObjects(this.nodes);
    if (intersects.length > 0) {
      return intersects[0].object;
    }
    return null;
  }

  update(dt) {
    if (!dt) dt = 0.016;
    this.time += dt;

    // Smooth hallucination level
    this.hallucinationLevel += (this.targetHallucinationLevel - this.hallucinationLevel) * dt * 3;

    // Update simulation progress
    if (this.playing && this.activeScenario) {
      this.simProgress = Math.min(1, this.simProgress + dt / this.activeScenario.duration);
    }

    // Hallucination light
    this.hallucinationLight.intensity = this.hallucinationLevel * 3;

    // Update nodes
    this.nodes.forEach((node, i) => {
      const ud = node.userData;
      const isWrong = this.wrongPathIndices.includes(i);
      const isAttention = this.attentionPath.includes(i);
      const phasedIn = this.simProgress > (ud.layer / 7) * 0.6;

      // Pulsing
      const pulse = Math.sin(this.time * 3 + i * 0.5) * 0.1;
      const scale = 1 + pulse;
      node.scale.setScalar(scale);

      if (phasedIn && this.playing) {
        if (isWrong) {
          // Hallucination node — red/orange glow
          const hColor = new THREE.Color().lerpColors(
            new THREE.Color(0xff4466), new THREE.Color(0xff8833),
            Math.sin(this.time * 5 + i) * 0.5 + 0.5
          );
          node.material.color.lerp(hColor, dt * 5);
          node.material.emissive.lerp(hColor, dt * 5);
          node.material.emissiveIntensity = 0.6 + Math.sin(this.time * 8 + i) * 0.3;

          // Glitch offset on noisy scenario
          if (this.activeScenario?.behavior === 'noisy') {
            node.position.x += (Math.random() - 0.5) * 0.05 * this.hallucinationLevel;
            node.position.y += (Math.random() - 0.5) * 0.05 * this.hallucinationLevel;
          }
        } else if (isAttention) {
          // Attention path — bright cyan
          node.material.color.lerp(new THREE.Color(0x00e5cc), dt * 5);
          node.material.emissive.lerp(new THREE.Color(0x00e5cc), dt * 5);
          node.material.emissiveIntensity = 0.5 + Math.sin(this.time * 4 + i) * 0.2;
        } else {
          // Normal active node — blue/green
          node.material.color.lerp(ud.baseColor, dt * 2);
          node.material.emissive.lerp(ud.baseColor, dt * 2);
          node.material.emissiveIntensity = ud.baseEmissive + Math.sin(this.time * 2 + i * 0.3) * 0.1;
        }
        node.material.opacity = 0.9;
      } else {
        // Inactive — subtle idle glow
        node.material.color.lerp(new THREE.Color(0x3366aa), dt * 3);
        node.material.emissive.lerp(new THREE.Color(0x2244aa), dt * 3);
        node.material.emissiveIntensity = 0.3 + Math.sin(this.time * 1.5 + i * 0.7) * 0.1;
        node.material.opacity = 0.65;
      }
    });

    // Update edges
    this.edges.forEach((edge, i) => {
      const fromNode = this.nodes[edge.userData.fromIdx];
      const toNode = this.nodes[edge.userData.toIdx];
      const fromWrong = this.wrongPathIndices.includes(edge.userData.fromIdx);
      const toWrong = this.wrongPathIndices.includes(edge.userData.toIdx);

      if (this.playing && (fromWrong || toWrong)) {
        edge.material.color.lerp(new THREE.Color(0xff4466), dt * 3);
        edge.material.opacity = 0.15 + Math.sin(this.time * 6 + i) * 0.08;
      } else if (this.playing) {
        edge.material.color.lerp(new THREE.Color(0x2299ff), dt * 2);
        edge.material.opacity = 0.06 + Math.sin(this.time * 2 + i * 0.2) * 0.03;
      } else {
        edge.material.color.lerp(new THREE.Color(0x335577), dt * 2);
        edge.material.opacity = 0.1;
      }
    });

    // Data flow particles
    if (this.playing) {
      this.dataFlowParticles.forEach(p => {
        if (!p.userData.active) {
          if (Math.random() < 0.03) {
            p.userData.active = true;
            p.userData.edgeIdx = Math.floor(Math.random() * this.edges.length);
            p.userData.t = 0;
            p.visible = true;
          }
        } else {
          p.userData.t += dt * p.userData.speed;
          if (p.userData.t >= 1) {
            p.userData.active = false;
            p.visible = false;
          } else {
            const edge = this.edges[p.userData.edgeIdx];
            if (edge) {
              const from = this.nodes[edge.userData.fromIdx];
              const to = this.nodes[edge.userData.toIdx];
              if (from && to) {
                p.position.lerpVectors(from.position, to.position, p.userData.t);
                // Color based on wrong path
                const isWrongPath = this.wrongPathIndices.includes(edge.userData.fromIdx) ||
                                    this.wrongPathIndices.includes(edge.userData.toIdx);
                if (isWrongPath) {
                  p.material.color.lerp(new THREE.Color(0xff4466), dt * 8);
                } else {
                  p.material.color.lerp(new THREE.Color(0x00e5cc), dt * 5);
                }
              }
            }
          }
        }
      });
    }

    // Background particles drift
    if (this.particleSystem) {
      const positions = this.particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(this.time * 0.2 + i) * 0.002;
        positions[i + 1] += Math.cos(this.time * 0.15 + i) * 0.002;
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
