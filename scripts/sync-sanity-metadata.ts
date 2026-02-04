
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

async function main() {
    console.log("🚀 Starting Global Sanity Image Metadata Sync...");

    // Fetch all posts with images
    const query = `*[_type == "post" && defined(mainImage.asset)] {
        _id,
        title,
        description,
        mainImage {
            asset-> {
                _id,
                title,
                altText,
                description
            }
        }
    }`;

    try {
        const posts = await client.fetch(query);
        console.log(`Found ${posts.length} posts with images.`);

        for (const post of posts) {
            const assetId = post.mainImage?.asset?._id;
            const currentMeta = post.mainImage?.asset;

            if (!assetId) continue;

            // Check if updates are needed
            // We want to force-sync if title/alt is missing, or strictly enforce it matches the post?
            // User wants "SEO done well". Syncing valid post title to image title/alt is a good strategy.

            const needsUpdate = !currentMeta.title || !currentMeta.altText || !currentMeta.description;
            // Or force update every time to ensure consistency? 
            // Let's being aggressive since user complained.

            console.log(`🔧 Processing: ${post.title}`);

            const patch = {
                title: post.title,
                altText: post.title, // Use title as alt text
                description: post.description || currentMeta.description || `Cover image for ${post.title}`
            };

            await client.patch(assetId).set(patch).commit();
            console.log(`   ✅ Patched asset metadata for ${assetId}`);

            // Also patch the Document's mainImage.alt field (What user sees in Studio)
            await client.patch(post._id).set({
                "mainImage.alt": post.title
            }).commit();
            console.log(`   ✅ Patched Post mainImage.alt for ${post.title}`);
        }

        console.log("🎉 All Done! All Sanity images have been SEO-optimized.");

    } catch (err) {
        console.error("❌ Error fetching/patching:", err);
    }
}

main();
