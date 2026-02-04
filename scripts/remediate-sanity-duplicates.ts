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
    const slug = `daily-trade-briefing-2026-02-04`;
    console.log(`🔍 Inspecting duplicates for: ${slug}`);

    // Fetch all docs with this slug (including drafts)
    const posts = await client.fetch(`*[_type == "post" && slug.current == "${slug}"]{
        _id,
        title,
        locale,
        body
    }`);

    console.log(`Found ${posts.length} documents.`);

    const keepIds: string[] = [];
    const deleteIds: string[] = [];

    // Helper to check if body is "List Format" (Correct)
    // List format has "Daily Foreign Trade Briefing" intro or uses H2/H3 structure for items
    // Failure format (Market Pulse) has "Market Pulse" H2 and synthesized text.
    const isCorrectFormat = (body: any[]) => {
        if (!body || !Array.isArray(body)) return false;
        const text = body.map(b => b.children?.map((c: any) => c.text).join('')).join('\n');
        // Check for specific markers of the new format
        return text.includes("Daily Foreign Trade Briefing") || (text.includes("Global Macro & Finance") && !text.includes("Market Pulse"));
    };

    // Group by locale
    const byLocale: Record<string, any[]> = {};
    posts.forEach((p: any) => {
        if (!byLocale[p.locale]) byLocale[p.locale] = [];
        byLocale[p.locale].push(p);
    });

    for (const locale in byLocale) {
        const localePosts = byLocale[locale];
        console.log(`\nLocale [${locale}]: Found ${localePosts.length} docs`);

        if (locale === 'en') {
            // For English, find the Correct one
            const correctDoc = localePosts.find(p => isCorrectFormat(p.body));

            if (correctDoc) {
                console.log(`✅ Identified CORRECT English doc: ${correctDoc._id}`);
                keepIds.push(correctDoc._id);
                // Mark others for deletion
                localePosts.forEach(p => {
                    if (p._id !== correctDoc._id) {
                        console.log(`❌ Marking BAD English doc for deletion: ${p._id}`);
                        deleteIds.push(p._id);
                    }
                });
            } else {
                console.log(`⚠️ No correct English doc found! We might need to regenerate.`);
                // If all are bad, maybe keep one to update? Or delete all?
                // For safety, if no correct one, we delete all bad ones EXCEPT one (to be overwritten) or just delete all and re-run fetches.
                // Let's delete all bad ones and re-run fetch-rss.
                localePosts.forEach(p => deleteIds.push(p._id));
            }
        } else {
            // For other languages (ZH), if they are in wrong format (Market Pulse), delete them.
            // Actually, simplest strategy: Delete ALL translated duplicates if we have a correct EN doc.
            // sync-translations script will re-create them correctly from the EN source.
            // If we keep a "bad" ZH doc, sync-translations might fail to update it properly if logic is flawed.
            // BETTER: Delete ALL non-EN docs for this slug. Let them be regenerated cleanly.
            console.log(`❌ Deleting all ${locale} docs to force clean regeneration.`);
            localePosts.forEach(p => deleteIds.push(p._id));
        }
    }

    if (deleteIds.length > 0) {
        console.log(`\n🗑️ Deleting ${deleteIds.length} documents...`);
        const tx = client.transaction();
        deleteIds.forEach(id => tx.delete(id));
        await tx.commit();
        console.log("Deletion complete.");
    } else {
        console.log("No duplicates to delete.");
    }
}

main();
