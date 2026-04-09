'use client'

/**
 * This configuration is used to for the Sanity Studio that's mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schema'

export default defineConfig({
	basePath: '/studio',
	projectId,
	dataset,
	// Add and edit the content schema in the './sanity/schema' folder
	schema,
	plugins: [
		structureTool({
			structure: (S) =>
				S.list()
					.title('Content')
					.items([
						S.listItem()
							.title('Companies')
							.id('companies')
							.child(S.documentTypeList('company').title('Companies')),
						S.divider(),
						S.listItem()
							.title('Race Series')
							.id('raceSeries')
							.child(
								S.documentTypeList('raceSeries')
									.title('All Race Series')
									.filter('_type == "raceSeries" && date >= now() && archived != true')
									.defaultOrdering([{field: 'date', direction: 'asc'}])
							),
						S.listItem()
							.title('Events')
							.id('events')
							.child(
								S.documentTypeList('event')
									.title('All Events')
									.filter('_type == "event"')
									.defaultOrdering([{field: 'startDateTime', direction: 'asc'}])
							),
						S.listItem()
							.title('Upcoming Events')
							.id('upcomingEvents')
							.child(
								S.documentTypeList('event')
									.title('Upcoming Events')
									.filter(
										'_type == "event" && startDateTime >= now() && isCancelled != true'
									)
									.defaultOrdering([{field: 'startDateTime', direction: 'asc'}])
							),
						S.listItem()
							.title('Past Events')
							.id('pastEvents')
							.child(
								S.documentTypeList('event')
									.title('Past Events')
									.filter(
										'_type == "event" && coalesce(endDateTime, startDateTime) < now()'
									)
									.defaultOrdering([
										{field: 'startDateTime', direction: 'desc'}
									])
							),
						S.listItem()
							.title('Archived Events')
							.id('archivedEvents')
							.child(
								S.documentTypeList('event')
									.title('Archived Events')
									.filter(
										'_type == "event" && coalesce(endDateTime, startDateTime) < now()'
									)
									.defaultOrdering([
										{field: 'startDateTime', direction: 'desc'}
									])
							),
						S.divider(),
						S.listItem()
							.title('Past Races')
							.id('pastRaces')
							.child(
								S.documentTypeList('raceSeries')
									.title('Past Races')
									.filter('_type == "raceSeries" && date < now() && archived != true')
									.defaultOrdering([{field: 'date', direction: 'desc'}])
							),
						S.listItem()
							.title('Archived Races')
							.id('archivedRaces')
							.child(
								S.documentTypeList('raceSeries')
									.title('Archived Races')
									.filter('_type == "raceSeries" && archived == true')
									.defaultOrdering([{field: 'date', direction: 'desc'}])
							),
						S.divider(),
						S.listItem()
							.title('Blog')
							.id('blog')
							.child(
								S.documentTypeList('post')
									.title('All Posts')
									.filter('_type == "post"')
									.defaultOrdering([{field: 'publishedAt', direction: 'desc'}])
							),
						S.listItem()
							.title('Contributors')
							.id('contributors')
							.child(
								S.documentTypeList('contributor')
									.title('All Contributors')
									.filter('_type == "contributor"')
									.defaultOrdering([{field: 'name', direction: 'asc'}])
							)
					])
		}),
		// Vision is a tool that lets you query your content with GROQ in the studio
		// https://www.sanity.io/docs/the-vision-plugin
		visionTool({defaultApiVersion: apiVersion})
	]
})
