'use strict';

// Escucha eventos PUSH del servidor
self.addEventListener('push', function(event) {
  console.log('Push recibido:', event);
  
  // Extrae datos de la notificación (JSON del servidor)
  const payload = event.data ? event.data.json() : {};
  
  const options = {
    body: payload.body || 'Nueva notificación',
    icon: '/icon-192x192.png',           // Tu icono de app
    badge: '/badge-72x72.png',           // Icono pequeño
    image: payload.image || '/banner.jpg',
    tag: 'notificacion-estudiantes',     // Evita duplicados
    vibrate: [200, 100, 200],            // Vibración
    data: {
      url: payload.url || '/',           // URL al clickear
      eventoId: payload.eventoId         // ID para acciones
    },
    actions: [                            // Botones rápidos
      {
        action: 'ver-detalle',
        title: 'Ver detalle',
        icon: '/icon-check.png'
      },
      {
        action: 'descartar',
        title: 'Descartar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Notificación IES', options)
  );
});

// Maneja clicks en la notificación
self.addEventListener('notificationclick', function(event) {
  console.log('Notificación clickeada:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Si ya hay ventana abierta, enfócala
        for (let client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no, abre nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Maneja clicks en botones de acción
self.addEventListener('notificationclose', function(event) {
  console.log('Notificación cerrada:', event);
});

// Activa el Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker activado');
  event.waitUntil(self.clients.claim());
});