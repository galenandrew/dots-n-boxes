// UI: renders the board as SVG, handles clicks, and keeps the player list / scores in sync.
(function () {
  'use strict';

  const { createGame, drawLine, isGameOver, getLeaders } = window.DotsAndBoxes;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SPACING = 60; // distance between neighbouring dots, in SVG units
  const PAD = SPACING / 2; // lets the hover areas of edge lines fit inside the board
  const MIN_PLAYERS = 2;
  const MAX_PLAYERS = 6;
  const PALETTE = [
    { name: 'Red', color: '#e5484d' },
    { name: 'Blue', color: '#3e7bfa' },
    { name: 'Green', color: '#30a46c' },
    { name: 'Orange', color: '#f76b15' },
    { name: 'Purple', color: '#8e4ec6' },
    { name: 'Teal', color: '#12a594' },
  ];

  const els = {
    app: document.querySelector('.app'),
    board: document.getElementById('board'),
    status: document.getElementById('status'),
    playerList: document.getElementById('player-list'),
    addPlayer: document.getElementById('add-player'),
    gridSize: document.getElementById('grid-size'),
    newGame: document.getElementById('new-game'),
  };

  let players = PALETTE.slice(0, MIN_PLAYERS).map((p) => ({ ...p }));
  let game;
  let edgeEls; // edgeEls[orientation][r][c] -> <g class="edge">
  let boxEls; // boxEls[r][c] -> <rect class="box">

  // Colors are CSS custom properties, so recoloring a player updates the board instantly.
  const playerColor = (i) => `var(--player-${i})`;
  const playerName = (i) => players[i].name.trim() || `Player ${i + 1}`;

  function svg(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }

  function newGame() {
    const dots = Number(els.gridSize.value);
    game = createGame(dots - 1, dots - 1, players.length);
    renderBoard();
    renderPlayers();
    updateStatus();
  }

  function renderBoard() {
    const { rows, cols } = game;
    const x = (c) => PAD + c * SPACING;
    const y = (r) => PAD + r * SPACING;
    const half = SPACING / 2;

    els.board.setAttribute('viewBox', `0 0 ${cols * SPACING + 2 * PAD} ${rows * SPACING + 2 * PAD}`);
    els.board.setAttribute('aria-label', `${rows + 1} by ${cols + 1} dot grid`);

    const boxLayer = svg('g');
    const edgeLayer = svg('g');
    const dotLayer = svg('g', { class: 'dots' });

    boxEls = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        const rect = svg('rect', { class: 'box', x: x(c), y: y(r), width: SPACING, height: SPACING });
        boxLayer.append(rect);
        return rect;
      }),
    );

    // Each line gets a diamond-shaped hover/click area reaching to the centres of the
    // boxes on either side, so the whole board is covered with no gaps or overlaps.
    function addEdge(orientation, r, c, x1, y1, x2, y2, hitPoints) {
      const g = svg('g', { class: 'edge' });
      const hit = svg('polygon', { class: 'hit', points: hitPoints.map((p) => p.join(',')).join(' ') });
      hit.addEventListener('click', () => onEdgeClick(orientation, r, c));
      g.append(svg('line', { class: 'line', x1, y1, x2, y2 }), hit);
      edgeLayer.append(g);
      return g;
    }

    edgeEls = {
      h: Array.from({ length: rows + 1 }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const [x1, x2, yy] = [x(c), x(c + 1), y(r)];
          const mid = x1 + half;
          return addEdge('h', r, c, x1, yy, x2, yy, [[x1, yy], [mid, yy - half], [x2, yy], [mid, yy + half]]);
        }),
      ),
      v: Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols + 1 }, (_, c) => {
          const [xx, y1, y2] = [x(c), y(r), y(r + 1)];
          const mid = y1 + half;
          return addEdge('v', r, c, xx, y1, xx, y2, [[xx, y1], [xx + half, mid], [xx, y2], [xx - half, mid]]);
        }),
      ),
    };

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        dotLayer.append(svg('circle', { class: 'dot', cx: x(c), cy: y(r), r: 5 }));
      }
    }

    els.board.replaceChildren(boxLayer, edgeLayer, dotLayer);
  }

  function onEdgeClick(orientation, r, c) {
    const result = drawLine(game, orientation, r, c);
    if (!result) return; // line already drawn, or game over

    const edge = edgeEls[orientation][r][c];
    edge.classList.add('taken');
    edge.style.setProperty('--line-color', playerColor(result.player));

    for (const [br, bc] of result.completed) {
      const box = boxEls[br][bc];
      box.classList.add('filled');
      box.style.setProperty('--box-color', playerColor(result.player));
    }

    updateScores();
    updateStatus(result.completed.length > 0);
    if (isGameOver(game)) celebrate();
  }

  // Confetti in the winner's color (every tied leader's color on a tie), plus gold.
  function celebrate() {
    const rect = els.board.getBoundingClientRect();
    window.launchConfetti({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      colors: [...getLeaders(game).map((i) => players[i].color), '#ffc53d'],
    });
  }

  function applyColors() {
    players.forEach((p, i) => els.app.style.setProperty(`--player-${i}`, p.color));
  }

  function renderPlayers() {
    const rows = players.map((player, i) => {
      const li = document.createElement('li');
      li.className = 'player';

      const color = document.createElement('input');
      color.type = 'color';
      color.className = 'player-color';
      color.value = player.color;
      color.setAttribute('aria-label', `${playerName(i)} color`);
      color.addEventListener('input', () => {
        player.color = color.value;
        applyColors();
      });

      const name = document.createElement('input');
      name.type = 'text';
      name.className = 'player-name';
      name.value = player.name;
      name.maxLength = 16;
      name.setAttribute('aria-label', `Player ${i + 1} name`);
      name.addEventListener('input', () => {
        player.name = name.value;
        color.setAttribute('aria-label', `${playerName(i)} color`);
        updateStatus();
      });

      const score = document.createElement('span');
      score.className = 'score';
      score.setAttribute('aria-label', 'boxes');

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.textContent = '×';
      remove.title = 'Remove player';
      remove.setAttribute('aria-label', `Remove ${playerName(i)}`);
      remove.disabled = players.length <= MIN_PLAYERS;
      remove.addEventListener('click', () => {
        players.splice(i, 1);
        newGame();
      });

      li.append(color, name, score, remove);
      return li;
    });

    els.playerList.replaceChildren(...rows);
    els.addPlayer.disabled = players.length >= MAX_PLAYERS;
    applyColors();
    updateScores();
  }

  function updateScores() {
    const over = isGameOver(game);
    const leaders = over ? getLeaders(game) : [];
    els.playerList.querySelectorAll('.player').forEach((li, i) => {
      li.querySelector('.score').textContent = game.scores[i];
      li.classList.toggle('active', !over && i === game.currentPlayer);
      li.classList.toggle('winner', leaders.includes(i));
    });
  }

  function updateStatus(extraTurn = false) {
    const over = isGameOver(game);
    els.board.classList.toggle('over', over);
    els.app.style.setProperty('--turn-color', playerColor(game.currentPlayer));

    if (over) {
      const leaders = getLeaders(game);
      const best = game.scores[leaders[0]];
      const boxes = `${best} box${best === 1 ? '' : 'es'}`;
      els.app.style.setProperty('--turn-color', leaders.length === 1 ? playerColor(leaders[0]) : 'var(--ink)');
      els.status.textContent = leaders.length === 1
        ? `${playerName(leaders[0])} wins with ${boxes}!`
        : `It's a tie between ${leaders.map(playerName).join(' & ')} with ${boxes} each!`;
      return;
    }

    const name = playerName(game.currentPlayer);
    els.status.textContent = extraTurn ? `${name} closed a box — go again!` : `${name}'s turn`;
  }

  els.addPlayer.addEventListener('click', () => {
    if (players.length >= MAX_PLAYERS) return;
    const used = new Set(players.map((p) => p.color.toLowerCase()));
    const next = PALETTE.find((p) => !used.has(p.color)) || PALETTE[players.length];
    players.push({ ...next });
    newGame();
  });
  els.newGame.addEventListener('click', newGame);
  els.gridSize.addEventListener('change', newGame);

  newGame();
})();
