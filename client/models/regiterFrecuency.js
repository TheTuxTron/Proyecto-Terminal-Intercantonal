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

document.getElementById('cooperativa').addEventListener('change', async function() {
    const cooperativa = this.value;

    if (!cooperativa) {
        return;
    }

    try {
        const response = await fetch(`/api/getDestinos?cooperativa=${cooperativa}`);
        const data = await response.json();

        // Limpiar las opciones anteriores
        const destinoSelect = document.getElementById('parroquia');
        destinoSelect.innerHTML = '<option value="" disabled selected>--------------</option>';

        // Añadir las nuevas opciones
        data.forEach(row => {
            const optionDestino = document.createElement('option');
            optionDestino.value = row.DESTINO;
            optionDestino.textContent = row.DESTINO;
            destinoSelect.appendChild(optionDestino);
        });
    } catch (error) {
        console.error("Error al cargar destinos:", error);
        alert("Error al cargar destinos.");
    }
});

document.getElementById('parroquia').addEventListener('change', async function() {
    const cooperativa = document.getElementById('cooperativa').value;
    const destino = this.value;

    if (!cooperativa || !destino) {
        return;
    }

    try {
        const response = await fetch(`/api/getHoras?cooperativa=${cooperativa}&destino=${destino}`);
        const data = await response.json();

        // Limpiar las opciones anteriores
        const horaSelect = document.getElementById('hora');
        horaSelect.innerHTML = '<option value="" disabled selected>--------------</option>';

        // Añadir las nuevas opciones
        data.forEach(row => {
            const optionHora = document.createElement('option');
            optionHora.value = row.HORA;
            optionHora.textContent = row.HORA;
            horaSelect.appendChild(optionHora);
        });
    } catch (error) {
        console.error("Error al cargar horas:", error);
        alert("Error al cargar horas.");
    }
});

document.getElementById('tipoFrecuencia').addEventListener('change', function () {
    const tipoFrecuencia = this.value;
    const horaContainer = document.getElementById('horaContainer');
    
    // Limpiar el contenido del contenedor de hora
    horaContainer.innerHTML = '';

    if (tipoFrecuencia === 'EXTRA') {
        // Crear un campo input para ingresar la hora manualmente
        const horaInput = document.createElement('input');
        horaInput.type = 'time';
        horaInput.id = 'hora';
        horaInput.name = 'hora';
        horaInput.required = true;
        horaContainer.appendChild(horaInput);
    } else {
        // Crear un campo select con opciones de hora y cargar opciones de la base de datos
        const horaSelect = document.createElement('select');
        horaSelect.id = 'hora';
        horaSelect.name = 'hora';
        horaSelect.required = true;
        horaSelect.innerHTML = '<option value="" disabled selected>--------------</option>';
        horaContainer.appendChild(horaSelect);
        
        // Cargar destinos y horas si la frecuencia es NORMAL
        document.getElementById('parroquia').dispatchEvent(new Event('change'));
    }
});