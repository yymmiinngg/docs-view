# docs-view

VitePress 文档站点，生产环境静态部署。

## 架构

```
浏览器 → nginx (/docs/ → 127.0.0.1:5173) → serve.mjs (静态服务) → docs/.vitepress/dist/
```

- **nginx 零改动**：`location /docs/ { proxy_pass http://127.0.0.1:5173; }`
- **serve.mjs**：Node 静态服务，托管 VitePress 构建产物
- **自动重建**：监听 `docs/` 源文件变化 → 防抖 500ms → 自动 `vitepress build`

## 特性

1. **纯静态产物**：VitePress build 生成 HTML，浏览器零模块加载，不会白屏
2. **自动构建**：文档增删改后自动 rebuild，即写即生效
3. **.md 原文直链**：`/docs/xxx.md` 直接返回源文件（text/markdown）
4. **URL 规范化**：
   - 无斜杠目录 → 302 补斜杠（`/docs/pangu-sdk` → `/docs/pangu-sdk/`）
   - cleanUrls 页面直达（`/docs/pangu-sdk/api` → api.html）
5. **无 index.md 目录** → 302 跳转到该目录第一个文档
6. **systemd 托管**：`service.sh` 安装，开机自启，SIGTERM 秒退

## 本地开发

```bash
npm install
npm run docs:dev      # 开发调试（VitePress dev server）
```

## 生产部署

```bash
npm install
npm run docs:build    # 构建静态产物（serve.mjs 启动时也会自动构建）
node serve.mjs        # 启动静态服务（默认 5173，端口在 docsview.conf 配置）
```

systemd 安装：

```bash
sudo ./service.sh install      # 安装 + 启动 + 开机自启
./service.sh status            # 查看状态
./service.sh restart           # 重启
./service.sh uninstall         # 卸载
```

## 配置

`docsview.conf`：

```ini
# 服务监听端口
PORT=5173
```

修改后需重新执行 `service.sh install` 生效。

## 目录结构

```
docs-view/
├── serve.mjs          # 生产静态服务
├── service.sh         # systemd 安装脚本
├── docsview.conf      # 端口配置
├── package.json
└── docs/              # 文档源（.md）
    └── .vitepress/    # VitePress 配置 + 构建产物
```
