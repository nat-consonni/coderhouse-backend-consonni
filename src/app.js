// src/app.js
import express from "express";
import productsRouter from "./routes/products.router.js";
import cartsRouter from "./routes/carts.router.js";
import viewsRouter from "./routes/views.router.js";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { engine } from "express-handlebars";
import { setIO } from "./sockets/io.js";
import { ProductManager } from "./managers/ProductManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);            // necesario para socket.io
const io = new SocketIOServer(httpServer);
setIO(io);                                       // dejo io disponible para routers/servicios

const PORT = 8080;

// ---- Handlebars (vistas dentro de src/views) ----
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.resolve(__dirname, "./views"));

// ---- Archivos estáticos (src/public) ----
app.use(express.static(path.resolve(__dirname, "./public")));

// ---- Middlewares base ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Routers API ----
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

// ---- Vistas: home + realtime ----
app.use("/", viewsRouter);

// ---- Health ----
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---- Error handler simple ----
app.use((err, _req, res, _next) => {
  res.status(500).json({ status: "error", error: err.message || "Internal Server Error" });
});

// ---- Socket.IO: eventos de productos en tiempo real ----
const pm = new ProductManager(path.resolve(__dirname, "../data/products.json"));

io.on("connection", async (socket) => {
  // Envío lista inicial al conectar
  const products = await pm.getAll();
  socket.emit("products:list", products);

  // Crear producto desde WS
  socket.on("product:create", async (payload) => {
    try {
      await pm.create(payload);
      const list = await pm.getAll();
      io.emit("products:list", list); // broadcast
    } catch (e) {
      socket.emit("products:error", e.message);
    }
  });

  // Eliminar producto desde WS
  socket.on("product:delete", async (id) => {
    try {
      await pm.remove(id);
      const list = await pm.getAll();
      io.emit("products:list", list); // broadcast
    } catch (e) {
      socket.emit("products:error", e.message);
    }
  });
});

// ---- Levanto el server HTTP (no app.listen directo) ----
httpServer.listen(PORT, () => {
  console.log(`Server + Socket.IO en http://localhost:${PORT}`);
});

export { io };
