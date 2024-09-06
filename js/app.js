const canvas = document.getElementById('canvas');
const dots = [];  // Array to store dot coordinates
const adjList = {};  // Adjacency list to store edges

function createDots() {
    for (let i = 1; i <= 75; i++) {
        const x = Math.random() * 700 + 50;
        const y = Math.random() * 700 + 50; 
        dots.push({ x, y });

        // Draw the dot
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", x);
        dot.setAttribute("cy", y);
        dot.setAttribute("r", 10);
        dot.setAttribute("fill", "blue");
        canvas.appendChild(dot);

        adjList[i] = [];  
    }
}

function createEdges() {
    for (let i = 0; i < 200; i++) {
        const node1 = Math.floor(Math.random() * 75) + 1;
        const node2 = Math.floor(Math.random() * 75) + 1;

        if (node1 !== node2) {
            adjList[node1].push(node2);
            adjList[node2].push(node1);

            const { x: x1, y: y1 } = dots[node1 - 1];
            const { x: x2, y: y2 } = dots[node2 - 1];

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x1);
            line.setAttribute("y1", y1);
            line.setAttribute("x2", x2);
            line.setAttribute("y2", y2);
            line.setAttribute("stroke", "black");
            line.setAttribute("data-node1", node1);
            line.setAttribute("data-node2", node2);
            canvas.appendChild(line);
        }
    }
}

// BFS algorithm to find the shortest path
function bfs(start, target) {
    const queue = [start];
    const visited = new Set();
    const parent = {};

    visited.add(start);
    parent[start] = null;

    while (queue.length > 0) {
        const node = queue.shift();

        if (node == target) {
            const path = [];
            let currentNode = node;
            while (currentNode !== null) {
                path.push(currentNode);
                currentNode = parent[currentNode];
            }
            console.log(path);
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
    return null;
}


// Function to find the shortest path and update line colors
function findPath() {
    const dot1 = parseInt(document.getElementById('dot1').value);
    const dot2 = parseInt(document.getElementById('dot2').value);

    const path = bfs(dot1, dot2);

    if (path) {
        const lines = canvas.querySelectorAll('line');
        lines.forEach(line => line.setAttribute('stroke', 'black'));

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
                    line.setAttribute('stroke', 'red'); 
                }
            });
        }
    } else {
        alert('No path found between these two dots');
    }
}


window.onload = function () {
    createDots();
    createEdges();
};
