// ----------------- Config & State -----------------
let ANIM_DELAY = 220; 
const NODE_RADIUS = 20;

let nodes = [], edges = [], nodeCount = 0;
let mode = null, edgeFromNode = null, startNodeId = null, endNodeId = null;

// ----------------- DOM Elements -----------------
const speedSlider = document.getElementById("speedSlider");
const speedLabel = document.getElementById("speedLabel");

const sortingBtn = document.getElementById("sortingBtn");
const pathfindingBtn = document.getElementById("pathfindingBtn");
const sortingSection = document.getElementById("sortingSection");
const pathfindingSection = document.getElementById("pathfindingSection");

const arrayInput = document.getElementById("arrayInput");
const sortSelect = document.getElementById("sortSelect");
const runSortBtn = document.getElementById("runSortBtn");
const visualContainer = document.getElementById("visualContainer");
const comparisonTable = document.querySelector("#comparisonTable tbody");
const historyDiv = document.getElementById("history");

const graphCanvas = document.getElementById("graphCanvas");
const ctx = graphCanvas ? graphCanvas.getContext("2d") : null;
const addNodeBtn = document.getElementById("addNodeBtn");
const addEdgeBtn = document.getElementById("addEdgeBtn");
const runPathBtn = document.getElementById("runPathBtn");
const resetGraphBtn = document.getElementById("resetGraphBtn");
const weightedSelect = document.getElementById("weightedSelect");
const directedSelect = document.getElementById("directedSelect");
const pathAlgoSelect = document.getElementById("pathAlgoSelect");
const pathCostDisplay = document.getElementById("pathCostDisplay");

// ----------------- Utility Functions -----------------

/** Parses comma-separated input into an array of numbers or strings. */
function parseInputArray(input) {
    return input.split(",").map(v => v.trim()).filter(v => v.length > 0).map(v => {
        const num = parseFloat(v);
        return isFinite(num) ? num : v;
    });
}

/** Gets a numeric value for comparison. */
function getValue(v) {
    if (typeof v === "number") return v;
    if (typeof v === "string") return v.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return 0;
}

/** Creates the outer DOM structure for a single chart visualization. */
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

/** Renders the current array state into the barsWrapper DOM element. */
function renderBarsTo(wrapper, values, color = "#3b82f6") {
    wrapper.innerHTML = "";
    const maxVal = Math.max(...values.map(getValue), 1);
    const n = values.length || 1;
    values.forEach(v => {
        const bar = document.createElement("div");
        bar.className = "bar";
        const h = (Math.abs(getValue(v)) / maxVal) * 220 + 40;
        // FIX 1: Use backticks for template literals in CSS style assignment
        bar.style.height = `${h}px`; 
        bar.style.width = `${100 / n - 2}%`; 
        bar.style.background = color;
        const label = document.createElement("span");
        label.textContent = v;
        bar.appendChild(label);
        wrapper.appendChild(bar);
    });
}

/** Calculates Euclidean distance (used in A*). */
function distance(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }

// ----------------- Sorting Algorithms (Snapshot Generators) -----------------
// *** RESTORED SORTING LOGIC ***

/** Generates snapshots for Bubble Sort. */
function bubbleSnapshots(arr) {
    const a = [...arr]; const snaps = [a.slice()]; let steps = 0, swaps = 0;
    for (let i = 0; i < a.length - 1; i++)
        for (let j = 0; j < a.length - i - 1; j++) {
            steps++; 
            if (getValue(a[j]) > getValue(a[j + 1])) { 
                [a[j], a[j + 1]] = [a[j + 1], a[j]]; 
                swaps++; 
                snaps.push(a.slice()); 
            }
        }
    return { snaps, steps, swaps };
}

/** Generates snapshots for Selection Sort. */
function selectionSnapshots(arr) {
    const a = [...arr]; const snaps = [a.slice()]; let steps = 0, swaps = 0;
    for (let i = 0; i < a.length; i++) {
        let min = i;
        for (let j = i + 1; j < a.length; j++) { 
            steps++; 
            if (getValue(a[j]) < getValue(a[min])) min = j; 
        }
        if (min !== i) { 
            [a[i], a[min]] = [a[min], a[i]]; 
            swaps++; 
            snaps.push(a.slice()); 
        }
    } return { snaps, steps, swaps };
}

/** Generates snapshots for Insertion Sort. */
function insertionSnapshots(arr) {
    const a = [...arr]; const snaps = [a.slice()]; let steps = 0, swaps = 0;
    for (let i = 1; i < a.length; i++) {
        let key = a[i]; 
        let j = i - 1;
        while (j >= 0 && getValue(a[j]) > getValue(key)) { 
            a[j + 1] = a[j]; 
            j--; 
            steps++; 
            swaps++; 
            snaps.push(a.slice()); 
        }
        a[j + 1] = key; 
        snaps.push(a.slice());
    } return { snaps, steps, swaps };
}

/** Generates snapshots for Merge Sort. */
function mergeSnapshots(arr) {
    const snaps = []; let steps = 0, swaps = 0;
    function merge(left, right) {
        const result = []; let i = 0, j = 0;
        while (i < left.length && j < right.length) {
            steps++; 
            if (getValue(left[i]) < getValue(right[j])) result.push(left[i++]); 
            else result.push(right[j++]);
        }
        const mergedResult = [...result, ...left.slice(i), ...right.slice(j)];
        snaps.push(mergedResult.slice()); 
        return mergedResult;
    }
    function divide(a) { 
        if (a.length <= 1) return a; 
        const mid = Math.floor(a.length / 2); 
        const l = divide(a.slice(0, mid)); 
        const r = divide(a.slice(mid)); 
        return merge(l, r); 
    }
    const sorted = divide(arr.slice()); 
    if (snaps.length === 0) snaps.unshift(arr.slice());
    return { snaps, steps, swaps };
}

/** Generates snapshots for Quick Sort. */
function quickSnapshots(arr) {
    const a = arr.slice();
    const snaps = [a.slice()]; 
    let steps = 0, swaps = 0;

    function partition(low, high) {
        const pivot = a[high];
        let i = low - 1;

        for (let j = low; j < high; j++) {
            steps++;
            if (getValue(a[j]) <= getValue(pivot)) {
                i++;
                [a[i], a[j]] = [a[j], a[i]];
                swaps++;
                snaps.push(a.slice());
            }
        }
        [a[i + 1], a[high]] = [a[high], a[i + 1]];
        swaps++;
        snaps.push(a.slice());
        return i + 1;
    }

    function sort(low, high) {
        if (low < high) {
            const pi = partition(low, high);
            sort(low, pi - 1);
            sort(pi + 1, high);
        }
    }

    sort(0, a.length - 1);
    return { snaps, steps, swaps };
}

/** Generates snapshots for Heap Sort. */
function heapSnapshots(arr) {
    const a = arr.slice(); const snaps = [a.slice()]; let steps = 0, swaps = 0;
    function heapify(n, i) {
        let largest = i, left = 2 * i + 1, right = 2 * i + 2;
        if (left < n && getValue(a[left]) > getValue(a[largest])) largest = left;
        if (right < n && getValue(a[right]) > getValue(a[largest])) largest = right;
        if (largest !== i) { 
            [a[i], a[largest]] = [a[largest], a[i]]; 
            swaps++; 
            steps++; 
            snaps.push(a.slice()); 
            heapify(n, largest); 
        }
    }
    for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) heapify(a.length, i);
    for (let i = a.length - 1; i > 0; i--) { 
        [a[0], a[i]] = [a[i], a[0]]; 
        swaps++; 
        snaps.push(a.slice()); 
        heapify(i, 0); 
    }
    return { snaps, steps, swaps };
}

const SORT_SNAPSHOT_FUNCS = { bubble: bubbleSnapshots, selection: selectionSnapshots, insertion: insertionSnapshots, merge: mergeSnapshots, quick: quickSnapshots, heap: heapSnapshots };

// ----------------- Main Sorting Logic -----------------

/** Animates all sorting algorithms simultaneously. */
async function animateAllAlgorithms(values) {
    visualContainer.innerHTML = ""; 
    comparisonTable.innerHTML = "";
    
    const allAlgoNames = Object.keys(SORT_SNAPSHOT_FUNCS); 
    const selectedAlgo = sortSelect.value;
    const panels = {}; 
    const results = {};
    const chartElements = {};
    
    // 1. Generate Snapshots, Setup Panels, and Prepare Elements
    for (const name of allAlgoNames) {
        const startTime = performance.now();
        // Execute the actual sorting logic
        const { snaps, steps, swaps } = SORT_SNAPSHOT_FUNCS[name](values);
        const endTime = performance.now();
        const timeMs = (endTime - startTime).toFixed(2);
        
        const isHighlighted = name === selectedAlgo;
        const color = isHighlighted ? "#58a6ff" : "#238636"; 

        results[name] = { 
            snaps, 
            steps, 
            swaps, 
            timeMs, 
            complexity: ["merge", "quick", "heap"].includes(name) ? "$O(n \log n)$" : "$O(n^2)$" 
        };
        
        const { chart, barsWrapper } = createChartElement(name.toUpperCase());
        panels[name] = { chart, barsWrapper };
        chartElements[name] = chart;

        if (isHighlighted) { chart.classList.add('highlighted'); }
        
        renderBarsTo(barsWrapper, snaps[0] || values, color);
        
        const trow = document.createElement("tr");
        if (isHighlighted) {
            trow.style.backgroundColor = 'rgba(88, 166, 255, 0.2)';
            trow.style.border = '2px solid #58a6ff';
        }
        // FIX 2: Use backticks for template literals in HTML content
        trow.innerHTML = `<td>${name.toUpperCase()}</td><td>${steps}</td><td>${timeMs} ms</td><td>${swaps}</td><td>${results[name].complexity}</td>`;
        comparisonTable.appendChild(trow);
    }
    
    // 2. Reorder the chart elements
    const selectedChart = chartElements[selectedAlgo];
    for (const name of allAlgoNames) {
        if (name !== selectedAlgo) {
            visualContainer.appendChild(chartElements[name]);
        }
    }
    if (selectedChart) {
        visualContainer.prepend(selectedChart);
    }

    // 3. Animate All Algorithms Concurrently
    const maxFrames = Math.max(...Object.values(results).map(r => r.snaps.length));
    
    for (let frame = 0; frame < maxFrames; frame++) {
        for (const name of allAlgoNames) {
            const snaps = results[name].snaps;
            const arr = snaps[Math.min(frame, snaps.length - 1)] || snaps[snaps.length - 1] || values;
            const color = name === selectedAlgo ? "#58a6ff" : "#238636"; 
            renderBarsTo(panels[name].barsWrapper, arr, color);
        }
        await new Promise(res => setTimeout(res, ANIM_DELAY));
    }

    // 4. History Update
    const finalResults = results[selectedAlgo];
    if (finalResults) {
        const finalSorted = finalResults.snaps[finalResults.snaps.length - 1] || values;
        const historyItem = document.createElement("p");
        // FIX 3: Use backticks for template literals in text content
        historyItem.textContent = `Sorted [${values}] using ${selectedAlgo.toUpperCase()} → [${finalSorted}] (Steps: ${finalResults.steps}, Time: ${finalResults.timeMs}ms)`;
        historyDiv.prepend(historyItem);
    }
}

// ----------------- Event Handlers (Sorting & Mode Switch) -----------------

if (speedSlider && speedLabel) {
    speedSlider.oninput = () => {
        const maxDelay = 400; 
        const minDelay = 10;
        ANIM_DELAY = maxDelay - (speedSlider.value / 100) * (maxDelay - minDelay);
        // FIX 4: Use backticks for template literals
        speedLabel.textContent = `Speed: ${Math.round(speedSlider.value)}%`;
    };
    speedSlider.oninput();
}

runSortBtn.onclick = async () => {
    const values = parseInputArray(arrayInput.value);
    if (!values.length) return alert("Enter some values!");
    
    runSortBtn.disabled = true;
    await animateAllAlgorithms(values);
    runSortBtn.disabled = false;
};

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

// ----------------------------------------------------
// ----------------- Pathfinding Logic -----------------
// ----------------------------------------------------

// --- Graph Drawing ---

function drawGraph(highlightPath = []) {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    ctx.font = "14px Poppins";

    // Draw Edges
    edges.forEach(e => {
        const from = nodes.find(n => n.id === e.from); const to = nodes.find(n => n.id === e.to);
        if (!from || !to) return;

        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = directedSelect.value === "directed" ? "#f97316" : "#60a5fa"; ctx.lineWidth = 2; ctx.stroke();

        // Draw Arrowhead for Directed Graphs
        if (directedSelect.value === "directed") {
            const angle = Math.atan2(to.y - from.y, to.x - from.x); const headlen = 12;
            const arrowX = to.x - NODE_RADIUS * Math.cos(angle);
            const arrowY = to.y - NODE_RADIUS * Math.sin(angle);
            ctx.beginPath(); ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - headlen * Math.cos(angle - Math.PI / 7), arrowY - headlen * Math.sin(angle - Math.PI / 7));
            ctx.lineTo(arrowX - headlen * Math.cos(angle + Math.PI / 7), arrowY - headlen * Math.sin(angle + Math.PI / 7));
            ctx.closePath(); ctx.fillStyle = "#f97316"; ctx.fill();
        }

        // Draw Weight
        if (e.weight !== undefined && weightedSelect.value === "yes") {
            const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
            ctx.fillStyle = "#f97316"; 
            ctx.fillText(String(e.weight), mx + 6, my - 6);
        }
    });

    // Highlight Path
    if (highlightPath.length > 1) {
        for (let i = 0; i < highlightPath.length - 1; i++) {
            const a = nodes.find(n => n.id === highlightPath[i]); const b = nodes.find(n => n.id === highlightPath[i + 1]);
            if (!a || !b) continue;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 4; ctx.stroke();
        }
    }

    // Draw Nodes
    nodes.forEach(n => {
        let nodeColor = "#3b82f6"; 
        let borderColor = "#0b1220";

        if (n.id === startNodeId) {
            nodeColor = "#f97316"; 
            borderColor = "white";
        } else if (n.id === endNodeId) {
            nodeColor = "#22c55e"; 
            borderColor = "white";
        }
        else if (edgeFromNode && n.id === edgeFromNode.id) {
            borderColor = "#f97316";
        }
        
        ctx.beginPath(); 
        ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2); 
        ctx.fillStyle = nodeColor; 
        ctx.fill();
        ctx.lineWidth = 3; 
        ctx.strokeStyle = borderColor; 
        ctx.stroke(); 
        ctx.fillStyle = "white"; 
        ctx.fillText(String(n.id), n.x - 6, n.y + 6);
    });
}

// --- Canvas Click Handler ---
if (graphCanvas) {
    graphCanvas.addEventListener("click", e => {
        const rect = graphCanvas.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        const clicked = nodes.find(n => distance(n.x, n.y, x, y) <= NODE_RADIUS + 4); 

        // 1. ADD NODE MODE
        if (mode === "addNode") { nodes.push({ id: nodeCount++, x, y }); drawGraph(); return; }

        // 2. ADD EDGE MODE
        if (mode === "addEdge") {
            if (!clicked) return;

            if (!edgeFromNode) { 
                edgeFromNode = clicked; 
                drawGraph(); 
                return; 
            } else {
                let weight = 1;
                if (weightedSelect.value === "yes") { 
                    const w = prompt("Enter weight (number):", "1"); 
                    const parsed = parseFloat(w); 
                    weight = isFinite(parsed) ? parsed : 1; 
                }
                edges.push({ from: edgeFromNode.id, to: clicked.id, weight });
                if (directedSelect.value === "undirected") edges.push({ from: clicked.id, to: edgeFromNode.id, weight });
                edgeFromNode = null; 
                drawGraph(); 
                return;
            }
        }
    });
}

// --- Pathfinding Helper Functions ---
function getNeighbors(id) { return edges.filter(e => e.from === id).map(e => ({ id: e.to, weight: e.weight || 1 })); }

async function animatePath(path) { 
    for (let i = 0; i < path.length; i++) { 
        drawGraph(path.slice(0, i + 1)); 
        await new Promise(res => setTimeout(res, ANIM_DELAY * 2)); 
    } 
}

function reconstructPath(cameFrom, endId) {
    let current = endId;
    const path = [current];
    while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        path.push(current);
    }
    return path.reverse();
}

// ----------------- Pathfinding Algorithms -----------------

function bfs(startId, endId) {
    const queue = [startId];
    const visited = new Set([startId]);
    const cameFrom = new Map();
    let steps = 0;

    while (queue.length > 0) {
        steps++;
        const currentId = queue.shift();

        if (currentId === endId) {
            return { path: reconstructPath(cameFrom, endId), cost: reconstructPath(cameFrom, endId).length - 1, steps };
        }

        const neighbors = getNeighbors(currentId);
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor.id)) {
                visited.add(neighbor.id);
                cameFrom.set(neighbor.id, currentId);
                queue.push(neighbor.id);
            }
        }
    }
    return { path: [], cost: Infinity, steps };
}

function dfs(startId, endId) {
    const stack = [startId];
    const visited = new Set([startId]);
    const cameFrom = new Map();
    let steps = 0;

    while (stack.length > 0) {
        steps++;
        const currentId = stack.pop();

        if (currentId === endId) {
            return { path: reconstructPath(cameFrom, endId), cost: reconstructPath(cameFrom, endId).length - 1, steps };
        }
        
        const neighbors = getNeighbors(currentId).reverse(); 
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor.id)) {
                visited.add(neighbor.id);
                cameFrom.set(neighbor.id, currentId);
                stack.push(neighbor.id);
            }
        }
    }
    return { path: [], cost: Infinity, steps };
}

function dijkstra(startId, endId) {
    const distances = new Map(nodes.map(n => [n.id, Infinity]));
    const cameFrom = new Map();
    const priorityQueue = [{ id: startId, cost: 0 }];
    distances.set(startId, 0);
    let steps = 0;

    while (priorityQueue.length > 0) {
        priorityQueue.sort((a, b) => a.cost - b.cost); 
        const { id: currentId, cost: currentCost } = priorityQueue.shift();
        steps++;

        if (currentId === endId) {
            return { path: reconstructPath(cameFrom, endId), cost: currentCost, steps };
        }
        
        if (currentCost > distances.get(currentId)) continue; 

        for (const neighbor of getNeighbors(currentId)) {
            const newCost = currentCost + neighbor.weight;
            if (newCost < distances.get(neighbor.id)) {
                distances.set(neighbor.id, newCost);
                cameFrom.set(neighbor.id, currentId);
                priorityQueue.push({ id: neighbor.id, cost: newCost });
            }
        }
    }
    return { path: [], cost: Infinity, steps };
}

function aStar(startId, endId) {
    const h = (id) => {
        const node = nodes.find(n => n.id === id);
        const endNode = nodes.find(n => n.id === endId);
        if (!node || !endNode) return Infinity;
        return distance(node.x, node.y, endNode.x, endNode.y); 
    };

    const gScore = new Map(nodes.map(n => [n.id, Infinity])); 
    const fScore = new Map(nodes.map(n => [n.id, Infinity])); 
    const cameFrom = new Map();
    const openSet = [{ id: startId, cost: h(startId) }];
    gScore.set(startId, 0);
    fScore.set(startId, h(startId));
    let steps = 0;

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.cost - b.cost); 
        const { id: currentId } = openSet.shift();
        steps++;

        if (currentId === endId) {
            return { path: reconstructPath(cameFrom, endId), cost: gScore.get(currentId), steps };
        }

        for (const neighbor of getNeighbors(currentId)) {
            const tentativeGScore = gScore.get(currentId) + neighbor.weight;
            
            if (tentativeGScore < gScore.get(neighbor.id)) {
                cameFrom.set(neighbor.id, currentId);
                gScore.set(neighbor.id, tentativeGScore);
                fScore.set(neighbor.id, tentativeGScore + h(neighbor.id));
                
                if (!openSet.some(item => item.id === neighbor.id)) {
                    openSet.push({ id: neighbor.id, cost: fScore.get(neighbor.id) });
                }
            }
        }
    }
    return { path: [], cost: Infinity, steps };
}

function bellmanFord(startId, endId) {
    const distances = new Map(nodes.map(n => [n.id, Infinity]));
    const cameFrom = new Map();
    distances.set(startId, 0);
    let steps = 0;

    for (let i = 0; i < nodes.length - 1; i++) {
        let relaxed = false;
        for (const edge of edges) {
            steps++;
            if (distances.get(edge.from) !== Infinity) {
                const newDist = distances.get(edge.from) + edge.weight;
                if (newDist < distances.get(edge.to)) {
                    distances.set(edge.to, newDist);
                    cameFrom.set(edge.to, edge.from);
                    relaxed = true;
                }
            }
        }
        if (!relaxed) break; 
    }

    // Check for negative weight cycles
    for (const edge of edges) {
        if (distances.get(edge.from) !== Infinity && distances.get(edge.to) > distances.get(edge.from) + edge.weight) {
            return { path: [], cost: "Negative Cycle Detected", steps };
        }
    }

    const finalCost = distances.get(endId);
    if (finalCost === Infinity) return { path: [], cost: Infinity, steps };
    
    return { path: reconstructPath(cameFrom, endId), cost: finalCost, steps };
}


// --- Event Handlers (Pathfinding Buttons) ---

if (addNodeBtn) addNodeBtn.onclick = () => { mode = mode === "addNode" ? null : "addNode"; edgeFromNode = null; drawGraph(); };
if (addEdgeBtn) addEdgeBtn.onclick = () => { mode = mode === "addEdge" ? null : "addEdge"; edgeFromNode = null; drawGraph(); };
if (resetGraphBtn) resetGraphBtn.onclick = () => { 
    nodes = []; edges = []; nodeCount = 0; startNodeId = null; endNodeId = null; edgeFromNode = null; mode = null;
    drawGraph(); 
    pathCostDisplay.textContent = ""; 
};

if (runPathBtn) runPathBtn.onclick = async () => {
    // 1. Check for basic graph existence
    if (nodes.length === 0 || edges.length === 0) { 
        alert("Add nodes and edges to the graph first!"); 
        return; 
    }

    // 2. Get Start and End Nodes using prompt() dialogs
    const startIdPrompt = prompt("Enter START node ID:", startNodeId !== null ? startNodeId : "0"); 
    const endIdPrompt = prompt("Enter TARGET node ID:", endNodeId !== null ? endNodeId : "1");
    
    const startId = parseInt(startIdPrompt); 
    const endId = parseInt(endIdPrompt);

    // 3. Validation
    if (isNaN(startId) || isNaN(endId) || !nodes.some(n => n.id === startId) || !nodes.some(n => n.id === endId)) { 
        alert("Invalid or non-existent node IDs entered! Please check the IDs on the canvas."); 
        return; 
    }

    // Update state and highlighting
    startNodeId = startId;
    endNodeId = endId;
    drawGraph(); 

    // 4. Execution
    runPathBtn.disabled = true; 
    
    let pathResult;
    switch (pathAlgoSelect.value) {
        case "bfs": pathResult = bfs(startId, endId); break;
        case "dfs": pathResult = dfs(startId, endId); break;
        case "dijkstra": pathResult = dijkstra(startId, endId); break;
        case "bellmanford": pathResult = bellmanFord(startId, endId); break;
        case "astar": pathResult = aStar(startId, endId); break;
        default: pathResult = { path: [], cost: Infinity };
    }

    // 5. Display Result
    let costDisplay = '';
    
    if (pathResult.cost === "Negative Cycle Detected") {
        pathCostDisplay.textContent = "Error: Negative Cycle Detected!";
        drawGraph();
    }
    else if (pathResult.path.length === 0 || pathResult.cost === Infinity) {
        pathCostDisplay.textContent = "No path found!";
        drawGraph(); 
    }
    else { 
        // Show Cost: 
        // 1. Always show cost for Dijkstra/A*/Bellman-Ford when "Weighted: Yes"
        // 2. Always show cost (path length) for BFS/DFS.
        if (weightedSelect.value === "yes" || pathAlgoSelect.value === "bfs" || pathAlgoSelect.value === "dfs") {
            costDisplay = ` | Cost: ${pathResult.cost.toFixed(2)}`;
        }

        // FIX 5: Use backticks for template literals in text content
        pathCostDisplay.textContent = `Path: ${pathResult.path.join(" → ")}${costDisplay} | Steps: ${pathResult.steps}`; 
        
        await animatePath(pathResult.path); 
    }
    runPathBtn.disabled = false;
};

// Initial calls
if (ctx) drawGraph();