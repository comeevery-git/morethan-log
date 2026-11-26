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

// 구조화 데이터의 작성자. Google 은 작성자 url 이나 sameAs 를 강하게 권장
// (https://developers.google.com/search/docs/appearance/structured-data/article)
const author = {
  "@type": "Person",
  name: CONFIG.profile.name,
  url: `${CONFIG.link}/about`,
  sameAs: [
    CONFIG.profile.github && `https://github.com/${CONFIG.profile.github}`,
    CONFIG.profile.linkedin &&
      `https://www.linkedin.com/in/${CONFIG.profile.linkedin}`,
    CONFIG.profile.notion,
  ].filter(Boolean),
}

// 글은 BlogPosting, 홈은 WebSite. 나머지 페이지는 넣지 않음
const structuredData = (meta: MetaConfigProps) => {
  if (meta.type === "Post") {
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: meta.title,
      description: meta.description,
      datePublished: meta.date,
      image: meta.image ? [meta.image] : undefined,
      url: meta.url,
      mainEntityOfPage: meta.url,
      inLanguage: CONFIG.lang,
      author,
    }
  }
  if (meta.url === CONFIG.link) {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: CONFIG.blog.title,
      description: CONFIG.blog.description,
      url: CONFIG.link,
      inLanguage: CONFIG.lang,
      author,
    }
  }
  return null
}

// 제목, 설명은 노션에서 오므로 </script> 로 스크립트를 끊지 못하게 < 를 바꿔 씀
const toJsonLd = (data: object) =>
  JSON.stringify(data).replace(/</g, "\\u003c")

const MetaConfig: React.FC<MetaConfigProps> = ({ ...props }) => {
  const meta = {
    ...props,
  }
  // OGP 는 글이면 article, 나머지는 website 만 받음
  const ogType = meta.type === "Post" ? "article" : "website"
  // html lang 은 ko-KR, OGP 는 ko_KR 형식
  const ogLocale = CONFIG.lang?.replace("-", "_")
  const jsonLd = meta.noindex ? null : structuredData(meta)

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
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
        />
      )}
    </Head>
  )
}

export default MetaConfig
