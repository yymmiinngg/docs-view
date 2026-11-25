#!/usr/bin/env bash
# docs-view 系统服务安装/管理脚本
# 用法: ./service.sh install|uninstall|status|restart|stop
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

# 输出端口和访问地址（PORT 取配置，docsview.local.conf 覆盖默认）
show_access() {
  local port=5173 value conf ip
  for conf in "${PROJECT_DIR}/docsview.conf" "${PROJECT_DIR}/docsview.local.conf"; do
    [ -f "$conf" ] || continue
    value="$(awk -F= '/^[[:space:]]*PORT[[:space:]]*=/ {gsub(/[[:space:]]/, "", $2); print $2}' "$conf" | tail -1)"
    [ -n "$value" ] && port="$value"
  done
  ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  [ -n "$ip" ] || ip="<服务器IP>"
  echo "端口: ${port}"
  echo "服务地址: http://${ip}:${port}/docs/"
  echo "本机地址: http://127.0.0.1:${port}/docs/"
  echo "nginx 入口: http://${ip}/docs/"
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
  show_access
}

uninstall() {
  systemctl stop "${SERVICE_NAME}" 2>/dev/null || true
  systemctl disable "${SERVICE_NAME}" 2>/dev/null || true
  rm -f "$SERVICE_FILE"
  systemctl daemon-reload
  echo "服务已卸载"
}

stop() {
  systemctl stop "${SERVICE_NAME}"
  echo "服务已停止: ${SERVICE_NAME}"
}

case "${1:-}" in
  install)   install ;;
  uninstall) uninstall ;;
  status)    systemctl status "${SERVICE_NAME}" --no-pager -l ;;
  restart)   systemctl restart "${SERVICE_NAME}"; show_access ;;
  stop)      stop ;;
  *)         echo "用法: $0 install|uninstall|status|restart|stop" >&2; exit 1 ;;
esac
