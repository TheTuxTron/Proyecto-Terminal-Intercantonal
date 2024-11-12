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

            // Generar las tablas para ambas jornadas
            generarTabla('informeMatutino', 'TURNO MAÑANA', matuttino, fechaInicioStr, fechaFinStr, true);
            generarTabla('informeVespertino', 'TURNO TARDE', vespertino, fechaInicioStr, fechaFinStr, false);
    
            // Generar informe condensado
            generarInformeCondensado(matuttino, vespertino, fechaInicioStr, fechaFinStr);
    
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
    
        // Inicializar subtotales con 0 para frecuencias y pasajeros
        const subtotales = fechasGeneradas.map(fecha => ({
            fecha: fecha,
            frec: 0,
            pasaj: 0
        }));

    
        // Ordenar los datos por fecha (si no están ordenados)
        datos.sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA));
    
        // Iterar sobre los datos de las filas
        datos.forEach(fila => {
            // Aseguramos que FRECUENCIA y NUM_PASAJEROS sean arreglos
            const frecuencias = Array.isArray(fila.FRECUENCIA) ? fila.FRECUENCIA : [fila.FRECUENCIA];
            const numPasajeros = Array.isArray(fila.NUM_PASAJEROS) ? fila.NUM_PASAJEROS : [fila.NUM_PASAJEROS];
    
            // Convertir la fecha de la fila a "aaaa-mm-dd"
            const fechaOriginal = new Date(fila.FECHA);
            const fechaFila = fechaOriginal.toISOString().split('T')[0];
    
            // Buscar la fecha correspondiente en el arreglo de fechas generadas
            const indexFecha = fechasGeneradas.indexOf(fechaFila);
    
            // Si encontramos la fecha en el arreglo de fechas generadas
            if (indexFecha !== -1) {
                // Iterar sobre cada frecuencia registrada
                frecuencias.forEach((frec, i) => {
                    if (frec !== 0) {  // Solo sumamos las frecuencias diferentes de cero
                        subtotales[indexFecha].frec += 1; // Contamos cuántas frecuencias diferentes de cero hay
                        subtotales[indexFecha].pasaj += parseInt(numPasajeros[i], 10) || 0; // Sumamos el número de pasajeros
                    }
                });
            }
        });
    
        // Si no hay datos para una fecha, se mantiene el valor de 0 en los subtotales
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
    const subtotalesExtras = calcularSubtotales(registrosExtras, fechaInicio, fechaFin);
    
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
                    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const fechaOriginal = new Date(fecha);
                    const diaIndex = fechaOriginal.getDay() + 1;
                
                    // Si el índice es mayor que 6, asignamos 'Domingo'
                    const nombreDia = diasSemana[diaIndex > 6 ? 0 : diaIndex]; 
                
                    const nuevaFecha = new Date(fechaOriginal);
                    nuevaFecha.setDate(nuevaFecha.getDate() + 1);
                    const numeroDia = nuevaFecha.getDate();
                
                    // Para depurar el resultado en consola
                    console.log(`${nombreDia} ${numeroDia}`);
                
                    return `<th colspan="2">${nombreDia} ${numeroDia}</th>`;
                }).join('')}
                
            </tr>
            <tr>
                ${fechas.map(() => '<th>disc</th><th>pasaj</th>').join('')}
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

    // Calcular el total de pasajeros de los subtotales normales
    const totalPasajerosSubtotalesNormales = subtotalesNormales.reduce((acc, subtotal) => acc + subtotal.pasaj, 0);

    // Fila de subtotales normales (con la columna adicional)
    tabla += `
        <tr>
            <td class="subtotal" colspan="3">SUBTOTAL FRECUENCIAS</td>
            ${subtotalesNormales.map(subtotal => `<td class="resul">${subtotal.frec}</td><td class="resul">${subtotal.pasaj}</td>`).join('')}
            <td class="resul"><strong>${totalPasajerosSubtotalesNormales}</strong></td>
        </tr>
    `;

    // Calcular el total de pasajeros de los subtotales extras
    const totalPasajerosSubtotalesExtras = subtotalesExtras.reduce((acc, subtotal) => acc + subtotal.pasaj, 0);


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

    // Fila de subtotales extras (con la columna adicional)
    tabla += `
        <tr>
            <td class="subtotal" colspan="3">SUBTOTAL EXTRAS</td>
            ${subtotalesExtras.map(subtotal => `<td class="resul">${subtotal.frec}</td><td class="resul">${subtotal.pasaj}</td>`).join('')}
            <td class="resul"><strong>${totalPasajerosSubtotalesExtras}</strong></td>
        </tr>
    `;

    // Ahora, sumamos los totales generales de las frecuencias y pasajeros
    const totalGeneral = subtotalesNormales.map((sub, index) => ({
        frec: sub.frec + subtotalesExtras[index].frec,
        pasaj: sub.pasaj + subtotalesExtras[index].pasaj
    }));

    // Calcular el total general de pasajeros (sumando ambos subtotales)
    const totalPasajerosGeneral = totalGeneral.reduce((acc, subtotal) => acc + subtotal.pasaj, 0);

    // Fila de total general (con la columna adicional)
    tabla += `
        <tr class="total">
            <td colspan="3">TOTAL GENERAL</td>
            ${totalGeneral.map(sub => `<td>${sub.frec}</td><td>${sub.pasaj}</td>`).join('')}
            <td class="total"><strong>${totalPasajerosGeneral}</strong></td>
        </tr>
    `;
    // Cerrar la tabla
    tabla += `</tbody></table>`;

    // Insertar la tabla en el contenedor
    container.innerHTML = tabla;
}




function generarInformeCondensado(matuttino, vespertino, fechaInicioStr, fechaFinStr) {
    // Lista de operadores
    const operadores = matuttino.COOPERATIVA;

    // Generar todas las fechas entre fechaInicio y fechaFin
    const fechas = generarFechas(fechaInicioStr, fechaFinStr);

    // Inicializar el resumen condensado con operadores y sus frecuencias por día
    const resumenCondensado = operadores.map(operador => ({
        operador,
        dias: fechas.map(() => ({ am: 0, pm: 0 })), // Inicializar AM y PM en 0 para cada día
        fCumplen: 0,
        fNoCumplen: 0,
        porcentajeCumplimiento: 0,
        fSemanalCO: 0,
        frecuenciasDiariasCO: 0
    }));

    // Función para acumular los datos por operador y turno
    function acumularDatos(datos, tipoTurno) {
        datos.forEach(registro => {
            const fechaRegistro = registro.FECHA.split('T')[0];
            const indiceFecha = fechas.indexOf(fechaRegistro);
            const operador = registro.COOPERATIVA; // Suponiendo que los datos incluyen el nombre del operador

            if (indiceFecha !== -1) {
                const operadorData = resumenCondensado.find(op => op.operador === operador);
                if (operadorData) {
                    const frec = Array.isArray(registro.FRECUENCIA) ? registro.FRECUENCIA : [registro.FRECUENCIA];
                    
                    frec.forEach(f => {
                        if (tipoTurno === 'matutino') {
                            operadorData.dias[indiceFecha].am += f !== 0 ? 1 : 0;
                        } else {
                            operadorData.dias[indiceFecha].pm += f !== 0 ? 1 : 0;
                        }
                    });
                }
            }
        });
    }

    // Acumular datos de turnos matutino y vespertino
    acumularDatos(matuttino, 'matutino');
    acumularDatos(vespertino, 'vespertino');

    // Calcular columnas adicionales (F. CUMPLEN, F. NO CUMPLEN, etc.)
    resumenCondensado.forEach(op => {
        // Sumar las frecuencias AM y PM para calcular F. CUMPLEN
        op.fCumplen = op.dias.reduce((sum, dia) => sum + dia.am + dia.pm, 0);

        // F. NO CUMPLEN, suposiciones: cualquier día sin frecuencia cuenta como incumplido
        const totalDias = fechas.length * 2; // Doble por AM y PM
        op.fNoCumplen = totalDias - op.fCumplen;

        // Calcular el porcentaje de cumplimiento
        op.porcentajeCumplimiento = ((op.fCumplen / totalDias) * 100).toFixed(2);

        // F. SEMANAL C.O y FRECUENCIAS DIARIAS C.O
        // Suponiendo que son constantes o basadas en algún cálculo específico
        op.fSemanalCO = 0; // Modificar con el cálculo específico
        op.frecuenciasDiariasCO = 0; // Modificar con el cálculo específico
    });

    // Generar la tabla HTML para el informe condensado
    let tablaCondensada = `
    <table border="1">
        <thead>
            <tr>
                <th colspan="15">INFORME SEMANAL CONDENSADO DE SALIDA DE FRECUENCIAS INTRACANTONALES</th>
            </tr>
            <tr>
                <th colspan="15">SEMANA DEL: ${fechaInicioStr} al ${fechaFinStr}</th>
            </tr>
            <tr>
                <th>OPERADORA</th>
                ${fechas.map(fecha => {
                    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const fechaOriginal = new Date(fecha);
                    const diaIndex = fechaOriginal.getDay() + 1;
                    // Si el índice es mayor que 6, asignamos 'Domingo'
                    const nombreDia = diasSemana[diaIndex > 6 ? 0 : diaIndex]; 
                    const nuevaFecha = new Date(fechaOriginal);
                    nuevaFecha.setDate(nuevaFecha.getDate() + 1);
                    const numeroDia = nuevaFecha.getDate();
                    // Para depurar el resultado en consola
                    console.log(`${nombreDia} ${numeroDia}`);
                    return `<th colspan="2">${nombreDia} ${numeroDia}</th>`;
                }).join('')}
                <th>F. CUMPLEN</th>
                <th>F. NO CUMPLEN</th>
                <th>PORCENTAJE DE CUMPLIMIENTO</th>
                <th>F. SEMANAL C.O</th>
                <th>FRECUENCIAS DIARIAS C.O</th>
            </tr>
            <tr>
                <th></th>
                ${fechas.map(() => `<th>AM</th><th>PM</th>`).join('')}
                <th></th><th></th><th></th><th></th><th></th>
            </tr>
        </thead>
        <tbody>
    `;

    // Añadir filas de operadores y sus datos
    resumenCondensado.forEach(op => {
        tablaCondensada += `<tr><td>${op.operador}</td>`;
        op.dias.forEach(dia => {
            tablaCondensada += `<td>${dia.am}</td><td>${dia.pm}</td>`;
        });
        tablaCondensada += `
            <td>${op.fCumplen}</td>
            <td>${op.fNoCumplen}</td>
            <td>${op.porcentajeCumplimiento}</td>
            <td>${op.fSemanalCO}</td>
            <td>${op.frecuenciasDiariasCO}</td>
        </tr>`;
    });

    // Calcular y añadir totales en la última fila
    const totalFrecuenciasDiarias = resumenCondensado.reduce((sum, op) => sum + op.fCumplen, 0);
    const totalNoCumplen = resumenCondensado.reduce((sum, op) => sum + op.fNoCumplen, 0);
    const totalCumplimiento = ((totalFrecuenciasDiarias / (totalFrecuenciasDiarias + totalNoCumplen)) * 100).toFixed(2);
    let totalFSemanalCO = 0; // Calcular basado en datos específicos
    let totalFrecuenciasDiariasCO = 0; // Calcular basado en datos específicos

    tablaCondensada += `<tr><td>TOTAL FRECUENCIAS DIARIAS</td>`;
    fechas.forEach((_, i) => {
        const totalAM = resumenCondensado.reduce((sum, op) => sum + op.dias[i].am, 0);
        const totalPM = resumenCondensado.reduce((sum, op) => sum + op.dias[i].pm, 0);
        tablaCondensada += `<td>${totalAM}</td><td>${totalPM}</td>`;
    });
    tablaCondensada += `
        <td>${totalFrecuenciasDiarias}</td>
        <td>${totalNoCumplen}</td>
        <td>${totalCumplimiento}</td>
        <td>${totalFSemanalCO}</td>
        <td>${totalFrecuenciasDiariasCO}</td>
    </tr>`;

    tablaCondensada += `</tbody></table>`;

    // Insertar la tabla en el contenedor correspondiente
    document.getElementById('informeCondensado').innerHTML = tablaCondensada;
}
