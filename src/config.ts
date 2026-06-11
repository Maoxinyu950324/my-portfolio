import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface SiteConfig {
  siteName: string;
  siteSubtitle: string;
  siteDescription: string;
  siteKeywords: string;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  footerBg: string;
  bodyFont: string;
  headingFont: string;
  bodyFontSize: number;
  lineHeight: number;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroBtnText: string;
  heroBtnLink: string;
  heroBgImage: string;
  aboutContent: string;
  avatarUrl: string;
  showAvatar: boolean;
  socialLinks: Array<{ platform: string; url: string; label: string }>;
  copyright: string;
  icp: string;
  customCss: string;
  customHead: string;
}

const configPath = resolve(process.cwd(), 'site-config.json');

const defaults: SiteConfig = {
  siteName: '设计作品集',
  siteSubtitle: '',
  siteDescription: '个人设计作品集，展示UI设计、平面设计等创意作品',
  siteKeywords: '设计,作品集,UI设计',
  primaryColor: '#6366f1',
  bgColor: '#ffffff',
  textColor: '#1f2937',
  footerBg: '#1a1a2e',
  bodyFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  headingFont: 'inherit',
  bodyFontSize: 16,
  lineHeight: 1.8,
  heroTitle: "Hi, I'm Designer",
  heroSubtitle: '用设计创造价值',
  heroDescription: '',
  heroBtnText: '查看我的作品',
  heroBtnLink: '/projects',
  heroBgImage: '',
  aboutContent: '',
  avatarUrl: '',
  showAvatar: true,
  socialLinks: [],
  copyright: `© ${new Date().getFullYear()} 设计作品集. All rights reserved.`,
  icp: '',
  customCss: '',
  customHead: '',
};

let cached: SiteConfig | null = null;

export function loadSiteConfig(): SiteConfig {
  if (cached) return cached;
  if (existsSync(configPath)) {
    try {
      const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
      cached = { ...defaults, ...raw };
      return cached;
    } catch {}
  }
  cached = defaults;
  return cached;
}

/** 把 hex 颜色转成 RGB 分量，用于生成 CSS 变量色阶 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

/** 生成品牌色 CSS 变量 */
export function generateColorVars(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '';
  const { r, g, b } = rgb;
  return `
    --color-brand-50: rgb(${r}, ${g}, ${b}, 0.05);
    --color-brand-100: rgb(${r}, ${g}, ${b}, 0.1);
    --color-brand-200: rgb(${r}, ${g}, ${b}, 0.2);
    --color-brand-300: rgb(${r}, ${g}, ${b}, 0.4);
    --color-brand-400: rgb(${r}, ${g}, ${b}, 0.6);
    --color-brand-500: rgb(${r}, ${g}, ${b}, 0.8);
    --color-brand-600: rgb(${r}, ${g}, ${b}, 0.9);
    --color-brand-700: rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)});
    --color-brand-800: rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)});
    --color-brand-900: rgb(${Math.max(0, r - 90)}, ${Math.max(0, g - 90)}, ${Math.max(0, b - 90)});
  `;
}
