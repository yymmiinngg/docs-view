# docs-view

VitePress 文档站点，生产环境静态部署。

## 架构

```
浏览器 → nginx (/docs/ → 127.0.0.1:5173) → serve.mjs (静态服务) → docs/.vitepress/dist/
```

- **nginx 零改动**：`location /docs/ { proxy_pass http://127.0.0.1:5173; }`
- **serve.mjs**：Node 静态服务，托管 VitePress 构建产物
- **自动重建**：监听 `DOCS_ROOT` 源文件变化 → 防抖 500ms → 自动 `vitepress build`

## 特性

1. **纯静态产物**：VitePress build 生成 HTML，浏览器零模块加载，不会白屏
2. **自动构建**：文档增删改后自动 rebuild，即写即生效
3. **目录列表页**：首页和没有 `index.md` 的目录，都按 `.md` 结构自动生成文件列表，不手写链接
4. **左侧导航**：按 `.md` 目录结构自动生成侧边栏，层级展开，点击直达文档
5. **.md 原文直链**：`/docs/xxx.md` 直接返回源文件（text/markdown）
6. **URL 规范化**：
   - 无斜杠目录 → 302 补斜杠（`/docs/pangu-sdk` → `/docs/pangu-sdk/`）
   - cleanUrls 页面直达（`/docs/pangu-sdk/api` → api.html）
7. **子目录没有入口文档时** → 302 跳转到该目录第一个文档
8. **一键复制地址**：每个文档页有「当前地址」「源文地址」两个按钮，分别复制渲染页地址和 `.md` 源文件地址
9. **systemd 托管**：`service.sh` 安装，开机自启，SIGTERM 秒退

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
./service.sh stop              # 停止
./service.sh uninstall         # 卸载
```

## 配置

配置文件按顺序加载，后面的覆盖前面的：

1. `docsview.conf` — 项目默认配置，进 git
2. `docsview.local.conf` — 本地专属配置，不进 git（本地自行创建）

```ini
# docsview.conf
PORT=5173
DOCS_ROOT=docs
```

- `PORT`：服务监听端口，默认 `5173`。
- `DOCS_ROOT`：文档根目录，默认 `docs`。相对路径按项目根目录解析，也支持绝对路径。**这个目录只放 `.md` 文档**（可分子目录），不要放 `index.md` —— 首页由目录树自动生成，根目录的 `index.md` 会被忽略。构建时会把 `.md` 镜像到程序目录的 `.docsview-src/` 再编译；配置、缓存和产物都留在程序目录，不会写进 `DOCS_ROOT`。`.md` 原文直链和自动重建都基于这个目录。

`docsview.local.conf` 只需写要覆盖的项，例如：

```ini
PORT=5174
DOCS_ROOT=/data/my-docs
```

修改配置后重启服务生效：

```bash
./service.sh restart
```

## 目录结构

```
docs-view/
├── serve.mjs          # 生产静态服务
├── service.sh         # systemd 安装脚本
├── docsview.conf      # 默认配置（进 git）
├── docsview.local.conf # 本地覆盖配置（不进 git）
├── package.json
└── docs/              # 文档源（.md）
    └── .vitepress/    # VitePress 配置 + 构建产物
```
