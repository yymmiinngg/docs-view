#!/usr/bin/env node
/**
 * docs-view 生产静态服务（入口）
 *
 * 职责只剩装配，具体实现拆分在 src/：
 * - config     读取 docsview.conf / docsview.local.conf，解析运行期路径
 * - docs       文档树扫描（sidebar / rewrites / 目录列表的唯一规则来源）
 * - staging    把 .md 镜像到程序目录，生成首页与目录列表
 * - build      调用 VitePress 构建
 * - server     HTTP 路由（静态产物、.md 原文、目录跳转）
 * - watcher    监听文档变化，防抖重建
 */
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadConfig, resolveRuntime } from './src/config.mjs'
import { ensureBuild, rebuild } from './src/build.mjs'
import { createRequestHandler } from './src/server.mjs'
import { watchDocs } from './src/watcher.mjs'
import { BASE } from './src/constants.mjs'

const ROOT = fileURLToPath(new URL('.', import.meta.url))
const ctx = resolveRuntime(ROOT, loadConfig(ROOT))

if (!existsSync(ctx.docsRoot)) {
  console.error(`[docsview] 文档根目录不存在: ${ctx.docsRoot}（配置项 DOCS_ROOT）`)
  process.exit(1)
}
if (!existsSync(`${ctx.buildRoot}/.vitepress/config.mjs`)) {
  console.error(`[docsview] 构建配置缺失: ${ctx.buildRoot}/.vitepress/config.mjs`)
  process.exit(1)
}

console.log(`[docsview] 文档根目录: ${ctx.docsRoot}`)
await ensureBuild(ctx)

const server = createServer(createRequestHandler(ctx))
server.listen(ctx.port, () => {
  console.log(`[docsview] 静态服务已启动: http://0.0.0.0:${ctx.port}${BASE}`)
  console.log(`[docsview] 产物目录: ${ctx.distRoot}`)
})

const watcher = watchDocs({
  docsRoot: ctx.docsRoot,
  onRebuild: async () => {
    console.log('[docsview] 检测到变化，重新构建...')
    try {
      await rebuild(ctx)
      console.log('[docsview] 构建完成')
    } catch (e) {
      console.error('[docsview]', e.message)
    }
  },
})

function shutdown() {
  watcher.close().finally(() => {
    server.close(() => process.exit(0))
    // 兜底：连接未断开时不要挂死
    setTimeout(() => process.exit(0), 2000).unref()
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
