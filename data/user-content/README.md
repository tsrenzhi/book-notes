# 读书站 · 内容维护说明（自维护指南）

> 这个目录里放的是**你自己补充的内容**——不是"我"（AI）替你做的总结。
> 设计目标：你以后有了新灵感、新方法、新分类，可以**零学习成本地自己加进来**，不用每次找 AI 重新写。

---

## 怎么加一条新方法

### 方式 A：找 AI 帮你加（最省事）

跟我说一句话就行，比如：
- "在执行力那一栏加第 6 条：'把大目标拆成 5 分钟能做完的小任务'"
- "新建一个 `time-management.json'，列 5 个时间管理的方法"
- "改一下执行力的第 3 条，把'完美主义'那段换掉"

AI 会自动：
1. 在 `data/user-content/{节点id}.json` 里加上/改掉
2. 部署到线上
3. 给你个链接验证

### 方式 B：自己在 GitHub 网页上改（自己掌握）

1. 打开 https://github.com/tsrenzhi/book-notes/tree/main/data/user-content
2. 找到要改的文件（比如 `executive.json`），点进去
3. 右上角铅笔图标 → 直接编辑 JSON
4. 改完点 "Commit changes" → 自动部署
5. 等 1-2 分钟访问线上

⚠️ **JSON 语法要点**（改错会导致整个板块空白）：
- 字符串用双引号 `"..."` 包裹
- 内部引号用 `\"` 或换成中文「」
- 每行末尾有逗号 `,`（最后一行除外）
- 缩进用 2 或 4 个空格
- 不确定就复制现有条目改个标题，**结构别动**

---

## 怎么新建一个节点（比如「时间管理」「亲密关系」）

跟我说："加个新节点叫'时间管理'，挂 3 本书"。

或者手动：
1. 复制 `executive.json` 改名为 `{节点id}.json`（id 英文短词，比如 `time-management`）
2. 改 `nodeId` / `nodeTitle` / `sectionTitle` / `items`
3. 跟我说"在 `js/knowledge.js` 里挂上这个新节点"

---

## 文件命名约定

| 文件 | 说明 |
|---|---|
| `executive.json` | 对应节点 ID = `executive`（执行力） |
| `procrastination.json` | 对应节点 ID = `procrastination`（拖延症） |
| `time-management.json` | 以后新建的时间管理节点 |

节点 ID 必须在 `js/knowledge.js` 里登记过才能挂上，否则只显示 fallback。

---

## 版本与回滚

每次改动都会自动 commit 到 Git，GitHub 上能看到历史版本：
https://github.com/tsrenzhi/book-notes/commits/main/data/user-content

加坏了就点 "Revert" 一键回滚。

---

## 长期方向

未来会让这块更自动化：
- [ ] 网站里加一个"我的笔记"页面（不依赖 AI，直接在浏览器写）
- [ ] 笔记自动按主题归档（AI 辅助分类）
- [ ] 多次重读记录（同一本书不同时间的感受分层）
- [ ] 一键导出全部个人内容（变成你自己的知识库备份）

但当前这版（v36）已经够用：**你想加东西，不用每次问 AI 怎么搞——自己改 JSON 就行，或者一句话让我加。**
