import Parser from 'rss-parser';
import OpenAI from 'openai';
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const RSS_URL = 'https://searchengineland.com/feed/';

// Initialize clients
const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
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

async function summarizeArticle(title: string, contentSnippet: string): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'You are a tech news editor. Summarize the following news article into ONE concise English sentence (max 30 words) that explains what it is about. Start with a verb if possible. Do NOT include phrases like "This article talks about".',
                },
                {
                    role: 'user',
                    content: `Title: ${title}\n\nContent Excerpt: ${contentSnippet}`,
                },
            ],
        });
        return response.choices[0].message.content || 'No summary available.';
    } catch (error) {
        console.error('Summarization failed:', error);
        return 'Summary unavailable.';
    }
}

async function main() {
    console.log(`Fetching RSS feed from ${RSS_URL}...`);
    const feed = await parser.parseURL(RSS_URL);

    // Filter items from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // For testing/demo purposes, if 24h filter returns nothing, take top 3. 
    // But strictly per requirement "Daily Update", 24h is correct.
    // Let's implement strict 24h, but log count.
    const recentItems = feed.items.filter(item => {
        const itemDate = item.pubDate ? new Date(item.pubDate) : new Date(0);
        return itemDate > yesterday;
    });

    console.log(`Found ${recentItems.length} articles from the last 24 hours.`);

    if (recentItems.length === 0) {
        console.log('No new articles to process.');
        return;
    }

    // Generate Body Content
    const blocks: any[] = [];

    // Intro block
    blocks.push({
        _type: 'block',
        _key: 'intro',
        style: 'normal',
        children: [{
            _type: 'span',
            text: `Here is your daily summary of the latest news from Search Engine Land for ${new Date().toLocaleDateString()}.`,
        }],
    });

    for (const item of recentItems) {
        if (!item.title || !item.link) continue;

        console.log(`Processing: ${item.title}`);
        const summary = await summarizeArticle(item.title, item.contentSnippet || item.content || '');

        // Structure:
        // H3: [Title](link) -> Sanity Block doesn't support links on headers natively easily, usually text.
        // Let's do:
        // H3: Title
        // Normal: Summary
        // Normal: [Read more](link) (link)

        blocks.push({
            _type: 'block',
            style: 'h3',
            children: [{ _type: 'span', text: item.title }],
        });

        blocks.push({
            _type: 'block',
            style: 'normal',
            children: [{ _type: 'span', text: summary }],
        });

        blocks.push({
            _type: 'block',
            style: 'normal',
            children: [
                {
                    _type: 'span',
                    text: 'Read more',
                    marks: [item.link] // We need to add markDefs for this
                }
            ],
            markDefs: [
                {
                    _key: item.link,
                    _type: 'link',
                    href: item.link
                }
            ]
        });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const slug = `search-engine-land-daily-${dateStr}`;
    const title = `Search Engine Land Daily Update - ${dateStr}`;

    const doc = {
        _type: 'post',
        title,
        slug: { _type: 'slug', current: slug },
        locale: 'en',
        publishedAt: new Date().toISOString(),
        description: `Daily AI-curated summary of Search Engine Land news for ${dateStr}.`,
        body: blocks,
        // categories etc?
        tags: ['News', 'SEO', 'Search Engine Land', 'Daily Update']
    };

    // Check availability
    const existing = await client.fetch(`*[_type == "post" && slug.current == "${slug}" && locale == "en"][0]`);
    if (existing) {
        console.log('Article already exists for today. Updating...');
        await client.patch(existing._id).set(doc).commit();
        console.log(`Updated post: ${title}`);
    } else {
        await client.create(doc);
        console.log(`Created new post: ${title}`);
    }

    // Note: The Webhook should automatically pick this up and translate it!
}

main().catch(console.error);
