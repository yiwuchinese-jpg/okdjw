import { slugify } from '@/lib/utils'

export interface TocItem {
    id: string
    text: string
    level: number
}

export function extractTocFromSanity(body: any[]): TocItem[] {
    if (!body) return []

    return body
        .filter((block) => block._type === 'block' && block.style?.startsWith('h'))
        .map((block) => {
            const text = block.children?.map((child: any) => child.text).join('') || ''
            // Filter out accidental long paragraphs formatted as headers (common in AI gen or copy paste)
            if (text.length > 100) return null

            const level = parseInt(block.style.replace('h', ''))
            return {
                id: slugify(text),
                text,
                level,
            }
        })
        .filter((item): item is TocItem => item !== null)
}

export function extractTocFromMarkdown(contentHtml: string): TocItem[] {
    // Simple regex based extraction for now, or use remark/rehype if available at runtime
    // Since contentHtml is a string, regex is easiest for client/server shared logic without heavy deps
    const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h\1>/g
    const items: TocItem[] = []
    let match

    while ((match = headingRegex.exec(contentHtml)) !== null) {
        const level = parseInt(match[1])
        const textContent = match[2].replace(/<[^>]+>/g, '') // strip inner tags
        items.push({
            id: slugify(textContent),
            text: textContent,
            level
        })
    }

    return items
}
