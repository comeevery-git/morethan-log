import { CompatNotionAPI } from "./notionApi"

export async function getPostBlocks(id: string) {
  const api = new CompatNotionAPI()
  const pageBlock = await api.getPage(id)
  return pageBlock
}
