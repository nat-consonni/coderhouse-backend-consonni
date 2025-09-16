const socket = io();

const listEl = document.getElementById("list");
const render = (products) => {
  if (!Array.isArray(products)) return;
  listEl.innerHTML = products.map(p => `
    <article class="card">
      <h3>${p.title}</h3>
      <p>${p.description || ""}</p>
      <p><b>$${p.price}</b> | Stock: ${p.stock}</p>
      <small>code: ${p.code} · id: ${p.id}</small>
    </article>
  `).join("");
};

socket.on("products:list", render);
socket.on("products:error", (msg) => alert("Error: " + msg));

const createForm = document.getElementById("createForm");
createForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(createForm);
  const payload = {
    title: data.get("title"),
    description: data.get("description"),
    code: data.get("code"),
    price: Number(data.get("price")),
    status: data.get("status") === "on",
    stock: Number(data.get("stock")),
    category: data.get("category"),
    thumbnails: data.get("thumbnail") ? [data.get("thumbnail")] : []
  };
  socket.emit("product:create", payload);
  createForm.reset();
});

const deleteForm = document.getElementById("deleteForm");
deleteForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = new FormData(deleteForm).get("id");
  socket.emit("product:delete", id);
  deleteForm.reset();
});