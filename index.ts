// ======================== IMPORTS ========================
import { ChatGoogleGenerativeAI } from "@langchain/google-genai" // Gemini model
import { tool } from "@langchain/core/tools" // Tool decorator
import { z } from "zod" // Input validation
import {
  MessagesAnnotation, // State schema for messages
  StateGraph, // Graph builder
} from "@langchain/langgraph"
import {
  HumanMessage, // User messages
  SystemMessage, // System instructions
  AIMessage, // AI responses
} from "@langchain/core/messages"
import { ToolNode } from "@langchain/langgraph/prebuilt" // Auto tool executor
import readline from "node:readline/promises" // CLI input
import dotenv from "dotenv" // Environment vars
import { PRODUCTS_DATA } from "./next-chat/data/products"

dotenv.config() // Load .env file

// ======================== TOOL 1: PRODUCT SEARCH ========================
const productSearchTool = tool(
  // EXECUTION FUNCTION: Runs when LLM calls this tool
  async ({ query, category }: { query?: string; category?: string }) => {
    console.log("🔍 Searching:", { query, category })

    // Multi-field fuzzy search across ALL product data
    const matches = PRODUCTS_DATA.filter((product) => {
      const searchableText = [
        product.name,
        product.category,
        product.description,
        Object.values(product.specs).join(" "), // All specs
        ...(product.warranty || []),
        ...(product.shipping || []), // Warranty/shipping
      ]
        .join(" ")
        .toLowerCase()

      // Match query AND/OR category (handles partial inputs)
      return (
        (!query || searchableText.includes(query.toLowerCase())) &&
        (!category ||
          product.category.toLowerCase().includes(category.toLowerCase()))
      )
    })

    // ALWAYS return formatted string (LLM requirement)
    if (matches.length === 0) {
      const categories = Array.from(
        new Set(PRODUCTS_DATA.map((p) => p.category)),
      ).join(", ")
      return `No products found. Available categories: ${categories}`
    }

    // Format results for human reading
    return matches
      .slice(0, 5)
      .map(
        (p) =>
          `**${p.name}** (${p.category})\n${p.description}\nSpecs: ${Object.entries(
            p.specs,
          )
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")}`,
      )
      .join("\n\n")
  },
  {
    name: "product_search", // LLM calls by this name
    description:
      "Search products by keywords, name, category, specs, warranty, shipping", // LLM decides when to use
    schema: z.object({
      // Input validation
      query: z
        .string()
        .optional()
        .describe("Search keywords like 'treadmill', '100kg'"),
      category: z
        .string()
        .optional()
        .describe("Exact category: Multi-Station, Cardio, Strength"),
    }),
  },
)

// ======================== TOOL 2: LIST ALL PRODUCTS ========================
const listAllProductsTool = tool(
  // SIMPLE TOOL: No args, lists everything
  async () => {
    console.log("📦 Listing all products")
    return PRODUCTS_DATA.slice(0, 8)
      .map(
        (product) =>
          `**${product.name}** (${product.category})\n${product.description}`,
      )
      .join("\n\n")
  },
  {
    name: "list_all_products",
    description:
      "Show COMPLETE product catalog. Use when user asks 'what products do you have?', 'show catalog', 'your products', 'everything'",
    schema: z.object({}), // No input args needed
  },
)

const tools = [productSearchTool, listAllProductsTool] // All available tools

// ======================== GEMINI MODEL SETUP ========================
const model = new ChatGoogleGenerativeAI({
  // Base Gemini model
  apiKey: process.env.GEMINI_KEY!, // Your API key
  model: "gemini-2.5-flash", // From your curl (Feb 2026)
  temperature: 0, // Deterministic responses
})

// BIND TOOLS: LLM now knows about tools and can call them
const modelWithTools = model.bindTools(tools)

// ======================== AGENT NODE ========================
// MAIN BRAIN: LLM decision making (call tools or respond)
async function callModel(state: typeof MessagesAnnotation.State) {
  console.log("\n🤖 Gemini 2.5 thinking...")

  // ✅ SYSTEM MESSAGE: Instructions for every LLM call
  const systemMessage = new SystemMessage(
    [
      "You are a helpful gym equipment sales assistant.",
      "",
      "TOOL RULES:",
      "• 'what products', 'catalog', 'show all', 'everything' → list_all_products",
      "• 'functional trainer', 'treadmill', '100kg' → product_search(query)",
      "• 'Multi-Station cardio' → product_search(query) OR product_search(category)",
      "",
      "After tools return results → explain helpfully to customer.",
      "Never invent product details - ALWAYS use tools first.",
      "Be enthusiastic about our premium gym equipment!",
    ].join("\n"),
  )

  // COMBINE: System + conversation history
  const messagesWithSystem = [systemMessage, ...state.messages]

  // CALL LLM: Gets tool_calls or normal response
  const response = await modelWithTools.invoke(messagesWithSystem)

  // DEBUG: Show what LLM decided
  console.log(
    response.content
      ? "→ Text response"
      : `→ Tool calls: ${response.tool_calls?.length || 0}`,
  )

  // RETURN: Append LLM response to state
  return { messages: [response] }
}

// ======================== ROUTER FUNCTION ========================
// DECISION MAKER: Tools needed? Or final answer?
function shouldContinue(
  state: typeof MessagesAnnotation.State,
): "tools" | "__end__" {
  const lastMessage = state.messages[state.messages.length - 1] // Latest LLM response
  const toolCalls = (lastMessage as any).tool_calls // Check for tool_calls

  const hasTools = Array.isArray(toolCalls) && toolCalls.length > 0 // True if tools requested

  console.log(`Router: ${hasTools ? "→ tools" : "→ END"}`)
  return hasTools ? "tools" : "__end__" // Route decision
}

// ======================== BUILD GRAPH ========================
const toolsNode = new ToolNode(tools) // AUTO executes tools

// REAct LOOP: Agent ↔ Tools ↔ Agent ↔ END
const workflow = new StateGraph(MessagesAnnotation) // Messages-only state
  .addNode("agent", callModel) // LLM decision node
  .addNode("tools", toolsNode) // Tool execution node

  // ENTRY: Always start with agent
  .addEdge("__start__", "agent")

  // ROUTER: After agent, check for tools
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools", // Has tools → execute
    __end__: "__end__", // No tools → finish
  })

  // LOOPBACK: Tools finish → back to agent (LLM sees results)
  .addEdge("tools", "agent")

const app = workflow.compile() // Production-ready graph

// ======================== CLI INTERFACE ========================
async function main() {
  const rl = readline.createInterface({
    // Interactive console
    input: process.stdin,
    output: process.stdout,
  })

  console.log("🚀 Gym Product Agent - Gemini 2.5 (type 'bye' to exit)")
  console.log(
    "Try: 'what products', 'functional trainer', 'treadmill', 'Multi-Station'\n",
  )

  while (true) {
    const userInput = await rl.question("You: ") // Get user input

    if (userInput.toLowerCase() === "bye") break // Exit condition

    try {
      // INVOKE GRAPH: Single function call runs entire ReAct loop
      const result = await app.invoke({
        messages: [new HumanMessage(userInput)], // Fresh conversation
      })

      // DISPLAY RESULT: Show final agent response
      console.log("\n🤖 Agent:")
      const lastMsg = result.messages[result.messages.length - 1]
      console.log((lastMsg as any).content || "Processing...")
      console.log("\n")
    } catch (error) {
      console.error("❌ Error:", error) // Error handling
    }
  }

  rl.close() // Cleanup
}

main().catch(console.error) // Run with error handling
