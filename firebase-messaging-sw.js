importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:"AIzaSyD6aDkFf6U5ZsxE6VPciWJzgGcDmjyCmjY",
  authDomain:"agenda-team-tktk.firebaseapp.com",
  projectId:"agenda-team-tktk",
  storageBucket:"agenda-team-tktk.firebasestorage.app",
  messagingSenderId:"619990372047",
  appId:"1:619990372047:web:ac394ad3d453bcdfb2b1ba"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload){
  self.registration.showNotification(
    payload.notification.title,
    {body:payload.notification.body, icon:'/icon-192.png'}
  );
});

// ── Cache offline de los modelos de reconocimiento facial (face-api desde jsdelivr) ──
// SOLO estos recursos (versionados/inmutables). Todo lo demás pasa directo para NO romper
// el flujo "en caliente" ni el auto-actualizador de versión.
const FACE_CACHE = 'faceapi-v1';
self.addEventListener('fetch', function(event){
  if (event.request.url.indexOf('cdn.jsdelivr.net/npm/@vladmandic/face-api') === -1) return;
  event.respondWith(
    caches.open(FACE_CACHE).then(function(cache){
      return cache.match(event.request).then(function(hit){
        if (hit) return hit; // ya cacheado → funciona sin internet
        return fetch(event.request).then(function(resp){
          try { if (resp) cache.put(event.request, resp.clone()); } catch(e){}
          return resp;
        });
      });
    })
  );
});
