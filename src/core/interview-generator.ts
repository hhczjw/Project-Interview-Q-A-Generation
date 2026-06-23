/**
 * 面试问答生成器 — 基于项目分析结果生成资深面试官问答
 *
 * 核心思路：
 * 1. 从项目分析中提取关键技术点、架构决策、亮点
 * 2. 针对每个技术点生成由浅入深的问题链
 * 3. 每个问题包含参考回答、追问、回答要点
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ProjectAnalysis, InterviewQA, InterviewSet, InterviewGenerateOptions,
  QuestionDifficulty, QuestionCategory, ResumeLang,
} from '../types';
import { v4 } from './utils';

export class InterviewGenerator {
  private promptDir: string;

  constructor(promptDir?: string) {
    this.promptDir = promptDir || path.join(__dirname, '..', 'prompts');
  }

  /**
   * 基于项目分析结果生成面试问答的 Prompt
   * 返回给 AI 执行，由 AI 生成具体的问答内容
   */
  generatePrompt(analysis: ProjectAnalysis, options: InterviewGenerateOptions = {}): string {
    const {
      lang = 'zh',
      targetRole,
      questionsPerCategory = 3,
      difficultyRange = ['basic', 'intermediate', 'advanced', 'expert'],
      focusCategories,
    } = options;

    const prompt = this.loadPrompt('generate-interview');
    const allTechs = this.extractAllTechs(analysis);
    const projectHighlights = analysis.highlights.join('\n');
    const techStackStr = this.formatTechStack(analysis);

    // 构建重点关注指令
    const focusInstruction = focusCategories && focusCategories.length > 0
      ? `\n## 重点关注以下类别：\n${focusCategories.map(c => `- ${this.categoryLabel(c)}`).join('\n')}`
      : '';

    return this.interpolate(prompt, {
      '{{PROJECT_NAME}}': analysis.name,
      '{{PROJECT_DESC}}': analysis.description,
      '{{TECH_STACK}}': techStackStr,
      '{{ARCHITECTURE}}': analysis.architecture,
      '{{FEATURES}}': analysis.features.map(f => `- ${f}`).join('\n'),
      '{{HIGHLIGHTS}}': projectHighlights,
      '{{ALL_TECHS}}': allTechs.join(', '),
      '{{GIT_STATS}}': analysis.gitContribution
        ? `${analysis.gitContribution.totalCommits} 次提交, +${analysis.gitContribution.linesAdded}/-${analysis.gitContribution.linesDeleted} 行`
        : '无 Git 数据',
      '{{TARGET_ROLE}}': targetRole || '未指定',
      '{{LANG}}': lang === 'en' ? 'English' : lang === 'zh' ? '中文' : '中英双语',
      '{{QUESTIONS_PER_CATEGORY}}': String(questionsPerCategory),
      '{{DIFFICULTY_RANGE}}': difficultyRange.join(', '),
      '{{FOCUS_INSTRUCTION}}': focusInstruction,
    });
  }

  /**
   * 生成本地可直接使用的面试问答骨架（不含 AI 生成内容）
   * 用于展示结构，实际内容由 AI 填充
   */
  generateSkeleton(analysis: ProjectAnalysis, options: InterviewGenerateOptions = {}): Partial<InterviewSet> {
    const allTechs = this.extractAllTechs(analysis);

    // 基于项目信息自动生成基础问题
    const questions: InterviewQA[] = [];

    // 技术栈相关问题
    for (const tech of allTechs.slice(0, 5)) {
      questions.push(this.createTechQuestion(tech, options.lang || 'zh'));
    }

    // 架构相关问题
    if (analysis.architecture !== 'unknown') {
      questions.push(this.createArchQuestion(analysis.architecture, options.lang || 'zh'));
    }

    // 项目亮点相关问题
    for (const highlight of analysis.highlights.slice(0, 3)) {
      questions.push(this.createHighlightQuestion(highlight, options.lang || 'zh'));
    }

    return {
      id: v4(),
      projectName: analysis.name,
      targetRole: options.targetRole,
      lang: options.lang || 'zh',
      questions,
      projectSummary: this.buildProjectSummary(analysis),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 生成针对特定技术的追问链 Prompt
   */
  generateDeepDivePrompt(tech: string, projectContext: string, lang: ResumeLang = 'zh'): string {
    const prompt = this.loadPrompt('deep-dive-interview');
    return this.interpolate(prompt, {
      '{{TECH}}': tech,
      '{{PROJECT_CONTEXT}}': projectContext,
      '{{LANG}}': lang === 'en' ? 'English' : '中文',
    });
  }

  // ==================== 内部方法 ====================

  private extractAllTechs(analysis: ProjectAnalysis): string[] {
    const ts = analysis.techStack;
    return [
      ...ts.languages,
      ...ts.frameworks,
      ...ts.databases,
      ...ts.middleware,
      ...ts.devOps,
      ...ts.testing,
      ...ts.others,
    ];
  }

  private formatTechStack(analysis: ProjectAnalysis): string {
    const ts = analysis.techStack;
    const lines: string[] = [];
    if (ts.languages.length) lines.push(`语言: ${ts.languages.join(', ')}`);
    if (ts.frameworks.length) lines.push(`框架: ${ts.frameworks.join(', ')}`);
    if (ts.databases.length) lines.push(`数据库: ${ts.databases.join(', ')}`);
    if (ts.middleware.length) lines.push(`中间件: ${ts.middleware.join(', ')}`);
    if (ts.devOps.length) lines.push(`DevOps: ${ts.devOps.join(', ')}`);
    if (ts.testing.length) lines.push(`测试: ${ts.testing.join(', ')}`);
    return lines.join('\n');
  }

  private buildProjectSummary(analysis: ProjectAnalysis): string {
    const parts: string[] = [];
    parts.push(`项目：${analysis.name}`);
    if (analysis.description) parts.push(`描述：${analysis.description}`);
    parts.push(`架构：${analysis.architecture}`);
    if (analysis.features.length) parts.push(`功能：${analysis.features.slice(0, 3).join('、')}`);
    if (analysis.highlights.length) parts.push(`亮点：${analysis.highlights.slice(0, 3).join('、')}`);
    return parts.join('\n');
  }

  private createTechQuestion(tech: string, lang: ResumeLang): InterviewQA {
    const isZh = lang !== 'en';
    return {
      id: v4(),
      question: isZh
        ? `请介绍一下你在项目中是如何使用 ${tech} 的？遇到了什么技术难点？`
        : `How did you use ${tech} in your project? What technical challenges did you face?`,
      answer: '', // 由 AI 填充
      difficulty: 'intermediate',
      category: 'tech-stack',
      keyPoints: isZh
        ? [`${tech} 的核心概念`, '实际应用场景', '遇到的问题和解决方案']
        : [`Core concepts of ${tech}`, 'Application scenarios', 'Problems and solutions'],
    };
  }

  private createArchQuestion(arch: string, lang: ResumeLang): InterviewQA {
    const isZh = lang !== 'en';
    const archLabel = this.archLabel(arch);
    return {
      id: v4(),
      question: isZh
        ? `你们项目采用了 ${archLabel} 架构，能说说为什么选择这个架构吗？有什么优缺点？`
        : `Your project uses a ${arch} architecture. Why did you choose it? What are the pros and cons?`,
      answer: '',
      difficulty: 'advanced',
      category: 'architecture',
      keyPoints: isZh
        ? ['架构选型的背景和原因', '架构的优点', '遇到的挑战和权衡']
        : ['Background and reasons', 'Advantages', 'Challenges and trade-offs'],
    };
  }

  private createHighlightQuestion(highlight: string, lang: ResumeLang): InterviewQA {
    const isZh = lang !== 'en';
    return {
      id: v4(),
      question: isZh
        ? `你简历里提到"${highlight}"，能详细说说你是怎么做到的吗？`
        : `You mentioned "${highlight}" in your resume. Can you explain how you achieved this?`,
      answer: '',
      difficulty: 'advanced',
      category: 'project-detail',
      keyPoints: isZh
        ? ['问题背景', '技术方案', '量化成果']
        : ['Problem background', 'Technical solution', 'Quantified results'],
    };
  }

  private categoryLabel(cat: QuestionCategory): string {
    const labels: Record<QuestionCategory, string> = {
      'tech-stack': '技术栈原理',
      'architecture': '架构设计',
      'project-detail': '项目细节',
      'problem-solving': '问题解决',
      'performance': '性能优化',
      'best-practices': '最佳实践',
      'system-design': '系统设计',
      'coding': '编码能力',
      'soft-skills': '软技能',
    };
    return labels[cat] || cat;
  }

  private archLabel(arch: string): string {
    const labels: Record<string, string> = {
      'monolith': '单体',
      'microservice': '微服务',
      'serverless': '无服务器',
      'spa': '单页应用',
      'cli': '命令行工具',
      'library': '库/SDK',
      'mobile': '移动端',
    };
    return labels[arch] || arch;
  }

  private loadPrompt(name: string): string {
    const promptPath = path.join(this.promptDir, `${name}.md`);
    try {
      return fs.readFileSync(promptPath, 'utf-8');
    } catch {
      return this.builtinPrompt(name);
    }
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    return result;
  }

  private builtinPrompt(name: string): string {
    if (name === 'generate-interview') {
      return `你是一位资深技术面试官，拥有 10 年以上的面试经验。请根据以下项目信息，生成一套高质量的面试问答。

## 项目信息

- **项目名称**: {{PROJECT_NAME}}
- **项目描述**: {{PROJECT_DESC}}
- **技术栈**:
{{TECH_STACK}}
- **架构类型**: {{ARCHITECTURE}}
- **主要功能**:
{{FEATURES}}
- **项目亮点**:
{{HIGHLIGHTS}}
- **Git 统计**: {{GIT_STATS}}

## 目标岗位: {{TARGET_ROLE}}
## 输出语言: {{LANG}}

## 生成要求

请为以下每个类别生成 {{QUESTIONS_PER_CATEGORY}} 个问题：

### 1. 技术栈原理（tech-stack）
针对项目中使用的技术，追问底层原理。
- 不要问 "什么是 React" 这种基础题
- 要问 "React 的 Fiber 架构是怎么工作的？你们项目中有没有遇到 reconciliation 的性能问题？"
- 由浅入深，从使用 → 原理 → 优化

### 2. 架构设计（architecture）
针对项目架构选型，追问设计决策。
- "为什么选择这个架构？考虑过其他方案吗？"
- "架构中最大的技术债务是什么？"
- "如果重新设计，你会做什么改变？"

### 3. 项目细节（project-detail）
针对项目亮点，追问实现细节。
- "你简历里提到的 XX 优化，具体是怎么做的？"
- "遇到过什么线上问题？怎么排查和解决的？"
- "这个项目中你最骄傲的技术决策是什么？"

### 4. 问题解决（problem-solving）
假设场景题，考察解决问题的能力。
- "如果线上突然出现 XX 问题，你会怎么排查？"
- "如果需求变更为 XX，你怎么调整架构？"
- "如果要支持 10 倍流量，你需要做什么？"

### 5. 性能优化（performance）
针对项目性能相关的问题。
- "你们项目的性能瓶颈在哪？怎么优化的？"
- "首屏加载时间是多少？做了哪些优化？"
- "数据库查询有没有优化过？怎么做的？"

### 6. 最佳实践（best-practices）
考察工程素养和规范。
- "你们的代码规范是什么？怎么保证执行？"
- "Git 分支策略是什么？"
- "CI/CD 流程是怎样的？"

## 输出格式

每个问题按以下 JSON 格式输出：

\`\`\`json
{
  "category": "类别英文名",
  "difficulty": "basic|intermediate|advanced|expert",
  "question": "问题",
  "answer": "参考回答（详细、有深度、结合项目实际）",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "followUps": [
    {
      "question": "追问1",
      "answer": "追问回答"
    }
  ],
  "relatedCode": "相关的代码模块或文件（如有）"
}
\`\`\`

请输出一个 JSON 数组，包含所有问题。
{{FOCUS_INSTRUCTION}}`;
    }

    if (name === 'deep-dive-interview') {
      return `你是一位资深技术面试官。请针对 {{TECH}} 这项技术，结合以下项目背景，生成一个由浅入深的追问链。

## 项目背景
{{PROJECT_CONTEXT}}

## 输出语言: {{LANG}}

## 要求

生成 5 个由浅入深的问题：

1. **使用层面**：在项目中怎么用的？为什么选它？
2. **原理层面**：核心原理是什么？关键机制怎么工作？
3. **踩坑层面**：遇到过什么坑？怎么解决的？
4. **优化层面**：性能/体验怎么优化的？
5. **对比层面**：和其他同类技术比，优劣在哪？

每个问题都要结合项目实际，不要泛泛而谈。

请直接输出 JSON 格式的问答数组。`;
    }

    return '';
  }
}
