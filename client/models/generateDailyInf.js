async function generarInformeDiario() {    
    const { jsPDF } = window.jspdf; // Accedemos a jsPDF desde el espacio global
    const doc = new jsPDF();

    // Cargar la imagen en formato base64
    const imagenBase64 = await cargarImagenBase64('/images/Membrete.jpg');
    if (imagenBase64) {
        doc.addImage(imagenBase64, 'JPEG', 10, 10, 80, 20); // Ajusta las coordenadas y el tamaño según lo necesites
    } else {
        alert("No se pudo cargar la imagen.");
    }

    const fecha = new Date();
    const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const fechaFormateada = fecha.toLocaleDateString('es-ES', opcionesFecha);
    const hora = fecha.toLocaleTimeString('es-ES');
    
    // Agregar contenido al PDF
    doc.setFontSize(12);
    doc.text("Informe diario de usuario " + localStorage.getItem("nombre") + "\n" + fechaFormateada + " " + hora, 10, 40);

    const data = await obtenerDatosInforme();

    // Si no hay datos, avisa al usuario
    if (!data || !data.length) {
        alert("No hay datos para mostrar en el informe.");
        return;
    }

    const rows = data.map(row => [
        row.fuente || "-",            
        row.COOPERATIVA || "-",       
        row.USUARIO || "-",           
        row.DESTINO || "-",           
        row.HORA || "-",              
        row.FECHA || "-",             
        row.FRECUENCIA || "-",        
        row.NUM_PASAJEROS || "-",     
        row.TIPO_FREC || "-",         
        row.VALOR || "-",             
        row.NUM_TICKET || "-"         
    ]);

    const headers = [
        ["Fuente", "Cooperativa", "Usuario", "Destino", "Hora", "Fecha", "Frecuencia", "Num Pasajeros", "Tipo Frecuencia", "Valor", "Num Ticket"]
    ];

    if (typeof doc.autoTable === 'function') {
        doc.autoTable({
            head: headers,
            body: rows,
            startY: 50,
            styles: {
                fontSize: 6,
            }
        });
    } else {
        alert("El plugin autoTable no está cargado correctamente.");
        return;
    }

    // Descargar el PDF
    doc.save("InformeDiario_" + localStorage.getItem("nombre") + "_" + hora + ".pdf");
};

// Función para cargar la imagen y convertirla a base64
async function cargarImagenBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

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
