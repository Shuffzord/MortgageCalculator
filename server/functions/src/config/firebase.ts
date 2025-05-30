import admin from 'firebase-admin';
import { config } from '../config/environment';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.FIREBASE_PROJECT_ID,
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
      privateKey: config.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${config.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();