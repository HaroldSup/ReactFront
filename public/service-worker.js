const CACHE_NAME = "v1"; // Cambia la versión según sea necesario

// Lista de recursos estáticos a cachear (glob patterns)
const urlsToCache = [
  "/", // Página principal
  "/index.html",
  "/static/js/*.js", // Todos los archivos JS
  "/static/css/*.css", // Todos los archivos CSS
  "/static/media/*", // Archivos multimedia
  "/favicon.ico",
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Abriendo cache...");
      return cache.addAll(urlsToCache);
    })
  );
});

// Intercepta solicitudes
self.addEventListener("fetch", (event) => {
  const requestURL = new URL(event.request.url);

  if (requestURL.origin === self.location.origin) {
    // Manejar solicitudes de recursos estáticos
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // Devuelve la respuesta de la caché si existe
        }
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse; // Devuelve la respuesta de la red si es válida
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone); // Guarda la respuesta en la caché
          });
          return networkResponse;
        });
      })
    );
  } else if (requestURL.origin === "http://localhost:5000") {
    // Manejar solicitudes a la API
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            throw new Error("Respuesta de red inválida");
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request)) // Respuesta de caché si falla la red
    );
  }
});

// Actualización del Service Worker
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log("Borrando cache antigua:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
