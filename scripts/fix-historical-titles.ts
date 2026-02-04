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

// Format: "全球贸易每日简报-2026年2月3日"
// Format: "搜索引擎天地每日更新-2026年2月3日"
async function main() {
    console.log("🚀 Starting Title Standardization...");

    const posts = await client.fetch(`*[_type == "post" && (
        slug.current match "daily-trade-briefing*" || 
        slug.current match "search-engine-land*"
    )]{
        _id,
        title,
        locale,
        slug,
        publishedAt
    }`);

    console.log(`Found ${posts.length} posts to check.`);

    let validUpdateCount = 0;
    const tx = client.transaction();

    for (const post of posts) {
        // Parse date from slug because slug is usually reliable like 'daily-trade-briefing-2026-02-04'
        const slug = post.slug.current;
        const dateMatch = slug.match(/(\d{4}-\d{2}-\d{2})/);

        if (!dateMatch) {
            console.log(`⚠️ Could not parse date from slug: ${slug}, skipping.`);
            continue;
        }

        const dateStr = dateMatch[1]; // YYYY-MM-DD
        const [year, month, day] = dateStr.split('-').map(Number);
        const zhDateSuffix = `${year}年${month}月${day}日`;

        let newTitle = post.title;

        // 1. Global Trade Daily
        if (slug.includes('daily-trade-briefing')) {
            if (post.locale === 'zh') {
                newTitle = `全球贸易每日简报 - ${zhDateSuffix}`;
            } else if (post.locale === 'en') {
                newTitle = `Global Trade Daily Briefing - ${dateStr}`;
            } else {
                // Other languages? Maybe keep generic format or leave as is.
                // Let's standardise generic English structure if we can, but translation might have localized it.
                // For now, only hard requirement is ZH and EN consistency.
            }
        }
        // 2. Search Engine Land
        else if (slug.includes('search-engine-land')) {
            if (post.locale === 'zh') {
                newTitle = `搜索引擎天地每日更新 - ${zhDateSuffix}`;
            } else if (post.locale === 'en') {
                newTitle = `Search Engine Land Daily Update - ${dateStr}`;
            }
        }

        // Apply Update
        if (newTitle !== post.title) {
            console.log(`Updating [${post.locale}] ${post.slug.current}`);
            console.log(`  FROM: ${post.title}`);
            console.log(`  TO:   ${newTitle}`);
            tx.patch(post._id, { set: { title: newTitle } });
            validUpdateCount++;
        }
    }

    if (validUpdateCount > 0) {
        console.log(`\nCommiting ${validUpdateCount} title updates...`);
        await tx.commit();
        console.log("✅ Done.");
    } else {
        console.log("No updates needed.");
    }
}

main();
