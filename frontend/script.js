// ----------------- Config -----------------
const ANIM_DELAY = 220; 
const NODE_RADIUS = 20;

// ----------------- Mode Switching -----------------
const sortingBtn = document.getElementById("sortingBtn");
const pathfindingBtn = document.getElementById("pathfindingBtn");
const sortingSection = document.getElementById("sortingSection");
const pathfindingSection = document.getElementById("pathfindingSection");

sortingBtn.onclick = () => {
  sortingBtn.classList.add("active");
  pathfindingBtn.classList.remove("active");
  sortingSection.classList.add("visible");
  pathfindingSection.classList.remove("visible");
};
pathfindingBtn.onclick = () => {
  pathfindingBtn.classList.add("active");
  sortingBtn.classList.remove("active");
  pathfindingSection.classList.add("visible");
  sortingSection.classList.remove("visible");
};

// ----------------- Sorting Visualizer -----------------
const arrayInput = document.getElementById("arrayInput");
const sortSelect = document.getElementById("sortSelect");
const runSortBtn = document.getElementById("runSortBtn");
const visualContainer = document.getElementById("visualContainer");
const comparisonTable = document.querySelector("#comparisonTable tbody");
const historyDiv = document.getElementById("history");

function parseInputArray(input) {
  return input.split(",").map(v => v.trim()).filter(v => v.length > 0).map(v => {
    const num = parseFloat(v);
    return isFinite(num) ? num : v;
  });
}

function getValue(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") return v.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 0;
}

function createChartElement(titleText) {
  const chart = document.createElement("div");
  chart.className = "chart";
  const title = document.createElement("h3");
  title.textContent = titleText;
  chart.appendChild(title);
  const barsWrapper = document.createElement("div");
  barsWrapper.className = "barsWrapper";
  chart.appendChild(barsWrapper);
  return { chart, barsWrapper };
}

function renderBarsTo(wrapper, values, color = "#3b82f6") {
  wrapper.innerHTML = "";
  const maxVal = Math.max(...values.map(getValue), 1);
  const n = values.length || 1;
  values.forEach(v => {
    const bar = document.createElement("div");
    bar.className = "bar";
    const h = (Math.abs(getValue(v)) / maxVal) * 220 + 40;
    bar.style.height = `${h}px`;
    bar.style.width = `${100 / n - 2}%`;
    bar.style.background = color;
    const label = document.createElement("span");
    label.textContent = v;
    bar.appendChild(label);
    wrapper.appendChild(bar);
  });
}

// --- Sorting snapshot functions ---
function bubbleSnapshots(arr) {
  const a = [...arr]; const snaps = [a.slice()]; let steps = 0, swaps = 0;
  for (let i = 0; i < a.length - 1; i++)
    for (let j = 0; j < a.length - i - 1; j++) {
      steps++; if (getValue(a[j]) > getValue(a[j + 1])) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; swaps++; snaps.push(a.slice()); }
    }
  return { snaps, steps, swaps };
}

function selectionSnapshots(arr) {
  const a = [...arr]; const snaps = [a.slice()]; let steps = 0, swaps = 0;
  for (let i = 0; i < a.length; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) { steps++; if (getValue(a[j]) < getValue(a[min])) min = j; }
    if (min !== i) { [a[i], a[min]] = [a[min], a[i]]; swaps++; snaps.push(a.slice()); }
  } return { snaps, steps, swaps };
}

function insertionSnapshots(arr) {
  const a = [...arr]; const snaps = [a.slice()]; let steps = 0, swaps = 0;
  for (let i = 1; i < a.length; i++) {
    let key = a[i]; let j = i - 1;
    while (j >= 0 && getValue(a[j]) > getValue(key)) { a[j + 1] = a[j]; j--; steps++; swaps++; snaps.push(a.slice()); }
    a[j + 1] = key; snaps.push(a.slice());
  } return { snaps, steps, swaps };
}

function mergeSnapshots(arr) {
  const snaps = []; let steps = 0, swaps = 0;
  function merge(left, right) {
    const result = []; let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      steps++; if (getValue(left[i]) < getValue(right[j])) result.push(left[i++]); else result.push(right[j++]);
      snaps.push(result.concat(left.slice(i)).concat(right.slice(j)));
    }
    return [...result, ...left.slice(i), ...right.slice(j)];
  }
  function divide(a) { if (a.length <= 1) return a; const mid = Math.floor(a.length / 2); const l = divide(a.slice(0, mid)); const r = divide(a.slice(mid)); const m = merge(l, r); snaps.push(m.slice()); return m; }
  const sorted = divide(arr.slice()); if (snaps.length === 0) snaps.push(sorted.slice()); return { snaps, steps, swaps };
}

function quickSnapshots(arr) {
  const snaps = []; let steps = 0, swaps = 0;
  function sort(a) {
    if (a.length <= 1) return a;
    const pivot = a[a.length - 1]; const left = []; const right = [];
    for (let i = 0; i < a.length - 1; i++) { steps++; if (getValue(a[i]) < getValue(pivot)) left.push(a[i]); else right.push(a[i]); snaps.push(left.concat([pivot]).concat(right)); }
    const res = sort(left).concat([pivot], sort(right)); snaps.push(res.slice()); return res;
  }
  const sorted = sort(arr.slice()); if (snaps.length === 0) snaps.push(sorted.slice()); return { snaps, steps, swaps };
}

function heapSnapshots(arr) {
  const a = arr.slice(); const snaps = [a.slice()]; let steps = 0, swaps = 0;
  function heapify(n, i) {
    let largest = i, left = 2 * i + 1, right = 2 * i + 2;
    if (left < n && getValue(a[left]) > getValue(a[largest])) largest = left;
    if (right < n && getValue(a[right]) > getValue(a[largest])) largest = right;
    if (largest !== i) { [a[i], a[largest]] = [a[largest], a[i]]; swaps++; steps++; snaps.push(a.slice()); heapify(n, largest); }
  }
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) heapify(a.length, i);
  for (let i = a.length - 1; i > 0; i--) { [a[0], a[i]] = [a[i], a[0]]; swaps++; snaps.push(a.slice()); heapify(i, 0); }
  return { snaps, steps, swaps };
}

const SORT_SNAPSHOT_FUNCS = { bubble: bubbleSnapshots, selection: selectionSnapshots, insertion: insertionSnapshots, merge: mergeSnapshots, quick: quickSnapshots, heap: heapSnapshots };

async function animateAllAlgorithms(values) {
  visualContainer.innerHTML = ""; comparisonTable.innerHTML = "";
  const algoNames = Object.keys(SORT_SNAPSHOT_FUNCS); const panels = {}; const results = {};
  for (const name of algoNames) {
    const startTime = performance.now();
    const { snaps, steps, swaps } = SORT_SNAPSHOT_FUNCS[name](values);
    const endTime = performance.now();
    const timeMs = (endTime - startTime).toFixed(2);
    results[name] = { snaps, steps, swaps, timeMs, complexity: ["merge", "quick", "heap"].includes(name) ? "O(n log n)" : "O(n²)" };
    const { chart, barsWrapper } = createChartElement(name.toUpperCase());
    visualContainer.appendChild(chart); panels[name] = { chart, barsWrapper };
    renderBarsTo(barsWrapper, snaps[0] || values, name === sortSelect.value ? "#f97316" : "#3b82f6");
    const trow = document.createElement("tr");
    trow.innerHTML = `<td>${name.toUpperCase()}</td><td>${steps}</td><td>${timeMs} ms</td><td>${swaps}</td><td>${results[name].complexity}</td>`;
    comparisonTable.appendChild(trow);
  }

  const maxFrames = Math.max(...Object.values(results).map(r => r.snaps.length));
  for (let frame = 0; frame < maxFrames; frame++) {
    for (const name of algoNames) {
      const snaps = results[name].snaps;
      const arr = snaps[Math.min(frame, snaps.length - 1)] || snaps[snaps.length - 1] || values;
      renderBarsTo(panels[name].barsWrapper, arr, name === sortSelect.value ? "#f97316" : "#3b82f6");
    }
    await new Promise(res => setTimeout(res, ANIM_DELAY));
  }

  const sel = sortSelect.value;
  const finalSorted = results[sel].snaps[results[sel].snaps.length - 1] || values;
  const historyItem = document.createElement("p");
  historyItem.textContent = `Sorted [${values}] using ${sel.toUpperCase()} → [${finalSorted}]`;
  historyDiv.prepend(historyItem);
}

runSortBtn.onclick = async () => {
  const values = parseInputArray(arrayInput.value);
  if (!values.length) return alert("Enter some values!");
  await animateAllAlgorithms(values);
};

// ----------------- Pathfinding Visualizer -----------------
const graphCanvas = document.getElementById("graphCanvas");
const ctx = graphCanvas.getContext("2d");
const addNodeBtn = document.getElementById("addNodeBtn");
const addEdgeBtn = document.getElementById("addEdgeBtn");
const runPathBtn = document.getElementById("runPathBtn");
const resetGraphBtn = document.getElementById("resetGraphBtn");
const weightedSelect = document.getElementById("weightedSelect");
const directedSelect = document.getElementById("directedSelect");
const pathAlgoSelect = document.getElementById("pathAlgoSelect");
const pathCostDisplay = document.getElementById("pathCostDisplay");

let nodes = [], edges = [], nodeCount = 0;
let mode = null, edgeFromNode = null;

function distance(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }

function drawGraph(highlightPath = []) {
  ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
  ctx.font = "14px Poppins";

  edges.forEach(e => {
    const from = nodes.find(n => n.id === e.from); const to = nodes.find(n => n.id === e.to);
    if (!from || !to) return;

    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = directedSelect.value === "directed" ? "#f97316" : "#60a5fa"; ctx.lineWidth = 2; ctx.stroke();

    if (directedSelect.value === "directed") {
      const angle = Math.atan2(to.y - from.y, to.x - from.x); const headlen = 12;
      const arrowX = to.x - NODE_RADIUS * Math.cos(angle);
      const arrowY = to.y - NODE_RADIUS * Math.sin(angle);
      ctx.beginPath(); ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - headlen * Math.cos(angle - Math.PI / 7), arrowY - headlen * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(arrowX - headlen * Math.cos(angle + Math.PI / 7), arrowY - headlen * Math.sin(angle + Math.PI / 7));
      ctx.closePath(); ctx.fillStyle = "#f97316"; ctx.fill();
    }

    if (e.weight !== undefined) {
      const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
      ctx.fillStyle = "white"; ctx.fillText(String(e.weight), mx + 6, my - 6);
    }
  });

  if (highlightPath.length > 1) {
    for (let i = 0; i < highlightPath.length - 1; i++) {
      const a = nodes.find(n => n.id === highlightPath[i]); const b = nodes.find(n => n.id === highlightPath[i + 1]);
      if (!a || !b) continue;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 4; ctx.stroke();
    }
  }

  nodes.forEach(n => {
    ctx.beginPath(); ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2); ctx.fillStyle = "#3b82f6"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "#0b1220"; ctx.stroke(); ctx.fillStyle = "white"; ctx.fillText(String(n.id), n.x - 6, n.y + 6);
  });
}

// --- Canvas click logic ---
graphCanvas.addEventListener("click", e => {
  const rect = graphCanvas.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;

  if (mode === "addNode") { nodes.push({ id: nodeCount++, x, y }); drawGraph(); return; }

  if (mode === "addEdge") {
    const clicked = nodes.find(n => distance(n.x, n.y, x, y) <= NODE_RADIUS + 4); if (!clicked) return;
    if (!edgeFromNode) { edgeFromNode = clicked; drawGraph(); ctx.beginPath(); ctx.arc(edgeFromNode.x, edgeFromNode.y, NODE_RADIUS + 4, 0, Math.PI * 2); ctx.strokeStyle = "#f97316"; ctx.lineWidth = 3; ctx.stroke(); return; }
    else {
      let weight = 1;
      if (weightedSelect.value === "yes") { const w = prompt("Enter weight (number):", "1"); const parsed = parseFloat(w); weight = isFinite(parsed) ? parsed : 1; }
      edges.push({ from: edgeFromNode.id, to: clicked.id, weight });
      if (directedSelect.value === "undirected") edges.push({ from: clicked.id, to: edgeFromNode.id, weight });
      edgeFromNode = null; drawGraph(); return;
    }
  }
});

addNodeBtn.onclick = () => { mode = mode === "addNode" ? null : "addNode"; edgeFromNode = null; };
addEdgeBtn.onclick = () => { mode = mode === "addEdge" ? null : "addEdge"; edgeFromNode = null; };
resetGraphBtn.onclick = () => { nodes = []; edges = []; nodeCount = 0; drawGraph(); pathCostDisplay.textContent = ""; };

async function animatePath(path) { for (let i = 0; i < path.length; i++) { drawGraph(path.slice(0, i + 1)); await new Promise(res => setTimeout(res, 500)); } }

function getNeighbors(id) { return edges.filter(e => e.from === id).map(e => ({ id: e.to, weight: e.weight || 1 })); }

// --- Pathfinding Algorithms ---
function bfs(start, goal) { const queue = [[start]]; const visited = new Set([start]); while (queue.length) { const path = queue.shift(); const node = path[path.length - 1]; if (node === goal) return { path, cost: path.length - 1 }; for (const n of getNeighbors(node)) if (!visited.has(n.id)) { visited.add(n.id); queue.push([...path, n.id]); } } return { path: [], cost: Infinity }; }

function dfs(start, goal, visited = new Set(), path = []) { visited.add(start); path.push(start); if (start === goal) return { path: [...path], cost: path.length - 1 }; for (const n of getNeighbors(start)) if (!visited.has(n.id)) { const res = dfs(n.id, goal, visited, path); if (res.path.length) return res; } path.pop(); return { path: [], cost: Infinity }; }

function dijkstra(start, goal) { const dist = {}, prev = {}, pq = []; nodes.forEach(n => dist[n.id] = Infinity); dist[start] = 0; pq.push({ id: start, dist: 0 }); while (pq.length) { pq.sort((a, b) => a.dist - b.dist); const { id: node } = pq.shift(); if (node === goal) break; for (const n of getNeighbors(node)) { const alt = dist[node] + n.weight; if (alt < dist[n.id]) { dist[n.id] = alt; prev[n.id] = node; pq.push({ id: n.id, dist: alt }); } } } const path = []; let u = goal; while (u !== undefined) { path.unshift(u); u = prev[u]; } return { path, cost: dist[goal] }; }

function bellmanFord(start, goal) { const dist = {}, prev = {}; nodes.forEach(n => dist[n.id] = Infinity); dist[start] = 0; for (let i = 0; i < nodes.length - 1; i++) for (const e of edges) if (dist[e.from] + e.weight < dist[e.to]) { dist[e.to] = dist[e.from] + e.weight; prev[e.to] = e.from; } const path = []; let u = goal; while (u !== undefined) { path.unshift(u); u = prev[u]; } return { path, cost: dist[goal] }; }

function aStar(start, goal) {
  const openSet = new Set([start]); const cameFrom = {}; const gScore = {}, fScore = {};
  nodes.forEach(n => { gScore[n.id] = Infinity; fScore[n.id] = Infinity; });
  gScore[start] = 0;
  const startNode = nodes.find(n => n.id === start);
  const goalNode = nodes.find(n => n.id === goal);
  fScore[start] = distance(startNode.x, startNode.y, goalNode.x, goalNode.y);

  while (openSet.size > 0) {
    let current = [...openSet].reduce((a, b) => fScore[a] < fScore[b] ? a : b);
    if (current === goal) break;
    openSet.delete(current);

    for (const neighbor of getNeighbors(current)) {
      const tentativeG = gScore[current] + neighbor.weight;
      if (tentativeG < gScore[neighbor.id]) {
        cameFrom[neighbor.id] = current;
        gScore[neighbor.id] = tentativeG;
        const neighborNode = nodes.find(n => n.id === neighbor.id);
        fScore[neighbor.id] = gScore[neighbor.id] + distance(neighborNode.x, neighborNode.y, goalNode.x, goalNode.y);
        openSet.add(neighbor.id);
      }
    }
  }

  const path = []; let u = goal; while (u !== undefined) { path.unshift(u); u = cameFrom[u]; }
  return { path, cost: gScore[goal] };
}

// --- Run Path ---
runPathBtn.onclick = async () => {
  if (nodes.length === 0 || edges.length === 0) { alert("Add nodes/edges first!"); return; }
  const startId = parseInt(prompt("Enter start node ID:")); const endId = parseInt(prompt("Enter target node ID:"));
  if (isNaN(startId) || isNaN(endId)) { alert("Invalid node IDs!"); return; }

  let pathResult;
  switch (pathAlgoSelect.value) {
    case "bfs": pathResult = bfs(startId, endId); break;
    case "dfs": pathResult = dfs(startId, endId); break;
    case "dijkstra": pathResult = dijkstra(startId, endId); break;
    case "bellmanford": pathResult = bellmanFord(startId, endId); break;
    case "astar": pathResult = aStar(startId, endId); break;
  }

  if (pathResult.path.length === 0) alert("No path found!");
  else { await animatePath(pathResult.path); pathCostDisplay.textContent = `Path: ${pathResult.path.join(" → ")} | Cost: ${pathResult.cost}`; }
};

drawGraph();
