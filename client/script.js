// client/script.js
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('cedula').value;
    const password = document.getElementById('contraseña').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar el token en localStorage
            localStorage.setItem('token', data.token);

            // Decodificar el token para obtener el rol
            const decodedToken = jwt_decode(data.token);
            const rol = decodedToken.rol;
            const username = decodedToken.nombre;
            localStorage.setItem("nombre", username);
  
            // Redirigir según el rol
            if (rol === "administrador") {
                window.location.href = '../views/homeAdmin.html';
            } else if (rol === "usuario") {
                window.location.href = '../views/homeUser.html';
            } else {
                alert("Rol no reconocido.");
            }
        } else {
            alert("Credenciales incorrectas");
        }
    } catch (error) {
        alert("Error al conectar con el servidor: " + error);
    }
});

// Función para obtener contenido protegido
async function obtenerContenidoProtegido() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("No has iniciado sesión.");
        return;
    }

    try {
        const response = await fetch('/api/protegido', {
            headers: { 'Authorization': token }
        });
        const data = await response.json();
        document.getElementById('mensaje').innerText = data.mensaje;
    } catch (error) {
        alert("Error al acceder al contenido protegido: " + error);
    }
}
