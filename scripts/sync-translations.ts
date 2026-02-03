import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';
import { processDocumentTranslation } from '../src/lib/translation-service';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Note: The shared service uses process.env, which dotenv just loaded.
// So we don't need to pass clients if the service initializes them globally from process.env.
// However, ensure purely importing the module doesn't fail if envs are missing yet (it might).
// The service initializes clients at top level, so dotenv MUST be loaded BEFORE import.
// But imports happen before code execution. This is a problem.
// Dynamic import is the solution.

async function main() {
    console.log('Starting translation sync...');

    const token = process.env.SANITY_API_TOKEN;
    if (!token) {
        console.error('Error: SANITY_API_TOKEN is missing in .env.local');
        process.exit(1);
    }

    // Sanity client for fetching source documents (readonly is fine for fetching, but we need token for service)
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
    const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-01';

    const client = createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: false,
        token, // We use the same token
    });

    // 1. Fetch all English contents
    const posts = await client.fetch('*[_type == "post" && locale == "en"]');
    const resources = await client.fetch('*[_type == "resource" && locale == "en"]');

    console.log(`Found ${posts.length} English posts and ${resources.length} English resources.`);

    for (const post of posts) {
        await processDocumentTranslation(post);
    }

    for (const resource of resources) {
        await processDocumentTranslation(resource);
    }

    console.log('Sync complete!');
}

main().catch(console.error);
