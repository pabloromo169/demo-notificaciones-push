const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'push_db';
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_por_defecto_cambiame';

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) return cachedClient;
    const client = await MongoClient.connect(MONGODB_URI);
    cachedClient = client;
    return client;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
    }

    try {
        const { usuario, password } = JSON.parse(event.body);

        if (!usuario || !password) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Usuario y contraseña requeridos' }) };
        }

        const client = await connectToDatabase();
        const db = client.db(MONGODB_DB);
        const users = db.collection('users');

        const user = await users.findOne({ usuario });
        if (!user) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Credenciales inválidas' }) };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Credenciales inválidas' }) };
        }

        // Generar JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role, nombre: user.nombre },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                token,
                user: {
                    id: user._id,
                    nombre: user.nombre,
                    role: user.role
                }
            })
        };
    } catch (error) {
        console.error('Error en auth-login:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message })
        };
    }
};
