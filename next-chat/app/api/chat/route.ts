import { getCompanyTool, getProductsTool, searchProductsTool } from "@/tools"
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages"
import {
  MessagesAnnotation,
  StateGraph,
  START,
  END,
  MemorySaver,
} from "@langchain/langgraph"
import { ToolNode } from "@langchain/langgraph/prebuilt"
import { ChatOpenAI } from "@langchain/openai"
import { NextRequest } from "next/server"

/**
 * ======================================================
 * 1. GRAPH SETUP (The Brain Architecture)
 * ======================================================
 */

// We use MessagesAnnotation. It's a pre-built schema that
// automatically handles merging new messages into the history.
const tools = [searchProductsTool, getProductsTool, getCompanyTool]
const toolNode = new ToolNode(tools)

// Initialize the LLM with streaming ENABLED
const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o-mini",
  temperature: 0,
  streaming: true, // This allows tokens to flow as they are generated
})

// The Agent Node: The "Logic" step
const agentNode = async (state: typeof MessagesAnnotation.State) => {
  // const systemPrompt = `You are **Wellness Nepal AI** – the Senior Equipment Consultant for Wellness Fitness Center, Butwāl. 🇳🇵

  // 🎭 PERSONALITY: Professional, Executive, and Technical.
  // - Use **English as your primary language** for technical specs and business details.
  // - Use **Nepali naturally and occasionally** (Neplish mix) for politeness, transitions, and local connection.
  // - Avoid over-using Nepali. It should feel like a professional business meeting in Nepal where both languages are mixed.
  // - Address users with "Hajur" or "Tapai". Strictly no "Bhai" or casual slang.

  // 🏢 COMPANY PROFILE:
  // - Wellness Fitness Center | "Premium Gym Solutions"
  // - 📍 Traffic Chowk, Butwal, Nepal | +977-9800000000
  // - ✉️ sales@wellnessnepal.com | Established 2015
  // - ✅ VAT: 601234567 | 500+ commercial gyms built | SHAKTI CERTIFIED

  // 🔥 PREMIUM STANDARDS:
  // - 12-gauge industrial steel frames | Biomechanical precision.
  // - Nationwide delivery (Free for Kathmandu & Butwal Valley).
  // - 10-year structural warranty | 50% advance | 13% VAT extra.

  // ## 🔄 CONVERSATION FLOW (GREETING RULES):
  // 1. **First Interaction Only:** Start with "Namaste! Welcome to Wellness Nepal."
  // 2. **Subsequent Messages:** DO NOT repeat the welcome. Get straight to the point. Answer the question professionally.

  // ## 🔧 TOOL EXECUTION RULES:
  // 1️⃣ SPECIFIC PRODUCT → search_product({query: "keyword"})
  // 2️⃣ GENERAL CATALOG → get_products({number: "optional_limit"})
  // 3️⃣ COMPANY/POLICY → search_company()

  // ## 🎯 PRIORITY PROTOCOL:
  // - If they mention a specific machine → Call 'search_product()'.
  // - If they want to see what's available → Call 'get_products()'.
  // - If they ask about delivery, location, or warranty → Call 'search_company()'.

  // ## 💬 RESPONSE STYLE (POST-TOOL):
  // - **Example 1 (Technical Inquiry):** "Hajur, our Shakti Pro Treadmill features a 4HP peak motor and 12-gauge steel frame. This is built for heavy commercial traffic. Technical details hajur-lai mail garum?"
  // - **Example 2 (Price/Policy):** "Regarding the delivery, Kathmandu ra Butwal valley bhitra it's completely free. For other locations, we provide nationwide logistics. VAT extra huncha, as per government norms."
  // - **Example 3 (Greeting):** "Namaste! Welcome to Wellness Nepal. How can I help you set up your premium fitness facility today?"

  // **CRITICAL:** Do not use heavy Nepali. Keep it professional 'Business English' with a local touch. NEVER fabricate specs. ALWAYS prioritize tool data.`

  const systemPrompt = `

You are **Wellness Nepal AI** – the Senior Equipment Consultant for Wellness Fitness Center, Butwāl. 🇳🇵

🎭 **PERSONALITY & TONE**:
- **Professional & Executive**: You are a high-level consultant, not a basic chatbot. 
- **The "Neplish" Balance**: Use **English** for 90% of technical specs and business terms. Use **Nepali** (Romanized) for politeness (Hajur, Tapai), transitions, and building "Apanapan" (local connection).
- **Honorifics**: Strictly address users with "Hajur" or "Tapai". 
- **No Spam**: Only use Namaste in the first greeting. Keep subsequent replies focused and sharp.
- **USE EMOJI to be funny and legible and engaging**

🏢 **WELLNESS NEPAL STATS**:
- **📍 Location**: Traffic Chowk, Butwal, Nepal (HQ) | +977-9800000000
- **✅ Credentials**: SHAKTI CERTIFIED | 500+ commercial gyms built | Established 2015.
- **🛡️ Standards**: 11-12 gauge industrial steel | Biomechanical precision.

💰 **COMMERCIAL POLICIES**:
- **VAT**: All prices mentioned are **Exclusive of 13% VAT** (Goverment norm hajur).
- **Payment**: 50% Advance for order confirmation | 50% on delivery.
- **Warranty**: 10-Year Structural Warranty on Shakti Premium lines.
- **Logistics**: Free Delivery & Installation inside **Kathmandu & Butwal Valley**.

🖼️ **VISUAL DISPLAY RULES**:
When a specific product is found via tools, you MUST format the response like a **Premium Product Card**:
1. Start with the Image: ![Product Name](image_url)
2. Use a Title: ### [Product Name]
3. Use a Table for Specs (e.g., Motor, Frame, Stack).
4. Clearly state: **Price: रू [Price] + VAT** (if price is null, say "Price on Quotation hajur").

## 🔧 TOOL EXECUTION LOGIC:
- If user mentions a machine name → \`search_product({query: "name"})\`
- If user wants to browse → \`get_products({category: "cardio/strength/etc"})\`
- If user asks about delivery/location/trust → \`search_company()\`

## 💬 EXAMPLE RESPONSE STYLE:
"Hajur, our **Cardio Pro T90** is built for 24/7 commercial traffic. 🏃‍♂️
![Cardio Pro T90](https://images.unsplash.com/...)

| Feature | Specification |
| :--- | :--- |
| **Motor** | 5.0 HP AC Peak |
| **Max User** | 180kg |
| **Warranty** | 5 Years Motor |

Price range hajur-lai रू 3,25,000 + VAT huncha. Kathmandu valley bhitra delivery ra installation free huncha. Shall I process a formal quotation for your gym?"

**CRITICAL**: NEVER fabricate specs. If data is missing, ask for their number so a human manager can call them. ALWAYS prioritize tool data.
`

  const modelWithTools = model.bindTools(tools)
  const messages = [new SystemMessage(systemPrompt), ...state.messages]

  // NOTE: We still use invoke here. streamEvents (in the handler)
  // will "peek" into this call and pull out the stream.
  const response = await modelWithTools.invoke(messages)
  return { messages: [response] }
}

// The Router: Decides if we talk to the user or use a tool
const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const lastMessage = state.messages.at(-1) as AIMessage
  if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) {
    return "toolNode"
  }
  return END
}

// Build the Workflow
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agentNode", agentNode)
  .addNode("toolNode", toolNode)
  .addEdge(START, "agentNode")
  .addConditionalEdges("agentNode", shouldContinue, {
    toolNode: "toolNode",
    [END]: END,
  })
  .addEdge("toolNode", "agentNode")

// Compile with Memory (Checkpointer)
const checkpointer = new MemorySaver()
const app = workflow.compile({ checkpointer })

/**
 * ======================================================
 * 2. THE SSE HANDLER (The Delivery System)
 * ======================================================
 */

export async function POST(request: NextRequest) {
  try {
    const { message, threadId } = await request.json()

    /**
     * WEB STREAM TOOLS
     * TransformStream is our "Pipe".
     * Writer is our "Hand" shoving data in.
     * Encoder is our "Translator" (Text -> Bytes).
     */
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    const encoder = new TextEncoder()

    const config = { configurable: { thread_id: threadId || "default" } }

    // This function runs in the background
    const runStream = async () => {
      try {
        /**
         * STREAM EVENTS (v2)
         * This is the secret sauce. It emits events for EVERY tiny action.
         * We specifically look for "on_chat_model_stream" to get word-by-word text.
         */
        const eventStream = await app.streamEvents(
          { messages: [new HumanMessage(message)] },
          { ...config, version: "v2" },
        )

        for await (const event of eventStream) {
          const eventType = event.event

          // A. CHAT TOKENS: When the LLM generates a word/fragment
          if (eventType === "on_chat_model_stream") {
            const content = event.data.chunk.content
            if (content) {
              // Standard SSE Format: data: <string>\n\n
              const ssePacket = `data: ${JSON.stringify({ type: "token", content })}\n\n`
              await writer.write(encoder.encode(ssePacket))
            }
          }

          // B. TOOL STARTS: Let the user know the AI is "searching..."
          //   else if (eventType === "on_tool_start") {
          //     const toolPacket = `data: ${JSON.stringify({ type: "tool", name: event.name })}\n\n`
          //     await writer.write(encoder.encode(toolPacket))
          //   }
        }
      } catch (err) {
        console.error("Stream Loop Error:", err)
        const errorPacket = `data: ${JSON.stringify({ type: "error", content: "Stream interrupted" })}\n\n`
        await writer.write(encoder.encode(errorPacket))
      } finally {
        // ALWAYS close the writer or the request will hang forever
        await writer.write(encoder.encode("data: [DONE]\n\n"))
        writer.close()
      }
    }

    // Execute the background process (No 'await' here!)
    runStream()

    /**
     * RETURN THE RESPONSE
     * We return the "Readable" side of the pipe.
     * The headers tell the browser: "Don't close this yet!"
     */
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disables buffering on Nginx/Vercel
      },
    })
  } catch (error) {
    console.log("[CHAT_POST_ERROR]: ", error)
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    })
  }
}
