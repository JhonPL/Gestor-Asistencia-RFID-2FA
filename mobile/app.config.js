const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const baseConfig = require('./app.base.json');

const envFiles = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '.env.local'),
  path.join(__dirname, '.env.development'),
  path.join(__dirname, '.env.production'),
];

const envFile = envFiles.find((file) => fs.existsSync(file));
if (envFile) {
  dotenv.config({ path: envFile });
}

const configuredExtra = baseConfig.expo?.extra ?? {};

const readValue = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && value !== '') return value;
  }

  for (const name of names) {
    const value = configuredExtra[name];
    if (value !== undefined && value !== '') return value;
  }

  return '';
};

const extra = {
  ...configuredExtra,
  API_HOST: readValue('API_HOST', 'EXPO_PUBLIC_API_HOST', 'REACT_APP_API_HOST'),
  API_PORT: Number(readValue('API_PORT', 'EXPO_PUBLIC_API_PORT', 'REACT_APP_API_PORT') || 0),
  API_BASE_URL: readValue('API_BASE_URL', 'EXPO_PUBLIC_API_BASE_URL', 'REACT_APP_API_URL', 'REACT_APP_API_BASE_URL'),
  GOOGLE_CLIENT_ID: readValue('GOOGLE_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_CLIENT_ID', 'REACT_APP_GOOGLE_CLIENT_ID'),
  GOOGLE_ANDROID_CLIENT_ID: readValue('GOOGLE_ANDROID_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', 'REACT_APP_GOOGLE_ANDROID_CLIENT_ID'),
  GOOGLE_IOS_CLIENT_ID: readValue('GOOGLE_IOS_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'REACT_APP_GOOGLE_IOS_CLIENT_ID'),
};

const googleIosUrlScheme = extra.GOOGLE_IOS_CLIENT_ID
  ? `com.googleusercontent.apps.${extra.GOOGLE_IOS_CLIENT_ID.replace('.apps.googleusercontent.com', '')}`
  : '';

const ios = {
  ...baseConfig.expo.ios,
  infoPlist: {
    ...baseConfig.expo.ios?.infoPlist,
    CFBundleURLTypes: googleIosUrlScheme
      ? [
          {
            CFBundleURLName: 'Google Sign-In',
            CFBundleURLSchemes: [googleIosUrlScheme],
          },
        ]
      : baseConfig.expo.ios?.infoPlist?.CFBundleURLTypes,
  },
};

module.exports = {
  expo: {
    ...baseConfig.expo,
    ios,
    extra,
  },
};