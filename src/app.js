import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { engine } from "express-handlebars";
import dotenv from "dotenv";

import productsRouter from "./routes/products.router.js";
import cartsRouter from "./routes/carts.router.js";
import viewsRouter from "./routes/views.router.js";

import { setIO } from "./sockets/io.js";
import { ProductModel } from "./models/product.model.js";
import { connectMongo } from "./db/mongo.js";

dotenv.config();

// ---------------------------------------------
// Paths base
// ---------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------
// App + HTTP + Socket.IO
// ---------------------------------------------
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);
setIO(io);

const PORT = process.env.PORT ?? 8080;

// ---------------------------------------------
// Handlebars (vistas dentro de src/views)
// ---------------------------------------------
app.engine(
  "handlebars",
  engine({
    helpers: {
      // helper simple para comparaciones en las vistas
      eq: (a, b) => String(a) === String(b),
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", path.resolve(__dirname, "./views"));

// ---------------------------------------------
// Archivos estáticos (src/public)
// ---------------------------------------------
app.use(express.static(path.resolve(__dirname, "./public")));

// ---------------------------------------------
// Middlewares base
// ---------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------
// Routers API
// ---------------------------------------------
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

// ---------------------------------------------
// Vistas: home / products / realtime / carts
// ---------------------------------------------
app.use("/", viewsRouter);

// Healthcheck simple
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------------------------------------------
// Error handler simple
// ---------------------------------------------
app.use((err, _req, res, _next) => {
  res.status(500).json({
    status: "error",
    error: err.message || "Internal Server Error",
  });
});

// ---------------------------------------------
// Socket.IO: eventos de productos en tiempo real
// (para la vista /realtimeproducts)
// ---------------------------------------------
io.on("connection", async (socket) => {
  try {
    // Envío lista inicial al conectar (desde Mongo)
    const products = await ProductModel.find().lean();
    socket.emit("products:list", products);
  } catch (e) {
    socket.emit("products:error", e.message);
  }

  // Crear producto desde WS
  socket.on("product:create", async (payload) => {
    try {
      await ProductModel.create(payload);
      const list = await ProductModel.find().lean();
      io.emit("products:list", list); // broadcast
    } catch (e) {
      socket.emit("products:error", e.message);
    }
  });

  // Eliminar producto desde WS
  socket.on("product:delete", async (id) => {
    try {
      await ProductModel.findByIdAndDelete(id);
      const list = await ProductModel.find().lean();
      io.emit("products:list", list); // broadcast
    } catch (e) {
      socket.emit("products:error", e.message);
    }
  });
});

// ---------------------------------------------
// Conexión a Mongo y arranque del servidor
// ---------------------------------------------
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

(async () => {
  try {
    await connectMongo(MONGO_URI);
    httpServer.listen(PORT, () => {
      console.log(`✅ Server + Socket.IO en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ No se pudo iniciar la app:", err.message);
    process.exit(1);
  }
})();

export { io };
