import fs from "fs";
import path from "path";

/**
 * 站点配置
 */
const SITE_URL = "https://software-reviews.onrender.com";

/**
 * 路径
 * ⚠️ 根目录输出（不使用 public）
 */
const ROOT = process.cwd();
const POST_DIR = path.join(ROOT, "post");

const POSTS_JSON = path.join(ROOT, "posts.json");
const SITEMAP_XML = path.join(ROOT, "sitemap.xml");
const ROBOTS_TXT  = path.join(ROOT, "robots.txt");

/**
 * 读取文章文件
 */
const files = fs
  .readdirSync(POST_DIR)
  .filter(f => f.endsWith(".html"))
  .sort()
  .reverse();

const today = new Date().toISOString().slice(0, 10);

/**
 * ========== 生成 posts.json ==========
 */
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

  // publish date
  const dateMatch = html.match(
    /<meta name="publish-date" content="([^"]+)"/
  );
  const publishDate = dateMatch ? dateMatch[1] : today;

  // category
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

fs.writeFileSync(
  POSTS_JSON,
  JSON.stringify(posts, null, 2),
  "utf-8"
);

/**
 * ========== 生成 sitemap.xml ==========
 */
const sitemapItems = [];

// 首页
sitemapItems.push(
  `<url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`
);

// 文章页
for (const f of files) {
  sitemapItems.push(
    `<url>
      <loc>${SITE_URL}/post/${f}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>`
  );
}

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  sitemapItems.join("\n") +
  `\n</urlset>`;

fs.writeFileSync(SITEMAP_XML, sitemap, "utf-8");

/**
 * ========== 生成 robots.txt ==========
 */
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

fs.writeFileSync(ROBOTS_TXT, robots, "utf-8");

console.log("✅ posts.json / sitemap.xml / robots.txt generated in ROOT");
