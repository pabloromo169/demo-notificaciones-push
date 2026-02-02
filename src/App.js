import { inicializarPush } from './utils.js';

// Registrar Service Worker
if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('SW registrado:', registration);
      // Aquí suscribes al push con VAPID
    })
    .catch(error => console.error('Error SW:', error));
}

const VAPID_PUBLIC_KEY = 'BDm_wIlErGo6RXJ5I8GYuK7ij2nI7EvbRQk1_q57LQFqNyII51PLtRrqfpHDASeQvIM4Bky50nUFdlWb_LU';

async function suscribirPush() {
  const reg = await navigator.serviceWorker.ready
  const suscripcion = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  })

  // Envía al backend
  await fetch('/.netlify/functions/save-sub', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(suscripcion)
  })
}

async function handleSuscribir() {
  try {
    await inicializarPush(VAPID_PUBLIC_KEY);
    document.getElementById('status').textContent = '🔔 Suscrito OK';
  } catch (error) {
    document.getElementById('status').textContent = '❌ ' + error.message;
  }
}

// Utilidad VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}