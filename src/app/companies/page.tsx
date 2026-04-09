import Link from 'next/link'
import CompanyLogo from '@/components/company-logo'
import { Badge } from '@/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { companiesMetadata } from '@/lib/metadata'
import { getRaceCompanies } from '@/lib/sanity/queries'

export const revalidate = 60
export const metadata = companiesMetadata

function formatCompanyType(value?: string) {
	if (!value) return 'Race company'
	return value.replace(/-/g, ' ')
}

export default async function CompaniesPage() {
	const companies = await getRaceCompanies()

	return (
		<div className="container mx-auto px-6 py-12 sm:px-8 lg:px-12">
			<div className="mb-12 max-w-3xl space-y-4">
				<h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
					Race Companies
				</h1>
				<p className="text-muted-foreground text-lg">
					Profiles for every race organizer partnering with Trail Running Community.
					Explore the races they support through the BIPOC Athlete Fund.
				</p>
				{companies.length > 0 && (
					<p className="text-muted-foreground text-sm">
						{companies.length} partner{companies.length !== 1 ? 's' : ''} listed
					</p>
				)}
			</div>

			{companies.length === 0 ? (
				<div className="rounded-lg border border-dashed p-8 text-center">
					<p className="text-muted-foreground text-lg">
						No race companies found yet. Check back soon.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
					{companies.map((company) => (
						<Link
							key={company._id}
							href={`/companies/${company.slug}`}
							className="group block h-full"
						>
							<Card className="h-full transition-all duration-150 group-hover:-translate-y-1 group-hover:shadow-lg">
								<CardHeader className="flex flex-row items-start gap-4 pb-4">
									<CompanyLogo
										logo={company.logo}
										companyName={company.name}
										width={64}
										height={64}
										className="shrink-0"
									/>
									<div className="space-y-2">
										<CardTitle className="text-lg leading-tight font-semibold">
											{company.name}
										</CardTitle>
										{company.companyType && (
											<Badge
												variant="secondary"
												className="text-xs font-normal capitalize"
											>
												{formatCompanyType(company.companyType)}
											</Badge>
										)}
									</div>
								</CardHeader>
								<CardContent className="pt-0">
									<CardDescription className="mb-4 line-clamp-3 leading-relaxed">
										{company.description ||
											'Race organizer supporting the BIPOC Athlete Fund.'}
									</CardDescription>
									<span className="text-primary inline-flex items-center gap-1 text-sm font-medium">
										View profile →
									</span>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	)
}
