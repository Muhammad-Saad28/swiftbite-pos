const http = require("http");
const fs = require("fs");
const path = require("path");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".txt": "text/plain",
};

function startServer(baseDir, callback) {
  const server = http.createServer((req, res) => {
    try {
      let reqUrl = req.url.split("?")[0].split("#")[0];
      reqUrl = decodeURI(reqUrl);

      let targetPath = path.join(baseDir, reqUrl);

      // Check if path exists
      if (fs.existsSync(targetPath)) {
        if (fs.statSync(targetPath).isDirectory()) {
          // Check for index.html inside directory
          const indexInDir = path.join(targetPath, "index.html");
          if (fs.existsSync(indexInDir)) {
            targetPath = indexInDir;
          } else {
            // Check for [dir].html
            const htmlEquivalent = targetPath.replace(/[/\\]$/, "") + ".html";
            if (fs.existsSync(htmlEquivalent)) {
              targetPath = htmlEquivalent;
            }
          }
        }
      } else {
        // Try appending .html
        if (fs.existsSync(targetPath + ".html")) {
          targetPath = targetPath + ".html";
        } else {
          // Fallback to index.html or 404.html
          const fallback404 = path.join(baseDir, "404.html");
          if (fs.existsSync(fallback404)) {
            targetPath = fallback404;
          } else {
            targetPath = path.join(baseDir, "index.html");
          }
        }
      }

      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
        return;
      }

      const ext = path.extname(targetPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      res.writeHead(200, {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000",
      });

      const stream = fs.createReadStream(targetPath);
      stream.pipe(res);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  });

  // Bind to 127.0.0.1 on random free port
  server.listen(0, "127.0.0.1", () => {
    const port = server.address().port;
    callback(null, { server, port });
  });

  server.on("error", (err) => {
    callback(err);
  });
}

module.exports = { startServer };
