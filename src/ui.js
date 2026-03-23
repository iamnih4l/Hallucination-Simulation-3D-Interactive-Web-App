/* ============================================
   UI — Scenario Cards, Sliders, Controls
   ============================================ */
import { aiScenarios, brainScenarios } from './scenarios.js';

export class UI {
  constructor({ onScenarioSelect, onSliderChange, onPlay, onPause, onRewind, onStep, onViewMode, onAudioToggle }) {
    this.callbacks = { onScenarioSelect, onSliderChange, onPlay, onPause, onRewind, onStep, onViewMode, onAudioToggle };
    this.currentTab = 'ai';
    this.isPlaying = false;
    this.scenarioPanelOpen = false;

    this._bindElements();
    this._renderScenarios();
    this._bindEvents();
  }

  _bindElements() {
    this.scenarioPanel = document.getElementById('scenario-panel');
    this.scenarioContainer = document.getElementById('scenario-cards-container');
    this.btnScenariosToggle = document.getElementById('btn-scenarios-toggle');
    this.btnCloseScenarios = document.getElementById('btn-close-scenarios');
    this.tabBtns = document.querySelectorAll('.tab-btn');

    this.btnPlay = document.getElementById('btn-play');
    this.playIcon = document.getElementById('play-icon');
    this.pauseIcon = document.getElementById('pause-icon');
    this.btnRewind = document.getElementById('btn-rewind');
    this.btnStep = document.getElementById('btn-step');

    this.viewBtns = document.querySelectorAll('.view-btn');
    this.btnAudio = document.getElementById('btn-audio-toggle');

    // Sliders
    this.sliders = {
      noise: document.getElementById('slider-noise'),
      quality: document.getElementById('slider-quality'),
      context: document.getElementById('slider-context'),
      stress: document.getElementById('slider-stress'),
      fatigue: document.getElementById('slider-fatigue'),
      sensory: document.getElementById('slider-sensory'),
    };
    this.sliderVals = {
      noise: document.getElementById('val-noise'),
      quality: document.getElementById('val-quality'),
      context: document.getElementById('val-context'),
      stress: document.getElementById('val-stress'),
      fatigue: document.getElementById('val-fatigue'),
      sensory: document.getElementById('val-sensory'),
    };

    this.timelineProgress = document.getElementById('timeline-progress');
    this.timelineLabel = document.getElementById('timeline-label');

    this.tooltip = document.getElementById('tooltip');
    this.tooltipTitle = document.getElementById('tooltip-title');
    this.tooltipDesc = document.getElementById('tooltip-desc');
  }

  _renderScenarios() {
    const scenarios = this.currentTab === 'ai' ? aiScenarios : brainScenarios;
    this.scenarioContainer.innerHTML = '';

    scenarios.forEach(s => {
      const card = document.createElement('div');
      card.className = 'scenario-card';
      card.dataset.id = s.id;
      card.innerHTML = `
        <div class="sc-number">${this.currentTab === 'ai' ? 'AI' : 'BRAIN'} #${s.number}</div>
        <div class="sc-title">${s.title}</div>
        <div class="sc-desc">${s.description}</div>
        <div class="sc-visual">🎨 ${s.visual}</div>
        <button class="sc-run-btn" data-id="${s.id}">▶ Run Simulation</button>
      `;
      this.scenarioContainer.appendChild(card);
    });
  }

  _bindEvents() {
    // Scenario panel toggle
    this.btnScenariosToggle.addEventListener('click', () => this.toggleScenarioPanel());
    this.btnCloseScenarios.addEventListener('click', () => this.toggleScenarioPanel(false));

    // Tab switching
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTab = btn.dataset.tab;
        this._renderScenarios();
      });
    });

    // Scenario card clicks
    this.scenarioContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.scenario-card');
      if (card) {
        const id = card.dataset.id;
        const all = [...aiScenarios, ...brainScenarios];
        const scenario = all.find(s => s.id === id);
        if (scenario) {
          // Remove active from all cards
          this.scenarioContainer.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          this.callbacks.onScenarioSelect(scenario);
          this.setPlaying(true);
        }
      }
    });

    // Play/Pause
    this.btnPlay.addEventListener('click', () => {
      if (this.isPlaying) {
        this.callbacks.onPause();
      } else {
        this.callbacks.onPlay();
      }
      this.setPlaying(!this.isPlaying);
    });

    // Rewind
    this.btnRewind.addEventListener('click', () => this.callbacks.onRewind());
    // Step
    this.btnStep.addEventListener('click', () => this.callbacks.onStep());

    // View modes
    this.viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onViewMode(btn.dataset.mode);
      });
    });

    // Audio
    this.btnAudio.addEventListener('click', () => {
      this.callbacks.onAudioToggle();
    });

    // Sliders
    Object.entries(this.sliders).forEach(([key, slider]) => {
      slider.addEventListener('input', () => {
        this.sliderVals[key].textContent = slider.value;
        this.callbacks.onSliderChange(this._getSliderValues());
      });
    });
  }

  _getSliderValues() {
    return {
      noise: parseInt(this.sliders.noise.value),
      quality: parseInt(this.sliders.quality.value),
      context: parseInt(this.sliders.context.value),
      stress: parseInt(this.sliders.stress.value),
      fatigue: parseInt(this.sliders.fatigue.value),
      sensory: parseInt(this.sliders.sensory.value),
    };
  }

  toggleScenarioPanel(forceState) {
    this.scenarioPanelOpen = forceState !== undefined ? forceState : !this.scenarioPanelOpen;
    this.scenarioPanel.classList.toggle('hidden', !this.scenarioPanelOpen);
  }

  setPlaying(playing) {
    this.isPlaying = playing;
    this.playIcon.classList.toggle('hidden', playing);
    this.pauseIcon.classList.toggle('hidden', !playing);
  }

  updateTimeline(progress, duration) {
    const pct = Math.min(100, progress * 100);
    this.timelineProgress.style.width = `${pct}%`;
    const elapsed = Math.floor(progress * duration);
    this.timelineLabel.textContent = `0:${String(elapsed).padStart(2, '0')} / 0:${String(duration).padStart(2, '0')}`;
  }

  updateSliders(params) {
    Object.entries(params).forEach(([key, val]) => {
      if (this.sliders[key]) {
        this.sliders[key].value = val;
        this.sliderVals[key].textContent = val;
      }
    });
  }

  setAudioMuted(muted) {
    this.btnAudio.classList.toggle('muted', muted);
  }

  showTooltip(x, y, title, desc) {
    this.tooltip.classList.remove('hidden');
    this.tooltipTitle.textContent = title;
    this.tooltipDesc.textContent = desc;
    this.tooltip.style.left = `${x + 12}px`;
    this.tooltip.style.top = `${y - 10}px`;
  }

  hideTooltip() {
    this.tooltip.classList.add('hidden');
  }

  updateInfoPanel(side, title, desc) {
    const info = document.getElementById(`${side}-info`);
    if (info) {
      info.querySelector('.info-title').textContent = title;
      info.querySelector('.info-desc').textContent = desc;
    }
  }
}
