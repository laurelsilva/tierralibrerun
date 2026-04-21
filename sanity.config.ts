'use client'

/**
 * This configuration is used to for the Sanity Studio that's mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { apiVersion, dataset, projectId } from './sanity/env'
import { schema } from './sanity/schema'

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
						S.listItem()
							.title('Races by Company')
							.id('racesByCompany')
							.child(
								S.documentTypeList('company')
									.title('Race Companies')
									.filter('_type == "company"')
									.defaultOrdering([{ field: 'name', direction: 'asc' }])
									.child((companyId) =>
										S.list()
											.title('Races')
											.items([
												S.listItem()
													.title('Upcoming Races')
													.id('upcoming')
													.child(
														S.documentList()
															.title('Upcoming Races')
															.schemaType('raceSeries')
															.filter(
																'_type == "raceSeries" && company._ref == $companyId && date >= now() && archived != true',
															)
															.params({ companyId })
															.defaultOrdering([
																{ field: 'date', direction: 'asc' },
															])
															.canHandleIntent(
																(intentName, params) =>
																	intentName === 'edit' &&
																	params.type === 'raceSeries',
															),
													),
												S.listItem()
													.title('Past Races')
													.id('past')
													.child(
														S.documentList()
															.title('Past Races')
															.schemaType('raceSeries')
															.filter(
																'_type == "raceSeries" && company._ref == $companyId && date < now() && archived != true',
															)
															.params({ companyId })
															.defaultOrdering([
																{ field: 'date', direction: 'desc' },
															])
															.canHandleIntent(
																(intentName, params) =>
																	intentName === 'edit' &&
																	params.type === 'raceSeries',
															),
													),
												S.listItem()
													.title('Archived Races')
													.id('archived')
													.child(
														S.documentList()
															.title('Archived Races')
															.schemaType('raceSeries')
															.filter(
																'_type == "raceSeries" && company._ref == $companyId && archived == true',
															)
															.params({ companyId })
															.defaultOrdering([
																{ field: 'date', direction: 'desc' },
															])
															.canHandleIntent(
																(intentName, params) =>
																	intentName === 'edit' &&
																	params.type === 'raceSeries',
															),
													),
												S.divider(),
												S.listItem()
													.title('All Races')
													.id('all')
													.child(
														S.documentList()
															.title('All Races')
															.schemaType('raceSeries')
															.filter(
																'_type == "raceSeries" && company._ref == $companyId',
															)
															.params({ companyId })
															.defaultOrdering([
																{ field: 'date', direction: 'desc' },
															])
															.canHandleIntent(
																(intentName, params) =>
																	intentName === 'edit' &&
																	params.type === 'raceSeries',
															),
													),
											]),
									),
							),
						S.divider(),
						S.listItem()
							.title('Race Series')
							.id('raceSeries')
							.child(
								S.documentTypeList('raceSeries')
									.title('All Race Series')
									.filter(
										'_type == "raceSeries" && date >= now() && archived != true',
									)
									.defaultOrdering([{ field: 'date', direction: 'asc' }]),
							),
						S.divider(),
						S.listItem()
							.title('Past Races')
							.id('pastRaces')
							.child(
								S.documentTypeList('raceSeries')
									.title('Past Races')
									.filter(
										'_type == "raceSeries" && date < now() && archived != true',
									)
									.defaultOrdering([{ field: 'date', direction: 'desc' }]),
							),
						S.listItem()
							.title('Archived Races')
							.id('archivedRaces')
							.child(
								S.documentTypeList('raceSeries')
									.title('Archived Races')
									.filter('_type == "raceSeries" && archived == true')
									.defaultOrdering([{ field: 'date', direction: 'desc' }]),
							),
						S.divider(),
						S.listItem()
							.title('Blog')
							.id('blog')
							.child(
								S.documentTypeList('post')
									.title('All Posts')
									.filter('_type == "post"')
									.defaultOrdering([
										{ field: 'publishedAt', direction: 'desc' },
									]),
							),
						S.listItem()
							.title('Contributors')
							.id('contributors')
							.child(
								S.documentTypeList('contributor')
									.title('All Contributors')
									.filter('_type == "contributor"')
									.defaultOrdering([{ field: 'name', direction: 'asc' }]),
							),
					]),
		}),
		// Vision is a tool that lets you query your content with GROQ in the studio
		// https://www.sanity.io/docs/the-vision-plugin
		visionTool({ defaultApiVersion: apiVersion }),
	],
})
