// Serve the browser preview, which runs the real watchface/ code against
// DOM-backed @zos mocks. Run: node preview/server.mjs  [port]
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = +process.argv[2] || 8080
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
}

// Live reload: open pages listen on /__reload and refresh when a watched file changes.
const clients = new Set()
let timer
for (const dir of ['watchface', 'preview', 'assets']) {
  fs.watch(path.join(ROOT, dir), { recursive: true }, (event, name) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      console.log(`Changed ${dir}/${name || ''} -> reloading ${clients.size} page(s)`)
      for (const client of clients) client.write('data: reload\n\n')
    }, 100)
  })
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' })
    res.write(': connected\n\n')
    clients.add(res)
    req.on('close', () => clients.delete(res))
    return
  }
  const rel = url.pathname === '/' ? 'preview/index.html' : decodeURIComponent(url.pathname).slice(1)
  const file = path.resolve(ROOT, rel)
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end('Not found')
    return
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
  fs.createReadStream(file).pipe(res)
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Preview: http://localhost:${PORT}/  (add ?sample=wide&guides=1)`)
})
