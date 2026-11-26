import { NotionAPI } from "notion-client"

// got 기본 User-Agent 는 노션이 403 으로 차단
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

// 노션은 요청이 몰리면 429 를 줌. 빌드(글 수십 편을 한꺼번에 생성), 피드에서 잠깐 막혀도 전체가 실패하지 않게 기다렸다 다시 시도
// (2026-11-26 로컬 빌드가 429 하나로 멈춘 뒤 추가)
const RETRY_ON_429 = 3
const RETRY_BASE_MS = 1500
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const isRateLimited = (error: any) => error?.response?.statusCode === 429

// 응답 중 레코드 묶음 키. 노션이 레코드를 { value: { value, role } } 로 한 겹 더 감싸서 보냄
const RECORD_MAP_KEYS = ["recordMap", "recordMapWithRoles"]

type RecordEntry = { value?: any; role?: string; [key: string]: unknown }
type RecordTable = Record<string, RecordEntry>
type FetchArgs = Parameters<NotionAPI["fetch"]>[0]

const isPlainObject = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v)

// 감싸진 레코드만 예전 모양 { value, role } 으로 풀고 나머지는 그대로
const unwrapEntry = (entry: RecordEntry): RecordEntry => {
  const inner = entry?.value
  const wrapped = isPlainObject(inner) && "value" in inner && "role" in inner
  return wrapped ? { ...entry, value: inner.value, role: inner.role } : entry
}

const unwrapTable = (table: RecordTable): RecordTable =>
  Object.fromEntries(
    Object.entries(table).map(([id, entry]) => [id, unwrapEntry(entry)])
  )

const unwrapRecordMap = (recordMap: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(recordMap).map(([table, records]) => [
      table,
      isPlainObject(records) ? unwrapTable(records as RecordTable) : records,
    ])
  )

export const unwrapResponse = <T>(response: T): T => {
  if (!isPlainObject(response)) return response
  return Object.fromEntries(
    Object.entries(response).map(([key, value]) => [
      key,
      RECORD_MAP_KEYS.includes(key) && isPlainObject(value)
        ? unwrapRecordMap(value)
        : value,
    ])
  ) as T
}

// 모든 요청이 거치는 fetch 에서 UA 지정과 응답 풀기를 처리해, getPage 내부 판정과 react-notion-x 렌더가 예전 모양을 그대로 받음
export class CompatNotionAPI extends NotionAPI {
  async fetch<T>(args: FetchArgs): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await super.fetch<T>({
          ...args,
          headers: { ...args.headers, "user-agent": USER_AGENT },
        })
        return unwrapResponse(response)
      } catch (error) {
        if (!isRateLimited(error) || attempt >= RETRY_ON_429) throw error
        await wait(RETRY_BASE_MS * (attempt + 1))
      }
    }
  }
}
