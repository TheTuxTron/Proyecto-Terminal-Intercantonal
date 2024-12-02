document.getElementById('registroForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const cooperativa = document.getElementById('cooperativa').value;
    const usuario = localStorage.getItem("nombre");
    const destino = document.getElementById('parroquia').value;
    let hora = document.getElementById('hora').value;
    const fecha = document.getElementById('fecha').value;
    const frecuencia = document.getElementById('frecuencia').value;
    const numPasajeros = document.getElementById('numPasajeros').value;
    const tipoFrecuencia = document.getElementById('tipoFrecuencia').value;
    const numTicket = document.getElementById('numTicket').value;
    let valor = tipoFrecuencia === "NORMAL" ? 0.5 : 1;

    if (hora.includes(':')) {
        const [hours, minutes] = hora.split(':');
        hora = `${hours}H${minutes}`;
    }

    // Mostrar confirmación con los datos
    const mensaje = `
        Se enviarán los siguientes datos:
        - Cooperativa: ${cooperativa}
        - Usuario: ${usuario}
        - Destino: ${destino}
        - Hora: ${hora}
        - Fecha: ${fecha}
        - Frecuencia: ${frecuencia}
        - Número de Pasajeros: ${numPasajeros}
        - Tipo de Frecuencia: ${tipoFrecuencia}
        - Valor: ${valor}
        - Número de Ticket: ${numTicket}
        
        ¿Desea continuar?
    `;

    if (!confirm(mensaje)) {
        return; // Si el usuario cancela, no se realiza la operación
    }

    try {
        const response = await fetch('/api/registrarViaje', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cooperativa,
                usuario,
                destino,
                hora,
                fecha,
                frecuencia,
                numPasajeros,
                tipoFrecuencia,
                valor,
                numTicket
            })
        });

        const resultado = await response.json();

        if (resultado.success) {
            alert("Registro exitoso");
            document.getElementById('registroForm').reset();
            //Fecha
            const hoy = new Date();
            const fechaActual = hoy.toISOString().split('T')[0];
            document.getElementById('fecha').value = fechaActual;
        } else {
            alert("Error en el registro, frecuencia ya registrada.");
        }
    } catch (error) {
        alert("Error al registrar: " + error.message);
    }
});

document.getElementById('hora').addEventListener('change', async function () {
    const hora = this.value;

    if (!hora) {
        return;
    }

    try {
        // Solicitar cooperativas basadas en la hora seleccionada
        const response = await fetch(`/api/getCooperativas?hora=${hora}`);
        const data = await response.json();

        // Limpiar las opciones anteriores
        const cooperativaSelect = document.getElementById('cooperativa');
        cooperativaSelect.innerHTML = '<option value="" disabled selected>--------------</option>';

        // Añadir las nuevas opciones
        data.forEach(row => {
            const optionCooperativa = document.createElement('option');
            optionCooperativa.value = row.COOPERATIVA;
            optionCooperativa.textContent = row.COOPERATIVA;
            cooperativaSelect.appendChild(optionCooperativa);
        });
    } catch (error) {
        console.error("Error al cargar cooperativas:", error);
        alert("Error al cargar cooperativas."+error);
    }
});


document.getElementById('cooperativa').addEventListener('change', actualizarDestinos);

async function actualizarDestinos() {
    const cooperativa = document.getElementById('cooperativa').value;
    let hora = document.getElementById('hora').value;
    const tipoFrecuencia =document.getElementById("tipoFrecuencia").value;
    // Convertir el formato de la hora
    hora = hora.replace(":", "H");

    if (!cooperativa && !hora) {
        return;
    }

    try {
        const response = await fetch(`/api/getDestinos?cooperativa=${cooperativa}&hora=${hora}&tipoFrecuencia=${tipoFrecuencia}`);
        const data = await response.json();

        // Limpiar las opciones anteriores
        const parroquiaSelect = document.getElementById('parroquia');
        parroquiaSelect.innerHTML = '<option value="" disabled selected>--------------</option>';

        // Añadir las nuevas opciones
        data.forEach(row => {
            const optionDestino = document.createElement('option');
            optionDestino.value = row.DESTINO;
            optionDestino.textContent = row.DESTINO;
            parroquiaSelect.appendChild(optionDestino);
        });
    } catch (error) {
        console.error("Error al cargar destinos:", error);
        alert("Error al cargar destinos.");
    }
}


document.getElementById('tipoFrecuencia').addEventListener('change', async function () {
    const tipoFrecuencia = this.value;
    const horaContainer = document.getElementById('horaContainer');
    const cooperativaSelect = document.getElementById('cooperativa');
    const parroquiaSelect = document.getElementById('parroquia');
    // Limpiar el contenido del contenedor de hora
    horaContainer.innerHTML = '';

    // Limpiar las opciones de cooperativa y parroquia
    cooperativaSelect.innerHTML = '<option value="" disabled selected>--------------</option>';
    parroquiaSelect.innerHTML = '<option value="" disabled selected>--------------</option>';

    if (tipoFrecuencia === 'EXTRA') {
        // Crear un campo input para ingresar la hora manualmente
        const horaInput = document.createElement('input');
        horaInput.type = 'time';
        horaInput.id = 'hora';
        horaInput.name = 'hora';
        horaInput.required = true;
        horaContainer.appendChild(horaInput);

        try {
            // Llamar a la API para cargar las cooperativas
            const response = await fetch('/api/get-options');
            if (!response.ok) {
                throw new Error('Error al cargar cooperativas desde la API.');
            }
            const data = await response.json();

            // Añadir las nuevas opciones de cooperativa
            data.forEach(row => {
                const option = document.createElement('option');
                option.value = row.COOPERATIVA;
                option.textContent = row.COOPERATIVA;
                cooperativaSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar cooperativas:", error);
            alert("Error al cargar las cooperativas. Intenta nuevamente.");
        }
        try {
            // Llamar a la API con la tabla 'REGISTRO_EXTRA'
            const response = await fetch('/api/get-num-ticket/REGISTRO_EXTRA');
            if (!response.ok) throw new Error("Error al cargar NUM_TICKET para REGISTRO_EXTRA.");
    
            const data = await response.json();
            
            // Actualiza el valor del input con ID 'numTicket'
            const numTicketElement = document.getElementById('numTicket');
            if (numTicketElement) {
                // Usa el valor devuelto por la API o muestra 'N/A' si no hay valor
                numTicketElement.value = data.MINIMO_NUM_TICKET ?? 'N/A';
            }
        } catch (error) {
            console.error("Error al cargar NUM_TICKET de REGISTRO_EXTRA:", error);
            alert("Error al cargar el NUM_TICKET de REGISTRO_EXTRA. Intenta nuevamente.");
        }
    } else if (tipoFrecuencia === 'NORMAL') {
        location.reload();
        /*
        // Crear un campo select con opciones de hora y cargar opciones de la base de datos
        const horaSelect = document.createElement('select');
        horaSelect.id = 'hora';
        horaSelect.name = 'hora';
        horaSelect.required = true;
        horaSelect.innerHTML = '<option value="" disabled selected>--------------</option>';
        horaContainer.appendChild(horaSelect);
        
        location.reload();      
        try {
            // Llamar a la API para obtener las horas
            const response = await fetch('/api/get-horas');
            if (!response.ok) {
                throw new Error('Error al cargar horas desde la API.');
            }
            const data = await response.json();

            // Agregar las opciones de horas al select
            data.forEach(row => {
                const option = document.createElement('option');
                option.value = row.HORA;
                option.textContent = row.HORA;
                horaSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar horas:", error);
            alert("Error al cargar las horas. Intenta nuevamente.");
        }
        try {
            // Llamar a la API con la tabla 'REGISTRO_EXTRA'
            const response = await fetch('/api/get-num-ticket/REGISTRO');
            if (!response.ok) throw new Error("Error al cargar NUM_TICKET para REGISTRO");
    
            const data = await response.json();
            
            // Actualiza el valor del input con ID 'numTicket'
            const numTicketElement = document.getElementById('numTicket');
            if (numTicketElement) {
                // Usa el valor devuelto por la API o muestra 'N/A' si no hay valor
                numTicketElement.value = data.MINIMO_NUM_TICKET ?? 'N/A';
            }
        } catch (error) {
            console.error("Error al cargar NUM_TICKET de REGISTRO:", error);
            alert("Error al cargar el NUM_TICKET de REGISTRO. Intenta nuevamente.");
        }*/
    }
});
