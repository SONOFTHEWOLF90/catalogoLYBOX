let products = [];
let editando = -1;

const tabla = document.getElementById("tablaProductos");
const modal = document.getElementById("modal");
const form = document.getElementById("formProducto");

// Inputs
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

// =========================================
// BOTONES
// =========================================

document.getElementById("btnNuevo").onclick = () => {
  editando = -1;
  form.reset();
  imagenSeleccionada = null;

  preview.classList.add("hidden");
  preview.removeAttribute("src");

  dropContent.classList.remove("hidden");
  imageName.textContent = "";

  modal.classList.remove("hidden");
};

document.getElementById("cerrarModal").onclick = () => {
  modal.classList.add("hidden");
};

// =========================================
// CARGAR PRODUCTOS
// =========================================

async function cargarProductos() {
  const response = await fetch("../data/products.json");
  products = await response.json();
  renderTabla();
}

// =========================================
// TABLA
// =========================================

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

// =========================================
// IMÁGENES
// =========================================

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Renombrar automáticamente cuando cambie el nombre
nameInput.addEventListener("input", () => {

  if (!imagenSeleccionada) return;

  const nombre = `${slugify(nameInput.value || "producto")}.webp`;

  imageInput.value = `images/products/${nombre}`;
  imageName.textContent = `Se guardará como: ${nombre}`;

});

// Convertir a WebP optimizado
async function convertirAWebP(file) {

  return new Promise((resolve) => {

    const img = new Image();

    img.onload = () => {

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const MAX = 1200;

      let { width, height } = img;

      if (width > height) {

        if (width > MAX) {
          height *= MAX / width;
          width = MAX;
        }

      } else {

        if (height > MAX) {
          width *= MAX / height;
          height = MAX;
        }

      }

      canvas.width = Math.round(width);
      canvas.height = Math.round(height);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        blob => resolve(blob),
        "image/webp",
        0.82
      );

    };

    img.src = URL.createObjectURL(file);

  });

}

// Procesar imagen
async function procesarImagen(file) {

  const blobWebP = await convertirAWebP(file);

  const nombre = `${slugify(nameInput.value || "producto")}.webp`;

  imagenSeleccionada = new File(
    [blobWebP],
    nombre,
    { type: "image/webp" }
  );

  imageInput.value = `images/products/${nombre}`;
  imageName.textContent = `Se guardará como: ${nombre}`;

  preview.src = URL.createObjectURL(imagenSeleccionada);
  preview.classList.remove("hidden");
  dropContent.classList.add("hidden");

}

// Drag & Drop
dropZone.addEventListener("click", () => imageFile.click());

imageFile.addEventListener("change", async e => {
  if (e.target.files[0]) {
    await procesarImagen(e.target.files[0]);
  }
});

["dragenter","dragover"].forEach(evento => {

  dropZone.addEventListener(evento,e=>{

    e.preventDefault();
    dropZone.classList.add("dragover");

  });

});

["dragleave","drop"].forEach(evento => {

  dropZone.addEventListener(evento,e=>{

    e.preventDefault();
    dropZone.classList.remove("dragover");

  });

});

dropZone.addEventListener("drop", async e => {

  const file = e.dataTransfer.files[0];

  if (file) await procesarImagen(file);

});

// =========================================
// GUARDAR PRODUCTO
// =========================================

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
    features: featuresInput.value.split("\n").map(f=>f.trim()).filter(Boolean),
    sizes: sizesInput.value.split(",").map(s=>s.trim()).filter(Boolean),
    colors: colorsInput.value.split(",").map(c=>c.trim()).filter(Boolean)

  };

  if(editando>=0){

    products[editando]=nuevoProducto;
    editando=-1;

  }else{

    products.push(nuevoProducto);

  }

  renderTabla();

  modal.classList.add("hidden");

});

// =========================================
// EDITAR
// =========================================

window.editarProducto=function(index){

  editando=index;

  const p=products[index];

  skuInput.value=p.sku;
  brandInput.value=p.brand;
  nameInput.value=p.name;
  categoryInput.value=p.category;
  priceInput.value=p.price;
  stockInput.value=p.stock;
  imageInput.value=p.image;
  descriptionInput.value=p.description;
  sizesInput.value=(p.sizes||[]).join(",");
  colorsInput.value=(p.colors||[]).join(",");
  featuresInput.value=(p.features||[]).join("\n");

  imagenSeleccionada=null;

  preview.src=p.image;
  preview.classList.remove("hidden");

  dropContent.classList.add("hidden");
  imageName.textContent=p.image.split("/").pop();

  modal.classList.remove("hidden");

};

// =========================================
// ELIMINAR
// =========================================

window.eliminarProducto=function(index){

  if(confirm(`¿Eliminar "${products[index].name}"?`)){

    products.splice(index,1);
    renderTabla();

  }

};

// =========================================
// PUBLICAR CATÁLOGO
// =========================================

document
.getElementById("publicarGitHub")
.addEventListener("click",publicarCatalogo);

async function publicarCatalogo(){

  try{

    if(imagenSeleccionada){

      const nombre=imageInput.value.split("/").pop();

      const base64=await archivoABase64(imagenSeleccionada);

      await subirGitHub(
        `images/products/${nombre}`,
        base64,
        `Agregar imagen ${nombre}`
      );

    }

    const json=btoa(
      unescape(
        encodeURIComponent(JSON.stringify(products,null,2))
      )
    );

    await subirGitHub(
      "data/products.json",
      json,
      "Actualizar catálogo LYBOX"
    );

    imagenSeleccionada=null;

    alert("✅ Catálogo publicado correctamente.");

  }catch(error){

    console.error(error);
    alert("Error al publicar: "+error.message);

  }

}

async function subirGitHub(path,content,message){

  const r=await fetch("/.netlify/functions/github-upload",{

    method:"POST",

    headers:{
      "Content-Type":"application/json"
    },

    body:JSON.stringify({
      path,
      content,
      message
    })

  });

  const json=await r.json();

  if(!json.ok){

    throw new Error(json.error);

  }

}

function archivoABase64(file){

  return new Promise(resolve=>{

    const reader=new FileReader();

    reader.onload=()=>resolve(reader.result.split(",")[1]);

    reader.readAsDataURL(file);

  });

}

// =========================================
// INICIAR
// =========================================

cargarProductos();