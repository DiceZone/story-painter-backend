/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用静态导出以支持EdgeOne Pages
  output: 'export',
  trailingSlash: true,
  
  // 禁用图片优化，因为EdgeOne Pages不支持
  images: {
    unoptimized: true
  },
  
  // 环境变量配置
  env: {
    // 这些变量将在构建时注入，运行时可以通过process.env访问
  },
  
  // 重写规则，确保API路由在两种环境下都能正常工作
  async rewrites() {
    return [
      // 本地开发时，将API请求重定向到Next.js API路由
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  
  // 跨域配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.FRONTEND_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,PUT,POST,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;