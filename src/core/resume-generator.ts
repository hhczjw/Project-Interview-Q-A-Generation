/**
 * 简历生成器 — 基于项目分析结果 + AI Prompt 生成简历内容
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ProjectAnalysis, Resume, ResumeLang, TemplateStyle,
  PersonalInfo, ProjectEntry, SkillSection,
} from '../types';
import { ResumeManager } from './resume-manager';

export interface GenerateOptions {
  lang: ResumeLang;
  template: TemplateStyle;
  targetRole?: string;
  personalInfo?: Partial<PersonalInfo>;
  manager?: ResumeManager;
}

export class ResumeGenerator {
  private promptDir: string;

  constructor(promptDir?: string) {
    this.promptDir = promptDir || path.join(__dirname, '..', 'prompts');
  }

  /**
   * 基于项目分析结果生成简历数据
   * 返回 AI 可直接使用的 Prompt，由 AI 平台完成实际生成
   */
  generatePrompt(analysis: ProjectAnalysis, options: GenerateOptions): string {
    const template = this.loadTemplate(options.template, options.lang);
    const prompt = this.loadPrompt('generate-resume');

    return this.interpolate(prompt, {
      '{{PROJECT_NAME}}': analysis.name,
      '{{PROJECT_DESC}}': analysis.description,
      '{{TECH_STACK}}': this.formatTechStack(analysis.techStack),
      '{{ARCHITECTURE}}': analysis.architecture,
      '{{FEATURES}}': analysis.features.map(f => `- ${f}`).join('\n'),
      '{{HIGHLIGHTS}}': analysis.highlights.map(h => `- ${h}`).join('\n'),
      '{{GIT_STATS}}': analysis.gitContribution
        ? `${analysis.gitContribution.totalCommits} 次提交, +${analysis.gitContribution.linesAdded}/-${analysis.gitContribution.linesDeleted} 行`
        : '无 Git 数据',
      '{{DIRECTORY_STRUCTURE}}': analysis.directoryStructure,
      '{{TARGET_ROLE}}': options.targetRole || '未指定',
      '{{LANG}}': options.lang === 'en' ? 'English' : options.lang === 'zh' ? '中文' : '中英双语',
      '{{TEMPLATE}}': template,
      '{{PERSONAL_INFO}}': options.personalInfo
        ? JSON.stringify(options.personalInfo, null, 2)
        : '需要用户填写',
    });
  }

  /**
   * 直接从分析结果生成简历结构化数据（不含 AI 生成内容）
   */
  generateDraft(analysis: ProjectAnalysis, options: GenerateOptions): Partial<Resume> {
    const projects: ProjectEntry[] = [{
      name: analysis.name,
      role: options.targetRole || '开发工程师',
      period: analysis.gitContribution
        ? `${analysis.gitContribution.firstCommitDate?.split(' ')[0] || ''} - ${analysis.gitContribution.lastCommitDate?.split(' ')[0] || ''}`
        : '',
      description: analysis.description,
      techStack: [
        ...analysis.techStack.languages,
        ...analysis.techStack.frameworks,
        ...analysis.techStack.databases,
      ],
      responsibilities: analysis.features.slice(0, 5),
      achievements: analysis.highlights,
    }];

    const skills: SkillSection[] = this.groupSkills(analysis.techStack);

    return {
      lang: options.lang,
      template: options.template,
      targetRole: options.targetRole,
      personalInfo: options.personalInfo ? { ...this.emptyPersonalInfo(), ...options.personalInfo } : this.emptyPersonalInfo(),
      workExperience: [],
      projects,
      education: [],
      skills,
    };
  }

  /**
   * 生成优化内容的 Prompt（用于 AI 迭代优化简历）
   */
  generateOptimizePrompt(resume: Resume, feedback: string): string {
    const prompt = this.loadPrompt('optimize-content');
    return this.interpolate(prompt, {
      '{{RESUME_JSON}}': JSON.stringify(resume, null, 2),
      '{{USER_FEEDBACK}}': feedback,
      '{{LANG}}': resume.lang === 'en' ? 'English' : resume.lang === 'zh' ? '中文' : '中英双语',
    });
  }

  // ==================== 内部方法 ====================

  private loadTemplate(style: TemplateStyle, lang: ResumeLang): string {
    const langSuffix = lang === 'en' ? 'en' : 'zh';
    const templateFile = `${style}-${langSuffix}.md`;
    const templatePath = path.join(__dirname, '..', 'templates', templateFile);

    // 尝试加载指定模板，fallback 到默认
    const fallbackPath = path.join(__dirname, '..', 'templates', `default-${langSuffix}.md`);

    const filePath = fs.existsSync(templatePath) ? templatePath : fallbackPath;

    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return this.builtinTemplate(lang);
    }
  }

  private loadPrompt(name: string): string {
    const promptPath = path.join(this.promptDir, `${name}.md`);
    try {
      return fs.readFileSync(promptPath, 'utf-8');
    } catch {
      return this.builtinPrompt(name);
    }
  }

  private formatTechStack(techStack: ProjectAnalysis['techStack']): string {
    const lines: string[] = [];
    if (techStack.languages.length) lines.push(`语言: ${techStack.languages.join(', ')}`);
    if (techStack.frameworks.length) lines.push(`框架: ${techStack.frameworks.join(', ')}`);
    if (techStack.databases.length) lines.push(`数据库: ${techStack.databases.join(', ')}`);
    if (techStack.middleware.length) lines.push(`中间件: ${techStack.middleware.join(', ')}`);
    if (techStack.devOps.length) lines.push(`DevOps: ${techStack.devOps.join(', ')}`);
    if (techStack.testing.length) lines.push(`测试: ${techStack.testing.join(', ')}`);
    return lines.join('\n');
  }

  private groupSkills(techStack: ProjectAnalysis['techStack']): SkillSection[] {
    const sections: SkillSection[] = [];

    if (techStack.languages.length) {
      sections.push({ category: '编程语言', skills: techStack.languages, proficiency: 'proficient' });
    }
    if (techStack.frameworks.length) {
      sections.push({ category: '框架', skills: techStack.frameworks, proficiency: 'proficient' });
    }
    if (techStack.databases.length) {
      sections.push({ category: '数据库', skills: techStack.databases, proficiency: 'familiar' });
    }
    if (techStack.middleware.length) {
      sections.push({ category: '中间件', skills: techStack.middleware, proficiency: 'familiar' });
    }
    if (techStack.devOps.length) {
      sections.push({ category: 'DevOps', skills: techStack.devOps, proficiency: 'familiar' });
    }
    if (techStack.testing.length) {
      sections.push({ category: '测试', skills: techStack.testing, proficiency: 'familiar' });
    }

    return sections;
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    return result;
  }

  private emptyPersonalInfo(): PersonalInfo {
    return { name: '', title: '', summary: '' };
  }

  private builtinTemplate(lang: ResumeLang): string {
    if (lang === 'en') {
      return `# {{NAME}} - {{TITLE}}

## Summary
{{SUMMARY}}

## Skills
{{SKILLS}}

## Work Experience
{{WORK_EXPERIENCE}}

## Projects
{{PROJECTS}}

## Education
{{EDUCATION}}`;
    }
    return `# {{NAME}} - {{TITLE}}

## 个人简介
{{SUMMARY}}

## 技能清单
{{SKILLS}}

## 工作经历
{{WORK_EXPERIENCE}}

## 项目经历
{{PROJECTS}}

## 教育背景
{{EDUCATION}}`;
  }

  private builtinPrompt(name: string): string {
    if (name === 'generate-resume') {
      return `你是一个专业的简历撰写顾问。请根据以下项目分析结果，生成一份高质量的简历内容。

## 项目信息
- 项目名称: {{PROJECT_NAME}}
- 项目描述: {{PROJECT_DESC}}
- 技术栈:
{{TECH_STACK}}
- 架构类型: {{ARCHITECTURE}}
- 主要功能:
{{FEATURES}}
- 项目亮点:
{{HIGHLIGHTS}}
- Git 统计: {{GIT_STATS}}

## 目标岗位: {{TARGET_ROLE}}
## 输出语言: {{LANG}}

## 简历模板
{{TEMPLATE}}

## 个人信息
{{PERSONAL_INFO}}

请按照模板格式，用专业的语言重写简历内容。要求：
1. 使用 STAR 法则描述项目经历（情境-任务-行动-结果）
2. 量化成果（性能提升百分比、代码量、用户数等）
3. 突出技术深度和解决问题的能力
4. 语言简洁有力，避免冗余
5. 根据目标岗位调整侧重点`;
    }

    if (name === 'optimize-content') {
      return `你是一个简历优化专家。请根据用户反馈优化以下简历内容。

## 当前简历
{{RESUME_JSON}}

## 用户反馈
{{USER_FEEDBACK}}

## 输出语言: {{LANG}}

请根据反馈进行针对性优化，保持 JSON 格式不变，返回优化后的完整简历数据。`;
    }

    return '';
  }
}
