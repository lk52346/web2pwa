import { get, set, entries, del } from "https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm";

const staticCacheName = "static-cache-v3";
const dynamicCacheName = "dynamic-cache";

const filesToCache = [
    "/",
    "/images/FER_logo.jpg",
    "/images/pwa192.png",
    "/stylesheets/style.css",
    "/404.html",
    "/offline.html",
    "/site.webmanifest"
]

self.addEventListener('install', event =>
{
    console.log('V1 installing…');
    event.waitUntil(
        caches.open(staticCacheName).then((cache) => {
            return cache.addAll(filesToCache);
        })
    );
});


self.addEventListener('activate', event =>
{
    const cacheWhitelist = [staticCacheName];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    console.log('Activated, V1 now ready to handle fetches!');
});


self.addEventListener('fetch', (event) =>{
    event.respondWith(
        caches.match(event.request)
        .then((response) =>{
            if (response) {
                return response;
            }
            return fetch(event.request).then((response) => {
                if (response.status === 404) {
                    return caches.match("/404.html");
                }
                return caches.open(dynamicCacheName).then((cache) =>
                {
                    const url = new URL(event.request.url);
                    if(url.pathname!='/zadnjeSlikano.txt')
                        cache.put(event.request.url, response.clone());
                    return response;
                });
            });
        })
        .catch((error) =>{
            return caches.match("/offline.html");
        })
    );
});

self.addEventListener("sync", function (event) {
    if (event.tag === "sync-sender") {
        event.waitUntil(syncSender());
    }
});

self.addEventListener("push", function (event) {
    var data = {
        title: "title",
        body: "body",
        redirectUrl: "/"
    };
    if (event.data) {
        data = JSON.parse(event.data.text());
    }
    let options = {
        body: data.body,
        icon: "assets/img/android/androidlaunchericon-96-96.png",
        badge: "assets/img/android/androidlaunchericon-96-96.png",
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: {
            redirectUrl: data.redirectUrl,
        }
    };
    event.waitUntil(
        self.registration.showNotification( data.title, options)
    );
});

self.addEventListener("notificationclick", function (event) {
    let notification = event.notification;
    event.waitUntil(
        clients.matchAll().then(function (clis) {
            clis.forEach((client) =>
            {
                client.navigate(notification.data.redirectUrl);
                client.focus();
            });
            notification.close();
        })
    );
});

let syncSender = async function () {
    entries().then((entries) =>{
    entries.forEach((entry) =>{
        let snap = entry[1];
        let formData = new FormData();
        formData.append("id", snap.id);
        formData.append("ts", snap.ts);
        formData.append("title", snap.title);
        var object = {};
        formData.forEach(function(value, key){
            object[key] = value;
        });
        var json = JSON.stringify(object);
        fetch("/saveSender", {
            method: "POST",
            body: json,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (res) {
            if (res.ok) {
                res.json().then(function (data) {
                    console.log("Deleting from idb:", data.id);
                    del(data.id);
                });
            } else {console.log(res);}
        }).catch(function (error) {console.log(error);});
    });
    });
};
