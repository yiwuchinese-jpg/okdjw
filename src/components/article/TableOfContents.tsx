"use client"

import * as React from "react"
import { TocItem } from "@/lib/toc"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { useState, useEffect } from "react"

interface TableOfContentsProps {
    items: TocItem[]
}

export function TableOfContents({ items }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>("")
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id)
                    }
                })
            },
            { rootMargin: "0px 0px -80% 0px" }
        )

        items.forEach((item) => {
            const element = document.getElementById(item.id)
            if (element) observer.observe(element)
        })

        return () => observer.disconnect()
    }, [items])

    if (!items?.length) return null

    const TocList = ({ mobile = false }) => (
        <div className={cn("space-y-4", mobile ? "p-8" : "")}>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-6">
                On this page
            </h3>
            <nav className="space-y-2">
                {items.map((item) => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                            "block text-sm transition-all duration-300 border-l-2 pl-4 py-1",
                            activeId === item.id
                                ? "border-primary text-white font-medium"
                                : "border-transparent text-white/40 hover:text-white hover:border-white/20"
                        )}
                        style={{ paddingLeft: `${(item.level - 2) * 1 + 1}rem` }}
                    >
                        {item.text}
                    </a>
                ))}
            </nav>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:block sticky top-32 h-[calc(100vh-8rem)]">
                <TocList />
            </div>

            {/* Mobile Toggle & Drawer */}
            <div className="lg:hidden">
                {/* Floating Action Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 z-50 p-4 bg-primary text-black rounded-full shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:scale-110 transition-transform active:scale-95"
                    aria-label="Table of Contents"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Drawer Backdrop */}
                {isOpen && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                        onClick={() => setIsOpen(false)}
                    />
                )}

                {/* Drawer Panel */}
                <div
                    className={cn(
                        "fixed inset-y-0 right-0 w-[80vw] max-w-sm bg-zinc-950 border-l border-white/10 z-[61] transform transition-transform duration-300 ease-in-out",
                        isOpen ? "translate-x-0" : "translate-x-full"
                    )}
                >
                    <div className="absolute top-6 right-6">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-white/40 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="h-full overflow-y-auto no-scrollbar">
                        <TocList mobile />
                    </div>
                </div>
            </div>
        </>
    )
}
