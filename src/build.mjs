import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { prepareSource } from './staging.mjs'

/** 调用项目内 vitepress，不依赖 PATH 里的 npm */
export function buildSite({ root, buildRoot, stagingRoot, homeSource }) {
  return new Promise((resolve, reject) => {
    const vitepressBin = join(root, 'node_modules', '.bin', 'vitepress')
    const child = spawn(process.execPath, [vitepressBin, 'build', buildRoot], {
      cwd: root,
      env: {
        ...process.env,
        DOCSVIEW_DOCS_ROOT: stagingRoot,
        DOCSVIEW_HOME_SOURCE: homeSource,
      },
      stdio: ['ignore', 'inherit', 'inherit'],
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`build 失败，退出码 ${code}`))
    })
  })
}

/** 完整构建：镜像 → 生成列表 → vitepress build */
export async function rebuild(ctx) {
  await prepareSource(ctx)
  await buildSite(ctx)
}

/** 首次启动或构建失败后兜底：没有产物才构建 */
export async function ensureBuild(ctx) {
  if (existsSync(join(ctx.distRoot, 'index.html'))) return
  console.log('[docsview] 未找到构建产物，执行首次构建...')
  await rebuild(ctx)
  console.log('[docsview] 构建完成')
}
