const webpush = require('web-push');
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

webpush.setVapidDetails(
  'mailto:notificaciones@estudiantes.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI no está configurada');
    }

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('subscriptions');

    // Obtener todas las suscripciones
    const subscriptionsDocs = await collection.find({}).toArray();
    const subscriptions = subscriptionsDocs.map(doc => doc.subscription);

    // Permitir enviar el mensaje vía el cuerpo del POST
    let pushData = {
      title: '⏰ NOTIFICACIÓN PUSH',
      body: 'Este es un mensaje de prueba desde Netlify + MongoDB Atlas',
      icon: '/icon.png',
      data: { url: '/' }
    };

    if (event.httpMethod === 'POST' && event.body) {
      try {
        const customData = JSON.parse(event.body);
        pushData = { ...pushData, ...customData };
      } catch (e) {
        console.log('No se pudo parsear el body, usando por defecto');
      }
    }

    const payload = JSON.stringify(pushData);

    const notifications = subscriptions.map(sub =>
      webpush.sendNotification(sub, payload)
        .catch(async err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log('Suscripción expirada, eliminando de MongoDB...');
            await collection.deleteOne({ "subscription.endpoint": sub.endpoint });
          }
          // No lanzamos error para que el resto continúe
        })
    );

    await Promise.allSettled(notifications);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Envío completado',
        count: subscriptions.length
      })
    };
  } catch (error) {
    console.error('Error enviando push:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};