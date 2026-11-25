import chokidar from 'chokidar'
import { relative, sep } from 'node:path'

/**
 * 监听文档目录，防抖后触发一次重建。
 * 构建期间到来的变更会被合并到下一轮，不会并发跑两个构建。
 */
export function watchDocs({ docsRoot, debounceMs = 500, onRebuild }) {
  const watcher = chokidar.watch(docsRoot, {
    ignored: (p) => {
      const rel = relative(docsRoot, p)
      return rel === '.vitepress' || rel.startsWith('.vitepress' + sep)
    },
    ignoreInitial: true,
  })

  let timer = null
  let building = false

  watcher.on('all', () => {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      if (building) return
      building = true
      try {
        await onRebuild()
      } finally {
        building = false
      }
    }, debounceMs)
  })

  return watcher
}
