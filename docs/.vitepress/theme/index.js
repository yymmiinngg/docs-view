import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import NavActions from './components/NavActions.js'
import './custom.css'

/** 主题只做装配：具体按钮在 components/ 下，布局补丁在 custom.css */
export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'nav-bar-content-after': () => h(NavActions),
    'nav-screen-content-after': () => h(NavActions),
  }),
}
