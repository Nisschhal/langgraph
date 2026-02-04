import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { PRODUCTS_DATA } from "./data/products"

const productSearchTool = tool(
  async ({ query, category }: { query?: string; category?: string }) => {
    console.log("🔍 Product search:", { query, category })

    // Smart multi-field search
    const matches = PRODUCTS_DATA.filter((product) => {
      // All searchable text combined
      const searchableText = [
        product.name,
        product.category,
        product.description,
        Object.values(product.specs || {}).join(" "),
        // warranty and shipping as fallback
        ...(product.warranty || []),
        ...(product.shipping || []),
      ]
        .join(" ")
        .toLowerCase()

      const queryMatch = !query || searchableText.includes(query.toLowerCase())
      const categoryMatch =
        !category ||
        product.category.toLowerCase().includes(category.toLowerCase())

      return queryMatch && categoryMatch
    })

    // Format results perfectly for LLM/UI
    if (matches.length === 0) {
      return `No products found for "${query || "any query"}"${category ? ` in "${category}" category` : ""}. Try "functional trainer", "Multi-Station", or "100kg stacks".`
    }

    const formatted = matches
      .map((product) => {
        return `**${product.name}** (${product.category})
💰 Price: ${product.price || "Contact for quote"}
📝 ${product.description}
⚙️ **Specs**: ${Object.entries(product.specs || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")}
🛡️ **Warranty**: ${product.warranty?.join(", ") || "N/A"}
🚚 **Shipping**: ${product.shipping?.[0] || "N/A"}`
      })
      .join("\n\n")

    return `✅ Found **${matches.length}** product(s):\n\n${formatted}`
  },
  {
    name: "product_search",
    description:
      "Search gym equipment by name, category, specs, or description. Perfect for 'functional trainer', 'Multi-Station', '100kg stacks', 'steel frame'.",
    schema: z.object({
      query: z
        .string()
        .optional()
        .describe(
          "Keywords from name, description, specs, warranty. Examples: 'functional trainer', '100kg', 'steel frame'",
        ),
      category: z
        .string()
        .optional()
        .describe("Exact category like 'Multi-Station'"),
    }),
  },
)

export { productSearchTool }
