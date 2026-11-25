import { existsSync, readFileSync } from 'node:fs'
import { join, resolve as resolvePath } from 'node:path'
import { DEFAULT_HOME_SOURCE, DEFAULT_PORT } from './constants.mjs'

/** 读取单个配置文件，返回 key=value 映射（# / ; 开头为注释） */
export function readConfFile(file) {
  const values = {}
  if (!existsSync(file)) return values
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch (e) {
    console.error(`[docsview] 读取配置失败 ${file}: ${e.message}`)
    return values
  }
  for (const line of text.split(/\r?\n/)) {
    const s = line.trim()
    if (!s || s.startsWith('#') || s.startsWith(';')) continue
    const eq = s.indexOf('=')
    if (eq < 0) {
      console.error(`[docsview] 忽略无效配置行 ${file}: ${s}`)
      continue
    }
    const key = s.slice(0, eq).trim()
    if (!key) continue
    let value = s.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    values[key] = value
  }
  return values
}

/** docsview.local.conf 覆盖 docsview.conf */
export function loadConfig(root) {
  const localFile = join(root, 'docsview.local.conf')
  const local = readConfFile(localFile)
  if (Object.keys(local).length) {
    console.log(`[docsview] 已加载本地配置: ${localFile}`)
  }
  return { ...readConfFile(join(root, 'docsview.conf')), ...local }
}

/** 从合并配置中读取 PORT */
export function readPort(cfg) {
  const raw = cfg.PORT
  if (raw === undefined) return DEFAULT_PORT
  const port = Number(raw)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`[docsview] 无效的 PORT: ${raw}，使用默认 ${DEFAULT_PORT}`)
    return DEFAULT_PORT
  }
  return port
}

/**
 * 把配置解析成运行期上下文。
 * 构建配置、缓存、产物固定在程序目录的 docs/ 下；DOCS_ROOT 只放 .md。
 */
export function resolveRuntime(root, cfg) {
  const docsRoot = resolvePath(root, cfg.DOCS_ROOT || 'docs')
  const buildRoot = join(root, 'docs')
  return {
    root,
    docsRoot,
    buildRoot,
    distRoot: join(buildRoot, '.vitepress', 'dist'),
    stagingRoot: join(root, '.docsview-src'),
    homeSource: DEFAULT_HOME_SOURCE,
    port: readPort(cfg),
  }
}
