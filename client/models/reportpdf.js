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

    // Encabezado que se repetirá en cada página
    const agregarEncabezado = () => {
        if (imagenBase64) {
            doc.addImage(imagenBase64, 'JPEG', margin, 10, 80, 20); // Imagen del membrete
        }
        doc.setFontSize(14);
        doc.text('Control Semanal de Salida de Frecuencias', margin, 35); // Título
        doc.setFontSize(10);
        doc.text(`Desde ${fechaInicioInput.value} hasta ${fechaFinInput.value}`, margin, 45); // Subtítulo
        currentY = 50; // Ajusta la posición inicial del contenido
    };

    // Cargar la imagen del membrete
    const imagenBase64 = await cargarImagenBase64('/images/Membrete.jpg');
    if (!imagenBase64) {
        alert("No se pudo cargar la imagen del membrete.");
        return;
    }

    // Agregar el encabezado inicial
    agregarEncabezado();

    // Función para agregar una tabla
    const agregarTabla = (idTabla, tituloTabla) => {
        const table = document.querySelector(`#${idTabla} table`);
        if (table) {
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

            doc.autoTable({
                html: table,
                startY: currentY,
                margin: { left: margin, right: margin },
                styles: { fontSize: 7.5, cellPadding: 1.5 },
                theme: 'grid',
                headStyles: { fillColor: [0, 123, 255] },
                didDrawCell: (data) => {
                    if (data.row.index -1) {
                        // Aplicar negrita a las celdas de datos
                        doc.setFont("bold");
                    }
                },
            });

            currentY = doc.lastAutoTable.finalY + 10; // Actualizar posición después de la tabla
        } else {
            alert(`No se encontró la tabla con ID: ${idTabla}`);
        }
    };

    // Agregar las tablas
    agregarTabla('informeMatutino');
    agregarTabla('informeVespertino');
    agregarTabla('informeCondensado');
    agregarTabla('valores');

    // Agregar las firmas de los responsables al final de la última página
    if (currentY + 50 > pageHeight - margin) {
        doc.addPage(); // Nueva página si no hay espacio
        agregarEncabezado(); // Repetir encabezado
    }
    currentY = pageHeight - 50; // Posición cercana al final de la página
    doc.setFontSize(10);
    doc.text("Firma del Responsable 1: ___________________", margin, currentY);
    currentY += 20; // Espacio entre firmas
    doc.text("Firma del Responsable 2: ___________________", margin, currentY);

    // Guardar el PDF
    doc.save(`Informe_Frecuencias_${fechaInicioInput.value}_to_${fechaFinInput.value}.pdf`);
});
