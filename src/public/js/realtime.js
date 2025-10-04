const socket = io();

// ------------ helpers ------------
const isObjectId = (v) => /^[a-f\d]{24}$/i.test(String(v || '').trim());
const $ = (sel) => document.querySelector(sel);

// ------------ render listado ------------
const listEl = $('#list');
function render(products = []) {
  if (!Array.isArray(products)) return;
  listEl.innerHTML = products.map(p => `
    <article class="card">
      <h3>${p.title ?? ''}</h3>
      <p>${p.description ?? ''}</p>
      <p><b>$${p.price ?? 0}</b> | Stock: ${p.stock ?? 0}</p>
      <small>code: ${p.code ?? ''} · id: <code>${p._id ?? ''}</code></small><br/>
      <button class="btn-delete-card" data-id="${p._id ?? ''}">Eliminar</button>
    </article>
  `).join('');
}

// eventos que manda el servidor
socket.on('products:list', render);
socket.on('products:error', (msg) => alert('Error: ' + msg));

// ------------ crear producto (form) ------------
const createForm = $('#createForm');
createForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(createForm);

  const payload = {
    title: (data.get('title') ?? '').trim(),
    description: (data.get('description') ?? '').trim(),
    code: (data.get('code') ?? '').trim(),
    price: Number(data.get('price')),
    status: data.get('status') === 'on',            // checkbox
    stock: Number(data.get('stock')),
    category: (data.get('category') ?? '').trim(),
    thumbnails: data.get('thumbnail') ? [String(data.get('thumbnail'))] : []
  };

  // validaciones mínimas para evitar “producto vacío”
  if (!payload.title || !payload.description || !payload.code || !payload.category
      || Number.isNaN(payload.price) || Number.isNaN(payload.stock)) {
    return alert('Completá título, descripción, code, categoría, precio y stock (numéricos).');
  }

  socket.emit('product:create', payload);
  createForm.reset();
});

// ------------ eliminar producto por ID (form) ------------
const deleteForm = $('#deleteForm');
deleteForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = String(new FormData(deleteForm).get('id') ?? '').trim();
  if (!isObjectId(id)) return alert('Ingresá un _id válido de Mongo (24 chars hex).');
  socket.emit('product:delete', id);
  deleteForm.reset();
});

// ------------ eliminar desde el botón de cada card ------------
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-delete-card');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!isObjectId(id)) return alert('ID inválido.');
  socket.emit('product:delete', id);
});
