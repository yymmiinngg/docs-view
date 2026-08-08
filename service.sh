#!/usr/bin/env bash
# docs-view 系统服务安装/管理脚本
# 用法: ./service.sh install|uninstall|status|restart
set -euo pipefail

SERVICE_NAME="docsview"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 探测 node 可执行文件（兼容 nvm 安装）
find_node() {
  if command -v node >/dev/null 2>&1; then
    command -v node
  elif [ -x "$HOME/.nvm/versions/node" ]; then
    find "$HOME/.nvm/versions/node" -maxdepth 3 -name node -type f 2>/dev/null | sort -V | tail -1
  else
    echo "" >&2
  fi
}

install() {
  local NODE_BIN
  NODE_BIN="$(find_node)"
  if [ -z "$NODE_BIN" ]; then
    echo "错误: 未找到 node，请先安装 Node.js" >&2
    exit 1
  fi
  echo "使用 node: $NODE_BIN"

  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=docsview (VitePress static site)
After=network.target

[Service]
Type=simple
WorkingDirectory=${PROJECT_DIR}
ExecStart=${NODE_BIN} ${PROJECT_DIR}/serve.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}"
  systemctl restart "${SERVICE_NAME}"
  echo "服务已安装并启动: ${SERVICE_NAME}"
}

uninstall() {
  systemctl stop "${SERVICE_NAME}" 2>/dev/null || true
  systemctl disable "${SERVICE_NAME}" 2>/dev/null || true
  rm -f "$SERVICE_FILE"
  systemctl daemon-reload
  echo "服务已卸载"
}

case "${1:-}" in
  install)   install ;;
  uninstall) uninstall ;;
  status)    systemctl status "${SERVICE_NAME}" --no-pager -l ;;
  restart)   systemctl restart "${SERVICE_NAME}" ;;
  *)         echo "用法: $0 install|uninstall|status|restart" >&2; exit 1 ;;
esac
