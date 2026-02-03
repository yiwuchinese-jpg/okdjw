import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/[^\w\u4e00-\u9fa5-]+/g, "") // Remove all non-word chars (preserving Chinese characters)
        .replace(/--+/g, "-") // Replace multiple - with single -
}
