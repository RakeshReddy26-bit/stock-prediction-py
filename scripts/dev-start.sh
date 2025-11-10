#!/usr/bin/env bash
set -euo pipefail

BACKEND_PORT=${BACKEND_PORT:-5003}
PROXY_PORT=${PROXY_PORT:-3013}
FRONTEND_PORT=${FRONTEND_PORT:-3012}
BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"
PROXY_URL="http://127.0.0.1:${PROXY_PORT}"

log() { echo "[$(date +%H:%M:%S)] $*"; }

log "dev-start: BACKEND=${BACKEND_URL} PROXY=${PROXY_URL} FRONTEND_PORT=${FRONTEND_PORT}"

# Kill listeners on ports we'll use
for p in "${FRONTEND_PORT}" "${PROXY_PORT}"; do
  pid=$(lsof -tiTCP:${p} -sTCP:LISTEN || true)
  if [ -n "${pid}" ]; then
    log "Killing existing process ${pid} on port ${p}"
    kill -9 ${pid} || true
  fi
done

# Ensure backend is running (start if not)
if curl -sS "${BACKEND_URL}/api/stocks/health" >/dev/null 2>&1; then
  log "Backend already responding at ${BACKEND_URL}"
else
  log "Starting backend on port ${BACKEND_PORT}"
  PORT=${BACKEND_PORT} npm --prefix backend run dev > /tmp/backend-dev.log 2>&1 &
  echo $! > /tmp/backend.pid
  # wait for backend
  for i in $(seq 1 30); do
    if curl -sS "${BACKEND_URL}/api/stocks/health" >/dev/null 2>&1; then
      log "Backend is up"
      break
    fi
    sleep 1
  done
fi

# Start a tiny Python proxy that forwards /api to the backend
if curl -sS "${PROXY_URL}" >/dev/null 2>&1; then
  log "Proxy already responding at ${PROXY_URL}"
else
  log "Starting simple proxy on ${PROXY_PORT} -> ${BACKEND_URL}"
  nohup python3 -u -c "from http.server import BaseHTTPRequestHandler,HTTPServer
import urllib.request
class H(BaseHTTPRequestHandler):
  def do_GET(self):
    upstream = '${BACKEND_URL}'+self.path
    try:
      r = urllib.request.urlopen(upstream, timeout=5)
      body = r.read()
      self.send_response(r.getcode())
      for k,v in r.getheaders():
        self.send_header(k,v)
      self.end_headers()
      self.wfile.write(body)
    except Exception as e:
      self.send_response(502)
      self.end_headers()
      self.wfile.write(str(e).encode())
HTTPServer(('0.0.0.0', ${PROXY_PORT}), H).serve_forever()" > /tmp/dev-proxy.log 2>&1 &
  echo $! > /tmp/proxy.pid
  for i in $(seq 1 10); do
    if curl -sS "${PROXY_URL}" >/dev/null 2>&1; then
      log "Proxy up"
      break
    fi
    sleep 1
  done
fi

log "Starting frontend with BACKEND_URL=${PROXY_URL} on port ${FRONTEND_PORT}"
BACKEND_URL=${PROXY_URL} nohup npm --prefix frontend run dev -- --port ${FRONTEND_PORT} > /tmp/frontend-dev.log 2>&1 &
echo $! > /tmp/frontend.pid

# Wait for frontend root to respond
for i in $(seq 1 20); do
  if curl -sS "http://127.0.0.1:${FRONTEND_PORT}/" >/dev/null 2>&1; then
    log "Frontend is up"
    break
  fi
  sleep 1
done

log "Direct backend health:"
curl -sS -D - "${BACKEND_URL}/api/stocks/health" -o - | sed -n '1,200p'

log "Proxied frontend health:"
curl -sS -D - "http://127.0.0.1:${FRONTEND_PORT}/api/stocks/health" -o - | sed -n '1,200p'

log "dev-start: done (logs: /tmp/backend-dev.log /tmp/dev-proxy.log /tmp/frontend-dev.log)"
