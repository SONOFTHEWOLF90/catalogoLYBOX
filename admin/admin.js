let products = [];
let editando = -1;

const GITHUB_OWNER = "SONOFTHEWOLF90";
const GITHUB_REPO = "catalogoLYBOX";
const GITHUB_BRANCH = "main";

const tabla = document.getElementById("tablaProductos");
const modal = document.getElementById("modal");
const form = document.getElementById("formProducto");

// Referencias de los inputs
const skuInput = document.getElementById("sku");
const brandInput = document.getElementById("brand");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("category");
const priceInput = document.getElementById("price");
const stockInput = document.getElementById("stock");
const imageInput = document.getElementById("image");
const descriptionInput = document.getElementById("description");
const sizesInput = document.getElementById("sizes");
const colorsInput = document.getElementById("colors");
const featuresInput = document.getElementById("features");

const dropZone = document.getElementById("dropZone");
const imageFile = document.getElementById("imageFile");
const preview = document.getElementById("preview");
const imageName = document.getElementById("imageName");
const dropContent = document.getElementById("dropContent");

let imagenSeleccionada = null;

// ---------- Botones ----------

document.getElementById("btnNuevo").onclick = () => {
  editando = -1;
  form.reset();
  preview.classList.add("hidden");
  dropContent.classList.remove("hidden");
  imageName.textContent = "";
  modal.classList.remove("hidden");
};

document.getElementById("cerrarModal").onclick = () => {
  modal.classList.add("hidden");
};

// ---------- Cargar productos ----------

async function cargarProductos() {
  const response = await fetch("../data/products.json");
  products = await response.json();
  renderTabla();
}

// ---------- Tabla ----------

function estadoTexto(stock) {
  switch (stock) {
    case "available":
      return "Disponible";
    case "low":
      return "Poco stock";
    case "soldout":
      return "Agotado";
    default:
      return stock;
  }
}

function renderTabla() {
  tabla.innerHTML = "";

  products.forEach((product, index) => {
    tabla.innerHTML += `
      <tr>
        <td>${product.sku}</td>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>S/ ${product.price}</td>
        <td>${estadoTexto(product.stock)}</td>
        <td class="acciones">
          <button class="editar" onclick="editarProducto(${index})">✏️</button>
          <button class="eliminar" onclick="eliminarProducto(${index})">🗑️</button>
        </td>
      </tr>
    `;
  });
}

// ---------- Imagen ----------

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function procesarImagen(file) {
  imagenSeleccionada = file;

  const nombre = slugify(nameInput.value || "producto") + ".webp";

  imageInput.value = `images/products/${nombre}`;
  imageName.textContent = `Se guardará como: ${nombre}`;

  preview.src = URL.createObjectURL(file);
  preview.classList.remove("hidden");
  dropContent.classList.add("hidden");
}

dropZone.addEventListener("click", () => imageFile.click());

imageFile.addEventListener("change", (e) => {
  if (e.target.files[0]) procesarImagen(e.target.files[0]);
});

["dragenter", "dragover"].forEach(evento => {
  dropZone.addEventListener(evento, e => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach(evento => {
  dropZone.addEventListener(evento, e => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
  });
});

dropZone.addEventListener("drop", e => {
  const file = e.dataTransfer.files[0];
  if (file) procesarImagen(file);
});

// ---------- Guardar producto ----------

form.addEventListener("submit", e => {
  e.preventDefault();

  const nuevoProducto = {
    id: editando >= 0 ? products[editando].id : Date.now(),
    sku: skuInput.value,
    name: nameInput.value,
    brand: brandInput.value,
    category: categoryInput.value,
    price: Number(priceInput.value),
    currency: "PEN",
    stock: stockInput.value,
    image: imageInput.value || "images/products/product-placeholder.svg",
    description: descriptionInput.value,
    features: featuresInput.value.split("\n").map(f => f.trim()).filter(Boolean),
    sizes: sizesInput.value.split(",").map(s => s.trim()).filter(Boolean),
    colors: colorsInput.value.split(",").map(c => c.trim()).filter(Boolean)
  };

  if (editando >= 0) {
    products[editando] = nuevoProducto;
    editando = -1;
  } else {
    products.push(nuevoProducto);
  }

  renderTabla();

  form.reset();
  preview.classList.add("hidden");
  dropContent.classList.remove("hidden");
  imageName.textContent = "";
  modal.classList.add("hidden");
});

// ---------- Editar ----------

function editarProducto(index) {
  editando = index;
  const p = products[index];

  skuInput.value = p.sku;
  brandInput.value = p.brand;
  nameInput.value = p.name;
  categoryInput.value = p.category;
  priceInput.value = p.price;
  stockInput.value = p.stock;
  imageInput.value = p.image;
  descriptionInput.value = p.description;
  sizesInput.value = p.sizes.join(",");
  colorsInput.value = p.colors.join(",");
  featuresInput.value = p.features.join("\n");

  preview.src = p.image;
  preview.classList.remove("hidden");
  dropContent.classList.add("hidden");
  imageName.textContent = p.image.split("/").pop();

  modal.classList.remove("hidden");
}

// ---------- Eliminar ----------

function eliminarProducto(index) {
  if (confirm(`¿Eliminar "${products[index].name}"?`)) {
    products.splice(index, 1);
    renderTabla();
  }
}

// ---------- Descargar catálogo ----------

document.getElementById("publicarGitHub").addEventListener("click", publicarGitHub);

async function publicarGitHub(){

  let token = localStorage.getItem("lybox_token");

  if(!token){
    token = prompt("Pega tu GitHub Personal Access Token (solo la primera vez):");
    if(!token) return;
    localStorage.setItem("lybox_token", token);
  }

  try{

    // Subir imágenes nuevas
    for(const [nombre,file] of Object.entries(imagenesLocales)){

      const base64 = await fileToBase64(file);

      await subirArchivoGitHub(
        token,
        `images/products/${nombre}`,
        base64,
        `Agregar imagen ${nombre}`
      );

    }

    // Actualizar products.json
    const contenido = btoa(
      unescape(
        encodeURIComponent(JSON.stringify(products,null,2))
      )
    );

    await subirArchivoGitHub(
      token,
      "data/products.json",
      contenido,
      "Actualizar catálogo LYBOX"
    );

    alert("✅ Catálogo publicado correctamente.");

  }catch(err){

    console.error(err);
    alert("Error al publicar.");

  }

}

async function subirArchivoGitHub(token,ruta,contenido,mensaje){

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${ruta}`;

  let sha = null;

  const actual = await fetch(url,{
    headers:{
      Authorization:`Bearer ${token}`,
      Accept:"application/vnd.github+json"
    }
  });

  if(actual.ok){
    const json = await actual.json();
    sha = json.sha;
  }

  const body = {
    message:mensaje,
    content:contenido,
    branch:GITHUB_BRANCH
  };

  if(sha) body.sha = sha;

  const respuesta = await fetch(url,{
    method:"PUT",
    headers:{
      Authorization:`Bearer ${token}`,
      Accept:"application/vnd.github+json"
    },
    body:JSON.stringify(body)
  });

  if(!respuesta.ok){
    throw new Error(await respuesta.text());
  }

}

function fileToBase64(file){

  return new Promise((resolve,reject)=>{

    const reader = new FileReader();

    reader.onload = ()=>{

      resolve(reader.result.split(",")[1]);

    };

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });

}

cargarProductos();