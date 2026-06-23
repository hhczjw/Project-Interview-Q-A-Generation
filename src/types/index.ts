/**
 * 按照项目生成简历 Skill — 核心类型定义
 */

// ==================== 项目分析相关 ====================

/** 识别到的技术栈 */
export interface TechStack {
  languages: string[];        // 编程语言
  frameworks: string[];       // 框架
  databases: string[];        // 数据库
  middleware: string[];       // 中间件（Redis, Kafka, Nginx 等）
  devOps: string[];           // DevOps 工具（Docker, K8s, CI/CD 等）
  testing: string[];          // 测试框架
  others: string[];           // 其他
}

/** 项目架构类型 */
export type ArchType =
  | 'monolith'       // 单体应用
  | 'microservice'   // 微服务
  | 'serverless'     // 无服务器
  | 'spa'            // 单页应用
  | 'cli'            // 命令行工具
  | 'library'        // 库/SDK
  | 'mobile'         // 移动应用
  | 'unknown';

/** Git 贡献分析 */
export interface GitContribution {
  totalCommits: number;
  firstCommitDate: string;
  lastCommitDate: string;
  linesAdded: number;
  linesDeleted: number;
  topFiles: string[];         // 修改最多的文件
  commitMessages: string[];   // 最近的提交信息
}

/** 项目分析结果 */
export interface ProjectAnalysis {
  name: string;               // 项目名称
  description: string;        // 项目描述（来自 README 或 AI 生成）
  techStack: TechStack;
  architecture: ArchType;
  features: string[];         // 项目主要功能/特性
  highlights: string[];       // 项目亮点（性能优化、架构设计等）
  gitContribution?: GitContribution;
  directoryStructure: string; // 简化的目录结构
  packageInfo?: Record<string, any>; // package.json / pom.xml 等的信息
}

// ==================== 简历相关 ====================

/** 简历语言 */
export type ResumeLang = 'zh' | 'en' | 'both';

/** 简历模板类型 */
export type TemplateStyle =
  | 'default'       // 默认风格
  | 'professional'  // 专业风格
  | 'creative'      // 创意风格（图标、彩色标签）
  | 'minimal'       // 极简风格（清爽留白）
  | 'tech'          // 技术风格（突出技术栈、GitHub）
  | 'two-column'    // 双栏风格
  | 'academic';     // 学术风格

/** 个人信息 */
export interface PersonalInfo {
  name: string;
  title: string;              // 职位头衔，如 "高级前端工程师"
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  summary: string;            // 个人简介
}

/** 项目经历条目 */
export interface ProjectEntry {
  name: string;
  role: string;               // 担任角色
  period: string;             // 时间段
  description: string;        // 项目描述
  techStack: string[];        // 使用的技术
  responsibilities: string[]; // 主要职责
  achievements: string[];     // 成果/亮点
}

/** 工作经历条目 */
export interface WorkEntry {
  company: string;
  title: string;              // 职位
  period: string;
  description?: string;
  projects: ProjectEntry[];
}

/** 教育经历 */
export interface EducationEntry {
  school: string;
  degree: string;
  major: string;
  period: string;
  gpa?: string;
  highlights?: string[];
}

/** 技能清单 */
export interface SkillSection {
  category: string;           // 如 "前端", "后端", "DevOps"
  skills: string[];
  proficiency?: 'familiar' | 'proficient' | 'expert';
}

/** 完整简历数据 */
export interface Resume {
  id: string;
  lang: ResumeLang;
  template: TemplateStyle;
  targetRole?: string;        // 目标岗位
  personalInfo: PersonalInfo;
  workExperience: WorkEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  skills: SkillSection[];
  createdAt: string;
  updatedAt: string;
}

/** 简历元数据（列表展示用） */
export interface ResumeMeta {
  id: string;
  name: string;
  lang: ResumeLang;
  targetRole?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 导出相关 ====================

export type ExportFormat = 'markdown' | 'pdf' | 'word';

export interface ExportOptions {
  format: ExportFormat;
  outputPath?: string;
  template?: TemplateStyle;
  lang?: ResumeLang;
}

// ==================== 平台适配相关 ====================

export type Platform = 'claude-code' | 'cursor' | 'windsurf' | 'copilot' | 'trae';

export interface PlatformAdapter {
  platform: Platform;
  /** 生成该平台的规则文件内容 */
  generateRules(): string;
  /** 生成该平台的 skill/command 定义 */
  generateSkillDefinition?(): string;
}

// ==================== 简历解析相关 ====================

/** 简历解析结果 */
export interface ParseResult {
  /** 解析出的简历数据（可能不完整） */
  resume: Partial<Resume>;
  /** 解析置信度 0-1 */
  confidence: number;
  /** 原始文本内容（用于 AI 二次处理） */
  rawText: string;
  /** 未能解析的字段 */
  missingFields: string[];
  /** 解析来源 */
  source: 'pdf' | 'word' | 'text';
}

/** 合并选项 */
export interface MergeOptions {
  /** 是否覆盖已有的项目经历 */
  overwriteProjects?: boolean;
  /** 是否合并技能清单 */
  mergeSkills?: boolean;
  /** 新项目在列表中的位置：'prepend' 前置 | 'append' 后置 */
  projectOrder?: 'prepend' | 'append';
}

// ==================== 面试问答相关 ====================

/** 面试问题难度 */
export type QuestionDifficulty = 'basic' | 'intermediate' | 'advanced' | 'expert';

/** 面试问题类别 */
export type QuestionCategory =
  | 'tech-stack'        // 技术栈原理（结合项目）
  | 'tech-fundamentals' // 技术八股文（脱离项目的基础原理题）
  | 'architecture'      // 架构设计
  | 'project-detail'    // 项目细节
  | 'problem-solving'   // 问题解决
  | 'performance'       // 性能优化
  | 'best-practices'    // 最佳实践
  | 'system-design'     // 系统设计
  | 'coding'            // 编码能力
  | 'soft-skills';      // 软技能

/** 单个面试问答 */
export interface InterviewQA {
  id: string;
  question: string;              // 问题
  answer: string;                // 参考回答
  difficulty: QuestionDifficulty;
  category: QuestionCategory;
  /** 追问列表 */
  followUps?: Array<{
    question: string;
    answer: string;
  }>;
  /** 回答要点 */
  keyPoints?: string[];
  /** 关联的项目代码/模块 */
  relatedCode?: string;
}

/** 面试问答集合 */
export interface InterviewSet {
  id: string;
  projectName: string;
  targetRole?: string;
  lang: ResumeLang;
  /** 按类别分组的问答 */
  questions: InterviewQA[];
  /** 项目分析摘要（用于生成问答） */
  projectSummary: string;
  createdAt: string;
  updatedAt: string;
}

/** 面试生成选项 */
export interface InterviewGenerateOptions {
  lang?: ResumeLang;
  targetRole?: string;
  /** 问题数量（每类） */
  questionsPerCategory?: number;
  /** 难度范围 */
  difficultyRange?: QuestionDifficulty[];
  /** 重点关注的类别 */
  focusCategories?: QuestionCategory[];
}

/** 面试元数据 */
export interface InterviewSetMeta {
  id: string;
  projectName: string;
  targetRole?: string;
  questionCount: number;
  createdAt: string;
}
