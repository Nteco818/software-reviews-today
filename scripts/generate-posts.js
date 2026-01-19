import fs from "fs";
import path from "path";

const SITE_URL = "https://software-reviews.netlify.app";

const ROOT = process.cwd();
const POST_DIR = path.join(ROOT, "post");

// ✅ publish 目录（关键）
const PUBLIC_DIR = path.join(ROOT, "public");

const POSTS_JSON = path.join(PUBLIC_DIR, "posts.json");
const SITEMAP_XML = path.join(PUBLIC_DIR, "sitemap.xml");
const ROBOTS_TXT = path.join(PUBLIC_DIR, "robots.txt");

// 确保 public 存在
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// 读取文章文件
const files = fs
  .readdirSync(POST_DIR)
  .filter(f => f.endsWith(".html"))
  .sort()
  .reverse();

const today = new Date().toISOString().slice(0, 10);

// ---------- 生成 posts.json ----------
const posts = files.map(file => {
  const html = fs.readFileSync(path.join(POST_DIR, file), "utf8");

  const title =
    html.match(/<title>(.*?)<\/title>/)?.[1] ||
    html.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1] ||
    file;

  let excerpt =
    html.match(/<meta name="description" content="(.*?)"/)?.[1] || "";

  if (!excerpt) {
    const p = html.match(/<p[^>]*>(.*?)<\/p>/);
    if (p) {
      excerpt = p[1]
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
    }
  }

  const dateMatch = html.match(
    /<meta name="publish-date" content="([^"]+)"/
  );
  const publishDate = dat
