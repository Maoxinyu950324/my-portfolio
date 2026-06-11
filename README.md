# 设计师个人作品集网站

> 基于 Astro + Decap CMS + Vercel 的个人作品集网站模板，专为设计师打造。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发预览

```bash
npm run dev
```

打开浏览器访问 `http://localhost:4321`，后台地址为 `http://localhost:4321/admin`。

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产版本

```bash
npm run preview
```

## 配置 CMS 后台

编辑 `public/admin/config.yml`，将 `repo` 字段改为你的 GitHub 用户名和仓库名：

```yaml
backend:
  name: github
  repo: YOUR_GITHUB_USERNAME/my-portfolio   # ← 改这里
  branch: main
```

## 自定义域名

编辑 `astro.config.mjs`，将 `site` 改为你的域名：

```js
export default defineConfig({
  site: 'https://your-domain.com',   // ← 改这里
});
```

## 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入此仓库
3. Vercel 会自动识别 Astro 项目并完成部署

## 项目结构

```
├── src/
│   ├── components/       # UI 组件
│   ├── layouts/          # 页面布局
│   ├── pages/            # 页面路由
│   └── styles/           # 样式文件
├── content/              # 内容文件（Markdown）
│   ├── projects/         # 作品项目
│   └── pages/            # 页面内容
├── public/
│   ├── admin/            # Decap CMS 后台
│   └── images/           # 静态图片
└── astro.config.mjs      # Astro 配置
```

## 添加作品

通过后台添加：访问 `/admin` → 登录 → 作品项目 → New → 填写内容 → Publish

或手动添加：在 `content/projects/` 下创建 Markdown 文件，参考 `sample-project.md` 的格式。
