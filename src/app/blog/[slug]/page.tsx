import { type TypedObject, type PortableTextBlock } from '@portabletext/types'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PortableText, type PortableTextComponents } from 'next-sanity'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { generateMetadata as buildMetadata } from '@/lib/metadata'
import { getPostBySlug } from '@/lib/sanity/queries'
import { type PostDetail } from '@/lib/sanity/types'

export const revalidate = 60

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const post = await getPostBySlug(slug)

	if (!post) {
		return buildMetadata({
			title: 'Post Not Found',
			description: 'The requested blog post could not be found.',
			url: `/blog/${slug}`,
			type: 'article',
		})
	}

	const image =
		post.seo?.ogImage?.asset?.url ||
		post.mainImage?.asset?.url ||
		'/running2.jpg'

	return buildMetadata({
		title: post.seo?.title || post.title,
		description:
			post.seo?.description || post.excerpt || 'Trail Running Community blog article',
		image,
		url: `/blog/${post.slug}`,
		type: 'article',
		publishedTime: post.publishedAt,
	})
}

function formatDate(iso?: string) {
	if (!iso) return ''
	try {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	} catch {
		return ''
	}
}

const portableTextComponents: PortableTextComponents = {
	types: {
		image: ({
			value,
		}: {
			value: { asset?: { url?: string }; alt?: string; caption?: string }
		}) => {
			const url = value?.asset?.url
			const alt = value?.alt || ''
			const caption = value?.caption

			if (!url) return null

			return (
				<figure className="my-6">
					{/* Using next/image as the project already handles remote Sanity assets */}
					<div className="relative h-72 w-full overflow-hidden rounded-lg sm:h-96">
						<Image
							src={url}
							alt={alt}
							fill
							sizes="(max-width: 768px) 100vw, 75vw"
							className="object-cover"
						/>
					</div>
					{(caption || alt) && (
						<figcaption className="text-muted-foreground mt-2 text-center text-sm">
							{caption || alt}
						</figcaption>
					)}
				</figure>
			)
		},
	},
	block: {
		h2: ({ children }: { children?: React.ReactNode }) => (
			<h2 className="mt-10 mb-4 text-2xl font-bold tracking-tight">
				{children}
			</h2>
		),
		h3: ({ children }: { children?: React.ReactNode }) => (
			<h3 className="mt-8 mb-3 text-xl font-semibold tracking-tight">
				{children}
			</h3>
		),
		blockquote: ({ children }: { children?: React.ReactNode }) => (
			<blockquote className="border-l-4 pl-4 italic">{children}</blockquote>
		),
		normal: ({ children }: { children?: React.ReactNode }) => (
			<p className="mb-4 leading-7">{children}</p>
		),
	},
	marks: {
		link: ({
			children,
			value,
		}: {
			children: React.ReactNode
			value?: { href?: string; openInNewTab?: boolean }
		}) => {
			const href = value?.href || '#'
			const newTab = !!value?.openInNewTab
			return (
				<a
					href={href}
					target={newTab ? '_blank' : undefined}
					rel={newTab ? 'noopener noreferrer' : undefined}
					className="text-primary underline-offset-4 hover:underline"
				>
					{children}
				</a>
			)
		},
	},
}

export default async function BlogPostPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const post: PostDetail | null = await getPostBySlug(slug)

	if (!post) {
		notFound()
	}

	{
		/* PortableText imported from next-sanity */
	}

	const hasHeroImage = !!post.mainImage?.asset?.url

	return (
		<main className="text-foreground">
			{/* Hero */}
			{!hasHeroImage && (
				<section className="bg-primary py-12 md:py-16">
					<div className="container mx-auto px-4 md:px-6">
						<div className="mx-auto max-w-3xl text-center">
							<h1 className="text-primary-foreground mb-4 text-4xl font-bold md:text-5xl">
								{post.title}
							</h1>
							<div className="text-primary-foreground/90 mx-auto mt-3 text-sm">
								{formatDate(post.publishedAt)}
							</div>

							{post.tags && post.tags.length > 0 && (
								<div className="mt-4 flex flex-wrap items-center justify-center gap-2">
									{post.tags.map((tag) => (
										<Badge key={tag} variant="secondary" className="text-xs">
											#{tag}
										</Badge>
									))}
								</div>
							)}
						</div>
					</div>
				</section>
			)}

			{/* Hero image */}
			{hasHeroImage && (
				<section className="bg-background relative z-0 pt-[calc(64px+4rem)] md:pt-[calc(72px+6.25rem)]">
					<div className="container mx-auto px-4 md:px-6">
						<div className="relative z-0 mx-auto -mt-[calc(64px+2.75rem)] h-[52vh] w-full overflow-hidden rounded-[30px] border border-white/10 shadow-2xl sm:h-[60vh] md:-mt-[calc(72px+3rem)] lg:h-[68vh]">
							<Image
								src={post.mainImage!.asset.url}
								alt={post.title}
								fill
								sizes="100vw"
								className="object-cover"
								priority={false}
							/>
							{/* Stronger, soft tint for readability */}
							<div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/80 via-black/35 to-transparent" />
							{/* Image credit */}
							{post.imageCredit && (
								<div className="absolute right-5 bottom-5 z-20 rounded-md bg-black/55 px-3 py-1.5 text-[11px] text-white/90 backdrop-blur-sm">
									{post.imageCredit}
								</div>
							)}
							{/* Overlay content with clear hierarchy on desktop (bottom-left), hidden on small screens */}
							<div className="absolute right-8 bottom-10 left-8 z-20 hidden md:block lg:right-12 lg:bottom-14 lg:left-12">
								{/* Title */}
								<h1 className="max-w-5xl text-4xl leading-tight font-bold text-balance text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] md:text-5xl lg:text-6xl">
									{post.title}
								</h1>
								{/* Meta row: contributors + date */}
								<div className="mt-4 flex flex-wrap items-center gap-4 text-white/95">
									<div className="text-sm">{formatDate(post.publishedAt)}</div>
								</div>
								{/* Kicker (Tags) */}
								{post.tags && post.tags.length > 0 && (
									<div className="mt-3 flex flex-wrap gap-2">
										{post.tags.slice(0, 3).map((tag) => (
											<span
												key={tag}
												className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm"
											>
												#{tag}
											</span>
										))}
									</div>
								)}
							</div>
						</div>
						{/* Mobile meta below hero (clear hierarchy for small screens) */}
						<div className="mt-4 flex flex-col gap-3 md:hidden">
							<h1 className="text-foreground text-2xl leading-tight font-bold">
								{post.title}
							</h1>
							<div className="text-muted-foreground text-xs">
								{formatDate(post.publishedAt)}
							</div>
							{post.tags && post.tags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{post.tags.slice(0, 3).map((tag) => (
										<span
											key={tag}
											className="bg-muted text-foreground/80 rounded-full px-2.5 py-1 text-[11px] font-medium"
										>
											#{tag}
										</span>
									))}
								</div>
							)}
						</div>
					</div>
				</section>
			)}

			{/* Content */}
			<section className="py-10 md:py-16">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mx-auto max-w-3xl">
						{post.excerpt && (
							<div className="border-border bg-card/50 mb-8 rounded-xl border p-5 shadow-sm">
								<p className="text-muted-foreground text-lg leading-relaxed">
									{post.excerpt}
								</p>
							</div>
						)}

						<div className="prose prose-invert prose-lg lg:prose-xl prose-p:leading-7 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl max-w-none [--tw-prose-body:var(--foreground)] [--tw-prose-bold:var(--foreground)] [--tw-prose-captions:var(--muted-foreground)] [--tw-prose-code:var(--foreground)] [--tw-prose-headings:var(--foreground)] [--tw-prose-hr:var(--border)] [--tw-prose-links:var(--primary)] [--tw-prose-pre-bg:var(--card)] [--tw-prose-pre-code:var(--foreground)] [--tw-prose-quotes:var(--foreground)]">
							<PortableText
								value={
									(Array.isArray(post.content)
										? (post.content as PortableTextBlock[])
										: ([] as TypedObject[])) as TypedObject | TypedObject[]
								}
								components={portableTextComponents}
							/>
						</div>

						<div className="mt-10">
							<Button asChild variant="outline">
								<Link href="/blog">← Back to Blog</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</main>
	)
}
