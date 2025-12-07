/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_AWS_REGION: process.env.AWS_REGION || 'ap-northeast-2',
    NEXT_PUBLIC_AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'kanaria-prototype-test',
  },
}

module.exports = nextConfig

