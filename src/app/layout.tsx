import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { type Metadata, type Viewport } from 'next'
import localFont from 'next/font/local'
import { Toaster } from 'sonner'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { siteConfig, socialConfig } from '@/lib/config/site'
import { env } from '@/lib/env'
import '@/styles/globals.css'

const wotfard = localFont({
	src: [
		{
			path: './fonts/wotfard/Wotfard-Regular.ttf',
			weight: '400',
			style: 'normal',
		},
		{
			path: './fonts/wotfard/Wotfard-Medium.ttf',
			weight: '500',
			style: 'normal',
		},
		{
			path: './fonts/wotfard/Wotfard-SemiBold.ttf',
			weight: '600',
			style: 'normal',
		},
		{
			path: './fonts/wotfard/Wotfard-Bold.ttf',
			weight: '700',
			style: 'normal',
		},
	],
	variable: '--font-sans',
	display: 'swap',
	preload: true,
	fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: `${siteConfig.name} - Trail Running Community`,
	description: siteConfig.description,
	keywords: siteConfig.keywords,

	// Open Graph
	openGraph: {
		title: `${siteConfig.name} - Trail Running Community`,
		description: siteConfig.description,
		url: siteConfig.url,
		siteName: siteConfig.name,
		locale: siteConfig.locale,
		type: 'website',
		images: [
			{
				url: 'https://cdn.sanity.io/images/qgy6qhm1/production/27d494a084b28c73270946755e0811592b67bd22-4160x6240.jpg',
				width: 1200,
				height: 630,
				alt: `${siteConfig.name} - Trail Running Community`,
			},
		],
	},

	// Twitter
	twitter: {
		card: 'summary_large_image',
		title: `${siteConfig.name} - Trail Running Community`,
		description: siteConfig.description,
		images: ['https://cdn.sanity.io/images/qgy6qhm1/production/27d494a084b28c73270946755e0811592b67bd22-4160x6240.jpg'],
		creator: socialConfig.twitterHandle ? `@${socialConfig.twitterHandle}` : undefined,
	},

	// Additional metadata
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},

	// Verification and other meta tags
	verification: {
		google: process.env.GOOGLE_SITE_VERIFICATION,
	},

	// App metadata
	applicationName: siteConfig.name,
	referrer: 'origin-when-cross-origin',
	creator: siteConfig.name,
	publisher: siteConfig.name,
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
}

export const viewport: Viewport = {
	colorScheme: 'dark light',
}

const cx = (...classes: (string | false | null | undefined)[]) =>
	classes.filter(Boolean).join(' ')

export default function RootLayout({
	children,
	modal,
}: Readonly<{
	children: React.ReactNode
	modal: React.ReactNode
}>) {
	const baseUrl = siteConfig.url
	const signInFallbackRedirectUrl =
		env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ??
		env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
	const signUpFallbackRedirectUrl =
		env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ??
		env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL

	const socialLinks = [
		socialConfig.instagram,
		socialConfig.twitter,
	].filter(Boolean)

	const organizationJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: siteConfig.name,
		description: siteConfig.description,
		url: baseUrl,
		logo: 'https://cdn.sanity.io/images/qgy6qhm1/production/27d494a084b28c73270946755e0811592b67bd22-4160x6240.jpg',
		...(socialLinks.length > 0 && { sameAs: socialLinks }),
		foundingDate: siteConfig.foundingYear,
		areaServed: 'United States',
		knowsAbout: [
			'Trail Running',
			'Trail Athletes',
			'Community Building',
			'Race Funding',
			'Outdoor Recreation',
		],
	}

	const websiteJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: siteConfig.name,
		description: siteConfig.description,
		url: baseUrl,
		potentialAction: {
			'@type': 'SearchAction',
			target: `${baseUrl}/races?search={search_term_string}`,
			'query-input': 'required name=search_term_string',
		},
	}

	return (
		<ClerkProvider
			signInFallbackRedirectUrl={signInFallbackRedirectUrl}
			signUpFallbackRedirectUrl={signUpFallbackRedirectUrl}
		>
			<html
				lang="en"
				className={cx(
					wotfard.variable,
					'bg-primary text-foreground antialiased',
				)}
				suppressHydrationWarning // Add this to suppress hydration warnings related to theme
			>
				<head>
					{/* Preconnect to external domains for faster resource loading */}
					<link rel="preconnect" href="https://cdn.sanity.io" />
					<link rel="dns-prefetch" href="https://cdn.sanity.io" />
					<script
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify(organizationJsonLd),
						}}
					/>
					<script
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify(websiteJsonLd),
						}}
					/>
				</head>
				<body className="flex min-h-screen flex-col">
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<Header />
						<main className="grow">
							{children}
							{modal}
							<Toaster position="top-right" />
						</main>
						<Footer />
					</ThemeProvider>
					<Analytics />
					<SpeedInsights />
				</body>
			</html>
		</ClerkProvider>
	)
}
