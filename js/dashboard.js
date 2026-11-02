"use strict";

const CONFIGURACION_INICIAL = {
    nombre: "Oasis Aromático",
    nit: "",
    direccion: "",
    telefono: "",
    correo: "",
    moneda: "COP",
    stockMinimo: 5,
};

function obtenerConfiguracion() {
    return {
        ...CONFIGURACION_INICIAL,
        ...leerAlmacenamiento("oasis-configuracion", {}),
    };
}

function configurarMenu() {
    const menuBtn = document.querySelector(".menu-btn");
    const sidebar = document.querySelector(".sidebar");

    if (!menuBtn || !sidebar) return;

    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("activa");
    });
}

function formatearMoneda(valor) {
    const moneda = obtenerConfiguracion().moneda;
    return Number(valor).toLocaleString("es-CO", {
        style: "currency",
        currency: moneda,
        maximumFractionDigits: 0,
    });
}

function estadoStock(cantidad) {
    return Number(cantidad) <= Number(obtenerConfiguracion().stockMinimo)
        ? "Stock bajo"
        : "Disponible";
}

const CLAVE_PRODUCTOS = "oasis-tablaProductos";
const CLAVE_INVENTARIO = "oasis-tablaInventario";
const CLAVE_VENTAS = "oasis-tablaVentas";

const PRODUCTOS_INICIALES = [
    ["Versace Eros", "Versace", "Original", "15", formatearMoneda(250000)],
    ["212 VIP", "Carolina Herrera", "Réplica", "20", formatearMoneda(90000)],
    ["One Million", "Paco Rabanne", "Original", "10", formatearMoneda(300000)],
];

const VENTAS_INICIALES = [
    ["Versace Eros", "2", formatearMoneda(250000), formatearMoneda(500000)],
    ["212 VIP", "1", formatearMoneda(90000), formatearMoneda(90000)],
];

const CLIENTES_INICIALES = [
    ["Natalia Palacio", "natalia@gmail.com", "3001234567"],
    ["Juan Pérez", "juan@gmail.com", "3019876543"],
];

function leerAlmacenamiento(clave, valorInicial = []) {
    try {
        return JSON.parse(localStorage.getItem(clave)) || valorInicial;
    } catch {
        return valorInicial;
    }
}

function numeroMoneda(valor) {
    return Number(String(valor).replace(/\D/g, "")) || 0;
}

function obtenerProductos() {
    return leerAlmacenamiento(CLAVE_PRODUCTOS, PRODUCTOS_INICIALES);
}

function sincronizarInventario(productos = obtenerProductos()) {
    const inventario = productos.map(([nombre, , , cantidad]) => [
        nombre,
        cantidad,
        estadoStock(cantidad),
    ]);
    localStorage.setItem(CLAVE_INVENTARIO, JSON.stringify(inventario));
}

function ajustarStockPorVenta(ventaNueva, ventaAnterior = null) {
    const productos = obtenerProductos().map((producto) => [...producto]);

    if (ventaAnterior) {
        const anterior = productos.find((producto) => producto[0] === ventaAnterior[0]);
        if (anterior) anterior[3] = String(Number(anterior[3]) + Number(ventaAnterior[1]));
    }

    const producto = productos.find((item) => item[0] === ventaNueva[0]);
    const cantidad = Number(ventaNueva[1]);

    if (!producto) {
        alert("El producto seleccionado ya no existe");
        return false;
    }

    if (Number(producto[3]) < cantidad) {
        alert(`Stock insuficiente. Solo hay ${producto[3]} unidades disponibles.`);
        return false;
    }

    producto[3] = String(Number(producto[3]) - cantidad);
    localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(productos));
    sincronizarInventario(productos);
    return true;
}

function devolverStockDeVenta(venta) {
    const productos = obtenerProductos().map((producto) => [...producto]);
    const producto = productos.find((item) => item[0] === venta[0]);

    if (!producto) return;

    producto[3] = String(Number(producto[3]) + Number(venta[1]));
    localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(productos));
    sincronizarInventario(productos);
}

function leerFilasIniciales(tabla) {
    return [...tabla.querySelectorAll("tr")].map((fila) =>
        [...fila.querySelectorAll("td")].map((celda) => celda.textContent.trim()),
    );
}

function crearBoton(texto, clase, alHacerClick) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = clase;
    boton.textContent = texto;
    boton.addEventListener("click", alHacerClick);
    return boton;
}

function configurarCrud(configuracion) {
    const form = document.getElementById(configuracion.formId);
    const tabla = document.getElementById(configuracion.tablaId);

    if (!form || !tabla) return;

    const controles = [...form.querySelectorAll("input:not([readonly]), select")];
    const botonGuardar = form.querySelector('button[type="submit"]');
    const clave = `oasis-${configuracion.tablaId}`;
    let indiceEditando = null;
    let registros;

    const iniciales = configuracion.valorInicial || leerFilasIniciales(tabla);
    registros = leerAlmacenamiento(clave, iniciales);

    const encabezado = tabla.closest("table")?.querySelector("thead tr");
    if (encabezado && !encabezado.querySelector(".columna-acciones")) {
        const th = document.createElement("th");
        th.className = "columna-acciones";
        th.textContent = "Acciones";
        encabezado.appendChild(th);
    }

    function guardar() {
        localStorage.setItem(clave, JSON.stringify(registros));
    }

    function renderizar() {
        tabla.replaceChildren();

        registros.forEach((registro, indice) => {
            const fila = document.createElement("tr");

            registro.forEach((valor) => {
                const celda = document.createElement("td");
                celda.textContent = valor;
                fila.appendChild(celda);
            });

            const acciones = document.createElement("td");
            acciones.className = "acciones-tabla";
            acciones.append(
                crearBoton("Editar", "boton-editar", () => editar(indice)),
                crearBoton("Eliminar", "boton-eliminar", () => eliminar(indice)),
            );
            fila.appendChild(acciones);
            tabla.appendChild(fila);
        });
    }

    function editar(indice) {
        indiceEditando = indice;
        const valores = configuracion.aFormulario(registros[indice]);

        controles.forEach((control, posicion) => {
            control.value = valores[posicion] ?? "";
        });

        if (botonGuardar) botonGuardar.textContent = "Actualizar registro";
        form.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function eliminar(indice) {
        if (!window.confirm("¿Deseas eliminar este registro?")) return;

        configuracion.antesDeEliminar?.(registros[indice]);
        registros.splice(indice, 1);
        guardar();
        configuracion.alCambiar?.(registros);
        renderizar();

        if (indiceEditando === indice) {
            indiceEditando = null;
            form.reset();
            if (botonGuardar) botonGuardar.textContent = configuracion.textoGuardar;
        }
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const valores = controles.map((control) => control.value.trim());

        if (valores.some((valor) => !valor || valor === "Seleccionar perfume")) {
            alert("Completa todos los campos");
            return;
        }

        const registro = configuracion.aFila(valores);
        const registroAnterior = indiceEditando === null ? null : registros[indiceEditando];

        if (configuracion.antesDeGuardar && !configuracion.antesDeGuardar(registro, registroAnterior)) {
            return;
        }

        if (indiceEditando === null) {
            registros.push(registro);
        } else {
            registros[indiceEditando] = registro;
            indiceEditando = null;
        }

        guardar();
        configuracion.alCambiar?.(registros);
        renderizar();
        form.reset();
        if (botonGuardar) botonGuardar.textContent = configuracion.textoGuardar;
    });

    renderizar();
}

function configurarFormularios() {
    configurarCrud({
        formId: "formProductos",
        tablaId: "tablaProductos",
        textoGuardar: "Guardar producto",
        valorInicial: PRODUCTOS_INICIALES,
        aFila: ([nombre, marca, precio, cantidad, tipo]) => [
            nombre,
            marca,
            tipo,
            cantidad,
            formatearMoneda(precio),
        ],
        aFormulario: ([nombre, marca, tipo, cantidad, precio]) => [
            nombre,
            marca,
            precio.replace(/\D/g, ""),
            cantidad,
            tipo,
        ],
        alCambiar: sincronizarInventario,
    });

    configurarCrud({
        formId: "formInventario",
        tablaId: "tablaInventario",
        textoGuardar: "Agregar producto",
        aFila: ([nombre, cantidad]) => [
            nombre,
            cantidad,
            estadoStock(cantidad),
        ],
        aFormulario: ([nombre, cantidad]) => [nombre, cantidad],
    });

    configurarCrud({
        formId: "formProveedores",
        tablaId: "tablaProveedores",
        textoGuardar: "Guardar proveedor",
        aFila: (valores) => valores,
        aFormulario: (valores) => valores,
    });

    configurarCrud({
        formId: "formClientes",
        tablaId: "tablaClientes",
        textoGuardar: "Guardar cliente",
        aFila: (valores) => valores,
        aFormulario: (valores) => valores,
    });

    configurarCrud({
        formId: "formVentas",
        tablaId: "tablaVentas",
        textoGuardar: "Registrar venta",
        valorInicial: VENTAS_INICIALES,
        aFila: ([producto, cantidad, precio]) => [
            producto,
            cantidad,
            formatearMoneda(precio),
            formatearMoneda(Number(cantidad) * Number(precio)),
        ],
        aFormulario: ([producto, cantidad, precio]) => [
            producto,
            cantidad,
            precio.replace(/\D/g, ""),
        ],
        antesDeGuardar: ajustarStockPorVenta,
        antesDeEliminar: devolverStockDeVenta,
    });

}

function configurarConfiguracion() {
    const form = document.getElementById("formConfiguracion");
    if (!form) return;

    const campos = {
        nombre: document.getElementById("configNombre"),
        nit: document.getElementById("configNit"),
        direccion: document.getElementById("configDireccion"),
        telefono: document.getElementById("configTelefono"),
        correo: document.getElementById("configCorreo"),
        moneda: document.getElementById("configMoneda"),
        stockMinimo: document.getElementById("configStockMinimo"),
    };
    const configuracion = obtenerConfiguracion();

    Object.entries(campos).forEach(([clave, campo]) => {
        campo.value = configuracion[clave] ?? "";
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const nuevaConfiguracion = Object.fromEntries(
            Object.entries(campos).map(([clave, campo]) => [clave, campo.value.trim()]),
        );
        nuevaConfiguracion.stockMinimo = Number(nuevaConfiguracion.stockMinimo);

        if (!nuevaConfiguracion.nombre || !nuevaConfiguracion.moneda) {
            alert("Completa el nombre del negocio y la moneda");
            return;
        }

        localStorage.setItem("oasis-configuracion", JSON.stringify(nuevaConfiguracion));

        const productos = obtenerProductos().map((producto) => [
            ...producto.slice(0, 4),
            formatearMoneda(numeroMoneda(producto[4])),
        ]);
        const ventas = leerAlmacenamiento(CLAVE_VENTAS, VENTAS_INICIALES).map((venta) => [
            venta[0],
            venta[1],
            formatearMoneda(numeroMoneda(venta[2])),
            formatearMoneda(numeroMoneda(venta[3])),
        ]);
        localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(productos));
        localStorage.setItem(CLAVE_VENTAS, JSON.stringify(ventas));
        sincronizarInventario();
        aplicarConfiguracion();
        alert("Configuración guardada correctamente");
    });

    document.getElementById("formSeguridad")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const usuario = leerAlmacenamiento("oasisUsuario", null);
        const actual = document.getElementById("passwordActual").value;
        const nueva = document.getElementById("passwordNueva").value;
        const confirmar = document.getElementById("passwordConfirmar").value;

        if (!usuario || usuario.password !== actual) {
            alert("La contraseña actual es incorrecta");
            return;
        }
        if (!nueva || nueva !== confirmar) {
            alert("La nueva contraseña y su confirmación no coinciden");
            return;
        }

        usuario.password = nueva;
        localStorage.setItem("oasisUsuario", JSON.stringify(usuario));
        event.currentTarget.reset();
        alert("Contraseña actualizada correctamente");
    });

    const archivo = document.getElementById("archivoRespaldo");
    document.getElementById("btnExportarDatos")?.addEventListener("click", () => {
        const datos = {};
        for (let indice = 0; indice < localStorage.length; indice += 1) {
            const clave = localStorage.key(indice);
            if (clave?.startsWith("oasis")) datos[clave] = localStorage.getItem(clave);
        }
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(
            new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" }),
        );
        enlace.download = `respaldo-oasis-${new Date().toISOString().slice(0, 10)}.json`;
        enlace.click();
        URL.revokeObjectURL(enlace.href);
    });

    document.getElementById("btnImportarDatos")?.addEventListener("click", () => archivo.click());
    archivo.addEventListener("change", async () => {
        try {
            const datos = JSON.parse(await archivo.files[0].text());
            Object.entries(datos).forEach(([clave, valor]) => {
                if (clave.startsWith("oasis") && typeof valor === "string") {
                    localStorage.setItem(clave, valor);
                }
            });
            alert("Respaldo restaurado correctamente");
            window.location.reload();
        } catch {
            alert("El archivo de respaldo no es válido");
        }
    });

    document.getElementById("btnBorrarDatos")?.addEventListener("click", () => {
        if (!window.confirm("¿Deseas borrar todos los datos? Esta acción no se puede deshacer.")) return;
        Object.keys(localStorage)
            .filter((clave) => clave.startsWith("oasis"))
            .forEach((clave) => localStorage.removeItem(clave));
        alert("Los datos fueron eliminados");
        window.location.href = "../index.html";
    });
}

function aplicarConfiguracion() {
    const configuracion = obtenerConfiguracion();
    document.querySelectorAll(".brand h2").forEach((titulo) => {
        titulo.textContent = configuracion.nombre;
    });

    const nombreReporte = document.getElementById("nombreNegocioReporte");
    const datosReporte = document.getElementById("datosNegocioReporte");
    if (nombreReporte) nombreReporte.textContent = configuracion.nombre;
    if (datosReporte) {
        datosReporte.textContent = [
            configuracion.nit && `NIT: ${configuracion.nit}`,
            configuracion.direccion,
            configuracion.telefono,
            configuracion.correo,
        ]
            .filter(Boolean)
            .join(" · ");
    }
}

function configurarFormularioVentas() {
    const form = document.getElementById("formVentas");
    if (!form) return;

    const selector = form.querySelector("select");
    const [cantidad, precio, total] = form.querySelectorAll("input");
    const productos = obtenerProductos();

    selector.replaceChildren(new Option("Seleccionar perfume", ""));
    productos
        .filter((producto) => Number(producto[3]) > 0)
        .forEach((producto) => selector.add(new Option(producto[0], producto[0])));

    function actualizarValores() {
        const producto = productos.find((item) => item[0] === selector.value);
        if (producto && !precio.value) precio.value = String(numeroMoneda(producto[4]));
        total.value =
            cantidad.value && precio.value
                ? formatearMoneda(Number(cantidad.value) * Number(precio.value))
                : "";
    }

    selector.addEventListener("change", () => {
        precio.value = "";
        actualizarValores();
    });
    cantidad.addEventListener("input", actualizarValores);
    precio.addEventListener("input", actualizarValores);
}

function actualizarDashboard() {
    const tabla = document.getElementById("productosDashboard");
    if (!tabla) return;

    const productos = obtenerProductos();
    const ventas = leerAlmacenamiento(CLAVE_VENTAS, VENTAS_INICIALES);
    const clientes = leerAlmacenamiento("oasis-tablaClientes", CLIENTES_INICIALES);
    const totalVentas = ventas.reduce((total, venta) => total + numeroMoneda(venta[3]), 0);

    document.getElementById("totalVentasDashboard").textContent = formatearMoneda(totalVentas);
    document.getElementById("totalProductosDashboard").textContent = String(productos.length);
    document.getElementById("totalClientesDashboard").textContent = String(clientes.length);
    document.getElementById("stockBajoDashboard").textContent = String(
        productos.filter((producto) => estadoStock(producto[3]) === "Stock bajo").length,
    );

    tabla.replaceChildren();
    productos.slice(-5).reverse().forEach(([nombre, , tipo, cantidad, precio]) => {
        const fila = document.createElement("tr");
        [nombre, tipo, cantidad, precio].forEach((valor) => {
            const celda = document.createElement("td");
            celda.textContent = valor;
            fila.appendChild(celda);
        });
        tabla.appendChild(fila);
    });
}

function configurarReportes() {
    const ventas = leerAlmacenamiento(CLAVE_VENTAS, VENTAS_INICIALES);
    const clientes = leerAlmacenamiento("oasis-tablaClientes", CLIENTES_INICIALES);
    const productos = obtenerProductos();
    const inventario = leerAlmacenamiento(
        CLAVE_INVENTARIO,
        productos.map(([nombre, , , cantidad]) => [
            nombre,
            cantidad,
            estadoStock(cantidad),
        ]),
    );
    const totalVentas = ventas.reduce((total, venta) => total + numeroMoneda(venta[3]), 0);
    const productosVendidos = ventas.reduce((total, venta) => total + Number(venta[1]), 0);

    const ventasReporte = document.getElementById("ventasReporte");
    const clientesReporte = document.getElementById("clientesReporte");
    const productosVendidosReporte = document.getElementById("productosVendidosReporte");

    if (ventasReporte) ventasReporte.textContent = formatearMoneda(totalVentas);
    if (clientesReporte) clientesReporte.textContent = String(clientes.length);
    if (productosVendidosReporte) productosVendidosReporte.textContent = String(productosVendidos);

    const fecha = new Intl.DateTimeFormat("es-CO", {
        dateStyle: "long",
        timeStyle: "short",
    }).format(new Date());
    const fechaReporte = document.getElementById("fechaReporte");
    if (fechaReporte) fechaReporte.textContent = `Generado el ${fecha}`;

    function llenarDetalle(tablaId, registros) {
        const tabla = document.getElementById(tablaId);
        if (!tabla) return;

        tabla.replaceChildren();
        registros.forEach((registro) => {
            const fila = document.createElement("tr");
            registro.forEach((valor) => {
                const celda = document.createElement("td");
                celda.textContent = valor;
                fila.appendChild(celda);
            });
            tabla.appendChild(fila);
        });
    }

    llenarDetalle("ventasDetalleReporte", ventas);
    llenarDetalle("inventarioDetalleReporte", inventario);

    document.getElementById("btnReporte")?.addEventListener("click", () => {
        window.print();
    });

    document.getElementById("btnExcel")?.addEventListener("click", () => {
        const escapar = (valor) =>
            String(valor)
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;");
        const filasHtml = (registros) =>
            registros
                .map(
                    (registro) =>
                        `<tr>${registro.map((valor) => `<td>${escapar(valor)}</td>`).join("")}</tr>`,
                )
                .join("");
        const contenido = `
            <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; color: #222; }
                        h1 { color: #7b3fe4; }
                        h2 { color: #7b3fe4; margin-top: 24px; }
                        table { border-collapse: collapse; width: 100%; }
                        th { background: #7b3fe4; color: white; }
                        th, td { border: 1px solid #ccc; padding: 8px; }
                        .resumen td:first-child { font-weight: bold; background: #f3eefc; }
                    </style>
                </head>
                <body>
                    <h1>Reporte general - ${escapar(obtenerConfiguracion().nombre)}</h1>
                    <p>Generado el ${escapar(fecha)}</p>
                    <h2>Resumen</h2>
                    <table class="resumen">
                        <tr><td>Ventas realizadas</td><td>${escapar(formatearMoneda(totalVentas))}</td></tr>
                        <tr><td>Clientes registrados</td><td>${clientes.length}</td></tr>
                        <tr><td>Productos vendidos</td><td>${productosVendidos}</td></tr>
                        <tr><td>Productos disponibles</td><td>${productos.length}</td></tr>
                    </table>
                    <h2>Ventas</h2>
                    <table>
                        <tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr>
                        ${filasHtml(ventas)}
                    </table>
                    <h2>Inventario</h2>
                    <table>
                        <tr><th>Producto</th><th>Cantidad</th><th>Estado</th></tr>
                        ${filasHtml(inventario)}
                    </table>
                    <h2>Clientes</h2>
                    <table>
                        <tr><th>Nombre</th><th>Correo</th><th>Teléfono</th></tr>
                        ${filasHtml(clientes)}
                    </table>
                </body>
            </html>`;
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(new Blob([contenido], { type: "application/vnd.ms-excel" }));
        enlace.download = `reporte-oasis-${new Date().toISOString().slice(0, 10)}.xls`;
        enlace.click();
        URL.revokeObjectURL(enlace.href);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    configurarMenu();
    aplicarConfiguracion();
    configurarFormularioVentas();
    configurarFormularios();
    configurarConfiguracion();
    configurarReportes();
    actualizarDashboard();
});
