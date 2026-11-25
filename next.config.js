module.exports = {
  reactStrictMode: false,
  images: {
    domains: ['www.notion.so', 'lh5.googleusercontent.com', 's3-us-west-2.amazonaws.com'],
  },
  // 학습 페이지 (public/study/lesson/index.html) 를 /study/lesson 주소로, 단계 링크(#l1-step-1)는 그대로 동작
  async rewrites() {
    return [{ source: '/study/lesson', destination: '/study/lesson/index.html' }]
  },
}
