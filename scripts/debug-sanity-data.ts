import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

async function main() {
    // Fetch the German version of the article shown in screenshot (slug likely 'agentic-ai-2026' or similar)
    // The user was looking at 'agentic-ai-2026' in Russian in previous context, but screenshot looks German (MIT DER ENTWICKLUNG...)
    const slug = 'agentic-ai-2026';
    const post = await client.fetch(`*[_type == "post" && slug.current == "${slug}" && locale == "en"][0]`);

    if (!post) {
        console.log('Post not found');
        return;
    }

    console.log('Title:', post.title);
    console.log('Body Sample:');
    if (post.body) {
        post.body.slice(0, 5).forEach((block: any, index: number) => {
            console.log(`Block ${index} [${block.style}]:`, JSON.stringify(block.children));
        });
    }
}

main().catch(console.error);
