// 优化版封面抓取：
// 1) 用 t9 高清版本（约为 t6 的 2.5 倍大小）
// 2) 多关键词搜索 + 精确匹配优先 + 作者校验
// 3) 失败时回退低清版本，再失败用 emoji

import https from "node:https";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WR_KEY = "wrk-Hbc0PR6SRSOtrsWHChbKBQAA";
const WR_API = "https://i.weread.qq.com/api/agent/gateway";

// 把 t6/s_ 替换成 t9_（更高清）
const upgradeToHD = (url) => {
  if (!url) return null;
  // cdn.weread.qq.com 形式: .../s_YueWen_xxx.jpg
  let u = url.replace(/\/s_([^\/]+\.jpg)/, "/t9_$1");
  u = u.replace(/\/t6_([^\/]+\.jpg)/, "/t9_$1");
  // wfqqreader 形式: .../s_xxx.jpg 或 .../t6_xxx.jpg
  u = u.replace(/\/s_(\d+\.jpg)/, "/t9_$1");
  u = u.replace(/\/t6_(\d+\.jpg)/, "/t9_$1");
  return u;
};

// 调用微信读书 API
const callWeread = (params) => new Promise((resolve, reject) => {
  const payload = JSON.stringify({ skill_version: "1.0.3", ...params });
  const req = https.request(WR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      Authorization: `Bearer ${WR_KEY}`,
      "User-Agent": "Mozilla/5.0",
    },
  }, (res) => {
    let d = "";
    res.on("data", (c) => (d += c));
    res.on("end", () => {
      try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
    });
  });
  req.on("error", reject);
  req.setTimeout(12000, () => req.destroy(new Error("timeout")));
  req.write(payload);
  req.end();
});

// 标题相似度评分
const titleScore = (target, candidate) => {
  const t = target.replace(/[《》\s·\.\(\)（）\-]/g, "").toLowerCase();
  const c = candidate.replace(/[《》\s·\.\(\)（）\-]/g, "").toLowerCase();
  if (!t || !c) return 0;
  if (c === t) return 100;
  if (c.includes(t) || t.includes(c)) return 80;
  // 公共子串
  let common = 0;
  for (let i = 0; i < Math.min(t.length, c.length); i++) {
    if (t[i] === c[i]) common++;
    else break;
  }
  return Math.round((common / Math.max(t.length, c.length)) * 60);
};

const authorMatch = (a, b) => {
  if (!a || !b) return 0;
  const norm = (s) => s.replace(/[《》\s\[\]【】\(\)（）：:，,。.\-]/g, "").toLowerCase();
  const x = norm(a), y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 100;
  if (x.includes(y) || y.includes(x)) return 70;
  return 0;
};

// 主匹配：尝试多个关键词，返回最佳匹配
const findBestMatch = async (title, author) => {
  const keywords = [
    title,
    title.replace(/[《》]/g, ""),
    title.replace(/[《》（）\(\)\s·]/g, ""),
    title.split(/[·:：\s]/)[0], // 取第一段
  ];
  if (author) keywords.push(`${title.split(/[·:：\s]/)[0]} ${author.split(/[·\s]/)[0]}`);

  let best = null;
  for (const kw of keywords) {
    if (!kw || kw.length < 2) continue;
    try {
      const j = await callWeread({ api_name: "/store/search", keyword: kw, count: 8, scope: 10 });
      if (!j.results) continue;
      const books = [];
      j.results.forEach((g) => (g.books || []).forEach((b) => books.push(b.bookInfo)));
      for (const b of books) {
        const tScore = titleScore(title, b.title || "");
        const aScore = author ? authorMatch(author, b.author || "") : 0;
        const total = tScore * 0.6 + aScore * 0.4;
        if (total < 50) continue;
        if (!best || total > best.score) {
          best = { ...b, score: total };
        }
      }
      // 如果找到一个 90 分以上的就直接返回
      if (best && best.score >= 90) return best;
    } catch (e) {}
  }
  return best;
};

// 主流程
const main = async () => {
  // 读 books.js
  const booksJs = readFileSync(join(__dirname, "js/books.js"), "utf-8");
  const m = booksJs.match(/window\.BOOK_LIST\s*=\s*(\[[\s\S]*?\]);/);
  const books = JSON.parse(m[1]);
  console.log(`共 ${books.length} 本书，开始抓取高清封面...`);

  const covers = {};
  let hdCount = 0, sdCount = 0, failCount = 0;
  const fails = [];

  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    process.stdout.write(`[${i + 1}/${books.length}] ${b.title.padEnd(20)} `);
    const match = await findBestMatch(b.title, b.author);
    if (match && match.cover) {
      const hdUrl = upgradeToHD(match.cover);
      // 验证 HD URL 是否可达
      const reachable = await new Promise((r) => {
        const req = https.request(hdUrl, { method: "HEAD", timeout: 5000 }, (res) => r(res.statusCode === 200));
        req.on("error", () => r(false));
        req.on("timeout", () => { req.destroy(); r(false); });
        req.end();
      });
      if (reachable) {
        covers[b.title] = hdUrl;
        hdCount++;
        process.stdout.write(`✓ HD ${match.title} [${match.bookId}]\n`);
      } else {
        // 回退到原图
        covers[b.title] = match.cover;
        sdCount++;
        process.stdout.write(`△ SD ${match.title} [${match.bookId}]\n`);
      }
    } else {
      failCount++;
      fails.push(b.title);
      process.stdout.write(`✗ 失败\n`);
    }
    // 礼貌延迟
    await new Promise((r) => setTimeout(r, 200));
  }

  writeFileSync(join(__dirname, "covers.json"), JSON.stringify(covers, null, 2));
  console.log(`\n=== 完成 ===`);
  console.log(`高清(t9): ${hdCount}  低清: ${sdCount}  失败: ${failCount}`);
  if (fails.length) console.log(`失败列表:\n  ${fails.join("\n  ")}`);
};

main().catch(console.error);
