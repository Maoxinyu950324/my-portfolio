import express from 'express';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));

// ===== API 路由 =====

// 获取所有作品
app.get('/api/projects', (req, res) => {
  try {
    const projectsDir = join(PROJECT_ROOT, 'content/projects');
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

// 保存作品
app.post('/api/projects/:id', (req, res) => {
  try {
    const { title, description, category, cover, tags, published, date, body, gallery } = req.body;
    
    // 构建 frontmatter
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

// 创建新作品
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

// 删除作品
app.delete('/api/projects/:id', (req, res) => {
  try {
    const filePath = join(PROJECT_ROOT, 'content/projects', `${req.params.id}.md`);
    if (existsSync(filePath)) {
      writeFileSync(filePath, '', 'utf-8');
      // 标记删除：清空内容
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
    res.status(500).json({ error: err.message });
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
