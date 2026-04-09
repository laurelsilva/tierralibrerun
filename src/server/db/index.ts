import 'dotenv/config'
import {Client} from '@planetscale/database'
import {drizzle} from 'drizzle-orm/planetscale-serverless'
import * as schema from './schema'

const client = new Client({
	host: process.env.PLANETSCALE_DB_HOST,
	username: process.env.PLANETSCALE_DB_USERNAME,
	password: process.env.PLANETSCALE_DB_PASSWORD
})

export const db = drizzle(client, {schema})

// Re-export schema for convenience
export * from './schema'
export {schema}
