#!/usr/bin/env node
/**
 * docs-view 生产静态服务
 *
 * - 服务 VitePress 构建产物（docs/.vitepress/dist）
 * - 监听 docs/ 源文件变化，自动重新构建
 * - .md 请求直接返回源文件原文
 * - 无 index.html 的目录跳转到第一个文档
 * - 端口从 docsview.conf 读取（默认 5173）
 */
import { createServer } from 'node:http'
import { readFile, stat, readdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { extname, join, normalize, sep } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import chokidar from 'chokidar'

const ROOT = fileURLToPath(new URL('.', import.meta.url))
const DOCS_ROOT = join(ROOT, 'docs')
const DIST_ROOT = join(DOCS_ROOT, '.vitepress', 'dist')
const BASE = '/docs/'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
}

/** 从 docsview.conf 读取 PORT */
function readPort() {
  try {
    const conf = readFileSync(join(ROOT, 'docsview.conf'), 'utf8')
    const m = conf.match(/^\s*PORT\s*=\s*(\d+)/m)
    if (m) return Number(m[1])
  } catch { /* 默认 */ }
  return 5173
}

/** 执行 vitepress build（直接调用 node_modules/.bin/vitepress，不依赖 PATH 中的 npm） */
function build() {
  return new Promise((resolve, reject) => {
    const vitepressBin = join(ROOT, 'node_modules', '.bin', 'vitepress')
    const child = spawn(process.execPath, [vitepressBin, 'build', 'docs'], {
      cwd: ROOT,
      stdio: ['ignore', 'inherit', 'inherit'],
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`build 失败，退出码 ${code}`))
    })
  })
}

/** 确保 dist 存在（首次启动或构建失败后兜底） */
async function ensureBuild() {
  if (existsSync(join(DIST_ROOT, 'index.html'))) return
  console.log('[docsview] 未找到构建产物，执行首次构建...')
  await build()
  console.log('[docsview] 构建完成')
}

/** 剥离 base 前缀，返回 dist 相对路径 */
function stripBase(pathname) {
  if (pathname.startsWith(BASE)) return pathname.slice(BASE.length - 1)
  return pathname
}

/** 防路径穿越 */
function safeResolve(root, rel) {
  const full = normalize(join(root, rel))
  if (full !== root && !full.startsWith(root + sep)) return null
  return full
}

async function sendFile(res, filePath, mime) {
  try {
    const content = await readFile(filePath)
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' })
    res.end(content)
    return true
  } catch {
    return false
  }
}

function send404(res, pathname) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Not Found: ' + pathname)
}

/** 无 index.html 的目录：返回第一个文档名（按文件名排序，去 .html） */
async function firstDoc(distDir) {
  try {
    const entries = await readdir(distDir)
    const pages = entries
      .filter((f) => f.toLowerCase().endsWith('.html') && f.toLowerCase() !== 'index.html')
      .sort((a, b) => a.localeCompare(b, 'zh'))
    return pages.length ? pages[0].slice(0, -5) : null
  } catch {
    return null
  }
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const pathname = decodeURIComponent(url.pathname)

  // 1) 无斜杠路径：cleanUrls 页面文件直达；目录 302 补斜杠
  if (pathname.startsWith(BASE) && pathname !== BASE && !pathname.endsWith('/')) {
    const last = pathname.slice(pathname.lastIndexOf('/') + 1)
    if (!last.includes('.')) {
      const rel = stripBase(pathname).replace(/^\//, '')
      const pageFile = safeResolve(DIST_ROOT, rel + '.html')
      if (pageFile && (await sendFile(res, pageFile, MIME['.html']))) return
      const dirPath = safeResolve(DIST_ROOT, rel)
      if (dirPath && existsSync(dirPath)) {
        try {
          if ((await stat(dirPath)).isDirectory()) {
            res.writeHead(302, { Location: encodeURI(pathname + '/' + (url.search || '')) })
            res.end()
            return
          }
        } catch { /* 走下面 */ }
      }
    }
  }

  // 2) .md 请求 -> 返回 docs/ 源文件原文
  if (pathname.endsWith('.md')) {
    const rel = stripBase(pathname).replace(/^\//, '')
    const srcFile = safeResolve(DOCS_ROOT, rel)
    if (srcFile && (await sendFile(res, srcFile, MIME['.md']))) return
    send404(res, pathname)
    return
  }

  // 3) 静态产物：目录 -> index.html（无则跳第一个文档）；文件 -> 直接返回
  let rel = stripBase(pathname).replace(/^\//, '')
  if (!rel) rel = 'index.html'
  const statPath = safeResolve(DIST_ROOT, rel)
  if (statPath) {
    try {
      const s = await stat(statPath)
      if (s.isDirectory()) {
        const idx = join(statPath, 'index.html')
        if (await sendFile(res, idx, MIME['.html'])) return
        const first = await firstDoc(statPath)
        if (first) {
          res.writeHead(302, { Location: encodeURI(pathname + first) })
          res.end()
          return
        }
      } else {
        const mime = MIME[extname(statPath).toLowerCase()] || 'application/octet-stream'
        if (await sendFile(res, statPath, mime)) return
      }
    } catch { /* 404 */ }
  }

  send404(res, pathname)
}

// ---------- 启动 ----------
const PORT = readPort()
await ensureBuild()

const watcher = chokidar.watch(DOCS_ROOT, {
  ignored: (p) => p.includes('.vitepress/dist') || p.includes('.vitepress/cache') || p.includes('node_modules'),
  ignoreInitial: true,
  depth: 10,
})
let buildTimer = null
let building = false

watcher.on('all', (event, path) => {
  console.log('[docsview] watcher:', event, path)
  clearTimeout(buildTimer)
  buildTimer = setTimeout(async () => {
    if (building) return
    building = true
    try {
      console.log('[docsview] 检测到变化，重新构建...')
      await build()
      console.log('[docsview] 构建完成')
    } catch (e) {
      console.error('[docsview]', e.message)
    } finally {
      building = false
    }
  }, 500)
})

const server = createServer(handle)
server.listen(PORT, () => {
  console.log(`[docsview] 静态服务已启动: http://0.0.0.0:${PORT}${BASE}`)
  console.log(`[docsview] 产物目录: ${DIST_ROOT}`)
})

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))
