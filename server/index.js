const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
const db = require('./database');
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'tu_clave_secreta'; // Cambia esta clave en producción

app.use(express.static('../client'));
app.use(express.json());
app.use(cors());

// Endpoint de autenticación con generación de JWT
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM USUARIOS WHERE CEDULA = ? AND CONTRASEÑA = ?`, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error en el servidor' });
        }
        if (row) {
            //console.log(row); 
            // Generar token JWT con la información relevante
            const token = jwt.sign(
                { cedula: row.CEDULA, nombre: row.NOMBRE, rol: row.ROL, estado: row.ESTADO },
                SECRET_KEY,
                { expiresIn: '24h' }
            );
            res.json({ mensaje: "Login exitoso", token });
        } else {
            res.status(401).json({ mensaje: "Credenciales incorrectas" });
        }
    });
});

// Middleware para verificar el token
function verificarToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ mensaje: 'No se proporcionó token' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ mensaje: 'Token inválido' });
        req.user = decoded; // Guardar info del usuario en `req.user`
        next();
    });
}

app.get('/api/protegido', verificarToken, (req, res) => {
    res.json({ mensaje: "Contenido protegido", user: req.user });
});

app.listen(PORT, () => {
    try{
        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    }catch(error){
        console.log("Error al iniciar "+error);
    }
    
});

app.get('/api/get-options', (req, res) => {
    try {
        db.all('SELECT DISTINCT COOPERATIVA FROM FRECUENCIAS', [], (err, rows) => {
            if (err) {
                console.error("Error al obtener cooperativas:", err);
                return res.status(500).json({ error: 'Error al obtener cooperativas' });
            }
            res.json(rows); // Devuelve los datos sin repeticiones
        });
    } catch (error) {
        console.error("Error al obtener cooperativas:", error);
        res.status(500).json({ error: 'Error al obtener cooperativas' });
    }
});

app.get('/api/get-destinos', (req, res) => {
    try {
        db.all('SELECT DISTINCT DESTINO FROM FRECUENCIAS ', [], (err, rows) => {
            if (err) {
                console.error("Error al obtener destinos:", err);
                return res.status(500).json({ error: 'Error al obtener DESTINOS' });
            }
            res.json(rows); // Devuelve los datos sin repeticiones
        });
    } catch (error) {
        console.error("Error al obtener DESTINOS:", error);
        res.status(500).json({ error: 'Error al obtener DESTINOS' });
    }
});

app.get('/api/get-horas', (req, res) => {
    // Determinar si es MAÑANA o TARDE
    const horaActual = new Date().getHours(); // Devuelve la hora en formato 24h
    const jornada = horaActual < 13 ? 'MAÑANA' : 'TARDE';

    const query = `
        SELECT DISTINCT HORA
        FROM FRECUENCIAS
        WHERE JORNADA = ?
        ORDER BY HORA
    `;
    try {
        db.all(query, [/*cooperativa, destino,*/jornada], (err, rows) => {
            if (err) {
                console.error("Error al obtener horas:", err);
                return res.status(500).json({ error: 'Error al obtener horas' });
            }
            res.json(rows); // Devuelve las horas con la jornada filtrada
        });
    } catch (error) {
        console.error("Error al obtener HORAS:", error);
        res.status(500).json({ error: 'Error al obtener HORAS' });
    }
});

app.post('/api/registrarViaje', (req, res) => {
    const { cooperativa, usuario, destino, hora, fecha, frecuencia, numPasajeros, tipoFrecuencia, valor, numTicket } = req.body;

    // Definir la tabla de destino según el tipo de frecuencia
    const table = tipoFrecuencia === "NORMAL" ? "REGISTRO" : "REGISTRO_EXTRA";

    // Lógica de registro: validar si el viaje ya está registrado en la tabla correspondiente
    db.get(`SELECT * FROM ${table} WHERE COOPERATIVA = ? AND HORA = ? AND FECHA = ? AND USUARIO = ? AND NUM_TICKET = ?`, 
    [cooperativa, hora, fecha, usuario, numTicket], (err, row) => {
        if (err) {
            console.error("Error al verificar viaje:", err);
            return res.status(500).json({ error: 'Error al verificar viaje' });
        }
        if (row) {
            // Si ya existe, devolver un error
            return res.json({ success: false, error: "Viaje ya registrado." });
        } else {
            // Insertar el nuevo registro de viaje en la tabla correspondiente
            const query = `INSERT INTO ${table} (COOPERATIVA, USUARIO, DESTINO, HORA, FECHA, FRECUENCIA, NUM_PASAJEROS, TIPO_FREC, VALOR, NUM_TICKET) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(query, [cooperativa, usuario, destino, hora, fecha, frecuencia, numPasajeros, tipoFrecuencia, valor, numTicket], function (err) {
                if (err) {
                    console.error("Error al registrar viaje:", err);
                    return res.status(500).json({ error: 'Error al registrar viaje' });
                }
                res.json({ success: true });
            });
        }
    });
});

// Endpoint para obtener cooperativas basadas en la hora seleccionada
app.get('/api/getCooperativas', (req, res) => {
    const hora = req.query.hora;

    if (!hora) {
        return res.status(400).json({ error: 'Hora no proporcionada' });
    }

    const query = `
        SELECT DISTINCT COOPERATIVA
        FROM FRECUENCIAS
        WHERE HORA = ?
    `;

    db.all(query, [hora], (err, rows) => {
        if (err) {
            console.error("Error al obtener cooperativas:", err);
            return res.status(500).json({ error: 'Error al obtener cooperativas' });
        }
        res.json(rows); // Devuelve las cooperativas
    });
});


app.get('/api/getDestinos', (req, res) => {
    const { cooperativa, hora, tipoFrecuencia } = req.query;
    
    if (!cooperativa) {
        return res.status(400).json({ error: 'Cooperativa no proporcionada' });
    }

    // Si no se proporciona la hora, cargamos los destinos solo por cooperativa
    let query = `
        SELECT DISTINCT DESTINO
        FROM FRECUENCIAS
        WHERE COOPERATIVA = ?
        ORDER BY DESTINO
    `;
    let params = [cooperativa];

    // Si se proporciona la hora, se agrega a la consulta
    if (hora && tipoFrecuencia === "NORMAL") {
        query = `
            SELECT DISTINCT DESTINO
            FROM FRECUENCIAS
            WHERE COOPERATIVA = ? AND HORA = ?
            ORDER BY DESTINO
        `;
        params.push(hora); // Se añade la hora a los parámetros
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error("Error al obtener destinos:", err);
            return res.status(500).json({ error: 'Error al obtener destinos' });
        }
        res.json(rows); // Devuelve los destinos filtrados
    });
});

app.get('/api/registro', (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Debe proporcionar las fechas de inicio y fin' });
    }

    const query = 'SELECT * FROM REGISTRO WHERE FECHA BETWEEN ? AND ? ORDER BY HORA';

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error("Error al obtener REGISTROS:", err);
            return res.status(500).json({ error: 'Error al obtener REGISTROS' });
        }

        res.json(rows); // Devuelve los datos obtenidos
    });
});

app.get('/api/extra', (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Debe proporcionar las fechas de inicio y fin' });
    }

    const query = 'SELECT * FROM REGISTRO_EXTRA WHERE FECHA BETWEEN ? AND ? ORDER BY HORA';

    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error("Error al obtener extras:", err);
            return res.status(500).json({ error: 'Error al obtener extras' });
        }

        res.json(rows); // Devuelve los datos obtenidos
    });
});


app.get('/api/condensado', (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Debe proporcionar las fechas de inicio y fin' });
    }

    const query = `
        SELECT
            COOPERATIVA,
            FECHA,
            SUM(CASE WHEN CAST(SUBSTR(HORA, 1, 3) AS INTEGER) < 13 THEN 1 ELSE 0 END) AS frecuencias_manana,
            SUM(CASE WHEN CAST(SUBSTR(HORA, 1, 3) AS INTEGER) >= 13 THEN 1 ELSE 0 END) AS frecuencias_tarde
        FROM (
            SELECT COOPERATIVA, HORA, FECHA FROM REGISTRO
            WHERE FECHA BETWEEN ? AND ?
            UNION ALL
            SELECT COOPERATIVA, HORA, FECHA FROM REGISTRO_EXTRA
            WHERE FECHA BETWEEN ? AND ?
        ) AS todas_frecuencias
        GROUP BY COOPERATIVA, FECHA;
    `;

    db.all(query, [startDate, endDate, startDate, endDate], (err, rows) => {
        if (err) {
            console.error("Error al obtener frecuencias:", err);
            return res.status(500).json({ error: 'Error al obtener frecuencias' });
        }

        res.json(rows); // Devuelve los datos obtenidos
    });
});

app.get('/api/valores', (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Debe proporcionar las fechas de inicio y fin' });
    }

    const query = `
        SELECT 
            FECHA,
            SUM(CASE WHEN HORA <= '13:00' THEN VALOR ELSE 0 END) AS TOTAL_MANANA,
            SUM(CASE WHEN HORA > '13:00' THEN VALOR ELSE 0 END) AS TOTAL_TARDE,
            SUM(VALOR) AS TOTAL_DIA -- Columna adicional para el total del día
        FROM (
            SELECT FECHA, HORA, VALOR FROM REGISTRO_EXTRA
            WHERE FECHA BETWEEN ? AND ? -- reemplaza con las fechas deseadas
            UNION ALL
            SELECT FECHA, HORA, VALOR FROM REGISTRO
            WHERE FECHA BETWEEN ? AND ? -- reemplaza con las fechas deseadas
        ) AS combined_records
        GROUP BY 
            FECHA
        ORDER BY 
            FECHA;
    `;

    db.all(query, [startDate, endDate, startDate, endDate], (err, rows) => {
        if (err) {
            console.error("Error al obtener los valores:", err);
            return res.status(500).json({ error: 'Error al obtener los valores' });
        }

        res.json(rows); // Devuelve los datos obtenidos con total de mañana y tarde por fecha
    });
});
// Ruta para obtener el informe del usuario logueado
app.get('/api/informe', (req, res) => {
    const userId = req.query.userId; // Obtener el userId desde los query params

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const query = `
    WITH Totales AS (
    SELECT 
        SUM(VALOR) AS subtotal_REGISTRO 
    FROM REGISTRO 
    WHERE USUARIO = ? AND FECHA = date('now')
),
Totales_Extra AS (
    SELECT 
        SUM(VALOR) AS subtotal_REGISTRO_EXTRA 
    FROM REGISTRO_EXTRA 
    WHERE USUARIO = ? AND FECHA = date('now')
)

-- Consulta para REGISTRO con subtotal
SELECT 
    'REGISTRO' AS fuente,
    COOPERATIVA,
    USUARIO,
    DESTINO,
    HORA,
    FECHA,
    FRECUENCIA,
    NUM_PASAJEROS,
    TIPO_FREC,
    '$' || printf("%.2f", VALOR) AS VALOR,  -- Concatenar el signo de dólar
    NUM_TICKET
FROM REGISTRO
WHERE USUARIO = ? AND FECHA = date('now')

UNION ALL

-- Subtotal para REGISTRO
SELECT 
    'SUBTOTAL REGISTRO' AS fuente,
    NULL AS COOPERATIVA,
    NULL AS USUARIO,
    NULL AS DESTINO,
    NULL AS HORA,
    NULL AS FECHA,
    NULL AS FRECUENCIA,
    NULL AS NUM_PASAJEROS,
    NULL AS TIPO_FREC,
    '$' || printf("%.2f", (SELECT subtotal_REGISTRO FROM Totales)) AS VALOR,  -- Concatenar el signo de dólar al subtotal
    NULL AS NUM_TICKET

UNION ALL

-- Consulta para REGISTRO_EXTRA con subtotal
SELECT 
    'REGISTRO_EXTRA' AS fuente,
    COOPERATIVA,
    USUARIO,
    DESTINO,
    HORA,
    FECHA,
    FRECUENCIA,
    NUM_PASAJEROS,
    TIPO_FREC,
    '$' || printf("%.2f", VALOR) AS VALOR,  -- Concatenar el signo de dólar
    NUM_TICKET
FROM REGISTRO_EXTRA
WHERE USUARIO = ? AND FECHA = date('now')

UNION ALL

-- Subtotal para REGISTRO_EXTRA
SELECT 
    'SUBTOTAL REGISTRO_EXTRA' AS fuente,
    NULL AS COOPERATIVA,
    NULL AS USUARIO,
    NULL AS DESTINO,
    NULL AS HORA,
    NULL AS FECHA,
    NULL AS FRECUENCIA,
    NULL AS NUM_PASAJEROS,
    NULL AS TIPO_FREC,
    '$' || printf("%.2f", (SELECT subtotal_REGISTRO_EXTRA FROM Totales_Extra)) AS VALOR,  -- Concatenar el signo de dólar al subtotal
    NULL AS NUM_TICKET

UNION ALL

-- Fila de total general
SELECT 
    'TOTAL' AS fuente,
    NULL AS COOPERATIVA,
    NULL AS USUARIO,
    NULL AS DESTINO,
    NULL AS HORA,
    NULL AS FECHA,
    NULL AS FRECUENCIA,
    NULL AS NUM_PASAJEROS,
    NULL AS TIPO_FREC,
    '$' || printf("%.2f", (SELECT subtotal_REGISTRO FROM Totales) + (SELECT subtotal_REGISTRO_EXTRA FROM Totales_Extra)) AS VALOR,  -- Concatenar el signo de dólar al total
    NULL AS NUM_TICKET;

    `;

    db.all(query, [userId, userId, userId, userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al ejecutar la consulta' });
        }
        res.json(rows);
    });
});

// Definir la ruta para obtener los usuarios
app.get('/api/usuarios', (req, res) => {
    // Realizar la consulta a la base de datos
    db.all("SELECT * FROM usuarios WHERE rol != 'superadmin'", [], (err, rows) => {
        if (err) {
            console.error('Error al obtener los usuarios:', err.message);
            return res.status(500).json({ error: 'Error al obtener los registros' });
        }

        // Enviar los resultados como JSON
        res.json(rows);
        console.log(rows);
    });
});

app.put('/api/usuarios/:cedula', (req, res) => {
    const cedula = req.params.cedula;
    const { nombre, celular, rol, estado } = req.body;

    // Consulta corregida sin la coma extra
    const sql = `UPDATE USUARIOS SET NOMBRE = ?, NUMERO_CELULAR = ?, ROL = ?, ESTADO = ? WHERE CEDULA = ?`;

    db.run(sql, [nombre, celular, rol, estado, cedula], function (err) {
        if (err) {
            console.error('Error en la base de datos:', err.message);
            return res.status(500).json({ error: 'Error al actualizar el usuario', detalles: err.message });
        }

        // Confirmar éxito en la actualización
        res.json({ message: 'Usuario actualizado correctamente', cambios: this.changes });
    });
});


app.post('/api/registrarusuario', (req, res) => {
    const { cedula, nombre, celular, rol } = req.body;

    if (!cedula || !nombre || !celular || !rol) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar si el usuario ya existe
    db.get(`SELECT * FROM USUARIOS WHERE CEDULA = ?`, [cedula], (err, row) => {
        if (err) {
            console.error("Error al consultar la base de datos:", err);
            return res.status(500).json({ error: 'Error al verificar si el usuario existe' });
        }
        if (row) {
            return res.status(400).json({ success: false, error: "El usuario ya está registrado." });
        } else {
            // Insertar el nuevo usuario
            const query = `INSERT INTO USUARIOS (CEDULA, NOMBRE, NUMERO_CELULAR, ROL, CONTRASEÑA, ESTADO) 
                           VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(query, [cedula, nombre, celular, rol, "1234", "activo"], function (err) {
                if (err) {
                    console.error("Error al registrar el usuario:", err);
                    return res.status(500).json({ error: 'Error al registrar el usuario' });
                }
                res.status(201).json({ success: true, message: 'Usuario registrado con éxito' });
            });
        }
    });
});


// Definir la ruta para obtener las frecuencias
app.get('/api/frecuenciasg', (req, res) => {
    // Realizar la consulta a la base de datos
    db.all(`
        SELECT 
            R.COOPERATIVA, 
            R.USUARIO, 
            R.DESTINO, 
            R.HORA, 
            R.FECHA, 
            R.FRECUENCIA, 
            R.NUM_PASAJEROS, 
            R.TIPO_FREC, 
            R.VALOR, 
            R.NUM_TICKET
        FROM 
            "REGISTRO" R

        UNION ALL

        SELECT 
            RE.COOPERATIVA, 
            RE.USUARIO, 
            RE.DESTINO, 
            RE.HORA, 
            RE.FECHA, 
            RE.FRECUENCIA, 
            RE.NUM_PASAJEROS, 
            RE.TIPO_FREC, 
            RE.VALOR, 
            RE.NUM_TICKET
        FROM 
            "REGISTRO_EXTRA" RE;
    `, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener las frecuencias:', err.message);
            return res.status(500).json({ error: 'Error al obtener las frecuencias' });
        }

        // Enviar los resultados como JSON
        res.json(rows);
        console.log(rows);
    });
});

app.put('/api/frecuenciasn/:cooperativa/:hora/:fecha/:usuario/:ticket', (req, res) => { 
    const { cooperativa, hora, fecha, usuario, ticket } = req.params; // Incluye 'ticket' aquí
    const { 
        destino, 
        frecuencia, 
        pasajeros: num_pasajeros, 
        tipo: tipo_frec, 
        valor, 
        ticket: num_ticket 
    } = req.body;
    

    if (!destino || !frecuencia || !num_pasajeros || !tipo_frec || !valor || !num_ticket) {
        return res.status(400).json({ error: 'Faltan datos en el cuerpo de la solicitud' });
    }
    console.log('Datos de la URL:', req.params); // Para depuración
    console.log('Datos del cuerpo:', req.body); // Para depuración

    const sql = `
    UPDATE REGISTRO
    SET 
        DESTINO = ?, 
        FRECUENCIA = ?, 
        NUM_PASAJEROS = ?, 
        TIPO_FREC = ?, 
        VALOR = ?
    WHERE 
        COOPERATIVA = ? 
        AND HORA = ? 
        AND FECHA = ? 
        AND USUARIO = ? 
        AND NUM_TICKET = ?;
`;

const params = [
    destino, frecuencia, num_pasajeros, tipo_frec, valor, // Campos a actualizar
    cooperativa, hora, fecha, usuario, num_ticket // Condiciones
];


    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error en la base de datos:', err.message);
            return res.status(500).json({ error: 'Error al actualizar el registro', detalles: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'No se encontró el registro para actualizar' });
        }

        res.json({ message: 'Registro actualizado correctamente' });
    });
});


app.put('/api/frecuenciase/:cooperativa/:hora/:fecha/:usuario/:ticket', (req, res) => { 
    const { cooperativa, hora, fecha, usuario, ticket } = req.params; // Incluye 'ticket' aquí
    const { 
        destino, 
        frecuencia, 
        pasajeros: num_pasajeros, 
        tipo: tipo_frec, 
        valor, 
        ticket: num_ticket 
    } = req.body;
    

    if (!destino || !frecuencia || !num_pasajeros || !tipo_frec || !valor || !num_ticket) {
        return res.status(400).json({ error: 'Faltan datos en el cuerpo de la solicitud' });
    }
    console.log('Datos de la URL:', req.params); // Para depuración
    console.log('Datos del cuerpo:', req.body); // Para depuración

    const sql = `
    UPDATE REGISTRO_EXTRA
    SET 
        DESTINO = ?, 
        FRECUENCIA = ?, 
        NUM_PASAJEROS = ?, 
        TIPO_FREC = ?, 
        VALOR = ?
    WHERE 
        COOPERATIVA = ? 
        AND HORA = ? 
        AND FECHA = ? 
        AND USUARIO = ? 
        AND NUM_TICKET = ?;
`;

const params = [
    destino, frecuencia, num_pasajeros, tipo_frec, valor, // Campos a actualizar
    cooperativa, hora, fecha, usuario, num_ticket // Condiciones
];


    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error en la base de datos:', err.message);
            return res.status(500).json({ error: 'Error al actualizar el registro', detalles: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'No se encontró el registro para actualizar' });
        }

        res.json({ message: 'Registro actualizado correctamente' });
    });
});


// Definir la ruta para obtener los usuarios
app.get('/api/responsable', (req, res) => {
    // Realizar la consulta a la base de datos
    db.all("SELECT * FROM USUARIOS WHERE rol == 'administrador'", [], (err, rows) => {
        if (err) {
            console.error('Error al obtener los usuarios:', err.message);
            return res.status(500).json({ error: 'Error al obtener los registros' });
        }
        // Enviar los resultados como JSON
        res.json(rows);
        console.log(rows);
    });
});

app.get('/api/secretaria', (req, res) => {
    // Realizar la consulta a la base de datos
    db.all("SELECT * FROM USUARIOS WHERE rol == 'secretaria'", [], (err, rows) => {
        if (err) {
            console.error('Error al obtener los usuarios:', err.message);
            return res.status(500).json({ error: 'Error al obtener los registros' });
        }
        // Enviar los resultados como JSON
        res.json(rows);
        console.log(rows);
    });
});

app.get('/api/condens', (req, res) => {
    const { startDate, endDate } = req.query;

    // Validación de las fechas proporcionadas
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Debe proporcionar las fechas de inicio y fin' });
    }

    // Consulta SQL usando placeholders para las fechas
    const query = `
   WITH frecuencias_diarias AS (
    SELECT
        COOPERATIVA,
        FECHA,
        SUM(CASE WHEN CAST(SUBSTR(HORA, 1, 3) AS INTEGER) < 13 THEN 1 ELSE 0 END) AS frecuencias_manana,
        SUM(CASE WHEN CAST(SUBSTR(HORA, 1, 3) AS INTEGER) >= 13 THEN 1 ELSE 0 END) AS frecuencias_tarde
    FROM (
        SELECT COOPERATIVA, HORA, FECHA FROM REGISTRO
        WHERE FECHA BETWEEN ? AND ?
        UNION ALL
        SELECT COOPERATIVA, HORA, FECHA FROM REGISTRO_EXTRA
        WHERE FECHA BETWEEN ? AND ?
    ) AS todas_frecuencias
    GROUP BY COOPERATIVA, FECHA
),
cumplimiento_diario AS (
    SELECT
        COOPERATIVA,
        DIARIO
    FROM CUMPLIMIENTO
),
frecuencia_semanal_calculada AS (
    SELECT
        COOPERATIVA,
        SUM(f.frecuencias_manana + f.frecuencias_tarde) AS frecuencias_cumplidas_totales, -- Suma total de frecuencias en el rango de fechas
        (JULIANDAY(?) - JULIANDAY(?) + 1) AS num_dias -- Número de días en el rango
    FROM frecuencias_diarias f
    GROUP BY COOPERATIVA
)
SELECT
    f.COOPERATIVA,
    f.FECHA,
    f.frecuencias_manana,
    f.frecuencias_tarde,
    c.DIARIO AS valor_diario,
    fs.frecuencias_cumplidas_totales, -- Suma total de frecuencias cumplidas
    -- Calcular las frecuencias no cumplidas
    (c.DIARIO * fs.num_dias - fs.frecuencias_cumplidas_totales) AS frecuencias_no_cumplidas,
    -- Cálculo de la frecuencia semanal (valor diario * número de días)
    (c.DIARIO * fs.num_dias) AS frecuencia_semanal,
    -- Porcentaje de cumplimiento con la frecuencia semanal
    ROUND(
        (fs.frecuencias_cumplidas_totales * 100.0) / (c.DIARIO * fs.num_dias), 2
    ) AS porcentaje_cumplimiento
FROM
    frecuencias_diarias f
JOIN
    cumplimiento_diario c
    ON f.COOPERATIVA = c.COOPERATIVA
JOIN
    frecuencia_semanal_calculada fs
    ON f.COOPERATIVA = fs.COOPERATIVA
ORDER BY
    f.COOPERATIVA, f.FECHA;
    `;

    // Ejecuta la consulta pasando los parámetros para las fechas
    db.all(query, [startDate, endDate, startDate, endDate, endDate, startDate], (err, rows) => {
        if (err) {
            console.error("Error al obtener los datos:", err);
            return res.status(500).json({ error: 'Error al obtener los datos' });
        }

        // Devuelve la respuesta con los datos obtenidos
        res.json(rows);
    });
});

app.get('/api/ticketsN', (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Debe proporcionar las fechas de inicio y fin' });
    }

    const query = `
        SELECT CONCAT(
            (SELECT NUM_TICKET
             FROM REGISTRO
             WHERE FECHA BETWEEN ? AND ?
             ORDER BY NUM_TICKET ASC
             LIMIT 1),
            ' a ',
            (SELECT NUM_TICKET
             FROM REGISTRO
             WHERE FECHA BETWEEN ? AND ?
             ORDER BY NUM_TICKET DESC
             LIMIT 1)
        ) AS RANGO_TICKET;
    `;

    db.get(query, [startDate, endDate, startDate, endDate], (err, row) => { // Cambiado de db.all a db.get
        if (err) {
            console.error("Error al obtener los valores:", err);
            return res.status(500).json({ error: 'Error al obtener los valores' });
        }

        res.json(row || { RANGO_TICKET: 'No hay datos en el rango proporcionado' });
    });
});

app.get('/api/ticketsE', (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Debe proporcionar las fechas de inicio y fin' });
    }

    const query = `
        SELECT CONCAT(
            (SELECT NUM_TICKET
             FROM REGISTRO_EXTRA
             WHERE FECHA BETWEEN ? AND ?
             ORDER BY NUM_TICKET ASC
             LIMIT 1),
            ' a ',
            (SELECT NUM_TICKET
             FROM REGISTRO_EXTRA
             WHERE FECHA BETWEEN ? AND ?
             ORDER BY NUM_TICKET DESC
             LIMIT 1)
        ) AS RANGO_TICKET;
    `;

    db.get(query, [startDate, endDate, startDate, endDate], (err, row) => { // Cambiado de db.all a db.get
        if (err) {
            console.error("Error al obtener los valores:", err);
            return res.status(500).json({ error: 'Error al obtener los valores' });
        }

        res.json(row || { RANGO_TICKET: 'No hay datos en el rango proporcionado' });
    });
});


app.get('/api/total', (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Debe proporcionar las fechas de inicio y fin' });
    }

    const query = `
        SELECT 
        SUM(VALOR) AS TOTAL_DIA -- Total de todos los valores recaudados en el rango de fechas
        FROM (
            SELECT FECHA, HORA, VALOR FROM REGISTRO_EXTRA
            WHERE FECHA BETWEEN ? AND ? -- reemplaza con las fechas deseadas
            UNION ALL
            SELECT FECHA, HORA, VALOR FROM REGISTRO
            WHERE FECHA BETWEEN ? AND ? -- reemplaza con las fechas deseadas
        ) AS combined_records;
    `;

    db.get(query, [startDate, endDate, startDate, endDate], (err, row) => { // Cambiado de db.all a db.get
        if (err) {
            console.error("Error al obtener los valores:", err);
            return res.status(500).json({ error: 'Error al obtener los valores' });
        }
        res.json(row);
    }); // Cierre de db.get
}); // Cierre de app.get

app.get('/api/mensual-disco', (req, res) => {
    const { mes } = req.query;

    if (!mes) {
        return res.status(400).json({ error: 'Debe proporcionar el mes en formato YYYY-MM' });
    }

    const query = `
       WITH REGISTROS_COMBINADOS AS (
        SELECT 
            FECHA,
            CASE 
                WHEN CAST(SUBSTR(HORA, 1, 2) AS INTEGER) < 13 
                    OR (CAST(SUBSTR(HORA, 1, 2) AS INTEGER) = 13 AND CAST(SUBSTR(HORA, 4, 2) AS INTEGER) = 0) THEN 'MAÑANA'
                ELSE 'TARDE'
            END AS TURNO,
            TIPO_FREC,
            COUNT(*) AS FRECUENCIAS
        FROM REGISTRO
        WHERE TIPO_FREC IN ('NORMAL', 'EXTRA') 
        AND strftime('%Y-%m', FECHA) = ?
        GROUP BY FECHA, TURNO, TIPO_FREC

        UNION ALL

        SELECT 
            FECHA,
            CASE 
                WHEN CAST(SUBSTR(HORA, 1, 2) AS INTEGER) < 13 
                    OR (CAST(SUBSTR(HORA, 1, 2) AS INTEGER) = 13 AND CAST(SUBSTR(HORA, 4, 2) AS INTEGER) = 0) THEN 'MAÑANA'
                ELSE 'TARDE'
            END AS TURNO,
            TIPO_FREC,
            COUNT(*) AS FRECUENCIAS
        FROM REGISTRO_EXTRA
        WHERE TIPO_FREC IN ('NORMAL', 'EXTRA') 
        AND strftime('%Y-%m', FECHA) = ?
        GROUP BY FECHA, TURNO, TIPO_FREC
    )
    SELECT 
        FECHA,
        COALESCE(SUM(CASE WHEN TURNO = 'MAÑANA' AND TIPO_FREC = 'NORMAL' THEN FRECUENCIAS END), 0) AS "TURNO MAÑANA NORMAL",
        COALESCE(SUM(CASE WHEN TURNO = 'MAÑANA' AND TIPO_FREC = 'EXTRA' THEN FRECUENCIAS END), 0) AS "TURNO MAÑANA EXTRA",
        COALESCE(SUM(CASE WHEN TURNO = 'TARDE' AND TIPO_FREC = 'NORMAL' THEN FRECUENCIAS END), 0) AS "TURNO TARDE NORMAL",
        COALESCE(SUM(CASE WHEN TURNO = 'TARDE' AND TIPO_FREC = 'EXTRA' THEN FRECUENCIAS END), 0) AS "TURNO TARDE EXTRA",
        COALESCE(SUM(FRECUENCIAS), 0) AS "TOTAL DIARIO FRECUENCIAS"
    FROM REGISTROS_COMBINADOS
    WHERE TURNO IN ('MAÑANA', 'TARDE')
    GROUP BY FECHA

    UNION ALL

    SELECT
        'TOTAL' AS FECHA,
        COALESCE(SUM(CASE WHEN TURNO = 'MAÑANA' AND TIPO_FREC = 'NORMAL' THEN FRECUENCIAS END), 0) AS "TURNO MAÑANA NORMAL",
        COALESCE(SUM(CASE WHEN TURNO = 'MAÑANA' AND TIPO_FREC = 'EXTRA' THEN FRECUENCIAS END), 0) AS "TURNO MAÑANA EXTRA",
        COALESCE(SUM(CASE WHEN TURNO = 'TARDE' AND TIPO_FREC = 'NORMAL' THEN FRECUENCIAS END), 0) AS "TURNO TARDE NORMAL",
        COALESCE(SUM(CASE WHEN TURNO = 'TARDE' AND TIPO_FREC = 'EXTRA' THEN FRECUENCIAS END), 0) AS "TURNO TARDE EXTRA",
        COALESCE(SUM(FRECUENCIAS), 0) AS "TOTAL DIARIO FRECUENCIAS"
    FROM REGISTROS_COMBINADOS

    ORDER BY FECHA;
    `;

    db.all(query, [mes, mes], (err, rows) => {
        if (err) {
            console.error('Error al generar el reporte mensual:', err);
            return res.status(500).json({ error: 'Error al generar el reporte mensual' });
        }

        res.json(rows); // Devuelve los datos agrupados por día
    });
});
// Endpoint para obtener cumplimiento
app.get('/api/cumplimiento', (req, res) => {
    const { mesReporte } = req.query;

    if (!mesReporte) {
        return res.status(400).json({ error: 'Debe proporcionar el mes en formato YYYY-MM' });
    }

    const query = `
        WITH frecuencias_totales AS (
            SELECT
                COOPERATIVA,
                COUNT(*) AS total_frecuencias
            FROM (
                SELECT COOPERATIVA, HORA, FECHA, TIPO_FREC
                FROM REGISTRO
                WHERE strftime('%Y-%m', FECHA) = ?
                UNION ALL
                SELECT COOPERATIVA, HORA, FECHA, TIPO_FREC
                FROM REGISTRO_EXTRA
                WHERE strftime('%Y-%m', FECHA) = ?
            ) AS todas_frecuencias
            GROUP BY COOPERATIVA
        ),
        frecuencia_diaria AS (
            SELECT
                COOPERATIVA,
                DIARIO
            FROM CUMPLIMIENTO
        ),
        frecuencia_mensual AS (
            SELECT
                COOPERATIVA,
                DIARIO,
                (DIARIO * strftime('%d', ? || '-01', '+1 month', '-1 day')) AS frecuencia_mensual
            FROM CUMPLIMIENTO
        ),
        reporte_cumplimiento AS (
            SELECT
                ft.COOPERATIVA,
                fm.DIARIO AS frecuencia_diaria,
                fm.frecuencia_mensual,
                ft.total_frecuencias,
                (fm.frecuencia_mensual - ft.total_frecuencias) AS frecuencias_no_cumplen,
                ROUND(ft.total_frecuencias * 100.0 / fm.frecuencia_mensual, 2) AS porcentaje_cumplimiento
            FROM frecuencias_totales ft
            JOIN frecuencia_mensual fm ON ft.COOPERATIVA = fm.COOPERATIVA
        )
        SELECT 
            COOPERATIVA,
            frecuencia_diaria,
            frecuencia_mensual,
            total_frecuencias,
            frecuencias_no_cumplen,
            porcentaje_cumplimiento
        FROM reporte_cumplimiento
        UNION ALL
        SELECT
            'TOTAL' AS COOPERATIVA,
            SUM(frecuencia_diaria) AS frecuencia_diaria,
            SUM(frecuencia_mensual) AS frecuencia_mensual,
            SUM(total_frecuencias) AS total_frecuencias,
            SUM(frecuencias_no_cumplen) AS frecuencias_no_cumplen,
            ROUND(AVG(porcentaje_cumplimiento), 2) AS porcentaje_cumplimiento
        FROM reporte_cumplimiento
        ORDER BY total_frecuencias;
    `;

    db.all(query, [mesReporte, mesReporte, mesReporte], (err, rows) => {
        if (err) {
            console.error("Error al obtener frecuencias:", err);
            return res.status(500).json({ error: 'Error al obtener frecuencias' });
        }

        res.json(rows); // Devuelve los datos obtenidos
    });
});

app.get('/api/mensual-valores', (req, res) => {
    const { mes } = req.query;

    if (!mes) {
        return res.status(400).json({ error: 'Debe proporcionar el mes en formato YYYY-MM' });
    }

    const query = `
       WITH REGISTROS_COMBINADOS AS (
        SELECT 
            FECHA,
            CASE 
                WHEN CAST(SUBSTR(HORA, 1, 2) AS INTEGER) < 13 
                    OR (CAST(SUBSTR(HORA, 1, 2) AS INTEGER) = 13 AND CAST(SUBSTR(HORA, 4, 2) AS INTEGER) = 0) THEN 'MAÑANA'
                ELSE 'TARDE'
            END AS TURNO,
            TIPO_FREC,
            SUM(VALOR) AS TOTAL_VALORES -- Cambiado para sumar valores en lugar de contar frecuencias
        FROM REGISTRO
        WHERE TIPO_FREC IN ('NORMAL', 'EXTRA') 
        AND strftime('%Y-%m', FECHA) = ?
        GROUP BY FECHA, TURNO, TIPO_FREC

        UNION ALL

        SELECT 
            FECHA,
            CASE 
                WHEN CAST(SUBSTR(HORA, 1, 2) AS INTEGER) < 13 
                    OR (CAST(SUBSTR(HORA, 1, 2) AS INTEGER) = 13 AND CAST(SUBSTR(HORA, 4, 2) AS INTEGER) = 0) THEN 'MAÑANA'
                ELSE 'TARDE'
            END AS TURNO,
            TIPO_FREC,
            SUM(VALOR) AS TOTAL_VALORES -- Cambiado para sumar valores en lugar de contar frecuencias
        FROM REGISTRO_EXTRA
        WHERE TIPO_FREC IN ('NORMAL', 'EXTRA') 
        AND strftime('%Y-%m', FECHA) = ?
        GROUP BY FECHA, TURNO, TIPO_FREC
    )
    SELECT 
        FECHA,
        COALESCE(SUM(CASE WHEN TURNO = 'MAÑANA' AND TIPO_FREC = 'NORMAL' THEN TOTAL_VALORES END), 0) AS "TURNO MAÑANA NORMAL",
        COALESCE(SUM(CASE WHEN TURNO = 'MAÑANA' AND TIPO_FREC = 'EXTRA' THEN TOTAL_VALORES END), 0) AS "TURNO MAÑANA EXTRA",
        COALESCE(SUM(CASE WHEN TURNO = 'TARDE' AND TIPO_FREC = 'NORMAL' THEN TOTAL_VALORES END), 0) AS "TURNO TARDE NORMAL",
        COALESCE(SUM(CASE WHEN TURNO = 'TARDE' AND TIPO_FREC = 'EXTRA' THEN TOTAL_VALORES END), 0) AS "TURNO TARDE EXTRA",
        COALESCE(SUM(TOTAL_VALORES), 0) AS "TOTAL DIARIO VALORES"
    FROM REGISTROS_COMBINADOS
    WHERE TURNO IN ('MAÑANA', 'TARDE')
    GROUP BY FECHA

    UNION ALL

    SELECT
        'TOTAL' AS FECHA,
        COALESCE(SUM(CASE WHEN TURNO = 'MAÑANA' AND TIPO_FREC = 'NORMAL' THEN TOTAL_VALORES END), 0) AS "TURNO MAÑANA NORMAL",
        COALESCE(SUM(CASE WHEN TURNO = 'MAÑANA' AND TIPO_FREC = 'EXTRA' THEN TOTAL_VALORES END), 0) AS "TURNO MAÑANA EXTRA",
        COALESCE(SUM(CASE WHEN TURNO = 'TARDE' AND TIPO_FREC = 'NORMAL' THEN TOTAL_VALORES END), 0) AS "TURNO TARDE NORMAL",
        COALESCE(SUM(CASE WHEN TURNO = 'TARDE' AND TIPO_FREC = 'EXTRA' THEN TOTAL_VALORES END), 0) AS "TURNO TARDE EXTRA",
        COALESCE(SUM(TOTAL_VALORES), 0) AS "TOTAL DIARIO VALORES"
    FROM REGISTROS_COMBINADOS

    ORDER BY FECHA;

    `;

    db.all(query, [mes, mes], (err, rows) => {
        if (err) {
            console.error('Error al generar el reporte mensual:', err);
            return res.status(500).json({ error: 'Error al generar el reporte mensual' });
        }

        res.json(rows); // Devuelve los datos agrupados por día
    });
});

app.get('/api/mensual-pasajeros', (req, res) => {
    const { mes, cooperativa } = req.query;

    if (!mes) {
        return res.status(400).json({ error: 'Debe proporcionar el mes en formato YYYY-MM' });
    }

    let query = `
        WITH REGISTROS_COMBINADOS AS (
            SELECT COOPERATIVA, DESTINO, NUM_PASAJEROS, FECHA
            FROM REGISTRO
            UNION ALL
            SELECT COOPERATIVA, DESTINO, NUM_PASAJEROS, FECHA
            FROM REGISTRO_EXTRA
        )
        SELECT 
            COOPERATIVA,
            DESTINO,
            SUM(NUM_PASAJEROS) AS TOTAL_PASAJEROS
        FROM 
            REGISTROS_COMBINADOS
        WHERE 
            strftime('%Y-%m', FECHA) = ?
    `;

    const params = [mes];

    // Filtra por cooperativa si se proporciona
    if (cooperativa) {
        query += ` AND COOPERATIVA = ?`;
        params.push(cooperativa);
    }

    query += `
        GROUP BY 
            COOPERATIVA, DESTINO
        ORDER BY 
            COOPERATIVA, DESTINO;
    `;

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error al generar el reporte mensual:', err);
            return res.status(500).json({ error: 'Error al generar el reporte mensual' });
        }

        res.json(rows); // Devuelve los datos agrupados por cooperativa y destino
    });
});

app.get('/api/cooperativas', (req, res) => {
    try {
        db.all('SELECT DISTINCT COOPERATIVA FROM FRECUENCIAS', [], (err, rows) => {
            if (err) {
                console.error("Error al obtener cooperativas:", err);
                return res.status(500).json({ error: 'Error al obtener cooperativas' });
            }
            res.json(rows); // Devuelve los datos sin repeticiones
        });
    } catch (error) {
        console.error("Error al obtener cooperativas:", error);
        res.status(500).json({ error: 'Error al obtener cooperativas' });
    }
});

app.get('/api/get-num-ticket/:tabla', (req, res) => {
    const { tabla } = req.params;

    // Validar que la tabla sea una de las permitidas
    if (tabla !== 'REGISTRO' && tabla !== 'REGISTRO_EXTRA') {
        return res.status(400).json({ error: 'Tabla no válida' });
    }
    // Año actual
    const currentYear = new Date().getFullYear();
    // Consulta SQL
    const query = `SELECT MAX(CAST(NUM_TICKET AS INTEGER)) + 1 AS NumeroMayorTicket FROM ${tabla} WHERE strftime('%Y', FECHA) = "${currentYear}"`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener el mayor NUM_TICKET:', err.message);
            return res.status(500).json({ error: 'Error al obtener datos' });
        }
        // Verifica que haya filas en el resultado
        const result = rows[0];
        res.json(result || { MINIMO_NUM_TICKET: null });
    });
});