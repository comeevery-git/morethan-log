const CONFIG = {
  // profile setting (required)
  profile: {
    name: "lydia.s.kang",
    image: "/avatar.svg", // If you want to create your own notion avatar, check out https://notion-avatar.vercel.app
    role: "backend developer",
    bio: "백엔드 개발자의 여정을 기록합니다. 모든 소통에 열려있습니다 :)",
    email: "comeevery@gmail.com",
    // 아이디만. 화면에서 각 서비스 주소 앞부분을 붙임
    linkedin: "%EC%88%98%ED%9D%AC-%EA%B0%95-397116228",
    github: "comeevery-git",
    instagram: "hee_talk",
    // 전체 주소. 노션 프로필은 앞부분이 고정된 서비스 주소가 아니라서
    notion: "https://lydia-log.notion.site/Suhee-Kang-6a74265df2cf4e55ab1523008753a3e6",
  },
   projects: [
      {
        name: `AM02 iOS`,
        href: "https://apps.apple.com/app/id6758390140",
      },
      {
        name: `AM02 Android`,
        href: "https://play.google.com/store/apps/details?id=com.talkteam.am02",
      },
      {
        name: `AI 활용 코스`,
        href: "/study/lesson",
      },
   ],
  // blog setting (required)
  blog: {
    title: "lydia-log",
    description: "welcome to lydia-log!",
    theme: "auto", // ['light', 'dark', 'auto']
  },

  // CONFIG configration (required)
  link: "https://morethan-log.vercel.app",
  since: 2023, // If leave this empty, current year will be used.
  lang: "en-US", // ['en-US', 'zh-CN', 'zh-HK', 'zh-TW', 'ja-JP', 'es-ES', 'ko-KR']
  ogImageGenerateURL: "https://og-image-korean.vercel.app", // The link to generate OG image, don't end with a slash
  seo: {
    keywords: ["Blog", "Website", "Notion"],
  },

  // notion configuration (required)
  notionConfig: {
    pageId: process.env.NOTION_PAGE_ID,
  },

  // plugin configuration (optional)
  googleAnalytics: {
    enable: true,
    config: {
      measurementId: process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID || "",
    },
  },
  googleSearchConsole: {
    enable: false,
    config: {
      siteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    },
  },
  utterances: {
    enable: false,
    config: {
      repo: "morethanmin/morethan-log",
      "issue-term": "og:title",
      label: "💬 Utterances",
    },
  },
  cusdis: {
    enable: false,
    config: {
      host: "https://cusdis.com",
      appid: "", // Embed Code -> data-app-id value
    },
  },
  isProd: process.env.VERCEL_ENV === "production", // distinguish between development and production environment (ref: https://vercel.com/docs/environment-variables#system-environment-variables)
}

module.exports = { CONFIG }
