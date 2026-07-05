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

// ─── High Fidelity Mock Expansion Database ─────────────────────────────────────
const MOCK_EXPANSIONS: Record<string, { nodes: unknown[]; edges: unknown[] }> = {
  "learning rate": {
    nodes: [
      {
        id: "2-c1",
        label: "Fixed Learning Rate",
        type: "sub_concept",
        definition: "A learning rate that remains constant throughout the entire training duration, regardless of loss fluctuations.",
        whyItMatters: "Simple to implement but risks stalling in local minima or overshooting the global minimum if set incorrectly.",
        realExample: "Walking with a rigid, identical stride length on flat ground and rocky slopes alike.",
        commonMistakes: "Expecting a fixed rate to work well for complex tasks; it often requires manual scheduler tuning.",
        interviewTip: "Interviewers will ask why fixed learning rates fail in deep layers. The answer: gradients change scale across layers."
      },
      {
        id: "2-c2",
        label: "Learning Rate Decay",
        type: "sub_concept",
        definition: "A policy that progressively scales down the step size as training epochs advance.",
        whyItMatters: "Enables large explore steps initially and fine-grained stabilization adjustments as you approach the minimum.",
        realExample: "Slowing down your steps as you draw closer to the absolute bottom of a valley to avoid running past it.",
        commonMistakes: "Decaying the rate too quickly, which freezes parameters before they can explore the weight space.",
        interviewTip: "Explain step-decay versus exponential decay and how they are scheduled in practice."
      },
      {
        id: "2-c3",
        label: "Adaptive Learning Rate",
        type: "sub_concept",
        definition: "Optimizers (like Adam or RMSprop) that automatically calculate separate step sizes for each individual parameter based on past gradient histories.",
        whyItMatters: "Eliminates the tedious chore of manual schedule search and speeds up convergence on sparse data features.",
        realExample: "Adjusting your balance and speed foot-by-foot depending on the local slope texture.",
        commonMistakes: "Blindly relying on default Adam rates, which can occasionally get stuck in steep local saddles.",
        interviewTip: "Explain how Adam combines momentum (moving average of gradients) and scaling (RMSprop moving average of squared gradients)."
      }
    ],
    edges: [
      { source: "2", target: "2-c1" },
      { source: "2", target: "2-c2" },
      { source: "2", target: "2-c3" }
    ]
  },
  "cost function": {
    nodes: [
      {
        id: "3-c1",
        label: "Mean Squared Error",
        type: "sub_concept",
        definition: "A loss function that measures the average squared difference between predictions and actual targets.",
        whyItMatters: "Standard loss for regression tasks; heavily penalizes larger errors due to the squaring parameter.",
        realExample: "A dartboard scoring scheme where landing 2 inches from center costs 4 points, but 4 inches off costs 16 points.",
        commonMistakes: "Using MSE for categorical classification, which results in non-convex optimization and slow backpropagation.",
        interviewTip: "MSE derivative is linear, meaning gradient updates scale directly with error scale: d(MSE)/dw = -2/N * sum(x * error)."
      },
      {
        id: "3-c2",
        label: "Cross-Entropy Loss",
        type: "sub_concept",
        definition: "A loss function measuring difference between two probability distributions; primarily used for classification.",
        whyItMatters: "Provides strong gradients when the model is highly confident but incorrect, speeding up classification training.",
        realExample: "A quiz score grading your confidence; saying '99% True' when it's False is penalized far worse than saying '51% True'.",
        commonMistakes: "Passing raw logits directly into Cross-Entropy without applying a Softmax/Sigmoid scaling function first.",
        interviewTip: "Why is Cross-Entropy preferred over MSE for classification? Because its log component prevents gradient saturation."
      }
    ],
    edges: [
      { source: "3", target: "3-c1" },
      { source: "3", target: "3-c2" }
    ]
  },
  "gradient vectors": {
    nodes: [
      {
        id: "4-c1",
        label: "Partial Derivatives",
        type: "sub_concept",
        definition: "The derivative of a multi-variable function with respect to one variable, holding all other variables constant.",
        whyItMatters: "Calculates the individual slope influence of a single parameter weight within a network containing billions of weights.",
        realExample: "Isolating only your latitude changes on a GPS grid to see if heading north increases elevation, ignoring longitude.",
        commonMistakes: "Forgetting that partial derivatives only give local rate of change, not global slope patterns.",
        interviewTip: "Know the chain rule: d(f(g(x)))/dx = f'(g(x)) * g'(x); it is the mathematical base of all network learning."
      },
      {
        id: "4-c2",
        label: "Jacobian Matrix",
        type: "sub_concept",
        definition: "A matrix containing all first-order partial derivatives of a vector-valued function.",
        whyItMatters: "Essential for analyzing multi-dimensional gradient movements in deep multi-layered architectures.",
        realExample: "A comprehensive grid matrix listing slopes for every single coordinate direction on a topographic map.",
        commonMistakes: "Confusing the Jacobian (first-order gradients) with the Hessian (second-order gradients showing curve acceleration).",
        interviewTip: "Explain how the Hessian matrix is used in second-order optimization methods like Newton's method."
      }
    ],
    edges: [
      { source: "4", target: "4-c1" },
      { source: "4", target: "4-c2" }
    ]
  },
  "artificial neurons": {
    nodes: [
      {
        id: "2-c1",
        label: "Synaptic Weights",
        type: "sub_concept",
        definition: "Parameters that scale input values, representing the strength of connection between preceding and succeeding neurons.",
        whyItMatters: "These are the actual 'dials' or 'memories' updated by Gradient Descent to make accurate predictions.",
        realExample: "Prioritizing advice: weighting a parent's financial advice at 0.9, and a stranger's at 0.1.",
        commonMistakes: "Initializing all weights to zero, which forces neurons to learn identical features (symmetry problem).",
        interviewTip: "Explain weight initialization techniques: Xavier/Glorot for Sigmoid, and He/Kaiming initialization for ReLU."
      },
      {
        id: "2-c2",
        label: "Bias Parameter",
        type: "sub_concept",
        definition: "An additive constant parameter that shifts the activation function curve left or right.",
        whyItMatters: "Allows neurons to adjust their output threshold independent of input values.",
        realExample: "Setting a default starting balance of $10 on a transit card, even if you add zero fare inputs.",
        commonMistakes: "Leaving bias out, which forces the neural partition line to cross exactly through the origin coordinate (0,0).",
        interviewTip: "Why is bias necessary? It allows the decision boundary of a neuron to translate (move) to fit data not centered at zero."
      }
    ],
    edges: [
      { source: "2", target: "2-c1" },
      { source: "2", target: "2-c2" }
    ]
  },
  "activation functions": {
    nodes: [
      {
        id: "3-c1",
        label: "ReLU Activation",
        type: "sub_concept",
        definition: "Rectified Linear Unit function mapping negative inputs to zero and positive inputs directly to output (y = max(0, x)).",
        whyItMatters: "Super simple to compute, introduces non-linearity, and speeds up gradient computation in deep networks.",
        realExample: "A pressure-release valve that stays shut (zero flow) under vacuum, but opens linearly with positive pressure.",
        commonMistakes: "Not addressing the 'Dying ReLU' problem, where neurons permanently output zero due to large negative gradients.",
        interviewTip: "Explain how Leaky ReLU resolves the Dying ReLU issue by adding a small positive slope (e.g. 0.01x) to negative inputs."
      },
      {
        id: "3-c2",
        label: "Sigmoid Function",
        type: "sub_concept",
        definition: "An S-shaped mathematical activation that maps any input value into a range between 0 and 1.",
        whyItMatters: "Excellent for output layers representing binary probability percentages.",
        realExample: "A dimmer switch that smoothly transitions light brightness from off (0) to fully bright (1).",
        commonMistakes: "Using Sigmoid in intermediate hidden layers of deep networks, which saturates gradients and stops learning.",
        interviewTip: "Derivative of Sigmoid is s(x) * (1 - s(x)). When outputs are close to 0 or 1, the derivative is near-zero, causing vanishing gradients."
      }
    ],
    edges: [
      { source: "3", target: "3-c1" },
      { source: "3", target: "3-c2" }
    ]
  },
  "backpropagation": {
    nodes: [
      {
        id: "4-c1",
        label: "Chain Rule Calculus",
        type: "sub_concept",
        definition: "The derivative of composite functions calculated by multiplying nested derivatives.",
        whyItMatters: "Enables calculation of gradients of parameters deep inside networks relative to the final output loss.",
        realExample: "If fuel cost depends on miles driven, and miles driven depends on speed, speed change affects fuel cost multiplicatively.",
        commonMistakes: "Forgetting to multiply all intermediate gradients along the backward chain path.",
        interviewTip: "Walk through the derivative chain: dLoss/dWeight = (dLoss/dOutput) * (dOutput/dNetInput) * (dNetInput/dWeight)."
      },
      {
        id: "4-c2",
        label: "Vanishing Gradients",
        type: "sub_concept",
        definition: "A problem where gradients shrink exponentially as they propagate backward, causing front layers to stop learning.",
        whyItMatters: "It capped the depth of early networks until initialization techniques, ResNets, and ReLU activations were developed.",
        realExample: "Whispering down a chain of 100 people; the original message detail fades to silence by the time it reaches the end.",
        commonMistakes: "Assuming vanishing gradients are solved by just adding more epochs; training epochs won't fix zeroed gradients.",
        interviewTip: "Explain how residual skip connections (ResNet) solve vanishing gradients by allowing signals to bypass layers."
      }
    ],
    edges: [
      { source: "4", target: "4-c1" },
      { source: "4", target: "4-c2" }
    ]
  },
  "mounting phase": {
    nodes: [
      {
        id: "2-c1",
        label: "constructor()",
        type: "sub_concept",
        definition: "The initialization method called before a component mounts, setting initial states and binding event handlers.",
        whyItMatters: "First entry point in a class component's lifecycle.",
        realExample: "Drafting blueprint settings before construction workers start laying bricks.",
        commonMistakes: "Fetching data or setting state triggers directly inside constructor, causing unwanted rendering loops.",
        interviewTip: "Constructor should only be used to initialize state: this.state = {...} and bind event handlers."
      },
      {
        id: "2-c2",
        label: "componentDidMount()",
        type: "sub_concept",
        definition: "A hook called immediately after a component is successfully inserted into the DOM tree.",
        whyItMatters: "The perfect window to trigger network requests, configure event listeners, or read DOM node metrics.",
        realExample: "Running tests on the scoreboard lighting system immediately after mounting it to the stadium wall.",
        commonMistakes: "Forgetting that updating state here triggers an extra render phase, though it happens before browser paints.",
        interviewTip: "This aligns with useEffect(..., []) in functional components, running exactly once after the initial render."
      }
    ],
    edges: [
      { source: "2", target: "2-c1" },
      { source: "2", target: "2-c2" }
    ]
  },
  "updating phase": {
    nodes: [
      {
        id: "3-c1",
        label: "shouldComponentUpdate()",
        type: "sub_concept",
        definition: "A method returning a boolean indicating if changes in state/props require a re-render cycle.",
        whyItMatters: "Crucial performance optimization tool, letting developers block expensive renders when values haven't changed.",
        realExample: "A security guard checking if guest ID matches list; if yes, do not trigger a full security alarm check.",
        commonMistakes: "Implementing loose checks that accidentally block necessary renders, causing out-of-sync UI.",
        interviewTip: "This functions similarly to custom comparison parameters passed inside React.memo."
      },
      {
        id: "3-c2",
        label: "componentDidUpdate()",
        type: "sub_concept",
        definition: "A lifecycle method executed immediately after updating occurs, but not on initial render.",
        whyItMatters: "Perfect for triggering network syncs or DOM updates based on relative changes in props.",
        realExample: "Updating the database log whenever a user changes their active page theme.",
        commonMistakes: "Updating state here without wrapping it inside a conditional check, causing infinite loops.",
        interviewTip: "Matches useEffect(..., [dependency]) with a ref check to bypass the initial mount execution."
      }
    ],
    edges: [
      { source: "3", target: "3-c1" },
      { source: "3", target: "3-c2" }
    ]
  },
  "unmounting phase": {
    nodes: [
      {
        id: "4-c1",
        label: "componentWillUnmount()",
        type: "sub_concept",
        definition: "A lifecycle hook called immediately before a component is unmounted and destroyed.",
        whyItMatters: "Prevents memory leaks by clearing timers, closing socket instances, and stripping window event listeners.",
        realExample: "Disconnecting the utility lines and removing trash before demolition crews implode a building.",
        commonMistakes: "Setting component state here; the component is about to die and will throw console errors.",
        interviewTip: "Corresponds to the clean-up return function in useEffect hooks: return () => { cleanup(); }."
      }
    ],
    edges: [
      { source: "4", target: "4-c1" }
    ]
  }
};

function buildProviderRequest(provider: Provider, apiKey: string, systemPrompt: string, conceptLabel: string, mode: string) {
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
        { role: "user", content: `Expand concept "${conceptLabel}" in ${mode} mode. Return only the JSON object.` },
      ],
    }),
  };
}

function buildMindMapExpandSystemPrompt(
  nodeId: string,
  conceptLabel: string,
  conceptType: string,
  mode: string,
  existingLabels: string[]
): string {
  return `You are a Senior Learning Architect, Subject Matter Expert, and Knowledge Visualisation Engineer.
Your task is to expand on a specific concept node ("${conceptLabel}") in an existing mind map. The current learning mode is "${mode}".

We want to add 3 to 5 new child nodes branching off the node "${conceptLabel}" (which has ID "${nodeId}" and type "${conceptType}").

Existing concepts in the mind map to AVOID repeating:
${existingLabels.map(l => `- "${l}"`).join("\n")}

Strict Learning Mode Guidelines:
- Match the depth of terminology to "${mode}" (beginner: simple/relatable, intermediate: implementation/workflow, interview: questions/tradeoffs, revision: key takeaways/pitfalls).
- Select child nodes that represent:
  - Sub-concepts: details, variations, or mechanisms of "${conceptLabel}".
  - Examples: concrete real-world manifestations of "${conceptLabel}".
  - Applications: how or where "${conceptLabel}" is directly used in practice.

Every single child node in the nodes list MUST contain:
- "id": A unique string identifier, prefixed with the parent ID to ensure uniqueness (e.g., "${nodeId}-c1", "${nodeId}-c2").
- "label": A short, readable title (2-4 words).
- "type": One of: "concept", "sub_concept", "example", "application". Choose the type that best describes the child.
- "definition": A clear 1-2 sentence definition of this child node.
- "whyItMatters": A short explanation of why this concept is important to learn.
- "realExample": A concrete, practical example or analogy.
- "commonMistakes": A frequent pitfall or misunderstanding related to this.
- "interviewTip": A pro-tip or exam/placement question perspective.

Strict JSON format to return:
{
  "expansion": {
    "nodes": [
      {
        "id": "${nodeId}-c1",
        "label": "...",
        "type": "sub_concept",
        "definition": "...",
        "whyItMatters": "...",
        "realExample": "...",
        "commonMistakes": "...",
        "interviewTip": "..."
      },
      ...
    ],
    "edges": [
      { "source": "${nodeId}", "target": "${nodeId}-c1" },
      ...
    ]
  }
}

Do not return any markdown wrappers, just the raw JSON object.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nodeId, conceptLabel, conceptType, mode, existingLabels, apiKey: userKey } = body as {
      nodeId: string;
      conceptLabel: string;
      conceptType: string;
      mode: string;
      existingLabels: string[];
      apiKey?: string;
    };

    if (!nodeId || !conceptLabel || !conceptType || !mode || !Array.isArray(existingLabels)) {
      return NextResponse.json({ error: "Missing required arguments" }, { status: 400 });
    }

    const resolved = resolveProvider(userKey);
    
    // Fallback to high fidelity mock expansion database
    if (!resolved) {
      const normalizedLabel = conceptLabel.toLowerCase().trim();
      const matchedKey = Object.keys(MOCK_EXPANSIONS).find(
        (key) => normalizedLabel.includes(key) || key.includes(normalizedLabel)
      );

      if (matchedKey) {
        // Adjust the parent IDs on the mock data to match the requested nodeId
        const mockData = MOCK_EXPANSIONS[matchedKey];
        
        // Map nodes and edges dynamically to tie to correct parent
        const adaptedNodes = mockData.nodes.map((n: any) => ({
          ...n,
          id: `${nodeId}-${n.id.split("-")[1] || n.id}`
        }));

        const adaptedEdges = mockData.edges.map((e: any) => ({
          source: nodeId,
          target: `${nodeId}-${e.target.split("-")[1] || e.target}`
        }));

        return NextResponse.json({
          expansion: {
            nodes: adaptedNodes,
            edges: adaptedEdges
          }
        });
      }

      // Default fallback if concept is not mapped in mocks
      // Generates a default sub-concept node so the expand button ALWAYS works
      const randomId = `${nodeId}-sub-fallback`;
      const fallbackNodes = [
        {
          id: randomId,
          label: `${conceptLabel} Detail`,
          type: "sub_concept",
          definition: `An advanced sub-component exploring the underlying elements of ${conceptLabel}.`,
          whyItMatters: `Helps structure deeper levels of visual learning for ${conceptLabel}.`,
          realExample: `A specialized application illustrating ${conceptLabel} parameters in production.`,
          commonMistakes: `Ignoring parameter ranges or configuration variables.`,
          interviewTip: `Be prepared to discuss details and tradeoffs of this sub-element.`
        }
      ];
      const fallbackEdges = [{ source: nodeId, target: randomId }];

      return NextResponse.json({
        expansion: {
          nodes: fallbackNodes,
          edges: fallbackEdges
        }
      });
    }

    const { apiKey, provider } = resolved;
    const systemPrompt = buildMindMapExpandSystemPrompt(nodeId, conceptLabel, conceptType, mode, existingLabels);
    const { url, headers, body: reqBody } = buildProviderRequest(provider, apiKey, systemPrompt, conceptLabel, mode);

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

    return NextResponse.json({ expansion: (parsed as { expansion: unknown })?.expansion || parsed });
  } catch (err: unknown) {
    console.error("[Mindmap Expand API] Unexpected error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unexpected server error." }, { status: 500 });
  }
}
