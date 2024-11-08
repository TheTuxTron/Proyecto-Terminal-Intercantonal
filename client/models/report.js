    // Obtener las referencias de los inputs de fecha
    const fechaInicioInput = document.getElementById('fechaInicio');
    const fechaFinInput = document.getElementById('fechaFin');
    let fechaInicio = null;
    let fechaFin = null;

    // Escuchar cambios en los inputs de fecha
    fechaInicioInput.addEventListener('change', (event) => {
        fechaInicio = new Date(event.target.value);
        console.log(`Fecha de inicio seleccionada: ${fechaInicio.toISOString().split('T')[0]}`);
    });

    fechaFinInput.addEventListener('change', (event) => {
        fechaFin = new Date(event.target.value);
        console.log(`Fecha de fin seleccionada: ${fechaFin.toISOString().split('T')[0]}`);
    });

    async function cargarRegistros() {
        // Obtener los valores de las fechas seleccionadas
        const fechaInicioStr = fechaInicioInput.value;
        const fechaFinStr = fechaFinInput.value;

        // Validación: Asegurarse de que ambas fechas estén seleccionadas
        if (!fechaInicioStr || !fechaFinStr) {
            console.log("Por favor, selecciona ambas fechas.");
            return;
        }

        try {
            // Llamar a la función expuesta por Electron para obtener los registros
            const registros = await window.electronAPI.getRegistros(fechaInicioStr, fechaFinStr);
            console.log("Registros obtenidos:", registros);

            const matutino = registros.filter(registro => registro.JORNADA === 'MAÑANA');
            const vespertino = registros.filter(registro => registro.JORNADA === 'TARDE');

            // Use these arrays to populate your tables or further process the data
            console.log("Registros Matutino:", matutino);
            console.log("Registros Vespertino:", vespertino);

            // Verificar que registros.matutino y registros.vespertino existan antes de generar tablas
                generarTabla('informeMatutino', 'TURNO MAÑANA', matutino, fechaInicioStr, fechaFinStr, true);
                generarTabla('informeVespertino', 'TURNO TARDE', vespertino, fechaInicioStr, fechaFinStr, false);
                generarInformeCondensado(registros);

        } catch (error) {
            console.error("Error al cargar los registros:", error);
        }
    }

    // Agregar evento de clic al botón para cargar los registros
    document.getElementById('generarInformeBtn').addEventListener('click', cargarRegistros);


    function generarFechas(fechaInicioInput, fechaFinInput) {
        let fechas = [];

        // Sumar un día a fechaInicioInput y fechaFinInput
        let fechaInicio = new Date(fechaInicioInput);
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        
        let fechaFin = new Date(fechaFinInput);
        fechaFin.setDate(fechaFin.getDate() + 1);

        let fechaActual = new Date(fechaInicio);

        while (fechaActual <= fechaFin) {
            fechas.push(new Date(fechaActual)); // Agrega una copia de la fecha actual
            fechaActual.setDate(fechaActual.getDate() + 1); // Avanza al siguiente día
        }
        return fechas;
    }

    function calcularSubtotales(datos) {
        const subtotales = [];
    
        datos.forEach(fila => {
            if (Array.isArray(fila.frecuencias) && Array.isArray(fila.pasajeros)) {
                fila.frecuencias.forEach((frec, i) => {
                    if (!subtotales[i]) {
                        subtotales[i] = { frec: 0, pasaj: 0 };
                    }
    
                    if (frec !== 0 && frec !== undefined) {
                        subtotales[i].frec += frec; // Sumamos las frecuencias en lugar de contar
                    }
    
                    subtotales[i].pasaj += (fila.pasajeros[i] || 0); // Aseguramos que los pasajeros sean números
                });
            } else {
                console.warn("Datos faltantes en la fila:", fila);
            }
        });
    
        return subtotales;
    }
    
    
    function generarTabla(containerId, titulo, datos, fechaInicio, fechaFin, esMatutino) {
        const container = document.getElementById(containerId);
        const diasSemana = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];
        const fechas = generarFechas(fechaInicio, fechaFin);
        const tipoTurno = esMatutino ? '1M' : '1T';
    
        // Separar datos en registros normales y extras
        const registrosNormales = datos.filter(fila => fila.TIPO_FREC === 'NORMAL');
        const registrosExtras = datos.filter(fila => fila.TIPO_FREC === 'EXTRA');
    
        // Función para agrupar datos por HORA, COOPERATIVA y DESTINO
        function agruparDatos(datos) {
            const registrosAgrupados = {};
            datos.forEach(fila => {
                const hora = fila.HORA || 'Desconocida';
                const cooperativa = fila.COOPERATIVA || 'Desconocida';
                const destino = fila.DESTINO || 'Desconocida';
    
                if (!registrosAgrupados[hora]) {
                    registrosAgrupados[hora] = {};
                }
                if (!registrosAgrupados[hora][cooperativa]) {
                    registrosAgrupados[hora][cooperativa] = {};
                }
                if (!registrosAgrupados[hora][cooperativa][destino]) {
                    registrosAgrupados[hora][cooperativa][destino] = Array(fechas.length).fill({ frec: 0, pasaj: 0 });
                }
    
                const frecuencias = Array.isArray(fila.FRECUENCIA) ? fila.FRECUENCIA : [fila.FRECUENCIA];
                const numPasajeros = Array.isArray(fila.NUM_PASAJEROS) ? fila.NUM_PASAJEROS : [fila.NUM_PASAJEROS];
    
                frecuencias.forEach((frec, i) => {
                    const indexFecha = fechas.findIndex(fecha => {
                        const fechaOriginal = new Date(fila.FECHA);
                        fechaOriginal.setDate(fechaOriginal.getDate() + 1);
                        return fechaOriginal.toLocaleDateString() === fecha.toLocaleDateString();
                    });
    
                    if (indexFecha !== -1) {
                        registrosAgrupados[hora][cooperativa][destino][indexFecha] = {
                            frec: frec || 0,
                            pasaj: numPasajeros[i] || 0
                        };
                    }
                });
            });
            return registrosAgrupados;
        }
    
        // Agrupar los datos normales y extras
        const registrosAgrupadosNormales = agruparDatos(registrosNormales);
        const registrosAgrupadosExtras = agruparDatos(registrosExtras);
    
        let tabla = `
            <table>
                <thead>
                    <tr class="header">
                        <th colspan="3">TERMINAL INTERCANTONAL DE RIOBAMBA - CONTROL SEMANAL DE SALIDA DE FRECUENCIAS (${titulo})</th>
                        <th colspan="${fechas.length * 2}">MES: ${new Date(fechaInicio).toLocaleDateString('es-ES', { month: 'long' }).toUpperCase()}</th>
                        <th rowspan="3">${tipoTurno}</th>
                    </tr>
                    <tr>
                        <th rowspan="2">HORA</th>
                        <th rowspan="2">COOPERATIVA</th>
                        <th rowspan="2">DESTINO</th>
                        ${fechas.map(fecha => `<th colspan="2">${diasSemana[fecha.getDay()]} ${fecha.getDate()}</th>`).join('')}
                    </tr>
                    <tr>
                        ${fechas.map(() => '<th>frec</th><th>pasaj</th>').join('')}
                    </tr>
                </thead>
                <tbody>
        `;
    
        // Generar filas de datos normales
// Generar filas de datos normales
Object.keys(registrosAgrupadosNormales).forEach(hora => {
    Object.keys(registrosAgrupadosNormales[hora]).forEach(cooperativa => {
        Object.keys(registrosAgrupadosNormales[hora][cooperativa]).forEach(destino => {
            const datosDestino = registrosAgrupadosNormales[hora][cooperativa][destino];
            tabla += `
                <tr>
                    <td>${hora}</td>
                    <td>${cooperativa}</td>
                    <td>${destino}</td>
                    ${datosDestino.map(dato => {
                        // Comprobar si dato.pasaj es 0 y dato.frec tiene un valor
                        if (dato.pasaj === 0 && dato.frec) {
                            console.log("Pasajero 0 encontrado con frecuencia existente en destino:", destino, "hora:", hora, "cooperativa:", cooperativa);
                        }
                        return `<td>${dato.frec || '-'}</td><td>${dato.pasaj === 0 && dato.frec ? 0 : (dato.pasaj || '-')}</td>`;
                    }).join('')}
                </tr>
            `;
        });
    });
});

    
        // Fila de separación para los Extras
        tabla += `
            <tr>
                <td colspan="${fechas.length * 2 + 3}" style="text-align:center; font-weight:bold; background-color:#f0f0f0;">EXTRAS</td>
            </tr>
        `;
    
        // Generar filas de datos extras
        Object.keys(registrosAgrupadosExtras).forEach(hora => {
            Object.keys(registrosAgrupadosExtras[hora]).forEach(cooperativa => {
                Object.keys(registrosAgrupadosExtras[hora][cooperativa]).forEach(destino => {
                    const datosDestino = registrosAgrupadosExtras[hora][cooperativa][destino];
                    tabla += `
                    <tr>
                        <td>${hora}</td>
                        <td>${cooperativa}</td>
                        <td>${destino}</td>
                        ${datosDestino.map(dato => {
                            // Comprobar si dato.pasaj es 0 y dato.frec tiene un valor
                            if (dato.pasaj === 0 && dato.frec) {
                                console.log("Pasajero 0 encontrado con frecuencia existente en destino:", destino, "hora:", hora, "cooperativa:", cooperativa);
                            }
                            return `<td>${dato.frec || '-'}</td><td>${dato.pasaj === 0 && dato.frec ? 0 : (dato.pasaj || '-')}</td>`;
                        }).join('')}
                    </tr>
                `;
            });
        });
    });
    
        // Calcular totales generales
        function calcularTotales() {
            let totalFrec = 0;
            let totalPasaj = 0;
    
            // Sumar todas las frecuencias y pasajeros
            Object.values(registrosAgrupadosNormales).forEach(hora => {
                Object.values(hora).forEach(cooperativa => {
                    Object.values(cooperativa).forEach(destino => {
                        destino.forEach(dato => {
                            totalFrec += dato.frec || 0;
                            totalPasaj += dato.pasaj || 0;
                        });
                    });
                });
            });
    
            Object.values(registrosAgrupadosExtras).forEach(hora => {
                Object.values(hora).forEach(cooperativa => {
                    Object.values(cooperativa).forEach(destino => {
                        destino.forEach(dato => {
                            totalFrec += dato.frec || 0;
                            totalPasaj += dato.pasaj || 0;
                        });
                    });
                });
            });
    
            return { totalFrec, totalPasaj };
        }
    
        const totales = calcularTotales();
    
        // Fila de totales
        tabla += `
            <tr class="total">
                <td colspan="3">TOTAL GENERAL</td>
                ${fechas.map(() => `<td colspan="2" style="text-align:center;">${totales.totalFrec}</td>`).join('')}
                <td colspan="2" style="text-align:center;">${totales.totalPasaj}</td>
            </tr>
        `;
    
        tabla += `</tbody></table>`;
    
        // Renderizar la tabla final en el contenedor
        container.innerHTML = tabla;
    }
       