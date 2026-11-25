import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanDocTree, buildSidebar, buildRewrites } from '../../src/docs.mjs'
import { DEFAULT_HOME_SOURCE } from '../../src/constants.mjs'

// 构建用的 .md 镜像目录由 serve.mjs 通过环境变量传入；原始 DOCS_ROOT 不放程序文件
const DOCS_ROOT = process.env.DOCSVIEW_DOCS_ROOT
  ? resolvePath(process.env.DOCSVIEW_DOCS_ROOT)
  : dirname(fileURLToPath(import.meta.url)) + '/..'
const HOME_SOURCE = process.env.DOCSVIEW_HOME_SOURCE || DEFAULT_HOME_SOURCE

// 文档树只扫描一次：sidebar 与 rewrites 共用，和服务端扫描规则同源
const TREE = scanDocTree(DOCS_ROOT, { homeSource: HOME_SOURCE })

// 导出普通对象而非 defineConfig(...)，这样文档根目录放到项目外时
// 配置文件不依赖从该目录解析 vitepress 包。
export default {
  lang: 'zh-CN',
  title: 'docs-view',
  description: '文档查看工具 — VitePress',
  base: '/docs/',
  srcDir: DOCS_ROOT,
  cleanUrls: true,
  // 首页和缺 index.md 的目录用内部名生成列表，构建时输出为对应目录的 index.html
  rewrites: buildRewrites(DOCS_ROOT, { homeSource: HOME_SOURCE }),
  ignoreDeadLinks: true,
  lastUpdated: true,
  appearance: true,
  head: [
    ['style', {}, `
      html { overflow-y: scroll; }
      :root { --vp-layout-max-width: 1600px; }
      .vp-doc .container,
      .VPDoc .container,
      .VPDoc .content,
      .VPDoc .content-container,
      .content-container {
        max-width: 1600px !important;
      }
    `],
    // 首屏渲染前应用上次选的字号，避免先大后小的闪烁
    ['script', {}, `
      try {
        var s = Number(localStorage.getItem('docsview-font-size'));
        if (s >= 13 && s <= 20) {
          document.documentElement.style.setProperty('--dv-font-size', s + 'px');
        }
      } catch (e) {}
    `],
  ],
  vite: {
    server: {
      allowedHosts: ['qchan.digitpartner.ltd'],
    },
  },
  themeConfig: {
    nav: [{ text: '首页', link: '/' }],
    sidebar: buildSidebar(TREE),
    search: { provider: 'local' },
    socialLinks: [],
  },
}
