function cargarSeccion(seccion) {
    const contenidoPrincipal = document.getElementById('contenidoPrincipal');
    contenidoPrincipal.innerHTML = '';  // Limpiar contenido anterior

    switch (seccion) {
        case 'usuarios':
            cargarUsuarios(contenidoPrincipal);
            break;
        case 'frecuencias':
            cargarProductos(contenidoPrincipal);
            break;
        default:
            contenidoPrincipal.innerHTML = '<p>Sección no encontrada.</p>';
    }
}

async function cargarUsuarios(contenidoPrincipal) {
    // Crear el contenedor para la tabla y la búsqueda
    const contenedor = document.createElement('div');
    
    // Función para cargar los usuarios desde la API
    try {
        const response = await fetch(`/api/usuarios`);
        console.log(response);
        if (!response.ok) {
            throw new Error("Error al obtener los registros");
        }

        const usuarios = await response.json();
        
        // Crear la barra de búsqueda
        const busqueda = document.createElement('input');
        busqueda.type = 'text';
        busqueda.placeholder = 'Buscar usuario por nombre...';
        busqueda.id = 'buscarUsuario';
        busqueda.addEventListener('input', filtrarUsuarios);
        
        // Título de la sección
        const titulo = document.createElement('h2');
        titulo.innerText = 'Gestión de Usuarios';
        
        // Crear la tabla
        const tabla = document.createElement('table');
        tabla.id = 'tablaUsuarios';
        const encabezado = document.createElement('tr');
        encabezado.innerHTML = '<th>Cédula</th><th>Nombre</th><th>Celular</th><th>Rol</th><th>Operaciones</th>';
        tabla.appendChild(encabezado);
        
        // Agregar los usuarios a la tabla
        usuarios.forEach(usuario => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${usuario.cedula}</td>
                <td>${usuario.nombre}</td>
                <td>${usuario.celular}</td>
                <td>${usuario.rol}</td>
                <td>
                    <button onclick="editarUsuario('${usuario.cedula}')">Editar</button>
                    <button onclick="eliminarUsuario('${usuario.cedula}')">Eliminar</button>
                </td>
            `;
            tabla.appendChild(fila);
        });

        // Añadir los elementos al contenedor principal
        contenedor.appendChild(titulo);
        contenedor.appendChild(busqueda);
        contenedor.appendChild(tabla);
        contenidoPrincipal.appendChild(contenedor);

        // Función para filtrar usuarios por nombre
        function filtrarUsuarios() {
            const filtro = busqueda.value.toLowerCase();
            const filas = document.querySelectorAll('#tablaUsuarios tr');
            filas.forEach(fila => {
                const nombre = fila.cells[1] ? fila.cells[1].innerText.toLowerCase() : '';
                if (nombre.includes(filtro)) {
                    fila.style.display = '';
                } else {
                    fila.style.display = 'none';
                }
            });
        }

        // Función para editar usuario
        window.editarUsuario = function(cedula) {
            alert(`Editar usuario con cédula: ${cedula}`);
            // Lógica para editar el usuario
        };

        // Función para eliminar usuario
        window.eliminarUsuario = function(cedula) {
            if (confirm(`¿Estás seguro de eliminar el usuario con cédula: ${cedula}?`)) {
                fetch(`/api/usuarios/${cedula}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (response.ok) {
                        alert('Usuario eliminado');
                        cargarUsuarios(contenidoPrincipal);  // Recargar la lista de usuarios
                    } else {
                        alert('Error al eliminar el usuario');
                    }
                })
                .catch(error => {
                    console.error('Error al eliminar el usuario:', error);
                    alert('Hubo un error al eliminar el usuario');
                });
            }
        };

    } catch (error) {
        console.error("Error al cargar los registros:", error);
    }
}



function cargarFrecuencias(contenidoPrincipal) {
    fetch('/api/frecuencias')
        .then(response => response.json())
        .then(data => {
            const tabla = document.createElement('table');
            const encabezado = document.createElement('tr');
            encabezado.innerHTML = '<th>ID</th><th>Nombre</th><th>Precio</th>';
            tabla.appendChild(encabezado);

            data.forEach(producto => {
                const fila = document.createElement('tr');
                fila.innerHTML = `<td>${producto.id}</td><td>${producto.nombre}</td><td>${producto.precio}</td>`;
                tabla.appendChild(fila);
            });

            contenidoPrincipal.appendChild(tabla);
        })
        .catch(error => {
            console.error('Error al obtener productos:', error);
            contenidoPrincipal.innerHTML = '<p>Hubo un error al cargar los productos.</p>';
        });
}

