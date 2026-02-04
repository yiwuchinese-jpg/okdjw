
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { generateImage } from './utils/image-generator';

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
    console.log("🚀 Starting Sanity Image Backfill Check...");

    // Find all English posts that DO NOT have a mainImage defined
    const query = `*[_type == "post" && locale == "en" && !defined(mainImage.asset)]`;

    try {
        const posts = await client.fetch(query);
        console.log(`Found ${posts.length} English posts missing images.`);

        for (const post of posts) {
            console.log(`\n🔧 Processing: ${post.title} (${post.slug.current})`);

            // 1. Generate or Retrieve Local Image
            const slug = post.slug.current;
            const title = post.title;

            // Using title as prompt
            const relativePath = await generateImage({ prompt: title, slug });

            if (!relativePath) {
                console.log("⚠️ Could not generate image. Skipping.");
                continue;
            }

            // 2. Upload to Sanity
            const absolutePath = path.join(process.cwd(), "public", relativePath);
            if (fs.existsSync(absolutePath)) {
                console.log("☁️  Uploading to Sanity...");
                const fileStream = fs.createReadStream(absolutePath);

                const asset = await client.assets.upload('image', fileStream, {
                    filename: path.basename(absolutePath)
                });

                console.log(`✅ Uploaded asset: ${asset._id}`);

                // 3. Patch Asset Metadata (SEO)
                await client.patch(asset._id).set({
                    title: title,
                    altText: title,
                    description: `Cover image for ${title}`,
                }).commit();

                // 4. Update Post Document
                await client.patch(post._id).set({
                    mainImage: {
                        _type: 'image',
                        asset: { _type: 'reference', _ref: asset._id },
                        alt: title // Post-level alt text
                    },
                    fallbackImageUrl: relativePath
                }).commit();

                console.log("🔗 Linked image to Post.");
            } else {
                console.error(`❌ File not found at ${absolutePath}`);
            }
        }

        console.log("\n🎉 Image Backfill Complete!");

    } catch (err) {
        console.error("❌ Error in backfill:", err);
        process.exit(1);
    }
}

main();
