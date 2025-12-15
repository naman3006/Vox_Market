import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('GEMINI_API_KEY not found in environment');
    process.exit(1);
}

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        console.log(`Fetching models from: ${url.replace(apiKey, 'HIDDEN')}`);

        const response = await axios.get(url);
        const models = response.data.models;

        console.log('Available Models:');
        models.forEach((m: any) => {
            if (m.supportedGenerationMethods.includes('generateContent')) {
                console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
            }
        });

    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

listModels();
