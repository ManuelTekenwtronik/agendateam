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
