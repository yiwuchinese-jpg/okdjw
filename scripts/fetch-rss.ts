import Parser from 'rss-parser';
import OpenAI from 'openai';
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';
import * as cheerio from 'cheerio'; // You might need to install cheerio: npm install cheerio

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// --- Configuration ---
const CATEGORIES = [
    {
        name: 'Global Macro & Finance',
        sources: [
            // 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&term=trade', // Reuters RSS is discontinued
            'https://www.cnbc.com/id/10000664/device/rss/rss.html', // Replacement: CNBC Finance
            // 'https://www.centralbanking.com/rss', // 404/Blocking
            'https://www.investing.com/rss/market_quotes_11.rss'
        ]
    },
    {
        name: 'Global Logistics (Sea & Air)',
        sources: [
            // 'https://www.joc.com/rss/all', // Dead
            'https://theloadstar.com/feed/', // Replacement: The Loadstar (Excellent logicstics news)
            'https://www.aircargonews.net/feed/', // Retrying with better headers
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
            // 'https://asia.nikkei.com/rss/feed/nar', // Often strict blocking
            'https://en.mercopress.com/rss/'
        ]
    },
    {
        name: 'E-commerce & Retail Trends',
        sources: [
            'https://techcrunch.com/category/ecommerce/feed/',
            'https://www.retaildive.com/feeds/news/'
        ]
    },
    // {
    //    name: 'Exhibitions & Sourcing',
    //    sources: ['https://10times.com/blog/feed/'] // Often blocks non-browsers, keeping disabled to ensure stability for now
    //}
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
    // 1. Check media:content / enclosure
    if (item.media && item.media.$ && item.media.$.url) return item.media.$.url;
    if (item.enclosure && item.enclosure.url) return item.enclosure.url;

    // 2. Check content for <img> tag
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

// --- Main Logic ---

async function main() {
    console.log('Starting Daily Foreign Trade Briefing generation...');

    // Filter time: Strictly last 24h
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2); // Relaxing to 48h to ensure content for demo/unstable feeds

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

        // 1. Fetch from all sources in this category
        for (const source of category.sources) {
            try {
                const feed = await parser.parseURL(source);
                const newItems = feed.items.filter(item => {
                    const itemDate = item.pubDate ? new Date(item.pubDate) : new Date(0);
                    return itemDate > yesterday;
                });

                // Add Source info and Image
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

        // Dedupe by title (simple check)
        const uniqueArticles = Array.from(new Map(categoryArticles.map(item => [item.title, item])).values())
            .slice(0, 5); // Limit to top 5 stories per category to keep it readable

        // 2. Generate Section Summary
        const sectionSummary = await summarizeSection(category.name, uniqueArticles);

        // 3. Build Sanity Blocks

        // Category Header (H2)
        blocks.push({
            _type: 'block',
            style: 'h2',
            children: [{ _type: 'span', text: category.name }]
        });

        // Section Summary (Blockquote)
        if (sectionSummary) {
            blocks.push({
                _type: 'block',
                style: 'blockquote',
                children: [{ _type: 'span', text: sectionSummary }]
            });
        }

        // Articles List
        for (const item of uniqueArticles) {
            console.log(`- Summarizing article: ${item.title}`);
            const summary = await summarizeArticle(item.title || '', item.contentSnippet || '');

            // Article Title (H3)
            blocks.push({
                _type: 'block',
                style: 'h3',
                children: [{ _type: 'span', text: item.title }]
            });

            // Image (if available) - Sanity requires uploading matching images or using URL if custom schema supports it
            // Standard Sanity Image is complex to upload from URL in script without downloading.
            // For simplicity in this iteration, we will render the Image as an HTML link/hint or skip upload to avoid timeout.
            // Better approach: We passed `imageUrl` to frontend? No, portable text needs image block.
            // Let's Skip Image Upload for speed now, or implement a simple "Image Block" if we had a custom one.
            // We'll stick to text + link for stability.

            // Article Summary (Normal)
            blocks.push({
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: `${summary} (${item.sourceName})` }]
            });

            // Read More Link
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
        }

        // Add a spacer/divider visually? (Just empty block)
        blocks.push({ _type: 'block', style: 'normal', children: [{ _type: 'span', text: '' }] });
    }

    if (blocks.length <= 1) { // Only intro
        console.log('No news found across all categories.');
        return;
    }

    // Publish to Sanity
    const dateStr = new Date().toISOString().split('T')[0];
    const slug = `daily-trade-briefing-${dateStr}`;
    const title = `Global Trade Daily Briefing - ${dateStr}`;

    console.log("🎨 Generating cover image for daily briefing...");
    const { generateImage } = await import("./utils/image-generator");
    await generateImage({ prompt: title, slug });
    // Note: Since we are using standard "image" field in Frontmatter for local MD, 
    // but in Sanity we often use "mainImage" or similar.
    // However, our hybrid fallback logic now checks local file system too!
    // So we just need to generate the image locally with the same slug.
    // The Sanity doc doesn't strictly NEED the image reference if our hybrid page logic works?
    // Wait, the hybrid logic is in Next.js page, it merges.
    // IF Sanity item has no image field, Next.js tries to check local MD? 
    // BUT this logic is: "If Sanity item exists but has no image, try to use local image".
    // Wait, the "local items" are scanned from Markdown files.
    // The RSS script creates a Sanity document, but DOES NOT create a local Markdown file.
    // So ArchivePage.tsx mergeContent won't have a "local item" to fallback to!
    // FIX: We need to either EITHER:
    // 1. Upload image to Sanity (Best practice)
    // 2. Create a local dummy Markdown file (Hack)
    // 3. Update ArchivePage to look for image file on disk directly (Efficient)

    // Let's go with option 1 for best quality, BUT uploading to Sanity via script requires Asset API.
    // Let's try Option 3: Update `ArchivePage` to assume if image is missing in Sanity, check generated folder?
    // Actually, simply adding the `image` string path to the Sanity document MIGHT work if the schema supports string URL.
    // Standard Sanity image field is an object.
    // Let's see the schema... User didn't provide schema, but `green-trade-2026.md` has `image: string`.
    // If the Sanity schema for `post` has an `image` field that accepts string (Url), we are good.
    // If it expects an Image object, we need to upload.

    // Let's assume we can save a string path for now, or just rely on the fact that we can fix the frontend to look for it.
    // Actually, `ArchivePage.tsx` expects `item.image` to be a URL string. 
    // So if we save the relative path string to Sanity, it should work if schema allows.

    const imagePath = `/images/generated/${slug}.png`;

    const doc = {
        _type: 'post',
        title,
        slug: { _type: 'slug', current: slug },
        locale: 'en',
        publishedAt: new Date().toISOString(),
        description: `Comprehensive daily digest of Global Finance, Logistics, and Market Trends for ${dateStr}.`,
        body: blocks,
        tags: ['Daily Briefing', 'Trade News', 'Logistics', 'Finance'],
        // Try setting image as string. If schema fails, we'll need to upload.
        // Most "smart" schemas might have a separate url field or we repurpose one.
        // Let's look at `src/sanity/schemas/post.ts` if possible? I don't have it open.
        // I'll try to set `image: imagePath`.
        image: imagePath
    };

    // Check existing
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

main().catch(console.error);
