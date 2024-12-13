document.getElementById('generarPdfBtn').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let currentY = margin;

    // Cargar imagen del membrete
    const cargarImagenBase64 = async (ruta) => {
        try {
            const response = await fetch(ruta);
            if (!response.ok) throw new Error(`Error al cargar imagen: ${response.statusText}`);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    const imagenBase64 = await cargarImagenBase64('/images/Membrete.jpg');
    if (!imagenBase64) {
        alert("Error al cargar la imagen del membrete.");
        return;
    }

    const obtenerResponsables = async () => {
        try {
            const response = await fetch('/api/responsable');
            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText}`);
            }
            const data = await response.json();
            return data.map((se) => se.NOMBRE);
        } catch (error) {
            console.error("Error al obtener los responsables:", error);
            return [];
        }
    };

    const obtenerSecretaria = async () => {
        try {
            const response = await fetch('/api/secretaria');
            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText}`);
            }
            const data = await response.json();
            return data.map((se) => se.NOMBRE);
        } catch (error) {
            console.error("Error al obtener los responsables:", error);
            return [];
        }
    };

    // Encabezado que se repetirá en cada página
    const agregarEncabezado = () => {
        if (imagenBase64) {
            doc.addImage(imagenBase64, 'JPEG', margin, 10, 80, 20); // Imagen del membrete
        }
        doc.setFontSize(16);
        const textoCentrado = 'TERMINAL INTERCANTONAL DE RIOBAMBA';
        const textoWidth = doc.getTextWidth(textoCentrado); // Obtener el ancho del texto
        const centerX = (doc.internal.pageSize.width - textoWidth) / 2; // Calcular la posición X centrada
        doc.text(textoCentrado, centerX, 35); // Dibujar el texto centrado
        currentY = 50; // Ajusta la posición inicial del contenido
    };

    agregarEncabezado();

    // Agregar tablas visibles
    const tablas = [
        { id: 'disco', titulo: 'Informe de Registro de Frecuencias' },
        { id: 'pasajeros', titulo: 'Informe de Registro de Pasajeros por Cooperativa' },
        { id: 'valores', titulo: 'Informe de Valores Recaudados' },
        { id: 'cumplimiento', titulo: 'Informe de Porcentaje de Cumplimiento de Frecuencias' },
    ];

    let nombrePdf = 'Reporte_Mensual'; // Nombre por defecto para el archivo

    for (const { id, titulo } of tablas) {
        const tablaContenedor = document.querySelector(`.${id}`);
        if (tablaContenedor && tablaContenedor.style.display !== 'none') {
            const table = tablaContenedor.querySelector('table');
            if (table) {
                nombrePdf = titulo; // El nombre del archivo será el título de la tabla visible

                if (currentY + 50 > pageHeight - margin) {
                    doc.addPage();
                    agregarEncabezado();
                }
                doc.setFontSize(12).text(titulo, margin, currentY);
                currentY += 10;
                doc.autoTable({
                    html: table,
                    headStyles: { fillColor: [0, 123, 255] },
                    startY: currentY,
                    margin: { left: margin },
                    styles: { fontSize: 9 },
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }
        }
    }

    const numLineas = 3;
    const anchoLinea = 190;
    currentY = doc.lastAutoTable.finalY + 10;
    doc.text("Observaciones:", margin, currentY);
    for (let i = 0; i < numLineas; i++) {
        currentY += 10;
        doc.line(margin, currentY, margin + anchoLinea, currentY); // Línea horizontal
    }

    const responsable = await obtenerResponsables();
    if (currentY + 50 > pageHeight - margin) {
        doc.addPage();
        agregarEncabezado();
    }
    currentY = pageHeight - 50;
    doc.setFontSize(10);

    responsable.forEach((NOMBRE) => {
        doc.text(`Firma de Administrador: ${NOMBRE + '__________________________________' || '__________________________________'}`, margin, currentY);
        currentY += 20;
    });

    const secretaria = await obtenerSecretaria();
    secretaria.forEach((NOMBRE) => {
        doc.text(`Firma de Secretaria: ${NOMBRE + '__________________________________' || '__________________________________'}`, margin, currentY);
    });

    // Guardar PDF con el nombre de la tabla
    doc.save(`${nombrePdf}.pdf`);
});



