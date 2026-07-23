#!/usr/bin/env node
/**
 * 补全 130 本精选书单的「重点清单」（微信读书全站热门划线）。
 * 数据源：https://weread.qq.com/web/book/bestBookmarks?bookId= （无需登录）
 * bookId 获取：优先用本地 data_weread_raw.json，缺则走 weread 搜索页解析。
 * 输出：覆盖式重写 js/hot_marks.js，保留已有条目 + 追加缺失条目。
 */
import fs from "node:fs";
import https from "node:https";

const ROOT = new URL(".", import.meta.url).pathname;

// ---- 强归一化（与 app.js normTitle 保持一致）----
function normTitle(s) {
  return String(s).toLowerCase()
    .replace(/[《》<>()（）·，。、\-_:：·!！?？"'""'’]/g, "")
    .replace(/\s+/g, "");
}

// ---- 载入现有数据 ----
global.window = {};
eval(fs.readFileSync(ROOT + "js/books.js", "utf8"));
eval(fs.readFileSync(ROOT + "js/hot_marks.js", "utf8"));
const BL = global.window.BOOK_LIST;
const HM = global.window.HOT_MARKS;
const raw = JSON.parse(fs.readFileSync(ROOT + "data_weread_raw.json", "utf8"));

// 原始导出：归一化标题 -> bookId
const rawMap = {};
raw.forEach((b) => {
  const n = normTitle(b.title);
  if (n && !rawMap[n]) rawMap[n] = b.id;
});

// 现有已匹配的书（强归一化）
const matchedTitles = new Set();
HM.forEach((h) => {
  [h.userTitle, h.foundTitle].filter(Boolean).forEach((t) => matchedTitles.add(normTitle(t)));
});
function hasData(title) {
  const t = normTitle(title);
  return HM.some((h) => {
    const cs = [h.userTitle, h.foundTitle].filter(Boolean).map(normTitle);
    return cs.some((c) => c && (c === t || t.includes(c) || c.includes(t))) && h.marks && h.marks.length;
  });
}

// ---- HTTP 工具 ----
function get(u, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(u, { headers: { "User-Agent": "Mozilla/5.0", Referer: "https://weread.qq.com/" } }, (r) => {
      let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => resolve({ code: r.statusCode, body: d }));
    });
    req.on("error", reject);
    req.setTimeout(timeout, () => req.destroy(new Error("timeout")));
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 搜索页解析 bookId（第一个最相关结果）
const searchCache = {};
async function searchBookId(keyword) {
  if (searchCache[keyword] !== undefined) return searchCache[keyword];
  const k = encodeURIComponent(keyword);
  try {
    const r = await get(`https://weread.qq.com/web/search/books?keyword=${k}`);
    const pairs = [...r.body.matchAll(/"bookId":"(\d+)"(?:[^}]{0,300}?)"title":"((?:[^"\\]|\\.)*)"/g)];
    let best = null;
    const nk = normTitle(keyword);
    for (const p of pairs) {
      const id = p[1]; const title = p[2].replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
      const nt = normTitle(title);
      if (nt && (nt.includes(nk) || nk.includes(nt))) { best = id; break; }
    }
    if (!best && pairs[0]) best = pairs[0][1];
    searchCache[keyword] = best;
    return best;
  } catch (e) {
    searchCache[keyword] = null;
    return null;
  }
}

// 拉取热门划线 top5
async function fetchBestMarks(bookId) {
  try {
    const r = await get(`https://weread.qq.com/web/book/bestBookmarks?bookId=${bookId}`);
    const j = JSON.parse(r.body);
    const items = (j.bestBookMarks && j.bestBookMarks.items) || [];
    const marks = items
      .filter((it) => it.markText && it.markText.trim())
      .map((it) => ({ text: it.markText.trim(), count: Number(it.totalCount) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return marks;
  } catch (e) {
    return [];
  }
}

// ---- 主流程 ----
const missing = BL.map((b, i) => ({ b, i })).filter(({ b }) => !hasData(b.title));
console.log(`书单总数 ${BL.length}，已有数据 ${BL.length - missing.length}，待补全 ${missing.length}`);

const newEntries = [];
const failed = [];
let done = 0;

for (const { b, i } of missing) {
  const inner = b.title.replace(/[《》]/g, "");
  let bookId = rawMap[normTitle(b.title)] || null;
  if (!bookId) bookId = await searchBookId(inner);
  if (!bookId) { failed.push({ i, title: b.title, reason: "no bookId" }); console.log(`  ✗ [${i}] ${b.title} 找不到 bookId`); continue; }
  const marks = await fetchBestMarks(bookId);
  if (!marks.length) { failed.push({ i, title: b.title, reason: "no marks" }); console.log(`  ✗ [${i}] ${b.title} 无热门划线`); continue; }
  newEntries.push({ userTitle: inner, bookId: String(bookId), foundTitle: "", marks });
  done++;
  if (done % 10 === 0) console.log(`  …已处理 ${done}/${missing.length}`);
  await sleep(50);
}

// 合并：保留原条目 + 新条目
const merged = HM.concat(newEntries);

const out = `/* ============================================================
 * 热门划线（重点清单）数据层
 * 来源：微信读书全站热门划线 bestBookmarks（真实划线人数 count）
 * 字段：userTitle 书名关键字 / bookId / marks[{text,count}]
 * 由 fetch_hotmarks.mjs 自动补全，也可手动维护。
 * ============================================================ */

window.HOT_MARKS = ${JSON.stringify(merged, null, 2)};
`;
fs.writeFileSync(ROOT + "js/hot_marks.js", out);

console.log(`\n✅ 新增 ${newEntries.length} 本，总计 ${merged.length} 条。`);
console.log(`⚠️ 失败 ${failed.length} 本：`, failed.map((f) => `${f.i}:${f.title}(${f.reason})`).join("、") || "无");
