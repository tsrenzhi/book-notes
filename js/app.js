/* ============================================================
   认知无穷大 · 应用逻辑（hash 路由 SPA）
   路由表：
     #/                首页
     #/booklist        精选书单（来自飞书书单库）
     #/blbook/:id      单本书详情（推荐语+公众号+笔记+热门划线）
     #/about           关于
   ============================================================ */

const app = document.getElementById("app");

/* ---------- 数据工具 ---------- */
const allNotes = () =>
  BOOKS.flatMap((b) => b.notes.map((n) => ({ ...n, book: b })));

const getBook = (id) => BOOKS.find((b) => b.id === id);
const getNote = (id) => allNotes().find((n) => n.id === id);
const getCategory = (id) => CATEGORIES.find((c) => c.id === id);
const booksOfCategory = (id) => BOOKS.filter((b) => b.category === id);

function allTags() {
  // 以笔记标签统计标签热度（出现次数）
  const counts = {};
  allNotes().forEach((n) => (n.tags || []).forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function notesOfTag(tag) {
  return allNotes().filter((n) => (n.tags || []).includes(tag));
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const stars = (n) => "★★★★★☆☆☆☆☆".slice(5 - n, 10 - n);

const fmtDate = (d) => (d ? d.replace(/-/g, ".") : "—");

const coverStyle = (b) => `background:linear-gradient(135deg, ${b.cover.from}, ${b.cover.to});`;

/* 笔记类型：划线（书里原文引用）vs 想法（你自己写的批注） */
const isMarkNote = (n) => (n.content || "").startsWith("> ");
const noteTypeLabel = (n) => (isMarkNote(n) ? "划重点" : "我的想法");
const noteBadge = (n) =>
  `<span class="note-badge ${isMarkNote(n) ? "nb-mark" : "nb-idea"}">${noteTypeLabel(n)}</span>`;

/* 笔记展示排序：你的想法排最前，其次划线，各自按时间倒序 */
function sortNotesForDisplay(notes) {
  const idea = notes.filter((n) => !isMarkNote(n)).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const mark = notes.filter((n) => isMarkNote(n)).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return [...idea, ...mark];
}

/* ---------- 分页「加载更多」 ----------
 * gridEl: 网格/列表容器；pagerEl: 放置按钮的容器
 * itemsHtml: 每项 HTML 字符串数组；step: 每次加载条数
 */
function mountPaged(gridEl, pagerEl, itemsHtml, step) {
  if (!gridEl) return;
  gridEl.innerHTML = ""; // 清空旧内容，防止分类切换时叠加
  if (!itemsHtml.length) { if (pagerEl) pagerEl.innerHTML = ""; return; }
  let shown = 0;
  const load = () => {
    const next = Math.min(shown + step, itemsHtml.length);
    gridEl.insertAdjacentHTML("beforeend", itemsHtml.slice(shown, next).join(""));
    shown = next;
    if (pagerEl) {
      if (shown >= itemsHtml.length) pagerEl.innerHTML = "";
      else {
        pagerEl.innerHTML = `<button class="load-more">加载更多（还有 ${itemsHtml.length - shown} 条）</button>`;
        pagerEl.querySelector(".load-more").onclick = load;
      }
    }
  };
  load();
}

/* ---------- 组件片段 ---------- */
function bookCard(b) {
  const empty = b.notes.length === 0;
  return `
    <article class="book-card ${empty ? "book-empty" : ""}" onclick="location.hash='#/book/${b.id}'">
      <div class="book-cover" style="${coverStyle(b)}">
        <span class="bc-status">${b.status}</span>
        ${empty ? `<span class="bc-flag">未做笔记</span>` : ""}
        <span class="bc-emoji">${b.cover.emoji}</span>
        <span class="bc-meta">
          <span class="bc-title">${esc(b.title)}</span>
          <span class="bc-author">${esc(b.author)}</span>
        </span>
      </div>
      <div class="book-body">
        <p class="book-summary">${esc(b.summary)}</p>
        <div class="book-foot">
          <span class="stars">${stars(b.rating)}</span>
          <span class="note-count">${empty ? "未做笔记" : b.notes.length + " 条笔记"}</span>
        </div>
      </div>
    </article>`;
}

function noteItem(n) {
  return `
    <article class="note-item" onclick="location.hash='#/note/${n.id}'">
      <div class="ni-book" style="${coverStyle(n.book)}">${n.book.cover.emoji}</div>
      <div class="ni-main">
        <h3 class="ni-title">${noteBadge(n)}${esc(n.title)}</h3>
        <p class="ni-excerpt">${esc(n.excerpt)}</p>
        <div class="ni-meta">
          <span class="from-book">《${esc(n.book.title)}》</span>
          <span>${fmtDate(n.date)}</span>
          <span>${(n.tags || []).map((t) => "#" + esc(t)).join("  ")}</span>
        </div>
      </div>
    </article>`;
}

/* ============================================================
   各页面视图
   ============================================================ */

function viewHome() {
  const notes = allNotes().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const recent = notes.slice(0, 4);
  const totalNotes = notes.length;
  const listCount = typeof BOOK_LIST !== "undefined" ? BOOK_LIST.length : 0;

  return `
  <section class="hero wrap fade-in">
    <div class="hero-inner">
      <span class="hero-eyebrow">读书 · 成长 · 认知</span>
      <h1>把读过的书，<br/>沉淀成<span class="hl">自己的认知</span></h1>
      <p class="lead">${esc(SITE.bio)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#/booklist">逛精选书单 →</a>
      </div>
    </div>
  </section>

  <section class="home-bl-section">
    <div class="section-head" style="margin-bottom:36px">
      <span class="eyebrow">Book List</span>
      <h2>精选书单</h2>
      <p style="margin:10px auto 0">${listCount} 本精选好书，按主题分类，每本附一句推荐理由。</p>
    </div>
    <div class="bl-grid stagger" id="homeBlGrid"></div>
  </section>`;

  // 供 initHome 分页使用：首页展示精选书单预览
  _homeBlHtml = (typeof BOOK_LIST !== "undefined" ? BOOK_LIST.slice(0, 6) : []).map((b, i) => bookListItem(b, i));
}

let _homeBlHtml = [];
function initHome() {
  const grid = document.getElementById("homeBlGrid");
  if (grid && _homeBlHtml.length) {
    grid.innerHTML = _homeBlHtml.join("");
  }
}

function viewBooks() {
  const cats = [["all", "全部"]].concat(CATEGORIES.map((c) => [c.id, c.emoji + " " + c.name]));
  return `
  <section class="section wrap fade-in">
    <div class="section-head">
      <span class="eyebrow">Reading List</span>
      <h2>精选书单</h2>
      <p>共 ${BOOKS.length} 本书 · ${allNotes().length} 条笔记，点分类筛选。</p>
    </div>
    <div class="filter-bar" id="catFilter">
      ${cats
        .map(
          ([id, label]) =>
            `<span class="chip ${id === "all" ? "active" : ""}" data-cat="${id}">${esc(label)}</span>`
        )
        .join("")}
    </div>
    <div class="book-grid stagger" id="bookGrid"></div>
    <div class="pager-wrap" id="bookPager"></div>
  </section>`;
}

function bindBookFilter() {
  const bar = document.getElementById("catFilter");
  const grid = document.getElementById("bookGrid");
  const pager = document.getElementById("bookPager");
  if (!bar || !grid) return;
  bar.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    bar.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    const cat = chip.dataset.cat;
    const list = cat === "all" ? BOOKS : booksOfCategory(cat);
    grid.innerHTML = "";
    mountPaged(grid, pager, list.map(bookCard), 24);
  });
}

function initBooks() {
  const bar = document.getElementById("catFilter");
  const active = bar ? bar.querySelector(".chip.active") : null;
  const cat = active ? active.dataset.cat : "all";
  const list = cat === "all" ? BOOKS : booksOfCategory(cat);
  mountPaged(document.getElementById("bookGrid"), document.getElementById("bookPager"), list.map(bookCard), 24);
}

function viewCategories() {
  return `
  <section class="section wrap fade-in">
    <div class="section-head">
      <span class="eyebrow">Categories</span>
      <h2>书籍分类</h2>
      <p>按主题把书归类，方便按需索取。</p>
    </div>
    <div class="cat-grid stagger">
      ${CATEGORIES.map((c) => {
        const n = booksOfCategory(c.id).length;
        return `
        <article class="cat-card" onclick="location.hash='#/category/${c.id}'">
          <div class="cat-emoji">${c.emoji}</div>
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.desc)}</p>
          <div class="cat-count">${n} 本书 →</div>
        </article>`;
      }).join("")}
    </div>
  </section>`;
}

function viewCategory(id) {
  const cat = getCategory(id);
  if (!cat) return notFound();
  const books = booksOfCategory(id);
  _currentCategoryId = id;
  return `
  <section class="section wrap fade-in">
    <div class="crumb"><a href="#/categories">书籍分类</a><span>›</span>${esc(cat.name)}</div>
    <div class="section-head">
      <span class="eyebrow">${cat.emoji} Category</span>
      <h2>${esc(cat.name)}</h2>
      <p>${esc(cat.desc)} · 共 ${books.length} 本</p>
    </div>
    <div class="book-grid stagger" id="catGrid"></div>
    <div class="pager-wrap" id="catPager"></div>
  </section>`;
}

let _currentCategoryId = "";
function initCategory() {
  const books = booksOfCategory(_currentCategoryId);
  const grid = document.getElementById("catGrid");
  const pager = document.getElementById("catPager");
  if (!grid) return;
  if (!books.length) { grid.innerHTML = emptyBlock("这个分类下还没有书"); return; }
  if (books.length <= 24) { grid.innerHTML = books.map(bookCard).join(""); if (pager) pager.innerHTML = ""; return; }
  mountPaged(grid, pager, books.map(bookCard), 24);
}

function viewTags() {
  const tags = allTags();
  return `
  <section class="section wrap fade-in">
    <div class="section-head">
      <span class="eyebrow">Tags</span>
      <h2>标签分类</h2>
      <p>用标签串起不同书里相通的主题。</p>
    </div>
    <div class="tag-row" style="gap:12px">
      ${tags
        .map(
          ([t, c]) =>
            `<span class="tag big" onclick="location.hash='#/tag/${encodeURIComponent(t)}'">#${esc(t)}<span class="cnt">${c}</span></span>`
        )
        .join("")}
    </div>
  </section>`;
}

function viewTag(name) {
  const tag = decodeURIComponent(name);
  const notes = notesOfTag(tag);
  _currentTagName = tag;
  return `
  <section class="section wrap fade-in">
    <div class="crumb"><a href="#/tags">标签</a><span>›</span>#${esc(tag)}</div>
    <div class="section-head">
      <span class="eyebrow">Tag</span>
      <h2>#${esc(tag)}</h2>
      <p>共 ${notes.length} 条相关笔记</p>
    </div>
    <div class="note-list" id="tagNotes"></div>
    <div class="pager-wrap" id="tagPager"></div>
  </section>`;
}

let _currentTagName = "";
function initTag() {
  const notes = notesOfTag(_currentTagName);
  const list = document.getElementById("tagNotes");
  const pager = document.getElementById("tagPager");
  if (!list) return;
  if (!notes.length) { list.innerHTML = emptyBlock("暂无这个标签的笔记"); return; }
  if (notes.length <= 24) { list.innerHTML = notes.map(noteItem).join(""); if (pager) pager.innerHTML = ""; return; }
  mountPaged(list, pager, notes.map(noteItem), 20);
}

function viewBook(id) {
  const b = getBook(id);
  if (!b) return notFound();
  _currentBookId = id;
  const cat = getCategory(b.category);
  const catName = cat ? cat.name : "全部";
  return `
  <section class="section wrap fade-in">
    <div class="detail-bar">
      <div class="crumb">
        <a href="#/booklist">精选书单</a><span>›</span><a href="#/booklist" onclick="_returnCat='${esc(catName)}'">${esc(catName)}</a>
      </div>
      <button class="back-btn" onclick="if(_returnCat){location.hash='#/booklist'}else{location.hash='#/booklist';_returnCat='${esc(catName)}'}"><span class="bk-arrow">←</span>返回</button>
    </div>

    <div class="bl-detail-hero">
      <h1>${esc(b.title)}</h1>

    <p style="font-size:17px;color:var(--ink-soft);line-height:1.9;max-width:760px">${esc(b.summary)}</p>
    <div class="tag-row">
      ${(b.tags || [])
        .map((t) => `<span class="tag" onclick="location.hash='#/tag/${encodeURIComponent(t)}'">#${esc(t)}</span>`)
        .join("")}
    </div>

    <div class="section-head" style="margin-top:44px;margin-bottom:22px">
      <h2 style="font-size:24px">读书笔记 · ${b.notes.length} 条</h2>
    </div>
    <div class="note-list" id="bookNotes"></div>
    <div class="pager-wrap" id="bookNotesPager"></div>
  </section>`;
}

let _currentBookId = "";
function initBook() {
  const b = getBook(_currentBookId);
  const list = document.getElementById("bookNotes");
  const pager = document.getElementById("bookNotesPager");
  if (!list || !b) return;
  if (!b.notes.length) { list.innerHTML = emptyBlock("这本书还没有笔记～"); return; }
  
  const sorted = sortNotesForDisplay(b.notes);
  // 少量笔记直接渲染（更稳），大量才走分页
  if (sorted.length <= 24) {
    list.innerHTML = sorted.map((n) => noteItem({ ...n, book: b })).join("");
    if (pager) pager.innerHTML = "";
    return;
  }
  mountPaged(list, pager, sorted.map((n) => noteItem({ ...n, book: b })), 20);
}

function viewNote(id) {
  const n = getNote(id);
  if (!n) return notFound();
  const b = n.book;

  // 同书内上一条 / 下一条
  const idx = b.notes.findIndex((x) => x.id === n.id);
  const prev = b.notes[idx - 1];
  const next = b.notes[idx + 1];

  const html = marked.parse(n.content || "");

  return `
  <section class="section wrap fade-in">
    <article class="note-detail">
      <div class="detail-bar">
        <div class="crumb">
          <a href="#/booklist">精选书单</a><span>›</span>
          <a href="#/book/${b.id}">${esc(b.title)}</a>
        </div>
        <button class="back-btn" onclick="location.hash='#/book/${b.id}'"><span class="bk-arrow">←</span>返回</button>
      </div>

      <div class="note-hero">
        <span class="from" onclick="location.hash='#/book/${b.id}'">
          <span class="fb-ico" style="${coverStyle(b)}">${b.cover.emoji}</span>
          出自《${esc(b.title)}》· ${esc(b.author)}
        </span>
        <h1>${noteBadge(n)}${esc(n.title)}</h1>
        <div class="meta">
          <span>🗓 ${fmtDate(n.date)}</span>
          <span>${(n.tags || [])
            .map((t) => `<a href="#/tag/${encodeURIComponent(t)}" style="color:var(--accent)">#${esc(t)}</a>`)
            .join("  ")}</span>
        </div>
      </div>

      <div class="md">${html}</div>

      <div class="note-nav">
        ${
          prev
            ? `<a href="#/note/${prev.id}"><div class="dir">← 上一条</div><div class="t">${esc(prev.title)}</div></a>`
            : `<a style="opacity:.4;cursor:default"><div class="dir">← 上一条</div><div class="t">没有了</div></a>`
        }
        ${
          next
            ? `<a class="next" href="#/note/${next.id}"><div class="dir">下一条 →</div><div class="t">${esc(next.title)}</div></a>`
            : `<a class="next" style="opacity:.4;cursor:default"><div class="dir">下一条 →</div><div class="t">没有了</div></a>`
        }
      </div>
    </article>
  </section>`;
}

function viewAbout() {
  const c = SITE.contact;
  return `
  <section class="section wrap fade-in">
    <div class="about">
      <div class="about-card">
        <img class="about-avatar" src="assets/avatar.jpg" alt="${esc(SITE.author)}" />
        <h1>${esc(SITE.author)}</h1>
        <p class="bio">${esc(SITE.bio)}</p>
        <div class="about-quote">「${esc(SITE.motto)}」</div>

        <div class="about-stats">
          <div class="s"><strong>${BOOK_LIST ? BOOK_LIST.length : BOOKS.length}</strong><span>精选好书</span></div>
          <div class="s"><strong>${allNotes().length}</strong><span>条笔记</span></div>
          <div class="s"><strong>${allTags().length}</strong><span>个关注主题</span></div>
        </div>

        <div class="about-contact">
          <h3>找到我</h3>
          <div class="contact-list">
            ${Object.entries(c)
              .filter(([k, v]) => v && v !== "（暂不公开）")
              .map(([k, v]) => `<div class="ci"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`)
              .join("")}
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

/* ---------- 精选书单（来自飞书书单库 window.BOOK_LIST） ---------- */

/* 飞书书名 → 微信读书笔记 匹配：剥离《》与标点后精确/前缀对齐 */
function normTitle(s) {
  return String(s).toLowerCase()
    .replace(/[《》<>()（）·，。、\-_:：·!！?？"'""'’]/g, "")
    .replace(/\s+/g, "");
}
let _wrTitleMap = null;
function wrTitleMap() {
  if (_wrTitleMap) return _wrTitleMap;
  _wrTitleMap = {};
  (typeof BOOKS !== "undefined" ? BOOKS : []).forEach((b) => {
    _wrTitleMap[normTitle(b.title)] = b;
  });
  return _wrTitleMap;
}
function findWrBook(feishuTitle) {
  const m = wrTitleMap();
  const n = normTitle(feishuTitle);
  if (m[n]) return m[n];
  for (const k in m) {
    if (k.startsWith(n) || n.startsWith(k)) return m[k];
  }
  return null;
}

// 每个分类的封面色调（用于卡片左侧封面区块）
const CAT_COLORS = {
  "思维认知":    { bg: "#f0edff", accent: "#6366f1" },
  "决策避坑":    { bg: "#fff8eb", accent: "#f59e0b" },
  "习惯养成":    { bg: "#ecfdf5", accent: "#10b981" },
  "能力提升":    { bg: "#eef2ff", accent: "#4f46e5" },
  "成事方法":    { bg: "#fff1f2", accent: "#e11d48" },
  "人际关系与沟通": { bg: "#f0fdfa", accent: "#14b8a6" },
  "人性洞察":    { bg: "#fff7ed", accent: "#ea580c" },
  "财富认知":    { bg: "#ecfdf5", accent: "#059669" },
  "经济与商业":   { bg: "#f0f9ff", accent: "#0284c7" },
  "名人传记":    { bg: "#f8fafc", accent: "#475569" },
  "心理成长":    { bg: "#fdf2f8", accent: "#db2777" },
  "哲学思辨":    { bg: "#f5f3ff", accent: "#7c3aed" },
  "底层规律":    { bg: "#ecfeff", accent: "#06b6d4" },
  "历史":        { bg: "#fafaf9", accent: "#78716c" },
  "文学经典":    { bg: "#fdf4ff", accent: "#c026d3" },
};

function bookListItem(b, i) {
  const cat = (b.categories || [])[0] || "";
  const color = CAT_COLORS[cat] || { bg: "#f5f5f5", accent: "#666" };
  const wr = findWrBook(b.title);
  const db = (typeof BOOK_DOUBAN !== "undefined" && BOOK_DOUBAN[b.title]) || null;
  // 真实封面图（来自微信读书），没有则用分类色块+emoji兜底
  const hasCover = b.cover;
  const coverEmojis = {
    "思维认知": "🧠", "决策避坑": "🎯", "习惯养成": "🔥", "能力提升": "⚡",
    "成事方法": "🏹", "人际关系与沟通": "💬", "人性洞察": "🔮", "财富认知": "💰",
    "经济与商业": "📊", "名人传记": "👤", "心理成长": "💚", "哲学思辨": "🌌",
    "底层规律": "🔬", "历史": "🏛️", "文学经典": "📖",
  };
  const fallbackEmoji = coverEmojis[cat] || "📕";

  return `
    <article class="bl-card" onclick="_returnCat='${esc(cat)}';location.hash='#/blbook/${i}'">
      <div class="bl-cover" ${hasCover ? `style="background:none;padding:0;overflow:hidden"` : `style="background:${color.bg}"}`}>
        ${hasCover
          ? `<img class="bl-cover-img" src="${esc(b.cover)}" alt="${esc(b.title)}封面" loading="lazy" onerror="this.parentElement.style.background='${color.bg}';this.remove();this.parentElement.innerHTML='<span class=\\'bl-cover-emoji\\'>${fallbackEmoji}</span>';" />`
          : `<span class="bl-cover-emoji">${fallbackEmoji}</span>`
        }
      </div>
      <div class="bl-info">
        <h3 class="bl-title">${esc(b.title)}</h3>
        <div class="bl-author">${esc(b.author || "佚名")}</div>
        <div class="bl-meta-row">
          <span class="bl-cat" style="background:${color.bg};color:${color.accent}">${esc(cat)}</span>
          ${db && db.rating != null ? `<span class="bl-db-rating"><i>★</i><strong>${db.rating.toFixed(1)}</strong></span>` : ""}
        </div>
      </div>
      <span class="bl-arrow" aria-hidden="true">→</span>
    </article>`;
}

function viewBookList() {
  // 聚合书单分类与数量
  const catSet = {};
  BOOK_LIST.forEach((b) => (b.categories || []).forEach((c) => (catSet[c] = (catSet[c] || 0) + 1)));
  const cats = [["all", "全部"]].concat(
    Object.entries(catSet)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => [c, `${c} ${n}`])
  );
  return `
  <section class="section wrap fade-in">
    <div class="section-head">
      <span class="eyebrow">Book List</span>
      <h2>精选书单</h2>
      <p>我亲手挑过、也真受益的书，按主题分类，每本附一句为什么值得读。</p>
    </div>
    <div class="filter-bar" id="blFilter">
      ${cats
        .map(
          ([id, label]) =>
            `<span class="chip ${id === "all" ? "active" : ""}" data-cat="${esc(id)}">${esc(label)}</span>`
        )
        .join("")}
    </div>
    <div class="bl-grid stagger" id="blGrid"></div>
    <div class="pager-wrap" id="blPager"></div>
  </section>`;
}

function initBookList() {
  const bar = document.getElementById("blFilter");
  const grid = document.getElementById("blGrid");
  const pager = document.getElementById("blPager");
  if (!bar || !grid || typeof BOOK_LIST === "undefined") return;

  // 用原始索引，避免筛选后 i 错位
  let currentCat = _returnCat || "all";
  _returnCat = null; // 用完即清，避免下次误恢复

  const render = (cat) => {
    currentCat = cat;
    // 更新 active 样式
    bar.querySelectorAll(".chip").forEach((c) => {
      c.classList.toggle("active", c.dataset.cat === cat);
    });
    // 筛选：保留原始索引
    const filtered = cat === "all"
      ? BOOK_LIST.map((b, i) => ({ b, i }))
      : BOOK_LIST.map((b, i) => ({ b, i })).filter(({ b }) => (b.categories || []).includes(cat));

    if (!filtered.length) {
      grid.innerHTML = emptyBlock("这个分类下还没有书");
      if (pager) pager.innerHTML = "";
      return;
    }
    const cards = filtered.map(({ b, i }) => bookListItem(b, i));
    if (cards.length <= 24) {
      grid.innerHTML = cards.join("");
      if (pager) pager.innerHTML = "";
      return;
    }
    mountPaged(grid, pager, cards, 24);
  };

  render(currentCat);

  bar.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const cat = chip.dataset.cat;
    if (cat === currentCat) return; // 重复点击不重复渲染
    render(cat);
  });
}

/* 全局：记录进入详情前的分类状态，用于"返回时恢复分类" */
let _returnCat = null;

/* 飞书书单 → 单本书聚合页：阅读框架 + 公众号链接 + 微信读书笔记 */
function renderBookFramework(fw, opts) {
  if (!fw) return "";
  opts = opts || {};
  let html = "";

  // 这本书是什么（元信息）
  if (fw.about) {
    const a = fw.about;
    const rows = [];
    if (a.full) rows.push(["原名", a.full]);
    // 作者已在 hero 区展示，此处不重复
    if (a.published) rows.push(["出版", a.published]);
    if (a.significance) rows.push(["地位", a.significance]);
    if (a.size) rows.push(["体量", a.size]);
    html += `
    <div class="fw-block">
      <div class="fw-head"><span class="fw-kicker">01</span><h2>这本书是什么</h2></div>
      ${rows.length ? `<div class="fw-about-grid">
        ${rows.map(([k, v]) => `<div class="fw-about-row"><span class="fw-about-k">${esc(k)}</span><span class="fw-about-v">${esc(v)}</span></div>`).join("")}
      </div>` : ""}
    </div>`;
  }

  // 背景：写作时的世界
  if (fw.background) {
    const bg = fw.background;
    html += `
    <div class="fw-block">
      <div class="fw-head"><span class="fw-kicker">02</span><h2>背景：写作时的世界</h2></div>
      ${bg.intro ? `<p class="fw-intro">${esc(bg.intro)}</p>` : ""}
      <div class="fw-bg-cards">
        ${bg.items.map((it) => `
          <div class="fw-bg-card">
            <h4>${esc(it.name)}</h4>
            <ul>${it.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
          </div>`).join("")}
      </div>
    </div>`;
  }

  // 核心框架：全书怎么展开（对齐用户七段结构之「四、核心框架」）
  if (fw.logic) {
    const lg = fw.logic;
    html += `
    <div class="fw-block">
      <div class="fw-head"><span class="fw-kicker">03</span><h2>核心框架：每卷在解决什么难题</h2></div>
      ${lg.intro ? `<p class="fw-intro">${esc(lg.intro)}</p>` : ""}
      <div class="fw-chain">
        ${lg.volumes.map((v) => `
          <div class="fw-vol">
            <div class="fw-vol-no">${esc(v.no)}</div>
            <div class="fw-vol-body">
              <h4>${esc(v.title)}</h4>
              <ul>${v.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
            </div>
          </div>`).join("")}
      </div>
    </div>`;
  }

  // 核心主张
  if (fw.takeaways && fw.takeaways.length) {
    html += `
    <div class="fw-block">
      <div class="fw-head"><span class="fw-kicker">04</span><h2>核心主张：真正立住的主张</h2></div>
      <ol class="fw-takeaways">
        ${fw.takeaways.map((t) => `<li>${esc(t)}</li>`).join("")}
      </ol>
    </div>`;
  }

  // 怎么读这本书
  if (fw.howToRead) {
    const r = fw.howToRead;
    html += `
    <div class="fw-block">
      <div class="fw-head"><span class="fw-kicker">05</span><h2>怎么读这本书</h2></div>
      <div class="fw-read">
        ${r.must ? `<div class="fw-read-col fw-read-must"><div class="fw-read-h">✅ 必读核心</div>${r.must.map((x) => `<div class="fw-read-item">${esc(x)}</div>`).join("")}</div>` : ""}
        ${r.skip ? `<div class="fw-read-col fw-read-skip"><div class="fw-read-h">⏭️ 可略读</div>${r.skip.map((x) => `<div class="fw-read-item">${esc(x)}</div>`).join("")}</div>` : ""}
        ${r.order ? `<div class="fw-read-col fw-read-order"><div class="fw-read-h">🧭 建议顺序</div><div class="fw-read-item">${esc(r.order)}</div></div>` : ""}
      </div>
    </div>`;
  }

  // 延伸思考
  if (fw.extended) {
    html += `
    <div class="fw-block fw-soft">
      <div class="fw-head"><span class="fw-kicker">＋</span><h2>延伸思考</h2></div>
      <p class="fw-soft-text">${esc(fw.extended)}</p>
    </div>`;
  }

  // 局限提示
  if (fw.limits) {
    html += `
    <div class="fw-block fw-soft">
      <div class="fw-head"><span class="fw-kicker">⚠</span><h2>局限与边界</h2></div>
      <p class="fw-soft-text">${esc(fw.limits)}</p>
    </div>`;
  }

  return html;
}

function viewBlBook(i) {
  const b = (typeof BOOK_LIST !== "undefined" && BOOK_LIST[i]) || null;
  if (!b) return notFound();
  const catName = (b.categories || [])[0] || "全部";
  const catChips = (b.categories || []).map((c) => `<span class="bl-cat">${esc(c)}</span>`).join("");
  // 公众号解读：兼容单篇(b.link)与多篇(b.links:[{title,url}])
  const gzhList = Array.isArray(b.links) && b.links.length
    ? b.links.map((l) => ({ title: l.title || "", url: l.url || l })).filter((l) => l.url)
    : (b.link ? [{ title: "", url: b.link }] : []);
  let linkBtn = "";
  if (gzhList.length === 1 && !gzhList[0].title) {
    // 单篇（老格式）：胶囊按钮
    const u = gzhList[0].url;
    const g = /mp\.weixin\.qq\.com/.test(u);
    linkBtn = `<a class="bl-gzh-btn" href="${esc(u)}" target="_blank" rel="noopener">${g ? "📱 读我的公众号解读 →" : "📄 读我的飞书笔记 →"}</a>`;
  } else if (gzhList.length) {
    // 多篇：标题 + iOS 风格列表
    const head = /mp\.weixin\.qq\.com/.test(gzhList[0].url) ? "📱 公众号解读" : "📄 延伸阅读";
    linkBtn = `<div class="bl-gzh-list">
      <div class="bl-gzh-head">${head} · ${gzhList.length} 篇</div>
      ${gzhList.map((l, idx) => `
        <a class="bl-gzh-item" href="${esc(l.url)}" target="_blank" rel="noopener">
          <span class="bl-gzh-idx">${String(idx + 1).padStart(2, "0")}</span>
          <span class="bl-gzh-title">${esc(l.title || "第 " + (idx + 1) + " 篇")}</span>
          <span class="bl-gzh-arrow" aria-hidden="true">→</span>
        </a>`).join("")}
    </div>`;
  }
  const fw = (typeof BOOK_FRAMEWORKS !== "undefined" && BOOK_FRAMEWORKS[b.title]) || null;
  const db = (typeof BOOK_DOUBAN !== "undefined" && BOOK_DOUBAN[b.title]) || null;

  // 豆瓣评分（一行紧凑，不抢戏）
  const doubanHtml = db && db.rating != null ? `
    <div class="bl-douban">
      <span class="bl-douban-label">豆瓣</span>
      <span class="bl-douban-stars" style="--p:${(db.rating / 10 * 100).toFixed(0)}%"><i>★★★★★</i></span>
      <strong class="bl-douban-num">${db.rating.toFixed(1)}</strong>
      <span class="bl-douban-votes">(${db.votes}人)</span>
    </div>` : "";

  // 副标题：作者 · 出版社 · 年
  const subParts = [esc(b.author || "佚名")];
  if (db && db.publisher) subParts.push(esc(db.publisher));
  if (db && db.year) subParts.push(esc(db.year));
  const subLine = subParts.join(" · ");

  // 速读卡：书籍定位 + 核心观点 + 重点清单（热门划线 top3，带划线人数）
  const positionText = b.recommend || (db && db.intro ? db.intro.split(/[。！？\n]/)[0] : "");
  let viewpointText = (db && db.intro) ? db.intro : (fw && fw.coreQuestion ? fw.coreQuestion : (b.recommend || ""));
  if (viewpointText.length > 120) viewpointText = viewpointText.slice(0, 120) + "…";
  // 重点清单：热门划线按人数取 top3（强归一化匹配书名，避免标点/空格差异漏配）
  let scMarks = "";
  if (typeof HOT_MARKS !== "undefined") {
    const t = normTitle(b.title);
    const hm = HOT_MARKS.find((h) => {
      const cs = [h.userTitle, h.foundTitle].filter(Boolean).map((s) => normTitle(s));
      return cs.some((c) => c && c === t);
    });
    if (hm && hm.marks && hm.marks.length) {
      const top = [...hm.marks].sort((x, y) => y.count - x.count).slice(0, 3);
      scMarks = `
      <div class="bl-sc-row">
        <span class="bl-sc-label">重点清单</span>
        <ul class="bl-sc-marks">
          ${top.map((m) => `<li class="bl-sc-mark"><span class="bl-sc-count">〔${m.count.toLocaleString()}人〕</span><span class="bl-sc-quote">${esc(m.text)}</span></li>`).join("")}
        </ul>
      </div>`;
    }
  }
  const speedCard = `
  <div class="bl-speedcard">
    <div class="bl-sc-head"><span class="bl-sc-kicker">⚡</span><h2>速读卡</h2></div>
    ${positionText ? `<div class="bl-sc-row"><span class="bl-sc-label">书籍定位</span><p class="bl-sc-text">${esc(positionText)}</p></div>` : ""}
    ${viewpointText ? `<div class="bl-sc-row"><span class="bl-sc-label">核心观点</span><p class="bl-sc-text">${esc(viewpointText)}</p></div>` : ""}
    ${scMarks}
  </div>`;

  // 阅读框架、热门笔记、热门划线已移除（用户要求精简）

  return `
  <section class="section wrap fade-in">
    <div class="detail-bar">
      <div class="crumb">
        <a href="#/booklist">精选书单</a><span>›</span><a href="#/booklist" onclick="_returnCat='${esc(catName)}'">${esc(catName)}</a>
      </div>
      <button class="back-btn" onclick="if(_returnCat){location.hash='#/booklist'}else{location.hash='#/booklist';_returnCat='${esc(catName)}'}"><span class="bk-arrow">←</span>返回</button>
    </div>

    <!-- Hero：左封面 + 右信息（豆瓣式：评分 + 短介绍） -->
    <div class="bl-detail-hero ${b.cover ? "has-cover" : ""}">
      ${b.cover ? `<div class="bl-detail-cover"><img src="${esc(b.cover)}" alt="${esc(b.title)}" loading="lazy"></div>` : ""}
      <div class="bl-detail-right">
        <h1>${esc(b.title)}</h1>
        <div class="bl-detail-sub"><span class="bl-detail-author">${subLine}</span></div>
        ${doubanHtml}
        <div class="bl-cats">${catChips}</div>
      </div>
    </div>

    ${speedCard}
    ${linkBtn ? `<div class="bl-gzh-wrap">${linkBtn}</div>` : ""}
    ${fw ? `<details class="bl-fw"><summary><span class="bl-fw-sum">📚 深度阅读框架 · 七节（点开看全书脉络）</span><span class="bl-fw-chev">▾</span></summary><div class="bl-fw-body">${renderBookFramework(fw)}</div></details>` : ""}
    ${bookRelatedThemesHtml(b)}
  </section>`;
}

/* ============================================================
   知识网络 / 第二大脑：搜索 · 图谱 · 节点
   ============================================================ */

/* 书单索引：按书名（强归一化）找 blbook 下标，用于「碎片/节点」跳书 */
function blIndexByTitle(title) {
  if (typeof BOOK_LIST === "undefined" || !title) return -1;
  const t = normTitle(title);
  if (!t) return -1;
  let idx = BOOK_LIST.findIndex((b) => normTitle(b.title) === t);
  if (idx >= 0) return idx;
  for (let i = 0; i < BOOK_LIST.length; i++) {
    const k = normTitle(BOOK_LIST[i].title);
    if (k && (k.startsWith(t) || t.startsWith(k))) return i;
  }
  return -1;
}

/* 一本书挂在哪些知识节点上 */
function relatedThemesOfBook(b) {
  if (typeof KNOWLEDGE_NODES === "undefined") return [];
  const t = normTitle(b.title);
  return KNOWLEDGE_NODES.filter((n) =>
    (n.perspectives || []).some((p) => normTitle(p.book) === t)
  );
}

/* 书详情页底部：「本书关联主题」+「同主题相关书」 */
function bookRelatedThemesHtml(b) {
  const nodes = relatedThemesOfBook(b);
  if (!nodes.length) return "";
  const others = [];
  const seen = new Set();
  const selfT = normTitle(b.title);
  nodes.forEach((n) =>
    (n.perspectives || []).forEach((p) => {
      const ti = blIndexByTitle(p.book);
      const k = normTitle(p.book);
      if (ti >= 0 && k !== selfT && !seen.has(k)) {
        seen.add(k);
        others.push({ i: ti, title: p.book });
      }
    })
  );
  const themeCards = nodes
    .map((n) => {
      const ps = n.perspectives.filter((p) => normTitle(p.book) === selfT);
      const pre = ps.map((p) => `<li>${esc(p.viewpoint)}</li>`).join("");
      return `<div class="rel-theme" onclick="location.hash='#/node/${n.id}'">
        <div class="rel-theme-head"><span class="rel-theme-title">${esc(n.title)}</span><span class="rel-theme-go">进入主题 →</span></div>
        ${pre ? `<ul class="rel-theme-pre">${pre}</ul>` : ""}
      </div>`;
    })
    .join("");
  const relatedBooks = others.length
    ? `<div class="rel-books"><div class="rel-books-head">同主题相关书 →</div><div class="rel-books-row">${others
        .map((o) => `<a class="rel-book-chip" href="#/blbook/${o.i}">${esc(o.title)}</a>`)
        .join("")}</div></div>`
    : "";
  return `<div class="bl-related">
    <div class="bl-rel-head"><span class="bl-rel-kicker">🕸️</span><h2>本书关联主题 · 第二大脑</h2></div>
    <p class="bl-rel-sub">这本书的观点，在知识网络里连着这些主题；点进去看多本书怎么互相印证、甚至打架。</p>
    <div class="rel-themes">${themeCards}</div>
    ${relatedBooks}
  </div>`;
}

/* ---------- 搜索：三类结果（节点主题 / 书籍 / 观点碎片） ---------- */
function matchNode(n, q) {
  const t = normTitle(q);
  if (normTitle(n.title).includes(t)) return true;
  if ((n.aliases || []).some((a) => normTitle(a).includes(t))) return true;
  if (normTitle(n.summary || "").includes(t)) return true;
  if (
    (n.perspectives || []).some(
      (p) =>
        normTitle(p.viewpoint).includes(t) ||
        normTitle(p.book).includes(t) ||
        normTitle(p.method || "").includes(t)
    )
  )
    return true;
  return false;
}

function searchBooks(q) {
  const t = normTitle(q);
  const res = [];
  if (typeof BOOK_LIST === "undefined") return res;
  BOOK_LIST.forEach((b, i) => {
    const hay = [
      normTitle(b.title),
      normTitle(b.author || ""),
      normTitle(b.recommend || ""),
      (b.categories || []).map(normTitle).join(" "),
    ].join(" ");
    let hit = hay.includes(t);
    if (!hit && typeof BOOK_FRAMEWORKS !== "undefined") {
      const fw = BOOK_FRAMEWORKS[b.title];
      if (fw) {
        const fwHay = [
          normTitle(fw.coreQuestion || ""),
          (fw.takeaways || []).map(normTitle).join(" "),
        ].join(" ");
        hit = fwHay.includes(t);
      }
    }
    if (hit) res.push({ b, i });
  });
  return res;
}

function searchFragments(q) {
  const t = normTitle(q);
  const res = [];
  if (typeof HOT_MARKS !== "undefined") {
    HOT_MARKS.forEach((hm) => {
      const bt = hm.userTitle || hm.foundTitle || "";
      (hm.marks || []).forEach((m) => {
        if (normTitle(m.text).includes(t))
          res.push({ text: m.text, count: m.count, bookTitle: bt, i: blIndexByTitle(bt) });
      });
    });
  }
  if (typeof BOOK_FRAMEWORKS !== "undefined") {
    Object.entries(BOOK_FRAMEWORKS).forEach(([title, fw]) => {
      (fw.takeaways || []).forEach((tk) => {
        if (normTitle(tk).includes(t))
          res.push({ text: tk, count: null, bookTitle: title, i: blIndexByTitle(title) });
      });
    });
  }
  return res.slice(0, 24);
}

function viewSearch(q) {
  if (typeof KNOWLEDGE_NODES === "undefined") return notFound();
  q = (q || "").trim();
  const hasQ = !!q;
  const nodeRes = hasQ ? KNOWLEDGE_NODES.filter((n) => matchNode(n, q)) : KNOWLEDGE_NODES.slice();
  const bookRes = hasQ ? searchBooks(q) : [];
  const fragRes = hasQ ? searchFragments(q) : [];

  const nodeHtml = nodeRes.length
    ? nodeRes
        .map(
          (n) => `<a class="sr-node" href="#/node/${n.id}">
            <span class="sr-node-title">${esc(n.title)}</span>
            <span class="sr-node-sum">${esc(n.summary)}</span>
            <span class="sr-node-meta">${(n.perspectives || []).length} 个视角 · ${(n.edges || []).length} 条连线</span>
          </a>`
        )
        .join("")
    : `<div class="sr-empty">没有匹配的主题</div>`;

  const bookHtml = bookRes.length
    ? bookRes
        .map(
          ({ b, i }) => `<a class="sr-book" href="#/blbook/${i}">
            ${b.cover ? `<img class="sr-book-cover" src="${esc(b.cover)}" alt="" loading="lazy">` : `<span class="sr-book-emoji">📕</span>`}
            <span class="sr-book-info"><span class="sr-book-title">${esc(b.title)}</span><span class="sr-book-author">${esc(b.author || "")}</span></span>
          </a>`
        )
        .join("")
    : `<div class="sr-empty">没有匹配的书</div>`;

  const fragHtml = fragRes.length
    ? fragRes
        .map(
          (f) => `<div class="sr-frag">
            <p class="sr-frag-text">${esc(f.text)}</p>
            <div class="sr-frag-meta">
              ${f.i >= 0 ? `<a class="sr-frag-book" href="#/blbook/${f.i}">《${esc(f.bookTitle)}》 ↗</a>` : `<span class="sr-frag-book">《${esc(f.bookTitle)}》</span>`}
              ${f.count ? `<span class="sr-frag-count">${f.count.toLocaleString()} 人划线</span>` : ""}
            </div>
          </div>`
        )
        .join("")
    : `<div class="sr-empty">没有匹配的观点碎片</div>`;

  const body = hasQ
    ? `
      <div class="sr-section"><div class="sr-sec-head"><span>🕸️</span> 知识网络主题 · ${nodeRes.length}</div><div class="sr-nodes">${nodeHtml}</div></div>
      ${bookRes.length ? `<div class="sr-section"><div class="sr-sec-head"><span>📚</span> 书籍 · ${bookRes.length}</div><div class="sr-books">${bookHtml}</div></div>` : ""}
      ${fragRes.length ? `<div class="sr-section"><div class="sr-sec-head"><span>💡</span> 观点碎片 · ${fragRes.length}</div><div class="sr-frags">${fragHtml}</div></div>` : ""}
    `
    : `<div class="sr-section"><div class="sr-sec-head"><span>🕸️</span> 全部主题（点进去看多本书怎么互相印证、怎么打架）</div><div class="sr-nodes">${nodeHtml}</div></div>`;

  return `
  <section class="section wrap fade-in">
    <div class="search-page-head">
      <div class="search-page-box">
        <span class="search-ico">🔍</span>
        <input id="pageSearch" type="search" placeholder="搜书 / 观点 / 主题，边打边出…" value="${esc(q)}" autocomplete="off" />
      </div>
      <div class="search-stats">${hasQ ? `「${esc(q)}」：${nodeRes.length} 主题 · ${bookRes.length} 书 · ${fragRes.length} 观点` : "直接搜，或下滑浏览全部主题"}</div>
    </div>
    ${body}
  </section>`;
}

function initSearch() {
  const inp = document.getElementById("pageSearch");
  if (!inp) return;
  let timer;
  const go = () => {
    const v = inp.value.trim();
    const target = "#/search/" + encodeURIComponent(v);
    if (target !== location.hash) location.hash = target;
  };
  inp.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(go, 220);
  });
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(timer);
      go();
    }
  });
  inp.focus();
  const v = inp.value;
  inp.value = "";
  inp.value = v;
}

/* ---------- 知识网络图谱（力导向布局） ---------- */
const NODE_CLUSTER = {
  executive: "#6366f1", procrastination: "#6366f1", perfectionism: "#6366f1", habit: "#6366f1", compounding: "#6366f1",
  "emotional-drain": "#10b981", separation: "#10b981", "people-pleasing": "#10b981", intimacy: "#10b981", nvc: "#10b981",
  "cognitive-bias": "#f59e0b", scarcity: "#f59e0b", wealth: "#f59e0b",
};

function computeGraphLayout() {
  const nodes = KNOWLEDGE_NODES;
  const W = 820, H = 560, cx = W / 2, cy = H / 2;
  const pos = {};
  nodes.forEach((n, i) => {
    const ang = (i / nodes.length) * Math.PI * 2;
    pos[n.id] = { x: cx + Math.cos(ang) * 230, y: cy + Math.sin(ang) * 150, vx: 0, vy: 0 };
  });
  const edges = [];
  nodes.forEach((n) => (n.edges || []).forEach((e) => { if (pos[e.to]) edges.push([n.id, e.to]); }));
  for (let it = 0; it < 500; it++) {
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = pos[nodes[i].id], b = pos[nodes[j].id];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy || 1;
        const d = Math.sqrt(d2);
        const f = 9000 / d2;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    edges.forEach(([s, t]) => {
      const a = pos[s], b = pos[t];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - 150) * 0.02;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    });
    nodes.forEach((n) => {
      const p = pos[n.id];
      p.vx += (cx - p.x) * 0.006;
      p.vy += (cy - p.y) * 0.006;
      p.vx *= 0.85; p.vy *= 0.85;
      p.x = Math.max(70, Math.min(W - 70, p.x + p.vx));
      p.y = Math.max(54, Math.min(H - 54, p.y + p.vy));
    });
  }
  return { pos, edges, W, H };
}

function viewGraph() {
  if (typeof KNOWLEDGE_NODES === "undefined") return notFound();
  const { pos, edges, W, H } = computeGraphLayout();
  const r = 30;
  const edgeSvg = edges
    .map(([s, t]) => {
      const a = pos[s], b = pos[t];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / d, uy = dy / d;
      const x1 = a.x + ux * (r + 4), y1 = a.y + uy * (r + 4);
      const x2 = b.x - ux * (r + 8), y2 = b.y - uy * (r + 8);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(0,0,0,.20)" stroke-width="1.4" marker-end="url(#arrow)"/>`;
    })
    .join("");
  const nodeSvg = KNOWLEDGE_NODES.map((n) => {
    const p = pos[n.id];
    const c = NODE_CLUSTER[n.id] || "#6366f1";
    return `<g class="gnode" onclick="location.hash='#/node/${n.id}'">
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="${c}" fill-opacity=".13" stroke="${c}" stroke-width="2"/>
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6" fill="${c}"/>
      <text x="${p.x.toFixed(1)}" y="${(p.y + r + 16).toFixed(1)}" text-anchor="middle" class="gnode-label">${esc(n.title)}</text>
    </g>`;
  }).join("");
  const legend = [
    ["#6366f1", "行动 · 习惯 · 财富"],
    ["#10b981", "关系 · 沟通 · 情绪"],
    ["#f59e0b", "认知 · 决策 · 稀缺"],
  ]
    .map(([c, l]) => `<span class="lg"><span class="dot" style="background:${c}"></span>${l}</span>`)
    .join("");
  const chips = KNOWLEDGE_NODES.map(
    (n) => `<a class="gt-chip" href="#/node/${n.id}" style="border-color:${NODE_CLUSTER[n.id] || "#6366f1"}55">${esc(n.title)}</a>`
  ).join("");
  return `
  <section class="section wrap fade-in">
    <div class="section-head">
      <span class="eyebrow">Knowledge Graph</span>
      <h2>第二大脑 · 知识网络</h2>
      <p>每个节点是一个问题主题，挂着多本书的视角（含冲突观点）。点节点看全景，点书跳回书页。</p>
    </div>
    <div class="graph-wrap">
      <svg class="graph-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="知识网络图谱">
        <defs><marker id="arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="rgba(0,0,0,.3)"/></marker></defs>
        <g class="edges">${edgeSvg}</g>
        <g class="nodes">${nodeSvg}</g>
      </svg>
    </div>
    <div class="graph-legend">${legend}</div>
    <div class="graph-themes">${chips}</div>
  </section>`;
}

/* ---------- 节点详情（第二大脑） ---------- */
function viewNode(id) {
  if (typeof KNOWLEDGE_NODES === "undefined") return notFound();
  const n = KNOWLEDGE_NODES.find((x) => x.id === id);
  if (!n) return notFound();
  const edgeHtml = (n.edges || [])
    .map((e) => {
      const to = KNOWLEDGE_NODES.find((x) => x.id === e.to);
      if (!to) return "";
      return `<a class="node-edge" href="#/node/${e.to}"><span class="ne-rel">${esc(e.rel)}</span><span class="ne-to">${esc(to.title)} →</span></a>`;
    })
    .join("");
  const group = (stance, label) => {
    const ps = (n.perspectives || []).filter((p) => p.stance === stance);
    if (!ps.length) return "";
    const items = ps
      .map((p) => {
        const bi = blIndexByTitle(p.book);
        const bookLink = bi >= 0 ? `<a class="np-book" href="#/blbook/${bi}">${esc(p.book)} ↗</a>` : `<span class="np-book">${esc(p.book)}</span>`;
        return `<div class="np-item ${stance === "conflict" ? "np-conflict" : ""}">
          <div class="np-book-row">${bookLink}${stance === "conflict" ? `<span class="np-tag conflict">冲突视角</span>` : ""}</div>
          <p class="np-view">${esc(p.viewpoint)}</p>
          ${p.method ? `<p class="np-method"><span class="np-m-label">做法</span>${esc(p.method)}</p>` : ""}
        </div>`;
      })
      .join("");
    return `<div class="np-group"><div class="np-group-head ${stance === "conflict" ? "conflict-h" : ""}">${label}</div>${items}</div>`;
  };
  const support = group("support", "✅ 支持 / 印证");
  const nuance = group("nuance", "🟡 补充 / 边界");
  const conflict = group("conflict", "🔥 冲突 / 不同声音");
  return `
  <section class="section wrap fade-in">
    <div class="detail-bar">
      <div class="crumb"><a href="#/graph">知识网络</a><span>›</span>${esc(n.title)}</div>
      <button class="back-btn" onclick="location.hash='#/graph'"><span class="bk-arrow">←</span>返回网络</button>
    </div>
    <div class="node-head">
      <h1>${esc(n.title)}</h1>
      <p class="node-summary">${esc(n.summary)}</p>
    </div>
    ${edgeHtml ? `<div class="node-edges"><div class="ne-label">关联主题</div><div class="ne-list">${edgeHtml}</div></div>` : ""}
    ${support}${nuance}${conflict}
    <div class="node-foot"><a class="btn btn-ghost" href="#/graph">🕸️ 回到知识网络图谱</a></div>
  </section>`;
}

/* ---------- 通用块 ---------- */
function emptyBlock(msg) {
  return `<div class="empty"><div class="e-emoji">📭</div><p>${esc(msg)}</p></div>`;
}
function notFound() {
  return `<section class="section wrap"><div class="empty"><div class="e-emoji">🔍</div>
    <p>没找到这个页面</p><p><a class="btn btn-ghost" href="#/" style="margin-top:16px">回首页</a></p></div></section>`;
}

/* ============================================================
   路由
   ============================================================ */
function router() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean); // e.g. ["book","xxx"]
  let html = "";
  let route = "home";

  if (parts.length === 0) {
    html = viewHome();
  } else {
    switch (parts[0]) {
      case "books":       location.hash = "#/booklist"; return;
      case "categories":  location.hash = "#/booklist"; return;
      case "category":    location.hash = "#/booklist"; return;
      case "tags":        location.hash = "#/"; return;
      case "tag":         location.hash = "#/"; return;
      case "book":        html = viewBook(parts[1]); route = "book"; break;
      case "note":        html = viewNote(parts[1]); route = "note"; break;
      case "booklist":    html = viewBookList(); route = "booklist"; break;
      case "blbook":      html = viewBlBook(parseInt(parts[1], 10)); route = "blbook"; break;
      case "about":       html = viewAbout(); route = "about"; break;
      case "search":      html = viewSearch(decodeURIComponent(parts.slice(1).join("/"))); route = "search"; break;
      case "graph":       html = viewGraph(); route = "graph"; break;
      case "node":        html = viewNode(parts[1]); route = "node"; break;
      default:            html = notFound();
    }
  }

  app.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  // 高亮当前导航
  document.querySelectorAll("#mainNav a").forEach((a) =>
    a.classList.toggle("active", a.dataset.route === route)
  );

  // 页面内交互与分页渲染
  if (route === "home") initHome();
  if (route === "category") initCategory();
  if (route === "tag") initTag();
  if (route === "book") initBook();
  if (route === "booklist") initBookList();
  if (route === "search") initSearch();

  // 关闭移动端菜单
  document.getElementById("mainNav").classList.remove("open");
}

/* ---------- 初始化 ---------- */
function init() {
  // 站点信息注入
  document.getElementById("brandTitle").textContent = SITE.title;
  document.getElementById("brandSub").textContent = SITE.subtitle;
  document.getElementById("footerMotto").textContent = "「" + SITE.motto + "」";
  document.getElementById("footerAuthor").textContent = SITE.author;
  document.getElementById("footerYear").textContent = new Date().getFullYear();
  document.title = SITE.title + " · " + SITE.subtitle;

  // marked 配置
  if (window.marked) {
    marked.setOptions({ breaks: false, gfm: true });
  }

  // 移动端菜单
  document.getElementById("navToggle").addEventListener("click", () =>
    document.getElementById("mainNav").classList.toggle("open")
  );

  // 顶部常驻搜索框：回车即搜
  const gs = document.getElementById("globalSearch");
  if (gs) {
    gs.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const v = gs.value.trim();
        location.hash = "#/search/" + encodeURIComponent(v);
      }
    });
  }

  // header 阴影 & 回到顶部
  const header = document.getElementById("siteHeader");
  const toTop = document.getElementById("toTop");
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 10);
    toTop.classList.toggle("show", y > 400);
  });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  window.addEventListener("hashchange", router);
  router();
}

document.addEventListener("DOMContentLoaded", init);
