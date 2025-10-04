// Entrega Final: Productos con MongoDB + filtros, orden y paginación.
// y emite por Socket.IO cuando se crean/actualizan/eliminan productos.

import { Router } from "express";
import { getIO } from "../sockets/io.js";
import { ProductModel } from "../models/product.model.js";

const router = Router();

/* -------------------------------------------
 * Helpers
 * ------------------------------------------*/
const parseBool = (v) => {
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (s === "true") return true;
  if (s === "false") return false;
  return undefined;
};

const buildLink = (req, page) => {
  if (!page) return null;
  const url = new URL(`${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`);
  const params = new URLSearchParams(req.query);
  params.set("page", String(page));
  url.search = params.toString();
  return url.toString();
};

/* -------------------------------------------
 * GET /api/products
 * - limit: number (default 10)
 * - page:  number (default 1)
 * - sort:  "asc" | "desc"  (por precio)
 * - query: si viene "status:true/false" o "category:<valor>"
 *          si viene un valor simple, se interpreta como category
 * - También aceptamos directamente ?category=... y/o ?status=true|false
 * Devuelve el objeto con paginación requerido por la consigna.
 * ------------------------------------------*/
router.get("/", async (req, res) => {
  try {
    const {
      limit: limitRaw = "10",
      page: pageRaw = "1",
      sort: sortRaw,
      query,
      category: categoryRaw,
      status: statusRaw,
    } = req.query;

    const limit = Math.max(parseInt(limitRaw, 10) || 10, 1);
    let page = Math.max(parseInt(pageRaw, 10) || 1, 1);

    // Filtro
    const filter = {};
    // Preferimos params explícitos
    const statusParsed = parseBool(statusRaw);
    if (statusParsed !== undefined) filter.status = statusParsed;
    if (categoryRaw) filter.category = String(categoryRaw);

    // Soporte del "query" genérico pedido en la consigna
    if (query && !categoryRaw && statusParsed === undefined) {
      const q = String(query);
      if (q.startsWith("status:")) {
        const v = q.split(":")[1];
        const b = parseBool(v);
        if (b !== undefined) filter.status = b;
      } else if (q.startsWith("category:")) {
        filter.category = q.split(":")[1];
      } else {
        // si viene un valor simple, lo tratamos como categoría
        filter.category = q;
      }
    }

    // Orden (por precio)
    let sort = undefined;
    if (sortRaw === "asc") sort = { price: 1 };
    if (sortRaw === "desc") sort = { price: -1 };

    // Conteo total y cálculo de páginas
    const total = await ProductModel.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    if (page > totalPages) page = totalPages;

    const skip = (page - 1) * limit;

    const docs = await ProductModel.find(filter)
      .sort(sort ?? {})
      .skip(skip)
      .limit(limit)
      .lean();

    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;
    const prevPage = hasPrevPage ? page - 1 : null;
    const nextPage = hasNextPage ? page + 1 : null;

    res.json({
      status: "success",
      payload: docs,
      totalPages,
      prevPage,
      nextPage,
      page,
      hasPrevPage,
      hasNextPage,
      prevLink: buildLink(req, prevPage),
      nextLink: buildLink(req, nextPage),
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/* -------------------------------------------
 * GET /api/products/:pid
 * ------------------------------------------*/
router.get("/:pid", async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.pid).lean();
    if (!product) {
      return res.status(404).json({ status: "error", error: "Product not found" });
    }
    res.json({ status: "success", payload: product });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/* -------------------------------------------
 * POST /api/products
 * ------------------------------------------*/
router.post("/", async (req, res) => {
  try {
    const created = await ProductModel.create(req.body);

    // Emitir lista actualizada a todos los clientes (vista realtime)
    const io = getIO();
    if (io) {
      const list = await ProductModel.find().lean();
      io.emit("products:list", list);
    }

    res.status(201).json({ status: "success", payload: created });
  } catch (err) {
    // Mongoose validation error -> 400
    const code = err.name === "ValidationError" ? 400 : 500;
    res.status(code).json({ status: "error", error: err.message });
  }
});

/* -------------------------------------------
 * PUT /api/products/:pid
 *  - No permitir cambiar _id
 * ------------------------------------------*/
router.put("/:pid", async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;

    const updated = await ProductModel.findByIdAndUpdate(
      req.params.pid,
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ status: "error", error: "Product not found" });
    }

    const io = getIO();
    if (io) {
      const list = await ProductModel.find().lean();
      io.emit("products:list", list);
    }

    res.json({ status: "success", payload: updated });
  } catch (err) {
    const code = err.name === "ValidationError" ? 400 : 500;
    res.status(code).json({ status: "error", error: err.message });
  }
});

/* -------------------------------------------
 * DELETE /api/products/:pid
 * ------------------------------------------*/
router.delete("/:pid", async (req, res) => {
  try {
    const deleted = await ProductModel.findByIdAndDelete(req.params.pid).lean();
    if (!deleted) {
      return res.status(404).json({ status: "error", error: "Product not found" });
    }

    const io = getIO();
    if (io) {
      const list = await ProductModel.find().lean();
      io.emit("products:list", list);
    }

    res.json({ status: "success", payload: { deleted: req.params.pid } });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

export default router;
