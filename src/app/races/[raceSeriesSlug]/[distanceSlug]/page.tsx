import { notFound } from 'next/navigation'
import RaceDistanceContent from '@/components/race-distance-content'
import { generateRaceDistanceMetadata } from '@/lib/metadata'
import { getRaceDistanceBySlug } from '@/lib/sanity/queries'

export async function generateMetadata({
  params
}: {
  params: Promise<{ raceSeriesSlug: string; distanceSlug: string }>
}) {
  const { raceSeriesSlug, distanceSlug } = await params
  const distance = await getRaceDistanceBySlug(raceSeriesSlug, distanceSlug)
  
  if (!distance) {
    return {
      title: 'Race Distance Not Found | Trail Running Community',
      description: 'The requested race distance could not be found.'
    }
  }
  
  return generateRaceDistanceMetadata(distance)
}

export default async function RaceDistancePage({
  params
}: {
  params: Promise<{ raceSeriesSlug: string; distanceSlug: string }>
}) {
  const { raceSeriesSlug, distanceSlug } = await params
  const distance = await getRaceDistanceBySlug(raceSeriesSlug, distanceSlug)

  if (!distance) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <RaceDistanceContent 
        distance={distance} 
        raceSeriesSlug={raceSeriesSlug} 
        showBreadcrumb={true}
      />
    </div>
  )
}