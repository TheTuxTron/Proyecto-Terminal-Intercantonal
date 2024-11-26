async function cargarDisco() {
    const mes = document.getElementById("mesReporte").value;
    if (!mes) {
        alert("Por favor, seleccione un mes para generar el reporte.");
        return;
    }

    try {
        // Solicitar datos de la API
        const response = await fetch(`/api/mensual-disco?mes=${mes}`);
        if (!response.ok) {
            throw new Error("Error al obtener el reporte mensual");
        }
        
        const data = await response.json();

        // Renderizar la tabla
        renderizarDisco(data);
    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo cargar el informe. Por favor, intente nuevamente.");
    }
}
function renderizarDisco(data) {
    // Contenedor donde se insertará la tabla
    const container = document.querySelector(".disco");
    const existingTable = document.querySelector("table");
    if (existingTable) existingTable.remove(); // Eliminar tabla existente si ya hay una

    // Crear tabla
    const table = document.createElement("table");
    table.classList.add("report-table");

    // Crear encabezados
    const thead = document.createElement("thead");

    // Título principal
    const titleRow = document.createElement("tr");
    const titleCell = document.createElement("th");
    titleCell.setAttribute("colspan", "6");
    titleCell.textContent = "TERMINAL INTERCANTONAL DE RIOBAMBA - INFORME MENSUAL DE INGRESO DE FRECUENCIAS";
    titleCell.classList.add("table-title");
    titleRow.appendChild(titleCell);
    thead.appendChild(titleRow);

    // Sub-encabezados para las columnas
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = ` 
        <th>Fecha</th>
        <th>Turno Mañana Normal</th>
        <th>Turno Mañana Extra</th>
        <th>Turno Tarde Normal</th>
        <th>Turno Tarde Extra</th>
        <th>Total Diario Frecuencias</th>
    `;
    thead.appendChild(headerRow);

    table.appendChild(thead);

    // Crear cuerpo de la tabla
    const tbody = document.createElement("tbody");
    data.forEach(row => {
        const tr = document.createElement("tr");

        // Comprobar si la fila corresponde al total
        if (row.FECHA === 'TOTAL') {
            tr.style.backgroundColor = '#007bff'; // Cambiar color de fondo a azul
            tr.style.color = 'white'; // Asegurarse de que el texto sea visible
        }

        tr.innerHTML = `
            <td>${row.FECHA}</td>
            <td>${row["TURNO MAÑANA NORMAL"]}</td>
            <td>${row["TURNO MAÑANA EXTRA"]}</td>
            <td>${row["TURNO TARDE NORMAL"]}</td>
            <td>${row["TURNO TARDE EXTRA"]}</td>
            <td>${row["TOTAL DIARIO FRECUENCIAS"]}</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Insertar tabla en el contenedor
    container.appendChild(table);
}

async function cargarCumplimiento() {
    const mes = document.getElementById("mesReporte").value;
    if (!mes) {
        alert("Por favor, seleccione un mes para generar el reporte.");
        return;
    }

    try {
        // Solicitar datos de la API
        const response = await fetch(`/api/cumplimiento?mesReporte=${mes}`);

        if (!response.ok) {
            throw new Error("Error al obtener el reporte mensual");
        }   
        const data = await response.json();

        renderizarCumplimiento(data);
    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo cargar el informe. Por favor, intente nuevamente.");
    }
}
function renderizarCumplimiento(data) {
    // Contenedor donde se insertará la tabla
    const container = document.querySelector(".cumplimiento");
    const existingTable = container.querySelector("table");
    if (existingTable) existingTable.remove();


    // Crear tabla
    const table = document.createElement("table");
    table.classList.add("report-table");

    // Crear encabezados
    const thead = document.createElement("thead");

    // Título principal
    const titleRow = document.createElement("tr");
    const titleCell = document.createElement("th");
    titleCell.setAttribute("colspan", "6");
    titleCell.textContent = "TERMINAL INTERCANTONAL DE RIOBAMBA - INFORME MENSUAL DE CUMPLIMIENTO DE FRECUENCIAS";
    titleCell.classList.add("table-title");
    titleRow.appendChild(titleCell);
    thead.appendChild(titleRow);

    // Sub-encabezados para las columnas
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = ` 
        <th>Cooperativa</th>
        <th>Frecuencias Diarias por cumplir</th>
        <th>Frecuencias mensuales por cumplir</th>
        <th>Frecuencias que cumplieron en el mes</th>
        <th>Frecuencias que no cumplieron en el mes</th>
        <th>Porcentaje mensual de cumplimiento</th>
    `;
    thead.appendChild(headerRow);

    table.appendChild(thead);

    // Crear cuerpo de la tabla
    const tbody = document.createElement("tbody");
    data.forEach(row => {
        const tr = document.createElement("tr");

        // Comprobar si la fila corresponde al total
        if (row.COOPERATIVA === 'TOTAL') {
            tr.style.backgroundColor = '#007bff'; // Cambiar color de fondo a azul
            tr.style.color = 'white'; // Asegurarse de que el texto sea visible
        }

        tr.innerHTML = `
            <td>${row.COOPERATIVA}</td>
            <td>${row.frecuencia_diaria}</td>
            <td>${row.frecuencia_mensual}</td>
            <td>${row.total_frecuencias}</td>
            <td>${row.frecuencias_no_cumplen}</td>
            <td>${row.porcentaje_cumplimiento}%</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Insertar tabla en el contenedor
    container.appendChild(table);
}
