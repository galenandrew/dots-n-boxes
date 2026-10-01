const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame, drawLine, isGameOver, totalLines, getLeaders } = require('../src/game.js');

test('new game starts empty with player 0 to move', () => {
  const game = createGame(2, 3, 2);
  assert.equal(totalLines(game), 3 * 3 + 2 * 4);
  assert.deepEqual(game.scores, [0, 0]);
  assert.equal(game.currentPlayer, 0);
  assert.equal(isGameOver(game), false);
});

test('a move that closes no box passes the turn', () => {
  const game = createGame(2, 2, 3);
  assert.deepEqual(drawLine(game, 'h', 0, 0), { player: 0, completed: [] });
  assert.equal(game.currentPlayer, 1);
  drawLine(game, 'v', 0, 0);
  assert.equal(game.currentPlayer, 2);
  drawLine(game, 'v', 1, 2);
  assert.equal(game.currentPlayer, 0, 'turn wraps around to the first player');
});

test('drawing an already-taken line is rejected and keeps the turn', () => {
  const game = createGame(1, 1, 2);
  drawLine(game, 'h', 0, 0);
  assert.equal(drawLine(game, 'h', 0, 0), null);
  assert.equal(game.currentPlayer, 1);
  assert.equal(game.linesDrawn, 1);
});

test('out-of-range lines throw', () => {
  const game = createGame(1, 1, 2);
  assert.throws(() => drawLine(game, 'h', 2, 0));
  assert.throws(() => drawLine(game, 'v', 0, 2));
  assert.throws(() => drawLine(game, 'x', 0, 0));
});

test('closing a box scores it and the same player goes again', () => {
  const game = createGame(1, 2, 2);
  drawLine(game, 'h', 0, 0); // p0
  drawLine(game, 'h', 1, 0); // p1
  drawLine(game, 'v', 0, 0); // p0
  const result = drawLine(game, 'v', 0, 1); // p1 closes box (0, 0)
  assert.deepEqual(result, { player: 1, completed: [[0, 0]] });
  assert.equal(game.boxes[0][0], 1);
  assert.deepEqual(game.scores, [0, 1]);
  assert.equal(game.currentPlayer, 1);
});

test('one line can close two boxes at once', () => {
  const game = createGame(1, 2, 2);
  for (const [o, r, c] of [['h', 0, 0], ['h', 1, 0], ['h', 0, 1], ['h', 1, 1], ['v', 0, 0], ['v', 0, 2]]) {
    drawLine(game, o, r, c);
  }
  const mover = game.currentPlayer;
  const result = drawLine(game, 'v', 0, 1);
  assert.deepEqual(result.completed, [[0, 0], [0, 1]]);
  assert.equal(game.scores[mover], 2);
  assert.equal(game.currentPlayer, mover);
});

test('game ends when every line is drawn', () => {
  const game = createGame(1, 1, 2);
  drawLine(game, 'h', 0, 0); // p0
  drawLine(game, 'h', 1, 0); // p1
  drawLine(game, 'v', 0, 0); // p0
  drawLine(game, 'v', 0, 1); // p1 closes the only box
  assert.equal(isGameOver(game), true);
  assert.deepEqual(getLeaders(game), [1]);
});

test('getLeaders reports ties', () => {
  const game = createGame(2, 2, 3);
  game.scores = [2, 2, 0];
  assert.deepEqual(getLeaders(game), [0, 1]);
});
