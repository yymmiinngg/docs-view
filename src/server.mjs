import { readFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, extname, join, normalize, sep } from 'node:path'
import { BASE, MIME } from './constants.mjs'

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

export function createRequestHandler({ distRoot, docsRoot, stagingRoot, homeSource }) {
  async function route(req, res) {
    const url = new URL(req.url, 'http://localhost')
    const pathname = decodeURIComponent(url.pathname)

    // 1) 无斜杠路径：cleanUrls 页面文件直达；目录 302 补斜杠
    if (pathname.startsWith(BASE) && pathname !== BASE && !pathname.endsWith('/')) {
      const last = pathname.slice(pathname.lastIndexOf('/') + 1)
      if (!last.includes('.')) {
        const rel = stripBase(pathname).replace(/^\//, '')
        const pageFile = safeResolve(distRoot, rel + '.html')
        if (pageFile && (await sendFile(res, pageFile, MIME['.html']))) return

        const dirPath = safeResolve(distRoot, rel)
        if (dirPath && existsSync(dirPath)) {
          try {
            if ((await stat(dirPath)).isDirectory()) {
              res.writeHead(302, { Location: encodeURI(pathname + '/' + (url.search || '')) })
              res.end()
              return
            }
          } catch { /* 继续走下面 */ }
        }
      }
    }

    // 2) .md 请求 -> 源文件原文；首页/目录页从内部首页源文件取
    if (pathname.endsWith('.md')) {
      const rel = stripBase(pathname).replace(/^\//, '')
      const srcFile = safeResolve(docsRoot, rel)
      if (srcFile && (await sendFile(res, srcFile, MIME['.md']))) return

      if (rel.toLowerCase() === 'index.md' || rel.toLowerCase().endsWith('/index.md')) {
        const generated = safeResolve(stagingRoot, join(dirname(rel), homeSource))
        if (generated && (await sendFile(res, generated, MIME['.md']))) return
      }

      send404(res, pathname)
      return
    }

    // 3) 静态产物：目录 -> index.html（无则跳第一个文档）；文件 -> 直接返回
    let rel = stripBase(pathname).replace(/^\//, '')
    if (!rel) rel = 'index.html'
    const statPath = safeResolve(distRoot, rel)

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
      } catch { /* 走 404 */ }
    }

    send404(res, pathname)
  }

  return async function handle(req, res) {
    try {
      await route(req, res)
    } catch (e) {
      console.error(`[docsview] 请求处理失败 ${req.url}: ${e.message}`)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Internal Server Error')
      } else {
        res.end()
      }
    }
  }
}
