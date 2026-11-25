/** 字号设置：组件与首屏脚本共用同一套取值范围 */
export const FONT_KEY = 'docsview-font-size'
export const FONT_DEFAULT = 16
export const FONT_MIN = 13
export const FONT_MAX = 20

/** 三档字号：小 / 中 / 大 */
export const FONT_STEPS = [
  { label: '小', size: 14 },
  { label: '中', size: 16 },
  { label: '大', size: 19 },
]

/** 旧版本可能存了 13–20 之间的任意值，归一到最近档位 */
export function nearestStep(size) {
  return FONT_STEPS.reduce((best, step) =>
    Math.abs(step.size - size) < Math.abs(best.size - size) ? step : best
  )
}

/** 写到根节点变量，正文与标题一起等比缩放 */
export function applyFontSize(size) {
  document.documentElement.style.setProperty('--dv-font-size', `${size}px`)
}
