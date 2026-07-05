import { create } from "zustand";
import { Node, Edge } from "@xyflow/react";
import { layoutNodes, LayoutType } from "./layoutEngine";

export type LearningMode = "beginner" | "intermediate" | "interview" | "revision";

export interface MindMapNodeData extends Record<string, unknown> {
  label: string;
  type: "root" | "concept" | "example" | "application" | "sub_concept";
  definition: string;
  whyItMatters: string;
  realExample: string;
  commonMistakes: string;
  interviewTip: string;
}

export interface MindMapState {
  topic: string;
  learningMode: LearningMode;
  layoutType: LayoutType;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isGenerating: boolean;
  loadingStep: number;
  isExpanding: boolean;
  error: string | null;
  mindMapApiKey: string;

  // Actions
  setTopic: (topic: string) => void;
  setLearningMode: (mode: LearningMode) => void;
  setLayoutType: (layout: LayoutType) => void;
  setSelectedNodeId: (id: string | null) => void;
  setGenerating: (val: boolean) => void;
  setLoadingStep: (step: number) => void;
  setExpanding: (val: boolean) => void;
  setError: (error: string | null) => void;
  setMindMapApiKey: (key: string) => void;
  
  // High-level Actions
  generateMindMap: (topic: string, mode: LearningMode, apiKey?: string) => Promise<void>;
  expandConcept: (nodeId: string, apiKey?: string) => Promise<void>;
  updateNodePositions: (layout: LayoutType) => void;
  resetMindMap: () => void;
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  topic: "",
  learningMode: "intermediate",
  layoutType: "radial",
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isGenerating: false,
  loadingStep: 0,
  isExpanding: false,
  error: null,
  mindMapApiKey: typeof window !== "undefined" ? localStorage.getItem("mindmap_api_key") || "" : "",

  setTopic: (topic) => set({ topic }),
  setLearningMode: (learningMode) => set({ learningMode }),
  setLayoutType: (layoutType) => {
    set({ layoutType });
    get().updateNodePositions(layoutType);
  },
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setLoadingStep: (loadingStep) => set({ loadingStep }),
  setExpanding: (isExpanding) => set({ isExpanding }),
  setError: (error) => set({ error }),
  setMindMapApiKey: (key) => {
    set({ mindMapApiKey: key });
    if (typeof window !== "undefined") {
      localStorage.setItem("mindmap_api_key", key);
    }
  },

  updateNodePositions: (layout) => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;
    const positionedNodes = layoutNodes(nodes, edges, layout);
    set({ nodes: positionedNodes });
  },

  resetMindMap: () => set({
    topic: "",
    nodes: [],
    edges: [],
    selectedNodeId: null,
    isGenerating: false,
    loadingStep: 0,
    isExpanding: false,
    error: null
  }),

  generateMindMap: async (topic, mode, apiKey) => {
    set({ 
      isGenerating: true, 
      loadingStep: 0, 
      error: null, 
      selectedNodeId: null,
      topic,
      learningMode: mode
    });

    const stepsTimer = (step: number, ms: number) => 
      new Promise<void>((resolve) => {
        setTimeout(() => {
          set({ loadingStep: step });
          resolve();
        }, ms);
      });

    try {
      // Simulate visual loading stages along with the fetch
      // Stage 0: Analyzing Topic
      const fetchPromise = fetch("/api/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          mode,
          apiKey: apiKey || get().mindMapApiKey
        })
      });

      await stepsTimer(1, 1000); // Stage 1: Building Knowledge Structure
      await stepsTimer(2, 1200); // Stage 2: Creating Relationships
      await stepsTimer(3, 1000); // Stage 3: Generating Visual Map
      await stepsTimer(4, 800);  // Stage 4: Rendering Knowledge Graph

      const response = await fetchPromise;
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate mind map");
      }

      if (!data.mindmap || !Array.isArray(data.mindmap.nodes)) {
        throw new Error("Invalid response format received from AI.");
      }

      // Convert raw nodes and edges into React Flow format
      const rawNodes = data.mindmap.nodes;
      const rawEdges = data.mindmap.edges || [];

      const flowNodes: Node[] = rawNodes.map((n: { id: string; label: string; type: string; definition?: string; whyItMatters?: string; realExample?: string; commonMistakes?: string; interviewTip?: string }) => ({
        id: n.id,
        type: "mindmapNode",
        position: { x: 0, y: 0 },
        data: {
          label: n.label,
          type: n.type || "concept",
          definition: n.definition || "No definition provided.",
          whyItMatters: n.whyItMatters || "No context provided.",
          realExample: n.realExample || "No example provided.",
          commonMistakes: n.commonMistakes || "No common mistakes provided.",
          interviewTip: n.interviewTip || "No interview tip provided."
        }
      }));

      const flowEdges: Edge[] = rawEdges.map((e: { source: string; target: string }) => ({
        id: `e-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        type: "animatedEdge",
        animated: true,
        style: { strokeWidth: 2 }
      }));

      // Set initial radial layout
      const positionedNodes = layoutNodes(flowNodes, flowEdges, get().layoutType);

      set({ 
        nodes: positionedNodes, 
        edges: flowEdges,
        isGenerating: false,
        loadingStep: 5 
      });

    } catch (err: unknown) {
      console.error("[Store] generateMindMap failed:", err);
      set({ 
        error: err instanceof Error ? err.message : "An unexpected error occurred.", 
        isGenerating: false 
      });
    }
  },

  expandConcept: async (nodeId, apiKey) => {
    const { nodes, edges, learningMode } = get();
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    set({ isExpanding: true, error: null });

    try {
      // Gather context: existing nodes to avoid duplication
      const existingLabels = nodes.map(n => n.data.label as string);

      const response = await fetch("/api/mindmap/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId,
          conceptLabel: targetNode.data.label,
          conceptType: targetNode.data.type,
          mode: learningMode,
          existingLabels,
          apiKey: apiKey || get().mindMapApiKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to expand concept");
      }

      if (!data.expansion || !Array.isArray(data.expansion.nodes)) {
        throw new Error("Invalid expansion response format received from AI.");
      }

      const newRawNodes = data.expansion.nodes;
      const newRawEdges = data.expansion.edges || [];

      // Avoid duplicate IDs
      const uniqueNewNodes = newRawNodes.filter(
        (nn: { id: string; label: string }) => !nodes.some(en => en.id === nn.id || en.data.label === nn.label)
      );

      const uniqueNewEdges = newRawEdges.filter(
        (ne: { source: string; target: string }) => 
          !edges.some(ee => (ee.source === ne.source && ee.target === ne.target) || (ee.source === ne.target && ee.target === ne.source))
      );

      if (uniqueNewNodes.length === 0) {
        throw new Error("The AI did not find any new sub-concepts for this node.");
      }

      // Map to React Flow Nodes
      const flowNewNodes: Node[] = uniqueNewNodes.map((n: { id: string; label: string; type: string; definition?: string; whyItMatters?: string; realExample?: string; commonMistakes?: string; interviewTip?: string }) => ({
        id: n.id,
        type: "mindmapNode",
        // Spawn near the parent initially
        position: { 
          x: targetNode.position.x + (Math.random() - 0.5) * 100, 
          y: targetNode.position.y + (Math.random() - 0.5) * 100 
        },
        data: {
          label: n.label,
          type: n.type || "sub_concept",
          definition: n.definition || "No definition provided.",
          whyItMatters: n.whyItMatters || "No context provided.",
          realExample: n.realExample || "No example provided.",
          commonMistakes: n.commonMistakes || "No common mistakes provided.",
          interviewTip: n.interviewTip || "No interview tip provided."
        }
      }));

      // Map to React Flow Edges
      const flowNewEdges: Edge[] = uniqueNewEdges.map((e: { source: string; target: string }) => ({
        id: `e-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        type: "animatedEdge",
        animated: true,
        style: { strokeWidth: 2 }
      }));

      const combinedNodes = [...nodes, ...flowNewNodes];
      const combinedEdges = [...edges, ...flowNewEdges];

      // Recompute layout
      const positionedNodes = layoutNodes(combinedNodes, combinedEdges, get().layoutType);

      set({
        nodes: positionedNodes,
        edges: combinedEdges,
        isExpanding: false,
        selectedNodeId: nodeId // Maintain selection on the expanded parent node
      });

    } catch (err: unknown) {
      console.error("[Store] expandConcept failed:", err);
      set({ 
        error: err instanceof Error ? err.message : "Failed to expand node.",
        isExpanding: false 
      });
    }
  }
}));
