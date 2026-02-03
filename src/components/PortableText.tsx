import { PortableText as ReactPortableText } from '@portabletext/react'
import { urlForImage } from '@/sanity/lib/image'
import Image from 'next/image'

const components = {
    types: {
        image: ({ value }: any) => {
            if (!value?.asset?._ref) {
                return null
            }
            return (
                <div className="my-8 relative w-full h-64 md:h-96 rounded-3xl overflow-hidden border border-white/10">
                    <Image
                        src={urlForImage(value).url()}
                        alt={value.alt || 'Article image'}
                        fill
                        className="object-cover"
                    />
                </div>
            )
        },
    },
    marks: {
        link: ({ children, value }: any) => {
            const rel = !value.href.startsWith('/') ? 'noreferrer noopener' : undefined
            return (
                <a href={value.href} rel={rel} target="_blank" className="text-primary hover:underline">
                    {children}
                </a>
            )
        },
    },
    block: {
        h1: ({ children }: any) => <h1 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter">{children}</h1>,
        h2: ({ children, value }: any) => {
            const id = children?.[0]?.toLowerCase?.()?.replace(/\s+/g, '-') || '';
            return <h2 id={id} className="text-3xl md:text-4xl font-bold text-white mt-12 mb-6 tracking-tight scroll-mt-32">{children}</h2>
        },
        h3: ({ children, value }: any) => {
            const id = children?.[0]?.toLowerCase?.()?.replace(/\s+/g, '-') || '';
            return <h3 id={id} className="text-2xl md:text-3xl font-bold text-white mt-8 mb-4 scroll-mt-32">{children}</h3>
        },
        normal: ({ children }: any) => <p className="text-lg text-white/60 leading-relaxed mb-6">{children}</p>,
        blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-primary/30 pl-6 py-2 my-8 italic text-white/80 text-xl font-medium bg-gradient-to-r from-primary/5 to-transparent rounded-r-xl">
                {children}
            </blockquote>
        ),
    },
    list: {
        bullet: ({ children }: any) => <ul className="list-disc pl-6 space-y-2 mb-6 text-white/70">{children}</ul>,
        number: ({ children }: any) => <ol className="list-decimal pl-6 space-y-2 mb-6 text-white/70">{children}</ol>,
    },
}

export function PortableText({ value }: { value: any }) {
    return <ReactPortableText value={value} components={components} />
}
