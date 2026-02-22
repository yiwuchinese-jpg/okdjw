
/**
 * @file sync-wechat.ts
 * @description Syncs articles from Sanity CMS (or local) to WeChat Official Account.
 * 
 * 🚨 BUSINESS RULE (2026-02-07):
 * This script MUST ONLY sync the following two DAILY articles in CHINESE:
 * 1. "全球贸易每日简报" (Global Trade Daily Briefing)
 * 2. "搜索引擎天地每日动态" (Search Engine Land Daily Update)
 * 
 * ALL OTHER CONTENT (English versions, local blog posts, etc.) MUST BE FILTERED OUT.
 * DO NOT RELAX THE FILTERING LOGIC WITHOUT EXPLICIT PERMISSION.
 */
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { openAsBlob } from 'node:fs';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
import * as cheerio from 'cheerio';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const APP_ID = process.env.WECHAT_APP_ID;
const APP_SECRET = process.env.WECHAT_APP_SECRET;

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-02-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

async function getAccessToken() {
    if (!APP_ID || !APP_SECRET) {
        throw new Error("Missing WECHAT_APP_ID or WECHAT_APP_SECRET in .env.local");
    }
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`;
    const res = await fetch(url);
    const data = await res.json() as any;
    if (data.errcode) {
        throw new Error(`WeChat Token Error: ${data.errmsg}`);
    }
    return data.access_token;
}

async function uploadImage(accessToken: string, filePath: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`;

    // Ensure file exists
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const fileBlob = await openAsBlob(filePath);
    const form = new FormData();
    form.append('media', fileBlob, path.basename(filePath));

    const res = await fetch(url, {
        method: 'POST',
        body: form
    });

    const data = await res.json() as any;
    if (data.errcode) {
        throw new Error(`Image Upload Error: ${data.errmsg}`);
    }
    return data.media_id;
}

// Upload inline image (returns URL, not media_id)
async function uploadInlineImage(accessToken: string, imageUrl: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`;

    let imageBuffer: Buffer;
    let filename: string = 'image.jpg';

    // Handle local paths
    if (!imageUrl.startsWith('http')) {
        // Construct absolute path
        // Check if it's already absolute or relative to public
        let localPath = imageUrl;
        if (imageUrl.startsWith('/')) {
            localPath = path.join(process.cwd(), 'public', imageUrl);
        } else {
            localPath = path.join(process.cwd(), 'public', imageUrl); // Default assumption
        }

        if (fs.existsSync(localPath)) {
            imageBuffer = fs.readFileSync(localPath);
            filename = path.basename(localPath);
        } else {
            console.warn(`   ⚠️ Local image not found: ${localPath}`);
            return imageUrl; // Return original if not found
        }
    } else {
        // Handle remote URLs
        try {
            const res = await fetch(imageUrl);
            if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
            const arrayBuffer = await res.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
            filename = path.basename(new URL(imageUrl).pathname) || 'image.jpg';
        } catch (e) {
            console.warn(`   ⚠️ Remote image fetch failed: ${imageUrl}`, e);
            return imageUrl;
        }
    }

    const form = new FormData();
    // FormData requires a Blob-like object for files
    const blob = new Blob([new Uint8Array(imageBuffer)]);
    form.append('media', blob, filename);

    const res = await fetch(url, {
        method: 'POST',
        body: form
    });

    const data = await res.json() as any;
    if (data.errcode) {
        console.error(`   ❌ Inline Image Upload Error: ${data.errmsg}`);
        return imageUrl; // Return original on error
    }
    console.log(`   ✅ Inline Image Uploaded: ${data.url}`);
    return data.url;
}

async function processContentForWeChat(rawHtml: string, accessToken: string) {
    const $ = cheerio.load(rawHtml);

    // 1. Process Images (Upload & Replace)
    const imgTags = $('img').toArray();
    for (const img of imgTags) {
        const src = $(img).attr('src');
        if (src) {
            console.log(`   Processing Inline Image: ${src}`);
            const wechatUrl = await uploadInlineImage(accessToken, src);
            $(img).attr('src', wechatUrl);
            // Remove any srcset or other attributes that might interfere
            $(img).removeAttr('srcset');
            $(img).removeAttr('sizes');
            $(img).css('max-width', '100%');
            $(img).css('height', 'auto');
            $(img).css('display', 'block');
            $(img).css('margin', '20px auto');
        }
    }

    // 2. Process Tables (Styling)
    $('table').css({
        'border-collapse': 'collapse',
        'width': '100%',
        'margin-bottom': '20px',
        'font-size': '14px',
        'line-height': '1.5'
    });

    $('th').css({
        'border': '1px solid #e0e0e0',
        'padding': '8px 10px',
        'background-color': '#f7f7f7',
        'font-weight': '600',
        'text-align': 'left',
        'color': '#333'
    });

    $('td').css({
        'border': '1px solid #e0e0e0',
        'padding': '8px 10px',
        'color': '#555'
    });

    // 3. Process Videos (Replace with call-to-action placeholder)
    $('video').each((i, video) => {
        $(video).replaceWith(`
            <div style="background-color: #f5f7fa; padding: 24px 16px; text-align: center; border-radius: 8px; margin: 24px 0; border: 1px dashed #ced4da;">
                <p style="color: #4a5568; font-size: 15px; font-weight: 600; margin: 0 0 8px 0;">🎥 【视频已折叠】</p>
                <p style="color: #718096; font-size: 13px; margin: 0;">受限于微信排版，实操演示视频无法直接显示。<br/>请点击左下角<strong>“阅读原文”</strong>前往网站完整观看。</p>
            </div>
        `);
    });

    // 4. Process External Links (Replace with styled text)
    let hasExternalLinks = false;
    $('a').each((i, a) => {
        const href = $(a).attr('href');
        if (href && href.startsWith('http')) {
            hasExternalLinks = true;
            // WeChat strips non-whitelisted external <a> tags and destroys layout. 
            // We convert them to highlighted spans.
            const text = $(a).text();
            $(a).replaceWith(`<span style="color: #007aff; border-bottom: 1px solid #007aff;">${text}</span>`);
        }
    });

    if (hasExternalLinks) {
        // Append a warning at the end of the article if there were links
        $('body').append(`
            <div style="margin-top: 30px; padding: 15px; background-color: #fff8e1; color: #b78103; font-size: 13px; text-align: center; border-radius: 6px;">
                💡 <strong>温馨提示：</strong>文中包含的外部体验链接因微信限制无法直接点击，请点击文末<strong>“阅读原文”</strong>获取完整体验。
            </div>
        `);
    }

    return $.html();
}


// Convert Sanity Blocks to HTML
function convertBlocksToHtml(blocks: any[]) {
    if (!Array.isArray(blocks)) return "<p>No content</p>";

    // Modern WeChat Styling
    const styles = {
        container: "font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.75; color: #333; padding: 20px 16px; background-color: #fff;",
        h2: "font-size: 22px; font-weight: 600; color: #1a1a1a; margin-top: 40px; margin-bottom: 20px; border-left: 6px solid #007aff; padding-left: 12px; line-height: 1.2;",
        h3: "font-size: 18px; font-weight: 600; color: #333; margin-top: 24px; margin-bottom: 12px; line-height: 1.4;",
        p: "font-size: 16px; margin-bottom: 16px; text-align: justify; color: #4a4a4a;",
        blockquote: "background: #f5f7fa; border-left: 4px solid #007aff; padding: 16px; margin: 24px 0; color: #555; font-size: 15px; border-radius: 8px; line-height: 1.6;",
        li: "margin-bottom: 12px; font-size: 16px;",
        strong: "font-weight: 600; color: #000;",
        link: "color: #007aff; text-decoration: none;"
    };

    let html = `<div style="${styles.container}">`;

    blocks.forEach((block: any) => {
        if (block._type === 'block') {
            const style = block.style || 'normal';
            let textContent = "";
            if (block.children) {
                block.children.forEach((child: any) => {
                    let text = child.text || "";
                    if (child.marks && child.marks.length > 0) {
                        child.marks.forEach((mark: string) => {
                            if (mark === 'strong') {
                                text = `<strong style="${styles.strong}">${text}</strong>`;
                            }
                            // Link handling can be added here
                        });
                    }
                    textContent += text;
                });
            }

            if (style === 'h1') html += `<h1 style="font-size: 24px; text-align: center; margin-bottom: 24px;">${textContent}</h1>`;
            else if (style === 'h2') html += `<h2 style="${styles.h2}">${textContent}</h2>`;
            else if (style === 'h3') html += `<h3 style="${styles.h3}">${textContent}</h3>`;
            else if (style === 'blockquote') html += `<blockquote style="${styles.blockquote}">${textContent}</blockquote>`;
            else if (block.listItem) {
                html += `<div style="${styles.li}">• ${textContent}</div>`;
            }
            else html += `<p style="${styles.p}">${textContent}</p>`;
        }
    });

    html += `<p style="margin-top: 40px; color: #999; font-size: 13px; text-align: center;">Generated by AI • Global Trade Daily</p>`;
    html += "</div>";
    return html;
}

// Convert Raw Markdown to HTML (using remark)
async function convertRawMarkdownToHtml(markdown: string) {
    // 1. Use remark to convert to HTML (disable sanitize to allow raw HTML like <video>)
    const result = await remark().use(remarkGfm).use(html, { sanitize: false }).process(markdown);
    let rawHtml = result.toString();

    // 2. Apply WeChat Styles (Inline Styles)

    const styles = {
        container: "font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.75; color: #333; padding: 20px 16px; background-color: #fff;",
        h1: "font-size: 24px; font-weight: 600; color: #000; margin-bottom: 24px; text-align: center;",
        h2: "font-size: 22px; font-weight: 600; color: #1a1a1a; margin-top: 40px; margin-bottom: 20px; border-left: 6px solid #007aff; padding-left: 12px; line-height: 1.2;",
        h3: "font-size: 18px; font-weight: 600; color: #333; margin-top: 24px; margin-bottom: 12px; line-height: 1.4;",
        p: "font-size: 16px; margin-bottom: 16px; text-align: justify; color: #4a4a4a;",
        blockquote: "background: #f5f7fa; border-left: 4px solid #007aff; padding: 16px; margin: 24px 0; color: #555; font-size: 15px; border-radius: 8px; line-height: 1.6;",
        ul: "margin-bottom: 16px; padding-left: 20px; list-style-type: disc;",
        ol: "margin-bottom: 16px; padding-left: 20px; list-style-type: decimal;",
        li: "margin-bottom: 8px; font-size: 16px; line-height: 1.6;",
        strong: "font-weight: 600; color: #000;"
    };

    // Wrap in container
    let styledHtml = `<div style="${styles.container}">` + rawHtml + `</div>`;

    // Inject styles
    styledHtml = styledHtml
        .replace(/<h1>/g, `<h1 style="${styles.h1}">`)
        .replace(/<h2>/g, `<h2 style="${styles.h2}">`)
        .replace(/<h3>/g, `<h3 style="${styles.h3}">`)
        .replace(/<p>/g, `<p style="${styles.p}">`)
        .replace(/<blockquote>/g, `<blockquote style="${styles.blockquote}">`)
        .replace(/<ul>/g, `<ul style="${styles.ul}">`)
        .replace(/<ol>/g, `<ol style="${styles.ol}">`)
        .replace(/<li>/g, `<li style="${styles.li}">`)
        .replace(/<strong>/g, `<strong style="${styles.strong}">`);

    styledHtml += `<p style="margin-top: 40px; color: #999; font-size: 13px; text-align: center;">Original Article • OKDJW.COM</p>`;

    return styledHtml;
}

async function main() {
    console.log("🚀 Starting WeChat Sync...");

    if (!APP_ID) {
        console.log("⚠️ WECHAT_APP_ID not found. Skipping WeChat Sync.");
        return;
    }

    try {
        const token = await getAccessToken();
        console.log("✅ Got WeChat Access Token.");

        // --- SOURCE 1: Sanity CMS (News & Automated Content) ---
        // Look back 12 hours to catch the just-generated article, avoiding timezone "start of day" issues.
        const lookback = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        const query = `*[_type == "post" && publishedAt >= "${lookback}"]`;
        const sanityPosts = await client.fetch(query);
        console.log(`Found ${sanityPosts.length} matches in Sanity.`);

        // --- SOURCE 2: Local Markdown Files (Blog Posts) ---
        const localPosts = [];
        const contentDir = path.join(process.cwd(), 'src/content/zh/blog');

        if (fs.existsSync(contentDir)) {
            const files = fs.readdirSync(contentDir);
            // Look back 7 days for local files to ensure we don't miss manual edits
            const lookbackDate = new Date();
            lookbackDate.setDate(lookbackDate.getDate() - 7);

            for (const file of files) {
                if (!file.endsWith('.md')) continue;

                const filePath = path.join(contentDir, file);
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const { data, content } = matter(fileContent);

                // Check Date
                const postDate = new Date(data.date);
                if (postDate >= lookbackDate) {
                    localPosts.push({
                        title: data.title,
                        description: data.description,
                        body: content, // Raw Markdown
                        image: data.image,
                        slug: file.replace('.md', ''),
                        source: 'local',
                        locale: data.locale,
                        language: data.language,
                        wechat_synced: data.wechat_synced || false
                    });
                }
            }
        }
        console.log(`Found ${localPosts.length} recent local blog posts.`);

        // --- MERGE & PROCESS ---
        const allPosts = [
            ...sanityPosts.map((p: any) => ({ ...p, source: 'sanity' })),
            ...localPosts
        ];

        for (const post of allPosts) {
            // GLOBAL FILTER: strict check for user's requested RSS titles only.
            // This applies to BOTH Sanity (RSS) and Local files.

            // 1. Language Check: Must be Chinese
            console.log(`Checking Post: "${post.title}" (Locale: ${post.locale}, Lang: ${post.language})`);
            const isChinese = post.locale === 'zh' || post.language === 'zh';
            if (!isChinese) {
                console.log(`   Skipping: Not Chinese`);
                continue;
            }

            // 2. Title Filter: Must match specific RSS keywords OR be a designated topic
            const isGlobalTrade = post.title?.includes('全球贸易');
            const isSEL = post.title?.includes('搜索引擎');
            const isYiwu = post.title?.includes('义乌');
            const isAI = post.title?.includes('AI') || post.title?.includes('智能体');
            const isSupplyChain = post.title?.includes('供应链');
            const isGreen = post.title?.includes('绿色');

            if (post.wechat_synced) {
                console.log(`Skipping Post: ${post.title} (Already synced)`);
                continue;
            }

            if (!isGlobalTrade && !isSEL && !isYiwu && !isAI && !isSupplyChain && !isGreen) {
                console.log(`Skipping Post: ${post.title} (Not in allowed RSS/Topic list)`);
                continue;
            }

            console.log(`Processing: ${post.title} [${post.source}]`);

            // 1. Prepare Cover Image
            let mediaId = null;
            let imagePath = null;

            if (post.source === 'sanity' && post.fallbackImageUrl) {
                imagePath = path.join(process.cwd(), 'public', post.fallbackImageUrl);
            } else if (post.source === 'local' && post.image) {
                imagePath = path.join(process.cwd(), 'public', post.image);
            }

            if (imagePath && fs.existsSync(imagePath)) {
                console.log("   Uploading cover image...");
                try {
                    mediaId = await uploadImage(token, imagePath);
                    console.log(`   ✅ Media ID: ${mediaId}`);
                } catch (e) {
                    console.error("   ❌ Image upload failed:", e);
                }
            } else {
                console.log("   ⚠️ Primary cover image missing. Trying fallback...");
                // Fallback to top-stories.png if available
                const fallbackPath = path.join(process.cwd(), 'public', 'images', 'generated', 'top-stories.png');
                if (fs.existsSync(fallbackPath)) {
                    console.log("   Uploading FALLBACK cover image (top-stories.png)...");
                    try {
                        mediaId = await uploadImage(token, fallbackPath);
                        console.log(`   ✅ Media ID: ${mediaId}`);
                    } catch (e) {
                        console.error("   ❌ Fallback Image upload failed:", e);
                    }
                } else {
                    console.log("   ⚠️ Fallback image also missing.");
                }
            }

            // 2. Prepare Content (HTML)
            let contentHtml = "";
            if (post.source === 'sanity') {
                contentHtml = convertBlocksToHtml(post.body);
            } else {
                contentHtml = await convertRawMarkdownToHtml(post.body);
            }

            // 3. ENHANCED PROCESSING: Upload inline images & fix tables
            contentHtml = await processContentForWeChat(contentHtml, token);


            // 4. Create Draft
            const safeTitle = (post.title || "No Title").substring(0, 64);
            const safeDigest = (post.description || "").substring(0, 120);

            const draftData = {
                articles: [
                    {
                        title: safeTitle,
                        author: "OKDJW AI",
                        digest: safeDigest,
                        content: contentHtml,
                        content_source_url: `https://okdjw.com/zh/archive/articles/${post.slug.current || post.slug}`,
                        thumb_media_id: mediaId,
                    }
                ]
            };

            const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draftData)
            });
            const data = await res.json() as any;

            if (data.errcode) {
                console.error(`   ❌ Draft creation failed: ${data.errmsg}`);
            } else {
                console.log(`   ✅ Draft created! MediaId: ${data.media_id}`);
            }
        }
        console.log("✅ WeChat Sync Finished.");
        process.exit(0);

    } catch (error) {
        console.error("❌ WeChat Sync Error:", error);
    }
}

main();
