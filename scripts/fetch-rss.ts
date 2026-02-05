
import Parser from 'rss-parser';
import OpenAI from 'openai';
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// --- Configuration ---
const CATEGORIES = [
    {
        name: 'Global Macro & Finance',
        sources: [
            'https://www.cnbc.com/id/10000664/device/rss/rss.html',
            'https://www.investing.com/rss/market_quotes_11.rss'
        ]
    },
    {
        name: 'Global Logistics (Sea & Air)',
        sources: [
            'https://theloadstar.com/feed/',
            'https://www.aircargonews.net/feed/',
            'https://www.porttechnology.org/feed/'
        ]
    },
    {
        name: 'Trade Compliance & Sanctions',
        sources: [
            'https://ofac.treasury.gov/recent-actions.xml',
            'https://www.piers.com/blog/feed/'
        ]
    },
    {
        name: 'Regional Markets',
        sources: [
            'https://www.arabnews.com/cat/4/rss.xml',
            'https://en.mercopress.com/rss/'
        ]
    },
    {
        name: 'E-commerce & Retail Trends',
        sources: [
            'https://techcrunch.com/category/ecommerce/feed/',
            'https://www.retaildive.com/feeds/news/'
        ]
    }
];

// Initialize clients
const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    customFields: {
        item: [
            ['media:content', 'media'],
            ['enclosure', 'enclosure'],
            ['content:encoded', 'contentEncoded'],
        ],
    },
});

const token = process.env.SANITY_API_TOKEN;
if (!token) {
    console.error('Error: SANITY_API_TOKEN is missing');
    process.exit(1);
}

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-01',
    useCdn: false,
    token,
});

const openai = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com',
});

// --- Helper Functions ---

function extractImage(item: any): string | null {
    if (item.media && item.media.$ && item.media.$.url) return item.media.$.url;
    if (item.enclosure && item.enclosure.url) return item.enclosure.url;
    const content = item.contentEncoded || item.content || item['content:encoded'];
    if (content) {
        const match = content.match(/<img[^>]+src="([^">]+)"/);
        if (match) return match[1];
    }
    return null;
}

async function summarizeSection(categoryName: string, articles: any[]): Promise<string> {
    const context = articles.map(a => `- ${a.title}: ${a.contentSnippet?.slice(0, 100)}...`).join('\n');
    console.log(`Generating summary for section: ${categoryName} (${articles.length} articles)...`);

    try {
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'You are a senior trade analyst. Write a concise, insightful "Market Pulse" paragraph (approx 80-100 words) summarizing the key trends from the following news headlines. Focus on the impact for global trade professionals. Start directly with the insight, no "This section covers".'
                },
                {
                    role: 'user',
                    content: `Category: ${categoryName}\n\nNews Items:\n${context}`
                }
            ]
        });
        return response.choices[0].message.content || '';
    } catch (e) {
        console.error(`Failed to summarize section ${categoryName}:`, e);
        return '';
    }
}

async function summarizeArticle(title: string, contentSnippet: string): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'Summarize news into ONE concise English sentence (max 25 words). Start with a verb.'
                },
                {
                    role: 'user',
                    content: `Title: ${title}\nContent: ${contentSnippet.slice(0, 300)}`
                }
            ]
        });
        return response.choices[0].message.content || 'No summary available.';
    } catch (error) {
        return 'Summary unavailable.';
    }
}

function markdownToBlocks(markdown: string): any[] {
    const blocks: any[] = [];
    const lines = markdown.split('\n');

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Headers (Regex for stricter and safer matching)
        // Match #, ##, ### followed by space and text
        const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            const text = headerMatch[2];
            // Map h1-h6 (Sanity usually supports h1-h4 or h1-h6 depending on schema, assuming h1-h3 for safety)
            const style = level <= 4 ? `h${level}` : 'normal';
            blocks.push({
                _type: 'block',
                style: style,
                children: [{ _type: 'span', text: text }]
            });
            return;
        }

        // Bullet points (* or -)
        const bulletMatch = trimmed.match(/^[\*\-]\s+(.*)/);
        if (bulletMatch) {
            let text = bulletMatch[1].replace(/\*\*/g, '');
            // Check for Link: [Title](URL)
            // Regex to find markdown links: \[([^\]]+)\]\(([^)]+)\)
            const linkMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/);

            const children = [];

            if (linkMatch) {
                // If the whole line is basically a link or contains one.
                // For simplicity in this specific "News Links" format "* [Title](URL) - Source", 
                // let's parse it carefully.

                // If text looks like: "[Title](URL) - Source"
                // Split by link regex
                const preLink = text.substring(0, linkMatch.index);
                const linkText = linkMatch[1];
                const linkUrl = linkMatch[2];
                const postLink = text.substring((linkMatch.index || 0) + linkMatch[0].length);

                if (preLink) children.push({ _type: 'span', text: preLink });

                const linkKey = `link-${Math.random().toString(36).substring(7)}`;
                children.push({
                    _type: 'span',
                    text: linkText,
                    marks: [linkKey]
                });

                if (postLink) children.push({ _type: 'span', text: postLink });

                blocks.push({
                    _type: 'block',
                    style: 'normal',
                    listItem: 'bullet',
                    children: children,
                    markDefs: [{
                        _key: linkKey,
                        _type: 'link',
                        href: linkUrl
                    }]
                });
            } else {
                // No link, just text
                blocks.push({
                    _type: 'block',
                    style: 'normal',
                    listItem: 'bullet',
                    children: [{ _type: 'span', text: text }]
                });
            }
            return;
        }

        // Numbered lists (1. )
        const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberMatch) {
            const text = numberMatch[2].replace(/\*\*/g, '');
            blocks.push({
                _type: 'block',
                style: 'normal',
                listItem: 'number',
                children: [{ _type: 'span', text: text }]
            });
            return;
        }

        // Normal text
        // Simple split by ** for bold
        const children: any[] = [];
        const parts = trimmed.split('**');
        parts.forEach((part, index) => {
            // Even index = normal, Odd index = bold
            if (index % 2 === 0) {
                if (part) children.push({ _type: 'span', text: part });
            } else {
                if (part) children.push({ _type: 'span', text: part, marks: ['strong'] });
            }
        });

        blocks.push({
            _type: 'block',
            style: 'normal',
            children: children.length ? children : [{ _type: 'span', text: trimmed }]
        });
    });

    return blocks;
}

// --- Main Logic ---

async function main() {
    console.log("🚀 Starting Multi-Source RSS Aggregator...");

    // 1. Foreign Trade Briefing
    await generateDailyBriefing();

    // 2. Search Engine Land Briefing
    await generateSELDaily();

    console.log("✅ All RSS Tasks Finished.");
}

async function generateDailyBriefing() {
    console.log('Starting Daily Foreign Trade Briefing generation...');

    // Filter time: Strictly last 24h
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);

    const blocks: any[] = [];

    // Intro Block
    blocks.push({
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: `Daily Foreign Trade Briefing for ${new Date().toLocaleDateString()}. Curated insights on Finance, Logistics, Compliance, and Global Markets.` }]
    });

    for (const category of CATEGORIES) {
        console.log(`\nProcessing Category: ${category.name}`);
        const categoryArticles: any[] = [];

        for (const source of category.sources) {
            try {
                const feed = await parser.parseURL(source);
                const newItems = feed.items.filter(item => {
                    const itemDate = item.pubDate ? new Date(item.pubDate) : new Date(0);
                    return itemDate > yesterday;
                });

                newItems.forEach(item => {
                    categoryArticles.push({
                        ...item,
                        sourceName: feed.title || 'News',
                        imageUrl: extractImage(item)
                    });
                });
            } catch (e) {
                console.error(`Failed to fetch source ${source}:`, e);
            }
        }

        if (categoryArticles.length === 0) {
            console.log(`No recent news for ${category.name}. Skipping.`);
            continue;
        }

        // Deduplicate
        const uniqueArticles = Array.from(new Map(categoryArticles.map(item => [item.title, item])).values())
            .slice(0, 5);

        // Generate Section Summary using AI
        const articlesText = uniqueArticles.map((a, i) => `${i + 1}. ${a.title}: ${a.contentSnippet?.slice(0, 100)}`).join('\n');
        const summaryPrompt = `Summarize these ${category.name} news items into one insightful paragraph (max 2 sentences). Items:\n${articlesText}`;
        const summaryRes = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "user", content: summaryPrompt }],
        });
        const sectionSummary = summaryRes.choices[0].message.content;

        blocks.push({
            _type: 'block',
            style: 'h2',
            children: [{ _type: 'span', text: category.name }]
        });

        if (sectionSummary) {
            blocks.push({
                _type: 'block',
                style: 'blockquote',
                children: [{ _type: 'span', text: sectionSummary }]
            });
        }

        for (const item of uniqueArticles) {
            console.log(`- Summarizing article: ${item.title}`);
            const itemPrompt = `Summarize this article in 1 short sentence: Title: ${item.title}. Content: ${item.contentSnippet?.slice(0, 300)}`;
            const itemRes = await openai.chat.completions.create({
                model: "deepseek-chat",
                messages: [{ role: "user", content: itemPrompt }],
            });
            const summary = itemRes.choices[0].message.content;

            blocks.push({
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: item.title }]
            });

            blocks.push({
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: `${summary} (${item.sourceName})` }]
            });

            /* User requested removal of 'Read source' link text in the body
            if (item.link) {
                const linkKey = Math.random().toString(36).substring(7);
                blocks.push({
                    _type: 'block',
                    style: 'normal',
                    children: [
                        { _type: 'span', text: 'Read source: ' },
                        {
                            _type: 'span',
                            text: 'Click here',
                            marks: [linkKey]
                        }
                    ],
                    markDefs: [{ _key: linkKey, _type: 'link', href: item.link }]
                });
            }
            */
        }
        blocks.push({ _type: 'block', style: 'normal', children: [{ _type: 'span', text: '' }] });
    }

    if (blocks.length <= 1) {
        console.log('No news found across all categories.');
        return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const slug = `daily-trade-briefing-${dateStr}`;
    // Title Standard: Global Trade Daily Briefing - YYYY-MM-DD
    const title = `【自动化测试】Global Trade Daily Briefing - ${dateStr}`;

    console.log("🎨 Generating cover image...");
    const { generateImage } = await import("./utils/image-generator");
    const relativePath = await generateImage({ prompt: `Global Trade Container Ship Logistics Finance ${dateStr}`, slug });

    let imageAssetId = null;
    if (relativePath) {
        const cleanRelative = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        const absolutePath = path.join(process.cwd(), "public", cleanRelative);
        if (fs.existsSync(absolutePath)) {
            const fileStream = fs.createReadStream(absolutePath);
            const asset = await client.assets.upload('image', fileStream, { filename: path.basename(absolutePath) });
            if (asset) {
                imageAssetId = asset._id;
                await client.patch(asset._id).set({ title, altText: title }).commit();
            }
        }
    }

    const doc: any = {
        _type: 'post',
        title,
        slug: { _type: 'slug', current: slug },
        locale: 'en',
        publishedAt: new Date().toISOString(),
        description: `Daily executive summary of Global Finance, Logistics, and Market Trends for ${dateStr}.`,
        body: blocks,
        tags: ['Daily Briefing', 'Trade News'],
        fallbackImageUrl: relativePath
    };

    if (imageAssetId) {
        doc.mainImage = {
            _type: 'image',
            asset: { _type: 'reference', _ref: imageAssetId },
            alt: title
        };
    }

    // Upsert
    const existing = await client.fetch(`*[_type == "post" && slug.current == "${slug}" && locale == "en"][0]`);
    if (existing) {
        console.log('Updating existing daily briefing...');
        await client.patch(existing._id).set(doc).commit();
    } else {
        console.log('Creating new daily briefing...');
        await client.create(doc);
    }
    console.log('Done! Daily Briefing published.');
}

async function generateSELDaily() {
    console.log("\n📰 Starting Search Engine Land Daily Update...");
    const FEED_URL = "https://searchengineland.com/feed"; // Corrected URL

    try {
        const feed = await parser.parseURL(FEED_URL);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setHours(yesterday.getHours() - 24);

        const recentItems = feed.items.filter(item => {
            const pubDate = new Date(item.pubDate || "");
            return pubDate > yesterday;
        });

        console.log(`Found ${recentItems.length} recent articles from Search Engine Land.`);

        if (recentItems.length === 0) {
            console.log("No new articles to process.");
            return;
        }

        // Structure: Intro -> H2 Category (SEO News) -> Items
        const blocks: any[] = [];

        // Intro
        blocks.push({
            _type: 'block',
            style: 'normal',
            children: [{ _type: 'span', text: `Search Engine Land Daily Update for ${today.toISOString().split('T')[0]}. Latest SEO and technology trends.` }]
        });

        // Category Header
        blocks.push({
            _type: 'block',
            style: 'h2',
            children: [{ _type: 'span', text: "SEO & Technology News" }]
        });

        // Summary of the section
        const articlesText = recentItems.map((item, index) => `${index + 1}. ${item.title}: ${item.contentSnippet?.slice(0, 100)}`).join("\n");
        const summaryPrompt = `Summarize these SEO news items into one insightful paragraph (max 2 sentences). Items:\n${articlesText}`;
        const summaryRes = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "user", content: summaryPrompt }],
        });
        const sectionSummary = summaryRes.choices[0].message.content;

        if (sectionSummary) {
            blocks.push({
                _type: 'block',
                style: 'blockquote',
                children: [{ _type: 'span', text: sectionSummary }]
            });
        }

        // Items
        for (const item of recentItems) {
            console.log(`- Summarizing article: ${item.title}`);
            const itemPrompt = `Summarize this article in 1 short sentence: Title: ${item.title}. Content: ${item.contentSnippet?.slice(0, 300)}`;
            const itemRes = await openai.chat.completions.create({
                model: "deepseek-chat",
                messages: [{ role: "user", content: itemPrompt }],
            });
            const summary = itemRes.choices[0].message.content;

            blocks.push({
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: item.title }]
            });

            blocks.push({
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: `${summary} (${feed.title || 'Search Engine Land'})` }]
            });

            // No Read Source link as requested
        }

        const dateStr = today.toISOString().split('T')[0];
        // Title Standard: Search Engine Land Daily Update - YYYY-MM-DD
        const title = `【自动化测试】Search Engine Land Daily Update - ${dateStr}`;
        const slug = `search-engine-land-daily-update-${dateStr}`; // Keep legacy slug format or standard? Let's keep it but ensure title is standard.

        // Generate Image
        const { generateImage } = await import("./utils/image-generator");
        const relativePath = await generateImage({ prompt: "Search Engine Optimization News Dashboard Technology " + dateStr, slug });

        let imageAssetId = null;
        if (relativePath) {
            const cleanRelative = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
            const absolutePath = path.join(process.cwd(), "public", cleanRelative);
            if (fs.existsSync(absolutePath)) {
                const fileStream = fs.createReadStream(absolutePath);
                const asset = await client.assets.upload('image', fileStream, {
                    filename: path.basename(absolutePath)
                });
                if (asset) {
                    imageAssetId = asset._id;
                    await client.patch(asset._id).set({
                        title: title,
                        altText: title,
                        description: `Cover image for ${title}`,
                    }).commit();
                }
            }
        }

        const doc: any = {
            _type: 'post',
            title,
            slug: { _type: 'slug', current: slug },
            locale: 'en',
            publishedAt: new Date().toISOString(),
            description: `Daily update from Search Engine Land for ${today.toDateString()}`,
            body: blocks,
            mainImage: imageAssetId ? {
                _type: 'image',
                asset: { _type: 'reference', _ref: imageAssetId },
                alt: title
            } : undefined,
            fallbackImageUrl: relativePath
        };

        const existing = await client.fetch(`*[_type == "post" && slug.current == "${slug}" && locale == "en"][0]`);
        if (existing) {
            console.log(`Update ${slug} already exists. Updating...`);
            await client.patch(existing._id).set(doc).commit();
        } else {
            await client.create(doc);
            console.log(`Created ${slug}`);
        }

    } catch (err) {
        console.error("❌ Error generating SEL Daily:", err);
    }
}

main().catch(console.error);
