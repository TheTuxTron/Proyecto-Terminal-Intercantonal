document.addEventListener("DOMContentLoaded", function () {
    
// Verifica si el elemento con el id 'userDisplay' existe
const userDisplayElement = document.getElementById('userDisplay');
loggedUser = true;
if (userDisplayElement) {
    if (loggedUser) {
        userDisplayElement.textContent = `Bienvenido, ${localStorage.getItem("nombre")}`;
    } else {
        window.location.href = "../../index.html"; // Redirige si no hay usuario
    }
} else {
    console.error("Elemento con id 'userDisplay' no encontrado");
}
});

function logout(){
    window.location.href = "../../index.html";
}
