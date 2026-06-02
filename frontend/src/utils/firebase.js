import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import axios from "axios";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let messaging;

if (firebaseConfig.apiKey) {
    try {
        app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
}

export const requestForToken = async () => {
    if (!messaging) {
        console.warn("Firebase messaging not initialized. Check your .env file.");
        return;
    }
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const currentToken = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            });
            if (currentToken) {
                console.log("FCM Token:", currentToken);
                // Save token to backend
                await axios.post("/api/user/save-token", { fcmToken: currentToken });
            } else {
                console.log("No registration token available. Request permission to generate one.");
            }
        }
    } catch (err) {
        console.log("An error occurred while retrieving token. ", err);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) return;
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
