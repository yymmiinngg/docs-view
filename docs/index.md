# docs-view 文档站点

基于 VitePress 的静态文档站点，支持自动构建与热更新。

## 使用技巧

### 添加新文档

在 `docs/` 下新建子目录或 `.md` 文件，保存后 `serve.mjs` 自动检测并重新构建，无需手动操作。

### 目录入口

没有 `index.md` 的目录，访问时会**自动跳转到第一个文档**（按中文文件名排序）。有 `index.md` 则正常渲染入口页。

### .md 原文直链

访问带 `.md` 后缀的 URL 即可获取源文件原文。

### 部署管理

```bash
sudo ./service.sh install    # 安装 systemd 服务
./service.sh restart         # 重启
./service.sh status          # 查看状态
./service.sh uninstall       # 卸载
```

---

## 文档目录

- **[pangu-sdk](/pangu-sdk/)** — 盘古 SDK 文档
  - [快速开始](/pangu-sdk/01-快速开始) ｜ [核心概念](/pangu-sdk/02-核心概念) ｜ [策略开发](/pangu-sdk/03-策略开发) ｜ [API 参考](/pangu-sdk/04-API参考) ｜ [示例](/pangu-sdk/05-示例)

- **[indicator-engine](/indicator-engine/)** — 指标引擎文档
  - 见左侧侧边栏
