let products = [];
let editando = -1;
let imagenesSeleccionadas = [];
let indiceArrastrado = null;

// =========================================
// ELEMENTOS
// =========================================

const tabla = document.getElementById("tablaProductos");
const modal = document.getElementById("modal");
const form = document.getElementById("formProducto");

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

// =========================================
// NUEVO PRODUCTO
// =========================================

document.getElementById("btnNuevo").addEventListener("click", function () {
    editando = -1;
    imagenesSeleccionadas = [];
    indiceArrastrado = null;

    form.reset();

    imageInput.value = "";
    imageName.textContent = "";

    preview.classList.add("hidden");
    preview.removeAttribute("src");

    dropContent.classList.remove("hidden");

    limpiarGaleriaPrevia();

    modal.classList.remove("hidden");
});

// =========================================
// CERRAR MODAL
// =========================================

document.getElementById("cerrarModal").addEventListener("click", function () {
    modal.classList.add("hidden");
});

// =========================================
// CARGAR PRODUCTOS
// =========================================

async function cargarProductos() {
    try {
        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("No se pudieron cargar los productos.");
        }

        products = await response.json();

        renderTabla();

    } catch (error) {
        console.error(error);
        alert("Error cargando productos: " + error.message);
    }
}

// =========================================
// ESTADO
// =========================================

function estadoTexto(stock) {
    if (stock === "available") {
        return "Disponible";
    }

    if (stock === "low") {
        return "Poco stock";
    }

    if (stock === "soldout") {
        return "Agotado";
    }

    return stock || "";
}

// =========================================
// TABLA
// =========================================

function renderTabla() {
    tabla.innerHTML = "";

    products.forEach(function (product, index) {
        tabla.innerHTML += `
            <tr>
                <td>${product.sku || ""}</td>
                <td>${product.name || ""}</td>
                <td>${product.category || ""}</td>
                <td>S/ ${Number(product.price || 0).toFixed(2)}</td>
                <td>${estadoTexto(product.stock)}</td>

                <td class="acciones">
                    <button
                        type="button"
                        class="editar"
                        onclick="editarProducto(${index})">
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="eliminar"
                        onclick="eliminarProducto(${index})">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    });
}

// =========================================
// CREAR NOMBRE DE ARCHIVO
// =========================================

function slugify(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// =========================================
// CONVERTIR IMAGEN A WEBP
// =========================================

function convertirAWebP(file) {
    return new Promise(function (resolve, reject) {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = function () {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            const MAX = 1200;

            let width = img.width;
            let height = img.height;

            if (width > MAX || height > MAX) {
                const factor = Math.min(
                    MAX / width,
                    MAX / height
                );

                width = width * factor;
                height = height * factor;
            }

            canvas.width = Math.round(width);
            canvas.height = Math.round(height);

            ctx.drawImage(
                img,
                0,
                0,
                canvas.width,
                canvas.height
            );

            canvas.toBlob(
                function (blob) {
                    URL.revokeObjectURL(objectUrl);

                    if (!blob) {
                        reject(
                            new Error("No se pudo convertir la imagen.")
                        );
                        return;
                    }

                    resolve(blob);
                },
                "image/webp",
                0.82
            );
        };

        img.onerror = function () {
            URL.revokeObjectURL(objectUrl);
            reject(
                new Error("No se pudo leer la imagen.")
            );
        };

        img.src = objectUrl;
    });
}

// =========================================
// PROCESAR IMÁGENES
// =========================================

async function procesarImagenes(files) {
    if (!files.length) {
        return;
    }

    imagenesSeleccionadas = [];

    const nombreBase = slugify(
        nameInput.value || "producto"
    );

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const blob = await convertirAWebP(file);

        let nombre;

        if (i === 0) {
            nombre = nombreBase + ".webp";
        } else {
            nombre = nombreBase + "-" + (i + 1) + ".webp";
        }

        const webpFile = new File(
            [blob],
            nombre,
            {
                type: "image/webp"
            }
        );

        imagenesSeleccionadas.push(webpFile);
    }

    mostrarGaleriaPrevia();
    actualizarImagenPrincipal();
}

// =========================================
// MOSTRAR GALERÍA
// =========================================

function limpiarGaleriaPrevia() {
    const galeria = document.getElementById(
        "adminGalleryPreview"
    );

    if (galeria) {
        galeria.remove();
    }
}

function mostrarGaleriaPrevia() {
    limpiarGaleriaPrevia();

    if (!imagenesSeleccionadas.length) {
        return;
    }

    const galeria = document.createElement("div");

    galeria.id = "adminGalleryPreview";

    galeria.style.display = "grid";
    galeria.style.gridTemplateColumns =
        "repeat(auto-fill, minmax(130px, 1fr))";
    galeria.style.gap = "12px";
    galeria.style.marginTop = "15px";

    imagenesSeleccionadas.forEach(function (file, index) {

        const item = document.createElement("div");

        item.style.background = "#111";
        item.style.borderRadius = "10px";
        item.style.padding = "6px";
        item.style.border =
            index === 0
                ? "2px solid #e30613"
                : "2px solid #333";

        const img = document.createElement("img");

        img.src = URL.createObjectURL(file);

        img.style.width = "100%";
        img.style.height = "120px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "7px";

        const label = document.createElement("div");

        label.textContent =
            index === 0
                ? "⭐ PRINCIPAL"
                : "Imagen " + (index + 1);

        label.style.textAlign = "center";
        label.style.fontSize = "12px";
        label.style.fontWeight = "bold";
        label.style.marginTop = "5px";

        label.style.color =
            index === 0
                ? "#e30613"
                : "#aaa";

        const controles =
            document.createElement("div");

        controles.style.display = "flex";
        controles.style.justifyContent =
            "center";
        controles.style.gap = "6px";
        controles.style.marginTop = "6px";

        // BOTÓN IZQUIERDA

        const btnIzquierda =
            document.createElement("button");

        btnIzquierda.type = "button";
        btnIzquierda.textContent = "←";

        btnIzquierda.style.padding = "5px 10px";

        btnIzquierda.disabled =
            index === 0;

        btnIzquierda.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (index === 0) {
                    return;
                }

                const temporal =
                    imagenesSeleccionadas[index - 1];

                imagenesSeleccionadas[index - 1] =
                    imagenesSeleccionadas[index];

                imagenesSeleccionadas[index] =
                    temporal;

                mostrarGaleriaPrevia();

                actualizarImagenPrincipal();
            }
        );

        // BOTÓN DERECHA

        const btnDerecha =
            document.createElement("button");

        btnDerecha.type = "button";
        btnDerecha.textContent = "→";

        btnDerecha.style.padding = "5px 10px";

        btnDerecha.disabled =
            index === imagenesSeleccionadas.length - 1;

        btnDerecha.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (
                    index ===
                    imagenesSeleccionadas.length - 1
                ) {
                    return;
                }

                const temporal =
                    imagenesSeleccionadas[index + 1];

                imagenesSeleccionadas[index + 1] =
                    imagenesSeleccionadas[index];

                imagenesSeleccionadas[index] =
                    temporal;

                mostrarGaleriaPrevia();

                actualizarImagenPrincipal();
            }
        );

        controles.appendChild(
            btnIzquierda
        );

        controles.appendChild(
            btnDerecha
        );

        item.appendChild(img);
        item.appendChild(label);
        item.appendChild(controles);

        galeria.appendChild(item);
    });

    dropZone.appendChild(galeria);

    imageName.textContent =
        imagenesSeleccionadas.length +
        " imagen(es) seleccionada(s)";
}

// =========================================
// ACTUALIZAR IMAGEN PRINCIPAL
// =========================================

function actualizarImagenPrincipal() {
    if (!imagenesSeleccionadas.length) {
        imageInput.value = "";
        return;
    }

    const primera = imagenesSeleccionadas[0];

    imageInput.value =
        "images/products/" + primera.name;

    const url = URL.createObjectURL(primera);

    preview.src = url;
    preview.classList.remove("hidden");

    dropContent.classList.add("hidden");
}

// =========================================
// SELECCIONAR ARCHIVOS
// =========================================

dropZone.addEventListener("click", function () {
    imageFile.click();
});

imageFile.addEventListener("change", async function (event) {
    const files = Array.from(event.target.files);

    if (!files.length) {
        return;
    }

    try {
        await procesarImagenes(files);
    } catch (error) {
        console.error(error);

        alert(
            "Error procesando imágenes: " +
            error.message
        );
    }

    imageFile.value = "";
});

// =========================================
// DRAG & DROP DESDE WINDOWS
// =========================================

dropZone.addEventListener(
    "dragenter",
    function (event) {
        event.preventDefault();
        dropZone.classList.add("dragover");
    }
);

dropZone.addEventListener(
    "dragover",
    function (event) {
        event.preventDefault();
        dropZone.classList.add("dragover");
    }
);

dropZone.addEventListener(
    "dragleave",
    function (event) {
        event.preventDefault();
        dropZone.classList.remove("dragover");
    }
);

dropZone.addEventListener(
    "drop",
    async function (event) {
        event.preventDefault();

        dropZone.classList.remove("dragover");

        const files = Array.from(
            event.dataTransfer.files
        ).filter(function (file) {
            return file.type.startsWith("image/");
        });

        if (!files.length) {
            return;
        }

        try {
            await procesarImagenes(files);
        } catch (error) {
            console.error(error);

            alert(
                "Error procesando imágenes: " +
                error.message
            );
        }
    }
);

// =========================================
// GUARDAR IMAGEN
// =========================================

async function subirImagen(file) {
    const arrayBuffer = await file.arrayBuffer();

    const bytes = new Uint8Array(arrayBuffer);

    const base64 = uint8ArrayToBase64(bytes);

    const response = await fetch(
        "/api/image",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                filename: file.name,
                data: base64
            })
        }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
        throw new Error(
            result.error ||
            "No se pudo guardar la imagen."
        );
    }

    return result.path;
}

// =========================================
// ARRAY → BASE64
// =========================================

function uint8ArrayToBase64(bytes) {
    let binary = "";

    const chunkSize = 0x8000;

    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {
        const chunk = bytes.subarray(
            i,
            i + chunkSize
        );

        binary += String.fromCharCode(
            ...chunk
        );
    }

    return btoa(binary);
}

// =========================================
// GUARDAR PRODUCTS.JSON
// =========================================

async function guardarProductos() {
    const response = await fetch(
        "/api/products",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(products)
        }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
        throw new Error(
            result.error ||
            "No se pudo guardar products.json."
        );
    }
}

// =========================================
// OBTENER NUEVO ID
// =========================================

function obtenerNuevoId() {
    if (!products.length) {
        return 1;
    }

    let mayor = 0;

    products.forEach(function (product) {
        const id = Number(product.id) || 0;

        if (id > mayor) {
            mayor = id;
        }
    });

    return mayor + 1;
}

// =========================================
// GUARDAR PRODUCTO
// =========================================

form.addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();

        try {
            const nombre =
                nameInput.value.trim();

            if (!nombre) {
                alert(
                    "Ingresa el nombre del producto."
                );
                return;
            }

            let imagePaths = [];

            // -------------------------------------
            // NUEVAS IMÁGENES
            // -------------------------------------

            if (imagenesSeleccionadas.length) {
                for (
                    let i = 0;
                    i < imagenesSeleccionadas.length;
                    i++
                ) {
                    const path =
                        await subirImagen(
                            imagenesSeleccionadas[i]
                        );

                    imagePaths.push(path);
                }
            }

            // -------------------------------------
            // SI EDITAMOS Y NO CAMBIAMOS FOTOS
            // -------------------------------------

            if (
                !imagenesSeleccionadas.length &&
                editando >= 0
            ) {
                const productoActual =
                    products[editando];

                if (
                    productoActual.images &&
                    productoActual.images.length
                ) {
                    imagePaths =
                        productoActual.images.slice();
                } else if (
                    productoActual.image
                ) {
                    imagePaths = [
                        productoActual.image
                    ];
                }
            }

            // -------------------------------------
            // PRODUCTO
            // -------------------------------------

            const nuevoProducto = {
                id:
                    editando >= 0
                        ? products[editando].id
                        : obtenerNuevoId(),

                sku:
                    skuInput.value.trim(),

                name:
                    nombre,

                brand:
                    brandInput.value.trim(),

                category:
                    categoryInput.value,

                price:
                    Number(priceInput.value),

                currency:
                    "PEN",

                stock:
                    stockInput.value,

                image:
                    imagePaths.length
                        ? imagePaths[0]
                        : "images/products/product-placeholder.svg",

                images:
                    imagePaths,

                description:
                    descriptionInput.value.trim(),

                features:
                    featuresInput.value
                        .split("\n")
                        .map(function (item) {
                            return item.trim();
                        })
                        .filter(function (item) {
                            return item.length > 0;
                        }),

                sizes:
                    sizesInput.value
                        .split(",")
                        .map(function (item) {
                            return item.trim();
                        })
                        .filter(function (item) {
                            return item.length > 0;
                        }),

                colors:
                    colorsInput.value
                        .split(",")
                        .map(function (item) {
                            return item.trim();
                        })
                        .filter(function (item) {
                            return item.length > 0;
                        })
            };

            // -------------------------------------
            // ACTUALIZAR O AGREGAR
            // -------------------------------------

            if (editando >= 0) {
                products[editando] =
                    nuevoProducto;
            } else {
                products.push(
                    nuevoProducto
                );
            }

            // -------------------------------------
            // GUARDAR JSON
            // -------------------------------------

            await guardarProductos();

            renderTabla();

            modal.classList.add("hidden");

            imagenesSeleccionadas = [];
            indiceArrastrado = null;

            limpiarGaleriaPrevia();

            alert(
                "✅ Producto guardado correctamente."
            );

        } catch (error) {
            console.error(error);

            alert(
                "❌ Error guardando producto:\n" +
                error.message
            );
        }
    }
);

// =========================================
// EDITAR PRODUCTO
// =========================================

window.editarProducto = function (index) {
    editando = index;

    const product = products[index];

    skuInput.value =
        product.sku || "";

    brandInput.value =
        product.brand || "";

    nameInput.value =
        product.name || "";

    categoryInput.value =
        product.category || "";

    priceInput.value =
        product.price || "";

    stockInput.value =
        product.stock || "available";

    imageInput.value =
        product.image || "";

    descriptionInput.value =
        product.description || "";

    sizesInput.value =
        (product.sizes || []).join(",");

    colorsInput.value =
        (product.colors || []).join(",");

    featuresInput.value =
        (product.features || []).join("\n");

    imagenesSeleccionadas = [];
    indiceArrastrado = null;

    limpiarGaleriaPrevia();

    const imagenesActuales =
        product.images &&
        product.images.length
            ? product.images
            : product.image
                ? [product.image]
                : [];

    if (imagenesActuales.length) {
        preview.src =
            imagenesActuales[0];

        preview.classList.remove(
            "hidden"
        );

        dropContent.classList.add(
            "hidden"
        );

        imageName.textContent =
            imagenesActuales.length +
            " imagen(es) actuales";
    } else {
        preview.classList.add(
            "hidden"
        );

        dropContent.classList.remove(
            "hidden"
        );

        imageName.textContent = "";
    }

    modal.classList.remove(
        "hidden"
    );
};

// =========================================
// ELIMINAR PRODUCTO
// =========================================

window.eliminarProducto = async function (index) {
    const product = products[index];

    const confirmar = confirm(
        '¿Eliminar "' +
        product.name +
        '"?'
    );

    if (!confirmar) {
        return;
    }

    products.splice(index, 1);

    try {
        await guardarProductos();

        renderTabla();

        alert(
            "🗑️ Producto eliminado."
        );

    } catch (error) {
        console.error(error);

        alert(
            "Error eliminando producto: " +
            error.message
        );
    }
};

// =========================================
// BOTÓN PUBLICAR
// =========================================

// =========================================
// PUBLICAR CATÁLOGO
// =========================================

const botonPublicar =
    document.getElementById("publicarGitHub");

botonPublicar.addEventListener(
    "click",
    async function () {

        const confirmar = confirm(
            "¿Quieres publicar ahora el catálogo LYBOX en GitHub?"
        );

        if (!confirmar) {
            return;
        }

        const textoOriginal =
            botonPublicar.textContent;

        botonPublicar.disabled = true;
        botonPublicar.textContent =
            "⏳ Publicando...";

        try {

            const response =
                await fetch("/api/publish", {
                    method: "POST"
                });

            const result =
                await response.json();

            if (!response.ok || !result.ok) {

                throw new Error(
                    result.error ||
                    "No se pudo publicar el catálogo."
                );
            }

            alert(
                "🎉 ¡Catálogo publicado correctamente!\n\n" +
                "Los cambios ya fueron enviados a GitHub.\n\n" +
                "GitHub Pages actualizará la página automáticamente."
            );

        } catch (error) {

            console.error(error);

            alert(
                "❌ Error al publicar el catálogo:\n\n" +
                error.message
            );

        } finally {

            botonPublicar.disabled = false;

            botonPublicar.textContent =
                textoOriginal;
        }
    }
);
// =========================================
// INICIAR
// =========================================

cargarProductos();