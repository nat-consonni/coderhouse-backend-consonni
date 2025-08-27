// Rutas de carritos (Entrega 1)

import { Router } from "express";
import { CartManager } from "../managers/CartManager.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARTS_PATH = path.resolve(__dirname, "../../data/carts.json");
const PRODUCTS_PATH = path.resolve(__dirname, "../../data/products.json");

const router = Router();
const cm = new CartManager(CARTS_PATH, PRODUCTS_PATH);

// Entrega 1: POST /api/carts → crea carrito { id auto, products: [] }
router.post("/", async (_req, res) => {
  try {
    const cart = await cm.createCart();
    res.status(201).json({ status: "success", payload: cart });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Entrega 1: GET /api/carts/:cid → devuelve los products del carrito
router.get("/:cid", async (req, res) => {
  try {
    const cart = await cm.getCartById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ status: "error", error: "Cart not found" }); // 404 si no existe
    }
    res.json({ status: "success", payload: cart.products });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Entrega 1: POST /api/carts/:cid/product/:pid → agrega o incrementa quantity
router.post("/:cid/product/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity = 1 } = req.body || {};
    const cart = await cm.addProductToCart(cid, pid, quantity);
    res.status(201).json({ status: "success", payload: cart });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", error: err.message });
  }
});

export default router;
