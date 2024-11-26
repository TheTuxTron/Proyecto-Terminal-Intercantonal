document.getElementById('generarPdfBtn').addEventListener('click', async () => { 
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height; // Altura de la página
    const margin = 10; // Margen estándar
    let currentY = margin;

    // Función para cargar la imagen como Base64
    const cargarImagenBase64 = async (ruta) => {
        try {
            const response = await fetch(ruta);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Error al cargar la imagen:", error);
            return null;
        }
    };

    
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
        const textoWidth = doc.getTextWidth(textoCentrado);
        const centerX = (doc.internal.pageSize.width - textoWidth) / 2;
        doc.text(textoCentrado, centerX, 35);
        doc.setFontSize(14);
        doc.text('Reporte Mensual', margin, 45); // Título
        currentY = 60; // Ajusta la posición inicial del contenido
    };

    // Cargar la imagen del membrete
    const imagenBase64 = await cargarImagenBase64('/images/Membrete.jpg');
    if (!imagenBase64) {
        alert("No se pudo cargar la imagen del membrete.");
        return;
    }

    // Agregar el encabezado inicial
    agregarEncabezado();

    // Agregar tablas si están visibles
    const agregarTabla = (idTabla, tituloTabla) => {
        const table = document.querySelector(`#${idTabla} table`);
        const tablaElemento = document.getElementById(idTabla);
    
        if (table && tablaElemento) { // Verificar si la tabla está visible
            if (tituloTabla) {
                doc.setFontSize(9);
                doc.text(tituloTabla, margin, currentY);
                currentY += 10; // Espacio después del título
            }

            // Verificar si hay espacio suficiente para la tabla
            if (currentY + 50 > pageHeight - margin) {
                doc.addPage(); // Nueva página
                agregarEncabezado(); // Repetir encabezado
            }

            // Depuración: Verificar contenido de la tabla
            console.log('Tabla contiene:', table.rows.length, 'filas de datos.');
            
            // Asegúrate de que la tabla tenga filas
            if (table.rows.length > 1) {
                const requiredSpace = table.rows.length * 10; // Estimación del espacio necesario para las filas
                if (currentY + requiredSpace > pageHeight - margin) {
                    doc.addPage(); // Nueva página si no hay suficiente espacio
                    agregarEncabezado(); // Repetir encabezado
                }

                doc.autoTable({
                    html: table,
                    startY: currentY,
                    margin: { left: margin, right: margin },
                    styles: { fontSize: 7.5, cellPadding: 1.5 },
                    theme: 'grid',
                    headStyles: { fillColor: [0, 123, 255] },
                    didDrawCell: (data) => {
                        if (data.row.index - 1) {
                            doc.setFont("bold");
                        }
                    },
                });
            } else {
                console.log('La tabla no tiene filas de datos para mostrar.');
            }

            currentY = doc.lastAutoTable.finalY + 10; // Actualizar posición después de la tabla
        } else {
            console.log(`La tabla con ID ${idTabla} no está visible, no se incluirá en el PDF.`);
        }
    };

    // Agregar las tablas solo si están visibles
    agregarTabla('disco');
    

    // Crear el PDF
    doc.save('Reporte_Mensual.pdf');
});
