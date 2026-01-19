import fs from "fs";
import path from "path";

const SITE_URL = "https://imnews.vercel.app";

const ROOT = process.cwd();
const POST_DIR = path.join(ROOT, "post");

const POSTS_JSON = path.join(ROOT, "posts.json");
const SITEMAP_XML = path.join(ROOT, "sitemap.xml");
const ROBOTS_TXT = path.join(ROOT, "robots.txt");

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

  // title
  const title =
    html.match(/<title>(.*?)<\/title>/)?.[1] ||
    html.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1] ||
    file;

  // excerpt
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

  // ✅ 读取文章内发布时间（新规则）
  const dateMatch = html.match(
    /<meta name="publish-date" content="([^"]+)"/
  );

  const publishDate = dateMatch ? dateMatch[1] : today;

  // category（预留，后续可扩展）
  const categoryMatch = html.match(
    /<meta name="category" content="([^"]+)"/
  );

  const category = categoryMatch ? categoryMatch[1] : "工具观察";

  return {
    title,
    url: `/post/${file}`,
    date: publishDate,
    category,
    excerpt
  };
});

fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2));

// ---------- 生成 sitemap.xml ----------
const sitemapUrls = [
  `${SITE_URL}/`,
  ...files.map(f => `${SITE_URL}/post/${f}`)
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(url => `
  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${url === `${SITE_URL}/` ? "1.0" : "0.8"}</priority>
  </url>
`)
  .join("")}
</urlset>`;

fs.writeFileSync(SITEMAP_XML, sitemap.trim());

// ---------- 生成 robots.txt ----------
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

fs.writeFileSync(ROBOTS_TXT, robots.trim());

console.log("✅ posts.json, sitemap.xml, robots.txt generated");
