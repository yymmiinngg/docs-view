/**
 * 文档树：全项目唯一的扫描规则。
 * serve 的目录列表、VitePress 的 sidebar / rewrites 都从这里取，避免两份规则漂移。
 */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_HOME_SOURCE } from './constants.mjs'

const byName = (a, b) => a.name.localeCompare(b.name, 'zh')

function isIgnoredDir(name) {
  return name.startsWith('.') || name === 'node_modules'
}

function isMarkdown(name) {
  return name.toLowerCase().endsWith('.md')
}

function stripExt(name) {
  return name.replace(/\.md$/i, '')
}

/**
 * 扫描目录，返回节点树：
 * { name, rel, hasIndex, files: [{ name, rel }], dirs: [node] }
 * 文件 rel 不含 .md 后缀，可直接拼成站内链接。
 */
export function scanDocTree(root, { homeSource = DEFAULT_HOME_SOURCE } = {}) {
  function walk(dir, rel) {
    let entries = []
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return null
    }

    const hasIndex = entries.some(e => e.isFile() && e.name.toLowerCase() === 'index.md')

    const files = entries
      .filter(e => e.isFile() && isMarkdown(e.name) &&
        e.name !== homeSource && e.name.toLowerCase() !== 'index.md')
      .map(e => {
        const name = stripExt(e.name)
        return { name, rel: rel ? `${rel}/${name}` : name }
      })
      .sort(byName)

    const dirs = entries
      .filter(e => e.isDirectory() && !isIgnoredDir(e.name))
      .map(e => {
        const childRel = rel ? `${rel}/${e.name}` : e.name
        const node = walk(join(dir, e.name), childRel)
        return node ? { name: e.name, rel: childRel, ...node } : null
      })
      .filter(Boolean)
      .sort(byName)

    return { hasIndex, files, dirs }
  }

  const rootNode = walk(root, '') || { hasIndex: false, files: [], dirs: [] }
  return { name: '', rel: '', ...rootNode }
}

/** 生成 VitePress sidebar，全站共用一棵树 */
export function buildSidebar(tree) {
  function toItems(node) {
    const items = node.files.map(f => ({ text: f.name, link: `/${f.rel}` }))
    for (const d of node.dirs) {
      const children = toItems(d)
      if (!children.length) continue
      items.push({ text: d.name, link: `/${d.rel}/`, collapsed: false, items: children })
    }
    return items
  }

  const items = toItems(tree)
  return items.length ? { '/': items } : {}
}

/** 把内部首页/目录列表映射到各目录的 index.md */
export function buildRewrites(root, { homeSource = DEFAULT_HOME_SOURCE } = {}) {
  const map = {}

  function walk(dir, rel) {
    let entries = []
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const childRel = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) {
        if (isIgnoredDir(e.name)) continue
        walk(join(dir, e.name), childRel)
      } else if (e.isFile() && e.name === homeSource) {
        map[childRel] = rel ? `${rel}/index.md` : 'index.md'
      }
    }
  }

  walk(root, '')
  return map
}

/** Markdown 列表项，转义链接里会被解析器吃掉的字符 */
function mdLink(text, path) {
  const label = text.replace(/[[\]]/g, '\\$&')
  const href = path.replace(/[()]/g, c => (c === '(' ? '%28' : '%29')).replace(/ /g, '%20')
  return `- [${label}](${href})`
}

/** 目录列表的 Markdown 行（含缩进），用于自动生成的首页/目录页 */
export function renderListing(node, depth = 0) {
  const pad = '  '.repeat(depth)
  const out = []

  for (const f of node.files) {
    out.push(`${pad}${mdLink(f.name, `/${f.rel}`)}`)
  }

  for (const d of node.dirs) {
    const children = renderListing(d, depth + 1)
    // 空目录且没有 index.md 时不列出来
    if (!children.length && !d.hasIndex) continue
    out.push(`${pad}${mdLink(d.name, `/${d.rel}/`)}`)
    out.push(...children)
  }

  return out
}
