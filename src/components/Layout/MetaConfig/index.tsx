import { CONFIG } from "site.config"
import Head from "next/head"

export type MetaConfigProps = {
  title: string
  description: string
  type: "Website" | "Post" | "Page" | string
  date?: string
  image?: string
  url: string
  // 검색에 노출하지 않음 (404, site.config.js seo.noindexSlugs). canonical 도 넣지 않음
  noindex?: boolean
}

const MetaConfig: React.FC<MetaConfigProps> = ({ ...props }) => {
  const meta = {
    ...props,
  }
  // OGP 는 글이면 article, 나머지는 website 만 받음
  const ogType = meta.type === "Post" ? "article" : "website"
  // html lang 은 ko-KR, OGP 는 ko_KR 형식
  const ogLocale = CONFIG.lang?.replace("-", "_")

  return (
    <Head>
      <title>{meta.title}</title>
      <meta
        name="robots"
        content={meta.noindex ? "noindex, follow" : "follow, index"}
      />
      <meta charSet="UTF-8" />
      <meta name="description" content={meta.description} />
      {!meta.noindex && <link rel="canonical" href={meta.url} />}
      {/* og */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={meta.url} />
      {ogLocale && <meta property="og:locale" content={ogLocale} />}
      {meta.image && <meta property="og:image" content={meta.image} />}
      {/* twitter */}
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:card" content="summary_large_image" />
      {meta.image && <meta name="twitter:image" content={meta.image} />}
      {/* post */}
      {meta.type === "Post" && (
        <>
          <meta property="article:published_time" content={meta.date} />
          <meta property="article:author" content={CONFIG.profile.name} />
        </>
      )}
    </Head>
  )
}

export default MetaConfig
