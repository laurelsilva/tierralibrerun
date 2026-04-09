import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Load environment variables with priority: .env.local > .env
config({ path: '.env', override: false })
config({ path: '.env.local', override: true })

export default defineConfig({
	schema: './src/server/db/schema.ts',
	out: './drizzle',
	dialect: 'mysql',
	dbCredentials: {
		url: `mysql://${process.env.PLANETSCALE_DB_USERNAME}:${process.env.PLANETSCALE_DB_PASSWORD}@${process.env.PLANETSCALE_DB_HOST}/${process.env.PLANETSCALE_DB}?sslaccept=strict`
	}
})