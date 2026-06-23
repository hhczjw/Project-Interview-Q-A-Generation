/**
 * 按照项目生成简历 Skill — 主入口
 *
 * 本模块提供编程接口，供各平台适配层调用。
 * 实际使用中，大多数用户通过 AI Coding 工具的对话界面直接使用。
 */

export { ProjectAnalyzer } from './core/analyzer';
export { ResumeGenerator } from './core/resume-generator';
export { ResumeManager } from './core/resume-manager';
export { TemplateEngine } from './core/template-engine';
export { Exporter } from './core/exporter';
export { ResumeParser } from './core/resume-parser';
export { ResumeMerger } from './core/resume-merger';
export { InterviewGenerator } from './core/interview-generator';
export { InterviewManager } from './core/interview-manager';

export * from './types';

/**
 * 快速生成简历的便捷函数
 */
import * as path from 'path';
import { ProjectAnalyzer } from './core/analyzer';
import { ResumeGenerator, GenerateOptions } from './core/resume-generator';
import { ResumeManager } from './core/resume-manager';
import { TemplateEngine } from './core/template-engine';
import { Exporter } from './core/exporter';
import { ResumeParser } from './core/resume-parser';
import { ResumeMerger } from './core/resume-merger';
import { InterviewGenerator } from './core/interview-generator';
import { InterviewManager } from './core/interview-manager';
import { Resume, ExportFormat, TemplateStyle, InterviewGenerateOptions, InterviewSet } from './types';

export interface QuickGenerateOptions {
  projectPath: string;
  lang?: 'zh' | 'en' | 'both';
  template?: TemplateStyle;
  targetRole?: string;
  personalInfo?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  /** 已有简历文件路径（PDF/Word/Markdown），用于在现有简历基础上补充项目经历 */
  existingResumePath?: string;
  exportFormat?: ExportFormat;
  outputDir?: string;
}

/**
 * 一键生成简历
 *
 * @example
 * ```ts
 * import { quickGenerate } from 'project-resume-skill';
 *
 * const result = await quickGenerate({
 *   projectPath: '/path/to/my-project',
 *   lang: 'zh',
 *   targetRole: '前端工程师',
 *   personalInfo: { name: '张三', title: '高级前端工程师' },
 *   exportFormat: 'markdown',
 * });
 *
 * console.log(result.markdown);  // Markdown 简历内容
 * console.log(result.exportPath); // 导出文件路径
 * ```
 */
export async function quickGenerate(options: QuickGenerateOptions) {
  const {
    projectPath,
    lang = 'zh',
    template = 'default',
    targetRole,
    personalInfo,
    existingResumePath,
    exportFormat,
    outputDir,
  } = options;

  // 1. 分析项目
  const analyzer = new ProjectAnalyzer(projectPath);
  const analysis = await analyzer.analyze();

  let resume: Resume;
  const manager = new ResumeManager();

  if (existingResumePath) {
    // 模式 A：在已有简历基础上补充项目经历
    const parser = new ResumeParser();
    const parseResult = await parser.parse(existingResumePath);

    // 如果解析置信度低，生成 AI Prompt 供进一步处理
    let existingResume: Partial<Resume>;
    if (parseResult.confidence < 0.5) {
      // 返回解析结果和 AI Prompt，由调用方决定如何处理
      console.log(`⚠️  解析置信度较低 (${Math.round(parseResult.confidence * 100)}%)，建议使用 AI 进一步解析`);
      console.log(`📝 AI 解析 Prompt 已生成，请在 AI Coding 工具中使用`);
      existingResume = parseResult.resume;
    } else {
      existingResume = parseResult.resume;
    }

    // 合并已有简历与新项目分析
    const merger = new ResumeMerger();
    const baseResume: Resume = {
      id: existingResume.id || '',
      lang: existingResume.lang || lang,
      template: template,
      targetRole: existingResume.targetRole || targetRole,
      personalInfo: existingResume.personalInfo || { name: '', title: '', summary: '' },
      workExperience: existingResume.workExperience || [],
      projects: existingResume.projects || [],
      education: existingResume.education || [],
      skills: existingResume.skills || [],
      createdAt: existingResume.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    resume = merger.mergeWithAnalysis(baseResume, analysis, {
      projectOrder: 'prepend',
      mergeSkills: true,
    });

    // 合并个人信息
    if (personalInfo) {
      resume.personalInfo = {
        ...resume.personalInfo,
        ...personalInfo,
      };
    }

    // 保存合并后的简历
    resume = manager.create(resume);
  } else {
    // 模式 B：从零生成简历
    const generator = new ResumeGenerator();
    const draft = generator.generateDraft(analysis, {
      lang,
      template,
      targetRole,
      personalInfo: personalInfo as any,
    });

    resume = manager.create(draft);
  }

  // 渲染 Markdown
  const engine = new TemplateEngine();
  const markdown = engine.render(resume);

  // 可选导出
  let exportPath: string | undefined;
  if (exportFormat) {
    const exporter = new Exporter();
    exportPath = await exporter.export(resume, {
      format: exportFormat,
      outputPath: outputDir,
    });
  }

  return {
    analysis,
    resume,
    markdown,
    exportPath,
  };
}

/**
 * 解析已有简历文件
 */
export async function parseExistingResume(filePath: string) {
  const parser = new ResumeParser();
  const result = await parser.parse(filePath);
  return {
    ...result,
    aiPrompt: parser.generateAIParsePrompt(result),
  };
}

/**
 * 合并两份简历
 */
export function mergeTwoResumes(primary: Resume, secondary: Resume) {
  const merger = new ResumeMerger();
  return merger.mergeResumes(primary, secondary);
}

// ==================== 面试问答 ====================

export interface QuickInterviewOptions {
  /** 项目路径 */
  projectPath: string;
  /** 目标岗位 */
  targetRole?: string;
  /** 语言 */
  lang?: 'zh' | 'en' | 'both';
  /** 每类问题数量 */
  questionsPerCategory?: number;
  /** 重点关注的类别 */
  focusCategories?: InterviewGenerateOptions['focusCategories'];
  /** 难度范围 */
  difficultyRange?: InterviewGenerateOptions['difficultyRange'];
}

/**
 * 一键生成面试问答
 *
 * @example
 * ```ts
 * import { quickGenerateInterview } from 'project-resume-skill';
 *
 * const result = await quickGenerateInterview({
 *   projectPath: '/path/to/your/project',
 *   targetRole: '高级前端工程师',
 *   lang: 'zh',
 * });
 *
 * console.log(result.markdown);   // Markdown 面试问答
 * console.log(result.questions);  // 结构化问答数据
 * ```
 */
export async function quickGenerateInterview(options: QuickInterviewOptions) {
  const {
    projectPath,
    targetRole,
    lang = 'zh',
    questionsPerCategory = 3,
    focusCategories,
    difficultyRange,
  } = options;

  // 1. 分析项目
  const analyzer = new ProjectAnalyzer(projectPath);
  const analysis = await analyzer.analyze();

  // 2. 生成面试问答骨架
  const generator = new InterviewGenerator();
  const skeleton = generator.generateSkeleton(analysis, {
    lang,
    targetRole,
    questionsPerCategory,
    focusCategories,
    difficultyRange,
  });

  // 3. 保存
  const manager = new InterviewManager();
  const interview = manager.create(skeleton);

  // 4. 生成 AI Prompt（供 AI 填充具体内容）
  const aiPrompt = generator.generatePrompt(analysis, {
    lang,
    targetRole,
    questionsPerCategory,
    focusCategories,
    difficultyRange,
  });

  // 5. 生成 Markdown
  const markdown = manager.toMarkdown(interview.id);

  return {
    analysis,
    interview,
    markdown,
    aiPrompt,
  };
}
