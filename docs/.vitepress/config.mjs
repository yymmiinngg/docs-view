import { defineConfig } from 'vitepress'
import { readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

function autoSidebar() {
  const docsRoot = dirname(fileURLToPath(import.meta.url)) + '/..'
  const sidebar = {}
  try {
    const entries = readdirSync(docsRoot, { withFileTypes: true })
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('.') || e.name === 'node_modules') continue
      let hasMd
      try { hasMd = readdirSync(join(docsRoot, e.name)).some(f => f.endsWith('.md')) } catch { continue }
      if (hasMd) {
        const item = { text: e.name, link: `/${e.name}/` }
        sidebar[`/${e.name}/`] = [item]
        sidebar['/'] = (sidebar['/'] || []).concat([item])
      }
    }
  } catch { /* no docs */ }
  return sidebar
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'docs-view',
  description: '文档查看工具 — VitePress',
  base: '/docs/',
  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true,
  head: [
    ['style', {}, `
      :root { --vp-layout-max-width: 1600px; }
      .vp-doc .container,
      .VPDoc .container,
      .VPDoc .content,
      .VPDoc .content-container,
      .content-container {
        max-width: 1600px !important;
      }
    `],
  ],
  vite: {
    server: {
      allowedHosts: ['qchan.digitpartner.ltd'],
    },
  },
  themeConfig: {
    nav: [{ text: '首页', link: '/' }],
    sidebar: autoSidebar(),
    search: { provider: 'local' },
    socialLinks: [],
  },
})
