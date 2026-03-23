/* ============================================
   MAIN.JS — Application Entry Point
   ============================================ */
import { AIScene } from './ai-scene.js';
import { BrainScene } from './brain-scene.js';
import { ComparisonOverlay } from './comparison.js';
import { AudioSystem } from './audio.js';
import { UI } from './ui.js';
import { aiScenarios, brainScenarios } from './scenarios.js';

class App {
  constructor() {
    this.aiScene = null;
    this.brainScene = null;
    this.comparison = null;
    this.audio = new AudioSystem();
    this.ui = null;
    this.viewMode = 'split'; // split | ai | brain | overlay
    this.lastTime = 0;
    this.running = true;
    this.running = true;

    this._init();
  }

  _init() {
    // 3D Scenes
    this.aiScene = new AIScene(document.getElementById('ai-canvas'));
    this.brainScene = new BrainScene(document.getElementById('brain-canvas'));
    this.comparison = new ComparisonOverlay(document.getElementById('overlay-canvas'));

    // UI
    this.ui = new UI({
      onScenarioSelect: (s) => this._onScenarioSelect(s),
      onSliderChange: (vals) => this._onSliderChange(vals),
      onPlay: () => this._onPlay(),
      onPause: () => this._onPause(),
      onRewind: () => this._onRewind(),
      onStep: () => this._onStep(),
      onViewMode: (mode) => this._setViewMode(mode),
      onAudioToggle: () => this._onAudioToggle(),
    });

    // Resize
    this._resize();
    window.addEventListener('resize', () => this._resize());

    // Mouse move for tooltips
    document.getElementById('ai-canvas').addEventListener('mousemove', (e) => this._onMouseMove(e, 'ai'));
    document.getElementById('brain-canvas').addEventListener('mousemove', (e) => this._onMouseMove(e, 'brain'));
    document.getElementById('ai-canvas').addEventListener('mouseleave', () => this.ui.hideTooltip());
    document.getElementById('brain-canvas').addEventListener('mouseleave', () => this.ui.hideTooltip());

    // Hide loading screen
    setTimeout(() => {
      document.getElementById('loading-screen').classList.add('fade-out');
      document.getElementById('app').classList.remove('hidden');
      
      // Must resize now that app is visible
      this._resize();
      
      // Auto-open scenario panel
      setTimeout(() => {
        this.ui.toggleScenarioPanel(true);
      }, 600);
    }, 1500);

    // Start render loop
    this._animate(0);
  }

  _resize() {
    this.aiScene.resize();
    this.brainScene.resize();
    this.comparison.resize();
  }

  _onScenarioSelect(scenario) {
    if (scenario.id.startsWith('ai-')) {
      this.aiScene.runScenario(scenario);
      this.ui.updateSliders({
        noise: scenario.params.noise,
        quality: scenario.params.quality,
        context: scenario.params.context,
      });
      this.ui.updateInfoPanel('ai', scenario.title, `${scenario.description}\n\nInput: ${scenario.input || ''}`);
    } else {
      this.brainScene.runScenario(scenario);
      this.ui.updateSliders({
        stress: scenario.params.stress,
        fatigue: scenario.params.fatigue,
        sensory: scenario.params.sensory,
      });
      this.ui.updateInfoPanel('brain', scenario.title, `${scenario.description}\n\nEffect: ${scenario.effect || ''}`);
    }

    this.audio.triggerGlitch(0.3, 200);
  }

  _onSliderChange(vals) {
    this.aiScene.setParams(vals.noise, vals.quality, vals.context);
    this.brainScene.setParams(vals.stress, vals.fatigue, vals.sensory);
  }

  _onPlay() {
    if (this.aiScene.activeScenario) this.aiScene.playing = true;
    if (this.brainScene.activeScenario) this.brainScene.playing = true;
  }

  _onPause() {
    this.aiScene.playing = false;
    this.brainScene.playing = false;
  }

  _onRewind() {
    this.aiScene.rewind();
    this.brainScene.rewind();
  }

  _onStep() {
    if (this.aiScene.activeScenario) this.aiScene.step();
    if (this.brainScene.activeScenario) this.brainScene.step();
  }

  _setViewMode(mode) {
    this.viewMode = mode;
    const viewport = document.getElementById('viewport');
    const overlayEl = document.getElementById('comparison-overlay');

    // Reset
    viewport.className = '';
    overlayEl.classList.add('hidden');
    viewport.style.display = 'flex';

    switch (mode) {
      case 'split':
        break;
      case 'ai':
        viewport.classList.add('mode-ai');
        break;
      case 'brain':
        viewport.classList.add('mode-brain');
        break;
      case 'overlay':
        viewport.style.display = 'none';
        overlayEl.classList.remove('hidden');
        this.comparison.setActive(true);
        break;
    }

    if (mode !== 'overlay') {
      this.comparison.setActive(false);
    }

    // Force resize after mode change
    requestAnimationFrame(() => this._resize());
  }

  _onAudioToggle() {
    const muted = this.audio.toggleMute();
    this.ui.setAudioMuted(muted);
  }

  _onMouseMove(e, side) {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    let node = null;
    if (side === 'ai') {
      node = this.aiScene.getNodeAt(x, y);
    } else {
      node = this.brainScene.getNodeAt(x, y);
    }

    if (node && node.userData.label) {
      this.ui.showTooltip(e.clientX, e.clientY, node.userData.label, node.userData.desc);
    } else {
      this.ui.hideTooltip();
    }
  }

  _animate(timestamp) {
    if (!this.running) return;
    requestAnimationFrame((t) => this._animate(t));

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    // Update scenes
    if (this.viewMode !== 'overlay') {
      if (this.viewMode !== 'brain') this.aiScene.update(dt);
      if (this.viewMode !== 'ai') this.brainScene.update(dt);
    }

    if (this.viewMode === 'overlay') {
      this.comparison.update(dt);
    }

    // Update timeline
    // Update timeline and audio based on active simulations
    let maxProgress = 0;
    let maxDuration = 10;
    let hLevel = 0;
    let anyRunning = false;

    if (this.aiScene.activeScenario) {
      maxProgress = Math.max(maxProgress, this.aiScene.getProgress());
      hLevel = Math.max(hLevel, this.aiScene.hallucinationLevel);
      maxDuration = Math.max(maxDuration, this.aiScene.activeScenario.duration);
      anyRunning = true;
    }
    if (this.brainScene.activeScenario) {
      maxProgress = Math.max(maxProgress, this.brainScene.getProgress());
      hLevel = Math.max(hLevel, this.brainScene.hallucinationLevel);
      maxDuration = Math.max(maxDuration, this.brainScene.activeScenario.duration);
      anyRunning = true;
    }

    if (anyRunning) {
      this.ui.updateTimeline(maxProgress, maxDuration);
      this.audio.setHallucinationLevel(hLevel);

      // Trigger glitch sounds at high levels periodically
      if (hLevel > 0.4 && Math.random() < 0.005) {
        this.audio.triggerGlitch(hLevel, 150 + Math.random() * 300);
      }

      // Auto-stop when complete
      if (maxProgress >= 1 && (this.aiScene.playing || this.brainScene.playing)) {
        this.ui.setPlaying(false);
        this.aiScene.playing = false;
        this.brainScene.playing = false;
      }
    }
  }
}

// Initialize
new App();
