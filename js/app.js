/* ============================================================
   读书笔记博客 · 应用逻辑（hash 路由 SPA）
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
      <span class="hero-eyebrow">📖 读书 · 成长 · 认知升级</span>
      <h1>把读过的书，<br/>沉淀成<span class="hl">自己的认知</span></h1>
      <p class="lead">${esc(SITE.bio)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#/booklist">逛精选书单 →</a>
      </div>
      <div class="hero-stats">
        <div class="stat"><strong>${listCount}</strong><span>本精选好书</span></div>
        <div class="stat"><strong>${totalNotes}</strong><span>条热门笔记</span></div>
      </div>
    </div>
  </section>

  <section class="section wrap" style="background:var(--card);border-radius:var(--radius);padding:48px 28px;margin:0 auto;max-width:calc(var(--wrap) - 20px);box-shadow:var(--shadow)">
    <div class="section-head" style="text-align:center">
      <span class="eyebrow">Curated List</span>
      <h2 class="gradient-title">精选书单</h2>
      <p style="margin:10px auto 0">${listCount} 本精选好书，按主题分类，每本附一句推荐理由。</p>
    </div>
    <div class="bl-grid stagger" id="homeBlGrid"></div>
    <div style="text-align:center;padding-top:24px">
      <a class="btn btn-primary" href="#/booklist">查看全部 ${listCount} 本书 →</a>
    </div>
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
      <h2>读书列表</h2>
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
  return `
  <section class="section wrap fade-in">
    <div class="crumb"><a href="#/books">读书列表</a><span>›</span>${esc(b.title)}</div>

    <div class="book-cover" style="${coverStyle(b)}; height:auto; border-radius:16px; padding:32px; margin-bottom:32px; box-shadow:var(--shadow-lg);">
      <span class="bc-emoji" style="font-size:72px">${b.cover.emoji}</span>
      <span class="bc-meta">
        <span class="bc-title" style="font-size:30px">${esc(b.title)}</span>
        ${b.subtitle ? `<span class="bc-author" style="font-size:15px;opacity:.95">${esc(b.subtitle)}</span>` : ""}
        <span class="bc-author" style="margin-top:6px">${esc(b.author)} · ${cat ? cat.name : ""} · ${b.status}</span>
        <span class="stars" style="color:#fff;margin-top:10px;display:block">${stars(b.rating)}</span>
      </span>
    </div>

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
      <div class="crumb">
        <a href="#/books">读书列表</a><span>›</span>
        <a href="#/book/${b.id}">${esc(b.title)}</a><span>›</span>笔记
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
        <div class="about-avatar">📖</div>
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

function bookListItem(b, i) {
  const catChips = (b.categories || []).map((c) => `<span class="bl-cat">${esc(c)}</span>`).join("");
  const diff = "●".repeat(b.difficulty || 0) + "○".repeat(5 - (b.difficulty || 0));
  const wr = findWrBook(b.title);
  const wrN = wr && wr.notes ? wr.notes.length : 0;
  const badges = [];
  if (wrN > 0) badges.push(`<span class="bl-badge wr">📒 热门笔记 ${wrN} 条</span>`);
  if (b.link) badges.push(`<span class="bl-badge gzh">🔗 有解读</span>`);
  const linkBtn = b.link
    ? `<a class="bl-link" href="${esc(b.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">读解读 →</a>`
    : "";
  return `
    <article class="bl-card" onclick="location.hash='#/blbook/${i}'">
      <div class="bl-head">
        <h3 class="bl-title">${esc(b.title)}</h3>
        <span class="bl-score">${stars(b.score || 0)}</span>
      </div>
      <div class="bl-author">${esc(b.author || "佚名")}</div>
      <div class="bl-cats">${catChips}</div>
      <p class="bl-recommend">${esc(b.recommend || "")}</p>
      ${badges.length ? `<div class="bl-badges">${badges.join("")}</div>` : ""}
      <div class="bl-foot">
        <span class="bl-diff">阅读难度 ${diff}</span>
        ${linkBtn}
      </div>
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
      <h2 class="gradient-title">精选书单</h2>
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
  const render = (cat) => {
    const list = cat === "all" ? BOOK_LIST : BOOK_LIST.filter((b) => (b.categories || []).includes(cat));
    if (!list.length) { grid.innerHTML = emptyBlock("这个分类下还没有书"); if (pager) pager.innerHTML = ""; return; }
    if (list.length <= 24) { grid.innerHTML = list.map((b, i) => bookListItem(b, i)).join(""); if (pager) pager.innerHTML = ""; return; }
    mountPaged(grid, pager, list.map((b, i) => bookListItem(b, i)), 24);
  };
  render("all");
  bar.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    bar.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    render(chip.dataset.cat);
  });
}

/* 飞书书单 → 单本书聚合页：推荐语 + 公众号链接 + 微信读书笔记 */
function viewBlBook(i) {
  const b = (typeof BOOK_LIST !== "undefined" && BOOK_LIST[i]) || null;
  if (!b) return notFound();
  const catChips = (b.categories || []).map((c) => `<span class="bl-cat">${esc(c)}</span>`).join("");
  const diff = "●".repeat(b.difficulty || 0) + "○".repeat(5 - (b.difficulty || 0));
  const isGzh = /mp\.weixin\.qq\.com/.test(b.link || "");
  const linkBtn = b.link
    ? `<a class="bl-gzh-btn" href="${esc(b.link)}" target="_blank" rel="noopener">${isGzh ? "📱 读我的公众号解读 →" : "📄 读我的飞书笔记 →"}</a>`
    : "";
  const wr = findWrBook(b.title);
  const wrNotes = wr && wr.notes ? sortNotesForDisplay(wr.notes) : [];
  const wrSection = wrNotes.length
    ? `<div class="section-head" style="margin-top:44px;margin-bottom:20px">
         <h2 style="font-size:22px">热门笔记 · ${wrNotes.length} 条</h2>
       </div>
       <div class="note-list">${wrNotes.map((n) => noteItem({ ...n, book: wr })).join("")}</div>`
    : `<div class="section-head" style="margin-top:44px;margin-bottom:20px">
         <h2 style="font-size:22px">热门笔记</h2>
       </div>
       ${emptyBlock("这本书还没有笔记～")}`;

  // 热门划线补充（来自全站用户热门划线）
  let hmSection = "";
  if (typeof HOT_MARKS !== "undefined") {
    const hm = HOT_MARKS.find(h => h.userTitle === b.title || b.title.includes(h.userTitle) || (h.foundTitle && h.foundTitle === b.title));
    if (hm && hm.marks && hm.marks.length) {
      hmSection = `
      <div class="section-head" style="margin-top:44px;margin-bottom:20px">
        <h2 style="font-size:22px">🔥 热门划线推荐 · 全站 ${hm.marks.length} 条</h2>
        <p class="bl-hm-desc" style="color:#888;font-size:13px;margin-top:4px">来自全站读者的热门划线，按热度排序</p>
      </div>
      <div class="bl-hm-list">${hm.marks.map(m => `
        <article class="note-item bl-hm-item">
          <div class="note-body">${esc(m.text)}</div>
          <div class="note-meta"><span>👥 ${m.count} 人划线</span></div>
        </article>`).join("")}</div>`;
    }
  }
  return `
  <section class="section wrap fade-in">
    <div class="crumb"><a href="#/booklist">精选书单</a><span>›</span>${esc(b.title)}</div>
    <div class="bl-detail-hero">
      <h1>${esc(b.title)}</h1>
      <div class="bl-detail-meta">
        <span>${esc(b.author || "佚名")}</span>
        <span class="bl-score">${stars(b.score || 0)}</span>
        <span>阅读难度 ${diff}</span>
      </div>
      <div class="bl-cats">${catChips}</div>
    </div>
    <div class="bl-rec-block">
      <div class="bl-rec-label">为什么推荐这本书</div>
      <p class="bl-recommend-full">${esc(b.recommend || "（暂无推荐语）")}</p>
    </div>
    ${linkBtn ? `<div class="bl-gzh-wrap">${linkBtn}</div>` : ""}
    ${wrSection}
    ${hmSection}
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
      case "books":       html = viewBooks(); route = "books"; break;
      case "categories":  location.hash = "#/booklist"; return;
      case "category":    location.hash = "#/booklist"; return;
      case "tags":        location.hash = "#/"; return;
      case "tag":         location.hash = "#/"; return;
      case "book":        html = viewBook(parts[1]); route = "book"; break;
      case "note":        html = viewNote(parts[1]); route = "note"; break;
      case "booklist":    html = viewBookList(); route = "booklist"; break;
      case "blbook":      html = viewBlBook(parseInt(parts[1], 10)); route = "blbook"; break;
      case "about":       html = viewAbout(); route = "about"; break;
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
  if (route === "books") { bindBookFilter(); initBooks(); }
  if (route === "category") initCategory();
  if (route === "tag") initTag();
  if (route === "book") initBook();
  if (route === "booklist") initBookList();

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
