
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import dotenv from "dotenv";
import { generateImage } from "./utils/image-generator";

// Load environment variables
dotenv.config({ path: ".env.local" });

const CONTENT_DIR = path.join(process.cwd(), "src/content");

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
                const newImagePath = await generateImage({ prompt, slug });

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
