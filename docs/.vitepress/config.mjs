import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'docs-view',
  description: '文档查看工具 — VitePress',
  base: '/docs/',
  cleanUrls: true,
  lastUpdated: true,
  vite: {
    server: {
      allowedHosts: ['qchan.digitpartner.ltd'],
    },
  },
  themeConfig: {
    nav: [{ text: '首页', link: '/' }],
    search: { provider: 'local' },
    socialLinks: [],
  },
})
