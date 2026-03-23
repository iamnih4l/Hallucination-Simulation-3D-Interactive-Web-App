<div align="center">

# 🧠 Hallucination Simulator ⚡
**An Interactive 3D Web Application Exploring AI vs. Human Cognitive Errors**

[![Three.js](https://img.shields.io/badge/Three.js-Black?logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Web Audio API](https://img.shields.io/badge/Web_Audio-API-blue)](#)

*A cinematic, side-by-side simulation demonstrating what happens when predictive engines—both biological and artificial—fail.*

</div>

---

## 📖 Table of Contents
- [📖 Table of Contents](#-table-of-contents)
- [🚀 Quick Start](#-quick-start)
- [🌌 The Parallels: AI vs. The Brain](#-the-parallels-ai-vs-the-brain)
- [🎮 Key Features & Interactive Scenarios](#-key-features--interactive-scenarios)
- [🛠️ Technical Architecture](#️-technical-architecture)
- [🤝 Contributing](#-contributing)

---

## 🚀 Quick Start

Run the simulation locally in seconds:

```bash
# Clone the repository
git clone https://github.com/iamnih4l/Hallucination-Simulation-3D-Interactive-Web-App.git

# Navigate into the project
cd Hallucination-Simulation-3D-Interactive-Web-App

# Install dependencies (Vite & Three.js)
npm install

# Start the interactive development server
npm run dev
```
Navigate to `http://localhost:5173/` in your browser to start the simulation!

---

## 🌌 The Parallels: AI vs. The Brain

The term "hallucination" in Artifical Intelligence was borrowed from psychology. But how similar are they really? Both systems are **predictive engines** attempting to make sense of noisy, chaotic data by filling in gaps using prior knowledge (training weights or evolutionary memory). When these engines fail, a hallucination is born.

<details>
<summary><b>🧩 Gap Filling / Pattern Completion</b> (Click to expand)</summary>
<br>

*   **AI (Pattern Completion):** When returning strings from incomplete prompts, the mathematical model makes probabilistic leaps to fill the textual void.
*   **Brain (Imagination/Pareidolia):** The brain abhors a vacuum. When staring at clouds or static noise, the visual cortex forces pattern recognition, causing you to "see" faces (Pareidolia).
</details>

<details>
<summary><b>🕳️ Blackout / Sensory Deprivation</b> (Click to expand)</summary>
<br>

*   **AI (Out-of-Distribution Data):** When fed prompts completely outside its training distribution, the AI's internal representation collapses into chaotic guesswork.
*   **Brain (Sensory Deprivation):** When isolated in a dark, silent anechoic chamber, the human brain begins generating its own stimuli—causing vivid geometric hallucinations and phantom noises to compensate for the lack of input.
</details>

<details>
<summary><b>🔁 Infinite Loops / Overfitting</b> (Click to expand)</summary>
<br>

*   **AI (Repetition / Overfitting):** Heavy reinforcement on a specific corpus can cause an AI to get "stuck" generating the exact same phrase infinitely.
*   **Brain (OCD / Rumination):** The biological equivalent of overfitting; neural pathways become hyper-reinforced, keeping the brain stuck in compulsive logical or emotional loops.
</details>

<details>
<summary><b>🎯 False Certainty</b> (Click to expand)</summary>
<br>

*   **AI (High Confidence Errors):** Softmax functions force a neural network to choose a token. When the internal probabilities are chaotic, the network might still output a totally incorrect fact with 99.9% statistical confidence.
*   **Brain (False Memories):** Every time a biological memory is recalled, it is fundamentally rewritten. The brain confidently inserts fabricated details into childhood memories.
</details>

---

## 🎮 Key Features & Interactive Scenarios

Our application is built entirely as an interactive HUD. You have full `OrbitControls` to rotate, zoom, and pan around the neural anatomy.

### 🌐 Dual 3D Environments
1. **The AI Neural Network**: Visualized as a multi-layer perceptron. Data tokens (cyan particles) flow through hidden layers. During hallucinations, the pathways ignite in bright red and orange, demonstrating math breaking down.
2. **The Human Brain Model**: Featuring 8 distinct functional lobes. Watch as the amygdala (stress center) pulses violently, hijacking the prefrontal cortex during "Stress Overload" scenarios.

### 🎛️ Real-Time Parameter Sliders
Dynamically break the simulation yourself!
*   **AI Variables**: Adjust `Data Noise`, `Training Quality`, and `Context Window`.
*   **Brain Variables**: Manipulate human `Stress Levels`, `Fatigue`, and `Sensory Input`.

### ⏱️ 16 Pre-Made Interactive Simulations
Trigger comprehensive 30-second simulations that alter the 3D models and generative audio:
*   *AI Scenarios:* Prompt Injections, Overfitting Loops, Context Window Overflows.
*   *Brain Scenarios:* Sleep Deprivation Misfires, High Fever Delirium, Hypnagogic (Sleep-Transition) Hallucinations.

---

## 🛠️ Technical Architecture

This application was built for **maximum performance and visual fidelity** without relying on heavy frameworks like React or Vue. 

*   **Renderer:** Pure **Three.js** `WebGLRenderer` configured with ACES Filmic Tone Mapping and dense fog for a cinematic, volumetric look.
*   **Components:** Node geometries, BufferGeometry lines, and Points (particles) update at 60Hz.
*   **Audio Engine:** Built entirely from scratch using the native Javascript `Web Audio API`. It dynamically generates ambient frequency drones and modulates distortion/glitch nodes in real-time based mathematically on the active `hallucination_level` of the 3D objects.
*   **UI/CSS:** A minimal glassmorphism dashboard styled strictly with Vanilla CSS, featuring sharp 4px vector corners and monospace technical readouts.

---

## 🤝 Contributing

Fascinated by neural networks or cognitive science? We'd love your contributions! 
*   **New Scenarios:** Fork the repo and add new cognitive errors to `src/scenarios.js`.
*   **New Shaders:** Implement custom GLSL shaders to improve the "glitch" aesthetic of hallucinating nodes. 

Feel free to open an Issue or submit a Pull Request.
