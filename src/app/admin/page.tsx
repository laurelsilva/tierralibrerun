import {
	Users,
	CreditCard,
	Handshake,
	UserCheck,
	Settings,
	Mail,
	Activity,
	BarChart2,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

export default async function AdminPage() {
	return (
		<div className="space-y-8">
			{/* Admin Sections */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
				{/* Users Management */}
				<Card className="transition-shadow hover:shadow-md">
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="bg-secondary text-secondary-foreground rounded-lg p-2">
								<Users className="h-6 w-6" />
							</div>
							<div>
								<CardTitle>Users</CardTitle>
								<CardDescription>Manage all registered users</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4 text-sm">
							Search users, check onboarding status, and open full profiles.
						</p>
						<Button asChild className="w-full">
							<Link href="/admin/users">Open Users</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Athlete Applications */}
				<Card className="transition-shadow hover:shadow-md">
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="bg-primary/15 text-primary rounded-lg p-2">
								<CreditCard className="h-6 w-6" />
							</div>
							<div>
								<CardTitle>Athlete Applications</CardTitle>
							<CardDescription>Manage applications</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4 text-sm">
							Review athlete applications and move accepted athletes through
							confirmation, registration, and onboarding.
						</p>
						<Button asChild className="w-full">
							<Link href="/admin/fund-applications">Open Athlete Queue</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Mentor Applications */}
				<Card className="transition-shadow hover:shadow-md">
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="bg-accent text-accent-foreground rounded-lg p-2">
								<UserCheck className="h-6 w-6" />
							</div>
							<div>
								<CardTitle>Mentor Applications</CardTitle>
							<CardDescription>Manage applications</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4 text-sm">
							Review mentor candidates and track approved mentors through
							pairing and activation.
						</p>
						<Button asChild className="w-full">
							<Link href="/admin/mentor-applications">Open Mentor Queue</Link>
						</Button>
					</CardContent>
				</Card>

				<Card className="transition-shadow hover:shadow-md">
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="bg-primary/15 text-primary rounded-lg p-2">
								<Handshake className="h-6 w-6" />
							</div>
							<div>
								<CardTitle>Mentor Pairings</CardTitle>
							<CardDescription>Match athletes with mentors</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4 text-sm">
							Use the pairing workspace to match athletes with mentors and see
							the live mentor roster in one place.
						</p>
						<Button asChild className="w-full">
							<Link href="/admin/mentor-pairings">Open Pairing Workspace</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Email Broadcasts */}
				<Card className="transition-shadow hover:shadow-md">
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="bg-primary/15 text-primary rounded-lg p-2">
								<Mail className="h-6 w-6" />
							</div>
							<div>
								<CardTitle>Email Broadcasts</CardTitle>
								<CardDescription>Send to groups</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4 text-sm">
							Send one message to active participants, mentors, or newsletter
							subscribers.
						</p>
						<Button asChild className="w-full">
							<Link href="/admin/emails/broadcast">Open Broadcasts</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Active Participants */}
				<Card className="transition-shadow hover:shadow-md">
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="bg-secondary text-secondary-foreground rounded-lg p-2">
								<Activity className="h-6 w-6" />
							</div>
							<div>
								<CardTitle>Active Participants</CardTitle>
							<CardDescription>View upcoming race participants</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4 text-sm">
							View active participants grouped by race series for upcoming
							events.
						</p>
						<Button asChild className="w-full" variant="outline">
							<Link href="/admin/fund-athletes/active">
								Open Active Participants
							</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Debug Tools */}
				<Card className="transition-shadow hover:shadow-md">
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="bg-muted text-muted-foreground rounded-lg p-2">
								<Settings className="h-6 w-6" />
							</div>
							<div>
								<CardTitle>Debug Tools</CardTitle>
								<CardDescription>
									Troubleshooting and diagnostics
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4 text-sm">
							Check auth/session details and debug admin access issues.
						</p>
						<Button asChild variant="outline" className="w-full">
							<Link href="/admin/debug">Open Debug Tools</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Metrics */}
				<Card className="transition-shadow hover:shadow-md">
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="bg-primary/15 text-primary rounded-lg p-2">
								<BarChart2 className="h-6 w-6" />
							</div>
							<div>
								<CardTitle>Metrics</CardTitle>
								<CardDescription>Program health at a glance</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4 text-sm">
							Pipeline breakdowns, stage-by-stage counts, and program-wide
							totals across athletes, mentors, and pairings.
						</p>
						<Button asChild variant="outline" className="w-full">
							<Link href="/admin/metrics">Open Metrics</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
