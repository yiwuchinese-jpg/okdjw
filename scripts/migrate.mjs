import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const token = 'skcTbNcBOTVi3z0O8hRaxxONVc0cufCxDkuklCVQA8pDwt4tPiDlhOuykK7H4JSDMBooLwdhoyiQyquUjEFr6pqlnLz75xmDVjlpZJWylclz8UBasmlXoMKo2FxrdKwzPAytHSnwVn3XGXd5RRkJSjbsxWC3R5Zu4Ox9wo9MzOAtSkRDkEHi';
const projectId = 'tqmoljsg';
const dataset = 'production';
const apiVersion = '2024-02-01';

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
});

const CONTENT_ROOT = path.join(process.cwd(), 'src/content');

/**
 * Simple Markdown to Portable Text converter (Paragraphs only for now)
 */
function markdownToPortableText(markdown) {
    const paragraphs = markdown.split('\n\n').filter(p => p.trim() !== '');
    return paragraphs.map(text => {
        // Basic cleanup of markdown symbols for a cleaner CMS look
        const cleanText = text.replace(/^#+\s+/, '').replace(/\*\*/g, '').replace(/\*/g, '');
        return {
            _type: 'block',
            children: [{ _type: 'span', text: cleanText.trim() }],
            markDefs: [],
            style: text.startsWith('#') ? 'h2' : 'normal',
        };
    });
}

async function migrate() {
    const locales = ['zh', 'en', 'es', 'ru', 'ar', 'de', 'fr'];
    const types = ['blog', 'resources', 'tutorials'];

    for (const locale of locales) {
        for (const type of types) {
            const dir = path.join(CONTENT_ROOT, locale, type);
            if (!fs.existsSync(dir)) continue;

            const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

            for (const file of files) {
                const fullPath = path.join(dir, file);
                const content = fs.readFileSync(fullPath, 'utf8');
                const { data, content: body } = matter(content);
                const slug = file.replace('.md', '');

                const docType = type === 'resources' ? 'resource' : 'post';

                console.log(`Migrating [${locale}] ${type}: ${data.title}...`);

                const doc = {
                    _type: docType,
                    _id: `migrated-${locale}-${type}-${slug}`, // Unique ID based on slug/locale
                    title: data.title,
                    slug: { _type: 'slug', current: slug },
                    locale: locale,
                    publishedAt: new Date(data.date).toISOString(),
                    description: data.description,
                    category: data.category || 'AI',
                    tags: data.tags || [],
                    body: markdownToPortableText(body),
                };

                if (type === 'resources' && data.downloadUrl) {
                    doc.downloadUrl = data.downloadUrl;
                }

                try {
                    await client.createOrReplace(doc);
                    console.log(`✅ Success: ${data.title}`);
                } catch (err) {
                    console.error(`❌ Failed: ${data.title}`, err.message);
                }
            }
        }
    }
}

migrate().then(() => console.log('All migrations finished.')).catch(console.error);
