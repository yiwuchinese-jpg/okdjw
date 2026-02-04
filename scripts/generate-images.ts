
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import dotenv from "dotenv";
import { createClient } from '@sanity/client';
import { generateImage } from "./utils/image-generator";

// Load environment variables
dotenv.config({ path: ".env.local" });

const CONTENT_DIR = path.join(process.cwd(), "src/content");

// Initialize Sanity Client
const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

async function processDirectory(directory: string) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            await processDirectory(fullPath);
        } else if (item.endsWith(".md")) {
            const fileContent = fs.readFileSync(fullPath, "utf8");
            const { data } = matter(fileContent);

            const slug = path.basename(item, ".md");
            // Only process English or base files for now to avoid duplicates (translations sync automatically)
            // But we need to ensure the Sanity document exists.

            console.log(`\n🔍 Checking article: ${slug} (${item})`);

            // 1. Ensure Image Exists Locally
            // Use title as prompt basis
            const prompt = data.title || slug;
            const relativePath = await generateImage({ prompt, slug });

            if (!relativePath) {
                console.log("⚠️ Skipped: Failed to generate or find local image.");
                continue;
            }

            // 2. Sync to Sanity
            try {
                // Find corresponding Sanity post
                // We assume English locale for the "canonical" post usually
                const q = `*[_type == "post" && slug.current == "${slug}"][0]`;
                const sanityDoc = await client.fetch(q);

                if (sanityDoc) {
                    // Check if Sanity doc already has an image
                    if (sanityDoc.mainImage?.asset) {
                        console.log("✅ Sanity document already has an image. Checking metadata...");
                        // Optional: Check if we need to patch metadata even if image exists?
                        // User said "All contents filled out". Let's patch asset metadata just in case.
                        const assetId = sanityDoc.mainImage.asset._ref;
                        if (assetId) {
                            await client.patch(assetId).set({
                                title: data.title,
                                altText: data.title,
                                description: data.description || `Cover image for ${data.title}`
                            }).commit();
                            console.log("✨ Updated existing asset metadata.");
                        }
                    } else {
                        console.log("☁️  Uploading image to Sanity...");
                        const absolutePath = path.join(process.cwd(), "public", relativePath);
                        if (fs.existsSync(absolutePath)) {
                            const fileStream = fs.createReadStream(absolutePath);
                            const asset = await client.assets.upload('image', fileStream, {
                                filename: path.basename(absolutePath)
                            });

                            console.log(`✅ Uploaded asset: ${asset._id}`);

                            // Patch Asset Metadata
                            await client.patch(asset._id).set({
                                title: data.title,
                                altText: data.title,
                                description: data.description || `Cover image for ${data.title}`
                            }).commit();

                            // Link to Post
                            await client.patch(sanityDoc._id).set({
                                mainImage: {
                                    _type: 'image',
                                    asset: { _type: 'reference', _ref: asset._id },
                                    alt: data.title
                                },
                                fallbackImageUrl: relativePath
                            }).commit();
                            console.log("🔗 Linked image to Sanity Post.");
                        }
                    }
                } else {
                    console.log("⚠️ No matching Sanity document found (Post might be Markdown-only).");
                }
            } catch (err) {
                console.error("❌ Error syncing to Sanity:", err);
            }
        }
    }
}

// Start processing
console.log("🚀 Starting Bulk Image Sync & Generation...");
processDirectory(CONTENT_DIR);
