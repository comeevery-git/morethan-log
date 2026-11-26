import Detail from "@containers/Detail"
import { filterPosts } from "@/src/libs/utils/notion"
import Layout from "@components/Layout"
import { CONFIG } from "@/site.config"
import { NextPageWithLayout } from "@pages/_app"
import { TPost, TPostStatus, TPostType } from "../types"
import CustomError from "@containers/CustomError"
import { getPostBlocks, getPosts } from "@libs/apis"

// 상세 주소로 열 수 있는 글. 목록(getStaticPaths)과 글 하나 열기(getStaticProps)가 같은 조건을 씀
const DETAIL_FILTER: { acceptStatus: TPostStatus[]; acceptType: TPostType[] } = {
  acceptStatus: ["Public", "PublicOnDetail"],
  acceptType: ["Paper", "Post", "Page"],
}

export async function getStaticPaths() {
  const posts = await getPosts()
  const filteredPost = filterPosts(posts, DETAIL_FILTER)

  return {
    paths: filteredPost.map((row) => `/${row.slug}`),
    // 목록에 없는 slug 는 서버가 그려서 바로 응답 (빈 껍데기 200 대신 404 나 완성된 글)
    fallback: "blocking",
  }
}

export async function getStaticProps({ params: { slug } }: any) {
  try {
    // fallback 은 목록에 없는 slug 도 여기로 보내서, Private 글과 없는 slug 는 여기서 404 로 막음
    const posts = filterPosts(await getPosts(), DETAIL_FILTER)
    const post = posts.find((t) => t.slug === slug)
    // 404 는 60초 유지. 아무 slug 나 두드려도 노션을 매초 다시 읽지 않게
    if (!post) return { notFound: true, revalidate: 60 }
    const blockMap = await getPostBlocks(post.id)

    return {
      props: { post, blockMap },
      revalidate: 1,
    }
  } catch (error) {
    // 노션 오류를 삼키면 빈 오류 화면이 정상 페이지로 캐시됨. 다시 던지면 Next 가 마지막 정상 페이지를 유지
    console.error(`[slug] ${slug} 글을 못 가져옴`, error)
    throw error
  }
}

type Props = {
  post: TPost
  blockMap: any
}

const DetailPage: NextPageWithLayout<Props> = ({ post, blockMap }) => {
  if (!post) return <CustomError />
  return <Detail blockMap={blockMap} data={post} />
}

DetailPage.getLayout = function getlayout(page) {
  const getImage = () => {
    if (page.props?.post.thumbnail) return page.props?.post.thumbnail
    if (CONFIG.ogImageGenerateURL)
      return `${CONFIG.ogImageGenerateURL}/${encodeURIComponent(
        page.props?.post.title
      )}.png?theme=dark&md=1&fontSize=125px&images=https%3A%2F%2Fmorethan-log.vercel.app%2Flogo-for-dark-bg.svg`
  }

  const getMetaConfig = () => {
    if (!page.props.post) {
      return {
        title: CONFIG.blog.title,
        description: CONFIG.blog.description,
        type: "website",
        url: CONFIG.link,
      }
    }
    return {
      title: page.props.post.title || CONFIG.blog.title,
      date: new Date(
        page.props.post.date?.start_date || page.props.post.createdTime || ""
      ).toISOString(),
      image: getImage(),
      description: page.props.post.summary,
      type: page.props.post.type[0],
      url: `${CONFIG.link}/${page.props.post.slug}`,
      noindex: CONFIG.seo.noindexSlugs.includes(page.props.post.slug),
    }
  }
  return (
    <Layout metaConfig={getMetaConfig()} fullWidth={page.props.post?.fullWidth}>
      {page}
    </Layout>
  )
}

export default DetailPage
