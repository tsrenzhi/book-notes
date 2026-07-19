// 生成每本书的静态分享页 b/{i}.html
// 每页带该书封面的 OG 标签，微信抓取后出"封面+书名"卡片；打开后 JS 跳回 SPA 详情页
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://tsrenzhi.github.io/book-notes';

// 载入数据
global.window = {};
const ctx = vm.createContext(global);
for (const f of ['js/books.js', 'js/frameworks.js', 'js/douban.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), ctx, { filename: f });
}
const BOOK_LIST = global.window.BOOK_LIST || [];
const FRAMEWORKS = global.window.BOOK_FRAMEWORKS || {};
const DOUBAN = global.window.BOOK_DOUBAN || {};

const outDir = path.join(__dirname, 'b');
fs.mkdirSync(outDir, { recursive: true });

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let n = 0;
BOOK_LIST.forEach((b, i) => {
  const title = b.title || '好书';
  const coverAbs = /^assets\//.test(b.cover || '')
    ? `${BASE}/${b.cover}`
    : `${BASE}/assets/og-cover.png`;

  // 描述：豆瓣短介绍 > 框架核心问题 > 推荐语
  const fw = FRAMEWORKS[title];
  const db = DOUBAN[title];
  let desc = (db && db.intro) || (fw && fw.coreQuestion) || b.recommend || '';
  desc = String(desc).replace(/\s+/g, ' ').trim().slice(0, 90);

  const ogTitle = `${title} · 认知无穷大`;
  const pageUrl = `${BASE}/b/${i}.html`;
  const spaUrl = `${BASE}/#/blbook/${i}`;

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(ogTitle)}</title>
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(coverAbs)}">
<meta property="og:url" content="${esc(pageUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(coverAbs)}">
</head>
<body style="font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#faf9f7;color:#333;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <div style="text-align:center">
    <p style="font-size:16px">正在打开 ${esc(title)}…</p>
    <p style="font-size:14px"><a href="${esc(spaUrl)}" style="color:#1a73e8">若未自动跳转，点此打开</a></p>
  </div>
  <script>location.href=${JSON.stringify(spaUrl)};</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(outDir, `${i}.html`), html);
  n++;
});

console.log(`Generated ${n} book share pages in b/`);
