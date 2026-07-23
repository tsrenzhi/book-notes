const fs = require("fs");
global.window = {};
eval(fs.readFileSync("js/books.js", "utf8"));
eval(fs.readFileSync("js/hot_marks.js", "utf8"));
const BL = global.window.BOOK_LIST, HM = global.window.HOT_MARKS;
function normTitle(s) {
  return String(s).toLowerCase()
    .replace(/[《》<>()（）·，。、\-_:：·!！?？"'’~～]/g, "")
    .replace(/\s+/g, "");
}
// 1. check 穿越寒冬 specifically
const target = BL.find(b => b.title.includes("穿越寒冬"));
console.log("=== TARGET: 穿越寒冬 ===");
if (target) {
  console.log("  BOOK_LIST index:", BL.indexOf(target));
  console.log("  title:", target.title);
  console.log("  normTitle:", normTitle(target.title));
  // search all HM entries that partially match
  const t = normTitle(target.title);
  HM.forEach((h, idx) => {
    const cs = [h.userTitle, h.foundTitle].filter(Boolean).map(normTitle);
    cs.forEach(c => {
      const score = c.includes(t) || t.includes(c);
      if (score || c.length < 6) console.log(`  HM#${idx} userTitle="${h.userTitle}" foundTitle="${h.foundTitle}" -> norm="${c}" includes=${c.includes(t)} rev=${t.includes(c)}`);
    });
  });
}

// 2. FULL AUDIT: which books actually get marks on live site logic
console.log("\n=== FULL AUDIT (live app.js exact-match logic) ===");
let hit = [], miss = [];
BL.forEach((b, i) => {
  const t = normTitle(b.title);
  const hm = HM.find(h => {
    const cs = [h.userTitle, h.foundTitle].filter(Boolean).map(normTitle);
    return cs.some(c => c && c === t);
  });
  if (hm && hm.marks && hm.marks.length) hit.push({ i, title: b.title, hmUserTitle: hm.userTitle, nMarks: hm.marks.length });
  else miss.push({ i, title: b.title });
});
console.log("HIT (有重点清单):", hit.length);
console.log("MISS (无重点清单):", miss.length);
console.log("\n--- MISS LIST ---");
miss.forEach(m => console.log(`  [${m.i}] ${m.title}`));
console.log("\n--- HIT LIST (first 20) ---");
hit.slice(0, 20).forEach(h => console.log(`  [${h.i}] ${h.title} <- HM.userTitle="${h.hmUserTitle}" (${h.nMarks}marks)`));
