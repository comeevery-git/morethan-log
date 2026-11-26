const { CONFIG } = require("./site.config")

module.exports = {
  siteUrl: CONFIG.link,
  generateRobotsTxt: true,
  sitemapSize: 7000,
  generateIndexSitemap: false,
  // 빌드 시각을 lastmod 로 넣지 않음. 모든 글이 같은 값이 되어 검색 엔진이 신호로 쓰지 않음
  autoLastmod: false,
  // 검색에 노출하지 않을 글 (site.config.js seo.noindexSlugs)
  exclude: CONFIG.seo.noindexSlugs.map((slug) => `/${slug}`),
  // public/ 정적 페이지는 빌드 목록에 없어서 직접 넣음
  additionalPaths: async (config) => [
    await config.transform(config, "/study/lesson"),
  ],
}
