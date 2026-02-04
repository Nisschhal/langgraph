/** 
 
// ============================== 1. IMPORTS ==============================
import { ChatYourModel } from "@langchain/your-model"  // YOUR LLM
import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { MessagesAnnotation, StateGraph, START, END } from "@langchain/langgraph"
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages"
import { ToolNode } from "@langchain/langgraph/prebuilt"

// ============================== 2. CONFIG ==============================
dotenv.config()

// ============================== 3. TOOLS ==============================
// Define ALL tools here (0 = chat-only agent)
const tools = [
  tool1, tool2, // Add as needed
  // Empty array = chat agent only
]

// ============================== 4. LLM ==============================
const model = new ChatYourModel({
  apiKey: process.env.YOUR_KEY,
  model: "your-model",
  temperature: 0,
})
const modelWithTools = tools.length ? model.bindTools(tools) : model

// ============================== 5. STATE ==============================
type State = typeof MessagesAnnotation.State  // Simple messages OR custom

// ============================== 6. NODES ==============================
const agentNode = async (state: State) => {
  // System message ALWAYS first
  const system = new SystemMessage("Your instructions...")
  const response = await modelWithTools.invoke([system, ...state.messages])
  return { messages: [response] }
}

const toolsNode = new ToolNode(tools)  // Auto tool executor

// ============================== 7. ROUTER ==============================
const shouldContinue = (state: State): "tools" | "__end__" => {
  const last = state.messages.at(-1)
  return last.tool_calls?.length ? "tools" : "__end__"
}

// ============================== 8. GRAPH ==============================
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", agentNode)
  .addNode("tools", toolsNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, { tools: "tools", __end__: END })
  .addEdge("tools", "agent")

const app = workflow.compile()

// ============================== 9. INVOKE ==============================
const result = await app.invoke({ messages: [new HumanMessage("hi")] })

// ============================== 10. SCALE LATER ==============================
// Add nodes: .addNode("researcher", researcherNode)
// Add edges: .addConditionalEdges("agent", complexRouter)
// Add state: custom StateSchema({ messages, research: string })
// Add persistence: .compile({ checkpointer: new MemorySaver() })


---------- Summary and Future User ---------------
// ✅ KEEP: Your exact structure
// ✅ PERFECT: Tools → model.bindTools() → agentNode → ToolNode
// ✅ PERFECT: MessagesAnnotation state  
// ✅ PERFECT: shouldContinue router

// 🔧 MINOR: Type safety
function shouldContinue(state: typeof MessagesAnnotation.State): "tools" | "__end__" {
  // Your logic is perfect
}

// 🔧 SCALE: Add more nodes later
.addNode("summarizer", summarizeNode)  // Easy!


-----------========== Scale later ===========-------------
// More nodes
.addNode("validator", validateNode)
.addNode("planner", planNode)

// Complex router  
const advancedRouter = (state: State) => {
  if (state.error) return "validator"
  if (state.complex) return "planner" 
  return shouldContinue(state)
}

*/
