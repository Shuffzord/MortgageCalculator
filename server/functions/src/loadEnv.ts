import * as dotenv from 'dotenv';
import { join } from 'path';

const envPath = join(__dirname, '..', '.env');
console.log('Attempting to load .env file from:', envPath);

dotenv.config({ path: envPath });

console.log('Loaded environment variables:', Object.keys(process.env));

export default process.env;