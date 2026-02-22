
import Parser from 'rss-parser';

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
});

async function main() {
    console.log("🔍 Debugging Search Engine Land RSS Feed...");
    const FEED_URL = "https://searchengineland.com/feed";

    try {
        const feed = await parser.parseURL(FEED_URL);
        console.log(`✅ Feed Title: ${feed.title}`);
        console.log(`✅ Last Build Date: ${feed.lastBuildDate}`);

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setHours(yesterday.getHours() - 24);

        console.log(`\n📅 Time Reference:`);
        console.log(`   Now:       ${today.toISOString()}`);
        console.log(`   Yesterday: ${yesterday.toISOString()}`);

        console.log(`\n📰 Feed Items (First 5):`);

        feed.items.slice(0, 5).forEach((item, index) => {
            const pubDate = new Date(item.pubDate || "");
            const isRecent = pubDate > yesterday;

            console.log(`\n[${index + 1}] ${item.title}`);
            console.log(`    PubDate: ${item.pubDate} (${pubDate.toISOString()})`);
            console.log(`    Is Recent (> 24h ago)? ${isRecent ? "YES ✅" : "NO ❌"}`);
        });

    } catch (e) {
        console.error("❌ Error fetching feed:", e);
    }
}

main();
