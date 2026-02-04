import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';
import { processDocumentTranslation } from '../src/lib/translation-service';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Client just for fetching the source list
const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-01',
    useCdn: false, // Always fetch freshest data
    token: process.env.SANITY_API_TOKEN,
});

async function main() {
    console.log("🚀 Starting Daily Translation Sync (Backfill & Correct)...");

    // 1. Fetch all ENGLISH posts (Source of Truth)
    // We order by publishedAt desc to prioritize recent news = "Daily Subscription"
    const query = `*[_type == "post" && locale == "en"] | order(publishedAt desc)`;

    try {
        const englishPosts = await client.fetch(query);
        console.log(`Found ${englishPosts.length} English articles.`);

        for (const post of englishPosts) {
            // Use the shared service which handles:
            // - Checking if translation exists
            // - Creating if missing
            // - Updating if exists (We enforce synchronization)
            // - Syncing Images (mainImage + fallbackImageUrl)
            // - Translating Text fields
            await processDocumentTranslation(post);
        }

        console.log("🎉 Translation Sync Complete!");

    } catch (err) {
        console.error("❌ Translation Sync Failed:", err);
        process.exit(1);
    }
}

main()
    .catch(console.error);
