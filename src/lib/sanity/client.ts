import imageUrlBuilder from '@sanity/image-url'
import { createClient } from 'next-sanity'
import  { type Image } from 'sanity'

import { apiVersion, dataset, projectId } from '../../../sanity/env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
})

export const serverClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  perspective: 'published',
})

const builder = imageUrlBuilder(client)

export const urlFor = (source: Image) => {
  return builder.image(source).auto('format').fit('max')
}