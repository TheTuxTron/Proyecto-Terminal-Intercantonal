// Establecer las tablas que estarán visibles por defecto (inicialmente todas ocultas)
function inicializarTablas() {
    const todasLasTablas = ['informeMatutino', 'informeVespertino', 'informeCondensadoD', 'valores', 'depósito'];
    todasLasTablas.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';  // Inicialmente todas las tablas están ocultas
        }
    });
}

// Función para mostrar u ocultar las tablas específicas
function toggleDisplay(elementsToShow = [], elementsToHide = []) {
    // Ocultar los elementos especificados en elementsToHide
    elementsToHide.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });

    // Mostrar los elementos especificados en elementsToShow
    elementsToShow.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'block';
        }
    });
}

function cargarInforme() {
    // Asegurarse de ocultar todo antes de mostrar solo las tablas correspondientes a este informe
    toggleDisplay(['informeMatutino', 'informeVespertino'], ['informeCondensadoD', 'valores', 'depósito']);
    
    // Mostrar los otros dos botones después de hacer clic en "Informe Turno Mañana-Tarde"
    document.getElementById('generarTablas').style.display = 'inline-block';
    document.getElementById('generarCompleto').style.display = 'inline-block';
}

function cargarTablas() {
    // Asegurarse de ocultar todo antes de mostrar solo las tablas correspondientes a este informe
    toggleDisplay(['informeCondensadoD', 'valores', 'depósito'], ['informeMatutino', 'informeVespertino']);
}

function cargarCompleto() {
    // Asegurarse de mostrar todas las tablas cuando se hace clic en "Generar Informe Completo"
    toggleDisplay(['informeMatutino', 'informeVespertino', 'informeCondensadoD', 'valores', 'depósito'], []);
}

// Inicializar las tablas al cargar la página
document.addEventListener('DOMContentLoaded', inicializarTablas);

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
                const ticketsInput = document.getElementById('ticketsN');
                
                // Verifica si data tiene el campo RANGO_TICKET
                if (data && data.RANGO_TICKET) {
                    // Si el rango es estrictamente 'a', se muestra 'No aplica'
                    if (data.RANGO_TICKET.trim() === 'a') {
                        ticketsInput.value = 'No aplica';
                    } else {
                        ticketsInput.value = data.RANGO_TICKET;
                    }
                } else {
                    // Si no hay datos, se muestra 'No data'
                    ticketsInput.value = 'No data';
                }
            
                // Consola para depuración
                console.log(data.RANGO_TICKET || 'Sin valor en RANGO_TICKET');
            })
            
            .catch(error => console.error('Error al obtener tickets:', error));
            
            
        fetch(`/api/ticketsE?startDate=${startDate}&endDate=${endDate}`)
            .then(response => {
                if (!response.ok) throw new Error('Error al obtener los datos');
                return response.json();
            })
            .then(data => {
                const ticketsInput = document.getElementById('ticketsE');
                
                // Verifica si data tiene el campo RANGO_TICKET
                if (data && data.RANGO_TICKET) {
                    // Si el rango es estrictamente 'a', se muestra 'No aplica'
                    if (data.RANGO_TICKET.trim() === 'a') {
                        ticketsInput.value = 'No aplica';
                    } else {
                        ticketsInput.value = data.RANGO_TICKET;
                    }
                } else {
                    // Si no hay datos, se muestra 'No data'
                    ticketsInput.value = 'No data';
                }
            
                // Consola para depuración
                console.log(data.RANGO_TICKET || 'Sin valor en RANGO_TICKET');
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
            document.getElementById('total').value = 'Valor no encontrado';
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

