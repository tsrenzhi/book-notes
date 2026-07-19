#!/usr/bin/env node
/**
 * 微信读书 → 读书笔记博客 同步脚本
 * ------------------------------------------------------------
 * 用法：
 *   # 从微信读书 API 拉取（需 Key）
 *   WEREAD_API_KEY=wrk-xxxx node sync_weread.mjs
 *   # 用已保存的原始数据 data_weread_raw.json 重新生成（不调接口）
 *   FROM_RAW=1 node sync_weread.mjs
 *
 * 处理规则：
 *   1. 保留全部「想法/点评」（你自己的思考）
 *   2. 每本书额外精选最多 8 条划线精华
 *   3. 按书名自动归类到 9 个分类，并自动打标签
 *   4. 写入 js/data.js
 */

const fs = await import("node:fs");
const GATEWAY = "https://i.weread.qq.com/api/agent/gateway";
const SKILL_VERSION = "1.0.5";
const KEY = process.env.WEREAD_API_KEY;
const FROM_RAW = process.env.FROM_RAW === "1";
if (!FROM_RAW && !KEY) {
  console.error("❌ 缺少 WEREAD_API_KEY，或加 FROM_RAW=1 用本地原始数据。");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(api_name, params = {}) {
  const body = { api_name, skill_version: SKILL_VERSION, ...params };
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.errcode && json.errcode !== 0) throw new Error(`接口 ${api_name} 出错：errcode=${json.errcode} ${json.errmsg || ""}`);
  if (json.upgrade_info) throw new Error(`⚠️ 需要升级技能：${json.upgrade_info.message || JSON.stringify(json.upgrade_info)}`);
  return json;
}

/* ---------- 站点与分类 ---------- */
const SITE = {
  title: "读书笔记",
  subtitle: "把读过的书，变成自己的认知",
  author: "郑辉",
  bio: "自媒体创作者，专注读书分享、个人成长与认知提升。这里沉淀我划下的重点、写下的想法，以及那些真正改变过我的句子。",
  motto: "读书不是为了记住，而是为了成为。",
  contact: { 公众号: "郑辉的读书笔记", 抖音: "@郑辉说书", 邮箱: "hello@example.com" },
};

const CATEGORIES = [
  { id: "growth",     name: "个人成长", desc: "关于如何变得更好一点点", emoji: "🌱" },
  { id: "cognition",  name: "认知思维", desc: "升级看世界的底层操作系统", emoji: "🧠" },
  { id: "psychology", name: "心理情绪", desc: "与自己和解，和情绪共处", emoji: "💭" },
  { id: "wealth",     name: "财富投资", desc: "普通人的财富底层逻辑", emoji: "💰" },
  { id: "philosophy", name: "哲学人生", desc: "关于活着这件事的追问", emoji: "🌌" },
  { id: "literature", name: "文学小说", desc: "故事里的人性与悲欢", emoji: "📖" },
  { id: "history",    name: "历史传记", desc: "在时间与人物里看兴衰", emoji: "🏛️" },
  { id: "business",   name: "商业管理", desc: "产品、运营与组织的方法", emoji: "💼" },
  { id: "science",    name: "科学科普", desc: "用理性理解世界运转", emoji: "🔬" },
];
const catNameOf = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || id;

const categoryCover = {
  growth:     { emoji: "🌱", from: "#f6d365", to: "#fda085" },
  cognition:  { emoji: "🧠", from: "#a1c4fd", to: "#c2e9fb" },
  psychology: { emoji: "💭", from: "#84fab0", to: "#8fd3f4" },
  wealth:     { emoji: "💰", from: "#fbc2eb", to: "#a6c1ee" },
  philosophy: { emoji: "🌌", from: "#ff9a9e", to: "#fecfef" },
  literature: { emoji: "📖", from: "#e9c46a", to: "#e76f51" },
  history:    { emoji: "🏛️", from: "#d4a373", to: "#a47148" },
  business:   { emoji: "💼", from: "#43e97b", to: "#38f9d7" },
  science:    { emoji: "🔬", from: "#4facfe", to: "#00f2fe" },
};

/* ---------- 自动归类：分类 ---------- */
const categoryKeywords = {
  history: ["历史", "史", "传记", "自传", "回忆录", "通鉴", "史记", "春秋", "战国", "王朝", "帝国", "文明史", "战争", "革命", "帝王", "将军", "曾国藩", "毛泽东", "孙中山", "蒋介石", "袁世凯", "邓小平", "李鸿章", "左宗棠", "项羽", "刘邦", "大唐", "明朝", "清朝", "万历", "资治通鉴", "夹缝中的总督", "潜规则", "血酬", "古今", "三国", "秦汉", "大唐", "宋史", "明史", "清史", "拿破仑", "恺撒", "罗斯福", "丘吉尔", "斯大林", "林肯", "华盛顿", "恺撒", "帝王", "将相", "民国", "大唐", "大唐", "大唐", "罗马", "希腊", "埃及", "拜占庭"],
  literature: ["小说", "文学", "文集", "散文", "诗歌", "童话", "寓言", "卡列尼娜", "老人与海", "围城", "活着", "百年孤独", "平凡的世界", "三体", "科幻", "飘", "呼啸", "红与黑", "傲慢", "简爱", "罪与罚", "卡拉马佐夫", "麦田", "1984", "动物农场", "小王子", "故事集", "诺贝尔文学奖", "名著", "诗集", "随笔", "杂文", "鲁迅", "老舍", "余华", "莫言", "卡夫卡", "马尔克斯", "海明威", "狄更斯", "莎士比亚", "戏剧", "剧本", "红楼梦", "三国演义", "水浒传", "西游记", "呐喊", "边城", "骆驼祥子", "白鹿原", "蛙", "丰乳肥臀", "生死疲劳", "檀香刑", "四世同堂", "惶然录", "人间词话", "堂吉诃德", "悲惨世界", "巴黎圣母院", "雾都孤儿", "基督山", "包法利", "安娜", "复活", "战争与和平", "静静的顿河", "追风筝", "解忧", "岛上", "月亮与六便士", "毛姆", "村上春树", "东野圭吾", "悬疑", "侦探", "推理"],
  business: ["管理", "运营", "产品", "营销", "创业", "战略", "商业", "公司", "企业", "经理", "mba", "产品经理", "用户", "增长", "品牌", "销售", "供应链", "组织", "领导力", "执行", "麦肯锡", "咨询", "商业模式", "创新", "竞争", "市场", "电商", "互联网", "平台", "经营", "盈利", "定位", "丰田", "谷歌", "亚马逊", "苹果", "微软", "奈飞", "facebook", "字节", "腾讯", "阿里", "管理实践", "卓有成效", "从零开始做运营", "运营之道", "用户体验", "产品前线", "五项修炼", "带人", "不懂带人"],
  science: ["科学", "物理", "生物", "化学", "宇宙", "进化", "基因", "医学", "天文", "地理", "科普", "量子", "相对论", "达尔文", "物种", "自然", "数学", "统计", "算法", "编程", "代码", "人工智能", "ai", "机器学习", "神经网络", "计算机", "黑客", "硅谷", "科技", "技术", "发明", "疫苗", "病毒", "细菌", "神经", "脑科学", "复杂", "混沌", "熵", "时间简史", "上帝掷骰子", "自私的基因", "人类简史", "未来简史", "今日简史", "枪炮", "细菌", "钢铁", "-origin", "大设计", "宇宙的", "平行宇宙", "黑洞", "微积分", "几何", "概率", "信息论", "控制论", "系统论", "仿生", "材料", "能源", "气候", "环境"],
  wealth: ["财富", "金钱", "投资", "理财", "致富", "财务", "复利", "杠杆", "穷爸爸", "富爸爸", "巴菲特", "查理芒格", "芒格", "股票", "证券", "基金", "房产", "经济", "经济学", "资本", "国富论", "21世纪资本论", "贫穷的本质", "财富哪里来", "财富从哪来", "纳瓦尔", "赚钱", "攒钱", "通胀", "资产", "被动收入", "债", "保险", "黄金", "比特币", "区块链", "金融", "银行", "利率", "估值", "财报", "股息", "分红", "现金流", "财务自由", "巴比伦", "拿铁因素", "一如既往", "富有的习惯", "金钱", "钱"],
  psychology: ["心理", "情绪", "焦虑", "抑郁", "治愈", "亲密", "关系", "勇气", "自卑", "疗愈", "接纳", "爱", "婚姻", "家庭", "亲子", "人性", "社交", "沟通", "敏感", "内耗", "边界", "创伤", "人格", "行为", "非暴力", "共情", "依恋", "原生", "讨好", "完美主义", "社恐", "孤独", "幸福的方法", "积极", "正念", "冥想", "这就是人性", "好的爱", "不抱怨", "被讨厌", "为何家会", "情感", "恋爱", "婆媳", "小孩", "养育"],
  philosophy: ["哲学", "人生", "意义", "活着", "存在", "命运", "生命", "幸福", "死亡", "虚无", "苏格拉底", "尼采", "康德", "道家", "儒家", "佛", "道德经", "论语", "中庸", "大学", "庄子", "禅宗", "沉思", "智慧", "了凡四训", "增广贤文", "鬼谷子", "了凡", "心学", "阳明", "叔本华", "叔本华", "加缪", "萨特", "存在主义", "论语", "国学", "经典", "修身", "齐家", "良知", "格物", "致知", "顿悟", "开悟", "放下", "无常", "轮回", "因果", "禅", "道德经", "传习录", "菜根谭", "围炉夜话", "小窗幽记", "幽梦影"],
  growth: ["成长", "习惯", "自律", "效率", "时间", "行动", "自控", "精进", "拖延", "目标", "自我管理", "早起", "学习力", "终身", "逆商", "情商", "表达力", "写作", "读书", "方法论", "慢生产力", "掌控习惯", "原子习惯", "高效15法则", "如何高效学习", "你一年的8760小时", "成长的边界", "发现天赋", "写作好故事", "刻意练习", "原则", "高效能", "七个习惯", "精力", "专注力", "复盘", "笔记", "记忆", "思维导", "费曼", "番茄", "微习惯", "不抱怨的世界", "被讨厌的勇气", "认知觉醒", "早起的", "晨间", "副业", "斜杠"],
  cognition: ["认知", "思考", "思维", "决策", "心智", "理性", "逻辑", "大脑", "模型", "元认知", "深度", "反脆弱", "黑天鹅", "逆转", "逆向", "强者思维", "心智模型", "系统", "博弈", "策略", "谋略", "孙子兵法", "善战者说", "谋胜全局", "批判性", "表达", "沟通", "复盘", "复杂系统", "第二曲线", "第一性原理", "熵增", "反直觉", "认知偏差", "思考快与慢", "穷查理", "芒格之道", "查理芒格传", "原则", "超越", "洞察", "判断", "推理", "论证", "谬误", "逻辑学", "辩证法", "结构化", "金字塔原理", "麦肯锡教我的思考", "思考武器", "逻辑思维", "逆转思维", "光环效应", "传染", "疯传", "直觉", "潜意识", "认知觉醒", "底層", "底层逻辑", "高手", "格局", "眼界", "见识"],
};
// 平局时优先顺序（越靠前越优先）
const PRIORITY = ["history", "literature", "business", "science", "wealth", "psychology", "philosophy", "growth", "cognition"];

function classify(title = "") {
  const t = (title || "");
  let best = "cognition", bestScore = 0;
  const scores = {};
  for (const [cat, words] of Object.entries(categoryKeywords)) {
    const s = words.reduce((acc, w) => (t.includes(w) ? acc + 1 : acc), 0);
    scores[cat] = s;
    if (s > bestScore) { bestScore = s; best = cat; }
  }
  if (bestScore === 0) return "cognition";
  // 平局取优先级最高的
  const tied = PRIORITY.filter((c) => scores[c] === bestScore);
  return tied[0] || best;
}

/* ---------- 自动归类：标签 ---------- */
const tagKeywords = {
  元认知:   ["元认知", "觉察", "反思", "自省"],
  深度思考: ["深度思考", "想清楚", "独立思考", "批判性"],
  习惯养成: ["习惯", "自律", "坚持", "日更", "微习惯"],
  专注:     ["专注", "心流", "注意力", "沉浸"],
  复利:     ["复利", "积累", "指数", "滚雪球"],
  杠杆:     ["杠杆", "放大", "边际成本"],
  财富自由: ["财富自由", "财务自由", "被动收入", "资产"],
  身份认同: ["身份", "成为", "我是", "定义自己"],
  课题分离: ["课题分离", "边界", "干涉"],
  情绪管理: ["情绪", "焦虑", "愤怒", "平静", "内耗", "松弛"],
  意义感:   ["意义", "活着", "生命", "使命", "热爱"],
  决策:     ["决策", "选择", "判断", "取舍"],
  认知偏差: ["偏差", "误区", "错觉", "偏见", "锚定", "从众"],
  行动力:   ["行动", "执行", "拖延", "去做", "开始"],
  自我接纳: ["接纳", "原谅", "允许", "不完美", "放过"],
  亲密关系: ["亲密", "婚姻", "恋爱", "家庭", "亲子", "原生"],
  战略:     ["战略", "策略", "谋略", "博弈", "竞争"],
  产品运营: ["产品", "运营", "用户", "增长", "品牌", "营销"],
  历史兴衰: ["历史", "王朝", "帝国", "革命", "战争", "文明"],
  文学人性: ["小说", "文学", "人性", "悲欢", "命运"],
  科学思维: ["科学", "进化", "宇宙", "基因", "物理", "数学"],
};

function tagOf(text = "", catName = "") {
  const hits = [];
  for (const [tag, words] of Object.entries(tagKeywords)) {
    if (words.some((w) => (text || "").includes(w))) hits.push(tag);
  }
  if (hits.length === 0) hits.push(catName);
  return [...new Set(hits)].slice(0, 5);
}

const firstLine = (s = "") => (s || "").split(/[\n。]/)[0].trim();
const truncate = (s = "", n = 50) => ((s || "").length > n ? (s || "").slice(0, n) + "…" : (s || ""));
const toDate = (ts) => (ts ? new Date(Number(ts) * 1000).toISOString().slice(0, 10) : "");
const isMark = (n) => (n.content || "").startsWith("> ");

/* ---------- 单本书处理：归类 + 精选 + 打标签 ---------- */
const MAX_MARKS = 8; // 每本书精选划线上限

function processBook(raw) {
  const title = raw.title || "(未知书名)";
  const category = classify(title);
  const catName = catNameOf(category);
  const cover = categoryCover[category];

  const reviews = (raw.notes || []).filter((n) => !isMark(n));
  const marks = (raw.notes || []).filter((n) => isMark(n));

  // 划线按长度挑精华，最多 MAX_MARKS 条
  const keptMarks = marks.slice().sort((a, b) => (b.content || "").length - (a.content || "").length).slice(0, MAX_MARKS);

  const notes = [...reviews, ...keptMarks].map((n) => ({
    id: n.id,
    title: n.title,
    date: n.date,
    tags: tagOf(n.content, catName),
    excerpt: n.excerpt,
    content: n.content,
  }));

  // 按时间倒序
  notes.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const summary = reviews[0]?.excerpt || marks[0]?.excerpt || `${title}的读书笔记整理。`;

  return {
    id: raw.id,
    title,
    subtitle: raw.subtitle || "",
    author: (raw.author && raw.author !== "微信读书用户") ? raw.author : "佚名",
    category,
    cover,
    rating: raw.rating || 5,
    status: raw.status || "在读",
    finishedAt: raw.finishedAt || "",
    tags: [...new Set([catName, ...tagOf(title, catName)])].slice(0, 6),
    summary,
    notes,
  };
}

/* ---------- 拉取（API 模式） ---------- */
async function fetchAll() {
  const raw = [];
  let lastSort = undefined, page = 0;
  while (true) {
    page++;
    const params = { count: 100, ...(lastSort ? { lastSort } : {}) };
    const data = await call("/user/notebooks", params);
    for (const b of data.books || []) {
      const info = b.book || {};
      const bookId = b.bookId;
      const title = info.title || "(未知书名)";
      console.log(`  · 拉取 ${title}`);
      const marks = await call("/book/bookmarklist", { bookId });
      const markNotes = (marks.updated || []).map((m) => {
        const text = m.markText || "";
        return { id: "mk_" + (m.bookmarkId || Math.random().toString(36).slice(2)), title: truncate(text, 24), date: toDate(m.createTime), tags: [], excerpt: truncate(text, 50), content: `> ${text}\n` };
      });
      const reviewNotes = [];
      let synckey = 0;
      while (true) {
        const rd = await call("/review/list/mine", { bookid: bookId, synckey, count: 20 });
        for (const item of rd.reviews || []) {
          const rv = item.review || {};
          const text = rv.content || "";
          if (!text.trim()) continue;
          const chapter = rv.chapterName ? `【${rv.chapterName}】` : "";
          reviewNotes.push({ id: "rv_" + (rv.reviewId || Math.random().toString(36).slice(2)), title: truncate(firstLine(text), 24), date: toDate(rv.createTime), tags: [], excerpt: truncate(text, 50), content: chapter ? `**${chapter}**\n\n${text}` : text });
        }
        if (!rd.hasMore || rd.hasMore !== 1) break;
        synckey = rd.synckey; if (!synckey) break;
        await sleep(80);
      }
      raw.push({ id: bookId, title, subtitle: info.subtitle || info.intro || "", author: info.author || "佚名", status: b.markedStatus === 1 ? "读完" : "在读", notes: [...markNotes, ...reviewNotes] });
      await sleep(120);
    }
    if (!data.hasMore || data.hasMore !== 1) break;
    lastSort = (data.books || [])[((data.books || []).length) - 1]?.sort;
    if (!lastSort) break;
  }
  return raw;
}

/* ---------- 主流程 ---------- */
async function main() {
  let raw;
  if (FROM_RAW) {
    console.log("📦 从本地原始数据重建（不调接口）…");
    const p = new URL("./data_weread_raw.json", import.meta.url).pathname;
    raw = JSON.parse(fs.readFileSync(p, "utf8"));
  } else {
    console.log("📚 从微信读书 API 拉取…");
    raw = await fetchAll();
    fs.writeFileSync(new URL("./data_weread_raw.json", import.meta.url).pathname, JSON.stringify(raw, null, 2));
    console.log("📦 原始数据已备份：data_weread_raw.json");
  }

  const booksOut = raw.map(processBook);

  const out = `/* ============================================================
 * 读书笔记博客 - 数据层（由 sync_weread.mjs 自动生成）
 * 生成时间：${new Date().toISOString()}
 * 规则：保留全部想法/点评 + 每本书精选最多 ${MAX_MARKS} 条划线，自动归类与打标签。
 * 修改：直接编辑本文件，或重跑脚本（FROM_RAW=1 可离线重建）。
 * ============================================================ */

const SITE = ${JSON.stringify(SITE, null, 2)};

const CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};

const BOOKS = ${JSON.stringify(booksOut, null, 2)};
`;

  const outPath = new URL("./js/data.js", import.meta.url).pathname;
  fs.writeFileSync(outPath, out);

  const totalNotes = booksOut.reduce((s, b) => s + b.notes.length, 0);
  const catCount = {};
  booksOut.forEach((b) => (catCount[b.category] = (catCount[b.category] || 0) + 1));
  console.log(`\n✅ 完成！${booksOut.length} 本书，共 ${totalNotes} 条笔记（精选后）。`);
  console.log("📊 分类分布：", JSON.stringify(catCount));
  console.log("📝 已写入 js/data.js");
}

main().catch((e) => { console.error("\n❌ 失败：", e.message); process.exit(1); });
