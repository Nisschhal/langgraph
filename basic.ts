/**
 * COMPLETE LANGGRAPH AGENT BLUEPRINT (Production Ready)
 * =====================================================
 * 0. Define/Configure Tool/s
 * 1. Define model + bind tools + create toolNode(tools)
 * 2. Get State Type for type-safety (MessagesAnnotation.State = chat history)
 * 3. Create agentNode: System Message + LLM invoke + return {messages: [response]}
 * 4. Router: Check last message.tool_calls.length → "toolNode" | "__end__"
 * 5. Define graph: Register nodes → Connect edges → Conditional routing
 * 6. Compile graph → Production executable
 * 7. Invoke graph with user query
 */
import readline from "node:readline/promises" // CLI input
import {
  HumanMessage,
  SystemMessage,
  type AIMessage,
} from "@langchain/core/messages"
import { ToolNode } from "@langchain/langgraph/prebuilt"
import {
  END,
  MessagesAnnotation,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
  type GraphNode,
} from "@langchain/langgraph"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { getProductsTool, searchProductsTool } from "./product-tool"
import { ChatOpenAI } from "@langchain/openai"

// ============================== 0-1. TOOLS & MODEL SETUP ==============================
const tools = [searchProductsTool, getProductsTool] // Array of ALL available tools
const toolNode = new ToolNode(tools) // AUTO-executes tool_calls from AIMessage

// ============================== 2. STATE MANAGEMENT ==============================
const AgentState = new StateSchema({
  // StateSchema = BLUEPRINT for state shape
  messages: MessagesValue, // MessagesValue = BaseMessage[] (Human/AI/Tool)
})
type StateType = typeof AgentState.State // Extract TypeScript type for type-safety

// ============================== 3. AGENT NODE (LLM BRAIN) ==============================
const agentNode: GraphNode<StateType> = async (state) => {
  /*
   * AGENT NODE RESPONSIBILITIES:
   * 1. Create LLM instance (Gemini 2.5 Flash)
   * 2. Inject SystemMessage (behavior instructions)
   * 3. Bind tools to LLM (teaches LLM about available tools)
   * 4. Invoke LLM with full conversation history
   * 5. Return state update: { messages: [AIMessage] }
   */

  const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY!, // Required: Environment variable
    model: "gpt-4o-mini", // Feb 2026 model (fast + capable)
    temperature: 0, // Deterministic responses
  })

  const systemPrompt = `You are a helpful, funny gym equipment expert!
  
TOOL STRATEGY:

For Search Product:
- Product questions → ALWAYS get_product(query=user exact words)
- "cardio" → get_product({query: "cardio"})
- "treadmill" → search_product({query: "treadmill"})
- "cardio machines" → search_product({query: "cardio"})
- "100kg trainer" → get_product({query: "100kg trainer"}) 
- Don't get confused with user follow up query example: if you said would you like to see carido/featured products -> user says yes then follow that ealier query of getting cardio/featured products

For Get Product
Examples:
- "show products" → get_products({})
- "10 products" → get_products({number: "10"})

After tool results → give friendly recommendations!
Never invent specs - use tools first! 💪`

  const messages = [new SystemMessage(systemPrompt), ...state.messages] // History + system

  const modelWithTools = model.bindTools(tools) // CRITICAL: LLM learns tool schemas
  const response = await modelWithTools.invoke(messages) // LLM generates AIMessage

  console.log("🧠 Agent response:", JSON.stringify(response, null, 2))
  return { messages: [response] } // Append to state.messages array
}

// ============================== 4. ROUTER FUNCTION (DECISION MAKER) ==============================
const shouldContinue = (state: StateType): "toolNode" | "__end__" => {
  /*
   * ROUTER RESPONSIBILITIES:
   * 1. Inspect last message in state.messages
   * 2. Check if AIMessage contains tool_calls array
   * 3. RETURN node identifier string → Graph routes accordingly
   * 4. Only AIMessages have tool_calls (Human/Tool messages = __end__)
   */

  const lastMessage = state.messages.at(-1) // Most recent message

  // SAFETY: Handle empty state or non-AIMessage
  if (!lastMessage || !("tool_calls" in lastMessage)) {
    console.log("🚪 Router: No tool_calls → END")
    return "__end__"
  }
  console.log("Router last message:-----", lastMessage)

  const hasToolCalls = ((lastMessage as AIMessage).tool_calls?.length ?? 0) > 0
  console.log(
    `🎛️ Router: ${hasToolCalls ? "🔧 toolNode" : "🏁 __end__"} (${(lastMessage as AIMessage).tool_calls?.length ?? 0} tools)`,
  )

  return hasToolCalls ? "toolNode" : "__end__" // Router RETURN → Graph ROUTES
}

// ============================== 5. GRAPH ASSEMBLY (NODE REGISTRY + ROUTING) ==============================
// const graph = new StateGraph(AgentState) // StateGraph(STATE_SCHEMA) - NOT type!

//   // REGISTER NODES (Build node registry: { "key": function })
//   .addNode("agentNode", agentNode) // Registry: { "agentNode": agentNode }
//   .addNode("toolNode", toolNode) // Registry: { ..., "toolNode": toolNode }

//   // SIMPLE EDGES (Unconditional routing)
//   .addEdge(START, "agentNode") // Entry point: START → agentNode

//   // CONDITIONAL EDGES (Dynamic routing based on router)
//   .addConditionalEdges(
//     "agentNode", // FROM which node?
//     shouldContinue, // Router function
//     {
//       // ROUTING TABLE: { ROUTER_RETURN → NODE_KEY }
//       toolNode: "toolNode", // shouldContinue "toolNode" → "toolNode" node
//       __end__: END, // shouldContinue "__end__" → END
//     },
//   )

//   // LOOPBACK EDGE (ReAct cycle completion)
//   .addEdge("toolNode", "agentNode") // Tools finish → Agent re-thinks with results

// / ✅ FIXED
const graph = new StateGraph(MessagesAnnotation)
  .addNode("agentNode", agentNode)
  .addNode("toolNode", toolNode)
  .addEdge(START, "agentNode")
  .addConditionalEdges("agentNode", shouldContinue, {
    toolNode: "toolNode",
    __end__: END,
  })
  .addEdge("toolNode", "agentNode")
// ============================== 6. COMPILE (Production Executable) ==============================
const app = graph.compile() // Creates Runnable interface

// ============================== 7. INVOKE (Execute Agent) ==============================
// ============================== 8. PRODUCTION CLI ==============================
// ============================== FIXED PRODUCTION CLI ==============================

// 2. FIXED MAIN FUNCTION
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  console.log("🚀 Gym Product Agent (type 'bye' to exit)")

  // Keep track of history so the agent has memory

  while (true) {
    const userInput = await rl.question("\nYou: ")
    if (userInput.toLowerCase() === "bye") break

    // Add user message to history
    const result = await app.invoke({ messages: [new HumanMessage(userInput)] })

    console.log("Result-:>", JSON.stringify(result))

    try {
      console.log("Result last message", result.messages.at(-1))
      console.log("🤖 Agent:")
      console.log("Result last message", result.messages.at(-1)?.content)
    } catch (error) {
      console.error("❌ Error:", error)
    }
  }
  rl.close()
}

async function streamWordByWord(text: string) {
  if (!text || typeof text !== "string") return
  const words = text.split(" ")
  for (const word of words) {
    process.stdout.write(word + " ")
    await new Promise((res) => setTimeout(res, 30))
  }
  process.stdout.write("\n")
}

main().catch(console.error)
