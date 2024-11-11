    // Obtener las referencias de los inputs de fecha
    const fechaInicioInput = document.getElementById('fechaInicio');
    const fechaFinInput = document.getElementById('fechaFin');
    let fechaInicio = null;
    let fechaFin = null;

    // Escuchar cambios en los inputs de fecha
    fechaInicioInput.addEventListener('change', (event) => {
        fechaInicio = new Date(event.target.value);
    });

    fechaFinInput.addEventListener('change', (event) => {
        fechaFin = new Date(event.target.value);
    });

    async function cargarRegistros() {
        // Obtener los valores de las fechas seleccionadas
        const fechaInicioStr = fechaInicioInput.value;
        const fechaFinStr = fechaFinInput.value;
    
        // Validación de fechas
        if (!fechaInicioStr || !fechaFinStr) {
            alert("Por favor, selecciona ambas fechas.");
            return;
        }
    
        if (new Date(fechaFinStr) < new Date(fechaInicioStr)) {
            alert("La fecha de fin no puede ser menor que la fecha de inicio.");
            return;
        }
    
        try {
            // Realizar las solicitudes a la API
            const response1 = await fetch(`/api/registro?startDate=${fechaInicioStr}&endDate=${fechaFinStr}`);
            const response2 = await fetch(`/api/extra?startDate=${fechaInicioStr}&endDate=${fechaFinStr}`);
    
            if (!response1.ok || !response2.ok) {
                throw new Error("Error al obtener los registros");
            }
    
            const registros = await response1.json();
            const extra = await response2.json();
            
            console.log("Registros:", registros);
            console.log("Extras obtenidos:", extra);
            
            // Filtrar los datos matutinos y vespertinos de registros y extras
            const matuttino = [
                ...registros.filter(registro => {
                    const hora = parseInt(registro.HORA.split('H')[0]);
                    const minutos = parseInt(registro.HORA.split('H')[1]);
                    // Matutino hasta 13:00 inclusive
                    return (hora < 13) || (hora === 13 && minutos === 0);
                }),
                ...extra.filter(registro => {
                    const hora = parseInt(registro.HORA.split('H')[0]);
                    const minutos = parseInt(registro.HORA.split('H')[1]);
                    // Matutino hasta 13:00 inclusive
                    return (hora < 13) || (hora === 13 && minutos === 0);
                })
            ];
            
            const vespertino = [
                ...registros.filter(registro => {
                    const hora = parseInt(registro.HORA.split('H')[0]);
                    const minutos = parseInt(registro.HORA.split('H')[1]);
                    // Vespertino desde 13:01 en adelante
                    return (hora > 13) || (hora === 13 && minutos > 0);
                }),
                ...extra.filter(registro => {
                    const hora = parseInt(registro.HORA.split('H')[0]);
                    const minutos = parseInt(registro.HORA.split('H')[1]);
                    // Vespertino desde 13:01 en adelante
                    return (hora > 13) || (hora === 13 && minutos > 0);
                })
            ];
            
            console.log("Matutino:", matuttino);
            console.log("Vespertino:", vespertino);
        
            

            // Generar las tablas para ambas jornadas
            generarTabla('informeMatutino', 'TURNO MAÑANA', matuttino, fechaInicioStr, fechaFinStr, true);
            generarTabla('informeVespertino', 'TURNO TARDE', vespertino, fechaInicioStr, fechaFinStr, false);
    
            // Generar informe condensado
            generarInformeCondensado(registros);
    
        } catch (error) {
            console.error("Error al cargar los registros:", error);
        }
    }
    

    // Agregar evento de clic al botón para cargar los registros
    document.getElementById('generarInformeBtn').addEventListener('click', cargarRegistros);


    function generarFechas(fechaInicioInput, fechaFinInput) {
        let fechas = [];
    
        // Crear objetos Date con las fechas proporcionadas
        let fechaInicio = new Date(fechaInicioInput);
        let fechaFin = new Date(fechaFinInput);
    
        // Verificar si fechaInicio es mayor que fechaFin
        if (fechaInicio > fechaFin) {
            console.log("La fecha de inicio no puede ser mayor que la fecha de fin.");
            return fechas;
        }
    
        let fechaActual = new Date(fechaInicio);
    
        while (fechaActual <= fechaFin) {
            fechas.push(new Date(fechaActual)); // Agrega una copia de la fecha actual
            fechaActual.setDate(fechaActual.getDate() + 1); // Avanza al siguiente día
        }
    
        return fechas;
    }
    
    

    function calcularSubtotales(datos, fechaInicioInput, fechaFinInput) {
        // Verificación de las fechas de entrada
        console.log("Fecha de inicio:", fechaInicioInput);
        console.log("Fecha de fin:", fechaFinInput);
    
        // Generar fechas de inicio y fin correctamente
        const fechaInicio = new Date(fechaInicioInput.split('T')[0]); // Aseguramos solo la parte de la fecha
        const fechaFin = new Date(fechaFinInput.split('T')[0]); // Aseguramos solo la parte de la fecha
        
        // Extraer las fechas únicas de los datos
        const fechasDatos = Array.from(new Set(datos.map(fila => {
            const fechaOriginal = new Date(fila.FECHA);
            return fechaOriginal.toISOString().split('T')[0]; // "aaaa-mm-dd"
        })));
    
        console.log("Fechas extraídas de los datos:", fechasDatos);
    
        // Inicializar un arreglo para almacenar las fechas completas dentro del rango
        const fechasGeneradas = [];
        let fechaActual = new Date(fechaInicio);
    
        // Generamos todas las fechas en el rango de fechaInicio a fechaFin
        while (fechaActual <= fechaFin) {
            const fechaFormateada = fechaActual.toISOString().split('T')[0]; // "aaaa-mm-dd"
            fechasGeneradas.push(fechaFormateada);
            fechaActual.setDate(fechaActual.getDate() + 1); // Avanza al siguiente día
        }
    
        console.log("Fechas generadas en el rango:", fechasGeneradas);
    
        // Inicializar subtotales con 0 para frecuencias y pasajeros
        const subtotales = fechasGeneradas.map(fecha => ({
            fecha: fecha,
            frec: 0,
            pasaj: 0
        }));
        console.log("Subtotales inicializados:", subtotales);
    
        // Ordenar los datos por fecha (si no están ordenados)
        datos.sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA));
    
        // Iterar sobre los datos de las filas
        datos.forEach(fila => {
            // Aseguramos que FRECUENCIA y NUM_PASAJEROS sean arreglos
            const frecuencias = Array.isArray(fila.FRECUENCIA) ? fila.FRECUENCIA : [fila.FRECUENCIA];
            const numPasajeros = Array.isArray(fila.NUM_PASAJEROS) ? fila.NUM_PASAJEROS : [fila.NUM_PASAJEROS];
            console.log("Procesando fila:", fila);
    
            // Convertir la fecha de la fila a "aaaa-mm-dd"
            const fechaOriginal = new Date(fila.FECHA);
            const fechaFila = fechaOriginal.toISOString().split('T')[0];
            console.log("Fecha convertida de la fila:", fechaFila);
    
            // Buscar la fecha correspondiente en el arreglo de fechas generadas
            const indexFecha = fechasGeneradas.indexOf(fechaFila);
            console.log("Índice de la fecha encontrada:", indexFecha);
    
            // Si encontramos la fecha en el arreglo de fechas generadas
            if (indexFecha !== -1) {
                console.log("Fecha encontrada en subtotales:", fechasGeneradas[indexFecha]);
    
                // Iterar sobre cada frecuencia registrada
                frecuencias.forEach((frec, i) => {
                    console.log("Frecuencia actual:", frec, "Número de pasajeros:", numPasajeros[i]);
                    if (frec !== 0) {  // Solo sumamos las frecuencias diferentes de cero
                        subtotales[indexFecha].frec += 1; // Contamos cuántas frecuencias diferentes de cero hay
                        subtotales[indexFecha].pasaj += parseInt(numPasajeros[i], 10) || 0; // Sumamos el número de pasajeros
                    }
                });
            }
        });
    
        // Si no hay datos para una fecha, se mantiene el valor de 0 en los subtotales
        console.log("Subtotales calculados:", subtotales);
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
    
    // Agrupar los datos por hora, cooperativa y destino
    const registrosAgrupadosNormales = agruparDatos(registrosNormales);
    const registrosAgrupadosExtras = agruparDatos(registrosExtras);

    // Calcular los subtotales para los datos normales y extras
    const subtotalesNormales = calcularSubtotales(registrosNormales, fechaInicio, fechaFin);
    console.log("subn", subtotalesNormales);
    const subtotalesExtras = calcularSubtotales(registrosExtras, fechaInicio, fechaFin);
    console.log("sube", subtotalesExtras);
    
    let tabla = `
    <table>
        <thead>
            <tr class="header">
                <th colspan="3">TERMINAL INTERCANTONAL DE RIOBAMBA - CONTROL SEMANAL DE SALIDA DE FRECUENCIAS (${titulo})</th>
                <th colspan="${fechas.length * 2}">MES: ${(function() {
                    const fecha = new Date(fechaInicio); // Crear nueva fecha
                    fecha.setDate(fecha.getDate() + 1); // Sumar un día a la fecha de inicio
                    return fecha.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase(); // Formatear mes
                })()}</th>
                <th rowspan="3">${tipoTurno}</th>
            </tr>
            <tr>
                <th rowspan="2">HORA</th>
                <th rowspan="2">COOPERATIVA</th>
                <th rowspan="2">DESTINO</th>
                ${fechas.map(fecha => {
                    // Sumar un día a la fecha dentro del mapeo
                    const nuevaFecha = new Date(fecha);
                    nuevaFecha.setDate(nuevaFecha.getDate() + 1); // Sumar un día
                    return `<th colspan="2">${diasSemana[nuevaFecha.getDay()]} ${nuevaFecha.getDate()}</th>`;
                }).join('')}
            </tr>
            <tr>
                ${fechas.map(() => '<th>frec</th><th>pasaj</th>').join('')}
            </tr>
        </thead>
        <tbody>
    `;
    
    // Variables para los subtotales verticales
    let subtotalesPorColumna = Array(fechas.length * 2).fill(0);

    // Generar filas de datos normales
    Object.keys(registrosAgrupadosNormales).forEach(hora => {
        Object.keys(registrosAgrupadosNormales[hora]).forEach(cooperativa => {
            Object.keys(registrosAgrupadosNormales[hora][cooperativa]).forEach(destino => {
                const datosDestino = registrosAgrupadosNormales[hora][cooperativa][destino];
                let totalPasajeros = 0;

                tabla += `
                    <tr>
                        <td>${hora}</td>
                        <td>${cooperativa}</td>
                        <td>${destino}</td>
                        ${datosDestino.map((dato, index) => {
                            totalPasajeros += (dato.pasaj || 0);
                            subtotalesPorColumna[index * 2] += (dato.frec || 0);
                            subtotalesPorColumna[index * 2 + 1] += (dato.pasaj || 0);
                            return `<td>${dato.frec || '-'}</td><td>${dato.pasaj === 0 && dato.frec ? 0 : (dato.pasaj || '-')}</td>`;
                        }).join('')}
                        <td><strong>${totalPasajeros}</strong></td>
                    </tr>
                `;
            });
        });
    });

    // Fila de subtotales normales
    tabla += `
        <tr>
            <td colspan="3" style="font-weight:bold; background-color:#f0f0f0;">SUBTOTAL FRECUENCIAS</td>
            ${subtotalesNormales.map(subtotal => `<td>${subtotal.frec}</td><td>${subtotal.pasaj}</td>`).join('')}
        </tr>
    `;

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
                let totalPasajeros = 0;

                tabla += `
                    <tr>
                        <td>${hora}</td>
                        <td>${cooperativa}</td>
                        <td>${destino}</td>
                        ${datosDestino.map((dato, index) => {
                            totalPasajeros += (dato.pasaj || 0);
                            subtotalesPorColumna[index * 2] += (dato.frec || 0);
                            subtotalesPorColumna[index * 2 + 1] += (dato.pasaj || 0);
                            return `<td>${dato.frec || '-'}</td><td>${dato.pasaj === 0 && dato.frec ? 0 : (dato.pasaj || '-')}</td>`;
                        }).join('')}
                        <td><strong>${totalPasajeros}</strong></td>
                    </tr>
                `;
            });
        });
    });

    // Fila de subtotales extras
    tabla += `
        <tr>
            <td colspan="3" style="font-weight:bold; background-color:#f0f0f0;">SUBTOTAL EXTRAS</td>
            ${subtotalesExtras.map(subtotal => `<td>${subtotal.frec}</td><td>${subtotal.pasaj}</td>`).join('')}
        </tr>
    `;

    // Cerrar la tabla
    tabla += `</tbody></table>`;

    // Insertar la tabla en el contenedor
    container.innerHTML = tabla;
}