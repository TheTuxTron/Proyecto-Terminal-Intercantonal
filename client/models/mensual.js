function toggleTable(className) {
    // Ocultar todas las tablas
    document.querySelectorAll('.disco, .pasajeros, .valores, .cumplimiento').forEach(table => {
        table.style.display = 'none';
    });

    // Mostrar la tabla seleccionada
    const selectedTable = document.querySelector(`.${className}`);
    if (selectedTable) {
        selectedTable.style.display = 'block';
    }
}


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

async function cargarValores() {
    const mes = document.getElementById("mesReporte").value;
    if (!mes) {
        alert("Por favor, seleccione un mes para generar el reporte.");
        return;
    }

    try {
        // Solicitar datos de la API
        const response = await fetch(`/api/mensual-valores?mes=${mes}`);
        if (!response.ok) {
            throw new Error("Error al obtener el reporte mensual");
        }
        
        const data = await response.json();

        // Renderizar la tabla
        renderizarValores(data);
    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo cargar el informe. Por favor, intente nuevamente.");
    }
}
function renderizarValores(data) {
    // Contenedor donde se insertará la tabla
    const container = document.querySelector(".valores");
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
    titleCell.textContent = "TERMINAL INTERCANTONAL DE RIOBAMBA - INFORME MENSUAL DE VALORES RECAUDADOS";
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
        <th>Total Diario Valores</th>
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
            <td>${row["TOTAL DIARIO VALORES"]}</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Insertar tabla en el contenedor
    container.appendChild(table);
}


document.addEventListener("DOMContentLoaded", () => {
    cargarCooperativas();
    document.getElementById("filtrarReporte").addEventListener("click", cargarPasajeros);
});

// Cargar las cooperativas en el selector
async function cargarCooperativas() {
    try {
        const response = await fetch("/api/cooperativas");
        if (!response.ok) {
            throw new Error("Error al obtener cooperativas");
        }

        const cooperativas = await response.json();
        const selectCooperativa = document.getElementById("cooperativaSelect");

        cooperativas.forEach(({ COOPERATIVA }) => {
            const option = document.createElement("option");
            option.value = COOPERATIVA;
            option.textContent = COOPERATIVA;
            selectCooperativa.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar cooperativas:", error);
        alert("No se pudieron cargar las cooperativas.");
    }
}

// Cargar los pasajeros filtrados por mes y cooperativa
async function cargarPasajeros() {
    const mes = document.getElementById("mesReporte").value;
    const cooperativa = document.getElementById("cooperativaSelect").value;

    if (!mes) {
        alert("Por favor, seleccione un mes para generar el reporte.");
        return;
    }

    try {
        const url = `/api/mensual-pasajeros?mes=${mes}${cooperativa ? `&cooperativa=${cooperativa}` : ""}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Error al obtener el reporte mensual");
        }

        const data = await response.json();
        renderizarPasajeros(data);
    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo cargar el informe. Por favor, intente nuevamente.");
    }
}

// Renderizar la tabla con los datos o mostrar un mensaje si no hay datos
function renderizarPasajeros(data) {
    const container = document.querySelector(".pasajeros");
    if (!container) {
        console.error("El contenedor '.pasajeros' no existe.");
        return;
    }

    // Limpiar el contenido existente
    container.innerHTML = "";

    if (data.length === 0) {
        // Mostrar un mensaje si no hay datos
        const message = document.createElement("p");
        message.textContent = "No hay datos disponibles para la cooperativa seleccionada.";
        message.style.textAlign = "center"; // Opcional, para centrar el mensaje
        container.appendChild(message);
        return;
    }

    // Crear y agregar nueva tabla
    const table = document.createElement("table");
    table.classList.add("report-table");

    // Encabezados
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
        <th>Cooperativa</th>
        <th>Destino</th>
        <th>Total Pasajeros</th>
    `;
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Cuerpo
    const tbody = document.createElement("tbody");
    data.forEach(({ COOPERATIVA, DESTINO, TOTAL_PASAJEROS }) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${COOPERATIVA}</td>
            <td>${DESTINO}</td>
            <td>${TOTAL_PASAJEROS}</td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}
