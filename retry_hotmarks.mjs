#!/usr/bin/env node
/** 抢救 fetch 阶段 0 数据的 11 本书：改用搜索 bookId，并尝试多个候选版本。 */
import fs from "node:fs";
import https from "node:https";
const ROOT = new URL(".", import.meta.url).pathname;
function normTitle(s){return String(s).toLowerCase().replace(/[《》<>()（）·，。、\-_:：·!！?？"'""'’]/g,"").replace(/\s+/g,"");}
global.window={};eval(fs.readFileSync(ROOT+"js/hot_marks.js","utf8"));
const HM=global.window.HOT_MARKS;
function get(u){return new Promise((res,rej)=>{const req=https.get(u,{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://weread.qq.com/"}},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res({code:r.statusCode,body:d}));});req.on("error",rej);req.setTimeout(15000,()=>req.destroy(new Error("timeout")));});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function searchPairs(kw){const k=encodeURIComponent(kw);const r=await get(`https://weread.qq.com/web/search/books?keyword=${k}`);return [...r.body.matchAll(/"bookId":"(\d+)"(?:[^}]{0,300}?)"title":"((?:[^"\\]|\\.)*)"/g)].map(p=>({id:p[1],title:p[2].replace(/\\u([0-9a-fA-F]{4})/g,(_,h)=>String.fromCharCode(parseInt(h,16)))}));}
async function bestMarks(id){try{const r=await get(`https://weread.qq.com/web/book/bestBookmarks?bookId=${id}`);const j=JSON.parse(r.body);const items=(j.bestBookMarks&&j.bestBookMarks.items)||[];return items.filter(it=>it.markText&&it.markText.trim()).map(it=>({text:it.markText.trim(),count:Number(it.totalCount)||0})).sort((a,b)=>b.count-a.count).slice(0,5);}catch(e){return[];}}

const titles=["如何阅读一本书","异类","慢生产力","非暴力沟通","财富的本质","小岛经济学","认识商业","免费：商业的未来","谁说大象不能跳舞","理解未来的 7 个原则","一头想要被吃掉的猪"];
let added=0,updated=0;
for(const t of titles){
  const inner=t.replace(/[《》]/g,"");
  const nk=normTitle(t);
  const pairs=await searchPairs(inner);
  let marks=null,usedId=null;
  for(const p of pairs.slice(0,6)){ // 试前 6 个候选版本
    const m=await bestMarks(p.id);
    if(m.length){marks=m;usedId=p.id;break;}
    await sleep(40);
  }
  if(!marks||!marks.length){console.log(`  ✗ ${t} 仍无数据`);continue;}
  const ex=HM.find(h=>normTitle(h.userTitle)===nk);
  if(ex){ex.bookId=String(usedId);ex.marks=marks;updated++;}
  else HM.push({userTitle:inner,bookId:String(usedId),foundTitle:"",marks});added++;
  console.log(`  ✓ ${t} -> id=${usedId} marks=${marks.length}`);
  await sleep(40);
}
const out=`/* ============================================================
 * 热门划线（重点清单）数据层
 * 来源：微信读书全站热门划线 bestBookmarks（真实划线人数 count）
 * 字段：userTitle 书名关键字 / bookId / marks[{text,count}]
 * 由 fetch_hotmarks.mjs 自动补全，也可手动维护。
 * ============================================================ */

window.HOT_MARKS = ${JSON.stringify(HM,null,2)};
`;
fs.writeFileSync(ROOT+"js/hot_marks.js",out);
console.log(`\n✅ 本次新增 ${added}，更新 ${updated}。总计 ${HM.length} 条。`);
