import OpenAI from 'openai';
import { createClient } from 'next-sanity';

const LANGUAGES = [
    { code: 'zh', name: 'Chinese' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'ru', name: 'Russian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'de', name: 'German' },
    { code: 'fr', name: 'French' },
];

const TARGET_LANGUAGES = LANGUAGES.filter((l) => l.code !== 'en');

let openai: OpenAI;
let sanityClient: ReturnType<typeof createClient>;

function initClients() {
    if (openai && sanityClient) return;

    // These env vars should be available when this function is called
    // (either by Next.js environment or after dotenv.config() in scripts)

    if (!process.env.SANITY_API_TOKEN) {
        throw new Error("Missing SANITY_API_TOKEN");
    }

    openai = new OpenAI({
        apiKey: process.env.AI_API_KEY,
        baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com',
    });

    sanityClient = createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-01',
        useCdn: false,
        token: process.env.SANITY_API_TOKEN,
    });
}

async function translateText(text: string, targetLang: string): Promise<string> {
    if (!text) return '';
    try {
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `You are a professional translator. Translate the following text to ${targetLang}. Only return the translated text, no explanations.`,
                },
                { role: 'user', content: text },
            ],
        });
        return response.choices[0].message.content || text;
    } catch (error) {
        console.error(`Translation failed for ${targetLang}:`, error);
        return text;
    }
}

async function secureTranslatePortableText(blocks: any[], targetLangName: string): Promise<any[]> {
    if (!blocks || !Array.isArray(blocks)) return [];

    const newBlocks = JSON.parse(JSON.stringify(blocks));

    for (const block of newBlocks) {
        if (block._type === 'block' && Array.isArray(block.children)) {
            for (const child of block.children) {
                if (child._type === 'span' && child.text && child.text.trim()) {
                    child.text = await translateText(child.text, targetLangName);
                }
            }
        }
        if (block._type === 'image' && block.alt) {
            block.alt = await translateText(block.alt, targetLangName);
        }
    }
    return newBlocks;
}

export async function processDocumentTranslation(doc: any) {
    initClients(); // Ensure clients are ready

    if (doc.locale !== 'en') {
        console.log(`Skipping non-English document: ${doc.title} (${doc.locale})`);
        return;
    }

    console.log(`Processing translation for: ${doc.title} (${doc._id})`);

    for (const lang of TARGET_LANGUAGES) {
        const query = `*[_type == "${doc._type}" && slug.current == "${doc.slug.current}" && locale == "${lang.code}"][0]`;
        const existing = await sanityClient.fetch(query);

        if (existing) {
            console.log(`  - ${lang.name} (${lang.code}): Already exists. Updating...`);
            const updatedDoc = {
                title: await translateText(doc.title, lang.name),
                description: doc.description ? await translateText(doc.description, lang.name) : undefined,
                body: doc.body ? await secureTranslatePortableText(doc.body, lang.name) : undefined,
            };

            try {
                await sanityClient.patch(existing._id).set(updatedDoc).commit();
                console.log(`  - ${lang.name} (${lang.code}): Updated.`);
            } catch (err) {
                console.error(`  - ${lang.name} (${lang.code}): Failed to update`, err);
            }
            continue;
        }

        console.log(`  - ${lang.name} (${lang.code}): Creating new translation...`);

        const translatedDoc = {
            ...doc,
            _id: undefined,
            _createdAt: undefined,
            _updatedAt: undefined,
            _rev: undefined,
            locale: lang.code,
            title: await translateText(doc.title, lang.name),
            description: doc.description ? await translateText(doc.description, lang.name) : undefined,
            body: doc.body ? await secureTranslatePortableText(doc.body, lang.name) : undefined,
        };

        try {
            await sanityClient.create(translatedDoc);
            console.log(`  - ${lang.name} (${lang.code}): Created.`);
        } catch (err) {
            console.error(`  - ${lang.name} (${lang.code}): Failed to create`, err);
        }
    }
}
