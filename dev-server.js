const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const clients = new Set();

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendReload() {
  for (const client of clients) {
    client.write("data: reload\n\n");
  }
}

async function resolveFile(urlPath) {
  const cleanPath = urlPath === "/" ? "/index.html" : urlPath;
  const requestedPath = path.join(ROOT, cleanPath.replace(/^\/+/, ""));
  const normalizedPath = path.normalize(requestedPath);

  if (!normalizedPath.startsWith(ROOT)) {
    return null;
  }

  const stats = await fsp.stat(normalizedPath);
  return stats.isDirectory() ? path.join(normalizedPath, "index.html") : normalizedPath;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/__livereload") {
    res.writeHead(200, {
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    });
    res.write("retry: 1000\n\n");
    clients.add(res);

    req.on("close", () => {
      clients.delete(res);
    });
    return;
  }

  try {
    const filePath = await resolveFile(url.pathname);
    if (!filePath) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    const file = await fsp.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();

    res.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    });
    res.end(file);
  } catch (error) {
    const status = error.code === "ENOENT" ? 404 : 500;
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(status === 404 ? "Not found" : "Internal server error");
  }
});

fs.watch(ROOT, { persistent: true }, (_, filename) => {
  if (!filename) {
    return;
  }

  if ([".css", ".html", ".js"].includes(path.extname(filename).toLowerCase())) {
    sendReload();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Serving ${ROOT} at http://${HOST}:${PORT}`);
});

process.on("SIGINT", () => {
  for (const client of clients) {
    client.end();
  }

  server.close(() => {
    process.exit(0);
  });
});
