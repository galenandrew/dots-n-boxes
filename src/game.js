// Core Dots & Boxes rules. No DOM access, so it can be unit tested in Node.
//
// Coordinates: a board of `rows` x `cols` boxes has (rows + 1) x (cols + 1) dots.
//   - Horizontal line ('h', r, c) joins dot (r, c) to dot (r, c + 1); r in [0, rows], c in [0, cols).
//   - Vertical line   ('v', r, c) joins dot (r, c) to dot (r + 1, c); r in [0, rows), c in [0, cols].
//   - Box (r, c) is bounded by h(r, c), h(r + 1, c), v(r, c) and v(r, c + 1).
// Lines and boxes store the index of the player who claimed them, or null.
(function (root) {
  'use strict';

  function makeGrid(rows, cols) {
    return Array.from({ length: rows }, () => new Array(cols).fill(null));
  }

  function createGame(rows, cols, playerCount) {
    if (rows < 1 || cols < 1) throw new Error('Board needs at least one box');
    if (playerCount < 2) throw new Error('Need at least two players');
    return {
      rows,
      cols,
      playerCount,
      lines: {
        h: makeGrid(rows + 1, cols),
        v: makeGrid(rows, cols + 1),
      },
      boxes: makeGrid(rows, cols),
      scores: new Array(playerCount).fill(0),
      currentPlayer: 0,
      linesDrawn: 0,
    };
  }

  function totalLines(game) {
    return (game.rows + 1) * game.cols + game.rows * (game.cols + 1);
  }

  function isGameOver(game) {
    return game.linesDrawn === totalLines(game);
  }

  function isLineTaken(game, orientation, r, c) {
    return game.lines[orientation][r][c] !== null;
  }

  function isBoxClosed(game, r, c) {
    const { h, v } = game.lines;
    return h[r][c] !== null && h[r + 1][c] !== null && v[r][c] !== null && v[r][c + 1] !== null;
  }

  // The (at most two) boxes that a line borders.
  function boxesBeside(game, orientation, r, c) {
    const candidates = orientation === 'h'
      ? [[r - 1, c], [r, c]]
      : [[r, c - 1], [r, c]];
    return candidates.filter(([br, bc]) => br >= 0 && br < game.rows && bc >= 0 && bc < game.cols);
  }

  // Draws a line for the current player. Returns { player, completed: [[r, c], ...] },
  // or null if the line is already taken or the game is over. The turn passes to the
  // next player only when no box was completed.
  function drawLine(game, orientation, r, c) {
    const grid = game.lines[orientation];
    if (!grid || !grid[r] || grid[r][c] === undefined) {
      throw new Error(`No such line: ${orientation}(${r}, ${c})`);
    }
    if (grid[r][c] !== null || isGameOver(game)) return null;

    const player = game.currentPlayer;
    grid[r][c] = player;
    game.linesDrawn += 1;

    const completed = boxesBeside(game, orientation, r, c).filter(([br, bc]) => isBoxClosed(game, br, bc));
    for (const [br, bc] of completed) {
      game.boxes[br][bc] = player;
      game.scores[player] += 1;
    }

    if (completed.length === 0) {
      game.currentPlayer = (player + 1) % game.playerCount;
    }
    return { player, completed };
  }

  // Indices of the player(s) with the highest score; more than one means a tie.
  function getLeaders(game) {
    const best = Math.max(...game.scores);
    return game.scores.flatMap((score, i) => (score === best ? [i] : []));
  }

  const api = { createGame, drawLine, isGameOver, isLineTaken, totalLines, getLeaders };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.DotsAndBoxes = api;
  }
})(this);
