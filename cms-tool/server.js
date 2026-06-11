import express from 'express';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const app = express();
const PORT = 3001;

// 确保上传目录存在
const uploadsDir = join(PROJECT_ROOT, 'public/uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// 配置 multer 图片上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const ext = extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，请上传 JPG/PNG/GIF/WebP/SVG'));
    }
  },
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// ===== 图片上传 API =====
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择图片' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, url, filename: req.file.filename });
});

// 批量上传
app.post('/api/upload-multiple', upload.array('images', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '请选择图片' });
  }
  const urls = req.files.map(f => ({
    url: `/uploads/${f.filename}`,
    filename: f.filename,
  }));
  res.json({ success: true, urls });
});

// 获取已上传图片列表
app.get('/api/images', (req, res) => {
  try {
    const files = readdirSync(uploadsDir).filter(f => {
      const ext = extname(f).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });
    const images = files.map(f => ({
      url: `/uploads/${f}`,
      filename: f,
      size: existsSync(join(uploadsDir, f)) ? 0 : 0,
    })).reverse();
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== 作品 API =====

// 获取所有作品
app.get('/api/projects', (req, res) => {
  try {
    const projectsDir = join(PROJECT_ROOT, 'content/projects');
    if (!existsSync(projectsDir)) mkdirSync(projectsDir, { recursive: true });
    const files = readdirSync(projectsDir).filter(f => f.endsWith('.md'));
    const projects = files.map(file => {
      const content = readFileSync(join(projectsDir, file), 'utf-8');
      const { data, body } = matter(content);
      return {
        id: file.replace('.md', ''),
        title: data.title || '未命名作品',
        description: data.description || '',
        category: data.category || '其他',
        cover: data.cover || '',
        tags: data.tags || [],
        published: data.published !== false,
        date: data.date || new Date().toISOString(),
        body: body || '',
        gallery: data.gallery || [],
      };
    });
    projects.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个作品
app.get('/api/projects/:id', (req, res) => {
  try {
    const filePath = join(PROJECT_ROOT, 'content/projects', `${req.params.id}.md`);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: '作品不存在' });
    }
    const content = readFileSync(filePath, 'utf-8');
    const { data, body } = matter(content);
    res.json({
      id: req.params.id,
      title: data.title || '',
      description: data.description || '',
      category: data.category || '其他',
      cover: data.cover || '',
      tags: data.tags || [],
      published: data.published !== false,
      date: data.date || new Date().toISOString(),
      body: body || '',
      gallery: data.gallery || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建新作品（必须放在 :id 路由之前，避免被 :id 匹配）
app.post('/api/projects', (req, res) => {
  try {
    const { id, title, description, category, body } = req.body;
    const fileId = id || `project-${Date.now()}`;
    const filePath = join(PROJECT_ROOT, 'content/projects', `${fileId}.md`);
    
    if (existsSync(filePath)) {
      return res.status(400).json({ error: '该标识已存在' });
    }
    
    const frontmatter = `---
title: "${title || '新作品'}"
description: "${description || ''}"
category: "${category || '其他'}"
published: true
date: "${new Date().toISOString()}"
---

${body || ''}`;
    
    writeFileSync(filePath, frontmatter, 'utf-8');
    res.json({ success: true, id: fileId, message: '创建成功！' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 保存/编辑作品
app.post('/api/projects/:id', (req, res) => {
  try {
    const { title, description, category, cover, tags, published, date, body, gallery } = req.body;
    
    let frontmatter = '---\n';
    frontmatter += `title: "${title || ''}"\n`;
    frontmatter += `description: "${description || ''}"\n`;
    frontmatter += `category: "${category || '其他'}"\n`;
    if (cover) frontmatter += `cover: "${cover}"\n`;
    frontmatter += `published: ${published !== false}\n`;
    frontmatter += `date: "${date || new Date().toISOString()}"\n`;
    
    if (tags && tags.length > 0) {
      frontmatter += 'tags:\n';
      tags.forEach(tag => { frontmatter += `  - "${tag}"\n`; });
    }
    
    if (gallery && gallery.length > 0) {
      frontmatter += 'gallery:\n';
      gallery.forEach(item => {
        frontmatter += `  - image: "${item.image || ''}"\n`;
        if (item.caption) frontmatter += `    caption: "${item.caption}"\n`;
      });
    }
    
    frontmatter += '---\n\n';
    frontmatter += body || '';
    
    const filePath = join(PROJECT_ROOT, 'content/projects', `${req.params.id}.md`);
    writeFileSync(filePath, frontmatter, 'utf-8');
    
    res.json({ success: true, message: '保存成功！' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除作品
app.delete('/api/projects/:id', (req, res) => {
  try {
    const filePath = join(PROJECT_ROOT, 'content/projects', `${req.params.id}.md`);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    res.json({ success: true, message: '已删除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取页面内容
app.get('/api/pages/:name', (req, res) => {
  try {
    const filePath = join(PROJECT_ROOT, 'content/pages', `${req.params.name}.md`);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: '页面不存在' });
    }
    const content = readFileSync(filePath, 'utf-8');
    const { data, body } = matter(content);
    res.json({ data, body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 保存页面内容
app.post('/api/pages/:name', (req, res) => {
  try {
    const filePath = join(PROJECT_ROOT, 'content/pages', `${req.params.name}.md`);
    const { body, ...fields } = req.body;
    
    let frontmatter = '---\n';
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string') {
        frontmatter += `${key}: "${value}"\n`;
      } else if (typeof value === 'boolean') {
        frontmatter += `${key}: ${value}\n`;
      }
    }
    frontmatter += '---\n\n';
    frontmatter += body || '';
    
    writeFileSync(filePath, frontmatter, 'utf-8');
    res.json({ success: true, message: '保存成功！' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== 网站配置 API =====

// 获取网站配置
app.get('/api/site-config', (req, res) => {
  try {
    const configPath = join(PROJECT_ROOT, 'site-config.json');
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      return res.json(config);
    }
    // 默认配置（字段名与前端 renderSiteConfig 保持一致）
    res.json({
      siteName: '我的作品集',
      siteSubtitle: '',
      siteDescription: '设计师 / 创造美好体验',
      siteKeywords: '设计,作品集,UI设计',
      
      // 主题颜色
      primaryColor: '#6366f1',
      bgColor: '#ffffff',
      textColor: '#1f2937',
      footerBg: '#1a1a2e',
      
      // 字体
      bodyFont: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif',
      headingFont: 'inherit',
      bodyFontSize: 16,
      lineHeight: 1.8,
      
      // 首页 Hero
      heroTitle: 'Hi, 我是设计师',
      heroSubtitle: '创造美好的用户体验',
      heroDescription: '',
      heroBtnText: '查看我的作品',
      heroBtnLink: '#projects',
      heroBgImage: '',
      
      // 关于我
      aboutContent: '',
      avatarUrl: '',
      showAvatar: true,
      
      // 社交链接
      socialLinks: [],
      
      // 页脚
      copyright: '© 2025 版权所有',
      icp: '',
      
      // 高级样式
      customCss: '',
      customHead: '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 保存网站配置
app.post('/api/site-config', (req, res) => {
  try {
    const configPath = join(PROJECT_ROOT, 'site-config.json');
    writeFileSync(configPath, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true, message: '配置已保存！' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 推送到 GitHub
app.post('/api/deploy', async (req, res) => {
  try {
    const simpleGit = (await import('simple-git')).default;
    const git = simpleGit(PROJECT_ROOT);
    
    await git.add('.');
    await git.commit('CMS: 更新内容');
    await git.push('origin', 'main');
    
    res.json({ success: true, message: '已推送到 GitHub，Vercel 将自动部署！' });
  } catch (err) {
    res.status(500).json({ error: `部署失败: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`\n  🎨 本地 CMS 管理工具已启动！`);
  console.log(`  ─────────────────────────────`);
  console.log(`  🌐 打开: http://localhost:${PORT}`);
  console.log(`  📁 项目: ${PROJECT_ROOT}`);
  console.log(`  ─────────────────────────────`);
  console.log(`  ⚠️  编辑完成后，点"部署到网站"按钮推送更新\n`);
});
