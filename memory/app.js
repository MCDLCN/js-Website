// 1) Paste your Mocki API urls here (one per difficulty)
const API_URLS = {
  easy:   "https://mocki.io/v1/33626286-d7c7-4a36-8102-d92b67f1b9ae",
  medium: "https://mocki.io/v1/4025f622-2e69-4b54-857c-ac87714b49b5",
  hard:   "https://mocki.io/v1/27e698b2-fffe-43d9-b646-5b5ccdc3354f",
};

// Fallback config (so the app still runs if you haven't created Mocki yet)
const FALLBACK_CONFIGS = {
  easy: {
    id: "memory-easy",
    name: "Memory Game",
    level: "easy",
    pairs: 5,
    maxAttempts: 12,
    images: Array.from({ length: 5 }, (_, i) => ({
      id: `img${i+1}`,
      url: `https://picsum.photos/seed/easy_${i+1}/400/400`,
      alt: `Easy ${i+1}`
    })),
  },
  medium: {
    id: "memory-medium",
    name: "Memory Game",
    level: "medium",
    pairs: 15,
    maxAttempts: 40,
    images: Array.from({ length: 15 }, (_, i) => ({
      id: `img${i+1}`,
      url: `https://picsum.photos/seed/med_${i+1}/400/400`,
      alt: `Medium ${i+1}`
    })),
  },
  hard: {
    id: "memory-hard",
    name: "Memory Game",
    level: "hard",
    pairs: 25,
    maxAttempts: 70,
    images: Array.from({ length: 25 }, (_, i) => ({
      id: `img${i+1}`,
      url: `https://picsum.photos/seed/hard_${i+1}/400/400`,
      alt: `Hard ${i+1}`
    })),
  },
};

// DOM
const difficultyEl = document.getElementById("difficulty");
const startBtn = document.getElementById("start");

const gameTitleEl = document.getElementById("game-title");
const levelLabelEl = document.getElementById("level-label");
const pairsLabelEl = document.getElementById("pairs-label");
const maxAttemptsLabelEl = document.getElementById("max-attempts-label");
const attemptsUsedEl = document.getElementById("attempts-used");
const attemptsLeftEl = document.getElementById("attempts-left");
const matchesEl = document.getElementById("matches");
const statusEl = document.getElementById("status");
const boardEl = document.getElementById("board");

// Bonus stats
const statPlayedEl = document.getElementById("stat-played");
const statBestEl = document.getElementById("stat-best");
const resetStatsBtn = document.getElementById("reset-stats");

const STATS_KEY = "memory_stats_v1";

function setStatus(msg) {
  statusEl.textContent = msg;
}

// Game state
let config = null;
let deck = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;

let attemptsUsed = 0;
let matches = 0;
let maxAttempts = 0;

difficultyEl.addEventListener("change", () => {
  startBtn.disabled = !difficultyEl.value;
});

startBtn.addEventListener("click", async () => {
  const level = difficultyEl.value;
  await setupGame(level);
  startGame();
});

resetStatsBtn.addEventListener("click", () => {
  localStorage.removeItem(STATS_KEY);
  renderStats();
});

function readStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) ?? { played: 0, best: null };
  } catch {
    return { played: 0, best: null };
  }
}

function writeStats(next) {
  localStorage.setItem(STATS_KEY, JSON.stringify(next));
}

function renderStats() {
  const s = readStats();
  statPlayedEl.textContent = String(s.played);
  statBestEl.textContent = s.best === null ? "—" : String(s.best);
}

renderStats();

async function fetchConfig(level) {
  const url = API_URLS[level];

  // If user hasn't pasted URLs yet, use fallback
  if (!url || url.startsWith("PASTE_")) {
    return FALLBACK_CONFIGS[level];
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP error " + res.status);
  return await res.json();
}

async function setupGame(level) {
  setStatus("Loading game config...");

  config = await fetchConfig(level);

  boardEl.classList.remove("easy", "medium", "hard");
  boardEl.classList.add(config.level); // "easy" / "medium" / "hard"

  // Fill UI from API response
  gameTitleEl.textContent = config.name ?? "Memory";
  levelLabelEl.textContent = config.level ?? level;
  pairsLabelEl.textContent = String(config.pairs);
  maxAttemptsLabelEl.textContent = String(config.maxAttempts);

  attemptsUsed = 0;
  matches = 0;
  maxAttempts = Number(config.maxAttempts);

  attemptsUsedEl.textContent = "0";
  attemptsLeftEl.textContent = String(maxAttempts);
  matchesEl.textContent = "0";

  // Build deck: duplicate images (pairs) and shuffle
  deck = buildDeck(config.images);
  renderBoard(deck, config.pairs);

  setStatus("Ready. Click cards to find pairs!");
}

function buildDeck(images) {
  // We take exactly N images (pairs) and duplicate them
  const base = images.slice(0, config.pairs);

  const duplicated = base.flatMap(img => ([
    { ...img, cardId: crypto.randomUUID(), pairId: img.id },
    { ...img, cardId: crypto.randomUUID(), pairId: img.id },
  ]));

  return shuffle(duplicated);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderBoard(cards, pairsCount) {
  boardEl.innerHTML = "";
  firstCard = null;
  secondCard = null;
  lockBoard = false;

  // Simple responsive columns based on total cards
  const total = pairsCount * 2;

  let cols;
  if (total <= 10) cols = 5;
  else if (total <= 20) cols = 6;
  else if (total <= 40) cols = 8;
  else cols = 10;

  boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  cards.forEach(card => {
    const el = document.createElement("div");
    el.className = "card";
    el.dataset.cardId = card.cardId;
    el.dataset.pairId = card.pairId;

    const front = document.createElement("div");
    front.className = "front";
    front.textContent = "❓";

    const back = document.createElement("div");
    back.className = "back";

    const img = document.createElement("img");
    img.src = card.url;
    img.alt = card.alt ?? "Memory card";
    back.appendChild(img);

    el.appendChild(front);
    el.appendChild(back);

    el.addEventListener("click", () => onFlip(el));
    boardEl.appendChild(el);
  });
}

function startGame() {
  // Bonus stats: increment played when a new game starts
  const s = readStats();
  writeStats({ ...s, played: s.played + 1 });
  renderStats();
}

function onFlip(cardEl) {
  if (lockBoard) return;
  if (cardEl.classList.contains("flipped")) return;
  if (attemptsUsed >= maxAttempts) return;

  cardEl.classList.add("flipped");

  if (!firstCard) {
    firstCard = cardEl;
    return;
  }

  secondCard = cardEl;
  lockBoard = true;

  attemptsUsed++;
  attemptsUsedEl.textContent = String(attemptsUsed);
  attemptsLeftEl.textContent = String(Math.max(0, maxAttempts - attemptsUsed));

  const isMatch = firstCard.dataset.pairId === secondCard.dataset.pairId;

  if (isMatch) {
    matches++;
    matchesEl.textContent = String(matches);

    // Disable matched cards
    firstCard.classList.add("disabled");
    secondCard.classList.add("disabled");

    resetTurn();

    if (matches === config.pairs) {
      setStatus(`✅ You won in ${attemptsUsed} attempts!`);

      // Bonus: update best score (fewest attempts)
      const s = readStats();
      const best = s.best;
      const nextBest = best === null ? attemptsUsed : Math.min(best, attemptsUsed);
      writeStats({ ...s, best: nextBest });
      renderStats();
    }
    return;
  }

  // Not a match: flip back after a short delay
  setStatus("❌ Not a match.");
  setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    resetTurn();

    if (attemptsUsed >= maxAttempts && matches !== config.pairs) {
      setStatus("🛑 Game over: no attempts left.");
      // Disable remaining cards
      document.querySelectorAll(".card").forEach(c => c.classList.add("disabled"));
    }
  }, 800);
}

function resetTurn() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
  setStatus("");
}
