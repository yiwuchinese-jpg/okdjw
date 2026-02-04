
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const PUBLIC_IMAGE_DIR = path.join(process.cwd(), "public/images/generated");

// Configuration
const API_KEY = process.env.IMAGE_GEN_API_KEY;
const API_URL = process.env.IMAGE_GEN_API_URL || "https://api.openai.com/v1/images/generations";
const API_MODEL = process.env.IMAGE_GEN_MODEL || "dall-e-3";

// Ensure output directory exists
if (!fs.existsSync(PUBLIC_IMAGE_DIR)) {
    fs.mkdirSync(PUBLIC_IMAGE_DIR, { recursive: true });
}

interface ImageGenerationOptions {
    prompt: string;
    slug: string;
    outputDir?: string; // Optional override
}

export async function generateImage({ prompt, slug, outputDir = PUBLIC_IMAGE_DIR }: ImageGenerationOptions): Promise<string | null> {
    if (!API_KEY) {
        console.error("❌ Skipping image generation: IMAGE_GEN_API_KEY not found in .env.local");
        return null;
    }

    console.log(`🎨 Preparing image for: ${slug}...`);

    // Check if file already exists
    const filename = `${slug}.png`;
    const imagePath = path.join(outputDir, filename);

    if (fs.existsSync(imagePath)) {
        console.log(`⏭️ Image already exists at ${imagePath}. Skipping generation.`);
        // Return relative path logic
        const publicIndex = imagePath.indexOf('/public/');
        if (publicIndex !== -1) {
            return imagePath.substring(publicIndex + 7);
        }
        return `/images/generated/${filename}`;
    }

    if (!API_KEY) {
        console.error("❌ Skipping image generation: IMAGE_GEN_API_KEY not found in .env.local");
        return null;
    }

    console.log(`🎨 Generating new image via AI...`);

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
        const imageBase64 = data.data?.[0]?.b64_json;

        if (!imageBase64) {
            console.error("❌ No image data received from API.");
            return null;
        }

        // Save file
        const filename = `${slug}.png`;
        const imagePath = path.join(outputDir, filename);

        // We assume outputDir is inside 'public' usually, but return related path for CMS/Frontend
        // If outputDir is .../public/images/generated, we want /images/generated/filename

        fs.writeFileSync(imagePath, Buffer.from(imageBase64, 'base64'));
        console.log(`✅ Image saved to: ${imagePath}`);

        // Calculate relative path for web use
        // Check if path contains 'public'
        const publicIndex = imagePath.indexOf('/public/');
        if (publicIndex !== -1) {
            return imagePath.substring(publicIndex + 7); // +7 to remove '/public' -> starts with /
        }

        // Fallback: return absolute path or specific logic? 
        // For now, assume standardization on public/images/generated
        return `/images/generated/${filename}`;

    } catch (error) {
        console.error("❌ Error generating image:", error);
        return null;
    }
}
