import { Node, Edge } from "@xyflow/react";

export type LayoutType = "radial" | "tree" | "graph";

export function layoutNodes(nodes: Node[], edges: Edge[], layoutType: LayoutType): Node[] {
  if (nodes.length === 0) return [];

  // Clone nodes to avoid mutating state directly
  const layoutedNodes = nodes.map(n => ({ ...n, position: { x: 0, y: 0 } }));

  // Find root node
  const rootNode = layoutedNodes.find(n => n.data?.type === "root") || layoutedNodes[0];
  const rootId = rootNode.id;

  // Build adjacency list (directed parent -> children)
  const adj: Record<string, string[]> = {};
  const parentMap: Record<string, string> = {};
  
  layoutedNodes.forEach(node => {
    adj[node.id] = [];
  });

  edges.forEach(edge => {
    if (adj[edge.source] && adj[edge.target]) {
      adj[edge.source].push(edge.target);
      parentMap[edge.target] = edge.source;
    }
  });

  // Calculate node depths (BFS from root)
  const depth: Record<string, number> = {};
  const queue: string[] = [rootId];
  depth[rootId] = 0;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currDepth = depth[curr];
    
    const children = adj[curr] || [];
    children.forEach(child => {
      if (depth[child] === undefined) {
        depth[child] = currDepth + 1;
        queue.push(child);
      }
    });
  }

  // Handle any disconnected nodes
  layoutedNodes.forEach(node => {
    if (depth[node.id] === undefined) {
      depth[node.id] = 1; // Default fallback
    }
  });

  if (layoutType === "tree") {
    // Top-down Tree Layout
    // Group nodes by depth
    const nodesByDepth: Record<number, string[]> = {};
    layoutedNodes.forEach(node => {
      const d = depth[node.id];
      if (!nodesByDepth[d]) nodesByDepth[d] = [];
      nodesByDepth[d].push(node.id);
    });

    const levelHeight = 160;
    const nodeWidth = 240;

    Object.keys(nodesByDepth).forEach(depthKey => {
      const d = parseInt(depthKey);
      const nodeIds = nodesByDepth[d];
      
      // Sort nodes in each level to keep children of same parent together
      nodeIds.sort((a, b) => {
        const parentA = parentMap[a] || "";
        const parentB = parentMap[b] || "";
        return parentA.localeCompare(parentB);
      });

      const totalWidth = (nodeIds.length - 1) * nodeWidth;
      nodeIds.forEach((id, idx) => {
        const node = layoutedNodes.find(n => n.id === id)!;
        node.position = {
          x: totalWidth === 0 ? 0 : (idx * nodeWidth) - (totalWidth / 2),
          y: d * levelHeight,
        };
      });
    });

  } else if (layoutType === "radial") {
    // Premium Radial Layout
    // Set root at center (0,0)
    const rootIndex = layoutedNodes.findIndex(n => n.id === rootId);
    if (rootIndex !== -1) {
      layoutedNodes[rootIndex].position = { x: 0, y: 0 };
    }

    // Get root's direct children (level 1 concepts)
    const level1 = adj[rootId] || [];
    const R1 = 280; // Distance of level 1 nodes from center
    const R2 = 240; // Distance of level 2 nodes from level 1 parents

    level1.forEach((l1Id, i) => {
      const angle = (i / level1.length) * 2 * Math.PI;
      const l1Node = layoutedNodes.find(n => n.id === l1Id)!;
      
      const x1 = R1 * Math.cos(angle);
      const y1 = R1 * Math.sin(angle);
      l1Node.position = { x: x1, y: y1 };

      // Lay out children of this level 1 node (level 2: sub-concepts, examples, applications)
      const level2 = adj[l1Id] || [];
      if (level2.length > 0) {
        // Space level 2 nodes in an angular arc centered at the parent's angle
        const arcSpan = Math.PI / 2; // 90 degree wedge
        const startArc = angle - arcSpan / 2;
        
        level2.forEach((l2Id, j) => {
          const l2Angle = level2.length === 1 
            ? angle 
            : startArc + (j / (level2.length - 1)) * arcSpan;
            
          const l2Node = layoutedNodes.find(n => n.id === l2Id)!;
          l2Node.position = {
            x: x1 + R2 * Math.cos(l2Angle),
            y: y1 + R2 * Math.sin(l2Angle),
          };

          // Lay out level 3 (if any)
          const level3 = adj[l2Id] || [];
          if (level3.length > 0) {
            const level3Arc = Math.PI / 3; // 60 degree wedge
            const startLevel3Arc = l2Angle - level3Arc / 2;
            const R3 = 180;

            level3.forEach((l3Id, k) => {
              const l3Angle = level3.length === 1
                ? l2Angle
                : startLevel3Arc + (k / (level3.length - 1)) * level3Arc;

              const l3Node = layoutedNodes.find(n => n.id === l3Id)!;
              l3Node.position = {
                x: l2Node.position.x + R3 * Math.cos(l3Angle),
                y: l2Node.position.y + R3 * Math.sin(l3Angle),
              };
            });
          }
        });
      }
    });

    // Handle any nodes not accounted for (e.g. disconnected or deeper levels)
    layoutedNodes.forEach(node => {
      if (node.position.x === 0 && node.position.y === 0 && node.id !== rootId) {
        // Arrange randomly on a larger circle
        const angle = Math.random() * 2 * Math.PI;
        node.position = {
          x: 600 * Math.cos(angle),
          y: 600 * Math.sin(angle),
        };
      }
    });

  } else {
    // Knowledge Graph Layout (Approximate Force-Directed Layout)
    // 1. Initialise positions radially or in columns to prevent overlaps
    layoutedNodes.forEach(node => {
      const d = depth[node.id];
      const angle = Math.random() * 2 * Math.PI;
      node.position = {
        x: d * 180 * Math.cos(angle) + (Math.random() - 0.5) * 50,
        y: d * 180 * Math.sin(angle) + (Math.random() - 0.5) * 50,
      };
    });

    // Root at exact center (0,0) and anchor it
    const rootIdx = layoutedNodes.findIndex(n => n.id === rootId);
    if (rootIdx !== -1) {
      layoutedNodes[rootIdx].position = { x: 0, y: 0 };
    }

    // Force simulation parameters
    const iterations = 60;
    const kRepulsion = 80000;
    const kAttraction = 0.08;
    const restLength = 180;

    for (let iter = 0; iter < iterations; iter++) {
      const forces: Record<string, { x: number; y: number }> = {};
      layoutedNodes.forEach(n => {
        forces[n.id] = { x: 0, y: 0 };
      });

      // Repulsion between all nodes
      for (let i = 0; i < layoutedNodes.length; i++) {
        for (let j = i + 1; j < layoutedNodes.length; j++) {
          const u = layoutedNodes[i];
          const v = layoutedNodes[j];
          const dx = u.position.x - v.position.x;
          const dy = u.position.y - v.position.y;
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);

          if (dist < 400) {
            const force = kRepulsion / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            forces[u.id].x += fx;
            forces[u.id].y += fy;
            forces[v.id].x -= fx;
            forces[v.id].y -= fy;
          }
        }
      }

      // Attraction along edges
      edges.forEach(edge => {
        const u = layoutedNodes.find(n => n.id === edge.source);
        const v = layoutedNodes.find(n => n.id === edge.target);
        if (u && v) {
          const dx = v.position.x - u.position.x;
          const dy = v.position.y - u.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          
          const force = kAttraction * (dist - restLength);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          forces[u.id].x += fx;
          forces[u.id].y += fy;
          forces[v.id].x -= fx;
          forces[v.id].y -= fy;
        }
      });

      // Apply forces (do not move root node, keep it at center)
      layoutedNodes.forEach(node => {
        if (node.id === rootId) return;
        
        // Cap movement to prevent explosion
        const maxMove = 25;
        const fx = forces[node.id].x;
        const fy = forces[node.id].y;
        const fDist = Math.sqrt(fx * fx + fy * fy);

        if (fDist > 0) {
          const moveX = fDist > maxMove ? (fx / fDist) * maxMove : fx;
          const moveY = fDist > maxMove ? (fy / fDist) * maxMove : fy;
          node.position.x += moveX;
          node.position.y += moveY;
        }
      });
    }
  }

  return layoutedNodes;
}
