# CI / Deploy

## Relay deploy to Aliyun (阿里云效)

Script: `ci/aliyun_remote_deploy_relay.sh`

### What it does

- Creates a tarball containing `relay/server.js` + `relay/package.json`
- Uploads it to your server via SSH/SCP
- Extracts to `DEPLOY_PATH/releases/<release-id>` and updates `DEPLOY_PATH/current`
- Writes relay runtime env vars into `DEPLOY_PATH/shared/relay.env`
- Restarts the process via:
  - `DEPLOY_MODE=systemd` (default): installs/updates a systemd unit and restarts it (requires `sudo`)
  - `DEPLOY_MODE=nohup`: starts a background process and stores pid/log under `DEPLOY_PATH/shared`

### Aliyun pipeline variables (recommended)

Set these as 阿里云效 “变量/密钥” (secrets where appropriate):

- `DEPLOY_HOST` (required)
- `DEPLOY_USER` (default: `root`)
- `DEPLOY_PORT` (default: `22`)
- SSH credentials (for connecting to your ECS):
  - `SSH_PRIVATE_KEY` (recommended; can be a long multi-line private key), or `DEPLOY_SSH_KEY_PATH` (alias: `SSH_KEY`)
- Relay env:
  - `TARGET_URL` (default in code: `https://stardust.ticos.cn/realtime`)
  - `AUTH_TOKEN` or `AUTHORIZATION` (this is the upstream `Authorization` header value; not an SSH key)
  - Optional: `PORT`, `ALLOW_DEBUG_TOKEN`, `LOG_LEVEL`
- Env file behavior:
  - Default `DEPLOY_ENV_MODE=if_missing`: creates `DEPLOY_PATH/shared/relay.env` only if it doesn’t exist
  - Use `DEPLOY_ENV_MODE=keep` to never touch the env file (manage it manually on the server)
  - Use `DEPLOY_ENV_MODE=merge` to update only keys you pass in
  - Use `DEPLOY_ENV_MODE=overwrite` to replace the env file entirely

### Example: systemd mode (recommended)

```bash
pnpm deploy:relay
```

### Example: nohup mode (no sudo)

```bash
DEPLOY_MODE=nohup DEPLOY_SUDO=false pnpm deploy:relay
```
