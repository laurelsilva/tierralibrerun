import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { generateMetadata } from '@/lib/metadata'
import { getPostsPage } from '@/lib/sanity/queries'
import { type PostListItem } from '@/lib/sanity/types'

// Static ISR revalidation for freshness
export const revalidate = 60

export const metadata = generateMetadata({
	title: 'Blog',
	description:
		'Stories, updates, and community highlights from Trail Running Community. Read about races and the athletes shaping our trail community.',
	url: '/blog',
})

type SearchParams = Record<string, string | string[] | undefined>

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

function PostCard({ post }: { post: PostListItem }) {
	const hasImage = !!post.mainImage?.asset?.url

	return (
		<article className="bg-card flex flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md">
			{hasImage && (
				<div className="relative h-48 w-full">
					<Image
						src={post.mainImage!.asset.url}
						alt={post.title}
						fill
						sizes="(max-width: 768px) 100vw, 33vw"
						className="object-cover"
						priority={false}
					/>
					{post.imageCredit && (
						<div className="absolute right-2 bottom-2 rounded bg-black/40 px-2 py-1 text-[10px] text-white/80">
							{post.imageCredit}
						</div>
					)}
				</div>
			)}

			<div className="flex flex-1 flex-col p-5">
				<header className="mb-3">
					<h3 className="text-foreground line-clamp-2 text-xl leading-snug font-semibold">
						<Link
							href={`/blog/${post.slug}`}
							className="hover:text-primary transition-colors"
						>
							{post.title}
						</Link>
					</h3>
					<p className="text-muted-foreground mt-1 text-xs">
						{formatDate(post.publishedAt)}
					</p>
				</header>

				{post.excerpt && (
					<p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
						{post.excerpt}
					</p>
				)}

				{post.tags && post.tags.length > 0 && (
					<div className="mb-4 flex flex-wrap gap-2">
						{post.tags.slice(0, 4).map((tag) => (
							<Badge key={tag} variant="secondary" className="text-xs">
								#{tag}
							</Badge>
						))}
						{post.tags.length > 4 && (
							<Badge variant="outline" className="text-xs">
								+{post.tags.length - 4}
							</Badge>
						)}
					</div>
				)}

				{(post.relatedRaceSeries || post.relatedRaceDistance) && (
					<div className="text-muted-foreground mb-4 text-xs">
						{post.relatedRaceSeries && (
							<>
								Race:{' '}
								<Link
									href={`/races/${post.relatedRaceSeries.slug}`}
									className="text-foreground underline-offset-4 hover:underline"
								>
									{post.relatedRaceSeries.name}
								</Link>
							</>
						)}
						{post.relatedRaceDistance && (
							<>
								{post.relatedRaceSeries ? ' • ' : ''}
								Distance: {post.relatedRaceDistance.distance}
							</>
						)}
					</div>
				)}

				<div className="mt-auto pt-2">
					<Button asChild variant="outline" size="sm" className="w-full">
						<Link href={`/blog/${post.slug}`}>Read post</Link>
					</Button>
				</div>
			</div>
		</article>
	)
}

function Pagination({
	currentPage,
	totalPages,
}: {
	currentPage: number
	totalPages: number
}) {
	const prevHref = currentPage > 2 ? `/blog?page=${currentPage - 1}` : '/blog'
	const nextHref = `/blog?page=${currentPage + 1}`

	return (
		<nav
			className="mt-10 flex items-center justify-between gap-3"
			aria-label="Pagination"
		>
			<Button asChild variant="outline" disabled={currentPage <= 1}>
				<Link href={prevHref} aria-disabled={currentPage <= 1}>
					← Newer
				</Link>
			</Button>

			<span className="text-muted-foreground text-sm">
				Page {currentPage} of {totalPages || 1}
			</span>

			<Button asChild variant="outline" disabled={currentPage >= totalPages}>
				<Link href={nextHref} aria-disabled={currentPage >= totalPages}>
					Older →
				</Link>
			</Button>
		</nav>
	)
}

export default async function BlogPage(props: {
	searchParams?: Promise<SearchParams>
}) {
	const searchParams = (await props.searchParams) || {}
	const rawPage = Array.isArray(searchParams.page)
		? searchParams.page[0]
		: searchParams.page
	const currentPage = Math.max(1, parseInt(rawPage || '1', 10) || 1)
	const pageSize = 6

	const { posts, total } = await getPostsPage(currentPage, pageSize)
	const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))

	return (
		<main className="text-foreground">
			{/* Hero */}
			<section className="bg-primary py-20 md:py-28">
				<div className="container mx-auto px-4 md:px-6">
					<div className="text-primary-foreground text-center">
						<h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
							Blog
						</h1>
						<p className="text-primary-foreground/90 mx-auto max-w-2xl text-lg md:text-xl">
							Stories, updates, and community highlights from Trail Running Community
						</p>
					</div>
				</div>
			</section>

			{/* Listing */}
			<section className="py-12 md:py-16">
				<div className="container mx-auto px-4 md:px-6">
					{posts.length === 0 ? (
						<div className="bg-card mx-auto max-w-2xl rounded-2xl border p-8 text-center shadow-sm">
							<h2 className="mb-2 text-2xl font-semibold">
								No posts{currentPage > 1 ? ' on this page' : ''} yet
							</h2>
							<p className="text-muted-foreground mb-6">
								Check back soon for new stories from our community.
							</p>
							{currentPage > 1 && (
								<Button asChild variant="outline">
									<Link href="/blog">Go to first page</Link>
								</Button>
							)}
						</div>
					) : (
						<>
							<div className="mb-6 flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									Showing {(currentPage - 1) * pageSize + 1}–
									{(currentPage - 1) * pageSize + posts.length} of {total} posts
								</p>
							</div>

							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								{posts.map((post) => (
									<PostCard key={post._id} post={post} />
								))}
							</div>

							<Pagination currentPage={currentPage} totalPages={totalPages} />
						</>
					)}
				</div>
			</section>
		</main>
	)
}
