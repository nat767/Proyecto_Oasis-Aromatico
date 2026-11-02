function mostrarRegistro() {
    document.getElementById("login").classList.add("oculto");
    document.getElementById("registro").classList.remove("oculto");
}

function mostrarLogin() {
    document.getElementById("registro").classList.add("oculto");
    document.getElementById("login").classList.remove("oculto");
}

async function registrarUsuario() {
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const correo = document.getElementById("correoRegistro").value.trim();
    const password = document.getElementById("registroPassword").value;
    const confirmar = document.getElementById("confirmarPassword").value;
    const mensajeRegistro = document.getElementById("mensajeRegistro");

    if (!nombre || !apellido || !correo || !password || !confirmar) {
        mensajeRegistro.querySelector("h3").textContent = "Debe registrarse primero";
        mensajeRegistro.querySelector("p").textContent = "Complete todos los campos para crear su cuenta.";
        mensajeRegistro.classList.remove("oculto");
        return;
    }

    if (password !== confirmar) {
        mensajeRegistro.querySelector("h3").textContent = "Las contraseñas no coinciden";
        mensajeRegistro.querySelector("p").textContent = "Revise y confirme nuevamente su contraseña.";
        mensajeRegistro.classList.remove("oculto");
        return;
    }

    mensajeRegistro.classList.add("oculto");
    localStorage.setItem("oasisUsuario", JSON.stringify({ nombre, apellido, correo, password }));
    alert("Usuario registrado correctamente");
    mostrarLogin();
}

async function iniciarSesion() {
    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value;

    const mensajeError = document.getElementById("mensajeError");

    if (!correo || !password) {
        mensajeError.classList.remove("oculto");
        alert("Ingrese correo y contraseña");
        return;
    }

    const usuarioGuardado = JSON.parse(localStorage.getItem("oasisUsuario") || "null");

    if (!usuarioGuardado || usuarioGuardado.correo !== correo || usuarioGuardado.password !== password) {
        const tituloError = mensajeError.querySelector("h3");
        const detalleError = mensajeError.querySelector("p");

        if (tituloError) tituloError.textContent = "Credenciales incorrectas";
        if (detalleError) detalleError.textContent = "El correo o la contraseña son incorrectos.";
        mensajeError.classList.remove("oculto");
        return;
    }

    mensajeError.classList.add("oculto");
    sessionStorage.setItem("oasisSesion", correo);
    window.location.href = "pages/dashboard.html";
}

window.mostrarRegistro = mostrarRegistro;
window.mostrarLogin = mostrarLogin;
window.registrarUsuario = registrarUsuario;
window.iniciarSesion = iniciarSesion;
