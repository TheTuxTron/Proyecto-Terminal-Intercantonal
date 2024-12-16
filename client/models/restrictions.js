// Configuración de fecha
const hoy = new Date();

// Extraer año, mes y día en la zona horaria local
const anio = hoy.getFullYear();
const mes = String(hoy.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
const dia = String(hoy.getDate()).padStart(2, '0'); // Día local

const fechaActual = `${anio}-${mes}-${dia}`;

// Establecer el valor en el elemento con id "fecha"
document.getElementById('fecha').value = fechaActual;

async function cargarOpciones() {
    try {
        const response = await fetch('/api/get-options');
        if (!response.ok) throw new Error("Error al cargar cooperativas");

        const cooperativa = await response.json();

        // Si cooperativa no es un arreglo, intenta convertirlo o manejarlo de otro modo
        if (!Array.isArray(cooperativa)) {
            console.error("La respuesta no es un arreglo, es un objeto", cooperativa);
            throw new Error("La respuesta no es un arreglo");
        }

        const select = document.getElementById('cooperativa');
        cooperativa.forEach(cooperativa => {
            const option = document.createElement('option');
            option.value = cooperativa.COOPERATIVA;
            option.textContent = cooperativa.COOPERATIVA;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar las opciones:", error);
    }
}


// Cargar opciones de destinos
async function cargarOpciones2() {
    try {
        const response = await fetch('/api/get-destinos');
        if (!response.ok) throw new Error("Error al cargar destinos");
        
        const destino = await response.json();
        const select = document.getElementById('parroquia');

        destino.forEach(destino => {
            const option = document.createElement('option');
            option.value = destino.DESTINO;
            option.textContent = destino.DESTINO;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar los destinos:", error);
    }
}

// Cargar opciones de hora
async function cargarOpciones3() {
    try {
        const response = await fetch('/api/get-horas');
        if (!response.ok) throw new Error("Error al cargar horas");
        
        const hora = await response.json();
        const select = document.getElementById('hora');

        hora.forEach(hora => {
            const option = document.createElement('option');
            option.value = hora.HORA;
            option.textContent = hora.HORA;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar los horarios:", error);
    }
}

async function cargarNumTicketInicial() {
    try {
        const response = await fetch('/api/get-num-ticket/REGISTRO');
        if (!response.ok) throw new Error("Error al cargar NUM_TICKET");

        const data = await response.json();
        // Actualiza el valor del input con ID 'numTicket'
        const numTicketElement = document.getElementById('numTicket');
        if (numTicketElement) {
            // Usa el valor para campos de tipo input
            numTicketElement.value = data.NumeroMayorTicket ?? '1';
        }
    } catch (error) {
        console.error("Error al cargar el menor NUM_TICKET de la tabla REGISTRO:", error);
    }
}

// Llamar a las funciones al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    cargarOpciones();
    cargarOpciones2();
    cargarOpciones3();
    cargarNumTicketInicial();
});