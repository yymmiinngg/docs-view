import { copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { scanDocTree, renderListing } from './docs.mjs'

/**
 * 只把 .md 镜像到程序目录再构建：
 * - DOCS_ROOT 保持干净，不落任何程序文件
 * - Vite 从镜像目录解析依赖，避免外部文档根解析失败
 */
export async function prepareSource({ docsRoot, stagingRoot, homeSource }) {
  await rm(stagingRoot, { recursive: true, force: true })
  await mkdir(stagingRoot, { recursive: true })
  await mirrorMarkdown(docsRoot, stagingRoot)
  await writeListingFiles(stagingRoot, homeSource)
}

async function mirrorMarkdown(src, dest, rel = '') {
  const entries = await readdir(src, { withFileTypes: true })
  for (const e of entries) {
    const srcPath = join(src, e.name)
    const destRel = rel ? `${rel}/${e.name}` : e.name

    if (e.isDirectory()) {
      if (e.name.startsWith('.')) continue
      await mirrorMarkdown(srcPath, dest, destRel)
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) {
      if (!rel && e.name.toLowerCase() === 'index.md') {
        console.warn('[docsview] 忽略根目录 index.md：首页由目录树自动生成')
        continue
      }
      const target = join(dest, destRel)
      await mkdir(dirname(target), { recursive: true })
      await copyFile(srcPath, target)
    }
  }
}

/** 给没有 index.md 的目录生成列表页（写入内部首页文件名） */
async function writeListingFiles(stagingRoot, homeSource) {
  const tree = scanDocTree(stagingRoot)

  async function walk(node, absDir) {
    if (!node.hasIndex && (node.files.length || node.dirs.length)) {
      const title = node.name || '文档目录'
      const body = [`# ${title}`, '', ...renderListing(node), ''].join('\n')
      await writeFile(join(absDir, homeSource), body, 'utf8')
    }
    for (const d of node.dirs) {
      await walk(d, join(absDir, d.name))
    }
  }

  await walk(tree, stagingRoot)
}
