// Convierte VAPID public key (base64) a Uint8Array para PushManager
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Suscribe al usuario a notificaciones push
export async function suscribirPush(vapidPublicKey) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push no soportado');
  }

  if (!('Notification' in window) || Notification.permission === 'denied') {
    throw new Error('Notificaciones bloqueadas');
  }

  // Pide permiso si no tiene
  if (Notification.permission === 'default') {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      throw new Error('Permiso denegado');
    }
  }

  // Registra Service Worker
  console.log('Registrando Service Worker...');
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  console.log('Service Worker listo');

  // Suscribe con VAPID
  const convertedKey = urlBase64ToUint8Array(vapidPublicKey.trim());
  console.log('VAPID Key converted length:', convertedKey.byteLength);

  try {
    const suscripcion = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    });
    return suscripcion;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('Error de servicio de red de notificaciones (AbortError).');
    }
    throw err;
  }
}

// Envía suscripción al backend
export async function guardarSuscripcion(suscripcion) {
  const respuesta = await fetch('/.netlify/functions/save-sub', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(suscripcion)
  });

  if (!respuesta.ok) {
    throw new Error('Error guardando suscripción');
  }

  return respuesta.json();
}

// Función principal: completa flujo de suscripción
export async function inicializarPush(vapidPublicKey) {
  try {
    const suscripcion = await suscribirPush(vapidPublicKey);
    await guardarSuscripcion(suscripcion);
    console.log('✅ Suscrito a notificaciones');
    return suscripcion;
  } catch (error) {
    console.error('❌ Error push:', error);
    throw error;
  }
}