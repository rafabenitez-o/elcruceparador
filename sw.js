// Guarda la carta en el celular: abre rápido y también sin señal.
// - Código (html, js, css): intenta primero Internet (así siempre ves la versión nueva).
//   Si no hay señal o tarda más de 3 segundos, usa la copia guardada.
// - Imágenes y fuente: usa la copia guardada y la actualiza por detrás.
// Si cambiás fotos y no se ven, subí el número: cambiá "menu-v3" por "menu-v4".
const C = "menu-v4";
const ESPERA = 3000;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => clients.claim())
));

function guardar(e, c, r) {
  const p = c.put(e.request, r).catch(() => {});
  try { e.waitUntil(p); } catch (_) {}
}

async function redPrimero(e) {
  const c = await caches.open(C);
  const hit = await c.match(e.request);
  const red = fetch(e.request).then(r => { if (r.ok) guardar(e, c, r.clone()); return r; });
  if (!hit) return red;
  return Promise.race([red.catch(() => hit), new Promise(ok => setTimeout(() => ok(hit), ESPERA))]);
}

async function guardadoPrimero(e) {
  const c = await caches.open(C);
  const hit = await c.match(e.request);
  const red = fetch(e.request).then(r => { if (r.ok || r.type === "opaque") guardar(e, c, r.clone()); return r; }).catch(() => hit);
  return hit || red;
}

self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  // Solo archivos propios y fuentes. La planilla de precios siempre va a Internet.
  if (e.request.method !== "GET" || !(u.origin === location.origin || /fonts\.g/.test(u.host))) return;
  const esCodigo = u.origin === location.origin &&
    (e.request.mode === "navigate" || /(\.html|\.js|\.css|\/)$/.test(u.pathname));
  e.respondWith(esCodigo ? redPrimero(e) : guardadoPrimero(e));
});
