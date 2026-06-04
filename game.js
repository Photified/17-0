"use strict";

const ROSTER_SLOTS = ["QB", "RB", "WR1", "WR2", "DEF"];

const slotLabels = {
  QB: "Quarterback",
  RB: "Running Back",
  WR1: "Wide Receiver 1",
  WR2: "Wide Receiver 2",
  DEF: "Defense"
};

const POSITION_TO_SLOTS = {
  QB: ["QB"],
  RB: ["RB"],
  WR: ["WR1", "WR2"],
  DEF: ["DEF"]
};

const ROLL_TICKS = 24;
const ROLL_INTERVAL_MS = 70;

let roster = {};
let rerollUsed = false;
let lastResultText = "";
let currentRoll = null;
let isRolling = false;
let deferredInstallPrompt = null;

const screens = {
  intro: document.getElementById("introScreen"),
  draft: document.getElementById("draftScreen"),
  result: document.getElementById("resultScreen")
};

const startBtn = document.getElementById("startBtn");
const rollBtn = document.getElementById("rollBtn");
const rerollBtn = document.getElementById("rerollBtn");
const simulateBtn = document.getElementById("simulateBtn");
const restartBtn = document.getElementById("restartBtn");
const shareBtn = document.getElementById("shareBtn");
const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const draftInstruction = document.getElementById("draftInstruction");
const rerollPill = document.getElementById("rerollPill");
const installBtn = document.getElementById("installBtn");
const installHelpText = document.getElementById("installHelpText");

const recordText = document.getElementById("recordText");
const resultSummary = document.getElementById("resultSummary");
const offenseRating = document.getElementById("offenseRating");
const defenseRating = document.getElementById("defenseRating");
const balanceRating = document.getElementById("balanceRating");
const totalRating = document.getElementById("totalRating");
const finalRoster = document.getElementById("finalRoster");

let rollPanel = null;
let rollTitle = null;
let rollSubline = null;
let rollChoices = null;

startBtn.addEventListener("click", startDraft);
rollBtn.addEventListener("click", rollBoard);
rerollBtn.addEventListener("click", rerollBoard);
simulateBtn.addEventListener("click", simulateSeason);
restartBtn.addEventListener("click", restartGame);
shareBtn.addEventListener("click", copyResult);
helpBtn.addEventListener("click", openHelp);

document.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", closeHelp);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeHelp();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallButton();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateInstallButton(true);
});

if (installBtn) {
  installBtn.addEventListener("click", installApp);
}

updateInstallButton();

function installApp() {
  if (!deferredInstallPrompt) {
    if (installHelpText) installHelpText.hidden = false;
    return;
  }
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.finally(() => {
    deferredInstallPrompt = null;
    updateInstallButton();
  });
}

function updateInstallButton(installed = false) {
  if (!installBtn) return;
  if (installed) {
    installBtn.hidden = true;
    if (installHelpText) {
      installHelpText.hidden = false;
      installHelpText.textContent = "App installed.";
    }
    return;
  }
  if (deferredInstallPrompt) {
    installBtn.hidden = false;
    installBtn.disabled = false;
    if (installHelpText) installHelpText.hidden = true;
  } else {
    installBtn.hidden = true;
  }
}

function startDraft() {
  roster = {};
  rerollUsed = false;
  lastResultText = "";
  currentRoll = null;
  isRolling = false;

  ensureRollPanel();
  resetSlotCards();
  resetRollPanel();

  draftInstruction.textContent = "Roll a team franchise to start building your roster.";
  showScreen("draft");
  updateDraftControls();
}

function restartGame() {
  startDraft();
}

function showScreen(screenName) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[screenName].classList.add("active");
}

function ensureRollPanel() {
  const container = document.getElementById("draftMainContent");
  if (!container) return;

  if (document.getElementById("rollPanel")) {
    rollPanel = document.getElementById("rollPanel");
    rollTitle = document.getElementById("rollTitle");
    rollSubline = document.getElementById("rollSubline");
    rollChoices = document.getElementById("rollChoices");
    return;
  }

  rollPanel = document.createElement("section");
  rollPanel.id = "rollPanel";
  rollPanel.className = "roll-panel";
  rollPanel.innerHTML = `
    <div class="roll-panel-top" id="rollPanelTop">
      <div>
        <div class="roll-kicker">Current Roll</div>
        <h3 id="rollTitle">Ready</h3>
        <p id="rollSubline">Roll to reveal a team franchise.</p>
      </div>
    </div>
    <div id="rollChoices" class="roll-choices"></div>
  `;

  container.appendChild(rollPanel);

  const rollPanelTop = document.getElementById("rollPanelTop");
  const draftActions = document.querySelector(".draft-actions");
  if (rollPanelTop && draftActions) {
    draftActions.style.display = "flex";
    rollPanelTop.appendChild(draftActions);
  }

  rollTitle = document.getElementById("rollTitle");
  rollSubline = document.getElementById("rollSubline");
  rollChoices = document.getElementById("rollChoices");
  injectRollPanelStyles();
}

function injectRollPanelStyles() {
  if (document.getElementById("rollPanelStyles")) return;
  const style = document.createElement("style");
  style.id = "rollPanelStyles";
  style.textContent = `
    .roll-panel { margin: 18px 0 0; padding: 18px; border: 1px solid var(--border); border-radius: var(--radius); background: linear-gradient(160deg, rgba(23, 57, 35, 0.94), rgba(10, 26, 17, 0.94)), radial-gradient(circle at top right, rgba(247, 201, 72, 0.12), transparent 14rem); box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28); }
    .roll-panel.rolling { animation: rollPanelPulse 0.35s infinite alternate; }
    @keyframes rollPanelPulse { from { transform: translateY(0); box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28); } to { transform: translateY(-3px); box-shadow: 0 20px 44px rgba(55, 214, 122, 0.24); } }
    .roll-panel-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 14px; }
    .roll-kicker { margin-bottom: 6px; color: var(--gold); font-size: 0.78rem; font-weight: 1000; text-transform: uppercase; letter-spacing: 0.1em; }
    #rollTitle { margin: 0 0 6px; font-size: clamp(1.8rem, 5vw, 3.2rem); line-height: 0.95; letter-spacing: -0.06em; }
    #rollSubline { margin: 0; color: var(--muted); line-height: 1.35; }
    .roll-choices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .roll-empty { grid-column: 1 / -1; padding: 14px; border: 1px dashed var(--border); border-radius: var(--radius-sm); color: var(--muted); background: rgba(255, 255, 255, 0.045); }
    .pick-card { display: flex; flex-direction: column; justify-content: space-between; gap: 10px; padding: 13px; border: 1px solid rgba(247, 201, 72, 0.22); border-radius: var(--radius-sm); background: rgba(255, 255, 255, 0.06); }
    .pick-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .pick-card h4 { margin: 0; font-size: 1rem; line-height: 1.12; letter-spacing: -0.03em; }
    .pick-meta { color: var(--muted); font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; margin-top: 2px; }
    .pick-tag { display: inline-flex; flex-shrink: 0; padding: 4px 7px; border-radius: 4px; color: var(--gold); background: rgba(247, 201, 72, 0.09); border: 1px solid rgba(247, 201, 72, 0.22); font-size: 0.7rem; font-weight: 1000; text-transform: uppercase; }
    .fill-buttons { display: flex; flex-wrap: wrap; gap: 7px; margin-top: auto; }
    .fill-btn { flex: 1 1 auto; min-width: 80px; padding: 9px 10px; border: 0; border-radius: 4px; color: #061008; background: linear-gradient(180deg, var(--gold), var(--gold-2)); font-size: 0.78rem; font-weight: 1000; }
    .fill-btn:hover, .fill-btn:focus-visible { transform: translateY(-1px); outline: none; }
    @media (max-width: 980px) { .roll-choices { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 620px) { 
      .roll-choices { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } 
      .pick-card { padding: 10px; gap: 8px; }
      .pick-card-header { flex-direction: column; gap: 4px; }
      .pick-card h4 { font-size: 0.85rem; }
      .pick-meta { font-size: 0.65rem; }
      .pick-tag { font-size: 0.6rem; padding: 3px 5px; }
      .fill-buttons { gap: 5px; }
      .fill-btn { font-size: 0.7rem; padding: 7px; min-width: 0; }
    }
  `;
  document.head.appendChild(style);
}

function resetRollPanel() {
  rollPanel.classList.remove("rolling");
  rollTitle.textContent = "Ready";
  rollSubline.textContent = "Roll to reveal a team franchise.";
  rollChoices.innerHTML = `<div class="roll-empty">History options will appear here after the roll.</div>`;
}

function resetSlotCards() {
  ROSTER_SLOTS.forEach((slot) => {
    const card = getSlotCard(slot);
    card.className = "slot-card empty";
    card.innerHTML = `
      <div class="slot-label">${slot}</div>
      <div class="slot-content">
        <h3>${slotLabels[slot]}</h3>
        <p>Waiting...</p>
      </div>
    `;
  });
}

function getSlotCard(slot) {
  return document.querySelector(`[data-slot="${slot}"]`);
}

function getOpenSlots() {
  return ROSTER_SLOTS.filter((slot) => !roster[slot]);
}

function draftComplete() {
  return getOpenSlots().length === 0;
}

function getOpenSlotsForPlayer(player) {
  const possibleSlots = POSITION_TO_SLOTS[player.slot] || [];
  return possibleSlots.filter((slot) => !roster[slot]);
}

function rollBoard() {
  if (draftComplete() || currentRoll || isRolling) return;
  
  const finalRoll = getRandomRoll();
  const rollSequence = buildRollSequence(finalRoll);
  
  currentRoll = null;
  isRolling = true;
  rollChoices.innerHTML = `<div class="roll-empty">Rolling Teams...</div>`;
  rollPanel.classList.add("rolling");
  draftInstruction.textContent = "Selecting random franchise...";
  updateDraftControls();

  let tick = 0;
  const timer = window.setInterval(() => {
    const roll = rollSequence[tick];
    rollTitle.textContent = roll.value;
    rollSubline.textContent = "Rolling...";
    tick += 1;
    if (tick >= rollSequence.length) {
      window.clearInterval(timer);
      landRoll(finalRoll);
    }
  }, ROLL_INTERVAL_MS);
}

function buildRollSequence(finalRoll) {
  const options = getTeams();
  const sequence = [];
  for (let i = 0; i < ROLL_TICKS - 1; i += 1) {
    sequence.push({ type: "Team", value: randomItem(options) });
  }
  sequence.push(finalRoll);
  return sequence;
}

function landRoll(roll) {
  const candidates = getCandidatesForRoll(roll);
  currentRoll = { type: roll.type, value: roll.value, candidates };
  isRolling = false;
  rollPanel.classList.remove("rolling");
  rollTitle.textContent = roll.value;
  rollSubline.textContent = "Select any historical asset from this franchise timeline to fill an open position.";
  renderChoices(candidates);
  draftInstruction.textContent = `Landed on the ${roll.value}. Pick from their history below.`;
  updateDraftControls();
}

function rerollBoard() {
  if (rerollUsed || draftComplete() || isRolling || !currentRoll) return;
  rerollUsed = true;
  currentRoll = null;
  resetRollPanel();
  updateDraftControls();
  rollBoard();
}

function getRandomRoll() {
  return { type: "Team", value: randomItem(getTeams()) };
}

function getTeams() {
  return uniqueValues(playerPool.map((player) => player.team));
}

function getCandidatesForRoll(roll) {
  const eligible = playerPool.filter((player) => getOpenSlotsForPlayer(player).length > 0);
  
  const franchiseMatches = eligible
    .filter((player) => player.team === roll.value)
    .map((player) => ({ ...player, matchType: "" }));

  let candidates = dedupePlayers(franchiseMatches).sort((a, b) => a.season - b.season);
  return candidates;
}

function renderChoices(candidates) {
  if (!candidates.length) {
    rollChoices.innerHTML = `<div class="roll-empty">No valid choices left on this team for your remaining open positions. Roll again!</div>`;
    return;
  }
  rollChoices.innerHTML = candidates.map((pick, index) => {
    const openSlots = getOpenSlotsForPlayer(pick);
    return `
      <article class="pick-card">
        <div class="pick-card-header">
          <div>
            <h4>${escapeHtml(pick.name)}</h4>
            <div class="pick-meta">${escapeHtml(pick.slot)} · ${escapeHtml(pick.team)}</div>
          </div>
          <span class="pick-tag">${escapeHtml(String(pick.season))}</span>
        </div>
        <div class="fill-buttons">
          ${openSlots.map((slot) => `
            <button class="fill-btn" type="button" data-choice-index="${index}" data-fill-slot="${slot}">Fill ${escapeHtml(slot)}</button>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");

  rollChoices.querySelectorAll("[data-choice-index][data-fill-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-choice-index"));
      const slot = button.getAttribute("data-fill-slot");
      selectCandidate(index, slot);
    });
  });
}

function selectCandidate(index, slotToFill) {
  if (!currentRoll) return;
  const pick = currentRoll.candidates[index];
  if (!pick) return;
  const openSlots = getOpenSlotsForPlayer(pick);
  if (!openSlots.includes(slotToFill)) return;

  roster[slotToFill] = pick;
  renderLockedSlot(slotToFill, pick);
  currentRoll = null;
  resetRollPanel();

  if (draftComplete()) {
    draftInstruction.textContent = "Draft complete. Simulate the season!";
  } else {
    draftInstruction.textContent = "Selection locked. Roll for your next franchise.";
  }
  updateDraftControls();
}

function renderLockedSlot(slot, pick) {
  const card = getSlotCard(slot);
  card.className = "slot-card";
  card.innerHTML = `
    <div class="slot-label">${slot}</div>
    <div class="slot-content">
      <h3 class="player-name">${escapeHtml(pick.name)}</h3>
      <div class="player-meta">${escapeHtml(pick.slot)} · ${escapeHtml(String(pick.season))}</div>
      ${renderStats(pick.stats)}
    </div>
  `;
}

function renderStats(stats) {
  return `
    <div class="stat-list">
      ${Object.entries(stats).map(([label, value]) => `
        <div class="stat-line"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>
      `).join("")}
    </div>
  `;
}

function updateDraftControls() {
  const complete = draftComplete();
  const hasActiveRoll = Boolean(currentRoll);
  
  rollBtn.disabled = complete || hasActiveRoll || isRolling;
  rerollBtn.disabled = complete || rerollUsed || !hasActiveRoll || isRolling;
  simulateBtn.disabled = !complete || isRolling;

  if (complete) {
    simulateBtn.style.display = "inline-block";
    rollBtn.style.display = "none";
    rerollBtn.style.display = "none";
  } else {
    simulateBtn.style.display = "none";
    rollBtn.style.display = "inline-block";
    rerollBtn.style.display = "inline-block";
  }

  if (rerollUsed) {
    rerollPill.textContent = "Re-roll Used";
    rerollPill.classList.add("used");
  } else {
    rerollPill.textContent = "Re-roll Available";
    rerollPill.classList.remove("used");
  }
}

function simulateSeason() {
  if (!draftComplete()) return;
  const result = calculateSeason(roster);
  recordText.textContent = `${result.wins}-${result.losses}`;
  resultSummary.textContent = result.summary;
  offenseRating.textContent = result.offense;
  defenseRating.textContent = result.defense;
  balanceRating.textContent = result.balance;
  totalRating.textContent = result.total;
  renderFinalRoster(result);
  lastResultText = buildShareText(result);
  showScreen("result");
}

function calculateSeason(currentRoster) {
  const qb = currentRoster.QB;
  const rb = currentRoster.RB;
  const wr1 = currentRoster.WR1;
  const wr2 = currentRoster.WR2;
  const def = currentRoster.DEF;

  const qbScore = qb.rating;
  const rbScore = rb.rating;
  const wr1Score = wr1.rating;
  const wr2Score = wr2.rating;
  const defScore = def.rating;

  const offenseRaw = qbScore * 0.40 + rbScore * 0.20 + wr1Score * 0.22 + wr2Score * 0.18;
  const passGame = (qbScore + wr1Score + wr2Score) / 3;
  const runGame = rbScore;
  
  const balance = clamp(Math.round(100 - Math.abs(passGame - runGame) * 0.78), 60, 100);
  const balanceBonus = (balance - 88) * 0.15;

  const offense = clamp(Math.round(offenseRaw + balanceBonus), 60, 100);
  const defense = clamp(Math.round(defScore), 60, 100);
  
  const sameTeamBonus = calculateSameTeamBonus(currentRoster);
  
  const eras = [qb.era, rb.era, wr1.era, wr2.era, def.era];
  const uniqueEras = new Set(eras).size;
  const eraClashPenalty = uniqueEras >= 4 ? 3.5 : (uniqueEras === 3 ? 1.5 : 0);

  const totalBeforeVolatility = offense * 0.55 + defense * 0.35 + balance * 0.10 + sameTeamBonus - eraClashPenalty;
  
  const volatility = randomBetween(-4.5, 3.5);
  const rerollTax = rerollUsed ? 1.0 : 0;

  const total = clamp(Math.round(totalBeforeVolatility + volatility - rerollTax), 50, 100);
  const wins = scoreToWins(total, offense, defense, balance);
  return { wins, losses: 17 - wins, offense, defense, balance, total, qbScore, rbScore, wr1Score, wr2Score, defScore, summary: getResultSummary(wins, offense, defense, balance, sameTeamBonus), roster: currentRoster };
}

function calculateSameTeamBonus(currentRoster) {
  const teams = [currentRoster.QB.team, currentRoster.RB.team, currentRoster.WR1.team, currentRoster.WR2.team, currentRoster.DEF.team];
  const counts = {};
  teams.forEach((team) => { counts[team] = (counts[team] || 0) + 1; });
  const max = Math.max(...Object.values(counts));
  if (max >= 4) return 3.5; 
  if (max === 3) return 1.8;
  if (max === 2) return 0.5;
  return 0;
}

function scoreToWins(total, offense, defense, balance) {
  let wins;
  if (total < 75) wins = weightedRandom([[4,10],[5,20],[6,25],[7,25],[8,20]]);
  else if (total < 82) wins = weightedRandom([[7,5],[8,15],[9,25],[10,30],[11,20],[12,5]]);
  else if (total < 88) wins = weightedRandom([[10,10],[11,20],[12,30],[13,25],[14,15]]);
  else if (total < 93) wins = weightedRandom([[12,10],[13,25],[14,35],[15,20],[16,10]]);
  else if (total < 96) wins = weightedRandom([[13,5],[14,20],[15,45],[16,30]]);
  else wins = weightedRandom([[15,15],[16,50],[17,35]]); 

  if (wins === 17 && !(offense >= 96 && defense >= 94 && balance >= 88)) wins = 16;
  if (wins === 16 && !(offense >= 92 && defense >= 90 && balance >= 84)) wins = 15;
  
  return clamp(wins, 0, 17);
}

function weightedRandom(weightedOptions) {
  const totalWeight = weightedOptions.reduce((sum, option) => sum + option[1], 0);
  let random = Math.random() * totalWeight;
  for (const [value, weight] of weightedOptions) {
    random -= weight;
    if (random <= 0) return value;
  }
  return weightedOptions[weightedOptions.length - 1][0];
}

function getResultSummary(wins, offense, defense, balance, sameTeamBonus) {
  if (wins === 17) return "Perfection. Your roster had legendary star power, flawless execution, and defensive dominance to survive the grueling schedule.";
  if (wins === 16) return "Painfully close. This is a monster roster, but a single mistimed turnover cost you a flawless record.";
  if (wins >= 14) return "Elite season. Your team is a heavy playoff contender, though the simulator found a vulnerability along the way.";
  if (wins >= 11) return "Solid playoff team. Good individual stars, but lack of pristine structural balance or identical franchise links caught up to you.";
  if (wins >= 8) return "Mediocre finish. Stacking stars from random eras without pristine run-pass balance caps your ceiling.";
  return "Disastrous breakdown. Even big names can crumble under bad layout chemistry and poor weekly execution.";
}

function renderFinalRoster(result) {
  const rows = [
    ["QB", result.roster.QB, result.qbScore], 
    ["RB", result.roster.RB, result.rbScore], 
    ["WR1", result.roster.WR1, result.wr1Score], 
    ["WR2", result.roster.WR2, result.wr2Score], 
    ["DEF", result.roster.DEF, result.defScore]
  ];
  
  finalRoster.innerHTML = rows.map(([slot, pick, score]) => `
    <div class="final-row accordion-row">
      <div class="final-row-header">
        <div class="pos">${slot}</div>
        <div class="info">
          <div class="name">${escapeHtml(pick.name)}</div>
          <div class="player-meta">${escapeHtml(pick.slot)} · ${escapeHtml(pick.team)} · ${escapeHtml(String(pick.season))}</div>
        </div>
        <div class="score-wrap">
          <div class="score">${score}</div>
          <svg class="chevron" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      <div class="final-row-body">
        ${renderStats(pick.stats)}
      </div>
    </div>
  `).join("");

  const accordions = finalRoster.querySelectorAll('.accordion-row');
  accordions.forEach(acc => {
    acc.addEventListener('click', () => {
      acc.classList.toggle('expanded');
    });
  });
}

function buildShareText(result) {
  return [`17-0 Result: ${result.wins}-${result.losses}`, "", `QB: ${result.roster.QB.name} (${result.roster.QB.season})`, `RB: ${result.roster.RB.name} (${result.roster.RB.season})`, `WR1: ${result.roster.WR1.name} (${result.roster.WR1.season})`, `WR2: ${result.roster.WR2.name} (${result.roster.WR2.season})`, `DEF: ${result.roster.DEF.name}`, "", `Offense: ${result.offense}`, `Defense: ${result.defense}`, `Balance: ${result.balance}`, `Total: ${result.total}`].join("\n");
}

async function copyResult() {
  if (!lastResultText) return;
  try {
    await navigator.clipboard.writeText(lastResultText);
    shareBtn.textContent = "Copied!";
  } catch (error) {
    shareBtn.textContent = "Copy Failed";
  }
  setTimeout(() => { shareBtn.textContent = "Copy Result"; }, 1400);
}

function openHelp() { helpModal.classList.remove("hidden"); helpModal.setAttribute("aria-hidden", "false"); updateInstallButton(); }
function closeHelp() { helpModal.classList.add("hidden"); helpModal.setAttribute("aria-hidden", "true"); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function uniqueValues(values) { return [...new Set(values)]; }
function randomItem(array) { return array[Math.floor(Math.random() * array.length)]; }
function randomBetween(min, max) { return Math.random() * (max - min) + min; }
function shuffleArray(array) { const copy = [...array]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function dedupePlayers(items) { const seen = new Set(); const clean = []; items.forEach((item) => { const key = `${item.slot}|${item.name}|${item.team}|${item.season}`; if (!seen.has(key)) { seen.add(key); clean.push(item); } }); return clean; }
function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }