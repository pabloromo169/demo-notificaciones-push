const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'push_db';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = await MongoClient.connect(MONGODB_URI);
  cachedClient = client;
  return client;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const subscription = JSON.parse(event.body);

    if (!subscription || !subscription.endpoint) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Suscripción inválida' })
      };
    }

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI no está configurada');
    }

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('subscriptions');

    // Usar upsert basado en el endpoint para evitar duplicados
    await collection.updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          subscription,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, message: 'Suscripción guardada' })
    };
  } catch (error) {
    console.error('Error en save-sub:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno del servidor',
        details: error.message
      })
    };
  }
};