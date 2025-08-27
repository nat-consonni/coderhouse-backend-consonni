
// Carga productos de ejemplo en products.json para poder probar la API.

import { ProductManager } from "../managers/ProductManager.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivo donde persisten los productos
const DATA_PATH = path.resolve(__dirname, "../../data/products.json");

const pm = new ProductManager(DATA_PATH);

// Productos de prueba (para no empezar con la base vacía)
const demo = [
  {
    title: "Silla Divino",
    description: "Silla de madera",
    code: "CHA-001",
    price: 120,
    status: true,
    stock: 15,
    category: "chairs",
    thumbnails: []
  },
  {
    title: "Mesa Punta",
    description: "Mesa ratona",
    code: "TAB-101",
    price: 280,
    status: true,
    stock: 7,
    category: "tables",
    thumbnails: []
  }
];

for (const p of demo) {
  try {
    await pm.create(p);
    console.log(`Producto agregado: ${p.title}`);
  } catch (e) {
    console.warn(`No se pudo agregar ${p.title}: ${e.message}`);
  }
}

console.log("Seed finalizado");
