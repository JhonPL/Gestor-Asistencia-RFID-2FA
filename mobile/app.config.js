const path = require('path');
const dotenv = require('dotenv');
const baseConfig = require('./app.json');

dotenv.config({ path: path.join(__dirname, '.env') });

const configuredExtra = baseConfig.expo.extra ?? {};

const extra = {
  ...configuredExtra,
  API_HOST: process.env.API_HOST ?? configuredExtra.API_HOST ?? '',
  API_PORT: Number(process.env.API_PORT ?? configuredExtra.API_PORT ?? 0),
  API_BASE_URL: process.env.API_BASE_URL ?? configuredExtra.API_BASE_URL ?? '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? configuredExtra.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_ANDROID_CLIENT_ID: process.env.GOOGLE_ANDROID_CLIENT_ID ?? configuredExtra.GOOGLE_ANDROID_CLIENT_ID ?? '',
  GOOGLE_IOS_CLIENT_ID: process.env.GOOGLE_IOS_CLIENT_ID ?? configuredExtra.GOOGLE_IOS_CLIENT_ID ?? '',
};

const config = {
  ...baseConfig.expo,
  extra,
};

module.exports = { expo: config };