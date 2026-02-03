import Link from "next/link"
import Image from "next/image"
import { Github, Twitter, Linkedin, Mail, ArrowUpRight } from "lucide-react"

export function AuthorProfile() {
    return (
        <div className="space-y-8 sticky top-32">
            <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 bg-zinc-900">
                        {/* Placeholder for avatar, or use one if available */}
                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-2xl font-black text-white/10">JD</div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Author
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Justin Du</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-6">
                    Building Agentic AI solutions for global trade. Head of Brand @ Yiwu.
                </p>

                <div className="flex gap-4 mb-8">
                    <Link href="#" className="text-white/40 hover:text-white transition-colors"><Twitter className="w-4 h-4" /></Link>
                    <Link href="#" className="text-white/40 hover:text-white transition-colors"><Github className="w-4 h-4" /></Link>
                    <Link href="#" className="text-white/40 hover:text-white transition-colors"><Linkedin className="w-4 h-4" /></Link>
                </div>

                <Link
                    href="https://wa.me/8618666680913"
                    target="_blank"
                    className="group block w-full bg-white text-black font-bold text-center py-3 rounded-xl hover:bg-primary transition-colors relative overflow-hidden"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                        WhatsApp Me <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                    </span>
                </Link>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-b from-primary/10 to-transparent">
                <h4 className="text-primary font-bold uppercase tracking-wider text-xs mb-4">Latest Project</h4>
                <p className="text-white text-sm font-medium mb-4">
                    Check out the AI Sourcing Agent demo.
                </p>
                <Link href="/" className="text-xs text-white/50 hover:text-white border-b border-white/20 pb-0.5 transition-colors">
                    View Project &rarr;
                </Link>
            </div>
        </div>
    )
}
