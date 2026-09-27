import { existsSync, readFileSync, statSync, watch } from 'node:fs';
import { createServer, type ServerResponse } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { check, deriveChecked } from './check.ts';
import { APP_DIR } from './paths.ts';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

/** Tells the page to reload whenever the dev server says so. */
const RELOAD_SCRIPT = `<script>new EventSource('/__reload').onmessage = () => location.reload();</script>`;

/**
 * Serves the app shell with the map as it is on disk: `/map.json` is loaded,
 * validated and derived on every request, and every open page reloads when a
 * file next to the map changes. An invalid map answers with its issues, which
 * the page lists instead of the map.
 */
export function serve(mapFile: string, port: number): void {
  if (!existsSync(join(APP_DIR, 'index.html'))) {
    throw new Error(`The app shell is missing at ${APP_DIR}. Build the package first (npm run build).`);
  }
  const clients = new Set<ServerResponse>();

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/__reload') {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (url.pathname === '/map.json') {
      const result = await check(mapFile, { fresh: true });
      const json = (status: number, body: unknown) => {
        res.writeHead(status, { 'content-type': TYPES['.json'], 'cache-control': 'no-store' });
        res.end(JSON.stringify(body));
      };
      if (result.errors.length) {
        const n = result.errors.length;
        return json(422, { message: `The map has ${n} problem${n === 1 ? '' : 's'}`, issues: result.errors });
      }
      return json(200, deriveChecked(result));
    }

    const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    let file = join(APP_DIR, path);
    if (!file.startsWith(APP_DIR)) return void res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) return void res.writeHead(404).end('Not found');
    let body: Buffer | string = readFileSync(file);
    if (file.endsWith('.html')) body = body.toString('utf8').replace('</body>', `${RELOAD_SCRIPT}</body>`);
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    res.end(body);
  });

  // Editors often save by replacing the file, so watch the folder, not the file.
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(dirname(mapFile), (_event, name) => {
    if (!name || !/\.(ts|js|json|mjs)$/.test(name) || name.startsWith('.')) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const { errors } = await check(mapFile, { fresh: true });
      console.log(errors.length ? `✗ ${errors.length} problem(s) in the map` : '✓ map reloaded');
      for (const c of clients) c.write('data: reload\n\n');
    }, 100);
  });

  server.listen(port, () => console.log(`Onboarding map at http://localhost:${port}  (watching ${mapFile})`));
}
