/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        http: false,
        https: false,
        zlib: false,
      }
    }
    // Ignore Cesium source map warnings
    config.ignoreWarnings = [/Failed to parse source map/]
    return config
  },
}

export default nextConfig
