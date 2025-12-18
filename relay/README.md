# Realtime Relay

Small deployable WebSocket relay for browser scenarios where you can’t set WebSocket handshake headers (e.g. `Authorization`).

## Environment variables

- `PORT` (default: `2859`)
- `TARGET_URL` (default: `https://stardust.ticos.cn/realtime`)
- `AUTH_TOKEN` (optional) → sent as `Authorization: Bearer <token>`
- `AUTHORIZATION` (optional) → sent as the full `Authorization` header value
- `ALLOW_DEBUG_TOKEN` (optional) → if `true` and no auth is provided, uses `Authorization: Bearer X-Tiwater-Debug` (not for production)
- `LOG_LEVEL` (default: `info`, set to `silent` to disable logs)

## Run locally

```bash
# Option A: from repo root (recommended)
PORT=2859 TARGET_URL="https://stardust.ticos.cn/realtime" AUTH_TOKEN="..." pnpm relay

# Option B: from relay/
cd relay
PORT=2859 TARGET_URL="https://stardust.ticos.cn/realtime" AUTH_TOKEN="..." npm start
```

## Deploy to Railway

- Set the Railway “Root Directory” to `relay/`
- Configure env vars (`TARGET_URL`, `AUTH_TOKEN`/`AUTHORIZATION`, and optionally `PORT`)
- Start command: `npm start`

If you prefer deploying from the repo root (no Root Directory setting), set the Railway start command to `pnpm relay`.

If you want to avoid pnpm entirely, you can also set the start command to `node relay/server.js`.
