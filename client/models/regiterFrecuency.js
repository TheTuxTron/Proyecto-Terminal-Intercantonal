document.getElementById('registroForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const cooperativa = document.getElementById('cooperativa').value;
    const usuario = localStorage.getItem("cedulaUser");
    const parroquia = document.getElementById('parroquia').value;
    const hora = document.getElementById('hora').value;
    const fecha = document.getElementById('fecha').value;
    const frecuencia = document.getElementById('frecuencia').value;
    const numPasajeros = document.getElementById('numPasajeros').value;
    const tipoFrecuencia = document.getElementById('tipoFrecuencia').value;

    try {
        const resultado = await window.electronAPI.registrarViaje(
            cooperativa,
            usuario,
            parroquia,
            hora,
            fecha,
            frecuencia,
            numPasajeros,
            tipoFrecuencia
        );

        if (resultado.success) {
            alert("Registro exitoso");
            document.getElementById('registroForm').reset();
            //Fecha
            const hoy = new Date();
            const fechaActual = hoy.toISOString().split('T')[0];
            document.getElementById('fecha').value = fechaActual;
        } else {
            alert("Error en el registro, frecuencia ya registrada." ); //resultado.error);
        }
    } catch (error) {
        alert("Error al registrar: " + error.message);
    }
});