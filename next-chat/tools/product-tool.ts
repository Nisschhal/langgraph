import { tool } from "@langchain/core/tools"
import { PRODUCTS_DATA } from "../data"
import z from "zod"

type ProductToolProps = {
  name?: string
  description?: string
  category?: string
  specs?: string
  warranty?: string
  shipping?: string
}

/**
 * 
 * Not Good for real world search
 * As LLM doesn't know a user query is name or category or specs 
const getProductTool = tool(
  async ({
    name,
    description,
    category,
    specs,
    warranty,
    shipping,
  }: ProductToolProps) => {
    console.log("🔍 Product search:", {
      name,
      description,
      category,
      specs,
      warranty,
      shipping,
    })

    const matchedProducts = PRODUCTS_DATA.filter((product) => {
      // ANY field match = include product (OR logic)
      const matchesName =
        !name || product.name.toLowerCase().includes(name.toLowerCase())
      const matchesDesc =
        !description ||
        product.description.toLowerCase().includes(description.toLowerCase())
      const matchesCat =
        !category ||
        product.category.toLowerCase().includes(category.toLowerCase())

      // Specs: ANY spec value matches
      const matchesSpecs =
        !specs ||
        Object.values(product.specs).some((value) =>
          value.toLowerCase().includes(specs.toLowerCase()),
        )

      // Warranty: ANY warranty term matches
      const matchesWarranty =
        !warranty ||
        (product.warranty || []).some((term) =>
          term.toLowerCase().includes(warranty.toLowerCase()),
        )

      // Shipping: ANY shipping term matches
      const matchesShipping =
        !shipping ||
        (product.shipping || []).some((term) =>
          term.toLowerCase().includes(shipping.toLowerCase()),
        )

      // ✅ ANY ONE match = include product
      return (
        matchesName ||
        matchesDesc ||
        matchesCat ||
        matchesSpecs ||
        matchesWarranty ||
        matchesShipping
      )
    })

    // ✅ FORMAT FOR LLM (structured response)
    if (matchedProducts.length === 0) {
      return `No matching products found.`
    }

    return matchedProducts
      .slice(0, 5)
      .map(
        (product) =>
          `**${product.name}** (${product.category})
${product.description}
Price: ${product.price || "Contact for quote"}
Specs: ${Object.entries(product.specs)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")}
Warranty: ${product.warranty?.join(", ") || "N/A"}
Shipping: ${product.shipping?.join(", ") || "N/A"}`,
      )
      .join("\n\n")
  },
  {
    name: "get_product",
    description:
      "Search products by ANY combination of name, description, category, specs, warranty, or shipping keywords",
    schema: z.object({
      name: z.string().optional().describe("Product name keywords"),
      description: z.string().optional().describe("Description keywords"),
      category: z.string().optional().describe("Category like 'Multi-Station'"),
      specs: z.string().optional().describe("Specs like '100kg', '11-Gauge'"),
      warranty: z.string().optional().describe("Warranty keywords"),
      shipping: z.string().optional().describe("Shipping keywords"),
    }),
  },
)
 */
export const searchProductsTool = tool(
  async ({ query }: { query: string }) => {
    console.log("🔍 Smart search:", query)

    const matchedProducts = PRODUCTS_DATA.filter((product) => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
        Object.values(product.specs).join(" "), // ✅ Fixed
        ...product.warranty,
        ...product.shipping,
      ]
        .join(" ")
        .toLowerCase()

      return searchableText.includes(query.toLowerCase())
    })

    if (matchedProducts.length === 0) {
      return `No products match "${query}". Try: treadmill, Multi-Station, 100kg, Cardio`
    }

    // ✅ ALWAYS STRING RETURN (LangGraph requirement)
    return matchedProducts
      .slice(0, 5)
      .map((p) => `**${p.name}** (${p.category})\n${p.description}`)
      .join("\n\n")
  },
  {
    name: "search_product",
    description: "Smart search ALL product fields with ONE query",
    schema: z.object({
      query: z.string().describe("ANY keyword: 'cardio', 'treadmill', '100kg'"),
    }),
  },
)
export const getProductsTool = tool(
  async ({ number = "5" }: { number?: string }) => {
    const count = Math.min(parseInt(number) || 5, 20) // Max 20
    const products = PRODUCTS_DATA.slice(0, count)

    return products
      .map((p) => `**${p.name}** (${p.category}): ${p.description}`)
      .join("\n\n")
  },
  {
    name: "get_products",
    description:
      "Get featured products. Use 'number' for custom count (5, 10, 20)",
    schema: z.object({
      number: z
        .string()
        .optional()
        .describe("Number of products to show (5, 10, 20). Default: 5"),
    }),
  },
)
