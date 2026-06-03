"use strict";

/*
  17-0 game.js

  Requires players.js loaded first:
  window.NFL17_PLAYERS.playerPool

  Main changes:
  - Player data lives in players.js
  - Lineup stays separate from roll choices
  - Visual era/team roll animation
  - Choices do NOT show stats or overall before selecting
  - Player can fill any still-open compatible slot
  - WR choices show Fill WR1 / Fill WR2 when both are open
*/

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

const MIN_CHOICES = 8;
const MAX_CHOICES = 12;
const ROLL_TICKS = 24;
const ROLL_INTERVAL_MS = 70;

const playerPool = window.NFL17_PLAYERS.playerPool;

let roster = {};
let rerollUsed = false;
let lastResultText = "";
let currentRoll = null;
let isRolling = false;

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

function startDraft() {
  roster = {};
  rerollUsed = false;
  lastResultText = "";
  currentRoll = null;
  isRolling = false;

  ensureRollPanel();
  resetSlotCards();
  resetRollPanel();

  draftInstruction.textContent = "Roll an era and team to start building your roster.";
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
  if (document.getElementById("rollPanel")) {
    rollPanel = document.getElementById("rollPanel");
    rollTitle = document.getElementById("rollTitle");
    rollSubline = document.getElementById("rollSubline");
    rollChoices = document.getElementById("rollChoices");
    return;
  }

  const slotsGrid = document.querySelector(".slots-grid");
  const draftScreen = screens.draft;

  rollPanel = document.createElement("section");
  rollPanel.id = "rollPanel";
  rollPanel.className = "roll-panel";

  rollPanel.innerHTML = `
    <div class="roll-panel-top">
      <div>
        <div class="roll-kicker">Current Roll</div>
        <h3 id="rollTitle">Ready</h3>
        <p id="rollSubline">Roll to reveal an era and team.</p>
      </div>
    </div>
    <div id="rollChoices" class="roll-choices"></div>
  `;

  if (slotsGrid && draftScreen) {
    draftScreen.insertBefore(rollPanel, slotsGrid);
  } else if (draftScreen) {
    draftScreen.appendChild(rollPanel);
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
    .roll-panel {
      margin: 0 0 18px;
      padding: 18px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background:
        linear-gradient(160deg, rgba(23, 57, 35, 0.94), rgba(10, 26, 17, 0.94)),
        radial-gradient(circle at top right, rgba(247, 201, 72, 0.12), transparent 14rem);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
    }

    .roll-panel.rolling {
      animation: rollPanelPulse 0.35s infinite alternate;
    }

    @keyframes rollPanelPulse {
      from {
        transform: translateY(0);
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
      }

      to {
        transform: translateY(-3px);
        box-shadow: 0 20px 44px rgba(55, 214, 122, 0.24);
      }
    }

    .roll-panel-top {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 14px;
    }

    .roll-kicker {
      margin-bottom: 6px;
      color: var(--gold);
      font-size: 0.78rem;
      font-weight: 1000;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    #rollTitle {
      margin: 0 0 6px;
      font-size: clamp(1.8rem, 5vw, 3.2rem);
      line-height: 0.95;
      letter-spacing: -0.06em;
    }

    #rollSubline {
      margin: 0;
      color: var(--muted);
      line-height: 1.35;
    }

    .roll-choices {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .roll-empty {
      padding: 14px;
      border: 1px dashed var(--border);
      border-radius: var(--radius-sm);
      color: var(--muted);
      background: rgba(255, 255, 255, 0.045);
    }

    .pick-card {
      display: grid;
      gap: 10px;
      padding: 13px;
      border: 1px solid rgba(247, 201, 72, 0.22);
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.06);
    }

    .pick-card h4 {
      margin: 0;
      font-size: 1rem;
      line-height: 1.12;
      letter-spacing: -0.03em;
    }

    .pick-meta {
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .pick-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .pick-tag {
      display: inline-flex;
      width: fit-content;
      padding: 4px 7px;
      border-radius: 999px;
      color: var(--gold);
      background: rgba(247, 201, 72, 0.09);
      border: 1px solid rgba(247, 201, 72, 0.22);
      font-size: 0.66rem;
      font-weight: 1000;
      text-transform: uppercase;
    }

    .fill-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }

    .fill-btn {
      flex: 1 1 auto;
      min-width: 92px;
      padding: 9px 10px;
      border: 0;
      border-radius: 999px;
      color: #061008;
      background: linear-gradient(180deg, var(--gold), var(--gold-2));
      font-size: 0.78rem;
      font-weight: 1000;
    }

    .fill-btn:hover,
    .fill-btn:focus-visible {
      transform: translateY(-1px);
      outline: none;
    }

    @media (max-width: 760px) {
      .roll-choices {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}

function resetRollPanel() {
  rollPanel.classList.remove("rolling");
  rollTitle.textContent = "Ready";
  rollSubline.textContent = "Roll to reveal an era and team.";
  rollChoices.innerHTML = `<div class="roll-empty">Choices will appear here after the roll.</div>`;
}

function resetSlotCards() {
  ROSTER_SLOTS.forEach((slot) => {
    const card = getSlotCard(slot);
    card.className = "slot-card empty";
    card.innerHTML = `
      <div class="slot-label">${slot}</div>
      <div class="slot-content">
        <h3>${slotLabels[slot]}</h3>
        <p>Open slot. Waiting for selection...</p>
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

  rollChoices.innerHTML = `<div class="roll-empty">Rolling...</div>`;
  rollPanel.classList.add("rolling");
  draftInstruction.textContent = "Rolling era and team...";
  updateDraftControls();

  let tick = 0;

  const timer = window.setInterval(() => {
    const roll = rollSequence[tick];

    rollTitle.textContent = `${roll.era} · ${roll.team}`;
    rollSubline.textContent = "Rolling...";

    tick += 1;

    if (tick >= rollSequence.length) {
      window.clearInterval(timer);
      landRoll(finalRoll);
    }
  }, ROLL_INTERVAL_MS);
}

function buildRollSequence(finalRoll) {
  const eras = getEras();
  const teams = getTeams();
  const sequence = [];

  for (let i = 0; i < ROLL_TICKS - 1; i += 1) {
    sequence.push({
      era: randomItem(eras),
      team: randomItem(teams)
    });
  }

  sequence.push(finalRoll);
  return sequence;
}

function landRoll(roll) {
  const candidates = getCandidatesForRoll(roll.team, roll.era);

  currentRoll = {
    team: roll.team,
    era: roll.era,
    candidates
  };

  isRolling = false;
  rollPanel.classList.remove("rolling");

  rollTitle.textContent = `${roll.era} · ${roll.team}`;
  rollSubline.textContent = "Select a player or unit, then choose which open slot to fill.";

  renderChoices(candidates);

  draftInstruction.textContent = `Roll landed on ${roll.era} · ${roll.team}. Pick from the roll panel.`;
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
  return {
    era: randomItem(getEras()),
    team: randomItem(getTeams())
  };
}

function getEras() {
  return uniqueValues(playerPool.map((player) => player.era));
}

function getTeams() {
  return uniqueValues(playerPool.map((player) => player.team));
}

function getCandidatesForRoll(team, era) {
  const eligible = playerPool.filter((player) => getOpenSlotsForPlayer(player).length > 0);

  const exact = eligible
    .filter((player) => player.team === team && player.era === era)
    .map((player) => ({ ...player, matchType: "Exact" }));

  const sameTeam = eligible
    .filter((player) => player.team === team && player.era !== era)
    .map((player) => ({ ...player, matchType: "Team" }));

  const sameEra = eligible
    .filter((player) => player.era === era && player.team !== team)
    .map((player) => ({ ...player, matchType: "Era" }));

  const wildcards = eligible
    .filter((player) => player.team !== team && player.era !== era)
    .map((player) => ({ ...player, matchType: "Wildcard" }));

  let candidates = dedupePlayers([
    ...takeRandomWeighted(exact, 5),
    ...takeRandomWeighted(sameTeam, 4),
    ...takeRandomWeighted(sameEra, 4)
  ]);

  if (candidates.length < MIN_CHOICES) {
    candidates = dedupePlayers([
      ...candidates,
      ...takeRandomWeighted(wildcards, MIN_CHOICES - candidates.length)
    ]);
  }

  if (candidates.length < MIN_CHOICES) {
    candidates = dedupePlayers([
      ...candidates,
      ...takeRandomWeighted(
        eligible.map((player) => ({ ...player, matchType: "Fallback" })),
        MIN_CHOICES - candidates.length
      )
    ]);
  }

  return shuffleArray(candidates).slice(0, MAX_CHOICES);
}

function renderChoices(candidates) {
  if (!candidates.length) {
    rollChoices.innerHTML = `<div class="roll-empty">No valid choices for the remaining open slots. Roll again.</div>`;
    return;
  }

  rollChoices.innerHTML = candidates.map((pick, index) => {
    const openSlots = getOpenSlotsForPlayer(pick);

    return `
      <article class="pick-card">
        <div>
          <h4>${escapeHtml(pick.name)}</h4>
          <div class="pick-meta">
            ${escapeHtml(pick.slot)} · ${escapeHtml(pick.team)} · ${escapeHtml(pick.era)}
          </div>
        </div>
        <div class="pick-tags">
          <span class="pick-tag">${escapeHtml(pick.matchType)}</span>
          <span class="pick-tag">${escapeHtml(String(pick.season))}</span>
        </div>
        <div class="fill-buttons">
          ${openSlots.map((slot) => `
            <button class="fill-btn" type="button" data-choice-index="${index}" data-fill-slot="${slot}">
              Fill ${escapeHtml(slot)}
            </button>
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
    draftInstruction.textContent = "Draft complete. Simulate the season.";
  } else {
    draftInstruction.textContent = "Selection locked. Roll again for your next open slot.";
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
      <div class="player-meta">
        ${escapeHtml(pick.slot)} · ${escapeHtml(pick.team)} · ${escapeHtml(pick.era)} · ${escapeHtml(String(pick.season))}
      </div>
      <p>${slotLabels[slot]} locked.</p>
      ${renderStats(pick.stats)}
    </div>
  `;
}

function renderStats(stats) {
  return `
    <div class="stat-list">
      ${Object.entries(stats).map(([label, value]) => `
        <div class="stat-line">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(String(value))}</strong>
        </div>
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

  const offenseRaw = qbScore * 0.42 + rbScore * 0.18 + wr1Score * 0.22 + wr2Score * 0.18;
  const passGame = (qbScore + wr1Score + wr2Score) / 3;
  const runGame = rbScore;
  const balance = clamp(Math.round(100 - Math.abs(passGame - runGame) * 0.72), 70, 100);
  const balanceBonus = (balance - 85) * 0.11;

  const offense = clamp(Math.round(offenseRaw + balanceBonus), 60, 103);
  const defense = clamp(Math.round(defScore), 60, 103);

  const sameTeamBonus = calculateSameTeamBonus(currentRoster);
  const totalBeforeVolatility = offense * 0.6 + defense * 0.34 + balance * 0.05 + sameTeamBonus;
  const volatility = randomBetween(-2.2, 2.2);
  const rerollTax = rerollUsed ? 0.4 : 0;

  const total = clamp(Math.round(totalBeforeVolatility + volatility - rerollTax), 60, 105);
  const wins = scoreToWins(total, offense, defense, balance);
  const losses = 17 - wins;

  return {
    wins,
    losses,
    offense,
    defense,
    balance,
    total,
    qbScore,
    rbScore,
    wr1Score,
    wr2Score,
    defScore,
    summary: getResultSummary(wins, offense, defense, balance, sameTeamBonus),
    roster: currentRoster
  };
}

function calculateSameTeamBonus(currentRoster) {
  const teams = [
    currentRoster.QB.team,
    currentRoster.RB.team,
    currentRoster.WR1.team,
    currentRoster.WR2.team,
    currentRoster.DEF.team
  ];

  const counts = {};
  teams.forEach((team) => {
    counts[team] = (counts[team] || 0) + 1;
  });

  const max = Math.max(...Object.values(counts));

  if (max >= 4) return 2.2;
  if (max === 3) return 1.2;
  if (max === 2) return 0.4;
  return 0;
}

function scoreToWins(total, offense, defense, balance) {
  let wins;

  if (total < 72) {
    wins = weightedRandom([[6,10],[7,20],[8,25],[9,25],[10,20]]);
  } else if (total < 78) {
    wins = weightedRandom([[8,10],[9,22],[10,28],[11,25],[12,15]]);
  } else if (total < 84) {
    wins = weightedRandom([[10,12],[11,24],[12,30],[13,24],[14,10]]);
  } else if (total < 90) {
    wins = weightedRandom([[11,8],[12,18],[13,30],[14,28],[15,16]]);
  } else if (total < 95) {
    wins = weightedRandom([[12,7],[13,17],[14,31],[15,31],[16,14]]);
  } else if (total < 99) {
    wins = weightedRandom([[13,4],[14,15],[15,34],[16,37],[17,10]]);
  } else if (total < 102) {
    wins = weightedRandom([[14,6],[15,27],[16,47],[17,20]]);
  } else {
    wins = weightedRandom([[15,17],[16,43],[17,40]]);
  }

  if (wins === 17) {
    const perfectEligible = offense >= 96 && defense >= 94 && balance >= 86;
    if (!perfectEligible) wins = 16;
  }

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
  if (wins === 17) return "Perfection. Your roster had enough star power, balance, and defensive dominance to run the table.";
  if (wins === 16) return "Painfully close. This is a monster roster, but one bad Sunday kept it from a perfect season.";
  if (wins >= 15) return "Elite season. This team would be a nightmare matchup, even if perfection was just out of reach.";
  if (wins >= 13) return "Contender-level build. Great roster, but the simulator found enough weak spots to cost you a few games.";
  if (offense > defense + 8) return "Fun offense, not enough stops. This team could score, but the defense dragged the record down.";
  if (defense > offense + 8) return "Defense carried hard, but the offense did not create enough weekly separation.";
  if (balance < 80) return "The roster had names, but the fit was shaky. The simulator punished the lack of balance.";
  if (sameTeamBonus > 0) return "The team chemistry helped, but not enough to turn this build into a perfect-season threat.";
  return "Solid roster, but not a serious 17-0 threat. Draft again and chase a stronger team-era combo.";
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
    <div class="final-row">
      <div class="pos">${slot}</div>
      <div>
        <div class="name">${escapeHtml(pick.name)}</div>
        <div class="player-meta">${escapeHtml(pick.slot)} · ${escapeHtml(pick.team)} · ${escapeHtml(pick.era)} · ${escapeHtml(String(pick.season))}</div>
      </div>
      <div class="score">${score}</div>
    </div>
  `).join("");
}

function buildShareText(result) {
  return [
    `17-0 Result: ${result.wins}-${result.losses}`,
    "",
    `QB: ${result.roster.QB.name} (${result.roster.QB.season})`,
    `RB: ${result.roster.RB.name} (${result.roster.RB.season})`,
    `WR1: ${result.roster.WR1.name} (${result.roster.WR1.season})`,
    `WR2: ${result.roster.WR2.name} (${result.roster.WR2.season})`,
    `DEF: ${result.roster.DEF.name}`,
    "",
    `Offense: ${result.offense}`,
    `Defense: ${result.defense}`,
    `Balance: ${result.balance}`,
    `Total: ${result.total}`
  ].join("\n");
}

async function copyResult() {
  if (!lastResultText) return;

  try {
    await navigator.clipboard.writeText(lastResultText);
    shareBtn.textContent = "Copied!";
  } catch (error) {
    shareBtn.textContent = "Copy Failed";
  }

  setTimeout(() => {
    shareBtn.textContent = "Copy Result";
  }, 1400);
}

function openHelp() {
  helpModal.classList.remove("hidden");
  helpModal.setAttribute("aria-hidden", "false");
}

function closeHelp() {
  helpModal.classList.add("hidden");
  helpModal.setAttribute("aria-hidden", "true");
}

function uniqueValues(values) {
  return [...new Set(values)];
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function takeRandomWeighted(items, count) {
  return shuffleArray(items)
    .sort((a, b) => b.rating - a.rating + randomBetween(-10, 10))
    .slice(0, count);
}

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function dedupePlayers(items) {
  const seen = new Set();
  const clean = [];

  items.forEach((item) => {
    const key = `${item.slot}|${item.name}|${item.team}|${item.season}`;

    if (!seen.has(key)) {
      seen.add(key);
      clean.push(item);
    }
  });

  return clean;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}