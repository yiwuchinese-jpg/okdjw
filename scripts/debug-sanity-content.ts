import { createClient } from 'next-sanity';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
    apiVersion: '2024-01-01',
});

async function main() {
    const dateStr = new Date().toISOString().split('T')[0];
    const slug = `daily-trade-briefing-${dateStr}`;

    console.log(`Checking content for slug: ${slug}`);

    const posts = await client.fetch(`*[_type == "post" && slug.current == "${slug}"]{
        title,
        locale,
        body
    }`);

    posts.forEach((post: any) => {
        console.log(`\n--- [${post.locale}] ${post.title} ---`);
        if (post.body && Array.isArray(post.body)) {
            post.body.slice(0, 5).forEach((block: any) => { // show first 5 blocks
                if (block._type === 'block') {
                    const text = block.children?.map((c: any) => c.text).join('') || '';
                    console.log(`[${block.style}] ${text.substring(0, 50)}...`);
                }
            });
        }
    });
}

main();
