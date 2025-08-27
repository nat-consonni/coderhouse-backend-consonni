// Mini helper para leer/escribir JSON en disco usando fs.promises.

import { promises as fs } from "fs";

/**
 * Lee un archivo JSON. Si no existe, lo crea vacío ("[]") y devuelve [].
 * Ojo: por simplicidad asumo que todos los “tablas” son arrays (products, carts).
 * Si algún día guardo objetos, puedo agregar una variante o un default distinto.
 */
export async function readJson(path) {
  try {
    const data = await fs.readFile(path, "utf-8");
    // Si está vacío por algún motivo, devuelvo [] para no romper los managers.
    return JSON.parse(data || "[]");
  } catch (err) {
    // Caso típico: primer arranque, el archivo no existe aún.
    if (err.code === "ENOENT") {
      await fs.writeFile(path, "[]"); // lo creo vacío
      return [];
    }
    // Si es otro error, lo dejo subir para que el caller decida.
    throw err;
  }
}

/**
 * Escribe un array como JSON “lindo” (indentado) para poder mirar el archivo
 * a ojo cuando estoy probando con Postman.
 */
export async function writeJson(path, data) {
  const json = JSON.stringify(data, null, 2); // 2 espacios = legible
  await fs.writeFile(path, json, "utf-8");
}

// Entrega 1: persistencia en archivos (products.json, carts.json)