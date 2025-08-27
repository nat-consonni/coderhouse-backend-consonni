// Manager de Productos (Entrega 1): CRUD en archivo JSON.

import { readJson, writeJson } from "../utils/fileDb.js";
import { randomUUID } from "crypto";

export class ProductManager {
  constructor(path) {
    this.path = path; // ruta al products.json
  }

  // Leer todos (simple y sin vueltas)
  async getAll() {
    return await readJson(this.path);
  }

  // Traer uno por id (si no existe, devuelvo null y el router responde 404)
  async getById(id) {
    const products = await this.getAll();
    return products.find(p => String(p.id) === String(id)) || null;
  }

  // Crear producto nuevo
  async create({
    title,
    description,
    code,
    price,
    status = true,
    stock,
    category,
    thumbnails = []
  }) {
    // Campos obligatorios (la consigna lo pide)
    if (!title || !description || !code || price == null || stock == null || !category) {
      const err = new Error("Faltan campos obligatorios");
      err.status = 400;
      throw err;
    }

    const products = await this.getAll();

    // "code" único (si ya existe, corto acá)
    if (products.some(p => p.code === code)) {
      const err = new Error("El código de producto ya existe (code debe ser único)");
      err.status = 400;
      throw err;
    }

    const newProduct = {
      id: randomUUID(), // autogenerado para no repetir nunca
      title,
      description,
      code,
      price: Number(price),
      status: Boolean(status),
      stock: Number(stock),
      category,
      thumbnails: Array.isArray(thumbnails) ? thumbnails : [thumbnails]
    };

    products.push(newProduct);
    await writeJson(this.path, products);

    return newProduct;
  }

  // Actualizar por id (no dejo tocar el id)
  async update(id, updates) {
    const products = await this.getAll();
    const idx = products.findIndex(p => String(p.id) === String(id));

    if (idx === -1) {
      const err = new Error("Producto no encontrado");
      err.status = 404;
      throw err;
    }

    // No se actualiza el id (requisito)
    if ("id" in updates) delete updates.id;

    // Si quieren cambiar "code", verifico que no choque con otro
    if (
      updates.code &&
      products.some(p => p.code === updates.code && String(p.id) !== String(id))
    ) {
      const err = new Error("El código de producto ya existe (code debe ser único)");
      err.status = 400;
      throw err;
    }

    // Merge con normalización de tipos
    const updated = { ...products[idx], ...updates };
    if ("price" in updates) updated.price = Number(updates.price);
    if ("stock" in updates) updated.stock = Number(updates.stock);
    if ("status" in updates) updated.status = Boolean(updates.status);
    if ("thumbnails" in updates) {
      updated.thumbnails = Array.isArray(updates.thumbnails)
        ? updates.thumbnails
        : [updates.thumbnails];
    }

    products[idx] = updated;
    await writeJson(this.path, products);

    return updated;
  }

  // Eliminar por id (devuelvo un mini resumen para confirmar)
  async remove(id) {
    const products = await this.getAll();
    const exists = products.some(p => String(p.id) === String(id));
    if (!exists) {
      const err = new Error("Producto no encontrado");
      err.status = 404;
      throw err;
    }

    const filtered = products.filter(p => String(p.id) !== String(id));
    await writeJson(this.path, filtered);

    return { deleted: id };
  }
}
