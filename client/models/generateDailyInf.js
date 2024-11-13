document.getElementById("btnGenerarInforme").addEventListener("click", async() => {
    
    const { jsPDF } = window.jspdf; // Accedemos a jsPDF desde el espacio global
    const doc = new jsPDF();

    const fecha = new Date();
    const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const fechaFormateada = fecha.toLocaleDateString('es-ES', opcionesFecha);
    const hora = fecha.toLocaleTimeString('es-ES');
    // Agregar contenido al PDF
    doc.setFontSize(12);
    doc.text("Informe diario de usuario " + localStorage.getItem("nombre") + "\n" + fechaFormateada + " " + hora, 10, 10);

    const data = await obtenerDatosInforme();

    // Si no hay datos, avisa al usuario
    if (!data || !data.length) {
        alert("No hay datos para mostrar en el informe.");
        return;
    }

    const rows = data.map(row => [
        row.fuente || "-",            // 'fuente' puede ser 'REGISTRO', 'SUBTOTAL REGISTRO', etc.
        row.COOPERATIVA || "-",       // 'COOPERATIVA' es el nombre de la cooperativa
        row.USUARIO || "-",           // 'USUARIO' es el nombre del usuario
        row.DESTINO || "-",           // 'DESTINO' es el nombre del destino
        row.HORA || "-",              // 'HORA' es la hora del viaje
        row.FECHA || "-",             // 'FECHA' es la fecha del viaje
        row.FRECUENCIA || "-",        // 'FRECUENCIA' puede ser 'NORMAL' o 'EXTRA'
        row.NUM_PASAJEROS || "-",     // 'NUM_PASAJEROS' es el número de pasajeros
        row.TIPO_FREC || "-",         // 'TIPO_FREC' es el tipo de frecuencia
        row.VALOR || "-",             // 'VALOR' es el valor del ticket
        row.NUM_TICKET || "-"         // 'NUM_TICKET' es el número de ticket
    ]);
    
    console.log('Datos para el PDF:', rows); // Asegúrate de que se muestren correctamente los datos aquí

    const headers = [
        ["Fuente", "Cooperativa", "Usuario", "Destino", "Hora", "Fecha", "Frecuencia", "Num Pasajeros", "Tipo Frecuencia", "Valor", "Num Ticket"]
    ];


    console.log('Datos para el PDF:', rows);
    // Verifica si autoTable está correctamente cargado
    if (typeof doc.autoTable === 'function') {
        // Generar la tabla en el PDF usando autoTable
        doc.autoTable({
            head: headers,
            body: rows,
            startY: 20,
            styles: {
                fontSize: 6,
            }
        });
    } else {
        alert("El plugin autoTable no está cargado correctamente.");
        return;
    }

    // Descargar el PDF
    doc.save("InformeDiario_"+ localStorage.getItem("nombre") +"_"+hora+".pdf");
});

async function obtenerDatosInforme() {
    const userId = localStorage.getItem('nombre');
    if (!userId) {
        alert("No se encontró el ID de usuario.");
        return [];
    }

    try {
        const response = await fetch(`/api/informe?userId=${userId}`);
        if (response.ok) {
            const data = await response.json();
            console.log('Datos obtenidos:', data);  // Verifica cómo llega la respuesta
            return data;
        } else {
            const errorData = await response.json();
            alert('Error al generar el informe: ' + errorData.error);
            return [];
        }
    } catch (error) {
        console.error('Error de red:', error);
        return [];
    }
}