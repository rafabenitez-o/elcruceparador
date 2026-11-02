// PRECIOS: cambiá solo los números de "precio". Cada precio tiene su propio id (igual que en la planilla).
// Para actualizar desde Google Sheets: pegá abajo el link CSV publicado de la planilla (dejalo vacío si no).
const PLANILLA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSiMPZB-ImR3AwSYkUTrMO88TqEQeUGU_lRWiQEdtHOaEJ7dFe_7mHCZ5IGLyXU8g/pub?output=csv";

// RESEÑA: pegá el link de "Dejar una reseña" de tu ficha de Google Maps (si lo dejás vacío, el botón no aparece).
const RESENA_URL = "https://g.page/r/CXe_jxr52V9KEAE/review";

const TEXTOS = {
  es: { platos: "PLATOS", alpaso: "AL PASO", extras: "TAMBIÉN TENEMOS", consultar: "Consultar", resena: "Dejanos tu reseña" },
  pt: { platos: "PRATOS", alpaso: "RÁPIDOS", extras: "TAMBÉM TEMOS", consultar: "Consulte", resena: "Deixe sua avaliação" },
  en: { platos: "DISHES", alpaso: "QUICK BITES", extras: "ALSO AVAILABLE", consultar: "Ask us", resena: "Leave us a review" }
};

const POLLO = { es: "Pollo", pt: "Frango", en: "Chicken" };
const CARNE = { es: "Carne", pt: "Carne", en: "Beef" };

const PLATOS = [
  { sec: "platos", img: "p1.webp", nombre: { es: "Chuleta con huevo", pt: "Costeleta com ovos", en: "Chop w/ egg" },
    filas: [{ id: "PLATO 1", precio: "14000" }] },
  { sec: "platos", img: "p2.webp", nombre: { es: "Milanesa", pt: "Milanesa", en: "Breaded cutlet" },
    detalle: { es: "Con huevo / Napolitana", pt: "Com ovos / À napolitana", en: "With fried eggs / Napolitana" },
    filas: [{ id: "PLATO 2A", et: POLLO, precio: "12000" }, { id: "PLATO 2B", et: CARNE, precio: "14000" }] },
  { sec: "platos", img: "p3.webp", nombre: { es: "Marinera con puré", pt: "Marinera com purê", en: "Marinera w/ mashed potatoes" },
    detalle: { es: "De carne", pt: "De carne", en: "Battered beef" },
    filas: [{ id: "PLATO 3", precio: "14000" }] },
  { sec: "platos", img: "p4.webp", nombre: { es: "Estofado con pastas", pt: "Macarrão com molho de carne", en: "Pasta w/ meat stew" },
    filas: [{ id: "PLATO 4", precio: "12000" }] },
  { sec: "platos", img: "p5.webp", nombre: { es: "Ensaladas", pt: "Saladas", en: "Salads" },
    filas: [{ id: "PLATO 5", precio: "4000" }] },
  { sec: "alpaso", img: "p6.webp", nombre: { es: "Sándwich de milanesa", pt: "Sanduíche de milanesa", en: "Breaded cutlet sandwich" },
    filas: [{ id: "PLATO 6A", et: POLLO, precio: "8000" }, { id: "PLATO 6B", et: CARNE, precio: "10000" }] },
  { sec: "alpaso", img: "p7.webp", nombre: { es: "Empanadas", pt: "Empanadas", en: "Empanadas" },
    detalle: { es: "Carne / Pescado / Pollo / Jamón y queso", pt: "Carne / Peixe / Frango / Presunto e queijo", en: "Beef / Fish / Chicken / Ham & cheese" },
    filas: [{ id: "PLATO 7A", et: { es: "Docena", pt: "Dúzia", en: "Dozen" }, precio: "18000" },
            { id: "PLATO 7B", et: { es: "Unidad", pt: "Unidade", en: "Each" }, precio: "1800" }] },
  { sec: "alpaso", img: "p8.webp", nombre: { es: "Papas fritas", pt: "Batatas fritas", en: "French fries" },
    filas: [{ id: "PLATO 8", precio: "4000" }] },
  { sec: "alpaso", img: "p9.webp", nombre: { es: "Hamburguesa", pt: "Hambúrguer", en: "Burger" },
    filas: [{ id: "PLATO 9A", et: { es: "Simple", pt: "Simples", en: "Simple" }, precio: "15000" },
            { id: "PLATO 9B", et: { es: "Completa", pt: "Completo", en: "Loaded" }, precio: "15000" }] },
  // Sin foto: van como lista al final
  { sec: "extras", nombre: { es: "Pizzas", pt: "Pizzas", en: "Pizzas" },
    filas: [{ id: "Extra. 1A", et: { es: "Muzarela", pt: "Muçarela", en: "Mozzarella" }, precio: "15000" },
            { id: "Extra. 1B", et: { es: "Jamón y muzarela", pt: "Presunto e muçarela", en: "Ham & mozzarella" }, precio: "15000" }] },
  { sec: "extras", nombre: { es: "Porción de arroz", pt: "Porção de arroz", en: "Portion of rice" },
    filas: [{ id: "Extra. 2", precio: "40000" }] },
  { sec: "extras", nombre: { es: "Parrilla", pt: "Churrasco / Grelhados", en: "Mixed grill" },
    filas: [{ id: "Extra. 3", precio: "18000" }] },
  { sec: "extras", nombre: { es: "Bebidas frías", pt: "Bebidas geladas", en: "Cold drinks" },
    filas: [{ id: "Extra. 4", precio: "" }] }
];
