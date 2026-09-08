const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const baseConfig = require('./app.json');

dotenv.config({ path: path.join(__dirname, '.env') });

const required = [
  'API_HOST',
  'API_PORT',
  'API_BASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_ANDROID_CLIENT_ID',
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Falta la variable de entorno móvil: ${name}`);
  }
}

const extra = {
  ...baseConfig.expo.extra,
  API_HOST: process.env.API_HOST,
  API_PORT: Number(process.env.API_PORT),
  API_BASE_URL: process.env.API_BASE_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID: process.env.GOOGLE_ANDROID_CLIENT_ID,
};

const config = {
  ...baseConfig.expo,
  extra,
};

if (process.env.FIREBASE_API_KEY) {
  const generatedPath = path.join(__dirname, '.expo', 'google-services.json');
  fs.mkdirSync(path.dirname(generatedPath), { recursive: true });
  fs.writeFileSync(generatedPath, JSON.stringify({
    project_info: {
      project_number: '547526822972',
      project_id: 'smartclass-app-450b5',
      storage_bucket: 'smartclass-app-450b5.firebasestorage.app',
    },
    client: [{
      client_info: {
        mobilesdk_app_id: '1:547526822972:android:2314502865124bedc28739',
        android_client_info: { package_name: 'com.jhonp.mobile' },
      },
      api_key: [{ current_key: process.env.FIREBASE_API_KEY }],
      services: { appinvite_service: { other_platform_oauth_client: [] } },
    }],
    configuration_version: '1',
  }, null, 2));

  config.android = {
    ...config.android,
    googleServicesFile: './.expo/google-services.json',
  };
}

module.exports = { expo: config };