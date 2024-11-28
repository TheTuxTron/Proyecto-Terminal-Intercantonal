function mostrarTabla(tablaId) {
    // Definir las tablas a mostrar/ocultar
    const tablas = ['informeMatutino', 'informeVespertino', 'informeCondensadoD', 'informeAdicional'];

    // Ocultar todas las tablas
    tablas.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });

    // Mostrar la tabla correspondiente
    if (tablaId) {
        document.getElementById(tablaId).style.display = 'block';
    }
}

function cargarInforme() {
    // Mostrar o ocultar los informes según se necesite
    document.getElementById("informeMatutino").style.display = "block";
    document.getElementById("informeVespertino").style.display = "block";
    document.getElementById("informeCondensadoD").style.display = "none";
    document.getElementById("valores").style.display = "none";
    document.getElementById("depósito").style.display = "none";
}

// Función para cargar las tablas de informes
function cargarTablas() {
    document.getElementById("informeMatutino").style.display = "none";
    document.getElementById("informeVespertino").style.display = "none";
    document.getElementById("informeCondensadoD").style.display = "block";
    document.getElementById("valores").style.display = "block";
    document.getElementById("depósito").style.display = "block";
}

function cargarCompleto() {
    document.getElementById("informeMatutino").style.display = "block";
    document.getElementById("informeVespertino").style.display = "block";
    document.getElementById("informeCondensadoD").style.display = "block";
    document.getElementById("valores").style.display = "block";
    document.getElementById("depósito").style.display = "block";
}


document.addEventListener('DOMContentLoaded', () => {
    const obtenerFechaActual = () => {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const anio = hoy.getFullYear();
        return `${anio}-${mes}-${dia}`;
    };

    document.getElementById('fechaInicio').value = obtenerFechaActual();
    document.getElementById('fechaFin').value = obtenerFechaActual();
    document.getElementById('fechaDeposito').value = obtenerFechaActual();

    // Función para mostrar/ocultar tablas
    const mostrarTabla = (tablaId) => {
        const tablas = ['informeMatutino', 'informeVespertino', 'informeCondensadoD', 'informeAdicional'];
        tablas.forEach(id => {
            document.getElementById(id).style.display = id === tablaId ? 'block' : 'none';
        });
    };

    // Llamar a la API para obtener tickets
    const cargarTickets = () => {
        const startDate = document.getElementById('fechaInicio').value;
        const endDate = document.getElementById('fechaFin').value;

        // Llamar a la API para tickets normales
        fetch(`/api/ticketsN?startDate=${startDate}&endDate=${endDate}`)
            .then(response => {
                if (!response.ok) throw new Error('Error al obtener los datos');
                return response.json();
            })
            .then(data => {
                // Verifica si data tiene el campo RANGO_TICKET
                if (data && data.RANGO_TICKET) {
                    document.getElementById('ticketsN').value = data.RANGO_TICKET;
                } else {
                    document.getElementById('ticketsN').value = 'No data';
                }
                console.log(data.RANGO_TICKET); // Depuración
            })
            .catch(error => console.error('Error al obtener tickets:', error));
            
            
        fetch(`/api/ticketsE?startDate=${startDate}&endDate=${endDate}`)
            .then(response => {
                if (!response.ok) throw new Error('Error al obtener los datos');
                return response.json();
            })
            .then(data => {
                // Verifica si data tiene el campo RANGO_TICKET
                if (data && data.RANGO_TICKET) {
                    document.getElementById('ticketsE').value = data.RANGO_TICKET;
                } else {
                    document.getElementById('ticketsE').value = 'No data';
                }
                console.log(data.RANGO_TICKET); // Depuración
            })
            .catch(error => console.error('Error al obtener tickets:', error));

            fetch(`/api/total?startDate=${startDate}&endDate=${endDate}`)
    .then(response => {
        if (!response.ok) throw new Error('Error al obtener los datos');
        return response.json();
    })
    .then(data => {
        // Verifica si data tiene el campo TOTAL_DIA
        if (data && data.TOTAL_DIA) {
            document.getElementById('total').value = '$'+data.TOTAL_DIA;
        } else {
            document.getElementById('total').value = 'No data';
        }
        console.log("data",data); // Depuración
    })
    .catch(error => console.error('Error al obtener total:', error));
    };


    // Ejecutar carga inicial
    cargarTickets();

    // Agregar listeners para recargar datos al cambiar fechas
    document.getElementById('fechaInicio').addEventListener('change', cargarTickets);
    document.getElementById('fechaFin').addEventListener('change', cargarTickets);
});

