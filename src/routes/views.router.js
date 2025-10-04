import { Router } from "express";
import { ProductModel } from "../models/product.model.js"; // mongoose
import { CartModel } from "../models/cart.model.js";
import { Types } from "mongoose";

const router = Router();

// /products → lista con filtros + paginación
router.get("/products", async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      sort,
      category,
      status
    } = req.query;

    const query = {};
    if (category) query.category = category;
    if (status === "true" || status === "false") query.status = status === "true";

    const sortOpt = {};
    if (sort === "asc") sortOpt.price = 1;
    if (sort === "desc") sortOpt.price = -1;

    const result = await ProductModel.paginate(query, {
      limit: Number(limit) || 10,
      page: Number(page) || 1,
      sort: Object.keys(sortOpt).length ? sortOpt : undefined,
      lean: true
    });

    const base = "/products";
    const buildLink = (p) => {
      const sp = new URLSearchParams({ ...req.query, page: String(p) });
      return `${base}?${sp.toString()}`;
    };

    res.render("home", {
      title: "Productos",
      products: result.docs,
      query: { limit, sort, category, status },
      pagination: {
        totalPages: result.totalPages,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.hasPrevPage ? buildLink(result.prevPage) : null,
        nextLink: result.hasNextPage ? buildLink(result.nextPage) : null,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Detalle de producto
router.get("/products/:pid", async (req, res) => {
  try {
    const { pid } = req.params;
    if (!Types.ObjectId.isValid(pid)) return res.status(404).render("home", { title: "Productos", products: [] });
    const product = await ProductModel.findById(pid).lean();
    if (!product) return res.status(404).render("home", { title: "Productos", products: [] });
    res.render("productDetail", { title: product.title, product });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Vista realtime (WebSockets)
router.get("/realtimeproducts", async (_req, res) => {
  const products = await ProductModel.find().lean();
  res.render("realTimeProducts", { title: "Tiempo Real", products });
});

// Vista de carrito
router.get("/carts/:cid", async (req, res) => {
  const { cid } = req.params;
  res.render("cartDetail", { title: `Carrito ${cid}`, cid });
});

export default router;
