import './loadEnv';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import app from './app';

console.log('index.ts is being executed');

setGlobalOptions({ region: 'europe-west3' });

export const api = onRequest(app);