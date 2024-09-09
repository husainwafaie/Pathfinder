const canvas = document.getElementById('canvas');
const dots = [];        // Array to store dot coordinates
const ids = {};         // Hash Map to store dot number
const clicked = [];     // Array to store clicked dots
const adjList = {};     // Adjacency list to store edges
const existingEdges = new Set(); // Set to track existing edges and prevent duplicates
const repulsionForce = 20000;  // Force constant for repulsion between nodes
const springForce = 0.01;      // Force constant for attraction of edges
const maxIterations = 500;     // Maximum number of iterations for force-directed layout


function bfs(start, target) {
    const queue = [start];
    const visited = new Set();
    const parent = {};

    visited.add(start);
    parent[start] = null;

    while (queue.length > 0) {
        const node = queue.shift();

        if (node === target) {
            // Reconstruct the path from target to start
            const path = [];
            let currentNode = node;
            while (currentNode !== null) {
                path.push(currentNode);
                currentNode = parent[currentNode];
            }
            return path.reverse();
        }

        for (const neighbor of adjList[node]) {
            if (!visited.has(neighbor)) {
                queue.push(neighbor);
                visited.add(neighbor);
                parent[neighbor] = node;
            }
        }
    }

    return null; // No path found
}


// Function to get canvas dimensions
function getCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
}

// Apply a repulsion force between two dots
function applyRepulsionForce(dot1, dot2) {
    const dx = dot2.x - dot1.x;
    const dy = dot2.y - dot1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0 && distance < 200) {
        const force = repulsionForce / (distance * distance);
        const angle = Math.atan2(dy, dx);
        dot1.vx -= Math.cos(angle) * force;
        dot1.vy -= Math.sin(angle) * force;
        dot2.vx += Math.cos(angle) * force;
        dot2.vy += Math.sin(angle) * force;
    }
}

// Apply a spring-like attraction force for each edge
function applySpringForce(dot1, dot2) {
    const dx = dot2.x - dot1.x;
    const dy = dot2.y - dot1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const force = (distance - 100) * springForce;
    const angle = Math.atan2(dy, dx);
    dot1.vx += Math.cos(angle) * force;
    dot1.vy += Math.sin(angle) * force;
    dot2.vx -= Math.cos(angle) * force;
    dot2.vy -= Math.sin(angle) * force;
}

// Update the position of each dot
function updateDotPosition(dot) {
    dot.x += dot.vx;
    dot.y += dot.vy;

    // Boundary conditions (keep the dots inside the canvas)
    const margin = 50;
    const { width, height } = getCanvasSize();
    dot.x = Math.max(margin, Math.min(width - margin, dot.x));
    dot.y = Math.max(margin, Math.min(height - margin, dot.y));

    // Reset velocities for the next iteration
    dot.vx = 0;
    dot.vy = 0;
}

// Initialize nodes with positions and velocities
function initializeDots() {
    const { width: svgWidth, height: svgHeight } = getCanvasSize();
    for (let i = 1; i <= 50; i++) {
        const x = Math.random() * (svgWidth - 100) + 50;
        const y = Math.random() * (svgHeight - 100) + 50;
        dots.push({ x, y, vx: 0, vy: 0 });

        adjList[i] = [];
    }
}

// Run the force-directed layout simulation
function runForceDirectedLayout() {
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                applyRepulsionForce(dots[i], dots[j]);
            }
        }

        for (let node1 in adjList) {
            for (let node2 of adjList[node1]) {
                applySpringForce(dots[node1 - 1], dots[node2 - 1]);
            }
        }

        dots.forEach(updateDotPosition);
    }
}

// Create edges (lines) between randomly selected dots, ensuring no duplicates
function createEdges() {
    const totalEdges = 50;
    let createdEdges = 0;

    for (let i = 1; i <= dots.length; i++) {
        let node2;

        do {
            node2 = Math.floor(Math.random() * dots.length) + 1;
        } while (node2 === i || adjList[i].includes(node2));

        // Create the connection
        adjList[i].push(node2);
        adjList[node2].push(i);

        existingEdges.add(`${i}-${node2}`);
        existingEdges.add(`${node2}-${i}`);

        createdEdges++;
    }

    // Add additional random edges until the total number of edges is reached
    while (createdEdges < totalEdges) {
        const node1 = Math.floor(Math.random() * dots.length) + 1;
        const node2 = Math.floor(Math.random() * dots.length) + 1;

        // Prevent self-connections and duplicate edges
        if (
            node1 !== node2 &&
            !existingEdges.has(`${node1}-${node2}`) &&
            !existingEdges.has(`${node2}-${node1}`)
        ) {
            adjList[node1].push(node2);
            adjList[node2].push(node1);

            existingEdges.add(`${node1}-${node2}`);
            existingEdges.add(`${node2}-${node1}`);

            createdEdges++;
        }
    }
}

// Draw the graph on the canvas after layout computation
function drawGraph() {
    // Clear the canvas
    while (canvas.firstChild) {
        canvas.removeChild(canvas.firstChild);
    }

    // Step 1: Draw the dots (nodes) with animation
    let dotPromises = [];
    for (let i = 0; i < dots.length; i++) {
        dotPromises.push(new Promise(resolve => {
            setTimeout(() => {
                const { x, y } = dots[i];

                const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                dot.setAttribute("cx", x);
                dot.setAttribute("cy", y);
                dot.setAttribute("r", 21);
                dot.setAttribute("fill", "white");
                dot.setAttribute("data-number", i + 1);

                // Add click event listener to turn the dot red when clicked
                dot.addEventListener("click", function() {
                    dot.setAttribute("fill", "red");  // Turn the clicked dot red
                    clicked.push(dot);
                    if (clicked.length === 2) {
                        const dotNumber1 = clicked[0].getAttribute("data-number");
                        const dotNumber2 = clicked[1].getAttribute("data-number");
                        findPath(dotNumber1, dotNumber2);
                        clicked.length = 0;  // Reset clicked array
                    }
                });

                canvas.appendChild(dot);

                // Apply animation to make the dots gradually appear
                dot.classList.add('animate');

                resolve();  // Resolve the promise after the dot is added
            }, 20 * i);  // Delay each dot by 100ms
        }));
    }

    // Step 2: After all dots have appeared, start animating the lines
    Promise.all(dotPromises).then(() => {
        // Delay before starting the lines animation
        let lineDelay = 100;

        for (let node1 in adjList) {
            for (let node2 of adjList[node1]) {
                setTimeout(() => {
                    const { x: x1, y: y1 } = dots[node1 - 1];
                    const { x: x2, y: y2 } = dots[node2 - 1];

                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", x1);
                    line.setAttribute("y1", y1);
                    line.setAttribute("x2", x2);
                    line.setAttribute("y2", y2);
                    line.setAttribute("stroke", "white");
                    line.setAttribute("stroke-width", "2");
                    line.setAttribute("data-node1", node1);
                    line.setAttribute("data-node2", node2);

                    canvas.appendChild(line);

                    // Animate the line drawing
                    line.style.animation = 'drawLine 1s ease-out forwards';
                }, lineDelay);

                lineDelay += 20;  // Stagger the lines with a delay of 200ms between each
            }
        }
    });
}


// Initialize the graph with dots, edges, and layout simulation
function initializeGraph() {
    initializeDots();
    createEdges();
    runForceDirectedLayout();
    drawGraph();
}

// Find the shortest path using BFS and highlight the path
function findPath(dot1, dot2) {
    //const dot1 = parseInt(document.getElementById('dot1').value);
    //const dot2 = parseInt(document.getElementById('dot2').value);
    dot1 = parseInt(dot1);
    dot2 = parseInt(dot2);
    console.log(dot1);
    console.log(dot2);
    const path = bfs(dot1, dot2);

    if (path) {
        const lines = canvas.querySelectorAll('line');
        lines.forEach(line => line.setAttribute('stroke', 'white'));  // Reset line colors

        for (let i = 0; i < path.length - 1; i++) {
            const node1 = path[i];
            const node2 = path[i + 1];

            lines.forEach(line => {
                const lineNode1 = parseInt(line.getAttribute('data-node1'));
                const lineNode2 = parseInt(line.getAttribute('data-node2'));

                if (
                    (lineNode1 === node1 && lineNode2 === node2) ||
                    (lineNode1 === node2 && lineNode2 === node1)
                ) {
                    console.log("here");
                    line.setAttribute("stroke", "red");
                }
            });
        }
    } else {
        alert('No path found between these two dots');
    }
}

// Initialize the graph when the window loads
window.onload = initializeGraph;
