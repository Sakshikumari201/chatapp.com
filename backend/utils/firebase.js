import admin from 'firebase-admin';
import dotenv from 'dotenv';
import User from '../Models/userModels.js';

dotenv.config();

// To use this, the user needs to download their serviceAccountKey.json from Firebase Console
// and place it in the backend directory or set FIREBASE_SERVICE_ACCOUNT_PATH in .env
try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    if (serviceAccountPath) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath)
        });
        console.log("Firebase Admin initialized");
    } else {
        console.warn("Firebase service account path not found. Push notifications will be disabled.");
    }
} catch (error) {
    console.error("Error initializing Firebase Admin:", error);
}

export const sendPushNotification = async (receiverId, title, body, data = {}) => {
    try {
        // Only attempt if Firebase is initialized
        if (!admin.apps.length) return;

        const receiver = await User.findById(receiverId);
        if (receiver && receiver.fcmToken) {
            const message = {
                notification: {
                    title: title,
                    body: body,
                },
                data: {
                    ...data,
                    click_action: "FLUTTER_NOTIFICATION_CLICK", // Standard for some clients
                },
                token: receiver.fcmToken,
            };

            const response = await admin.messaging().send(message);
            return response;
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};
