import { h, defineComponent } from 'vue'
import CopySourceButtons from './CopySourceButtons.js'
import FontSizeControl from './FontSizeControl.js'

/** 导航栏右侧的操作按钮组：复制地址 + 字号切换 */
export default defineComponent({
  name: 'NavActions',
  setup() {
    return () => h('div', { class: 'nav-actions' }, [
      h(CopySourceButtons),
      h(FontSizeControl),
    ])
  },
})
