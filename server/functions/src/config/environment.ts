import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.APP_PORT || '3001', 10),
  FIREBASE_API_KEY: process.env.FB_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.FB_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: process.env.FB_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.FB_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.FB_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.FB_APP_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FB_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FB_PRIVATE_KEY ? process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
};

console.log('Environment loaded:', config);