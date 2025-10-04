import { Router } from "express";
import { CartModel } from "../models/cart.model.js";
import { ProductModel } from "../models/product.model.js";

const router = Router();

// Crear carrito
router.post("/", async (_req, res) => {
  const cart = await CartModel.create({ products: [] });
  res.status(201).json({ status: "success", payload: cart });
});

// Obtener productos de un carrito (populate)
router.get("/:cid", async (req, res) => {
  const cart = await CartModel.findById(req.params.cid).populate("products.product").lean();
  if (!cart) return res.status(404).json({ status: "error", error: "Cart not found" });
  res.json({ status: "success", payload: cart.products });
});

// Agregar/incrementar producto
router.post("/:cid/product/:pid", async (req, res) => {
  const { cid, pid } = req.params;
  const quantity = Math.max(parseInt(req.body?.quantity) || 1, 1);

  const product = await ProductModel.findById(pid);
  if (!product) return res.status(400).json({ status: "error", error: "Product does not exist" });

  const cart = await CartModel.findById(cid);
  if (!cart) return res.status(404).json({ status: "error", error: "Cart not found" });

  const idx = cart.products.findIndex(p => String(p.product) === String(pid));
  if (idx === -1) cart.products.push({ product: pid, quantity });
  else cart.products[idx].quantity += quantity;

  await cart.save();
  const populated = await cart.populate("products.product");
  res.status(201).json({ status: "success", payload: populated });
});

// NUEVO: eliminar 1 producto del carrito
router.delete("/:cid/products/:pid", async (req, res) => {
  const cart = await CartModel.findById(req.params.cid);
  if (!cart) return res.status(404).json({ status: "error", error: "Cart not found" });
  cart.products = cart.products.filter(p => String(p.product) !== String(req.params.pid));
  await cart.save();
  res.json({ status: "success", payload: { removed: req.params.pid } });
});

// NUEVO: actualizar TODOS los productos del carrito (reemplazo)
router.put("/:cid", async (req, res) => {
  const items = Array.isArray(req.body?.products) ? req.body.products : [];
  // validación básica: {product: <id>, quantity: <n>}
  for (const it of items) {
    if (!it.product || !await ProductModel.exists({ _id: it.product })) {
      return res.status(400).json({ status: "error", error: "Producto inexistente en payload" });
    }
    it.quantity = Math.max(parseInt(it.quantity) || 1, 1);
  }
  const cart = await CartModel.findByIdAndUpdate(
    req.params.cid,
    { products: items },
    { new: true }
  ).populate("products.product").lean();
  if (!cart) return res.status(404).json({ status: "error", error: "Cart not found" });
  res.json({ status: "success", payload: cart });
});

// NUEVO: actualizar SOLO la cantidad de un producto
router.put("/:cid/products/:pid", async (req, res) => {
  const qty = Math.max(parseInt(req.body?.quantity) || 1, 1);
  const cart = await CartModel.findById(req.params.cid);
  if (!cart) return res.status(404).json({ status: "error", error: "Cart not found" });
  const item = cart.products.find(p => String(p.product) === String(req.params.pid));
  if (!item) return res.status(404).json({ status: "error", error: "Product not in cart" });
  item.quantity = qty;
  await cart.save();
  const populated = await cart.populate("products.product");
  res.json({ status: "success", payload: populated });
});

// NUEVO: vaciar carrito
router.delete("/:cid", async (req, res) => {
  const cart = await CartModel.findByIdAndUpdate(req.params.cid, { products: [] }, { new: true }).lean();
  if (!cart) return res.status(404).json({ status: "error", error: "Cart not found" });
  res.json({ status: "success", payload: cart });
});

export default router;
