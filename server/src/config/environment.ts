import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.APP_PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FB_API_KEY: process.env.FB_API_KEY,
  FB_AUTH_DOMAIN: process.env.FB_AUTH_DOMAIN,
  FB_PROJECT_ID: process.env.FB_PROJECT_ID,
  FB_STORAGE_BUCKET: process.env.FB_STORAGE_BUCKET,
  FB_MESSAGING_SENDER_ID: process.env.FB_MESSAGING_SENDER_ID,
  FB_APP_ID: process.env.FB_APP_ID,
  FB_CLIENT_EMAIL: process.env.FB_CLIENT_EMAIL,
  FB_PRIVATE_KEY: process.env.FB_PRIVATE_KEY ? process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
};

console.log('Environment loaded:', config);