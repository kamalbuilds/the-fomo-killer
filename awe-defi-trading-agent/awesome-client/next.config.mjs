import dotenv from 'dotenv';

const env = process.env.ENV || 'development';
dotenv.config({ path: `.env.${env}` })
const API_URL = process.env.ENV === 'development' ? 'https://api-test.awenetwork.ai' : 'https://api.awenetwork.ai'

const nextConfig = {
    env: {
        NEXT_PUBLIC_API_URL: API_URL,
    },
    images: {
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'pump.fun',
            },
            {
                protocol: 'https',
                hostname: 'bairesdev.mo.cloudinary.net',
            },
            {
                protocol: 'https',
                hostname: 'play-lh.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'mcp-avatar-default.s3.ap-northeast-1.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: 'cdn-icons-png.flaticon.com',
            },
            {
                protocol: 'https',
                hostname: 'mcp-server-tool-logo.s3.ap-northeast-1.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: 'api.dicebear.com',
            },
       
        ]
    },
    // 禁用预渲染以避免 Wagmi Provider 错误
    experimental: {
        missingSuspenseWithCSRBailout: false,
    },
    // 强制使用动态渲染
    output: 'standalone',
    
}

export default nextConfig;


