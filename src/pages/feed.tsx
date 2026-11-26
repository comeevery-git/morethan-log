import { GetServerSideProps } from "next"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { NotionRenderer } from "react-notion-x"
import { getTextContent } from "notion-utils"
import { CONFIG } from "site.config"
import { getPostBlocks, getPosts } from "@libs/apis"
import { filterPosts } from "@/src/libs/utils/notion"
import { TPost } from "../types"

// RSS 2.0. 네이버 서치어드바이저 제출 조건: 각 item 본문은 글 전체, 10MB 미만, 응답이 느리면 제출 제한
// (https://searchadvisor.naver.com/guide/request-feed)
// 최신 글만. 본문 전체를 담아서 무거움. 네이버도 많은 URL 은 RSS 대신 사이트맵을 권장 (전체 목록은 sitemap.xml)
const FEED_ITEM_LIMIT = 10
// 노션 요청이 몰리지 않게 2편씩 (429 재시도는 CompatNotionAPI.fetch 가 함)
const BLOCK_FETCH_CONCURRENCY = 2
// CDN 이 1시간 캐시, 그 뒤 하루 동안은 옛 피드를 주면서 뒤에서 새로 만듦 (노션을 매 요청 읽지 않게)
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400"
// CDN 이 비었을 때도 같은 서버는 1시간 동안 만든 피드를 다시 씀 (getPosts 의 global 캐시와 같은 방식)
const MEMORY_TTL_MS = 60 * 60 * 1000

declare global {
  // eslint-disable-next-line no-var
  var feedCache: { xml: string; savedAt: number } | undefined
}

// 블로그 화면용 코드 블록은 브라우저 전용이라, 피드에서는 코드 글자만 그대로 넣음
const PlainCode = ({ block }: { block: any }) => (
  <pre>
    <code>{getTextContent(block?.properties?.title)}</code>
  </pre>
)

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// CDATA 안에 "]]>" 가 있으면 끊기므로 나눠서 씀
const cdata = (text: string) => `<![CDATA[${text.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`

const postUrl = (post: TPost) => `${CONFIG.link}/${post.slug}`

async function renderBody(post: TPost): Promise<string> {
  const recordMap = await getPostBlocks(post.id)
  // 글 머리의 노션 속성 표(Collection)는 피드 본문에 필요 없어서 그리지 않음
  return renderToStaticMarkup(
    <NotionRenderer
      recordMap={recordMap}
      components={{ Code: PlainCode, Collection: () => null }}
    />
  )
}

// 노션 요청을 한꺼번에 몰지 않게 몇 개씩 나눠 가져옴. 실패는 삼키지 않고 위로 던짐
async function renderAll(posts: TPost[]): Promise<string[]> {
  const bodies: string[] = []
  for (let i = 0; i < posts.length; i += BLOCK_FETCH_CONCURRENCY) {
    const chunk = posts.slice(i, i + BLOCK_FETCH_CONCURRENCY)
    bodies.push(...(await Promise.all(chunk.map(renderBody))))
  }
  return bodies
}

function buildFeed(posts: TPost[], bodies: string[]): string {
  const items = posts
    .map((post, i) => {
      const url = postUrl(post)
      const published = new Date(post.date?.start_date || post.createdTime)
      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<pubDate>${published.toUTCString()}</pubDate>`,
        `<description>${cdata(bodies[i])}</description>`,
        "</item>",
      ].join("")
    })
    .join("\n")

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(CONFIG.blog.title)}</title>`,
    `<link>${CONFIG.link}</link>`,
    `<description>${escapeXml(CONFIG.blog.description)}</description>`,
    "<language>ko</language>",
    `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `<atom:link href="${CONFIG.link}/feed" rel="self" type="application/rss+xml"/>`,
    items,
    "</channel>",
    "</rss>",
  ].join("\n")
}

async function getFeedXml(): Promise<string> {
  const cached = global.feedCache
  if (cached && Date.now() - cached.savedAt < MEMORY_TTL_MS) return cached.xml
  // 목록과 같은 조건(Public 이고 type Post, 예약 글 제외). getPosts 가 최신순이라 앞에서 자름
  const posts = filterPosts(await getPosts()).slice(0, FEED_ITEM_LIMIT)
  const xml = buildFeed(posts, await renderAll(posts))
  global.feedCache = { xml, savedAt: Date.now() }
  return xml
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const xml = await getFeedXml()
    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8")
    res.setHeader("Cache-Control", CACHE_CONTROL)
    res.write(xml)
    res.end()
    return { props: {} }
  } catch (error) {
    // 실패를 빈 피드로 덮지 않음. 500 이면 CDN 이 이전 피드를 계속 줌
    console.error("[feed] RSS 를 만들지 못함", error)
    throw error
  }
}

const Feed = () => null

export default Feed
