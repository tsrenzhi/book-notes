# 部署到 GitHub Pages（永久免费网址）

本地仓库已就绪（`wereading-blog-dist/` 目录，含 6 个文件，已 git commit）。
下面只需你做几步，全程免费、永久有效。

---

## 1. 在 GitHub 新建空仓库
- 打开 https://github.com/new
- **Repository name**：填 `book-notes`
  - （想要根域名 `https://你的用户名.github.io/` 的话，仓库名必须严格填 `你的用户名.github.io`）
- 可见性选 **Public**
- **不要**勾选 "Add a README file" / ".gitignore" / "License"（保持空仓库）
- 点 **Create repository**

## 2. 生成访问令牌 PAT（push 时要用来当密码）
- 打开 https://github.com/settings/tokens/new
- Note 填：`wereading-blog`
- Expiration 选 `No expiration`（或自定义时长）
- 勾选 **repo**（展开后全选）
- 拉到底点 **Generate token**
- **复制那串 `ghp_xxx`**（只显示这一次，存好）

## 3. 本地推送到 GitHub
终端粘贴下面命令（把 `你的用户名` / `你的PAT` 换成真实值）：

```bash
cd /Users/zhenghui/WorkBuddy/2026-07-18-23-56-21/wereading-blog-dist
git remote add origin https://github.com/你的用户名/book-notes.git
git branch -M main
git push -u origin main
```

> push 时如果弹窗要输入密码，**填第 2 步的 PAT（不是 GitHub 登录密码）**。
> macOS 会把它存进钥匙串，以后不用再填。

**备选（一行嵌 token，不弹窗）**：
```bash
git remote set-url origin https://你的用户名:你的PAT@github.com/你的用户名/book-notes.git
git push -u origin main
# push 完建议清掉明文 token：
git remote set-url origin https://github.com/你的用户名/book-notes.git
```

## 4. 开启 GitHub Pages
- 进刚建的仓库 → **Settings** → 左侧 **Pages**
- Source 选 **Deploy from a branch**
- Branch 选 **main**，文件夹选 **/ (root)**
- 点 **Save**
- 等 1~2 分钟构建完成

## 5. 访问你的永久网址
- 仓库名 `book-notes` → `https://你的用户名.github.io/book-notes/`
- 根域名仓库 → `https://你的用户名.github.io/`

---

## 以后更新笔记内容
在读书平台新划了笔记/写了想法，让我重新同步 → 生成新 `data.js` 后，
把 `wereading-blog/` 里的文件同步进 `wereading-blog-dist/`，然后：

```bash
cd /Users/zhenghui/WorkBuddy/2026-07-18-23-56-21/wereading-blog-dist
git add -A && git commit -m "更新读书笔记" && git push
```

GitHub Pages 会自动重新构建，不用再手动开。

---

## 临时链接（过渡用）
部署前可继续用 CloudStudio 临时网址：
https://3d3d3b86d0d54748aaf1ffe7238d5dfa.app.codebuddy.work
（注意：沙箱链接可能有时效，正式用请以上面 GitHub Pages 为准）
