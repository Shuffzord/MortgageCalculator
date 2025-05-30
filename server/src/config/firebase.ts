import admin from 'firebase-admin';
import { config } from '../config/environment';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.FB_PROJECT_ID,
      clientEmail: config.FB_CLIENT_EMAIL,
      privateKey: config.FB_PRIVATE_KEY,
    }),
    databaseURL: `https://${config.FB_PROJECT_ID}.firebaseio.com`,
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();