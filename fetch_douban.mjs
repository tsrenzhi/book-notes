/**
 * 批量抓取豆瓣图书评分
 * 对 130 本书逐一查询，写入 douban.js
 * 用豆瓣 suggest API + 详情页 fallback
 */
import { readFileSync, writeFileSync } from 'fs';

// 提取书单
const booksCode = readFileSync('js/books.js', 'utf8');
const match = booksCode.match(/window\.BOOK_LIST\s*=\s*(\[[\s\S]*\]);?\s*$/);
const BOOK_LIST = JSON.parse(match[1]);

// 已有数据（跳过）
const existingCode = readFileSync('js/douban.js', 'utf8');
const existingMatch = existingCode.match(/window\.BOOK_DOUBAN\s*=\s*(\{[\s\S]*\});?\s*$/);
const EXISTING = existingMatch ? JSON.parse(existingMatch[1]) : {};

console.log(`总书数: ${BOOK_LIST.length}, 已有豆瓣数据: ${Object.keys(EXISTING).length}`);

// 去掉书名号用于搜索
function cleanTitle(t) {
  return t.replace(/^《|》$/g, '').trim();
}

// 豆瓣 suggest API（轻量，返回基础信息）
async function suggest(query) {
  const url = `https://book.douban.com/j/subject_suggest?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': 'https://book.douban.com/',
      'Accept': 'application/json'
    }
  }).catch(() => null);
  if (!res || !res.ok) return [];
  try {
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

// 豆瓣详情页抓取（获取完整信息：简介、出版社、年份）
async function fetchDetail(subjectId) {
  const url = `https://book.douban.com/subject/${subjectId}/`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html'
    }
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const html = await res.text();
  
  // 提取评分
  const ratingMatch = html.match(/<strong class="ll rating_num"[^>]*>([\d.]+)<\/strong>/);
  // 评价人数
  const votesMatch = html.match(/<span property="v:votes">(\d+)<\/span>/);
  // 出版社 + 年份
  const pubMatch = html.match(/<span class="pl">出版社:<\/span>\s*([\w\s·\-&;()（）]+)/);
  const yearMatch = html.match(/<span class="pl">出版年:<\/span>\s*([\d\-?]+)/);
  // 简介
  const introMatch = html.match(/<div id="link-report"[^>]*>[\s\S]*?<div class="intro">[\s\S]*?<p>([\s\S]*?)<\/p>/);
  
  return {
    rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
    votes: votesMatch ? parseInt(votesMatch[1], 10) : null,
    publisher: pubMatch ? pubMatch[1].trim() : '',
    year: yearMatch ? yearMatch[1].trim() : '',
    intro: introMatch ? introMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 200) : ''
  };
}

// 主逻辑
const results = {};
let success = 0;
let skip = 0;
let fail = 0;

for (let i = 0; i < BOOK_LIST.length; i++) {
  const b = BOOK_LIST[i];
  const title = b.title;
  
  // 跳过已有
  if (EXISTING[title]) {
    results[title] = EXISTING[title];
    skip++;
    console.log(`[${i+1}/${BOOK_LIST.length}] ⏭️ ${title} (已有)`);
    continue;
  }
  
  // 搜索
  const q = cleanTitle(title);
  const suggestions = await suggest(q);
  
  if (suggestions.length === 0) {
    fail++;
    console.log(`[${i+1}/${BOOK_LIST.length}] ❌ ${title} → 无结果`);
    continue;
  }
  
  // 取第一个最佳匹配
  const best = suggestions[0];
  const sid = best.id || best.subject_id || best.url?.match(/(\d+)/)?.[1];
  
  if (!sid || !best.rating) {
    fail++;
    console.log(`[${i+1}/${BOOK_LIST.length}] ❌ ${title} → 有结果但缺评分`);
    continue;
  }
  
  results[title] = {
    rating: parseFloat(best.rating),
    votes: parseInt(best.num_raters || best.votes || '0', 10),
    subjectId: String(sid),
    publisher: best.publisher_name || '',
    year: best.year || best.pubdate || '',
    intro: (best.short_intro || '').substring(0, 200)
  };
  success++;
  console.log(`[${i+1}/${BOOK_LIST.length}] ✅ ${title} ★${best.rating} (${best.num_raters || best.votes || '?'})`);
  
  // 避免限流
  await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
}

// 合并旧数据
const allData = { ...results, ...EXISTING };

// 输出 JS 文件
const output = `/* 豆瓣书籍数据（评分 / 评价人数 / 简介 / 出版信息）
 * 由 fetch_douban.mjs 批量抓取，按书名索引。
 * 介绍为豆瓣「内容简介」精简版，保持短小，制造阅读缺口而非剧透。
 */
window.BOOK_DOUBAN = ${JSON.stringify(allData, null, 2)};
`;

writeFileSync('js/douban.js', output, 'utf8');

console.log('\n====== 完成 ======');
console.log(`成功: ${success}, 跳过(已有): ${skip}, 失败: ${fail}`);
console.log(`总计: ${Object.keys(allData).length}/${BOOK_LIST.length}`);
