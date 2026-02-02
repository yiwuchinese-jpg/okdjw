import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const contentDirectory = path.join(process.cwd(), "src/content");

export interface ContentData {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  category: string;
  image?: string;
  description: string;
  contentHtml?: string;
  type?: "blog" | "tutorials" | "projects" | "resources";
}

export function getAllContent(type: "blog" | "tutorials" | "projects" | "resources", locale: string): ContentData[] {
  if (!locale) return [];
  const directory = path.join(contentDirectory, locale, type);
  if (!fs.existsSync(directory)) return [];

  const fileNames = fs.readdirSync(directory);
  const allContentData = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(directory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const matterResult = matter(fileContents);

      return {
        slug,
        type,
        ...(matterResult.data as { title: string; date: string; tags: string[]; category: string; image?: string; description: string }),
      };
    });

  return allContentData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getContentData(type: "blog" | "tutorials" | "projects" | "resources", slug: string, locale: string): Promise<ContentData> {
  const fullPath = path.join(contentDirectory, locale, type, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    contentHtml,
    type,
    ...(matterResult.data as { title: string; date: string; tags: string[]; category: string; image?: string; description: string }),
  };
}
