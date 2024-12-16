// Mostrar la ventana modal
function mostrarModal() {
    document.getElementById("modal").style.display = "block";
    // Establecer la fecha actual como valor por defecto
    // Configuración de fecha
    const hoy = new Date();

    // Extraer año, mes y día en la zona horaria local
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    const dia = String(hoy.getDate()).padStart(2, '0'); // Día local
    const fechaActualM = `${anio}-${mes}-${dia}`;

    document.getElementById("fechaM").value = fechaActualM;
}
  
// Cerrar la ventana modal
function cerrarModal() {
    document.getElementById("modal").style.display = "none";
}

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

    const fechaSeleccionada = document.getElementById("fechaM").value;
    const jornadaSeleccionada = document.getElementById("jornada").value;

    if (!fechaSeleccionada || !jornadaSeleccionada) {
        alert("Fecha y jornada son requeridos.");
        return;
    }
    const userId = localStorage.getItem('nombre');
    console.log(`fecha: ${fechaSeleccionada}, jornada: ${jornadaSeleccionada}`);

    const fechaM = new Date(fechaSeleccionada);
    const opcionesFechaM = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const fechaFormateada = fechaM.toLocaleDateString('es-ES', opcionesFechaM);
    const hora = fechaM.toLocaleTimeString('es-ES');

    // Obtener los datos del informe
    const data = await obtenerDatosInforme(userId, fechaSeleccionada);

    // Si no hay datos, avisa al usuario
    if (!data || !data.length) {
        alert("No hay datos para mostrar en el informe.");
        return;
    }

    // Agregar contenido al PDF
    doc.setFontSize(12);
    doc.text("Informe Diario de Recaudación de Especies Valoradas", 45, 40);
    doc.text("Fecha seleccionada: " + fechaSeleccionada, 10, 50);
    doc.text("Jornada: " + jornadaSeleccionada, 10, 60);

    // Encabezado de la tabla
    const headers = [
        ["FRECUENCIAS", "DESDE", "HASTA", "NUM TICKETS", "VALOR UNITARIO", "TOTAL"]
    ];

    // Mapeamos los datos para que coincidan con las columnas del PDF
    const rows = [
        [
            "FRECUENCIAS NORMALES", 
            data[0].RANGO_TICKET_REGISTRO_MIN || 0, 
            data[0].RANGO_TICKET_REGISTRO_MAX || 0, 
            data[0].TOTAL_BOLETOS_REGISTRO || 0, 
            "$0.5", 
            (data[0].TOTAL_BOLETOS_REGISTRO || 0) * 0.5
        ],
        [
            "FRECUENCIAS EXTRAS", 
            data[0].RANGO_TICKET_REGISTRO_EXTRA_MIN || 0, 
            data[0].RANGO_TICKET_REGISTRO_EXTRA_MAX || 0, 
            data[0].TOTAL_BOLETOS_REGISTRO_EXTRA || 0, 
            "$1.00", 
            (data[0].TOTAL_BOLETOS_REGISTRO_EXTRA || 0) * 1
        ],
        [
            "TOTAL", 
            "", 
            "", 
            data[0].TOTAL_BOLETOS_VENDIDOS || 0, 
            "", 
            data[0].TOTAL_RECAUDADO || 0
        ]
    ];

    // Usamos autoTable para generar la tabla
    if (typeof doc.autoTable === 'function') {
        doc.autoTable({
            head: headers,
            headStyles: { fillColor: [0, 123, 255] },
            body: rows,
            startY: 70,
            styles: {
                fontSize: 8,
            }
        });
    } else {
        alert("El plugin autoTable no está cargado correctamente.");
        return;
    }

    // Obtener posición final de la tabla
    const finalY = doc.lastAutoTable.finalY + 10;
    const obtenerResponsables = async () => {
        try {
            const response = await fetch('/api/responsable'); // Cambia esto al endpoint correcto
            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText}`);
            }
            const data = await response.json();
            return data.map((se) => se.NOMBRE); // Ajusta según la estructura de la respuesta
        } catch (error) {
            console.error("Error al obtener los responsables:", error);
            return [];
        }
    };

    // Obtener responsable
    const responsables = await obtenerResponsables();
    const responsable = responsables[0] || "_________________________________";

    // Agregar firmas
    const usuario = localStorage.getItem("nombre") || "_________________________________";

    // Inicializamos currentY para controlar el espaciado
    let currentY = finalY; // Usa la posición actual o la finalY inicial
    currentY += 20;
    // Firma del Usuario
    doc.setFontSize(10);
    doc.text("__________________________________________________", 10, currentY); // Línea de firma
    doc.text("Firma del Responsable:", 10, currentY + 5); // Etiqueta
    doc.text(usuario, 50, currentY + 5); // Nombre del usuario
    currentY += 20; // Espacio entre firmas

    // Firma del Responsable
    doc.text("__________________________________________________", 10, currentY); // Línea de firma
    doc.text("Firma del Administrador:", 10, currentY + 5); // Etiqueta
    doc.text(responsable, 50, currentY + 5); // Nombre del responsable

    // Actualiza currentY después de la firma del responsable, si hay más contenido
    currentY += 30; // Ajusta el espacio según sea necesario

    // Descargar el PDF
    doc.save("InformeDiario_" + localStorage.getItem("nombre") + "_" + fechaSeleccionada + ".pdf");
}


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

// Función para obtener los datos del informe
async function obtenerDatosInforme(userId, fechaM) {
    if (!userId || !fechaM) {
        alert("User ID y fecha son requeridos.");
        return [];
    }

    try {
        const response = await fetch(`/api/informe?userId=${userId}&fecha=${fechaM}`);
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
