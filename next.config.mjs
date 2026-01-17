import withPWAInit from '@ducanh2912/next-pwa';
import { readFileSync } from 'fs';
import { join } from 'path';

// Ler versão do package.json
const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf8')
);

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
};

export default withPWA(nextConfig);
