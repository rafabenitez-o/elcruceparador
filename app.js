const IDIOMAS = [["es", "ES", "Español"], ["pt", "PT", "Português"], ["en", "EN", "English"]];
const VALIDOS = IDIOMAS.map(i => i[0]);
// Precios fuera de este rango se ignoran (protege de un cero de más al editar la planilla)
const PRECIO_MIN = 500, PRECIO_MAX = 100000;

let lang = "";
try { lang = localStorage.getItem("lang") || ""; } catch (e) {}
if (!VALIDOS.includes(lang)) { const n = (navigator.language || "es").slice(0, 2); lang = VALIDOS.includes(n) ? n : "es"; }

const $ = s => document.querySelector(s);
const pesos = n => n ? "$ " + Number(n).toLocaleString("es-AR", { useGrouping: "always" }) : "";
const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
const todas = PLATOS.flatMap(p => p.filas);

// Acepta 14000, $14.000, 14,000. Devuelve null si no es un precio válido o está fuera de rango.
function limpiarPrecio(v) {
  const s = String(v || "").replace(/[$\s]/g, "");
  if (!/^\d+([.,]\d{3})*$/.test(s)) return null;
  const n = Number(s.replace(/[.,]/g, ""));
  return n >= PRECIO_MIN && n <= PRECIO_MAX ? String(n) : null;
}

/* Precios guardados de la última visita (solo si se usa planilla) */
if (typeof PLANILLA_URL === "string" && PLANILLA_URL) {
  try {
    const c = JSON.parse(localStorage.getItem("precios") || "{}");
    for (const f of todas) { const v = limpiarPrecio(c[f.id]); if (v !== null) f.precio = v; }
  } catch (e) {}
}

/* Aparición de los platos (sin librerías) */
const io = "IntersectionObserver" in window
  ? new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("vis"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -40px 0px" })
  : null;
let primera = true;

function filasHTML(p) {
  return p.filas.map(f => {
    const pr = pesos(f.precio);
    if (f.et) return `<div class="opc"><span>${f.et[lang]}</span><b>${pr}</b></div>`;
    return pr ? `<div class="precio">${pr}</div>` : "";
  }).join("");
}

function dibujar() {
  const t = TEXTOS[lang];
  document.documentElement.lang = lang;
  $("#idiomas").innerHTML = IDIOMAS.map(([c, n, l]) =>
    `<button class="${c === lang ? "on" : ""}" data-l="${c}" aria-label="${l}" aria-pressed="${c === lang}">${n}</button>`).join("");
  let html = "", n = 0;
  for (const sec of ["platos", "alpaso", "extras"]) {
    html += `<h2>${t[sec]}</h2>`;
    for (const p of PLATOS.filter(x => x.sec === sec)) {
      const nom = p.nombre[lang], det = p.detalle ? `<div class="detalle">${p.detalle[lang]}</div>` : "";
      if (sec === "extras") {
        const solo = p.filas.length === 1 && !p.filas[0].et;
        html += solo
          ? `<div class="extra"><div class="nombre">${nom}</div><div class="precio">${pesos(p.filas[0].precio) || t.consultar}</div></div>`
          : `<div class="extra bloque"><div class="nombre">${nom}</div>${det}${filasHTML(p)}</div>`;
      } else {
        html += `<div class="plato${n % 2 ? " inv" : ""}" tabindex="0" role="button"><div class="foto"><img src="img/${p.img}" alt="${nom}" width="100" height="100" decoding="async" loading="${n < 2 ? "eager" : "lazy"}"></div>` +
          `<div class="info"><div class="nombre">${nom}</div>${det}${filasHTML(p)}</div></div>`;
        n++;
      }
    }
  }
  $("#carta").innerHTML = html;
  $("#pie").innerHTML = RESENA_URL
    ? `<a class="pastilla" href="${RESENA_URL}" target="_blank" rel="noopener"><img src="img/cubiertos.webp" alt="" width="24" height="24"><span>${t.resena}</span><img src="img/cubiertos.webp" alt="" width="24" height="24"></a>` : "";
  // Los 2 primeros platos aparecen de una; el resto con animación al hacer scroll
  document.querySelectorAll(".plato").forEach((el, i) => {
    if (io && primera && !quieto && i >= 2) io.observe(el); else el.classList.add("vis");
  });
  primera = false;
  armarRuta();
}

$("#idiomas").addEventListener("click", e => {
  const l = e.target.dataset && e.target.dataset.l;
  if (!l || !VALIDOS.includes(l)) return;
  lang = l; try { localStorage.setItem("lang", l); } catch (e) {}
  dibujar();
});

function leerCSV(txt) {
  return txt.trim().split(/\r?\n/).map(f => (f.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || [])
    .map(c => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim()));
}

/* Camino punteado y auto */
const area = $("#area"), svg = $("#camino"), auto = $("#auto");
// VEL_MAX = velocidad máxima | SUAVIDAD = más bajo = más lento y suave
const CARRIL = 26, VEL_MAX = 26, SUAVIDAD = 0.09, AUTO_INICIO = 0.085;
let tabla = [], alto = 0, altoDoc = 0, objetivo = 0, actual = 0, giro = 135, andando = false, finY = 0, mW = 23, mH = 23, pendiente = false;

// Junta todos los pedidos de recalcular en uno solo por cuadro (antes se repetía muchas veces)
function armarRuta() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(() => { pendiente = false; calcularRuta(); });
}

// La línea se ancla a los títulos reales, así sigue al contenido aunque cambie el largo de los textos.
function calcularRuta() {
  const ar = area.getBoundingClientRect(), W = ar.width;
  alto = ar.height;
  altoDoc = document.documentElement.scrollHeight;
  mW = (auto.offsetWidth || 46) / 2; mH = (auto.offsetHeight || 46) / 2;
  const top = el => el ? el.getBoundingClientRect().top - ar.top : 0;
  const h = document.querySelectorAll("#carta h2");
  const B = top(h[0]), C = top(h[1]) || alto * .5, D = top(h[2]) || alto * .8;
  const E = top($("#pie")) || alto;
  finY = E;
  // [izquierda 0 a derecha 1, altura en px] — siempre de arriba hacia abajo
  const PISTA = [[0.73, 0], [0.94, B], [0, (B + C) / 2], [1, (C + D) / 2], [0, D + (E - D) / 2], [0.02, E]];
  const puntos = PISTA.map(([fx, y]) => [Math.max(CARRIL, Math.min(W - CARRIL, fx * W)), y]);
  let d = `M${puntos[0][0]} ${puntos[0][1]}`;
  for (let i = 1; i < puntos.length; i++) {
    const [x0, y0] = puntos[i - 1], [x1, y1] = puntos[i], m = (y1 - y0) / 2;
    d += ` C${x0} ${y0 + m},${x1} ${y1 - m},${x1} ${y1}`;
  }
  svg.setAttribute("viewBox", `0 0 ${W} ${alto}`);
  svg.innerHTML = `<path d="${d}"/>`;
  const ruta = svg.querySelector("path"), largo = ruta.getTotalLength();
  tabla = [];
  for (let s = 0; s < largo; s += 6) { const p = ruta.getPointAtLength(s); tabla.push([p.y, p.x]); }
  const f = ruta.getPointAtLength(largo); tabla.push([f.y, f.x]);
  leerScroll();
}

function puntoEn(y) {
  let lo = 0, hi = tabla.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tabla[m][0] <= y) lo = m; else hi = m; }
  const a = tabla[lo], b = tabla[hi], t = b[0] === a[0] ? 0 : Math.min(1, Math.max(0, (y - a[0]) / (b[0] - a[0])));
  return { x: a[1] + (b[1] - a[1]) * t, g: Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI };
}

function dibujarAuto() {
  const p = puntoEn(actual);
  auto.style.transform = `translate(${p.x - mW}px,${actual - mH}px) rotate(${giro}deg)`;
}

function avanzar() {
  actual += Math.max(-VEL_MAX, Math.min(VEL_MAX, (objetivo - actual) * SUAVIDAD));
  const dg = ((puntoEn(actual).g + 45 - giro + 540) % 360) - 180;
  giro += dg * 0.2;
  dibujarAuto();
  if (Math.abs(objetivo - actual) > 0.3 || Math.abs(dg) > 0.5) requestAnimationFrame(avanzar); else andando = false;
}

function leerScroll() {
  if (!tabla.length) return;
  const max = altoDoc - innerHeight;
  const avance = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  const ini = AUTO_INICIO * alto, fin = Math.max(ini, finY - mH - 10);
  objetivo = ini + avance * (fin - ini);
  if (quieto) { actual = objetivo; giro = puntoEn(actual).g + 45; dibujarAuto(); }
  else if (!andando) { andando = true; requestAnimationFrame(avanzar); }
}

addEventListener("scroll", leerScroll, { passive: true });
addEventListener("load", armarRuta);
auto.addEventListener("load", armarRuta);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(armarRuta);
// Se reconstruye solo si cambia el tamaño del contenido (no con la barra del navegador del celular)
if ("ResizeObserver" in window) {
  let w0 = 0, h0 = 0;
  new ResizeObserver(() => {
    const w = area.clientWidth, h = area.clientHeight;
    if (w === w0 && h === h0) return;
    w0 = w; h0 = h;
    armarRuta();
  }).observe(area);
} else {
  let w0 = 0;
  addEventListener("resize", () => { if (area.clientWidth !== w0) { w0 = area.clientWidth; armarRuta(); } });
}

dibujar();

/* Precios desde la planilla: se redibuja solo si algo cambió */
if (typeof PLANILLA_URL === "string" && PLANILLA_URL) {
  const porId = new Map(todas.map(f => [norm(f.id), f]));
  fetch(PLANILLA_URL).then(r => r.ok ? r.text() : Promise.reject()).then(txt => {
    let cambio = false; const guardar = {};
    for (const [id, , precio] of leerCSV(txt).slice(1)) {
      const f = id && porId.get(norm(id)), v = limpiarPrecio(precio);
      if (!f || v === null) continue;
      if (f.precio !== v) { f.precio = v; cambio = true; }
      guardar[f.id] = v;
    }
    try { localStorage.setItem("precios", JSON.stringify(guardar)); } catch (e) {}
    if (cambio) dibujar();
  }).catch(() => {});
}

/* Visor: al tocar un plato se muestra en grande con el fondo difuminado */
const CERRAR = { es: "Cerrar", pt: "Fechar", en: "Close" };
const visor = document.createElement("div");
visor.className = "visor";
visor.setAttribute("role", "dialog");
visor.setAttribute("aria-modal", "true");
visor.innerHTML = '<button class="visor-x" type="button">×</button>' +
  '<div class="visor-caja"><div class="visor-foto"><img alt=""></div><div class="visor-texto"></div></div>';
document.body.appendChild(visor);
let previo = null;

function abrirVisor(pl) {
  const img = pl.querySelector("img"), x = visor.querySelector(".visor-x"), g = visor.querySelector("img");
  const chica = img.currentSrc || img.src;
  g.src = chica;
  g.alt = img.alt;
  // Si existe una versión grande en img/grandes/ con el mismo nombre, se carga y reemplaza a la chica.
  // Si no existe, se queda con la chica (no se rompe nada).
  const grande = chica.replace("/img/", "/img/grandes/");
  if (grande !== chica) {
    const G = new Image();
    G.onload = () => { if (visor.classList.contains("abierto") && g.alt === img.alt) g.src = G.src; };
    G.src = grande;
  }
  visor.querySelector(".visor-texto").innerHTML = pl.querySelector(".info").innerHTML;
  x.setAttribute("aria-label", CERRAR[lang]);
  previo = document.activeElement;
  visor.classList.add("abierto");
  x.focus({ preventScroll: true });
}
function cerrarVisor() {
  if (!visor.classList.contains("abierto")) return;
  visor.classList.remove("abierto");
  if (previo && previo.focus) previo.focus({ preventScroll: true });
}
$("#carta").addEventListener("click", e => { const pl = e.target.closest(".plato"); if (pl) abrirVisor(pl); });
visor.addEventListener("click", cerrarVisor);
addEventListener("keydown", e => {
  if (e.key === "Escape") cerrarVisor();
  else if (e.key === "Tab" && visor.classList.contains("abierto")) {
    // Mantiene el foco dentro del visor mientras está abierto
    e.preventDefault(); visor.querySelector(".visor-x").focus({ preventScroll: true });
  }
  else if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("plato")) {
    e.preventDefault(); abrirVisor(e.target);
  }
});

/* Funciona sin señal después de la primera visita (requiere https) */
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
