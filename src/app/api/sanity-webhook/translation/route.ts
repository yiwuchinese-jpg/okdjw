import { NextRequest, NextResponse } from 'next/server';
import { processDocumentTranslation } from '@/lib/translation-service';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';

// You need to set this secret in Sanity Manage
const SECRET = process.env.SANITY_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    const signature = req.headers.get(SIGNATURE_HEADER_NAME);
    const body = await req.text(); // Read raw text for signature verification

    if (!SECRET) {
        console.error('SANITY_WEBHOOK_SECRET not set');
        return NextResponse.json({ message: 'Misconfigured' }, { status: 500 });
    }

    if (!isValidSignature(body, signature as string, SECRET)) {
        console.error('Invalid signature');
        return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    const doc = JSON.parse(body);
    console.log('Received webhook for:', doc._id, doc.title);

    // Background processing could be better (e.g. Inngest or simple async if Vercel allows 10s+)
    // For small translations, await might be okay. For scaling, offload to a queue.
    try {
        await processDocumentTranslation(doc);
        return NextResponse.json({ message: 'Processed' }, { status: 200 });
    } catch (err: any) {
        console.error('Error processing translation:', err);
        // Return 200 anyway to prevent Sanity from retrying forever if it's a logic error
        return NextResponse.json({ message: 'Error', error: err.message }, { status: 200 });
    }
}
