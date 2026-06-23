/**
 * 模板引擎 — 将简历数据渲染为 Markdown
 */

import { Resume, ProjectEntry, WorkEntry, EducationEntry, SkillSection, ResumeLang } from '../types';

export class TemplateEngine {
  /**
   * 将简历数据渲染为 Markdown
   */
  render(resume: Resume): string {
    if (resume.lang === 'en') {
      return this.renderEn(resume);
    }
    return this.renderZh(resume);
  }

  /**
   * 渲染中文简历
   */
  private renderZh(r: Resume): string {
    const sections: string[] = [];

    // 标题
    sections.push(`# ${r.personalInfo.name}${r.personalInfo.title ? ' — ' + r.personalInfo.title : ''}\n`);

    // 联系方式
    const contacts = this.buildContacts(r, 'zh');
    if (contacts) sections.push(contacts);

    // 个人简介
    if (r.personalInfo.summary) {
      sections.push(`## 个人简介\n\n${r.personalInfo.summary}\n`);
    }

    // 技能清单
    if (r.skills.length > 0) {
      sections.push('## 技能清单\n');
      for (const s of r.skills) {
        sections.push(`**${s.category}**: ${s.skills.join('、')}\n`);
      }
    }

    // 工作经历
    if (r.workExperience.length > 0) {
      sections.push('## 工作经历\n');
      for (const w of r.workExperience) {
        sections.push(this.renderWorkZh(w));
      }
    }

    // 项目经历
    if (r.projects.length > 0) {
      sections.push('## 项目经历\n');
      for (const p of r.projects) {
        sections.push(this.renderProjectZh(p));
      }
    }

    // 教育背景
    if (r.education.length > 0) {
      sections.push('## 教育背景\n');
      for (const e of r.education) {
        sections.push(this.renderEducationZh(e));
      }
    }

    return sections.join('\n');
  }

  /**
   * 渲染英文简历
   */
  private renderEn(r: Resume): string {
    const sections: string[] = [];

    sections.push(`# ${r.personalInfo.name}${r.personalInfo.title ? ' — ' + r.personalInfo.title : ''}\n`);

    const contacts = this.buildContacts(r, 'en');
    if (contacts) sections.push(contacts);

    if (r.personalInfo.summary) {
      sections.push(`## Summary\n\n${r.personalInfo.summary}\n`);
    }

    if (r.skills.length > 0) {
      sections.push('## Skills\n');
      for (const s of r.skills) {
        sections.push(`**${s.category}**: ${s.skills.join(', ')}\n`);
      }
    }

    if (r.workExperience.length > 0) {
      sections.push('## Work Experience\n');
      for (const w of r.workExperience) {
        sections.push(this.renderWorkEn(w));
      }
    }

    if (r.projects.length > 0) {
      sections.push('## Projects\n');
      for (const p of r.projects) {
        sections.push(this.renderProjectEn(p));
      }
    }

    if (r.education.length > 0) {
      sections.push('## Education\n');
      for (const e of r.education) {
        sections.push(this.renderEducationEn(e));
      }
    }

    return sections.join('\n');
  }

  // ==================== 中文渲染 ====================

  private renderWorkZh(w: WorkEntry): string {
    const lines: string[] = [];
    lines.push(`### ${w.company} | ${w.title}`);
    lines.push(`*${w.period}*\n`);
    if (w.description) lines.push(`${w.description}\n`);
    for (const p of w.projects) {
      lines.push(this.renderProjectZh(p, true));
    }
    return lines.join('\n');
  }

  private renderProjectZh(p: ProjectEntry, isSub: boolean = false): string {
    const lines: string[] = [];
    const prefix = isSub ? '####' : '###';
    lines.push(`${prefix} ${p.name} — ${p.role}`);
    if (p.period) lines.push(`*${p.period}*\n`);
    if (p.description) lines.push(`${p.description}\n`);
    if (p.techStack.length) lines.push(`**技术栈**: ${p.techStack.join('、')}\n`);
    if (p.responsibilities.length) {
      lines.push('**主要职责**:');
      for (const r of p.responsibilities) lines.push(`- ${r}`);
      lines.push('');
    }
    if (p.achievements.length) {
      lines.push('**项目亮点**:');
      for (const a of p.achievements) lines.push(`- ${a}`);
      lines.push('');
    }
    return lines.join('\n');
  }

  private renderEducationZh(e: EducationEntry): string {
    const lines: string[] = [];
    lines.push(`### ${e.school} | ${e.degree} — ${e.major}`);
    lines.push(`*${e.period}*\n`);
    if (e.gpa) lines.push(`GPA: ${e.gpa}\n`);
    if (e.highlights?.length) {
      for (const h of e.highlights) lines.push(`- ${h}`);
    }
    return lines.join('\n');
  }

  // ==================== 英文渲染 ====================

  private renderWorkEn(w: WorkEntry): string {
    const lines: string[] = [];
    lines.push(`### ${w.company} | ${w.title}`);
    lines.push(`*${w.period}*\n`);
    if (w.description) lines.push(`${w.description}\n`);
    for (const p of w.projects) {
      lines.push(this.renderProjectEn(p, true));
    }
    return lines.join('\n');
  }

  private renderProjectEn(p: ProjectEntry, isSub: boolean = false): string {
    const lines: string[] = [];
    const prefix = isSub ? '####' : '###';
    lines.push(`${prefix} ${p.name} — ${p.role}`);
    if (p.period) lines.push(`*${p.period}*\n`);
    if (p.description) lines.push(`${p.description}\n`);
    if (p.techStack.length) lines.push(`**Tech Stack**: ${p.techStack.join(', ')}\n`);
    if (p.responsibilities.length) {
      lines.push('**Responsibilities**:');
      for (const r of p.responsibilities) lines.push(`- ${r}`);
      lines.push('');
    }
    if (p.achievements.length) {
      lines.push('**Highlights**:');
      for (const a of p.achievements) lines.push(`- ${a}`);
      lines.push('');
    }
    return lines.join('\n');
  }

  private renderEducationEn(e: EducationEntry): string {
    const lines: string[] = [];
    lines.push(`### ${e.school} | ${e.degree} in ${e.major}`);
    lines.push(`*${e.period}*\n`);
    if (e.gpa) lines.push(`GPA: ${e.gpa}\n`);
    if (e.highlights?.length) {
      for (const h of e.highlights) lines.push(`- ${h}`);
    }
    return lines.join('\n');
  }

  // ==================== 工具方法 ====================

  private buildContacts(r: Resume, lang: 'zh' | 'en'): string {
    const parts: string[] = [];
    const p = r.personalInfo;
    if (p.email) parts.push(`📧 ${p.email}`);
    if (p.phone) parts.push(`📱 ${p.phone}`);
    if (p.location) parts.push(`📍 ${p.location}`);
    if (p.website) parts.push(`🌐 ${p.website}`);
    if (p.github) parts.push(`💻 ${p.github}`);
    if (p.linkedin) parts.push(`🔗 ${p.linkedin}`);

    if (parts.length === 0) return '';
    return parts.join(' | ') + '\n';
  }
}
