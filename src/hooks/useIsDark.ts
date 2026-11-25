import { useEffect, useState } from "react"

// html.dark 클래스를 따라감. 테마는 useThemeEffect 와 ThemeToggle 이 이 클래스로만 바꿈
// 노션 렌더러는 darkMode 를 받아야 목차, 콜아웃 같은 블록에 다크 색을 씀
const useIsDark = (): boolean => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setIsDark(root.classList.contains("dark"))
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return isDark
}

export default useIsDark
