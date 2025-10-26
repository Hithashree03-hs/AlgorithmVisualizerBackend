

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

function measure(fn) {
  const start = process.hrtime();
  const result = fn();
  const diff = process.hrtime(start);
  const timeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(3);
  return { result, timeMs };
}



function bubbleSort(arr) {
  let steps = 0;
  const a = arr.slice();
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      steps++;
      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
    }
  }
  return { sorted: a, steps };
}

function insertionSort(arr) {
  let steps = 0;
  const a = arr.slice();
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
      steps++;
    }
    a[j + 1] = key;
  }
  return { sorted: a, steps };
}

function mergeSort(arr) {
  let steps = 0;
  const merge = (l, r) => {
    const res = [];
    let i = 0, j = 0;
    while (i < l.length && j < r.length) {
      steps++;
      if (l[i] <= r[j]) res.push(l[i++]);
      else res.push(r[j++]);
    }
    return [...res, ...l.slice(i), ...r.slice(j)];
  };
  const sort = (a) => {
    if (a.length <= 1) return a;
    const mid = Math.floor(a.length / 2);
    return merge(sort(a.slice(0, mid)), sort(a.slice(mid)));
  };
  return { sorted: sort(arr), steps };
}

function quickSort(arr) {
  let steps = 0;
  const sort = (a) => {
    if (a.length <= 1) return a;
    const pivot = a[a.length - 1];
    const left = [], right = [];
    for (let i = 0; i < a.length - 1; i++) {
      steps++;
      if (a[i] < pivot) left.push(a[i]);
      else right.push(a[i]);
    }
    return [...sort(left), pivot, ...sort(right)];
  };
  return { sorted: sort(arr), steps };
}

function heapSort(arr) {
  const a = arr.slice();
  let steps = 0;
  const n = a.length;

  const heapify = (n, i) => {
    let largest = i, l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && a[l] > a[largest]) largest = l;
    if (r < n && a[r] > a[largest]) largest = r;
    if (largest !== i) {
      [a[i], a[largest]] = [a[largest], a[i]];
      steps++;
      heapify(n, largest);
    }
  };

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    steps++;
    heapify(i, 0);
  }
  return { sorted: a, steps };
}

const SORTING_ALGOS = { bubble: bubbleSort, insertion: insertionSort, merge: mergeSort, quick: quickSort, heap: heapSort };

app.post("/api/sort", (req, res) => {
  const { algorithm, array } = req.body;
  if (!SORTING_ALGOS[algorithm]) return res.status(400).json({ error: "Unknown algorithm" });
  const { result, timeMs } = measure(() => SORTING_ALGOS[algorithm](array));
  return res.json({ algorithm, input: array, output: result.sorted, steps: result.steps, timeMs });
});


function neighbors(grid, r, c) {
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const res = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nc >= 0 && nr < grid.length && nc < grid[0].length && grid[nr][nc] === 0) {
      res.push({ r: nr, c: nc });
    }
  }
  return res;
}

function reconstructPath(parent, start, end) {
  const path = [];
  let key = `${end.r},${end.c}`;
  while (key && parent[key]) {
    const [r, c] = key.split(",").map(Number);
    path.unshift({ r, c });
    key = parent[key];
  }
  path.unshift(start);
  return path;
}


function bfs(grid, start, end) {
  const queue = [start];
  const parent = {};
  const visited = new Set([`${start.r},${start.c}`]);
  let steps = 0;

  while (queue.length) {
    const cur = queue.shift();
    if (cur.r === end.r && cur.c === end.c) break;
    for (const n of neighbors(grid, cur.r, cur.c)) {
      const key = `${n.r},${n.c}`;
      if (!visited.has(key)) {
        visited.add(key);
        parent[key] = `${cur.r},${cur.c}`;
        queue.push(n);
        steps++;
      }
    }
  }
  return { path: reconstructPath(parent, start, end), steps };
}


function dfs(grid, start, end) {
  const stack = [start];
  const parent = {};
  const visited = new Set([`${start.r},${start.c}`]);
  let steps = 0;

  while (stack.length) {
    const cur = stack.pop();
    if (cur.r === end.r && cur.c === end.c) break;
    for (const n of neighbors(grid, cur.r, cur.c)) {
      const key = `${n.r},${n.c}`;
      if (!visited.has(key)) {
        visited.add(key);
        parent[key] = `${cur.r},${cur.c}`;
        stack.push(n);
        steps++;
      }
    }
  }
  return { path: reconstructPath(parent, start, end), steps };
}


function dijkstra(grid, start, end) {
  const dist = {};
  const parent = {};
  const pq = [{ r: start.r, c: start.c, d: 0 }];
  dist[`${start.r},${start.c}`] = 0;
  let steps = 0;

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const cur = pq.shift();
    if (cur.r === end.r && cur.c === end.c) break;

    for (const n of neighbors(grid, cur.r, cur.c)) {
      const key = `${n.r},${n.c}`;
      const alt = (dist[`${cur.r},${cur.c}`] || 0) + 1;
      if (alt < (dist[key] || Infinity)) {
        dist[key] = alt;
        parent[key] = `${cur.r},${cur.c}`;
        pq.push({ ...n, d: alt });
        steps++;
      }
    }
  }
  return { path: reconstructPath(parent, start, end), steps };
}

function aStar(grid, start, end) {
  const h = (r, c) => Math.abs(r - end.r) + Math.abs(c - end.c);
  const g = {};
  const f = {};
  const parent = {};
  const pq = [{ r: start.r, c: start.c, f: h(start.r, start.c) }];
  g[`${start.r},${start.c}`] = 0;
  f[`${start.r},${start.c}`] = h(start.r, start.c);
  let steps = 0;

  while (pq.length) {
    pq.sort((a, b) => a.f - b.f);
    const cur = pq.shift();
    if (cur.r === end.r && cur.c === end.c) break;

    for (const n of neighbors(grid, cur.r, cur.c)) {
      const gNew = g[`${cur.r},${cur.c}`] + 1;
      const key = `${n.r},${n.c}`;
      if (gNew < (g[key] || Infinity)) {
        g[key] = gNew;
        f[key] = gNew + h(n.r, n.c);
        parent[key] = `${cur.r},${cur.c}`;
        pq.push({ ...n, f: f[key] });
        steps++;
      }
    }
  }
  return { path: reconstructPath(parent, start, end), steps };
}


function bellmanFord(grid, start, end) {
  const dist = {};
  const parent = {};
  const rows = grid.length, cols = grid[0].length;
  const allCells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      allCells.push({ r, c });
      dist[`${r},${c}`] = Infinity;
    }
  }

  dist[`${start.r},${start.c}`] = 0;
  let steps = 0;

  for (let i = 0; i < allCells.length - 1; i++) {
    for (const cell of allCells) {
      for (const n of neighbors(grid, cell.r, cell.c)) {
        const u = `${cell.r},${cell.c}`;
        const v = `${n.r},${n.c}`;
        if (dist[u] + 1 < dist[v]) {
          dist[v] = dist[u] + 1;
          parent[v] = u;
          steps++;
        }
      }
    }
  }

  return { path: reconstructPath(parent, start, end), steps };
}

const PATH_ALGOS = { bfs, dfs, dijkstra, astar: aStar, bellmanford: bellmanFord };

app.post("/api/pathfind", (req, res) => {
  const { algorithm, grid, start, end } = req.body;
  if (!PATH_ALGOS[algorithm]) return res.status(400).json({ error: "Unknown pathfinding algorithm" });
  const { result, timeMs } = measure(() => PATH_ALGOS[algorithm](grid, start, end));
  res.json({ algorithm, steps: result.steps, path: result.path, timeMs });
});

app.post("/api/compare", (req, res) => {
  const { category, algorithms, sampleInput } = req.body;
  const output = [];

  if (category === "path") {
    const { grid, start, end } = sampleInput;
    for (const algo of algorithms) {
      if (PATH_ALGOS[algo]) {
        const { result, timeMs } = measure(() => PATH_ALGOS[algo](grid, start, end));
        output.push({ algorithm: algo, steps: result.steps, timeMs, time: "O(V+E)", space: "O(V)" });
      }
    }
  }

  res.json(output);
});

 app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});


