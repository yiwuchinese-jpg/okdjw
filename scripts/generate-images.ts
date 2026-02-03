
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const CONTENT_DIR = path.join(process.cwd(), "src/content");
const PUBLIC_IMAGE_DIR = path.join(process.cwd(), "public/images/generated");

// Configuration - User needs to fill these in .env.local
const API_KEY = process.env.IMAGE_GEN_API_KEY;
const API_URL = process.env.IMAGE_GEN_API_URL || "https://api.openai.com/v1/images/generations"; // Default to OpenAI if not specified
const API_MODEL = process.env.IMAGE_GEN_MODEL || "dall-e-3";

// Ensure output directory exists
if (!fs.existsSync(PUBLIC_IMAGE_DIR)) {
    fs.mkdirSync(PUBLIC_IMAGE_DIR, { recursive: true });
}

async function generateImage(prompt: string, slug: string): Promise<string | null> {
    if (!API_KEY) {
        console.error("❌ Skipping image generation: IMAGE_GEN_API_KEY not found in .env.local");
        return null;
    }

    console.log(`🎨 Generating image for: ${slug}...`);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: API_MODEL,
                prompt: `A modern, abstract, professional header image for a business article titled: "${prompt}". Minimalist style, high quality, 4k, no text, no words, no letters.`,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json"
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Error: ${response.status} - ${errorText}`);
            return null;
        }

        const data = await response.json();
        const imageBase64 = data.data?.[0]?.b64_json; // Adjust based on actual API response structure

        if (!imageBase64) {
            console.error("❌ No image data received from API.");
            return null;
        }

        const imagePath = path.join(PUBLIC_IMAGE_DIR, `${slug}.png`);
        const relativePath = `/images/generated/${slug}.png`;

        fs.writeFileSync(imagePath, Buffer.from(imageBase64, 'base64'));
        console.log(`✅ Image saved to: ${imagePath}`);

        return relativePath;

    } catch (error) {
        console.error("❌ Error generating image:", error);
        return null;
    }
}

function processDirectory(directory: string) {
    const items = fs.readdirSync(directory);

    items.forEach(async (item) => {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (item.endsWith(".md")) {
            const fileContent = fs.readFileSync(fullPath, "utf8");
            const { data, content } = matter(fileContent);

            // Check if image is missing or referenced file doesn't exist
            let shouldGenerate = !data.image;

            if (data.image) {
                const params = data.image.split('/');
                // Assuming structure /images/subdir/filename or /images/filename. 
                // We can try to look in public dir.
                // image path is usually like "/images/blog/foo.jpg"
                const localImagePath = path.join(process.cwd(), 'public', data.image);
                if (!fs.existsSync(localImagePath)) {
                    console.log(`⚠️ Image referenced but file not found: ${data.image} in ${item}`);
                    shouldGenerate = true;
                }
            }

            if (shouldGenerate) {
                console.log(`🔍 Found article needing image: ${item}`);

                // Use title as prompt basis
                const prompt = data.title || "Business and Technology";
                const slug = path.basename(item, ".md");

                // Generate Image
                const newImagePath = await generateImage(prompt, slug);

                if (newImagePath) {
                    // Update Frontmatter
                    const newFrontmatter = { ...data, image: newImagePath };
                    const newFileContent = matter.stringify(content, newFrontmatter);

                    fs.writeFileSync(fullPath, newFileContent);
                    console.log(`📝 Updated markdown file: ${item}`);
                }
            }
        }
    });
}

// Start processing
console.log("🚀 Starting automated image generation...");
processDirectory(CONTENT_DIR);
