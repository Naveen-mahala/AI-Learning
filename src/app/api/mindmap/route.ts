import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Provider = "gemini" | "groq" | "openrouter";

function resolveProvider(userKey?: string): { apiKey: string; provider: Provider } | null {
  if (userKey && userKey.length > 10) {
    if (userKey.startsWith("gsk_")) return { apiKey: userKey, provider: "groq" };
    if (userKey.startsWith("sk-or-")) return { apiKey: userKey, provider: "openrouter" };
    if (userKey.startsWith("AQ.") || (!userKey.startsWith("sk-") && userKey.length > 20)) return { apiKey: userKey, provider: "gemini" };
  }

  const groq = process.env.GROQ_API_KEY;
  const gemini = process.env.GEMINI_API_KEY;
  const openrouter = process.env.OPENROUTER_API_KEY;

  if (groq && groq.startsWith("gsk_")) return { apiKey: groq, provider: "groq" };
  if (gemini) return { apiKey: gemini, provider: "gemini" };
  if (openrouter) return { apiKey: openrouter, provider: "openrouter" };

  return null;
}

// ─── High Fidelity Mock Data ──────────────────────────────────────────────────
const MOCK_MIND_MAPS: Record<string, unknown> = {
  "gradient descent": {
    topic: "Gradient Descent",
    nodes: [
      {
        id: "1",
        label: "Gradient Descent",
        type: "root",
        definition: "An iterative optimization algorithm used to minimize a loss function by moving in the direction of steepest descent.",
        whyItMatters: "It forms the training core of almost all modern machine learning models, from simple regressions to deep neural networks.",
        realExample: "Imagine walking down a foggy mountain toward a valley; you can only see the slope immediately around your feet and step downward.",
        commonMistakes: "Setting the learning rate too high, causing the algorithm to overshoot and diverge instead of converging.",
        interviewTip: "Be prepared to explain how SGD, Mini-batch SGD, and Adam handle the tradeoffs of speed versus gradient variance."
      },
      {
        id: "2",
        label: "Learning Rate",
        type: "concept",
        definition: "A hyperparameter that controls the step size taken in the direction of the local minimum during each iteration.",
        whyItMatters: "Directly determines if a model will converge at all, and how fast it will reach its optimal performance.",
        realExample: "Adjusting stride length when exploring the foggy mountain: huge jumps might bounce across ridges, tiny shuffles take forever.",
        commonMistakes: "Leaving learning rate fixed throughout training when an adaptive scheduler would yield better results.",
        interviewTip: "Explain why we decay the learning rate as training progresses: it helps stabilize training near the local minimum."
      },
      {
        id: "3",
        label: "Cost Function",
        type: "concept",
        definition: "A mathematical function that quantifies the difference between predicted values and actual ground truth outputs.",
        whyItMatters: "It acts as the guide or compass for Gradient Descent, defining the 'landscape' or 'mountain' that the model tries to descend.",
        realExample: "A GPS indicator showing your distance to destination; the higher the number, the further off-track you are.",
        commonMistakes: "Using Mean Squared Error for classification problems, which leads to slow training due to non-convex gradients.",
        interviewTip: "Contrast convex vs non-convex cost functions and explain how local minima affect gradient descent in non-convex spaces."
      },
      {
        id: "4",
        label: "Gradient Vectors",
        type: "concept",
        definition: "The vector of partial derivatives pointing in the direction of the greatest rate of increase of the cost function.",
        whyItMatters: "Informs the optimizer exactly which direction is 'up', allowing us to step in the opposite direction ('down').",
        realExample: "The steepest slope angle marked on a terrain map at your exact coordinates.",
        commonMistakes: "Forgetting that gradients point towards the maximum increase, requiring subtraction to minimize cost.",
        interviewTip: "Explain mathematically: Gradient is the Jacobian matrix representing first-order partial derivatives of scalar functions."
      },
      {
        id: "5",
        label: "Linear Regression",
        type: "example",
        definition: "A basic predictive model that fits a straight line to input-output relationships by minimizing Mean Squared Error.",
        whyItMatters: "Serves as the introductory vehicle to understand how gradients adjust slope (weights) and intercept (bias).",
        realExample: "Predicting house prices based solely on square footage using a line of best fit.",
        commonMistakes: "Not normalizing inputs, which creates elongated cost contours and makes gradient descent take a zigzag path.",
        interviewTip: "How do you derive the gradient for Mean Squared Error? Be ready to write the partial derivative of MSE on a whiteboard."
      },
      {
        id: "6",
        label: "Deep Learning",
        type: "application",
        definition: "Training large neural networks with multiple layers where parameter updates are driven by multi-layered backpropagation.",
        whyItMatters: "Enabled advances in computer vision, LLMs, and robotics by tuning billions of weights with gradient descent.",
        realExample: "Adjusting millions of synaptic dials in an artificial brain to recognize the image of a cat.",
        commonMistakes: "Failing to account for vanishing or exploding gradients when stacking deep feedforward layers.",
        interviewTip: "Explain how optimizers like RMSprop and Adam adjust learning rates per parameter using moving averages of gradients."
      }
    ],
    edges: [
      { source: "1", target: "2" },
      { source: "1", target: "3" },
      { source: "1", target: "4" },
      { source: "2", target: "6" },
      { source: "3", target: "5" }
    ]
  },
  "neural networks": {
    topic: "Neural Networks",
    nodes: [
      {
        id: "1",
        label: "Neural Networks",
        type: "root",
        definition: "Computational models inspired by biological neural structures, consisting of interconnected node layers that process inputs.",
        whyItMatters: "They form the architectural baseline for all modern AI advancements, from image generation to language translation.",
        realExample: "A digital relay team where each runner processes a small part of a message before passing it to the next runner.",
        commonMistakes: "Assuming more layers always improves accuracy, which often leads to overfitting and massive computation waste.",
        interviewTip: "Describe the universal approximation theorem: a feedforward network with one hidden layer can approximate any continuous function."
      },
      {
        id: "2",
        label: "Artificial Neurons",
        type: "concept",
        definition: "The fundamental processing unit of a network, computing a weighted sum of inputs and applying an activation function.",
        whyItMatters: "Simulates chemical synapse thresholds in biology, converting raw values into firing signals.",
        realExample: "A credit advisor checking multiple qualifications, weight-scoring each, and outputting an approve/reject decision.",
        commonMistakes: "Forgetting to add a bias term, which locks the neuron's decision boundary to pass directly through the coordinate origin.",
        interviewTip: "How does a neuron compute outputs? Sum of weights multiplied by inputs, plus bias, passed through activation function: y = f(Wx + b)."
      },
      {
        id: "3",
        label: "Activation Functions",
        type: "concept",
        definition: "Mathematical formulas applied to a neuron's net input to introduce non-linear mapping characteristics.",
        whyItMatters: "Without them, stacking layers would behave like a single massive linear model, unable to learn complex curves.",
        realExample: "A light switch that only snaps on once voltage exceeds a specific threshold.",
        commonMistakes: "Using Sigmoid in deep networks, which compresses gradients and causes training to stall (vanishing gradient).",
        interviewTip: "Compare ReLU, LeakyReLU, and GeLU activations, explaining how they mitigate the dead neuron problem."
      },
      {
        id: "4",
        label: "Backpropagation",
        type: "concept",
        definition: "An algorithm that calculates the gradient of the loss function with respect to all weights using the mathematical Chain Rule.",
        whyItMatters: "Enables nodes deep inside the network to understand how they contributed to final prediction errors.",
        realExample: "A company boss correcting department managers, who in turn correct line supervisors based on client feedback.",
        commonMistakes: "Miscalculating derivatives of nested layers; luckily, modern PyTorch and TensorFlow handle this via Autograd.",
        interviewTip: "Be ready to write out the mathematical derivation of backpropagation using the chain rule for a two-neuron network."
      },
      {
        id: "5",
        label: "Image Classification",
        type: "example",
        definition: "Assigning labels to input images by passing grid pixel arrays through convolutional layers.",
        whyItMatters: "Led to industrial breakthroughs like self-driving cars recognizing traffic lights and medical scans identifying tumors.",
        realExample: "Scanning pixels from a picture to determine if it's a dog, a car, or a coffee mug.",
        commonMistakes: "Feeding raw high-resolution inputs directly into fully connected layers, causing parameter explosions.",
        interviewTip: "Contrast CNNs (spatial invariance) with standard MLPs (fully connected networks) for visual processing tasks."
      },
      {
        id: "6",
        label: "Natural Language Processing",
        type: "application",
        definition: "Models trained to analyze, translate, and generate human language texts using attention mechanisms.",
        whyItMatters: "Powers chatbots, real-time translators, and systems like ChatGPT by mapping vocabulary tokens to multidimensional vector spaces.",
        realExample: "An auto-correct engine that predicts the next word in your sentence based on context.",
        commonMistakes: "Treating text as static lists rather than variable-length sequences with contextual relations.",
        interviewTip: "Explain why attention mechanisms solved the long-term memory bottleneck inherent in LSTMs and RNNs."
      }
    ],
    edges: [
      { source: "1", target: "2" },
      { source: "1", target: "3" },
      { source: "1", target: "4" },
      { source: "2", target: "5" },
      { source: "4", target: "6" }
    ]
  },
  "react lifecycle": {
    topic: "React Lifecycle",
    nodes: [
      {
        id: "1",
        label: "React Lifecycle",
        type: "root",
        definition: "The series of phases a React component undergoes from initialization to destruction in the DOM tree.",
        whyItMatters: "Crucial for optimizing render speeds, preventing memory leaks, and managing background side-effects.",
        realExample: "The lifespan of a theatrical play: setup (mounting), script adjustments (updating), and tearing down the stage (unmounting).",
        commonMistakes: "Fetching APIs repeatedly on every re-render instead of anchoring the fetch inside a mount side-effect.",
        interviewTip: "Map class component lifecycle methods (componentDidMount, componentDidUpdate, componentWillUnmount) to useEffect dependency parameters."
      },
      {
        id: "2",
        label: "Mounting Phase",
        type: "concept",
        definition: "The initial execution stage where a component instance is created, evaluated, and inserted into the browser DOM.",
        whyItMatters: "The perfect window to initialize states, spin up intervals, or pull remote database payloads.",
        realExample: "Constructing and painting a billboard onto an empty highway advertising space.",
        commonMistakes: "Attempting to query actual DOM element heights in the constructor before nodes are mounted to the document.",
        interviewTip: "Explain what happens in the mounting phase: Constructor -> Render -> React updates DOM -> componentDidMount/useEffect."
      },
      {
        id: "3",
        label: "Updating Phase",
        type: "concept",
        definition: "The trigger loop occurring whenever a component's props or state change, causing a re-render to match DOM layouts.",
        whyItMatters: "Ensures the visual display matches dynamic variables in real-time.",
        realExample: "Updating the numbers displayed on a digital scoreboard when a team scores a point.",
        commonMistakes: "Setting component state directly inside render or update loops, triggering infinite render crashes.",
        interviewTip: "Explain how React reconciles updates using the Virtual DOM and why keys are vital for list updates."
      },
      {
        id: "4",
        label: "Unmounting Phase",
        type: "concept",
        definition: "The cleanup stage where a component is removed from the DOM tree and permanently deleted from memory.",
        whyItMatters: "Vital to cancel open WebSocket streams, clean up intervals, and remove event listeners to avoid severe memory leaks.",
        realExample: "Taking down the billboard and recycling the metal frame when the ad campaign expires.",
        commonMistakes: "Forgetting to return a cleanup callback inside a useEffect hook that uses setInterval.",
        interviewTip: "How do you handle unmounting in functional components? Return a cleanup function at the bottom of the useEffect hook."
      },
      {
        id: "5",
        label: "Chat Widget",
        type: "example",
        definition: "A dynamic pop-up interface that establishes a socket channel on load and severs it on exit.",
        whyItMatters: "Illustrates the exact necessity of connecting on mount, updating on chat text, and disconnecting on exit.",
        realExample: "A walkie-talkie channel that turns on when you pull it out and turns off when put back on the dock.",
        commonMistakes: "Spawning new socket connections every time a new message is typed rather than storing the instance.",
        interviewTip: "Walk through the code to implement a WebSocket feed: mount connection, message updates, and socket close on unmount."
      },
      {
        id: "6",
        label: "Interactive Dashboards",
        type: "application",
        definition: "Data boards displaying real-time sensor information, updating visuals via prop-changes or push events.",
        whyItMatters: "Must manage multiple data updates efficiently without causing lag or full-page redraws.",
        realExample: "A financial stock ticker dashboard flickering prices as global trades execute.",
        commonMistakes: "Allowing parent updates to force-render massive visual trees that have unchanged properties.",
        interviewTip: "How do you optimize updates? Use React.memo, useMemo, or useCallback to prevent unnecessary rendering of child elements."
      }
    ],
    edges: [
      { source: "1", target: "2" },
      { source: "1", target: "3" },
      { source: "1", target: "4" },
      { source: "2", target: "5" },
      { source: "3", target: "6" }
    ]
  }
};

function buildProviderRequest(provider: Provider, apiKey: string, systemPrompt: string, topic: string, mode: string) {
  let apiUrl = "";
  let model = "";
  const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };

  if (provider === "groq") {
    apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    model = "llama-3.3-70b-versatile";
  } else if (provider === "gemini") {
    apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    model = "gemini-2.5-flash";
  } else {
    apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    model = "google/gemini-2.5-pro";
    headers["HTTP-Referer"] = "http://localhost:3000";
    headers["X-Title"] = "AI Learning Accelerator";
  }

  return {
    url: apiUrl,
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a structured, educational mind map for "${topic}" in ${mode} mode. Return only the JSON object.` },
      ],
    }),
  };
}

function buildMindMapSystemPrompt(topic: string, mode: string): string {
  return `You are a Senior Learning Architect, Subject Matter Expert, and Knowledge Visualisation Engineer.
Your task is to generate a comprehensive, highly educational, structured mind map for the topic "${topic}" in "${mode}" mode.

The output must be a JSON object containing a single root key "mindmap".
Each node in the mind map must represent an aspect of the topic and contain detailed educational content.

Strict Learning Mode Guidelines:
1. BEGINNER MODE: Focus on core intuition, basic analogies, fewer branches (5-6 nodes total), very clear terminology, and simple examples.
2. INTERMEDIATE MODE: Focus on core concepts, workflows, practical implementation details, relationships, and real-world usage (7-9 nodes total).
3. INTERVIEW MODE: Focus on high-frequency interview topics, common interview questions, advanced concepts, tradeoffs, and system design use cases (8-10 nodes total).
4. REVISION MODE: Focus on high-yield facts, key equations/concepts, "must-remember" summary points, and common exam pitfalls (6-8 nodes total).

Node Types:
- "root": The central topic (Exactly 1 node with ID "1").
- "concept": A primary concept connected directly to the root.
- "sub_concept": A secondary detail branching from a "concept".
- "example": A concrete real-world scenario, code illustration, or case study.
- "application": A industry use case or direct deployment scenario.

Every single node in the nodes list MUST contain:
- "id": A unique string identifier (e.g. "1", "2", "3").
- "label": A short, readable title (2-4 words).
- "type": One of: "root", "concept", "sub_concept", "example", "application".
- "definition": A clear 1-2 sentence definition of this node.
- "whyItMatters": A short explanation of why this concept is important to learn.
- "realExample": A concrete, practical example or analogy.
- "commonMistakes": A frequent pitfall or misunderstanding related to this.
- "interviewTip": A pro-tip or exam/placement question perspective.

Strict JSON format to return:
{
  "mindmap": {
    "topic": "${topic}",
    "nodes": [
      {
        "id": "1",
        "label": "${topic}",
        "type": "root",
        "definition": "...",
        "whyItMatters": "...",
        "realExample": "...",
        "commonMistakes": "...",
        "interviewTip": "..."
      },
      ...
    ],
    "edges": [
      { "source": "1", "target": "2" },
      ...
    ]
  }
}

Do not return any markdown wrappers, just the raw JSON object.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, mode, apiKey: userKey } = body as {
      topic: string;
      mode: string;
      apiKey?: string;
    };

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }
    if (!mode || !["beginner", "intermediate", "interview", "revision"].includes(mode)) {
      return NextResponse.json({ error: "Invalid learning mode" }, { status: 400 });
    }

    const resolved = resolveProvider(userKey);
    
    // Fallback to high fidelity mock data if no key is configured
    if (!resolved) {
      const normalizedTopic = topic.toLowerCase().trim();
      const matchedMockKey = Object.keys(MOCK_MIND_MAPS).find(
        (key) => normalizedTopic.includes(key) || key.includes(normalizedTopic)
      );

      if (matchedMockKey) {
        // Return matching mock data
        return NextResponse.json({ mindmap: MOCK_MIND_MAPS[matchedMockKey] });
      }

      return NextResponse.json({ 
        error: "No API key configured. Please type a demo topic like 'Gradient Descent', 'Neural Networks', or 'React Lifecycle' to test, or configure a key in the settings panel." 
      }, { status: 401 });
    }

    const { apiKey, provider } = resolved;
    const systemPrompt = buildMindMapSystemPrompt(topic.trim(), mode);
    const { url, headers, body: reqBody } = buildProviderRequest(provider, apiKey, systemPrompt, topic.trim(), mode);

    const response = await fetch(url, { method: "POST", headers, body: reqBody });

    if (!response.ok) {
      const errText = await response.text();
      let errJson: Record<string, unknown> = {};
      try { errJson = JSON.parse(errText); } catch { /* ignore */ }
      const msg = (errJson?.error as Record<string, unknown>)?.message as string || errJson?.error as string || `${provider.toUpperCase()} API error ${response.status}`;
      return NextResponse.json({ error: msg }, { status: response.status });
    }

    const completion = await response.json();
    const rawContent = completion?.choices?.[0]?.message?.content as string | undefined;

    if (!rawContent) {
      return NextResponse.json({ error: "Empty response from AI. Please try again." }, { status: 500 });
    }

    let parsed: unknown;
    try {
      const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI returned an invalid format. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ mindmap: (parsed as { mindmap: unknown })?.mindmap || parsed });
  } catch (err: unknown) {
    console.error("[Mindmap API] Unexpected error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unexpected server error." }, { status: 500 });
  }
}
