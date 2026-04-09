import { client } from './client'
import {
	type RaceSeriesListItem,
	type RaceSeriesDetail,
	type RaceDistanceDetail,
	type Company,
	type CompanyWithRaces,
	type RaceOptionForApplication,
	type EventListItem,
	type EventDetail,
} from './types'

// Utility function to get today's date in ISO format
function getTodayISO(): string {
	return new Date().toISOString()
}

// Get all race series with basic info
export async function getAllRaceSeries(): Promise<RaceSeriesListItem[]> {
	return client.fetch(`
    *[_type == "raceSeries"] | order(date desc) {
      _id,
      name,
      "slug": slug.current,
      date,
      location,
      description,
      terrain,
      company->{
        name,
        "slug": slug.current,
        logo{
          asset->{
            _id,
            url
          }
        }
      },
      "coOrganizers": coOrganizers[]->{
        name,
        "slug": slug.current,
        website,
        email,
        logo{
          asset->{
            _id,
            url
          }
        }
      }
    }
  `)
}

// Get upcoming race series only (future dates)
export async function getUpcomingRaceSeries(): Promise<RaceSeriesListItem[]> {
	const today = getTodayISO()
	return client.fetch(
		`
    *[_type == "raceSeries" && date >= $today] | order(date asc) {
      _id,
      name,
      "slug": slug.current,
      date,
      location,
      description,
      terrain,
      company->{
        name,
        "slug": slug.current,
        logo{
          asset->{
            _id,
            url
          }
        }
      },
      "coOrganizers": coOrganizers[]->{
        name,
        "slug": slug.current,
        website,
        email,
        logo{
          asset->{
            _id,
            url
          }
        }
      },
      distances[]->{
        _id,
        distance,
        "slug": slug.current,
        price,
        difficulty,
        elevationGain,
        courseDistance,
        distanceKm,
        distanceMiles,
        timeBased,
        timeDurationHours
      }
    }
  `,
		{ today },
	)
}

// Get race series by slug with all details
export async function getRaceSeriesBySlug(
	slug: string,
): Promise<RaceSeriesDetail | null> {
	return client.fetch(
		`
    *[_type == "raceSeries" && slug.current == $slug][0] {
      _id,
      name,
      "slug": slug.current,
      date,
      location,
      registrationUrl,
      description,
      terrain,
      defaultStartTime,
      image{
        asset->{
          _id,
          url
        }
      },
      imageCredit,
      company->{
        name,
        "slug": slug.current,
        website,
        email,
        logo{
          asset->{
            _id,
            url
          }
        }
      },
      "coOrganizers": coOrganizers[]->{
        name,
        "slug": slug.current,
        website,
        email,
        logo{
          asset->{
            _id,
            url
          }
        }
      },
      distances[]->{
        _id,
        distance,
        "slug": slug.current,
        price,
        difficulty,
        elevationGain,
        courseDistance,
        distanceKm,
        distanceMiles,
        timeBased,
        timeDurationHours,
        startDate,
        cutoffTime
      },
      "relatedEvents": relatedEvents[]->{
        _id,
        title,
        "slug": slug.current,
        eventType,
        startDateTime,
        endDateTime,
        locationName,
        isVirtual,
        audience
      },
      hasShakeoutEvent,
      "shakeoutEvent": shakeoutEvent->{
        _id,
        title,
        "slug": slug.current,
        eventType,
        startDateTime,
        endDateTime,
        locationName,
        isVirtual,
        audience
      }
    }
  `,
		{ slug },
	)
}

// Get race distance by slug with race series info
export async function getRaceDistanceBySlug(
	raceSeriesSlug: string,
	distanceSlug: string,
): Promise<RaceDistanceDetail | null> {
	return client.fetch(
		`
    *[_type == "raceDistance" && slug.current == $distanceSlug && raceSeries->slug.current == $raceSeriesSlug][0] {
      _id,
      distance,
      "slug": slug.current,
      price,
      description,
      difficulty,
      elevationGain,
      courseDistance,
      distanceKm,
      distanceMiles,
      timeBased,
      timeDurationHours,
      startDate,
      cutoffTime,
      courseDescription,
      qualificationRequired,
      qualificationDescription,
      raceSeries->{
        _id,
        name,
        "slug": slug.current,
        date,
        location,
        registrationUrl,
        imageCredit,
        company->{
          name,
          website,
          logo{
            asset->{
              _id,
              url
            }
          }
        },
        "coOrganizers": coOrganizers[]->{
          name,
          "slug": slug.current,
          website,
          email,
          logo{
            asset->{
              _id,
              url
            }
          }
        }
      }
    }
  `,
		{ raceSeriesSlug, distanceSlug },
	)
}

// Get all companies with basic info
export async function getAllCompanies(): Promise<Company[]> {
	return client.fetch(`
    *[_type == "company"] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      description,
      companyType,
      website,
      logo{
        asset->{
          _id,
          url
        }
      }
    }
  `)
}

// Get company by slug with race series
export async function getCompanyBySlug(
	slug: string,
): Promise<CompanyWithRaces | null> {
	return client.fetch(
		`
    *[_type == "company" && slug.current == $slug][0] {
      _id,
      name,
      "slug": slug.current,
      description,
      companyType,
      website,
      email,
      phone,
      socialMedia,
      logo{
        asset->{
          _id,
          url
        }
      },
      "raceSeries": *[_type == "raceSeries" && company._ref == ^._id] | order(date asc) {
        _id,
        name,
        "slug": slug.current,
        date,
        location,
        terrain,
        difficulty,
        "description": coalesce(pt::text(description), description),
        image{
          asset->{
            _id,
            url
          }
        }
      }
    }
  `,
		{ slug },
	)
}

// Get company by name
export async function getCompanyByName(name: string): Promise<Company | null> {
	return client.fetch(
		`
    *[_type == "company" && name == $name][0] {
      _id,
      name,
      "slug": slug.current,
      description,
      companyType,
      website,
      logo{
        asset->{
          _id,
          url
        }
      }
    }
  `,
		{ name },
	)
}

// Get Brooks company by name (searches for "Brooks" in company name)
export async function getBrooksCompany(): Promise<Company | null> {
	return client.fetch(`
    *[_type == "company" && name match "Brooks*"][0] {
      _id,
      name,
      "slug": slug.current,
      description,
      companyType,
      website,
      logo{
        asset->{
          _id,
          url
        }
      }
    }
  `)
}

// Get all companies for sponsor display
export async function getAllCompaniesForSponsors(): Promise<Company[]> {
	return client.fetch(`
    *[_type == "company"] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      description,
      companyType,
      website,
      logo{
        asset->{
          _id,
          url
        }
      }
    }
  `)
}

// Get companies by type
export async function getCompaniesByType(
	companyType: string,
): Promise<Company[]> {
	return client.fetch(
		`
    *[_type == "company" && companyType == $companyType] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      description,
      companyType,
      website,
      logo{
        asset->{
          _id,
          url
        }
      }
    }
  `,
		{ companyType },
	)
}

// Get race companies specifically
export async function getRaceCompanies(): Promise<Company[]> {
	return getCompaniesByType('race-company')
}

// Get sponsor companies specifically
export async function getSponsorCompanies(): Promise<Company[]> {
	return getCompaniesByType('sponsor')
}

// Get community support companies specifically
export async function getCommunityCompanies(): Promise<Company[]> {
	return getCompaniesByType('community-support')
}

// Get all race distances with race series info for application form (upcoming races only)
export async function getAllRaceOptionsForApplication(): Promise<
	RaceOptionForApplication[]
> {
	const today = getTodayISO()
	return client.fetch(
		`
    *[_type == "raceDistance" && raceSeries->date >= $today] | order(raceSeries->date asc) {
      _id,
      distance,
      "slug": slug.current,
      price,
      difficulty,
      elevationGain,
      courseDistance,
      startDate,
      cutoffTime,
      description,
      raceSeries->{
        _id,
        name,
        "slug": slug.current,
        date,
        location,
        registrationUrl,
        description,
        terrain,
        difficulty,
        company->{
          name,
          "slug": slug.current,
          logo{
            asset->{
              _id,
              url
            }
          }
        },
        "coOrganizers": coOrganizers[]->{
          name,
          "slug": slug.current,
          logo{
            asset->{
              _id,
              url
            }
          }
        }
      }
    }
  `,
		{ today },
	)
}

// -----------------------------
// Blog: Types
// -----------------------------

type ImageAsset = {
	asset: {
		_id: string
		url: string
	}
}

export interface PostListItem {
	_id: string
	title: string
	slug: string
	excerpt?: string
	mainImage?: ImageAsset
	imageCredit?: string
	contributors?: Array<{
		_id: string
		name: string
		slug: string
		picture?: ImageAsset
		twitterHandle?: string
		links?: Array<{ label?: string; url?: string }>
	}>
	publishedAt: string
	featured?: boolean
	tags?: string[]
	relatedRaceSeries?: {
		_id: string
		name: string
		slug: string
	} | null
	relatedRaceDistance?: {
		_id: string
		distance: string
		slug: string
	} | null
}

export interface PostDetail extends PostListItem {
	content: unknown[]
	seo?: {
		title?: string
		description?: string
		ogImage?: ImageAsset
	}
}

// -----------------------------
// Blog: Queries
// -----------------------------

// All posts (newest first)
export async function getAllPosts(): Promise<PostListItem[]> {
	return client.fetch(`
    *[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      mainImage{
        asset->{
          _id,
          url
        }
      },
      imageCredit,
      "contributors": contributors[]->{
        "_id": _id,
        name,
        "slug": slug.current,
        picture{
          asset->{
            _id,
            url
          }
        },
        twitterHandle,
        links
      },
      publishedAt,
      featured,
      tags,
      "relatedRaceSeries": relatedRaceSeries->{
        "_id": _id,
        name,
        "slug": slug.current
      },
      "relatedRaceDistance": relatedRaceDistance->{
        "_id": _id,
        distance,
        "slug": slug.current
      }
    }
  `)
}

// Featured posts (limit)
export async function getFeaturedPosts(limit = 3): Promise<PostListItem[]> {
	return client.fetch(
		`
    *[_type == "post" && featured == true] | order(publishedAt desc) [0...$limit] {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      mainImage{
        asset->{
          _id,
          url
        }
      },
      imageCredit,
      "contributors": contributors[]->{
        "_id": _id,
        name,
        "slug": slug.current,
        picture{
          asset->{
            _id,
            url
          }
        },
        twitterHandle,
        links
      },
      publishedAt,
      featured,
      tags,
      "relatedRaceSeries": relatedRaceSeries->{
        "_id": _id,
        name,
        "slug": slug.current
      },
      "relatedRaceDistance": relatedRaceDistance->{
        "_id": _id,
        distance,
        "slug": slug.current
      }
    }
  `,
		{ limit },
	)
}

// Recent posts (limit)
export async function getRecentPosts(limit = 5): Promise<PostListItem[]> {
	return client.fetch(
		`
    *[_type == "post"] | order(publishedAt desc) [0...$limit] {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      mainImage{
        asset->{
          _id,
          url
        }
      },
      imageCredit,
      "contributors": contributors[]->{
        "_id": _id,
        name,
        "slug": slug.current,
        picture{
          asset->{
            _id,
            url
          }
        },
        twitterHandle,
        links
      },
      publishedAt,
      featured,
      tags,
      "relatedRaceSeries": relatedRaceSeries->{
        "_id": _id,
        name,
        "slug": slug.current
      },
      "relatedRaceDistance": relatedRaceDistance->{
        "_id": _id,
        distance,
        "slug": slug.current
      }
    }
  `,
		{ limit },
	)
}

// Posts by tag
export async function getPostsByTag(tagValue: string): Promise<PostListItem[]> {
	const params: Record<string, unknown> = { tag: tagValue }
	return client.fetch(
		`
    *[_type == "post" && $tag in tags] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      mainImage{
        asset->{
          _id,
          url
        }
      },
      imageCredit,
      "contributors": contributors[]->{
        "_id": _id,
        name,
        "slug": slug.current,
        picture{
          asset->{
            _id,
            url
          }
        },
        twitterHandle,
        links
      },
      publishedAt,
      featured,
      tags,
      "relatedRaceSeries": relatedRaceSeries->{
        "_id": _id,
        name,
        "slug": slug.current
      },
      "relatedRaceDistance": relatedRaceDistance->{
        "_id": _id,
        distance,
        "slug": slug.current
      }
    }
  `,
		params,
	)
}

// Single post by slug (with content + SEO)
export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
	return client.fetch(
		`
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      mainImage{
        asset->{
          _id,
          url
        }
      },
      imageCredit,
      "contributors": contributors[]->{
        "_id": _id,
        name,
        "slug": slug.current,
        picture{
          asset->{
            _id,
            url
          }
        },
        twitterHandle,
        links
      },
      publishedAt,
      featured,
      tags,
      content[],
      "seo": {
        "title": coalesce(seo.title, title),
        "description": seo.description,
        "ogImage": seo.ogImage{
          asset->{
            _id,
            url
          }
        }
      },
      "relatedRaceSeries": relatedRaceSeries->{
        "_id": _id,
        name,
        "slug": slug.current
      },
      "relatedRaceDistance": relatedRaceDistance->{
        "_id": _id,
        distance,
        "slug": slug.current
      }
    }
  `,
		{ slug },
	)
}

// Paged posts for listings
export async function getPostsPage(
	page = 1,
	pageSize = 10,
): Promise<{ posts: PostListItem[]; total: number }> {
	const start = Math.max(0, (page - 1) * pageSize)
	const end = start + pageSize
	return client.fetch(
		`
    {
      "posts": *[_type == "post"] | order(publishedAt desc) [$start...$end] {
        _id,
        title,
        "slug": slug.current,
        excerpt,
        mainImage{
          asset->{
            _id,
            url
          }
        },
        imageCredit,
        "contributors": contributors[]->{
          "_id": _id,
          name,
          "slug": slug.current,
          picture{
            asset->{
              _id,
              url
            }
          },
          twitterHandle,
          links
        },
        publishedAt,
        featured,
        tags,
        "relatedRaceSeries": relatedRaceSeries->{
          "_id": _id,
          name,
          "slug": slug.current
        },
        "relatedRaceDistance": relatedRaceDistance->{
          "_id": _id,
          distance,
          "slug": slug.current
        }
      },
      "total": count(*[_type == "post"])
    }
  `,
		{ start, end },
	)
}

// =============================
// Events: Queries
// =============================

// All events (no filter), ordered by start date ascending
export async function getAllEvents(): Promise<EventListItem[]> {
	return client.fetch(`
    *[_type == "event"] | order(startDateTime asc) {
      _id,
      title,
      "slug": slug.current,
      eventType,
      startDateTime,
      endDateTime,
      locationName,
      address,
      mapUrl,
      isVirtual,
      audience,
      image{
        asset->{
          _id,
          url
        }
      },
      imageCredit,
      externalRsvp,
      externalRsvpUrl,
      rsvpEnabled,
      advancedRsvp,
      "relatedRaceSeries": relatedRaceSeries->{
        "_id": _id,
        name,
        "slug": slug.current
      },
      "relatedRaceDistance": relatedRaceDistance->{
        "_id": _id,
        distance,
        "slug": slug.current
      },
      "primaryOrganizer": primaryOrganizer->{
        name,
        "slug": slug.current
      },
      "collaborators": collaborators[]->{
        name,
        "slug": slug.current
      }
    }
  `)
}

// Upcoming (startDateTime >= today) and not cancelled, ordered by soonest
export async function getUpcomingEvents(): Promise<EventListItem[]> {
	const today = getTodayISO()
	return client.fetch(
		`
    *[_type == "event" && startDateTime >= $today && isCancelled != true] | order(startDateTime asc) {
      _id,
      title,
      "slug": slug.current,
      eventType,
      startDateTime,
      endDateTime,
      locationName,
      address,
      mapUrl,
      isVirtual,
      audience,
      image{
        asset->{
          _id,
          url
        }
      },
      imageCredit,
      externalRsvp,
      externalRsvpUrl,
      rsvpEnabled,
      advancedRsvp,
      "relatedRaceSeries": relatedRaceSeries->{
        "_id": _id,
        name,
        "slug": slug.current
      },
      "relatedRaceDistance": relatedRaceDistance->{
        "_id": _id,
        distance,
        "slug": slug.current
      },
      "primaryOrganizer": primaryOrganizer->{
        name,
        "slug": slug.current
      },
      "collaborators": collaborators[]->{
        name,
        "slug": slug.current
      }
    }
  `,
		{ today },
	)
}

// Single event by slug with full details
export async function getEventBySlug(
	slug: string,
): Promise<EventDetail | null> {
	return client.fetch(
		`
    *[_type == "event" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      eventType,
      excerpt,
      startDateTime,
      endDateTime,
      locationName,
      address,
      mapUrl,
      isVirtual,
      audience,
      isCancelled,
      publishedAt,
      image{
        asset->{
          _id,
          url
        }
      },
      imageCredit,
      content[],
      rsvpEnabled,
      advancedRsvp,
      rsvpQuestionsPreset,
      "rsvpQuestions": rsvpQuestions[]{
        key,
        label,
        description,
        type,
        required,
        category,
        allowOther,
        otherLabel,
        placeholder,
        maxLength,
        consentText,
        "attachmentUrl": attachment.asset->url,
        visibleIf,
        ui,
        order,
        options[]{
          label,
          value,
          description
        }
      },
      rsvpLimit,
      rsvpStart,
      rsvpEnd,
      externalRsvp,
      externalRsvpUrl,
      "relatedRaceSeries": relatedRaceSeries->{
        "_id": _id,
        name,
        "slug": slug.current
      },
      "relatedRaceDistance": relatedRaceDistance->{
        "_id": _id,
        distance,
        "slug": slug.current
      },
      "primaryOrganizer": primaryOrganizer->{
        name,
        "slug": slug.current
      },
      "collaborators": collaborators[]->{
        name,
        "slug": slug.current
      }
    }
  `,
		{ slug },
	)
}

// Single event by ID with full details (for API routes)
export async function getEventById(id: string): Promise<EventDetail | null> {
	return client.fetch(
		`
    *[_type == "event" && _id == $id][0] {
      _id,
      title,
      "slug": slug.current,
      eventType,
      excerpt,
      startDateTime,
      endDateTime,
      locationName,
      address,
      mapUrl,
      isVirtual,
      audience,
      isCancelled,
      publishedAt,
      image{
        asset->{
          _id,
          url
        }
      },
      imageCredit,
      content[],
      rsvpEnabled,
      advancedRsvp,
      rsvpQuestionsPreset,
      "rsvpQuestions": rsvpQuestions[]{
        key,
        label,
        description,
        type,
        required,
        category,
        allowOther,
        otherLabel,
        placeholder,
        maxLength,
        consentText,
        "attachmentUrl": attachment.asset->url,
        visibleIf,
        ui,
        order,
        options[]{
          label,
          value,
          description
        }
      },
      rsvpLimit,
      rsvpStart,
      rsvpEnd,
      externalRsvp,
      externalRsvpUrl,
      "relatedRaceSeries": relatedRaceSeries->{
        "_id": _id,
        name,
        "slug": slug.current
      },
      "relatedRaceDistance": relatedRaceDistance->{
        "_id": _id,
        distance,
        "slug": slug.current
      },
      "primaryOrganizer": primaryOrganizer->{
        name,
        "slug": slug.current
      },
      "collaborators": collaborators[]->{
        name,
        "slug": slug.current
      }
    }
  `,
		{ id },
	)
}

export async function getEventsByIds(ids: string[]): Promise<EventListItem[]> {
	if (!ids || ids.length === 0) return []
	return client.fetch(
		`
    *[_type == "event" && _id in $ids] {
      _id,
      title,
      "slug": slug.current,
      eventType,
      startDateTime,
      endDateTime,
      locationName,
      address,
      mapUrl,
      isVirtual,
      audience,
      image{
        asset->{
          _id,
          url
        }
      },
      imageCredit,
      externalRsvp,
      externalRsvpUrl,
      rsvpEnabled,
      advancedRsvp,
      "rsvpQuestions": rsvpQuestions[]{
        key,
        label,
        type,
        required,
        category
      },
      "relatedRaceSeries": relatedRaceSeries->{
        "_id": _id,
        name,
        "slug": slug.current
      },
      "relatedRaceDistance": relatedRaceDistance->{
        "_id": _id,
        distance,
        "slug": slug.current
      },
      "primaryOrganizer": primaryOrganizer->{
        name,
        "slug": slug.current
      },
      "collaborators": collaborators[]->{
        name,
        "slug": slug.current
      }
    }
    `,
		{ ids },
	)
}

export async function getUpcomingEventsForRace(
	raceSeriesId?: string,
	raceDistanceId?: string,
	limit: number = 5,
): Promise<EventListItem[]> {
	const today = getTodayISO()
	return client.fetch(
		`
    *[_type == "event" && startDateTime >= $today && isCancelled != true && (
      (defined(relatedRaceSeries) && relatedRaceSeries._ref == $raceSeriesId) ||
      (defined(relatedRaceDistance) && relatedRaceDistance._ref == $raceDistanceId)
    )] | order(startDateTime asc) [0...$limit] {
      _id,
      title,
      "slug": slug.current,
      eventType,
      startDateTime,
      endDateTime,
      locationName,
      address,
      mapUrl,
      isVirtual,
      audience,
      image{
        asset->{
          _id,
          url
        }
      },
      imageCredit,
      externalRsvp,
      externalRsvpUrl,
      rsvpEnabled,
      "relatedRaceSeries": relatedRaceSeries->{
        "_id": _id,
        name,
        "slug": slug.current
      },
      "relatedRaceDistance": relatedRaceDistance->{
        "_id": _id,
        distance,
        "slug": slug.current
      },
      "primaryOrganizer": primaryOrganizer->{
        name,
        "slug": slug.current
      },
      "collaborators": collaborators[]->{
        name,
        "slug": slug.current
      }
    }
  `,
		{ today, raceSeriesId, raceDistanceId, limit },
	)
}
