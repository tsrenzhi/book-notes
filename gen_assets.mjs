// 下载所有书封面到本地 + 生成每本书的二维码（供分享卡使用）
// 解决前端 canvas 跨域死结：封面/二维码全部落地为同域静态资源
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WS = '/Users/zhenghui/.workbuddy/binaries/node/workspace/node_modules';
const QRCode = (await import(pathToFileURL(path.join(WS, 'qrcode/lib/index.js')).href)).default;

// 加载 books.js（它给 window.BOOK_LIST 赋值）
global.window = {};
await import(pathToFileURL(path.join(__dirname, 'js/books.js')).href);
const list = global.window.BOOK_LIST;
if (!Array.isArray(list)) { console.error('BOOK_LIST not found'); process.exit(1); }

const SITE = 'https://tsrenzhi.github.io/book-notes/';
fs.mkdirSync(path.join(__dirname, 'assets/covers'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'assets/qr'), { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function downloadCover(i, url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 500) return false; // 太小的图跳过
    fs.writeFileSync(path.join(__dirname, `assets/covers/${i}.jpg`), buf);
    return true;
  } catch (e) { return false; }
}

let okCover = 0;
for (let i = 0; i < list.length; i++) {
  const b = list[i];
  if (b.cover && /^https?:/i.test(b.cover)) {
    const ok = await downloadCover(i, b.cover);
    if (ok) okCover++;
    else console.log(`  cover miss ${i} ${b.title}`);
  }
  // 二维码指向该书详情页
  const url = `${SITE}#/blbook/${i}`;
  await QRCode.toFile(path.join(__dirname, `assets/qr/${i}.png`), url, { width: 360, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } });
  if (i % 20 === 0) console.log(`progress ${i}/${list.length}`);
  await sleep(30);
}
console.log(`DONE. covers saved: ${okCover}/${list.length}, qr: ${list.length}`);
