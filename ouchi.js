// マイおうち — pick parts, build a cute SVG house.
(() => {
  'use strict';

  const STORAGE_KEY = 'ouchi_v1';
  const SHARE_URL = 'https://maxtakaharu34-cmd.github.io/ouchi-jp/';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // ---------- Option catalogs ----------
  const ROOF_SHAPES = [
    { id: 'tri',   label: '三角' },
    { id: 'flat',  label: 'ひらや' },
    { id: 'curve', label: 'まる' },
    { id: 'mansard', label: '段々' }
  ];
  const ROOF_COLORS = ['#e35457', '#5dadec', '#7bc875', '#9b6dff', '#3a2a18', '#ffc14d'];

  const WALL_MATS = [
    { id: 'plain',  label: 'むじ' },
    { id: 'wood',   label: '木板' },
    { id: 'brick',  label: 'レンガ' },
    { id: 'stripe', label: 'しま' }
  ];
  const WALL_COLORS = ['#fff2d6', '#ffd6a8', '#d6e9ff', '#e8d8b8', '#cbe8c4', '#d6c8ff'];

  const DOOR_STYLES = [
    { id: 'wood',   label: '木' },
    { id: 'modern', label: 'モダン' },
    { id: 'arch',   label: 'アーチ' },
    { id: 'glass',  label: 'ガラス' }
  ];
  const DOOR_COLORS = ['#8b5a2b', '#3a2a18', '#1c5fa0', '#aa3344', '#5b3e22', '#2d8556'];

  const WINDOW_STYLES = [
    { id: 'sq',    label: '四角' },
    { id: 'round', label: '丸' },
    { id: 'arch',  label: 'アーチ' },
    { id: 'cross', label: '格子' }
  ];

  const SCENES = [
    { id: 'day',    label: '昼',   sky: ['#aee0ff', '#fff5d6'], ground: '#a2d77c' },
    { id: 'sunset', label: '夕方', sky: ['#ffb88b', '#ff7a89'], ground: '#7eb86b' },
    { id: 'night',  label: '夜',   sky: ['#1d2660', '#3b2670'], ground: '#3a5a3a' },
    { id: 'snow',   label: '雪',   sky: ['#dceef9', '#f6f7fb'], ground: '#f0f5f9' }
  ];

  const YARD_ITEMS = [
    { id: 'tree',     label: '木',     emoji: '🌳' },
    { id: 'flower',   label: '花壇',   emoji: '🌷' },
    { id: 'mailbox',  label: 'ポスト', emoji: '📮' },
    { id: 'lamp',     label: '街灯',   emoji: '💡' },
    { id: 'fence',    label: '柵',     emoji: '🪵' },
    { id: 'bench',    label: 'ベンチ', emoji: '🪑' },
    { id: 'fountain', label: '噴水',   emoji: '⛲' },
    { id: 'pet',      label: 'ねこ',   emoji: '🐈' }
  ];

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const panel = $('panel');
  const toastEl = $('toast');

  // ---------- State ----------
  const defaultConfig = () => ({
    roof:  { shape: 'tri', color: ROOF_COLORS[0] },
    wall:  { material: 'plain', color: WALL_COLORS[0] },
    door:  { style: 'wood', color: DOOR_COLORS[0] },
    window:{ style: 'sq' },
    yard:  { tree: true, flower: true, mailbox: true, lamp: false, fence: false, bench: false, fountain: false, pet: false },
    scene: 'day'
  });
  let config = loadConfig() || defaultConfig();
  let activeTab = 'roof';

  function loadConfig() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (!s) return null;
      return JSON.parse(s);
    } catch { return null; }
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove('show'), 1500);
  }
  function clearChildren(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function svgEl(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function htmlEl(tag, props) {
    const e = document.createElement(tag);
    if (props) for (const k in props) {
      if (k === 'class') e.className = props[k];
      else if (k === 'style') Object.assign(e.style, props[k]);
      else if (k === 'text') e.textContent = props[k];
      else e.setAttribute(k, props[k]);
    }
    return e;
  }

  // ---------- House SVG composer ----------
  function renderHouse() {
    const W = 400, H = 280;
    clearChildren(stage);
    const scene = SCENES.find((s) => s.id === config.scene) || SCENES[0];

    // Defs (gradients)
    const defs = svgEl('defs');
    const skyGrad = svgEl('linearGradient', { id: 'skyGrad', x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
    skyGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': scene.sky[0] }));
    skyGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': scene.sky[1] }));
    defs.appendChild(skyGrad);
    stage.appendChild(defs);

    // Sky
    stage.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#skyGrad)' }));
    // Sun/moon
    if (config.scene === 'night') {
      stage.appendChild(svgEl('circle', { cx: 320, cy: 60, r: 22, fill: '#f6f0c2' }));
      stage.appendChild(svgEl('circle', { cx: 312, cy: 56, r: 20, fill: scene.sky[0] }));
      // stars
      for (let i = 0; i < 14; i++) {
        const sx = (i * 31 + 20) % W;
        const sy = (i * 19 + 10) % 100;
        stage.appendChild(svgEl('circle', { cx: sx, cy: sy, r: 1.2, fill: '#fff' }));
      }
    } else if (config.scene === 'sunset') {
      stage.appendChild(svgEl('circle', { cx: 320, cy: 80, r: 28, fill: '#ffd56b' }));
    } else if (config.scene === 'day') {
      stage.appendChild(svgEl('circle', { cx: 60, cy: 50, r: 22, fill: '#ffe066' }));
      // clouds
      addCloud(70, 110, 1);
      addCloud(280, 60, 0.9);
    } else if (config.scene === 'snow') {
      // snowflakes
      for (let i = 0; i < 20; i++) {
        const sx = (i * 23 + 15) % W;
        const sy = (i * 17 + 30) % 160;
        stage.appendChild(svgEl('circle', { cx: sx, cy: sy, r: 1.5, fill: '#fff' }));
      }
    }

    // Ground
    stage.appendChild(svgEl('rect', { x: 0, y: 200, width: W, height: 80, fill: scene.ground }));
    // Ground texture lines
    for (let i = 0; i < 12; i++) {
      const gx = (i * 45 + 15) % W;
      stage.appendChild(svgEl('path', {
        d: `M ${gx} 215 q 6 -3 12 0`, stroke: 'rgba(0,0,0,0.15)', 'stroke-width': 1, fill: 'none'
      }));
    }

    // Yard items (behind house if back layer like tree)
    if (config.yard.tree)     drawTree(60, 200);
    if (config.yard.tree)     drawTree(340, 200);
    if (config.yard.fence)    drawFence();
    if (config.yard.fountain) drawFountain(70, 220);

    // House (centered)
    drawHouse();

    // Yard front items
    if (config.yard.flower)  drawFlowerBed(280, 230);
    if (config.yard.mailbox) drawMailbox(335, 215);
    if (config.yard.lamp)    drawLamp(50, 220);
    if (config.yard.bench)   drawBench(260, 240);
    if (config.yard.pet)     drawPet(180, 245);
  }

  function addCloud(cx, cy, scale) {
    const g = svgEl('g', { transform: `translate(${cx} ${cy}) scale(${scale})` });
    g.appendChild(svgEl('ellipse', { cx: 0, cy: 0, rx: 18, ry: 8, fill: '#fff' }));
    g.appendChild(svgEl('ellipse', { cx: 14, cy: -2, rx: 14, ry: 8, fill: '#fff' }));
    g.appendChild(svgEl('ellipse', { cx: -12, cy: -2, rx: 13, ry: 7, fill: '#fff' }));
    stage.appendChild(g);
  }

  function drawHouse() {
    const cx = 200, gy = 200; // ground level
    const houseW = 180, houseH = 110;
    const hx = cx - houseW / 2, hy = gy - houseH;

    // Walls
    drawWalls(hx, hy, houseW, houseH);

    // Door
    drawDoor(cx, gy);

    // Windows (left & right)
    drawWindow(hx + 30, hy + 35, 30, 28);
    drawWindow(hx + houseW - 60, hy + 35, 30, 28);

    // Roof (on top)
    drawRoof(hx, hy, houseW, houseH);

    // Chimney
    if (config.roof.shape === 'tri' || config.roof.shape === 'mansard') {
      const cmx = hx + houseW - 35;
      const cmy = hy - 18;
      stage.appendChild(svgEl('rect', { x: cmx, y: cmy, width: 14, height: 22, fill: '#a86545', stroke: '#3a2a18', 'stroke-width': 2 }));
      stage.appendChild(svgEl('rect', { x: cmx - 2, y: cmy - 5, width: 18, height: 6, fill: '#3a2a18' }));
    }
  }

  function drawWalls(x, y, w, h) {
    const c = config.wall.color;
    const ink = '#3a2a18';
    stage.appendChild(svgEl('rect', { x, y, width: w, height: h, fill: c, stroke: ink, 'stroke-width': 3, rx: 4 }));
    if (config.wall.material === 'wood') {
      // horizontal planks
      for (let py = y + 14; py < y + h; py += 14) {
        stage.appendChild(svgEl('line', { x1: x + 2, y1: py, x2: x + w - 2, y2: py, stroke: 'rgba(0,0,0,0.2)', 'stroke-width': 1 }));
      }
    } else if (config.wall.material === 'brick') {
      const rows = Math.floor(h / 12);
      for (let r = 0; r < rows; r++) {
        const py = y + 12 + r * 12;
        const offset = (r % 2) * 18;
        stage.appendChild(svgEl('line', { x1: x, y1: py, x2: x + w, y2: py, stroke: 'rgba(120,60,30,0.5)', 'stroke-width': 1 }));
        for (let bx = x + offset; bx < x + w; bx += 36) {
          stage.appendChild(svgEl('line', { x1: bx, y1: py - 12, x2: bx, y2: py, stroke: 'rgba(120,60,30,0.5)', 'stroke-width': 1 }));
        }
      }
    } else if (config.wall.material === 'stripe') {
      for (let py = y + 8; py < y + h; py += 16) {
        stage.appendChild(svgEl('rect', { x, y: py, width: w, height: 8, fill: 'rgba(255,255,255,0.4)' }));
      }
    }
  }

  function drawRoof(x, y, w, h) {
    const c = config.roof.color, ink = '#3a2a18';
    if (config.roof.shape === 'tri') {
      const points = `${x - 8},${y} ${x + w / 2},${y - 56} ${x + w + 8},${y}`;
      stage.appendChild(svgEl('polygon', { points, fill: c, stroke: ink, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
      // window in the roof
      stage.appendChild(svgEl('circle', { cx: x + w / 2, cy: y - 26, r: 7, fill: '#a4d4ff', stroke: ink, 'stroke-width': 2 }));
    } else if (config.roof.shape === 'flat') {
      stage.appendChild(svgEl('rect', { x: x - 6, y: y - 14, width: w + 12, height: 14, fill: c, stroke: ink, 'stroke-width': 3, rx: 2 }));
    } else if (config.roof.shape === 'curve') {
      stage.appendChild(svgEl('path', {
        d: `M ${x - 8} ${y} Q ${x + w / 2} ${y - 70} ${x + w + 8} ${y} Z`,
        fill: c, stroke: ink, 'stroke-width': 3, 'stroke-linejoin': 'round'
      }));
    } else if (config.roof.shape === 'mansard') {
      // upper triangle small
      const p1 = `${x + 12},${y - 30} ${x + w / 2},${y - 56} ${x + w - 12},${y - 30}`;
      stage.appendChild(svgEl('polygon', { points: p1, fill: shade(c, -10), stroke: ink, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
      // lower trapezoid
      const p2 = `${x - 8},${y} ${x + 12},${y - 30} ${x + w - 12},${y - 30} ${x + w + 8},${y}`;
      stage.appendChild(svgEl('polygon', { points: p2, fill: c, stroke: ink, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    }
  }

  function drawDoor(cx, gy) {
    const ink = '#3a2a18';
    const dw = 38, dh = 56;
    const dx = cx - dw / 2, dy = gy - dh;
    if (config.door.style === 'arch') {
      stage.appendChild(svgEl('path', {
        d: `M ${dx} ${gy} L ${dx} ${dy + 12} Q ${cx} ${dy - 8} ${dx + dw} ${dy + 12} L ${dx + dw} ${gy} Z`,
        fill: config.door.color, stroke: ink, 'stroke-width': 3
      }));
    } else if (config.door.style === 'glass') {
      stage.appendChild(svgEl('rect', { x: dx, y: dy, width: dw, height: dh, fill: '#a4d4ff', stroke: ink, 'stroke-width': 3, rx: 4 }));
      stage.appendChild(svgEl('line', { x1: cx, y1: dy, x2: cx, y2: gy, stroke: ink, 'stroke-width': 2 }));
      stage.appendChild(svgEl('rect', { x: dx + 2, y: dy + 2, width: dw - 4, height: 8, fill: 'rgba(255,255,255,0.5)' }));
    } else {
      stage.appendChild(svgEl('rect', { x: dx, y: dy, width: dw, height: dh, fill: config.door.color, stroke: ink, 'stroke-width': 3, rx: config.door.style === 'modern' ? 1 : 4 }));
      if (config.door.style === 'wood') {
        // panels
        stage.appendChild(svgEl('rect', { x: dx + 4, y: dy + 4, width: dw - 8, height: 22, fill: 'none', stroke: 'rgba(0,0,0,0.3)', 'stroke-width': 1, rx: 2 }));
        stage.appendChild(svgEl('rect', { x: dx + 4, y: dy + 30, width: dw - 8, height: 22, fill: 'none', stroke: 'rgba(0,0,0,0.3)', 'stroke-width': 1, rx: 2 }));
      }
    }
    // knob
    stage.appendChild(svgEl('circle', { cx: dx + dw - 6, cy: dy + dh / 2, r: 2.5, fill: '#ffd700', stroke: ink, 'stroke-width': 1 }));
  }

  function drawWindow(x, y, w, h) {
    const ink = '#3a2a18';
    const glass = '#a4d4ff';
    const cx = x + w / 2, cy = y + h / 2;
    if (config.window.style === 'round') {
      stage.appendChild(svgEl('circle', { cx, cy, r: w / 2, fill: glass, stroke: ink, 'stroke-width': 3 }));
      stage.appendChild(svgEl('line', { x1: cx, y1: y, x2: cx, y2: y + h, stroke: ink, 'stroke-width': 2 }));
    } else if (config.window.style === 'arch') {
      stage.appendChild(svgEl('path', {
        d: `M ${x} ${y + h} L ${x} ${y + 8} Q ${cx} ${y - 6} ${x + w} ${y + 8} L ${x + w} ${y + h} Z`,
        fill: glass, stroke: ink, 'stroke-width': 3
      }));
      stage.appendChild(svgEl('line', { x1: cx, y1: y - 2, x2: cx, y2: y + h, stroke: ink, 'stroke-width': 2 }));
    } else if (config.window.style === 'cross') {
      stage.appendChild(svgEl('rect', { x, y, width: w, height: h, fill: glass, stroke: ink, 'stroke-width': 3 }));
      stage.appendChild(svgEl('line', { x1: cx, y1: y, x2: cx, y2: y + h, stroke: ink, 'stroke-width': 2 }));
      stage.appendChild(svgEl('line', { x1: x, y1: cy, x2: x + w, y2: cy, stroke: ink, 'stroke-width': 2 }));
    } else {
      stage.appendChild(svgEl('rect', { x, y, width: w, height: h, fill: glass, stroke: ink, 'stroke-width': 3, rx: 2 }));
      stage.appendChild(svgEl('line', { x1: cx, y1: y, x2: cx, y2: y + h, stroke: ink, 'stroke-width': 2 }));
    }
    // shutter
    if (config.scene === 'night') {
      // glow
      stage.appendChild(svgEl('rect', { x: x + 2, y: y + 2, width: w - 4, height: h - 4, fill: '#ffe066', opacity: 0.6 }));
    }
  }

  // Yard items
  function drawTree(cx, gy) {
    const ink = '#3a2a18';
    stage.appendChild(svgEl('rect', { x: cx - 4, y: gy - 30, width: 8, height: 30, fill: '#7a4a22', stroke: ink, 'stroke-width': 2 }));
    stage.appendChild(svgEl('circle', { cx, cy: gy - 38, r: 22, fill: config.scene === 'snow' ? '#e8f1e0' : '#5dba63', stroke: ink, 'stroke-width': 3 }));
    stage.appendChild(svgEl('circle', { cx: cx - 12, cy: gy - 30, r: 14, fill: config.scene === 'snow' ? '#e8f1e0' : '#5dba63', stroke: ink, 'stroke-width': 3 }));
    stage.appendChild(svgEl('circle', { cx: cx + 12, cy: gy - 30, r: 14, fill: config.scene === 'snow' ? '#e8f1e0' : '#5dba63', stroke: ink, 'stroke-width': 3 }));
  }
  function drawFlowerBed(cx, gy) {
    const ink = '#3a2a18';
    // dirt
    stage.appendChild(svgEl('ellipse', { cx, cy: gy + 8, rx: 30, ry: 6, fill: '#6f4624', stroke: ink, 'stroke-width': 2 }));
    // flowers
    const colors = ['#ff5577', '#ffd95a', '#fff', '#ff9eb5'];
    for (let i = -2; i <= 2; i++) {
      const fx = cx + i * 12;
      const fy = gy + 2;
      stage.appendChild(svgEl('rect', { x: fx - 1, y: fy - 12, width: 2, height: 12, fill: '#3a8a4a' }));
      const c = colors[(i + 2) % colors.length];
      const pet = (px, py) => stage.appendChild(svgEl('circle', { cx: px, cy: py, r: 3, fill: c, stroke: ink, 'stroke-width': 1 }));
      pet(fx - 3, fy - 13); pet(fx + 3, fy - 13); pet(fx, fy - 17); pet(fx, fy - 9);
      stage.appendChild(svgEl('circle', { cx: fx, cy: fy - 13, r: 1.5, fill: '#ffd54a' }));
    }
  }
  function drawMailbox(cx, gy) {
    const ink = '#3a2a18';
    stage.appendChild(svgEl('rect', { x: cx - 1.5, y: gy - 20, width: 3, height: 20, fill: '#5b3e22', stroke: ink, 'stroke-width': 1 }));
    stage.appendChild(svgEl('rect', { x: cx - 9, y: gy - 32, width: 18, height: 12, fill: '#aa3344', stroke: ink, 'stroke-width': 2, rx: 2 }));
    stage.appendChild(svgEl('rect', { x: cx + 6, y: gy - 28, width: 4, height: 5, fill: '#ffd700', stroke: ink, 'stroke-width': 1 }));
  }
  function drawLamp(cx, gy) {
    const ink = '#3a2a18';
    stage.appendChild(svgEl('rect', { x: cx - 1.5, y: gy - 36, width: 3, height: 36, fill: '#3a2a18' }));
    stage.appendChild(svgEl('circle', { cx, cy: gy - 38, r: 6, fill: config.scene === 'night' ? '#ffe066' : '#fff', stroke: ink, 'stroke-width': 2 }));
    if (config.scene === 'night') {
      stage.appendChild(svgEl('circle', { cx, cy: gy - 38, r: 14, fill: '#ffe066', opacity: 0.25 }));
    }
  }
  function drawBench(cx, gy) {
    const ink = '#3a2a18';
    stage.appendChild(svgEl('rect', { x: cx - 18, y: gy - 4, width: 36, height: 4, fill: '#9b6d44', stroke: ink, 'stroke-width': 2 }));
    stage.appendChild(svgEl('rect', { x: cx - 16, y: gy, width: 3, height: 8, fill: '#9b6d44', stroke: ink, 'stroke-width': 1 }));
    stage.appendChild(svgEl('rect', { x: cx + 13, y: gy, width: 3, height: 8, fill: '#9b6d44', stroke: ink, 'stroke-width': 1 }));
  }
  function drawFountain(cx, gy) {
    const ink = '#3a2a18';
    stage.appendChild(svgEl('ellipse', { cx, cy: gy, rx: 22, ry: 6, fill: '#8aa9d6', stroke: ink, 'stroke-width': 2 }));
    stage.appendChild(svgEl('rect', { x: cx - 3, y: gy - 14, width: 6, height: 14, fill: '#a0a4ad', stroke: ink, 'stroke-width': 1 }));
    stage.appendChild(svgEl('path', { d: `M ${cx - 6} ${gy - 14} q 6 -10 12 0`, stroke: '#5dadec', 'stroke-width': 2, fill: 'none' }));
    stage.appendChild(svgEl('path', { d: `M ${cx - 4} ${gy - 14} q 4 -6 8 0`, stroke: '#aedcf2', 'stroke-width': 2, fill: 'none' }));
  }
  function drawFence() {
    const ink = '#3a2a18';
    const gy = 200;
    for (let x = 110; x < 290; x += 12) {
      // skip behind door area
      if (x > 180 && x < 220) continue;
      stage.appendChild(svgEl('path', { d: `M ${x} ${gy + 12} L ${x} ${gy + 4} L ${x + 3} ${gy} L ${x + 6} ${gy + 4} L ${x + 6} ${gy + 12} Z`,
        fill: '#fff', stroke: ink, 'stroke-width': 1.5 }));
    }
  }
  function drawPet(cx, gy) {
    const ink = '#3a2a18';
    stage.appendChild(svgEl('ellipse', { cx, cy: gy + 4, rx: 14, ry: 5, fill: '#fff', stroke: ink, 'stroke-width': 2 }));
    stage.appendChild(svgEl('circle', { cx: cx + 12, cy: gy - 4, r: 7, fill: '#fff', stroke: ink, 'stroke-width': 2 }));
    stage.appendChild(svgEl('path', { d: `M ${cx + 9} ${gy - 11} L ${cx + 11} ${gy - 6} L ${cx + 13} ${gy - 11}`, fill: '#fff', stroke: ink, 'stroke-width': 1.5 }));
    stage.appendChild(svgEl('path', { d: `M ${cx + 14} ${gy - 11} L ${cx + 16} ${gy - 6} L ${cx + 18} ${gy - 11}`, fill: '#fff', stroke: ink, 'stroke-width': 1.5 }));
    stage.appendChild(svgEl('circle', { cx: cx + 10, cy: gy - 5, r: 1, fill: ink }));
    stage.appendChild(svgEl('circle', { cx: cx + 14, cy: gy - 5, r: 1, fill: ink }));
    stage.appendChild(svgEl('path', { d: `M ${cx - 14} ${gy + 4} q -6 -2 -8 -10`, stroke: ink, 'stroke-width': 2, fill: 'none' }));
  }

  // Shade helper (darken/lighten a hex by amount in -100..100)
  function shade(hex, amt) {
    const m = hex.replace('#', '').match(/.{2}/g);
    if (!m) return hex;
    const out = m.map((c) => {
      const n = Math.max(0, Math.min(255, parseInt(c, 16) + amt));
      return n.toString(16).padStart(2, '0');
    });
    return '#' + out.join('');
  }

  // ---------- Panel rendering ----------
  function renderPanel() {
    clearChildren(panel);
    if (activeTab === 'roof') {
      panel.appendChild(htmlEl('h3', { text: '形' }));
      panel.appendChild(makeShapeGrid(ROOF_SHAPES, config.roof.shape, (id) => { config.roof.shape = id; afterChange(); }, (id) => roofThumb(id, config.roof.color)));
      panel.appendChild(htmlEl('h3', { text: '色' }));
      panel.appendChild(makeColorGrid(ROOF_COLORS, config.roof.color, (c) => { config.roof.color = c; afterChange(); }));
    } else if (activeTab === 'wall') {
      panel.appendChild(htmlEl('h3', { text: '素材' }));
      panel.appendChild(makeShapeGrid(WALL_MATS, config.wall.material, (id) => { config.wall.material = id; afterChange(); }, (id) => wallThumb(id, config.wall.color)));
      panel.appendChild(htmlEl('h3', { text: '色' }));
      panel.appendChild(makeColorGrid(WALL_COLORS, config.wall.color, (c) => { config.wall.color = c; afterChange(); }));
    } else if (activeTab === 'door') {
      panel.appendChild(htmlEl('h3', { text: '形' }));
      panel.appendChild(makeShapeGrid(DOOR_STYLES, config.door.style, (id) => { config.door.style = id; afterChange(); }, (id) => doorThumb(id, config.door.color)));
      panel.appendChild(htmlEl('h3', { text: '色' }));
      panel.appendChild(makeColorGrid(DOOR_COLORS, config.door.color, (c) => { config.door.color = c; afterChange(); }));
    } else if (activeTab === 'window') {
      panel.appendChild(htmlEl('h3', { text: '形' }));
      panel.appendChild(makeShapeGrid(WINDOW_STYLES, config.window.style, (id) => { config.window.style = id; afterChange(); }, (id) => windowThumb(id)));
    } else if (activeTab === 'yard') {
      panel.appendChild(htmlEl('h3', { text: '庭の飾り（タップでON/OFF）' }));
      const grid = htmlEl('div', { class: 'opt-toggle' });
      for (const item of YARD_ITEMS) {
        const on = !!config.yard[item.id];
        const b = htmlEl('button', { class: 'opt' + (on ? ' on' : '') });
        b.appendChild(htmlEl('span', { class: 'emoji', text: item.emoji }));
        b.appendChild(htmlEl('span', { text: item.label }));
        b.addEventListener('click', () => {
          config.yard[item.id] = !on;
          afterChange();
        });
        grid.appendChild(b);
      }
      panel.appendChild(grid);
    } else if (activeTab === 'scene') {
      panel.appendChild(htmlEl('h3', { text: '時間／天気' }));
      const grid = htmlEl('div', { class: 'opt-grid' });
      for (const s of SCENES) {
        const b = htmlEl('button', { class: 'opt' + (config.scene === s.id ? ' on' : '') });
        const sw = htmlEl('div', { class: 'swatch' });
        const mini = svgPreview(40, 30);
        const grad = svgEl('linearGradient', { id: 'sg-' + s.id, x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
        grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': s.sky[0] }));
        grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': s.sky[1] }));
        const defs = svgEl('defs');
        defs.appendChild(grad);
        mini.appendChild(defs);
        mini.appendChild(svgEl('rect', { x: 0, y: 0, width: 40, height: 22, fill: `url(#sg-${s.id})` }));
        mini.appendChild(svgEl('rect', { x: 0, y: 22, width: 40, height: 8, fill: s.ground }));
        sw.appendChild(mini);
        b.appendChild(sw);
        b.appendChild(htmlEl('span', { text: s.label }));
        b.addEventListener('click', () => { config.scene = s.id; afterChange(); });
        grid.appendChild(b);
      }
      panel.appendChild(grid);
    }
  }

  function makeShapeGrid(items, currentId, onPick, thumbBuilder) {
    const grid = htmlEl('div', { class: 'opt-grid' });
    for (const item of items) {
      const b = htmlEl('button', { class: 'opt' + (item.id === currentId ? ' on' : '') });
      const sw = htmlEl('div', { class: 'swatch' });
      sw.appendChild(thumbBuilder(item.id));
      b.appendChild(sw);
      b.appendChild(htmlEl('span', { text: item.label }));
      b.addEventListener('click', () => onPick(item.id));
      grid.appendChild(b);
    }
    return grid;
  }
  function makeColorGrid(colors, currentColor, onPick) {
    const grid = htmlEl('div', { class: 'opt-grid' });
    for (const c of colors) {
      const b = htmlEl('button', { class: 'opt' + (c === currentColor ? ' on' : '') });
      const sw = htmlEl('div', { class: 'swatch', style: { background: c } });
      b.appendChild(sw);
      b.appendChild(htmlEl('span', { text: '' }));
      b.addEventListener('click', () => onPick(c));
      grid.appendChild(b);
    }
    return grid;
  }

  function svgPreview(w, h) {
    const s = svgEl('svg', { viewBox: `0 0 ${w} ${h}`, xmlns: SVG_NS });
    s.style.width = '100%';
    s.style.height = '100%';
    return s;
  }
  function roofThumb(shape, color) {
    const s = svgPreview(40, 30);
    s.appendChild(svgEl('rect', { x: 6, y: 16, width: 28, height: 12, fill: '#fff2d6', stroke: '#3a2a18', 'stroke-width': 1.5 }));
    if (shape === 'tri') s.appendChild(svgEl('polygon', { points: '4,16 20,4 36,16', fill: color, stroke: '#3a2a18', 'stroke-width': 1.5 }));
    else if (shape === 'flat') s.appendChild(svgEl('rect', { x: 4, y: 12, width: 32, height: 4, fill: color, stroke: '#3a2a18', 'stroke-width': 1.5 }));
    else if (shape === 'curve') s.appendChild(svgEl('path', { d: 'M 4 16 Q 20 0 36 16 Z', fill: color, stroke: '#3a2a18', 'stroke-width': 1.5 }));
    else if (shape === 'mansard') {
      s.appendChild(svgEl('polygon', { points: '10,8 20,2 30,8', fill: shade(color, -10), stroke: '#3a2a18', 'stroke-width': 1.5 }));
      s.appendChild(svgEl('polygon', { points: '4,16 10,8 30,8 36,16', fill: color, stroke: '#3a2a18', 'stroke-width': 1.5 }));
    }
    return s;
  }
  function wallThumb(material, color) {
    const s = svgPreview(40, 30);
    s.appendChild(svgEl('rect', { x: 4, y: 4, width: 32, height: 22, fill: color, stroke: '#3a2a18', 'stroke-width': 1.5 }));
    if (material === 'wood') {
      for (let y = 10; y < 26; y += 6) s.appendChild(svgEl('line', { x1: 5, y1: y, x2: 35, y2: y, stroke: 'rgba(0,0,0,0.3)', 'stroke-width': 0.7 }));
    } else if (material === 'brick') {
      for (let y = 8; y < 26; y += 6) {
        const off = ((y / 6) | 0) % 2 ? 4 : 0;
        s.appendChild(svgEl('line', { x1: 4, y1: y, x2: 36, y2: y, stroke: 'rgba(120,60,30,0.5)', 'stroke-width': 0.7 }));
        for (let x = 4 + off; x < 36; x += 8) s.appendChild(svgEl('line', { x1: x, y1: y - 6, x2: x, y2: y, stroke: 'rgba(120,60,30,0.5)', 'stroke-width': 0.7 }));
      }
    } else if (material === 'stripe') {
      for (let y = 7; y < 26; y += 5) s.appendChild(svgEl('rect', { x: 4, y, width: 32, height: 2.5, fill: 'rgba(255,255,255,0.5)' }));
    }
    return s;
  }
  function doorThumb(style, color) {
    const s = svgPreview(40, 30);
    if (style === 'arch') s.appendChild(svgEl('path', { d: 'M 12 28 L 12 12 Q 20 4 28 12 L 28 28 Z', fill: color, stroke: '#3a2a18', 'stroke-width': 1.5 }));
    else if (style === 'glass') s.appendChild(svgEl('rect', { x: 12, y: 6, width: 16, height: 22, fill: '#a4d4ff', stroke: '#3a2a18', 'stroke-width': 1.5, rx: 1 }));
    else s.appendChild(svgEl('rect', { x: 12, y: 6, width: 16, height: 22, fill: color, stroke: '#3a2a18', 'stroke-width': 1.5, rx: style === 'modern' ? 0 : 2 }));
    s.appendChild(svgEl('circle', { cx: 25, cy: 18, r: 1.5, fill: '#ffd700' }));
    return s;
  }
  function windowThumb(style) {
    const s = svgPreview(40, 30);
    s.appendChild(svgEl('rect', { x: 4, y: 4, width: 32, height: 22, fill: '#fff2d6', stroke: '#3a2a18', 'stroke-width': 1.5 }));
    if (style === 'sq') {
      s.appendChild(svgEl('rect', { x: 12, y: 8, width: 16, height: 14, fill: '#a4d4ff', stroke: '#3a2a18', 'stroke-width': 1.5 }));
      s.appendChild(svgEl('line', { x1: 20, y1: 8, x2: 20, y2: 22, stroke: '#3a2a18', 'stroke-width': 1 }));
    } else if (style === 'round') {
      s.appendChild(svgEl('circle', { cx: 20, cy: 15, r: 7, fill: '#a4d4ff', stroke: '#3a2a18', 'stroke-width': 1.5 }));
      s.appendChild(svgEl('line', { x1: 20, y1: 8, x2: 20, y2: 22, stroke: '#3a2a18', 'stroke-width': 1 }));
    } else if (style === 'arch') {
      s.appendChild(svgEl('path', { d: 'M 12 22 L 12 11 Q 20 5 28 11 L 28 22 Z', fill: '#a4d4ff', stroke: '#3a2a18', 'stroke-width': 1.5 }));
    } else if (style === 'cross') {
      s.appendChild(svgEl('rect', { x: 12, y: 8, width: 16, height: 14, fill: '#a4d4ff', stroke: '#3a2a18', 'stroke-width': 1.5 }));
      s.appendChild(svgEl('line', { x1: 20, y1: 8, x2: 20, y2: 22, stroke: '#3a2a18', 'stroke-width': 1 }));
      s.appendChild(svgEl('line', { x1: 12, y1: 15, x2: 28, y2: 15, stroke: '#3a2a18', 'stroke-width': 1 }));
    }
    return s;
  }

  function afterChange() {
    save();
    renderHouse();
    renderPanel();
  }

  // ---------- Tabs ----------
  document.querySelectorAll('.tab').forEach((t) => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === t));
      activeTab = t.dataset.tab;
      renderPanel();
    });
  });

  $('btn-rand').addEventListener('click', () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    config = {
      roof:  { shape: pick(ROOF_SHAPES).id, color: pick(ROOF_COLORS) },
      wall:  { material: pick(WALL_MATS).id, color: pick(WALL_COLORS) },
      door:  { style: pick(DOOR_STYLES).id, color: pick(DOOR_COLORS) },
      window:{ style: pick(WINDOW_STYLES).id },
      yard:  Object.fromEntries(YARD_ITEMS.map((i) => [i.id, Math.random() < 0.5])),
      scene: pick(SCENES).id
    };
    afterChange();
    showToast('🎲 ランダム生成');
  });
  $('btn-save').addEventListener('click', () => {
    save();
    showToast('💾 保存しました');
  });
  $('btn-reset').addEventListener('click', () => {
    if (!confirm('リセットしますか？')) return;
    config = defaultConfig();
    afterChange();
    showToast('リセットしました');
  });
  $('btn-share').addEventListener('click', () => {
    const txt = `マイおうち作ったよ！屋根:${ROOF_SHAPES.find(s=>s.id===config.roof.shape)?.label}/壁:${WALL_MATS.find(s=>s.id===config.wall.material)?.label} #マイおうち`;
    const url = `https://x.com/intent/post?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(SHARE_URL)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  // Initial
  renderHouse();
  renderPanel();
})();
