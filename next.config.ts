import { type NextConfig } from 'next'

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.sanity.io',
				port: '',
				pathname: '/images/**',
			},
		],
		formats: ['image/avif', 'image/webp'],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		minimumCacheTTL: 60,
		qualities: [75, 80, 85],
	},
	// Optimize production builds
	compiler: {
		removeConsole:
			process.env.NODE_ENV === 'production'
				? {
						exclude: ['error', 'warn'],
					}
				: false,
	},
	experimental: {
		// Optimize package imports for better performance
		optimizePackageImports: [
			'@clerk/nextjs',
			'framer-motion',
			'lucide-react',
			'@radix-ui/react-dropdown-menu',
		],
	},
}

export default nextConfig
