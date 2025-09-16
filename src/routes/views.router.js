import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { ProductManager } from "../managers/ProductManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../../data/products.json");

const router = Router();
const pm = new ProductManager(DATA_PATH);

// home: lista “estática” (se renderiza en el server)
router.get("/", async (_req, res) => {
  const products = await pm.getAll();
  res.render("home", { title: "Home", products });
});

// realtimeproducts: lista viva por websockets
router.get("/realtimeproducts", async (_req, res) => {
  // puedo pasar algo inicial, pero el socket la reemplaza al conectar
  const products = await pm.getAll();
  res.render("realTimeProducts", { title: "Tiempo Real", products });
});

export default router;