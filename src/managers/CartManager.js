// Manager de Carritos (Entrega 1): persistencia en archivo JSON.
// id de carrito con UUID. Al agregar productos, si ya existe, sumo quantity.
// También valido que el producto exista en products.json (sino, ni lo agrego).

import { readJson, writeJson } from "../utils/fileDb.js";
import { randomUUID } from "crypto";

export class CartManager {
  constructor(path, productPath) {
    this.path = path;           // carts.json
    this.productPath = productPath; // products.json (para validar existencia del producto)
  }

  async #readCarts() {
    return await readJson(this.path);
  }

  async #writeCarts(carts) {
    await writeJson(this.path, carts);
  }

  // Verifico si el producto existe en la “tabla” de productos
  async #productExists(pid) {
    const products = await readJson(this.productPath);
    return products.some(p => String(p.id) === String(pid));
  }

  // Entrega 1: crear carrito vacío { id, products: [] }
  async createCart() {
    const carts = await this.#readCarts();
    const newCart = { id: randomUUID(), products: [] };
    carts.push(newCart);
    await this.#writeCarts(carts);
    return newCart;
  }

  // Entrega 1: traer carrito por id (si no existe, devuelvo null y el router se encarga)
  async getCartById(cid) {
    const carts = await this.#readCarts();
    return carts.find(c => String(c.id) === String(cid)) || null;
  }

  // Entrega 1: agregar producto al carrito (o incrementar quantity si ya estaba)
  async addProductToCart(cid, pid, quantity = 1) {
    const carts = await this.#readCarts();

    const cartIdx = carts.findIndex(c => String(c.id) === String(cid));
    if (cartIdx === -1) {
      const err = new Error("Cart not found");
      err.status = 404;
      throw err;
    }

    // El producto debe existir en products.json
    const exists = await this.#productExists(pid);
    if (!exists) {
      const err = new Error("Product does not exist");
      err.status = 400;
      throw err;
    }

    // normalizo quantity (si me mandan algo raro, cae a 1)
    const qty = Number(quantity);
    const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;

    const cart = carts[cartIdx];
    const prodIdx = cart.products.findIndex(p => String(p.product) === String(pid));

    if (prodIdx === -1) {
      cart.products.push({ product: String(pid), quantity: safeQty });
    } else {
      cart.products[prodIdx].quantity += safeQty;
    }

    carts[cartIdx] = cart;
    await this.#writeCarts(carts);
    return cart;
  }
}
