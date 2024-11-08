const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const db = require('./database');
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'tu_clave_secreta'; // Cambia esta clave en producción

app.use(express.static('../client'));
app.use(express.json());


// Endpoint de autenticación con generación de JWT
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM USUARIOS WHERE CEDULA = ? AND CONTRASEÑA = ?`, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error en el servidor' });
        }
        if (row) {
            console.log(row); 
            // Generar token JWT con la información relevante
            const token = jwt.sign(
                { cedula: row.CEDULA, nombre: row.NOMBRE, rol: row.ROL },
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
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

app.get('/api/get-options', (req, res) => {
    try {
        db.all('SELECT DISTINCT COOPERATIVA FROM FRECUENCIAS', [], (err, rows) => {
            if (err) {
                console.error("Error al obtener cooperativas:", err);
                return res.status(500).json({ error: 'Error al obtener cooperativas' });
            }
            console.log("Datos de cooperativas:", rows);
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
            console.log("Datos de destinos:", rows);
            res.json(rows); // Devuelve los datos sin repeticiones
        });
    } catch (error) {
        console.error("Error al obtener DESTINOS:", error);
        res.status(500).json({ error: 'Error al obtener DESTINOS' });
    }
});

app.get('/api/get-horas', (req, res) => {
    try {
        db.all('SELECT HORA FROM FRECUENCIAS ', [], (err, rows) => {
            if (err) {
                console.error("Error al obtener HORAS:", err);
                return res.status(500).json({ error: 'Error al obtener HORAS' });
            }
            console.log("Datos de HORAS:", rows);
            res.json(rows); // Devuelve los datos sin repeticiones
        });
    } catch (error) {
        console.error("Error al obtener HORAS:", error);
        res.status(500).json({ error: 'Error al obtener HORAS' });
    }
});

