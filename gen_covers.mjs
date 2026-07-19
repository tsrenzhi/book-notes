/**
 * gen_covers.mjs — 从微信读书 API 批量获取精选书单的真实封面
 * 
 * 用法: node gen_covers.mjs
 * 输出: covers.json + 更新 js/books.js（含 cover 字段）
 */

import { readFileSync, writeFileSync } from "fs";
import https from "https";

const WR_API = "https://i.weread.qq.com/api/agent/gateway";
const WR_KEY = "wrk-Hbc0PR6SRSOtrsWHChbKBQAA";

// 读入 books.js
const booksJs = readFileSync("./js/books.js", "utf-8");
const bookListMatch = booksJs.match(/window\.BOOK_LIST\s*=\s*(\[[\s\S]*?\]);/);
if (!bookListMatch) { console.error("无法解析 BOOK_LIST"); process.exit(1); }
const BOOK_LIST = JSON.parse(bookListMatch[1]);
console.log(`共 ${BOOK_LIST.length} 本书，开始获取封面...\n`);

// 微信读书 API（正确格式：Bearer token + api_name 顶层）
function wrApi(apiName, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ ...body, api_name: apiName, skill_version: "1.0.3" });
    const req = https.request(WR_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "Authorization": "Bearer " + WR_KEY,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("Parse error: " + data.slice(0, 300))); }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
    req.write(payload);
    req.end();
  });
}

// 搜索一本书，提取封面 URL
async function fetchCover(title) {
  const cleanTitle = title.replace(/[《》]/g, "").trim();
  try {
    const result = await wrApi("/store/search", { keyword: cleanTitle, count: 3, scope: 10 });
    // scope=10 返回格式：{ results: [{ books: [{ bookInfo: { cover, title, bookId } }] }] }
    const results = result?.results || [];
    for (const group of results) {
      const books = group.books || [];
      for (const item of books) {
        const info = item.bookInfo || {};
        if (info.cover) return { ok: true, url: info.cover, bookId: info.bookId, found: info.title };
      }
    }
    // 兼容旧格式
    if (result.books && result.books.length && result.books[0].cover) {
      return { ok: true, url: result.books[0].cover };
    }
    return { ok: false, reason: "no cover in response", rawKeys: Object.keys(result).slice(0, 10) };
  } catch (e) {
    return { ok: false, reason: e.message.slice(0, 100) };
  }
}

async function main() {
  const covers = {};
  const failed = [];

  for (let i = 0; i < BOOK_LIST.length; i++) {
    const b = BOOK_LIST[i];
    process.stdout.write(`[${String(i + 1).padStart(3)}/${BOOK_LIST.length}] ${b.title} ... `);

    const result = await fetchCover(b.title);
    if (result.ok) {
      covers[b.title] = result.url;
      console.log(`✅ → ${result.found || ""}`);
    } else {
      console.log(`❌ ${result.reason}`);
      failed.push({ title: b.title, reason: result.reason });
    }

    // 每 8 本暂停防限流
    if ((i + 1) % 8 === 0 && i < BOOK_LIST.length - 1) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  console.log("\n========== 结果 ==========");
  console.log(`成功: ${Object.keys(covers).length} / ${BOOK_LIST.length}`);

  if (failed.length > 0) {
    console.log("\n失败列表:");
    failed.forEach((f) => console.log(`  ❌ ${f.title}: ${f.reason}`));
  }

  // 保存 covers.json
  writeFileSync("./covers.json", JSON.stringify(covers, null, 2));
  console.log("\n✅ covers.json 已保存");

  // 输出带 cover 字段的 books.js
  const enriched = BOOK_LIST.map((b) => ({
    ...b,
    cover: covers[b.title] || null,
  }));
  const outputJs = "// 精选书单数据（130本 · 含真实封面 · auto-generated）\nwindow.BOOK_LIST = " + JSON.stringify(enriched) + ";\n";
  writeFileSync("./js/books.js", outputJs);
  console.log("✅ js/books.js 已更新（含 cover 字段）");
}

main().catch(console.error);
