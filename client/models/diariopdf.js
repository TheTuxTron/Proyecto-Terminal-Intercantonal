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

    // Agregar formulario de depósito si está visible
    const agregarFormularioDeposito = () => {
        const formDeposito = document.getElementById('depósito');
        if (formDeposito.style.display === "block") {  // Verifica si el formulario está visible
            const fechaDeposito = document.getElementById('fechaDeposito').value;
            const numeroGuia = document.getElementById('numeroGuia').value;
            const total = document.getElementById('total').value;  // Asegúrate de que 'totalInput' sea el ID correcto
            const ticketsN = document.getElementById('ticketsN').value;
            const ticketsTN = document.getElementById('ticketsTN').value;
            const ticketsE = document.getElementById('ticketsE').value;
            const ticketsTE = document.getElementById('ticketsTE').value;
            const observaciones = document.getElementById('observaciones').value;

            doc.setFontSize(12);
            currentY =60;
            doc.text("Datos de Depósito", margin, currentY);
            currentY += 10; // Espacio después del título
            
            doc.setFontSize(10);
            doc.text(`Fecha de Depósito: ${fechaDeposito || 'Sin datos'}`, margin, currentY);
            currentY += 6;
            doc.text(`Número de Guía: ${numeroGuia || 'Sin datos'}`, margin, currentY);
            currentY += 6;
            doc.text(`Valor de depósito: ${total || 'Sin datos'}`, margin, currentY);
            currentY += 6;
            doc.text(`Tickets Normales vendidos: ${ticketsN || 'Sin datos'}`, margin, currentY);
            currentY += 6;
            doc.text(`Total tickets Normales vendidos: ${ticketsTN || 'Sin datos'}`, margin, currentY);
            currentY += 6;
            doc.text(`Tickets Extra vendidos: ${ticketsE || 'Sin datos'}`, margin, currentY);
            currentY += 6;
            doc.text(`Total tickets Normales vendidos: ${ticketsTE || 'Sin datos'}`, margin, currentY);
            currentY += 6;
            doc.text(`Observaciones: ${observaciones || 'No hay novedades'}`, margin, currentY);
            currentY += 10; // Espacio después del formulario
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
        doc.text('Control Diario de Salida de Frecuencias', margin, 45); // Título
        doc.setFontSize(10);
        doc.text(`Desde ${fechaInicioInput.value} hasta ${fechaFinInput.value}`, margin, 50); // Subtítulo
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
    agregarFormularioDeposito();

    // Agregar tablas si están visibles
    const agregarTabla = (idTabla, tituloTabla) => {
        const table = document.querySelector(`#${idTabla} table`);
        const tablaElemento = document.getElementById(idTabla);
    
        if (table && tablaElemento && tablaElemento.style.display === "block") { // Verificar si la tabla está visible
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
    agregarTabla('informeMatutino');
    agregarTabla('informeVespertino');
    agregarTabla('informeCondensadoD');

    const agregar = (idTabla, tituloTabla) => {
        const table = document.querySelector(`#${idTabla} table`);
        const tablaElemento = document.getElementById(idTabla);
    
        if (table && tablaElemento && tablaElemento.style.display === "block") { // Verificar si la tabla está visible
            if (tituloTabla) {
                doc.setFontSize(9);
                doc.text(tituloTabla, margin, currentY);
                currentY += 10; // Espacio después del título
            }

            // Verificar si hay suficiente espacio para la tabla
            if (currentY + 50 > pageHeight - margin) {
                doc.addPage(); // Nueva página
                agregarEncabezado(); // Repetir encabezado
            }

            const filas = Array.from(table.rows).slice(1); // Obtener las filas de datos

            if (idTabla === 'valores' && filas.length >= 3) {
                const terceraFila = filas[1]; // Obtener la tercera fila
                filas.splice(1, 0, terceraFila); // Duplicamos la tercera fila
            }

            const tablaModificada = document.createElement('table');
            tablaModificada.innerHTML = `<thead>${table.querySelector('thead').innerHTML}</thead><tbody></tbody>`;
            const tbody = tablaModificada.querySelector('tbody');

            filas.forEach(fila => {
                tbody.appendChild(fila.cloneNode(true)); // Clonar las filas
            });

            doc.autoTable({
                html: tablaModificada,
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

            currentY = doc.lastAutoTable.finalY + 10; // Actualizar la posición después de la tabla
        }
    };

    // Finalmente agregar los valores
    agregar('valores');
    currentY+=10;
    const responsable = await obtenerResponsables();

    // Continuar con `currentY` desde la posición actual
    doc.setFontSize(10);
    
    // Agregar firmas de responsables
    responsable.forEach((NOMBRE, index) => {
        doc.text(
            `Firma de Administrador: ${NOMBRE ? NOMBRE + ' __________________________________' : '__________________________________'}`,
            margin,
            currentY
        );
        currentY += 20; // Espacio entre firmas
    });
    
    // Agregar firmas de secretarias
    const secretaria = await obtenerSecretaria();
    secretaria.forEach((NOMBRE, index) => {
        doc.text(
            `Firma de Secretaria: ${NOMBRE ? NOMBRE + ' __________________________________' : '__________________________________'}`,
            margin,
            currentY
        );
        currentY += 20; // Espacio entre firmas
    });
    
    // Verificar si hay espacio suficiente en la página
    if (currentY + 20 > pageHeight - margin) {
        doc.addPage(); // Nueva página si no hay espacio
        currentY = margin; // Reiniciar la posición de `currentY` al margen superior
    }
    
    // Crear el PDF
    doc.save('Informe_Diario.pdf');
});    