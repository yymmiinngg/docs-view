# docs-view

文档查看工具。

- 基于 VitePress 静态构建
- `serve.mjs` 生产静态服务
- 文档源文件直链访问（`.md` 原文）
- 无 `index.md` 的目录自动跳转到第一个文档

## 快速开始

```bash
npm install
npm run docs:build
node serve.mjs
```

访问 `http://localhost:5173/docs/`。
