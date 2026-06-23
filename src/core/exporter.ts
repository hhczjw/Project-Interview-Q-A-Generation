/**
 * 导出器 — 将简历导出为 Markdown / PDF / Word 格式
 */

import * as fs from 'fs';
import * as path from 'path';
import { Resume, ExportFormat, ExportOptions, ResumeLang } from '../types';
import { TemplateEngine } from './template-engine';

export class Exporter {
  private engine: TemplateEngine;

  constructor() {
    this.engine = new TemplateEngine();
  }

  /**
   * 导出简历
   */
  async export(resume: Resume, options: ExportOptions): Promise<string> {
    const outputDir = options.outputPath || path.join(process.cwd(), 'data', 'exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const baseName = `${resume.personalInfo.name || 'resume'}_${resume.lang}_${Date.now()}`;

    switch (options.format) {
      case 'markdown':
        return this.exportMarkdown(resume, outputDir, baseName);
      case 'pdf':
        return this.exportPDF(resume, outputDir, baseName);
      case 'word':
        return this.exportWord(resume, outputDir, baseName);
      default:
        throw new Error(`不支持的导出格式: ${options.format}`);
    }
  }

  /**
   * 导出为 Markdown
   */
  private exportMarkdown(resume: Resume, outputDir: string, baseName: string): string {
    const content = this.engine.render(resume);
    const filePath = path.join(outputDir, `${baseName}.md`);
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  }

  /**
   * 导出为 PDF（使用 puppeteer）
   */
  private async exportPDF(resume: Resume, outputDir: string, baseName: string): Promise<string> {
    const markdown = this.engine.render(resume);
    const html = this.markdownToHTML(markdown, resume.lang, resume.template);

    const filePath = path.join(outputDir, `${baseName}.pdf`);

    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: filePath,
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true,
      });
      await browser.close();
    } catch (err) {
      // Fallback: 输出 HTML 并提示用户手动转换
      const htmlPath = path.join(outputDir, `${baseName}.html`);
      fs.writeFileSync(htmlPath, html, 'utf-8');
      console.log(`⚠️  PDF 生成需要 puppeteer，已导出 HTML 格式: ${htmlPath}`);
      return htmlPath;
    }

    return filePath;
  }

  /**
   * 导出为 Word（使用 docx 库）
   */
  private async exportWord(resume: Resume, outputDir: string, baseName: string): Promise<string> {
    const filePath = path.join(outputDir, `${baseName}.docx`);

    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

      const children = this.buildDocxParagraphs(resume, { Document, Paragraph, TextRun, HeadingLevel });

      const doc = new Document({
        sections: [{
          properties: {},
          children,
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filePath, buffer);
    } catch (err) {
      // Fallback: 输出 Markdown
      console.log(`⚠️  Word 生成需要 docx 库，已导出 Markdown 格式`);
      return this.exportMarkdown(resume, outputDir, baseName);
    }

    return filePath;
  }

  /**
   * 构建 Word 文档段落
   */
  private buildDocxParagraphs(r: Resume, libs: any): any[] {
    const { Paragraph, TextRun, HeadingLevel } = libs;
    const paragraphs: any[] = [];

    // 标题
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: r.personalInfo.name, bold: true, size: 32 })],
      heading: HeadingLevel.HEADING_1,
    }));

    if (r.personalInfo.title) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: r.personalInfo.title, size: 24, color: '666666' })],
      }));
    }

    // 联系方式
    const contacts: string[] = [];
    if (r.personalInfo.email) contacts.push(r.personalInfo.email);
    if (r.personalInfo.phone) contacts.push(r.personalInfo.phone);
    if (r.personalInfo.location) contacts.push(r.personalInfo.location);
    if (contacts.length) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: contacts.join(' | '), size: 20 })],
      }));
    }

    // 个人简介
    if (r.personalInfo.summary) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: r.lang === 'en' ? 'Summary' : '个人简介', bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_2,
      }));
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: r.personalInfo.summary, size: 22 })],
      }));
    }

    // 技能
    if (r.skills.length) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: r.lang === 'en' ? 'Skills' : '技能清单', bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_2,
      }));
      for (const s of r.skills) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({ text: `${s.category}: `, bold: true, size: 22 }),
            new TextRun({ text: s.skills.join(r.lang === 'en' ? ', ' : '、'), size: 22 }),
          ],
        }));
      }
    }

    // 项目经历
    if (r.projects.length) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: r.lang === 'en' ? 'Projects' : '项目经历', bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_2,
      }));
      for (const p of r.projects) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: `${p.name} — ${p.role}`, bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_3,
        }));
        if (p.description) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: p.description, size: 22 })],
          }));
        }
        for (const resp of p.responsibilities) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: `• ${resp}`, size: 22 })],
          }));
        }
        for (const ach of p.achievements) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: `★ ${ach}`, size: 22, color: '2E7D32' })],
          }));
        }
      }
    }

    return paragraphs;
  }

  /**
   * Markdown 转 HTML（带模板样式）
   */
  private markdownToHTML(markdown: string, lang: ResumeLang, templateStyle: string = 'default'): string {
    // 简单的 Markdown 转 HTML
    let html = markdown
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    const css = this.getTemplateCSS(templateStyle);

    return `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'zh-CN'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>简历</title>
  <style>${css}</style>
</head>
<body><p>${html}</p></body>
</html>`;
  }

  /**
   * 获取模板对应的 CSS 样式
   */
  private getTemplateCSS(style: string): string {
    const base = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6; }
      ul { padding-left: 20px; }
      li { margin-bottom: 4px; }
      em { color: #666; }
      hr { border: none; border-top: 1px solid #eee; margin: 20px 0; }
      blockquote { border-left: 3px solid #2196F3; padding-left: 12px; color: #555; margin: 8px 0; }
      code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
    `;

    const themes: Record<string, string> = {
      default: `
        ${base}
        h1 { color: #1a1a1a; border-bottom: 2px solid #2196F3; padding-bottom: 8px; }
        h2 { color: #1976D2; margin-top: 24px; }
        h3 { color: #333; }
        strong { color: #1a1a1a; }
      `,

      professional: `
        ${base}
        body { border-top: 4px solid #1a237e; }
        h1 { color: #1a237e; font-size: 2em; margin-bottom: 4px; }
        h2 { color: #1a237e; border-bottom: 2px solid #e8eaf6; padding-bottom: 6px; margin-top: 28px; }
        h3 { color: #283593; }
        strong { color: #1a237e; }
        a { color: #1565c0; }
      `,

      creative: `
        ${base}
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0; }
        body > p { background: white; max-width: 800px; margin: 30px auto; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); }
        h1 { background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 2.2em; }
        h2 { color: #667eea; border-bottom: 2px solid #e8eaf6; }
        h3 { color: #764ba2; }
        strong { color: #667eea; }
        li::marker { color: #764ba2; }
      `,

      minimal: `
        ${base}
        body { font-weight: 300; color: #2d2d2d; }
        h1 { font-weight: 600; font-size: 2em; letter-spacing: -0.5px; }
        h2 { font-weight: 500; color: #555; font-size: 1.1em; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 24px; }
        h3 { font-weight: 500; }
        strong { font-weight: 600; }
        hr { border-top: 1px solid #eee; }
      `,

      tech: `
        ${base}
        body { background: #0d1117; color: #c9d1d9; font-family: 'JetBrains Mono', 'Fira Code', monospace, sans-serif; }
        h1 { color: #58a6ff; }
        h2 { color: #79c0ff; border-bottom: 1px solid #21262d; padding-bottom: 8px; }
        h3 { color: #d2a8ff; }
        strong { color: #58a6ff; }
        a { color: #58a6ff; }
        code { background: #161b22; color: #79c0ff; padding: 2px 8px; border-radius: 6px; border: 1px solid #30363d; }
        blockquote { border-left-color: #58a6ff; color: #8b949e; }
        hr { border-top: 1px solid #21262d; }
        em { color: #8b949e; }
      `,

      'two-column': `
        ${base}
        body { display: grid; grid-template-columns: 250px 1fr; gap: 30px; max-width: 900px; }
        h1 { grid-column: 1 / -1; }
        hr { grid-column: 1 / -1; }
      `,

      academic: `
        ${base}
        body { font-family: 'Times New Roman', 'Noto Serif SC', serif; color: #1a1a1a; }
        h1 { font-size: 1.8em; text-align: center; border-bottom: none; }
        h2 { font-size: 1.2em; border-bottom: 1px solid #999; padding-bottom: 4px; margin-top: 20px; }
        h3 { font-size: 1.05em; font-style: italic; }
        strong { font-weight: 600; }
      `,
    };

    return themes[style] || themes.default;
  }
}
