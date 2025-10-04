# Coderhouse - Proyecto Final Backend

**Autora:** Natalia Consonni  
**Comisión:** Backend Node.js - Coderhouse  
**Año:** 2025  

---

## Descripción

Este proyecto implementa el backend completo de una aplicación de e-commerce desarrollada con **Node.js**, **Express**, **MongoDB** y **Mongoose**, integrando vistas dinámicas con **Handlebars** y actualización en tiempo real mediante **Socket.IO**.

Incluye:
- CRUD de **productos** con filtros, paginación y orden dinámico.
- Gestión de **carritos de compra** con referencias a productos (populate).
- Persistencia principal en **MongoDB**.
- Vistas renderizadas con **Handlebars**.
- WebSockets para visualización de productos en tiempo real.

---

## Tecnologías principales

| Tecnología | Uso |
|-------------|-----|
| Node.js | Entorno de ejecución |
| Express | Framework backend |
| MongoDB + Mongoose | Base de datos y ODM |
| Handlebars | Motor de plantillas |
| Socket.IO | Comunicación en tiempo real |
| mongoose-paginate-v2 | Paginación de productos |
| dotenv | Variables de entorno |

---

## Instalación y ejecución

### 1. Clonar el repositorio

git clone https://github.com/nat-consonni/coderhouse-backend-consonni.git
cd coderhouse-backend-consonni

---

### 2. Instalar dependencias
npm install

---

### 3. Crear el archivo .env
Crear un archivo .env en la raíz del proyecto con la siguiente configuración:

PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/coderhouse

---

### 4. Iniciar el servidor

npm run dev

El servidor estará disponible en:
👉 http://localhost:8080


## Rutas principales

### API de Productos

| Método | Endpoint | Descripción |
|-------------|-----|
| GET | /api/products | Listado con paginación, filtros y orden |
| GET | /api/products/:pid | Obtener producto por ID |
| POST | /api/products | Crear producto |
| PUT | /api/products/:pid | Actualizar producto |
| DELETE | /api/products/:pid | Eliminar producto |

### Query params disponibles
?limit=10&page=1&sort=asc&query=category:chairs

### Vistas Handlebars

| Vistas | Ruta | Descripción |
|-------------|-----|
| Home | / | Redirección a /products |
| Productos | /products | Lista paginada de productos |
| Detalle de producto | /products/:pid | Información completa + botón “Agregar al carrito” |
| Carrito | /carts/:cid | Visualización de los productos del carrito |
| Realtime | /realtimeproducts | Creación y eliminación en tiempo real por WebSockets |

### WebSockets (Tiempo real)
La lista /realtimeproducts permite:
- Crear nuevos productos desde un formulario.
- Eliminar productos por _id.
- Ver actualizaciones automáticas sin recargar la página.

### Validaciones implementadas
- Campos obligatorios en productos: title, description, code, price, stock, category.
- Validación de códigos únicos (code).
- Validación de ObjectId en operaciones con carritos.
- Manejo centralizado de errores HTTP y errores de Mongoose.

## Comentarios finales
Este proyecto fue desarrollado durante el curso Backend Node.js (Coderhouse), aplicando buenas prácticas de arquitectura, modularización y persistencia de datos en MongoDB.