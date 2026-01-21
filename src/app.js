import { loadAnswers, saveAnswers, clearAnswers } from "./lib/storage.js";
import { pickRoute } from "./lib/rulesEngine.js";

const appEl = document.getElementById("app");
const progressBar = document.getElementById("progressBar");
const resetBtn = document.getElementById("resetBtn");

async function fetchJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar ${path}`);
  return await res.json();
}

function setProgress(currentIndex, total) {
  const pct = Math.round(((currentIndex) / total) * 100);
  progressBar.style.width = `${pct}%`;
}

function renderQuestion({ title, help, options }, qIndex, total, onPick) {
  setProgress(qIndex, total);

  appEl.innerHTML = `
    <h1 class="h1">${title}</h1>
    <p class="p">${help ?? ""}</p>
    <div class="grid" id="options"></div>
    <div class="row">
      <span class="pill">Paso ${qIndex + 1} de ${total}</span>
    </div>
  `;

  const optionsEl = document.getElementById("options");
  for (const opt of options) {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.type = "button";
    btn.textContent = opt.label;
    btn.addEventListener("click", () => onPick(opt.id));
    optionsEl.appendChild(btn);
  }
}

function renderBridge(bridge) {
  // 100% en español, puente editable via JSON
  setProgress(4, 4);

  appEl.innerHTML = `
    <h1 class="h1">${bridge.title}</h1>
    <p class="p">${bridge.summary}</p>

    <hr />

    <div class="row">
      <a class="cta" href="${bridge.href}">${bridge.ctaLabel}</a>
    </div>

  `;
}

function renderError(msg) {
  appEl.innerHTML = `
    <h1 class="h1">Ups</h1>
    <p class="p">${msg}</p>
    <div class="row">
      <button class="btn" id="reloadBtn" type="button">Reintentar</button>
    </div>
  `;
  document.getElementById("reloadBtn").addEventListener("click", () => init());
}

async function init() {
  try {
    const [codex, rulesDoc, bridgeDoc] = await Promise.all([
      fetchJSON("./data/codex1.es.json"),
      fetchJSON("./data/routing.rules.json"),
      fetchJSON("./data/bridge.copy.es.json")
    ]);

    const questions = codex.questions;
    const total = questions.length;

    let answers = loadAnswers();
    // Decide qué pregunta sigue según lo ya respondido
    let nextIndex = questions.findIndex(q => answers[q.id] == null);
    if (nextIndex === -1) {
      // Ya está completo: calcula ruta y muestra puente
      const route = pickRoute(rulesDoc, answers);
      const bridge = bridgeDoc.routes[route] || bridgeDoc.routes[rulesDoc.fallback];
      renderBridge(bridge);
      return;
    }

    const q = questions[nextIndex];
    renderQuestion(q, nextIndex, total, (pickedId) => {
      answers = { ...answers, [q.id]: pickedId };
      saveAnswers(answers);

      // Avanza
      nextIndex += 1;
      if (nextIndex >= total) {
        const route = pickRoute(rulesDoc, answers);
        const bridge = bridgeDoc.routes[route] || bridgeDoc.routes[rulesDoc.fallback];
        renderBridge(bridge);
        return;
      }
      const nq = questions[nextIndex];
      renderQuestion(nq, nextIndex, total, (pid) => {
        answers = { ...answers, [nq.id]: pid };
        saveAnswers(answers);
        init(); // recalcula siguiente y/o puente
      });
    });

  } catch (e) {
    renderError(e?.message || "Error cargando el Codex.");
  }
}

resetBtn.addEventListener("click", () => {
  clearAnswers();
  init();
});

init();
