/** 全项目共享常量：改这里一处，服务端和 VitePress 配置同时生效 */

export const BASE = '/docs/'

/** 首页/目录列表在构建镜像里的内部文件名，最终由 rewrites 输出为 index.md */
export const DEFAULT_HOME_SOURCE = '__docsview_home__.md'

export const DEFAULT_PORT = 5173

export const MIME = {
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
