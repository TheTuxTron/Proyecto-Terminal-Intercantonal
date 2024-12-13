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
            const response = await fetch('/api/responsable'); // Cambia esto al endpoint correcto
            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText}`);
            }
            const data = await response.json();
            return data.map((se) => se.NOMBRE); // Ajusta según la estructura de la respuesta
            console.log(data);
        } catch (error) {
            console.error("Error al obtener los responsables:", error);
            return [];
        }
    };

    const obtenerSecretaria = async () => {
        try {
            const response = await fetch('/api/secretaria'); // Cambia esto al endpoint correcto
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
        doc.setFontSize(14);
        doc.text('Control Semanal de Salida de Frecuencias', margin, 45); // Título
        doc.setFontSize(10);
        doc.text(`Desde ${fechaInicioInput.value} hasta ${fechaFinInput.value}`, margin, 60); // Subtítulo
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
    
    
    const numLineas = 3; // Número de líneas de subrayado
    const anchoLinea = 190; // Ancho de cada línea
    currentY = doc.lastAutoTable.finalY + 10;
    doc.text("Observaciones:", margin, currentY);
    for (let i = 0; i < numLineas; i++) {
        currentY += 10; // Espaciado entre líneas
        doc.line(margin, currentY, margin + anchoLinea, currentY); // Línea horizontal
    }

    const responsable = await obtenerResponsables();
    if (currentY + 50 > pageHeight - margin) {
        doc.addPage(); // Nueva página si no hay espacio
        agregarEncabezado(); // Repetir encabezado
    }
    currentY = pageHeight - 50; // Posición cercana al final de la página
    doc.setFontSize(10);

    responsable.forEach((NOMBRE, index) => {
        doc.text(`Firma de Administrador: ${NOMBRE+'__________________________________' || '__________________________________'}`, margin, currentY);
        currentY += 20; // Espacio entre firmas
    });

    const secretaria = await obtenerSecretaria();
    secretaria.forEach((NOMBRE, index) => {
        doc.text(`Firma de Secretaria: ${NOMBRE+'__________________________________' || '__________________________________'}`, margin, currentY);
    });
    // Guardar el PDF
    doc.save(`Informe_Frecuencias_${fechaInicioInput.value}_to_${fechaFinInput.value}.pdf`);
});
