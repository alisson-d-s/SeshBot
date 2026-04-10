const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'results.json');

function loadResults() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    return {};
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function saveResults(data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function addResult(gameNumber, entry) {
  const data = loadResults();
  const key = String(gameNumber);

  if (!data[key]) {
    data[key] = [];
  }

  const duplicate = data[key].some(r => r.userId === entry.userId);
  if (duplicate) {
    return { added: false };
  }

  data[key].push({
    userId: entry.userId,
    username: entry.username,
    attempts: entry.attempts,
    timestamp: entry.timestamp,
  });

  saveResults(data);
  return { added: true };
}

function getResults(gameNumber) {
  const data = loadResults();
  const key = String(gameNumber);
  const entries = data[key] || [];

  return entries.slice().sort((a, b) => {
    const attA = a.attempts === 'X' ? 7 : Number(a.attempts);
    const attB = b.attempts === 'X' ? 7 : Number(b.attempts);

    if (attA !== attB) return attA - attB;
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
}

module.exports = { loadResults, saveResults, addResult, getResults, DATA_DIR, DATA_FILE };
