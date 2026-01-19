import fs from "fs";
import path from "path";

const SITE_URL = "https://software-reviews.netlify.app";

const ROOT = process.cwd();
const POST_DIR = path.join(ROOT, "post");
const PUBLIC_DIR = path.join(ROOT, "public");

fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const POSTS_JSON = path.join(PUBLIC_DIR, "posts.json");
const SITEMAP_XML = path.join(PUBLIC_DIR, "sitemap.xml");
const ROBOTS_TXT = path.join(PUBLIC_DIR, "robots.txt");

const files = fs
  .readdirSync(POST_DIR)
  .filter(f => f.endsWith(".html"))
  .sort()
  .reverse();

const today = new Date().toISOString().slice(0, 10);

// ---------- posts.json ----------
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
  const publishDate = dateMatch ? dateMatch[1] : today;

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

fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2), "utf-8");

// ---------- sitemap.xml（安全写法） ----------
const sitemapBody = [
  `<url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`
];

for (const f of files) {
  sitemapBody.push(
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
  sitemapBody.join("\n") +
  `\n</urlset>`;

fs.writeFileSync(SITEMAP_XML, sitemap, "utf-8");

// ---------- robots.txt ----------
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

fs.writeFileSync(ROBOTS_TXT, robots, "utf-8");

console.log("✅ posts.json / sitemap.xml / robots.txt generated");

