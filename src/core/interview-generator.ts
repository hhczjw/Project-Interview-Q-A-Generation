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

    // 技术栈相关问题（结合项目）
    for (const tech of allTechs.slice(0, 5)) {
      questions.push(this.createTechQuestion(tech, options.lang || 'zh'));
    }

    // 技术八股文问题（脱离项目的基础原理题）
    for (const tech of allTechs.slice(0, 5)) {
      questions.push(this.createFundamentalsQuestion(tech, options.lang || 'zh'));
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

  /**
   * 创建技术八股文问题（脱离项目的基础原理题）
   */
  private createFundamentalsQuestion(tech: string, lang: ResumeLang): InterviewQA {
    const isZh = lang !== 'en';

    // 预定义的八股文问题库
    const fundamentalsDB: Record<string, { zh: string; en: string; difficulty: QuestionDifficulty; keyPoints: string[] }[]> = {
      'React': [
        { zh: '请解释 React 的虚拟 DOM 是什么？它和真实 DOM 的关系是什么？', en: 'What is React\'s virtual DOM? How does it relate to the real DOM?', difficulty: 'basic', keyPoints: ['虚拟 DOM 是 JS 对象树', 'diff 算法比较差异', '批量更新真实 DOM'] },
        { zh: 'React 的 Fiber 架构是什么？它解决了什么问题？', en: 'What is React Fiber architecture? What problem does it solve?', difficulty: 'advanced', keyPoints: ['可中断的渲染', '优先级调度', '解决大型应用卡顿'] },
        { zh: 'React 中 useEffect 和 useLayoutEffect 的区别是什么？', en: 'What\'s the difference between useEffect and useLayoutEffect?', difficulty: 'intermediate', keyPoints: ['useEffect 异步执行', 'useLayoutEffect 同步执行', '渲染时机不同'] },
      ],
      'Vue': [
        { zh: 'Vue 的响应式原理是什么？Vue 2 和 Vue 3 有什么区别？', en: 'What is Vue\'s reactivity principle? What\'s the difference between Vue 2 and Vue 3?', difficulty: 'basic', keyPoints: ['Vue 2 用 Object.defineProperty', 'Vue 3 用 Proxy', '依赖收集和触发更新'] },
        { zh: 'Vue 的 nextTick 是什么原理？', en: 'What is the principle behind Vue\'s nextTick?', difficulty: 'intermediate', keyPoints: ['微任务/宏任务', 'DOM 更新后执行', '异步批量更新'] },
      ],
      'TypeScript': [
        { zh: 'TypeScript 中 type 和 interface 的区别是什么？', en: 'What\'s the difference between type and interface in TypeScript?', difficulty: 'basic', keyPoints: ['interface 可扩展', 'type 支持联合类型', 'interface 支持声明合并'] },
        { zh: 'TypeScript 的泛型是什么？什么场景下使用？', en: 'What are TypeScript generics? When would you use them?', difficulty: 'intermediate', keyPoints: ['类型参数化', '代码复用', '类型安全'] },
      ],
      'JavaScript': [
        { zh: '请解释 JavaScript 的事件循环（Event Loop）机制', en: 'Explain JavaScript\'s Event Loop mechanism', difficulty: 'basic', keyPoints: ['调用栈', '任务队列', '微任务优先'] },
        { zh: 'JavaScript 的闭包是什么？有什么应用场景？', en: 'What is a closure in JavaScript? What are its use cases?', difficulty: 'basic', keyPoints: ['函数访问外部变量', '数据私有化', '防抖节流'] },
        { zh: 'JavaScript 的原型链是什么？', en: 'What is the prototype chain in JavaScript?', difficulty: 'intermediate', keyPoints: ['__proto__ 指向', '继承机制', '属性查找'] },
      ],
      'Node.js': [
        { zh: 'Node.js 的事件循环和浏览器的有什么区别？', en: 'How does Node.js event loop differ from browser\'s?', difficulty: 'intermediate', keyPoints: ['6 个阶段', 'process.nextTick', 'setImmediate'] },
        { zh: 'Node.js 的 Stream 是什么？有哪些类型？', en: 'What is a Stream in Node.js? What types are there?', difficulty: 'intermediate', keyPoints: ['Readable/Writable/Duplex/Transform', '背压处理', '管道操作'] },
      ],
      'Redis': [
        { zh: 'Redis 有哪几种数据结构？各有什么应用场景？', en: 'What data structures does Redis have? What are their use cases?', difficulty: 'basic', keyPoints: ['String/Hash/List/Set/ZSet', '缓存/计数器/排行榜'] },
        { zh: 'Redis 的持久化机制是什么？RDB 和 AOF 的区别？', en: 'What is Redis persistence? Difference between RDB and AOF?', difficulty: 'intermediate', keyPoints: ['RDB 快照', 'AOF 日志追加', '混合持久化'] },
        { zh: 'Redis 的缓存穿透、击穿、雪崩是什么？怎么解决？', en: 'What are cache penetration, breakdown, and avalanche? How to solve them?', difficulty: 'advanced', keyPoints: ['穿透：查不存在的 key', '击穿：热点 key 过期', '雪崩：大量 key 同时过期'] },
      ],
      'MySQL': [
        { zh: 'MySQL 的索引是什么？B+ 树索引的原理是什么？', en: 'What is a MySQL index? How does B+ tree index work?', difficulty: 'basic', keyPoints: ['B+ 树结构', '聚簇索引 vs 非聚簇索引', '索引覆盖'] },
        { zh: 'MySQL 的事务隔离级别有哪些？各自解决了什么问题？', en: 'What are MySQL transaction isolation levels?', difficulty: 'intermediate', keyPoints: ['读未提交/读已提交/可重复读/串行化', '脏读/不可重复读/幻读'] },
      ],
      'MongoDB': [
        { zh: 'MongoDB 和 MySQL 的区别是什么？什么场景用 MongoDB？', en: 'What\'s the difference between MongoDB and MySQL? When to use MongoDB?', difficulty: 'basic', keyPoints: ['文档型 vs 关系型', '灵活 schema', '适合非结构化数据'] },
      ],
      'Docker': [
        { zh: 'Docker 的镜像和容器是什么关系？', en: 'What is the relationship between Docker images and containers?', difficulty: 'basic', keyPoints: ['镜像是模板', '容器是实例', '分层存储'] },
        { zh: 'Dockerfile 中 CMD 和 ENTRYPOINT 的区别是什么？', en: 'What\'s the difference between CMD and ENTRYPOINT in Dockerfile?', difficulty: 'intermediate', keyPoints: ['CMD 可被覆盖', 'ENTRYPOINT 不可被覆盖', '组合使用'] },
      ],
      'Webpack': [
        { zh: 'Webpack 的构建流程是什么？Loader 和 Plugin 的区别？', en: 'What is Webpack\'s build process? Difference between Loader and Plugin?', difficulty: 'intermediate', keyPoints: ['Loader 转换文件', 'Plugin 扩展功能', '编译-优化-输出'] },
      ],
      'Vite': [
        { zh: 'Vite 为什么比 Webpack 快？它的原理是什么？', en: 'Why is Vite faster than Webpack? What\'s its principle?', difficulty: 'intermediate', keyPoints: ['ESM 原生模块', '按需编译', '开发时不打包'] },
      ],
      'Redux': [
        { zh: 'Redux 的数据流是怎样的？', en: 'What is Redux\'s data flow?', difficulty: 'basic', keyPoints: ['Action → Reducer → Store → View', '单向数据流', '纯函数更新'] },
        { zh: 'Redux 中间件是什么原理？', en: 'What is the principle behind Redux middleware?', difficulty: 'intermediate', keyPoints: ['洋葱模型', 'dispatch 增强', 'compose 组合'] },
      ],
      'Kafka': [
        { zh: 'Kafka 是什么？它的架构是怎样的？', en: 'What is Kafka? What\'s its architecture?', difficulty: 'basic', keyPoints: ['分布式消息队列', 'Topic/Partition/Consumer Group', '高吞吐'] },
      ],
      'Nginx': [
        { zh: 'Nginx 的反向代理和正向代理有什么区别？', en: 'What\'s the difference between reverse proxy and forward proxy in Nginx?', difficulty: 'basic', keyPoints: ['正向代理代理客户端', '反向代理代理服务器', '负载均衡'] },
      ],
    };

    // 查找该技术的八股文问题
    const techQuestions = fundamentalsDB[tech] || fundamentalsDB[tech.charAt(0).toUpperCase() + tech.slice(1)];

    if (techQuestions && techQuestions.length > 0) {
      // 随机选一个问题
      const q = techQuestions[Math.floor(Math.random() * techQuestions.length)];
      return {
        id: v4(),
        question: isZh ? q.zh : q.en,
        answer: '',
        difficulty: q.difficulty,
        category: 'tech-fundamentals',
        keyPoints: q.keyPoints,
      };
    }

    // 如果没有预定义问题，生成通用的八股文问题
    return {
      id: v4(),
      question: isZh
        ? `请介绍一下 ${tech} 的核心概念和原理？`
        : `What are the core concepts and principles of ${tech}?`,
      answer: '',
      difficulty: 'basic',
      category: 'tech-fundamentals',
      keyPoints: isZh
        ? [`${tech} 的核心概念`, '工作原理', '常见应用场景']
        : [`Core concepts of ${tech}`, 'How it works', 'Common use cases'],
    };
  }

  private categoryLabel(cat: QuestionCategory): string {
    const labels: Record<QuestionCategory, string> = {
      'tech-stack': '技术栈原理（结合项目）',
      'tech-fundamentals': '技术八股文（基础原理）',
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

### 1. 技术栈原理（tech-stack）— 结合项目
针对项目中使用的技术，追问在项目中的实际应用和原理。
- 要问 "React 的 Fiber 架构是怎么工作的？你们项目中有没有遇到 reconciliation 的性能问题？"
- 由浅入深，从项目使用 → 原理 → 优化
- 必须结合项目实际场景

### 2. 技术八股文（tech-fundamentals）— 脱离项目
针对项目中使用的技术，考察基础原理知识（八股文）。
- 问 "React 的虚拟 DOM 是什么？" 这类基础原理题
- 问 "Redux 的数据流是怎样的？"
- 问 "Redis 的缓存穿透、击穿、雪崩是什么？"
- 不需要结合项目，纯粹考察技术功底
- 覆盖项目用到的每项核心技术
- 由易到难：基础概念 → 核心原理 → 高级特性

### 3. 架构设计（architecture）
针对项目架构选型，追问设计决策。
- "为什么选择这个架构？考虑过其他方案吗？"
- "架构中最大的技术债务是什么？"
- "如果重新设计，你会做什么改变？"

### 4. 项目细节（project-detail）
针对项目亮点，追问实现细节。
- "你简历里提到的 XX 优化，具体是怎么做的？"
- "遇到过什么线上问题？怎么排查和解决的？"
- "这个项目中你最骄傲的技术决策是什么？"

### 5. 问题解决（problem-solving）
假设场景题，考察解决问题的能力。
- "如果线上突然出现 XX 问题，你会怎么排查？"
- "如果需求变更为 XX，你怎么调整架构？"
- "如果要支持 10 倍流量，你需要做什么？"

### 6. 性能优化（performance）
针对项目性能相关的问题。
- "你们项目的性能瓶颈在哪？怎么优化的？"
- "首屏加载时间是多少？做了哪些优化？"
- "数据库查询有没有优化过？怎么做的？"

### 7. 最佳实践（best-practices）
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
