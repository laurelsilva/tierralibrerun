import { type NextConfig } from 'next'

const nextConfig: NextConfig = {
	images: {
		// Sanity CDN handles resizing + WebP/AVIF conversion at the edge.
		// The loader passes width/quality params directly to cdn.sanity.io,
		// avoiding Next.js downloading full-resolution originals for processing.
		loader: 'custom',
		loaderFile: './src/lib/sanity-image-loader.ts',
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.sanity.io',
				port: '',
				pathname: '/images/**',
			},
		],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
