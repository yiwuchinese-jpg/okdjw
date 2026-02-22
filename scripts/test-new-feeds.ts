
import Parser from 'rss-parser';

const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'media'],
            ['enclosure', 'enclosure'],
            ['content:encoded', 'contentEncoded'],
        ],
    },
});

async function test() {
    console.log("Testing GitHub Trending...");
    try {
        const feed = await parser.parseURL('https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml');
        console.log("Title:", feed.title);
        console.log("First Item:", JSON.stringify(feed.items[0], null, 2));
    } catch (e) {
        console.error(e);
    }

    console.log("\nTesting 36Kr...");
    try {
        const feed = await parser.parseURL('https://36kr.com/feed');
        console.log("Title:", feed.title);
        console.log("First Item:", JSON.stringify(feed.items[0], null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
