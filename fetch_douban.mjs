/* 批量抓取豆瓣评分 / 评价人数 / 简介 / 出版信息
 * 用法: node fetch_douban.mjs
 * 接口: 豆瓣移动端 rexxar 搜索 API（一次返回评分+简介，JSON）
 * 按书名索引写入 js/douban.js；已存在的条目会被保留（不覆盖）。
 */
import fs from 'fs';

const UA = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  'Referer': 'https://m.douban.com/',
  'Accept-Language': 'zh-CN,zh;q=0.9'
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchBook(title) {
  const u = 'https://m.douban.com/rexxar/api/v2/search?type=book&q=' + encodeURIComponent(title) + '&count=5';
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(u, { headers: UA, signal: ctrl.signal });
      if (r.status === 200) {
        const j = await r.json();
        const subs = j.subjects || [];
        if (subs.length) return subs[0];
      } else if (r.status === 403) {
        await sleep(2500); // 触发限流，退避后重试
      }
    } catch (e) { /* ignore */ }
    finally { clearTimeout(timer); }
    await sleep(700);
  }
  return null;
}

// 载入书单
const bcode = fs.readFileSync('js/books.js', 'utf8');
const win = {};
new Function('window', bcode)(win);
const list = win.BOOK_LIST || [];

// 载入已有数据（保留 curated 条目）
let seed = {};
if (fs.existsSync('js/douban.js')) {
  const dc = fs.readFileSync('js/douban.js', 'utf8');
  const m = dc.match(/window\.BOOK_DOUBAN\s*=\s*(\{[\s\S]*?\})\s*;?\s*$/);
  if (m) { try { seed = eval('(' + m[1] + ')'); } catch (e) {} }
}
const result = { ...seed };

function writeOut() {
  const lines = Object.entries(result).map(([k, v]) => {
    const o = { ...v };
    if (o.publisher === undefined) delete o.publisher;
    if (o.year === undefined) delete o.year;
    return '  ' + JSON.stringify(k) + ': ' + JSON.stringify(o);
  });
  const out = '/* 豆瓣书籍数据（评分 / 评价人数 / 简介 / 出版信息）\n' +
    ' * 由 fetch_douban.mjs 批量抓取，按书名索引。\n' +
    ' * 介绍为豆瓣「内容简介」精简版，保持短小，制造阅读缺口而非剧透。\n' +
    ' */\n' +
    'window.BOOK_DOUBAN = {\n' + lines.join(',\n') + '\n};\n';
  fs.writeFileSync('js/douban.js', out);
}

const todo = list.filter((b) => b.title && !result[b.title]);
console.log(`总书 ${list.length} 本，已有 ${Object.keys(seed).length} 本，待抓 ${todo.length} 本`);

let done = 0, ok = 0;
for (const b of todo) {
  const s = await searchBook(b.title);
  if (s && s.rating && s.rating.average != null) {
    let intro = (s.summary || '').replace(/\s+/g, ' ').trim();
    if (intro.length > 150) intro = intro.slice(0, 150) + '…';
    const pub = (s.publisher || (s.pub_info || '')).toString().split('/')[0].trim();
    result[b.title] = {
      rating: s.rating.average,
      votes: s.rating.numRatings || 0,
      subjectId: String(s.id),
      publisher: pub || undefined,
      year: (s.pubdate || '').toString().slice(0, 4) || undefined,
      intro
    };
    ok++;
    console.log(`✓ ${b.title} → ${s.rating.average} (${s.rating.numRatings}人)`);
  } else {
    console.log(`✗ ${b.title} 未匹配`);
  }
  done++;
  if (done % 15 === 0) writeOut();
  await sleep(600);
}

writeOut();
console.log(`完成。成功 ${ok} 本，共写入 ${Object.keys(result).length} 本。`);
