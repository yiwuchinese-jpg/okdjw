
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { openAsBlob } from 'node:fs';

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

// Markdown to WeChat-compatible HTML with Modern Styling
function convertMarkdownToHtml(blocks: any[]) {
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

            // Process children for marks (bold, link)
            let textContent = "";
            if (block.children) {
                block.children.forEach((child: any) => {
                    let text = child.text || "";

                    // Handle Marks
                    if (child.marks && child.marks.length > 0) {
                        child.marks.forEach((mark: string) => {
                            if (mark === 'strong') {
                                text = `<strong style="${styles.strong}">${text}</strong>`;
                            } else {
                                // Check for Link in markDefs
                                const linkDef = block.markDefs?.find((def: any) => def._key === mark);
                                if (linkDef && linkDef._type === 'link') {
                                    // User requested removing links for WeChat
                                    // text = `<a href="${linkDef.href}" style="${styles.link}">${text}</a>`; 
                                    text = text; // Just keep text
                                }
                            }
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
                // Simplified list handling (using paragraphs with bullet)
                html += `<div style="${styles.li}">• ${textContent}</div>`;
            }
            else html += `<p style="${styles.p}">${textContent}</p>`;
        }
    });

    html += `<p style="margin-top: 40px; color: #999; font-size: 13px; text-align: center;">Generated by AI • Global Trade Daily</p>`;
    html += "</div>";
    return html;
}

async function main() {
    console.log("🚀 Starting WeChat Sync...");

    if (!APP_ID) {
        console.log("⚠️ WECHAT_APP_ID not found. Skipping WeChat Sync. (Please configure in .env.local)");
        return;
    }

    try {
        const token = await getAccessToken();
        console.log("✅ Got WeChat Access Token.");

        // Fetch Today's Articles (En and Zh)
        const today = new Date().toISOString().split('T')[0];
        // Note: publishedAt might include time.
        const startOfDay = new Date().toISOString().split('T')[0] + "T00:00:00.000Z";

        const query = `*[_type == "post" && publishedAt >= "${startOfDay}"]`;
        const posts = await client.fetch(query);

        console.log(`Found ${posts.length} articles from today.`);

        for (const post of posts) {
            // FILTER: Only sync "Global Trade Daily" (or equiv) and CHINESE content
            // Assuming simplified check: Only Title contains specific keywords OR locale is 'zh'
            // User request: "Only sync Global Trade Daily Briefing's CHINESE content"

            const isChinese = post.locale === 'zh' || post.language === 'zh';
            // "Global Trade" in Chinese is "全球贸易"
            const isGlobalTrade = post.title?.includes('全球贸易');
            const isSEL = post.title?.includes('搜索引擎天地');

            if (!isChinese || (!isGlobalTrade && !isSEL)) {
                console.log(`Skipping: ${post.title} (Not Chinese Global Trade Daily)`);
                continue;
            }

            console.log(`Processing: ${post.title}`);

            // 1. Prepare Cover Image
            let mediaId = null;
            if (post.fallbackImageUrl) {
                const imagePath = path.join(process.cwd(), 'public', post.fallbackImageUrl);
                if (fs.existsSync(imagePath)) {
                    console.log("   Uploading cover image...");
                    try {
                        mediaId = await uploadImage(token, imagePath);
                        console.log(`   ✅ Media ID: ${mediaId}`);
                    } catch (e) {
                        console.error("   ❌ Image upload failed/skipped:", e);
                    }
                }
            }

            // 2. Prepare Content
            const content = convertMarkdownToHtml(post.body);

            // 3. Create Draft
            // Truncate title (64 chars max) and digest (120 chars max) to be safe
            const safeTitle = post.title.length > 60 ? post.title.substring(0, 60) + "..." : post.title;
            const safeDigest = (post.description || "Daily Update").length > 110 ? (post.description || "Daily Update").substring(0, 110) + "..." : (post.description || "Daily Update");

            const draftData = {
                articles: [
                    {
                        title: safeTitle,
                        author: "OKDJW AI",
                        digest: safeDigest,
                        content: content,
                        content_source_url: `https://okdjw.com/zh/archive/articles/${post.slug.current}`,
                        thumb_media_id: mediaId,
                        // Removing comment fields as they can cause permission errors on unverified accounts
                        // need_open_comment: 1,
                        // only_fans_can_comment: 0
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

    } catch (error) {
        console.error("❌ WeChat Sync Error:", error);
    }
}

main();
