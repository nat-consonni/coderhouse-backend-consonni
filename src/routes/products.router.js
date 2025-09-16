// Rutas de productos (Entrega 1 + Entrega 2 con emits a Socket.IO)
// Nota: los IDs de producto los genero como UUID en el manager (no autoincremental).

import { getIO } from "../sockets/io.js"; // Entrega 2: emitir actualización cuando el cambio viene por HTTP
import { Router } from "express";
import { ProductManager } from "../managers/ProductManager.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../../data/products.json");

const router = Router();
const pm = new ProductManager(DATA_PATH);

// Entrega 1: GET /api/products → devolver array completo
router.get("/", async (_req, res) => {
  try {
    const products = await pm.getAll();
    res.status(200).json({ status: "success", payload: products });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Entrega 1: GET /api/products/:pid → devolver solo el producto del id
router.get("/:pid", async (req, res) => {
  try {
    const product = await pm.getById(req.params.pid);
    if (!product) {
      return res.status(404).json({ status: "error", error: "Product not found" }); // 404 si no existe
    }
    res.json({ status: "success", payload: product });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Entrega 1: POST /api/products → crea producto (id autogenerado en el manager)
// Entrega 2: emitir "products:list" para refrescar la vista en tiempo real
router.post("/", async (req, res) => {
  try {
    const created = await pm.create(req.body);

    // Emitir lista actualizada a todos los clientes conectados
    const io = getIO();
    if (io) {
      const list = await pm.getAll();
      io.emit("products:list", list);
    }

    res.status(201).json({ status: "success", payload: created });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", error: err.message });
  }
});

// Entrega 1: PUT /api/products/:pid → actualiza campos (no se permite cambiar el id)
// Entrega 2: emitir "products:list" para refrescar en tiempo real
router.put("/:pid", async (req, res) => {
  try {
    const updated = await pm.update(req.params.pid, req.body);

    const io = getIO();
    if (io) {
      const list = await pm.getAll();
      io.emit("products:list", list);
    }

    res.json({ status: "success", payload: updated });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", error: err.message });
  }
});

// Entrega 1: DELETE /api/products/:pid → eliminar por id
// Entrega 2: emitir "products:list" para refrescar en tiempo real
router.delete("/:pid", async (req, res) => {
  try {
    const result = await pm.remove(req.params.pid);

    const io = getIO();
    if (io) {
      const list = await pm.getAll();
      io.emit("products:list", list);
    }

    res.json({ status: "success", payload: result });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", error: err.message });
  }
});

export default router;
