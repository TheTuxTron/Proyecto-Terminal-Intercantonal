document.addEventListener('DOMContentLoaded', () => {
    const contenidoPrincipal = document.getElementById('contenidoPrincipal');
    cargarUsuarios(contenidoPrincipal);
});

async function cargarUsuarios(contenidoPrincipal) {
    const contenedor = document.createElement('div');
    
    try {
        const response = await fetch(`/api/usuarios`);
        if (!response.ok) {
            throw new Error("Error al obtener los registros");
        }

        const usuarios = await response.json();

        const busqueda = document.createElement('input');
        busqueda.type = 'text';
        busqueda.placeholder = 'Buscar usuario por nombre';
        busqueda.id = 'buscarUsuario';
        busqueda.addEventListener('input', filtrarUsuarios);


        // Crear contenedor para la barra de búsqueda y el botón
        const contenedorBusquedaYBoton = document.createElement('div');

                contenedorBusquedaYBoton.appendChild(busqueda);
        //contenedorBusquedaYBoton.appendChild(btnNuevoUsuario);

        // Crear formulario para agregar usuario (inicialmente oculto)
        const formAgregarUsuario = document.createElement('form');
        formAgregarUsuario.id = 'formAgregarUsuario';
        formAgregarUsuario.style.display = 'none';  // Inicialmente oculto
        formAgregarUsuario.innerHTML = `
            <h3>Registrar Nuevo Usuario</h3>
            <label for="cedula">Cédula:</label><br>
            <input type="text" id="cedula" required><br>
            <label for="nombre">Nombre:</label><br>
            <input type="text" id="nombre" required><br>
            <label for="celular">Celular:</label><br>
            <input type="text" id="celular" required><br>
            <label for="rol">Rol:</label><br>
            <select id="rol" required>
                <option value="usuario">Usuario</option>
                <option value="administrador">Administrador</option>
                <option value="secretaria">Secretaria</option>
            </select><br><br>
            <button type="submit">Registrar</button>
        `;
        
        formAgregarUsuario.addEventListener('submit', async (event) => {
            event.preventDefault();
            await registrarUsuario();
        });

        const tabla = document.createElement('table');
        tabla.id = 'tablaUsuarios';
        const encabezado = document.createElement('tr');
        encabezado.innerHTML = '<th>Cédula</th><th>Nombre</th><th>Celular</th><th>Rol</th><th>Estado</th><th>Acción</th>';
        tabla.appendChild(encabezado);

        // Crear un espacio antes de la tabla
        const espacioAntesDeTabla = document.createElement('div');
        espacioAntesDeTabla.style.marginBottom = '20px'; // Ajusta el espacio como desees
        contenedor.appendChild(espacioAntesDeTabla); // Agregar el espacio al contenedor

        usuarios.forEach(usuario => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${usuario.CEDULA || 'Sin cédula'}</td>
                <td>${usuario.NOMBRE || 'Sin nombre'}</td>
                <td>${usuario.NUMERO_CELULAR || 'Sin celular'}</td>
                <td>${usuario.ROL || 'Sin rol'}</td>
                <td>${usuario.ESTADO || 'Sin estado'}</td>
                <td>
                    <button class="editar">Editar</button>
                    <button class="guardar" style="display:none;">Guardar</button>
                </td>
            `;
            tabla.appendChild(fila);

            // Agregar eventos a los botones
            const btnEditar = fila.querySelector('.editar');
            const btnGuardar = fila.querySelector('.guardar');

            btnEditar.addEventListener('click', () => {
                editarFila(fila, btnEditar, btnGuardar);
            });

            btnGuardar.addEventListener('click', () => {
                guardarCambios(fila, usuario.CEDULA, btnEditar, btnGuardar);
            });


        });
        contenedorBusquedaYBoton.appendChild(tabla);
        contenedor.appendChild(busqueda);
        //contenedor.appendChild(btnNuevoUsuario);  // Agregar el botón "Nuevo Usuario"
        contenedor.appendChild(formAgregarUsuario);  // Agregar el formulario al contenedor
        contenedor.appendChild(tabla);
        contenidoPrincipal.appendChild(contenedor);

        function filtrarUsuarios() {
            const filtro = busqueda.value.toLowerCase();
            const filas = document.querySelectorAll('#tablaUsuarios tr');
            filas.forEach(fila => {
                const nombre = fila.cells[1]?.innerText.toLowerCase() || '';
                fila.style.display = nombre.includes(filtro) ? '' : 'none';
            });
        }

        async function registrarUsuario() {
            const cedula = document.getElementById('cedula').value;
            const nombre = document.getElementById('nombre').value;
            const celular = document.getElementById('celular').value;
            const rol = document.getElementById('rol').value;
        
            const nuevoUsuario = { cedula, nombre, celular, rol };
        
            const response = await fetch('/api/registrarusuario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevoUsuario),
            });
        
            if (response.ok) {
                alert('Usuario registrado exitosamente');
                // Solo recargar la lista de usuarios aquí
                window.location.reload(true); // Fuerza la recarga desde el servidor
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        }

        function editarFila(fila, btnEditar, btnGuardar) {
            const celdas = fila.querySelectorAll('td');
            const nombreCelda = celdas[1];
            const celularCelda = celdas[2];
            const rolCelda = celdas[3];
            const estadoCelda = celdas[4];

            nombreCelda.innerHTML = `<input type="text" value="${nombreCelda.textContent}">`;
            celularCelda.innerHTML = `<input type="text" value="${celularCelda.textContent}">`;
            rolCelda.innerHTML = `
                <select>
                    <option value="usuario" ${rolCelda.textContent === 'usuario' ? 'selected' : ''}>Usuario</option>
                    <option value="administrador" ${rolCelda.textContent === 'administrador' ? 'selected' : ''}>Administrador</option>
                    <option value="secretaria" ${rolCelda.textContent === 'secretaria' ? 'selected' : ''}>Secretaria</option>
                    </select>
            `;
            estadoCelda.innerHTML = `
                <select>
                    <option value="activo" ${estadoCelda.textContent === 'activo' ? 'selected' : ''}>activo</option>
                    <option value="inactivo" ${estadoCelda.textContent === 'inactivo' ? 'selected' : ''}>inactivo</option>
                    </select>
            `;
            btnEditar.style.display = 'none';
            btnGuardar.style.display = '';
        }

        function guardarCambios(fila, cedula, btnEditar, btnGuardar) {
            const celdas = fila.querySelectorAll('td');
            const nombre = celdas[1].querySelector('input').value;
            const celular = celdas[2].querySelector('input').value;
            const rol = celdas[3].querySelector('select').value;
            const estado = celdas[4].querySelector('select').value;

            const datos = { nombre, celular, rol, estado };
            console.log('Datos enviados:', datos);

            fetch(`/api/usuarios/${cedula}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos),
            })
            .then(response => {
                if (response.ok) {
                    alert('Usuario actualizado correctamente');
                    celdas[1].textContent = nombre;
                    celdas[2].textContent = celular;
                    celdas[3].textContent = rol;
                    celdas[4].textContent = estado;

                    btnGuardar.style.display = 'none';
                    btnEditar.style.display = '';
                } else {
                    alert('Error al actualizar el usuario');
                }
            })
            .catch(error => {
                console.error('Error al actualizar el usuario:', error);
            });
        }


    } catch (error) {
        console.error('Error cargando los usuarios:', error);
    }
}
/* 
async function cargarFrecuencias(contenidoPrincipal) {
    const contenedor = document.createElement('div');

    try {
        const response = await fetch(`/api/frecuenciasg`);
        if (!response.ok) throw new Error("Error al obtener los registros");
        const frecuencias = await response.json();

        const busqueda = document.createElement('input');
        busqueda.type = 'text';
        busqueda.placeholder = 'Buscar frecuencia por fecha (aaaa-mm-dd)';
        busqueda.id = 'buscarFrecuencia';
        busqueda.addEventListener('input', filtrarFrecuencias);

        const titulo = document.createElement('h2');
        titulo.innerText = 'Gestión de Frecuencias registradas';

        const contenedorBusquedaYBoton = document.createElement('div');
        contenedorBusquedaYBoton.appendChild(busqueda);

        const tabla = document.createElement('table');
        tabla.id = 'tablaFrecuencias';
        const encabezado = document.createElement('tr');
        encabezado.innerHTML = `
            <th>Cooperativa</th>
            <th>Usuario</th>
            <th>Destino</th>
            <th>Hora</th>
            <th>Fecha</th>
            <th>Disco</th>
            <th>Num. Pasajeros</th>
            <th>Tipo Frecuencia</th>
            <th>Valor</th>
            <th>Num. Ticket</th>
            <th>Acciones</th>`;
        tabla.appendChild(encabezado);

        frecuencias.forEach(frecuencia => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${frecuencia.COOPERATIVA || 'Sin dato'}</td>
                <td>${frecuencia.USUARIO || 'Sin dato'}</td>
                <td>${frecuencia.DESTINO || 'Sin dato'}</td>
                <td>${frecuencia.HORA || 'Sin dato'}</td>
                <td>${frecuencia.FECHA || 'Sin dato'}</td>
                <td>${frecuencia.FRECUENCIA || 'Sin dato'}</td>
                <td>${frecuencia.NUM_PASAJEROS || 'Sin dato'}</td>
                <td>${frecuencia.TIPO_FREC || 'Sin dato'}</td>
                <td>${frecuencia.VALOR || 'Sin dato'}</td>
                <td>${frecuencia.NUM_TICKET || 'Sin dato'}</td>
                <td>
                    <button class="editar">Editar</button>
                    <button class="guardar" style="display:none;">Guardar</button>
                </td>
            `;
            tabla.appendChild(fila);

            const btnEditar = fila.querySelector('.editar');
            const btnGuardar = fila.querySelector('.guardar');

            btnEditar.addEventListener('click', () => editarFila(fila, btnEditar, btnGuardar));
            btnGuardar.addEventListener('click', () => guardarCambios(fila, btnEditar, btnGuardar));
        });

        contenedorBusquedaYBoton.appendChild(tabla);
        contenedor.appendChild(titulo);
        contenedor.appendChild(contenedorBusquedaYBoton);
        contenidoPrincipal.appendChild(contenedor);

        function filtrarFrecuencias() {
            const filtro = busqueda.value.toLowerCase();
            const filas = Array.from(tabla.querySelectorAll('tr')).slice(1); // Excluir encabezado
            filas.forEach(fila => {
                const fecha = fila.cells[4]?.innerText.toLowerCase() || ''; // Columna de fecha
                fila.style.display = fecha.includes(filtro) ? '' : 'none';
            });
        }

        function editarFila(fila, btnEditar, btnGuardar) {
            const celdas = fila.querySelectorAll('td');
            celdas.forEach((celda, index) => {
                if (index < 10) { // No editar columna de acciones
                    const valor = celda.textContent.trim();
                    celda.innerHTML = `<input type="text" value="${valor}">`;
                }
            });
            btnEditar.style.display = 'none';
            btnGuardar.style.display = '';
        }

        function guardarCambios(fila, btnEditar, btnGuardar) {
            const celdas = fila.querySelectorAll('td');
            const datos = {
                cooperativa: celdas[0].querySelector('input').value,
                usuario: celdas[1].querySelector('input').value,
                destino: celdas[2].querySelector('input').value,
                hora: celdas[3].querySelector('input').value,
                fecha: celdas[4].querySelector('input').value,
                frecuencia: celdas[5].querySelector('input').value,
                pasajeros: celdas[6].querySelector('input').value,
                tipo: celdas[7].querySelector('input').value,
                valor: celdas[8].querySelector('input').value,
                ticket: celdas[9].querySelector('input').value
            };
            console.log(datos);
            let ruta = `/api/frecuenciase/${datos.cooperativa}/${datos.hora}/${datos.fecha}/${datos.usuario}/${datos.ticket}`;
            if (datos.tipo !== 'EXTRA') {
                ruta = `/api/frecuenciasn/${datos.cooperativa}/${datos.hora}/${datos.fecha}/${datos.usuario}/${datos.ticket}`;
            }

            fetch(ruta, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos),
            })
                .then(response => {
                    if (!response.ok) throw new Error("Error al actualizar los datos");
                    alert('Datos actualizados correctamente');
                    celdas.forEach((celda, index) => {
                        if (index < 10) {
                            celda.textContent = celdas[index].querySelector('input').value;
                        }
                    });
                    btnGuardar.style.display = 'none';
                    btnEditar.style.display = '';
                })
                .catch(error => {
                    console.error('Error al actualizar los datos:', error);
                    alert('Error al actualizar los datos');
                });
        }
    } catch (error) {
        console.error('Error cargando las frecuencias:', error);
    }
}
 */