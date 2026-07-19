// 生成全站 OG 默认分享卡 assets/og-cover.png（1200x630）
// 解决微信分享"裸链接"问题：粘贴链接即出带图卡片
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('/Users/zhenghui/.workbuddy/binaries/node/workspace/node_modules/sharp');
const QRCode = require('/Users/zhenghui/.workbuddy/binaries/node/workspace/node_modules/qrcode');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://tsrenzhi.github.io/book-notes/';

// 站点首页二维码
const qrBuf = await QRCode.toBuffer(SITE, { width: 400, margin: 2, color: { dark: '#1f1f1f', light: '#ffffff' } });

const F = "'PingFang SC','Microsoft YaHei',sans-serif";
const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbfaf8"/>
      <stop offset="1" stop-color="#efece6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="92" cy="98" r="36" fill="#1f1f1f"/>
  <text x="92" y="98" font-family="${F}" font-size="38" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">知</text>
  <text x="148" y="88" font-family="${F}" font-size="42" font-weight="700" fill="#1f1f1f">认知无穷大</text>
  <text x="150" y="124" font-family="${F}" font-size="22" fill="#8a857c">读书 · 成长 · 认知升级</text>
  <text x="92" y="300" font-family="${F}" font-size="56" font-weight="700" fill="#1f1f1f">把读过的书，</text>
  <text x="92" y="372" font-family="${F}" font-size="56" font-weight="700" fill="#1f1f1f">变成走得通的路</text>
  <text x="94" y="430" font-family="${F}" font-size="26" fill="#8a857c">130 本精选书单 · 每本附深度解读与分享卡</text>
  <text x="94" y="560" font-family="${F}" font-size="22" fill="#b3ada3">tsrenzhi.github.io/book-notes</text>
</svg>`;

const bg = await sharp(Buffer.from(svg)).png().toBuffer();
await sharp(bg)
  .composite([{ input: qrBuf, left: 1200 - 60 - 360, top: 630 - 60 - 360 }])
  .png()
  .toFile(path.join(__dirname, 'assets/og-cover.png'));
console.log('og-cover.png generated');
