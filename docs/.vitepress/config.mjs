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
      let files
      try { files = readdirSync(join(docsRoot, e.name)) } catch { continue }
      const items = files
        .filter((f) => f.endsWith('.md') && f !== 'index.md')
        .sort((a, b) => a.localeCompare(b, 'zh'))
        .map((f) => ({
          text: f.replace(/\.md$/, ''),
          link: `/${e.name}/${f.replace(/\.md$/, '')}`,
        }))
      if (items.length) {
        const group = [{ text: e.name, items }]
        sidebar[`/${e.name}/`] = group
        sidebar['/'] = (sidebar['/'] || []).concat(group)
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
