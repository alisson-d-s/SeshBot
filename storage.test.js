const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadResults, saveResults, addResult, getResults, DATA_DIR, DATA_FILE } = require('./storage');

const BACKUP_DIR = DATA_DIR + '_backup';

beforeEach(() => {
  if (fs.existsSync(DATA_DIR)) {
    fs.renameSync(DATA_DIR, BACKUP_DIR);
  }
});

afterEach(() => {
  if (fs.existsSync(DATA_DIR)) {
    fs.rmSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(BACKUP_DIR)) {
    fs.renameSync(BACKUP_DIR, DATA_DIR);
  }
});

describe('addResult', () => {
  it('stores a new entry', () => {
    const result = addResult('1755', {
      userId: 'u1',
      username: 'Alice',
      attempts: '3',
      timestamp: '2026-04-10T10:00:00.000Z',
    });

    assert.deepStrictEqual(result, { added: true });

    const data = loadResults();
    assert.equal(data['1755'].length, 1);
    assert.equal(data['1755'][0].username, 'Alice');
  });

  it('rejects duplicate userId for same game', () => {
    addResult('1755', {
      userId: 'u1',
      username: 'Alice',
      attempts: '3',
      timestamp: '2026-04-10T10:00:00.000Z',
    });

    const result = addResult('1755', {
      userId: 'u1',
      username: 'Alice',
      attempts: '2',
      timestamp: '2026-04-10T11:00:00.000Z',
    });

    assert.deepStrictEqual(result, { added: false });

    const data = loadResults();
    assert.equal(data['1755'].length, 1);
    assert.equal(data['1755'][0].attempts, '3');
  });

  it('allows same user in different games', () => {
    addResult('1755', { userId: 'u1', username: 'Alice', attempts: '3', timestamp: '2026-04-10T10:00:00.000Z' });
    const result = addResult('1756', { userId: 'u1', username: 'Alice', attempts: '4', timestamp: '2026-04-11T10:00:00.000Z' });

    assert.deepStrictEqual(result, { added: true });
  });
});

describe('getResults', () => {
  it('sorts by attempts ascending', () => {
    addResult('1755', { userId: 'u1', username: 'Alice', attempts: '4', timestamp: '2026-04-10T10:00:00.000Z' });
    addResult('1755', { userId: 'u2', username: 'Bob', attempts: '2', timestamp: '2026-04-10T10:01:00.000Z' });
    addResult('1755', { userId: 'u3', username: 'Carol', attempts: '5', timestamp: '2026-04-10T10:02:00.000Z' });

    const results = getResults('1755');
    assert.deepStrictEqual(results.map(r => r.username), ['Bob', 'Alice', 'Carol']);
  });

  it('puts X (failure) last', () => {
    addResult('1755', { userId: 'u1', username: 'Alice', attempts: 'X', timestamp: '2026-04-10T10:00:00.000Z' });
    addResult('1755', { userId: 'u2', username: 'Bob', attempts: '6', timestamp: '2026-04-10T10:01:00.000Z' });

    const results = getResults('1755');
    assert.deepStrictEqual(results.map(r => r.username), ['Bob', 'Alice']);
  });

  it('breaks ties by timestamp (earlier wins)', () => {
    addResult('1755', { userId: 'u1', username: 'Alice', attempts: '4', timestamp: '2026-04-10T10:05:00.000Z' });
    addResult('1755', { userId: 'u2', username: 'Bob', attempts: '4', timestamp: '2026-04-10T10:01:00.000Z' });

    const results = getResults('1755');
    assert.deepStrictEqual(results.map(r => r.username), ['Bob', 'Alice']);
  });

  it('returns empty array for unknown game', () => {
    const results = getResults('9999');
    assert.deepStrictEqual(results, []);
  });
});

describe('Wordle regex', () => {
  const WORDLE_REGEX = /Wordle\s+(\d+)\s+([1-6X])\/6/i;

  it('matches standard result', () => {
    const m = 'Wordle 1755 4/6'.match(WORDLE_REGEX);
    assert.equal(m[1], '1755');
    assert.equal(m[2], '4');
  });

  it('matches X (failure)', () => {
    const m = 'Wordle 1755 X/6'.match(WORDLE_REGEX);
    assert.equal(m[1], '1755');
    assert.equal(m[2], 'X');
  });

  it('matches with extra whitespace', () => {
    const m = 'Wordle  1755  3/6'.match(WORDLE_REGEX);
    assert.equal(m[1], '1755');
    assert.equal(m[2], '3');
  });

  it('matches inside a longer message', () => {
    const m = 'Check this out!\nWordle 1755 2/6\n⬛🟩🟩🟩🟩'.match(WORDLE_REGEX);
    assert.equal(m[1], '1755');
    assert.equal(m[2], '2');
  });

  it('does not match invalid attempt count', () => {
    const m = 'Wordle 1755 7/6'.match(WORDLE_REGEX);
    assert.equal(m, null);
  });

  it('does not match non-Wordle messages', () => {
    const m = 'Hello everyone!'.match(WORDLE_REGEX);
    assert.equal(m, null);
  });
});
