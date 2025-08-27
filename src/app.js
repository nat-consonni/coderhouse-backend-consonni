// Entrega 1 - servidor en Node + Express (puerto 8080)

import express from "express";
import productsRouter from "./routes/products.router.js";
import cartsRouter from "./routes/carts.router.js";

const app = express();
const PORT = 8080; // Entrega 1: Servidor Node + Express en puerto 8080 (requisito)

//
// Middlewares base
//
app.use(express.json()); // Entrega 1: usar expresss.json para parsear JSON del body (sí, así de simple)
app.use(express.urlencoded({ extended: true })); // por si mando formularios simples

//
// Rutas de la API (dos grupos: products y carts)
//
app.use("/api/products", productsRouter); // CRUD de productos (GET/GET:id/POST/PUT/DELETE)
app.use("/api/carts", cartsRouter);       // carritos (POST crear, GET por id, POST agregar producto)

//
// Healthcheck chiquito para ver si está vivo
//
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Coderhouse Entrega 1 API running" });
});

//
// 404 “amable”: si me piden algo que no existe
//
app.use((req, res, _next) => {
  return res.status(404).json({ status: "error", error: "Ruta no encontrada" });
});

//
// Manejo de errores general (por si algo se me escapa en los try/catch)
// ojo: en producción no conviene exponer detalles
//
app.use((err, _req, res, _next) => {
  console.error("[app error]", err?.message || err);
  res.status(500).json({
    status: "error",
    error: err?.message || "Error interno del servidor"
  });
});

//
// Levanto el server (puerto 8080 porque la consigna lo pide así)
//
app.listen(PORT, () => {
  console.log(`Server listening en http://localhost:${PORT}`);
});
