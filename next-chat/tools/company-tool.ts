import { tool } from "@langchain/core/tools"
import { COMPANY_DATA } from "../data"

export const getCompanyTool = tool(
  async () => {
    return COMPANY_DATA
  },
  {
    name: "search_company",
    description:
      "Company Details when user asks (example: what or who are you, what company are you or where are you located and so on) ",
  },
)
