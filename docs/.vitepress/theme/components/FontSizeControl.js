import { h, defineComponent, ref, onMounted } from 'vue'
import { FONT_KEY, FONT_DEFAULT, FONT_MIN, FONT_MAX, FONT_STEPS, nearestStep, applyFontSize } from '../font.mjs'

export default defineComponent({
  name: 'FontSizeControl',
  setup() {
    const size = ref(FONT_DEFAULT)

    onMounted(() => {
      const saved = Number(window.localStorage.getItem(FONT_KEY))
      size.value = (Number.isFinite(saved) && saved >= FONT_MIN && saved <= FONT_MAX)
        ? nearestStep(saved).size
        : FONT_DEFAULT
      applyFontSize(size.value)
    })

    function set(next) {
      size.value = next
      try { window.localStorage.setItem(FONT_KEY, String(next)) } catch { /* 隐私模式忽略 */ }
      applyFontSize(next)
    }

    return () => h('div', { class: 'font-size-actions' }, FONT_STEPS.map(step =>
      h('button', {
        class: `font-size-btn${size.value === step.size ? ' active' : ''}`,
        type: 'button',
        title: `${step.label}号字（${step.size}px）`,
        onClick: () => set(step.size),
      }, step.label)
    ))
  },
})
