import { BASE } from '../../../../src/constants.mjs'
import { h, defineComponent, ref, onBeforeUnmount } from 'vue'

/** 当前页面对应的 .md 源文件地址；目录页对应目录下的 index.md */
function sourceUrl() {
  const origin = window.location.origin
  let rel = window.location.pathname.slice(BASE.length)
  if (!rel || rel.endsWith('/')) {
    rel += 'index.md'
  } else if (!rel.toLowerCase().endsWith('.md')) {
    rel += '.md'
  }
  return `${origin}${BASE}${rel}`
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* 非安全上下文走兜底 */ }
  const input = document.createElement('textarea')
  input.value = text
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  let ok = false
  try { ok = document.execCommand('copy') } catch { /* 不支持 */ }
  document.body.removeChild(input)
  return ok
}

export default defineComponent({
  name: 'CopySourceButtons',
  setup() {
    const copied = ref('')
    let timer = null
    onBeforeUnmount(() => clearTimeout(timer))

    async function onClick(kind) {
      const url = kind === 'source' ? sourceUrl() : window.location.href
      const ok = await copyText(url)
      copied.value = ok ? kind : ''
      clearTimeout(timer)
      timer = setTimeout(() => { copied.value = '' }, 1600)
    }

    const button = (kind, label, title) => h('button', {
      class: 'copy-source-btn',
      type: 'button',
      title,
      onClick: () => onClick(kind),
    }, copied.value === kind ? '已复制' : label)

    return () => h('div', { class: 'copy-source-actions' }, [
      button('page', '当前地址', '复制当前渲染页面的地址'),
      button('source', '源文地址', '复制当前页面对应的 .md 源文件地址'),
    ])
  },
})
