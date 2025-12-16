import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

const port = Number(process.env.PORT ?? process.env.RELAY_PORT ?? 2859);
const targetUrl = process.env.TARGET_URL ?? "https://stardust.ticos.cn/realtime";
const authToken = process.env.AUTH_TOKEN ?? process.env.TICOS_AUTH_TOKEN ?? "";
const allowDebugToken = (process.env.ALLOW_DEBUG_TOKEN ?? "").toLowerCase() === "true";
const logLevel = (process.env.LOG_LEVEL ?? "info").toLowerCase();

const shouldLog = logLevel !== "silent";
function log(...args) {
  if (shouldLog) console.log(...args);
}
function warn(...args) {
  if (shouldLog) console.warn(...args);
}
function error(...args) {
  if (shouldLog) console.error(...args);
}

let authHeaderValue = process.env.AUTHORIZATION ?? (authToken ? `Bearer ${authToken}` : "");
if (!authHeaderValue && allowDebugToken) {
  authHeaderValue = "Bearer X-Tiwater-Debug";
  warn("ALLOW_DEBUG_TOKEN=true: using debug Authorization token (do not use in production).");
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Realtime Relay Active");
});

server.on("upgrade", (req, socket, head) => {
  try {
    const target = new URL(targetUrl);
    const isTls = target.protocol === "https:" || target.protocol === "wss:";
    const upstream = isTls ? https : http;

    const headers = {
      Connection: "Upgrade",
      Upgrade: "websocket",
      "Sec-WebSocket-Version": req.headers["sec-websocket-version"] || "13",
      "Sec-WebSocket-Key": req.headers["sec-websocket-key"],
      ...(req.headers["sec-websocket-extensions"]
        ? { "Sec-WebSocket-Extensions": req.headers["sec-websocket-extensions"] }
        : {}),
      ...(req.headers["sec-websocket-protocol"]
        ? { "Sec-WebSocket-Protocol": req.headers["sec-websocket-protocol"] }
        : {}),
      ...(req.headers["origin"] ? { Origin: req.headers["origin"] } : {}),
      ...(authHeaderValue ? { Authorization: authHeaderValue } : {}),
    };

    log("Relay upgrade ->", target.toString());

    const upstreamReq = upstream.request({
      hostname: target.hostname,
      port: target.port ? Number(target.port) : isTls ? 443 : 80,
      path: target.pathname + (target.search || ""),
      method: "GET",
      headers,
      timeout: 10_000,
    });

    upstreamReq.on("upgrade", (upstreamRes, upstreamSocket, upstreamHead) => {
      const responseHeaders = [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        ...(upstreamRes.headers["sec-websocket-accept"]
          ? [`Sec-WebSocket-Accept: ${upstreamRes.headers["sec-websocket-accept"]}`]
          : []),
        ...(upstreamRes.headers["sec-websocket-protocol"]
          ? [`Sec-WebSocket-Protocol: ${upstreamRes.headers["sec-websocket-protocol"]}`]
          : []),
      ];

      socket.write(responseHeaders.join("\r\n") + "\r\n\r\n");

      if (head?.length) upstreamSocket.write(head);
      if (upstreamHead?.length) socket.write(upstreamHead);

      socket.pipe(upstreamSocket);
      upstreamSocket.pipe(socket);
    });

    upstreamReq.on("response", (upstreamRes) => {
      warn("Upstream did not upgrade:", upstreamRes.statusCode);
      socket.destroy();
    });

    upstreamReq.on("timeout", () => {
      error("Upstream request timeout");
      upstreamReq.destroy(new Error("Upstream request timeout"));
      socket.destroy();
    });

    upstreamReq.on("error", (err) => {
      error("Upstream connection error:", err);
      socket.destroy();
    });

    upstreamReq.end();
  } catch (err) {
    error("Relay error:", err);
    socket.destroy();
  }
});

server.listen(port, () => {
  log(`Realtime Relay listening on ws://localhost:${port}`);
  log(`Target: ${targetUrl}`);
  if (!authHeaderValue) warn("No auth configured (set AUTH_TOKEN or AUTHORIZATION if required).");
});
