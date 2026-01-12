/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix Turbopack root detection in nested project structure
  turbopack: {
    root: import.meta.dirname,
  },
  // Allow dev access from local network
  allowedDevOrigins: ['http://192.168.31.15:3000', 'http://192.168.31.15:3001'],
};

export default nextConfig;
