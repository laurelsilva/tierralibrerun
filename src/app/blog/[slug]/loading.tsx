export default function Loading() {
  return (
    <main className="text-foreground">
      {/* Hero skeleton */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 h-10 w-3/4 animate-pulse rounded-lg bg-primary-foreground/30 md:h-12" />
            <div className="mx-auto h-4 w-1/2 animate-pulse rounded bg-primary-foreground/20" />
            <div className="mx-auto mt-4 flex w-full max-w-xs items-center justify-center gap-2">
              <span className="h-6 w-14 animate-pulse rounded-full bg-primary-foreground/20" />
              <span className="h-6 w-14 animate-pulse rounded-full bg-primary-foreground/20" />
              <span className="h-6 w-14 animate-pulse rounded-full bg-primary-foreground/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Hero image skeleton */}
      <section className="bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative mx-auto -mt-10 h-72 max-w-5xl animate-pulse overflow-hidden rounded-2xl border bg-muted sm:h-96 md:-mt-16" />
        </div>
      </section>

      {/* Content skeleton */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            {/* Excerpt */}
            <div className="mb-8 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>

            {/* Body */}
            <div className="space-y-3">
              <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
              <div className="h-4 w-10/12 animate-pulse rounded bg-muted" />
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-5 w-1/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-10/12 animate-pulse rounded bg-muted" />
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-5 w-1/5 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-9/12 animate-pulse rounded bg-muted" />
            </div>

            {/* Related box skeleton */}
            <div className="bg-card mt-10 rounded-xl border p-4">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
            </div>

            {/* Back button skeleton */}
            <div className="mt-8 h-10 w-36 animate-pulse rounded-lg border bg-card" />
          </div>
        </div>
      </section>
    </main>
  )
}
