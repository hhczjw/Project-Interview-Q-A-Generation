# 📄 按照项目生成简历 & 面试问答 Skill

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 🎯 **两大技能**：
> 1. 扫描代码项目，自动识别技术栈，用 AI 生成**专业简历**
> 2. 基于项目技术栈，生成**资深面试官问答**，帮你准备面试
>
> 支持 Claude Code / Cursor / Windsurf / GitHub Copilot / Trae 等主流 AI Coding 工具。

---

## 📖 目录

- [功能特性](#-功能特性)
- [效果展示](#-效果展示)
- [快速开始](#-快速开始)
- [平台安装指南](#-平台安装指南)
- [模板风格](#-模板风格)
- [项目结构](#-项目结构)
- [API 参考](#-api-参考)
- [技术架构](#-技术架构)
- [开发指南](#-开发指南)
- [FAQ](#-faq)
- [面试准备](#-面试准备)
- [License](#-license)

---

## ✨ 功能特性

### 📄 简历生成

| 功能 | 说明 |
|------|------|
| 🔍 **智能项目分析** | 自动识别 50+ 种技术栈、架构模式、Git 贡献数据 |
| 📝 **STAR 法则生成** | 情境-任务-行动-结果，专业简历撰写方法论 |
| 📥 **已有简历导入** | 支持 PDF / Word / Markdown 简历导入，解析后补充项目经历 |
| 🔀 **智能合并** | 去重已有技能和项目，增量更新简历内容 |
| 🎨 **7 种模板风格** | 默认 / 专业 / 创意 / 极简 / 技术 / 双栏 / 学术 |
| 🌍 **中英双语** | 支持中文、英文简历生成 |
| 📄 **多格式导出** | Markdown / PDF (puppeteer) / Word (.docx) |
| 📋 **简历管理** | 多份简历 CRUD、搜索、版本管理 |

### 🎯 面试问答

| 功能 | 说明 |
|------|------|
| 🧠 **资深面试官视角** | 模拟 10 年经验的面试官，追问底层原理 |
| 📊 **6 大问题类别** | 技术栈原理 / 架构设计 / 项目细节 / 问题解决 / 性能优化 / 最佳实践 |
| 🔗 **追问链设计** | 每个主问题带 1-2 个追问，由浅入深 |
| ⭐ **4 级难度** | 基础 / 中级 / 高级 / 专家，可按需筛选 |
| 🎯 **结合项目实际** | 每个问题都能从你的项目中找到具体案例 |
| 📋 **问答管理** | 按类别/难度筛选，搜索，导出 Markdown |

### 🔌 平台适配

覆盖 5+ 主流 AI Coding 工具，一套核心引擎。

---

## 🎬 效果展示

### 输入：你的项目

```
my-project/
├── package.json          # React + TypeScript + Node.js
├── src/
│   ├── components/
│   ├── api/
│   └── utils/
├── Dockerfile
└── README.md
```

### 输出：专业简历

```markdown
# 张三 — 高级前端工程师

📧 zhangsan@example.com | 📱 13800138000 | 💻 github.com/zhangsan

## 个人简介
5年前端开发经验，擅长 React 和 TypeScript，有大型项目架构设计能力。

## 技能清单
**编程语言**: TypeScript, JavaScript, Python
**框架**: React, Vue, Next.js
**数据库**: MySQL, Redis

## 项目经历
### 电商平台 — 前端负责人
**技术栈**: React, TypeScript, Next.js

**主要职责**:
- 主导前端架构设计，搭建微前端架构
- 设计并实现组件库，提升团队开发效率 40%

**项目亮点**:
- 支撑日均 500W+ PV，99.9% 可用性
- 首屏加载从 3s 降至 1.2s，性能提升 60%
```

---

## 🚀 快速开始

本项目有三种使用方式，适合不同场景：

| 方式 | 适合谁 | 需要安装 | 依赖本项目代码 |
|------|--------|---------|--------------|
| **方式一** | 想快速体验的用户 | 只需部署规则文件 | ❌ 不依赖，AI 直接执行 |
| **方式二** | 想长期使用的开发者 | 规则文件 + npm 包 | ✅ 依赖，AI 调用代码 |
| **方式三** | 想集成到自己工具的开发者 | npm 包 | ✅ 完全依赖 |

---

### 方式一：对话触发（规则文件 + AI 执行）

**原理**：在项目中放置规则文件（如 `.cursorrules`），告诉 AI "当用户说生成简历/面试题时，按什么步骤做"。AI 读取规则后，**自己执行 bash 命令扫描项目、分析代码、生成内容**，不需要运行任何额外程序。

**优点**：零依赖，快速上手
**缺点**：分析精度取决于 AI 的执行能力，不同 AI 工具效果可能有差异

```bash
# 1. 部署规则文件到你的项目（选择你使用的 AI 工具）

# Claude Code 用户 — 全局安装（推荐，所有项目可用）
mkdir -p ~/.claude/commands
cp src/adapters/claude-code/skill.md ~/.claude/commands/generate-resume.md
cp src/adapters/claude-code/skill-interview.md ~/.claude/commands/generate-interview.md

# Claude Code 用户 — 项目级安装（只在当前项目可用）
mkdir -p .claude/commands
cp src/adapters/claude-code/skill.md .claude/commands/generate-resume.md
cp src/adapters/claude-code/skill-interview.md .claude/commands/generate-interview.md

# Cursor 用户
cp src/adapters/cursor/.cursorrules /path/to/your-project/

# Windsurf 用户
cp src/adapters/windsurf/.windsurfrules /path/to/your-project/

# 2. 在 AI 工具中打开你的项目，然后使用：
```

**Claude Code 使用斜杠命令**：
```
/user:generate-resume          # 生成简历
/user:generate-interview       # 生成面试问答

# 如果是项目级安装：
/project:generate-resume       # 生成简历
/project:generate-interview    # 生成面试问答
```

**Cursor / Windsurf 使用自然语言**：
```
帮我根据这个项目生成简历
帮我根据这个项目准备面试
```

**AI 会自动执行**：
1. `cat package.json` — 读取依赖，识别技术栈
2. `find . -maxdepth 3` — 分析目录结构
3. `git log --oneline -20` — 分析提交历史
4. 询问你目标岗位、语言、模板偏好
5. 生成简历内容 / 面试问答
6. 输出 Markdown 格式

> ⚠️ 方式一不需要安装 npm 依赖，但需要把规则文件放到项目里。规则文件的作用是"告诉 AI 做什么"，AI 自己就是执行引擎。

---

### 方式二：代码增强（规则文件 + npm 包）

**原理**：除了规则文件，还安装本项目的 npm 包。AI 在执行时会**调用 npm 包的 API** 做分析和生成，比方式一更精确（规则引擎识别技术栈比 AI 猜测更准确）。

**优点**：分析精度高，支持简历解析、合并、导出等高级功能
**缺点**：需要安装依赖

```bash
# 1. 克隆项目并安装依赖
git clone <repo-url>
cd 按照项目生成简历SKill
npm install
npm run build

# 2. 部署到你的目标项目
bash scripts/setup.sh
# 按提示选择：部署到当前项目 / 用户主目录 / 指定平台

# 3. 在 AI 工具中使用
#    "帮我根据这个项目生成简历"
#    "我有一份 PDF 简历，想补充这个项目的经历"
```

**与方式一的区别**：

| 对比项 | 方式一（AI 执行） | 方式二（代码增强） |
|--------|------------------|------------------|
| 技术栈识别 | AI 猜测 | 规则引擎精确匹配 50+ 种 |
| Git 分析 | AI 执行 git log | 代码精确统计行数/提交数 |
| 简历导入 | 不支持 | 支持 PDF/Word 解析 |
| 简历管理 | 不支持 | 支持 CRUD、搜索、克隆 |
| 导出 PDF/Word | 不支持 | 支持，7 种模板主题 |

---

### 方式三：编程调用（纯代码）

**原理**：不依赖 AI 工具，直接在 TypeScript/JavaScript 代码中调用 API。适合想把简历生成功能集成到自己工具或工作流中的开发者。

**优点**：完全可控，可集成到任何系统
**缺点**：需要写代码

```bash
# 安装依赖
npm install project-resume-skill
```

```typescript
import { quickGenerate, parseExistingResume } from 'project-resume-skill';

// 场景 1：从零生成简历
const result = await quickGenerate({
  projectPath: '/path/to/your/project',
  lang: 'zh',
  targetRole: '前端工程师',
  template: 'professional',
  personalInfo: {
    name: '张三',
    title: '高级前端工程师',
    email: 'zhangsan@example.com',
  },
  exportFormat: 'pdf',
});
console.log(result.markdown);   // Markdown 简历内容
console.log(result.exportPath); // PDF 文件路径

// 场景 2：在已有简历基础上补充项目经历
const result2 = await quickGenerate({
  projectPath: '/path/to/new-project',
  existingResumePath: './my-resume.pdf',  // 传入已有简历
  lang: 'zh',
  template: 'professional',
});

// 场景 3：单独解析已有简历
const parsed = await parseExistingResume('./my-resume.pdf');
console.log(parsed.resume);     // 解析出的结构化数据
console.log(parsed.aiPrompt);   // 用于 AI 精确解析的 Prompt
```

```typescript
import { quickGenerateInterview } from 'project-resume-skill';

// 场景 4：生成面试问答
const interview = await quickGenerateInterview({
  projectPath: '/path/to/your/project',
  targetRole: '高级前端工程师',
  lang: 'zh',
  questionsPerCategory: 3,
  focusCategories: ['tech-stack', 'architecture'],
});
console.log(interview.markdown);   // Markdown 面试问答
console.log(interview.aiPrompt);   // AI 生成 Prompt
```

---

## 🔌 平台安装指南

### Claude Code

**全局安装**（推荐，所有项目可用）：

```bash
mkdir -p ~/.claude/commands
cp /path/to/skill/src/adapters/claude-code/skill.md ~/.claude/commands/generate-resume.md
cp /path/to/skill/src/adapters/claude-code/skill-interview.md ~/.claude/commands/generate-interview.md
```

使用斜杠命令：
```
/user:generate-resume              # 生成简历
/user:generate-interview           # 生成面试问答
```

**项目级安装**（只在当前项目可用，可提交到 Git 共享给团队）：

```bash
mkdir -p .claude/commands
cp /path/to/skill/src/adapters/claude-code/skill.md .claude/commands/generate-resume.md
cp /path/to/skill/src/adapters/claude-code/skill-interview.md .claude/commands/generate-interview.md
```

使用斜杠命令：
```
/project:generate-resume           # 生成简历
/project:generate-interview        # 生成面试问答
```

> 💡 **区别**：`~/.claude/commands/` 是全局命令（`/user:xxx`），`.claude/commands/` 是项目命令（`/project:xxx`）。项目命令可以提交到 Git 仓库，团队成员克隆后直接使用。

### Cursor

```bash
# 在你的项目根目录执行
cp /path/to/skill/src/adapters/cursor/.cursorrules ./
```

使用方式：在 Cursor 对话中说：
- "帮我根据这个项目生成简历"
- "我有一份简历，想补充项目经历"

### Windsurf

```bash
cp /path/to/skill/src/adapters/windsurf/.windsurfrules ./
```

### GitHub Copilot

```bash
mkdir -p .github
cp /path/to/skill/src/adapters/copilot/copilot-instructions.md .github/
```

### Trae

```bash
cp /path/to/skill/src/adapters/trae/trae-rules.md ./
```

### 一键部署所有平台

```bash
bash scripts/setup.sh
# 按提示选择部署目标（当前项目 / 用户主目录 / 指定平台）
```

---

## 🎨 模板风格

| 模板 | 风格描述 | 适用场景 |
|------|---------|---------|
| `default` | 简洁通用，蓝色标题 | 通用求职 |
| `professional` | 深蓝色调，商务风格 | 大厂/外企求职 |
| `creative` | 渐变背景，圆角卡片 | 设计师/创意岗位 |
| `minimal` | 极简留白，轻量排版 | 高级/管理岗位 |
| `tech` | 暗色主题，等宽字体 | 开发者/技术岗位 |
| `two-column` | 双栏布局，信息密度高 | 信息量大的简历 |
| `academic` | 衬线字体，学术风格 | 研究/学术岗位 |

### 使用方式

```typescript
// 编程调用
const result = await quickGenerate({
  projectPath: '/path/to/project',
  template: 'tech',  // 选择模板
});

// AI 对话中
// "用技术风格的模板生成简历"
```

### PDF 导出样式

每种模板在 PDF 导出时都有对应的 CSS 主题：
- `default` — 蓝色标题，标准排版
- `professional` — 深蓝色边框，商务感
- `creative` — 渐变背景，卡片式布局
- `minimal` — 无装饰，纯文字
- `tech` — 暗色背景 (#0d1117)，代码风格
- `academic` — Times New Roman，学术排版

---

## 📁 项目结构

```
按照项目生成简历SKill/
├── README.md                              # 项目文档
├── package.json                           # 项目配置
├── tsconfig.json                          # TypeScript 配置
├── .gitignore
│
├── src/
│   ├── index.ts                           # 主入口 + quickGenerate API
│   ├── types/
│   │   └── index.ts                       # 完整类型定义
│   │
│   ├── core/                              # 🔧 核心引擎（平台无关）
│   │   ├── analyzer.ts                    # 项目分析器
│   │   ├── resume-generator.ts            # 简历生成器 + Prompt
│   │   ├── resume-manager.ts              # 简历管理器 (CRUD)
│   │   ├── resume-parser.ts               # 简历解析器 (PDF/Word)
│   │   ├── resume-merger.ts               # 简历合并器 (智能去重)
│   │   ├── template-engine.ts             # 模板引擎 (Markdown 渲染)
│   │   ├── exporter.ts                    # 导出器 (MD/PDF/Word)
│   │   ├── interview-generator.ts         # 面试问答生成器
│   │   ├── interview-manager.ts           # 面试问答管理器
│   │   └── utils.ts                       # 工具函数
│   │
│   ├── templates/                         # 📄 7 种简历模板
│   │   ├── default-zh.md / default-en.md
│   │   ├── professional-zh.md
│   │   ├── creative-zh.md / creative-en.md
│   │   ├── minimal-zh.md / minimal-en.md
│   │   ├── tech-zh.md / tech-en.md
│   │   ├── two-column-zh.md
│   │   └── academic-zh.md
│   │
│   ├── prompts/                           # 🤖 AI Prompt 模板
│   │   ├── generate-resume.md             # 简历生成 prompt
│   │   ├── optimize-content.md            # 内容优化 prompt
│   │   ├── analyze-project.md             # 项目分析 prompt
│   │   ├── generate-interview.md          # 面试问答生成 prompt
│   │   └── deep-dive-interview.md         # 深度追问 prompt
│   │
│   ├── i18n/                              # 🌍 国际化
│   │   ├── zh.ts                          # 中文语言包
│   │   └── en.ts                          # 英文语言包
│   │
│   └── adapters/                          # 🔌 多平台适配层
│       ├── claude-code/
│       │   ├── skill.md                   # 简历生成 Skill
│       │   ├── skill-interview.md         # 面试问答 Skill
│       │   └── CLAUDE.md                  # 项目级 Claude 指令
│       ├── cursor/
│       │   └── .cursorrules               # Cursor Rules
│       ├── windsurf/
│       │   └── .windsurfrules             # Windsurf Rules
│       ├── copilot/
│       │   └── copilot-instructions.md    # GitHub Copilot
│       └── trae/
│           └── trae-rules.md              # Trae Rules
│
├── data/
│   ├── resumes/                           # 简历数据存储 (JSON)
│   ├── interviews/                        # 面试问答存储 (JSON)
│   └── exports/                           # 导出文件
│
├── docs/
│   ├── interview-preparation.md           # 面试准备文档（通用）
│   └── code-interview-analysis.md         # 源码深度面试分析
│
└── scripts/
    └── setup.sh                           # 一键部署脚本
```

---

## 📚 API 参考

### quickGenerate(options)

一键生成简历的主函数。

```typescript
interface QuickGenerateOptions {
  /** 项目路径 */
  projectPath: string;
  /** 简历语言 */
  lang?: 'zh' | 'en' | 'both';
  /** 模板风格 */
  template?: 'default' | 'professional' | 'creative' | 'minimal' | 'tech' | 'two-column' | 'academic';
  /** 目标岗位 */
  targetRole?: string;
  /** 个人信息 */
  personalInfo?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  /** 已有简历路径（PDF/Word/Markdown） */
  existingResumePath?: string;
  /** 导出格式 */
  exportFormat?: 'markdown' | 'pdf' | 'word';
  /** 输出目录 */
  outputDir?: string;
}
```

**返回值**：

```typescript
{
  analysis: ProjectAnalysis;   // 项目分析结果
  resume: Resume;              // 完整简历数据
  markdown: string;            // Markdown 格式简历
  exportPath?: string;         // 导出文件路径
}
```

### parseExistingResume(filePath)

解析已有简历文件。

```typescript
// 返回
{
  resume: Partial<Resume>;     // 解析出的简历数据
  confidence: number;          // 置信度 0-1
  rawText: string;             // 原始文本
  missingFields: string[];     // 未能解析的字段
  aiPrompt: string;            // 用于 AI 精确解析的 Prompt
}
```

### ProjectAnalyzer

项目分析器，提取技术栈、架构、Git 贡献。

```typescript
const analyzer = new ProjectAnalyzer('/path/to/project');
const analysis = await analyzer.analyze();

// 单独调用
const techStack = await analyzer.detectTechStack();
const architecture = await analyzer.detectArchitecture();
const git = await analyzer.analyzeGit();
```

### ResumeManager

简历管理器，CRUD 操作。

```typescript
const manager = new ResumeManager();

manager.create(resumeData);         // 创建
manager.get(id);                    // 获取
manager.update(id, partialData);    // 更新
manager.delete(id);                 // 删除
manager.list();                     // 列出所有
manager.search('前端');              // 搜索
manager.clone(id, '新名称');         // 克隆
```

### Exporter

导出器，支持 Markdown / PDF / Word。

```typescript
const exporter = new Exporter();

await exporter.export(resume, { format: 'markdown' });
await exporter.export(resume, { format: 'pdf' });
await exporter.export(resume, { format: 'word' });
```

### quickGenerateInterview(options)

一键生成面试问答。

```typescript
interface QuickInterviewOptions {
  projectPath: string;           // 项目路径
  targetRole?: string;           // 目标岗位
  lang?: 'zh' | 'en' | 'both';  // 语言
  questionsPerCategory?: number; // 每类问题数量（默认 3）
  focusCategories?: QuestionCategory[];  // 重点关注类别
  difficultyRange?: QuestionDifficulty[]; // 难度范围
}

// 返回
{
  analysis: ProjectAnalysis;   // 项目分析结果
  interview: InterviewSet;     // 面试问答数据
  markdown: string;            // Markdown 格式问答
  aiPrompt: string;            // AI 生成 Prompt
}
```

**问题类别**：`tech-stack` | `architecture` | `project-detail` | `problem-solving` | `performance` | `best-practices`

**难度级别**：`basic` | `intermediate` | `advanced` | `expert`

### InterviewGenerator

面试问答生成器。

```typescript
const gen = new InterviewGenerator();

// 生成骨架（本地可直接使用的基础问题）
const skeleton = gen.generateSkeleton(analysis, { lang: 'zh', targetRole: '高级前端' });

// 生成 AI Prompt（由 AI 填充具体内容）
const prompt = gen.generatePrompt(analysis, { lang: 'zh' });

// 生成深度追问 Prompt
const deepDive = gen.generateDeepDivePrompt('React', projectContext, 'zh');
```

### InterviewManager

面试问答管理器。

```typescript
const manager = new InterviewManager();

manager.create(data);                           // 创建
manager.get(id);                                // 获取
manager.list();                                 // 列出所有
manager.delete(id);                             // 删除
manager.filterByCategory(id, 'tech-stack');     // 按类别筛选
manager.filterByDifficulty(id, 'advanced');     // 按难度筛选
manager.search(id, 'React');                    // 搜索
manager.addQuestion(id, qa);                    // 添加问题
manager.removeQuestion(id, qaId);               // 删除问题
manager.toMarkdown(id);                         // 导出 Markdown
```

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      多平台适配层                             │
│  ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────┐ ┌──────────┐│
│  │Claude Code│ │ Cursor │ │ Windsurf │ │Copilot│ │   Trae   ││
│  └────┬─────┘ └───┬────┘ └────┬─────┘ └──┬───┘ └────┬─────┘│
│       └───────────┴──────────┴──────────┴───────────┘       │
│                             │                                │
│                       ┌─────▼─────┐                          │
│                       │  统一接口  │                          │
│                       └─────┬─────┘                          │
├─────────────────────────────┼────────────────────────────────┤
│                      核心引擎层                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   项目分析器 (analyzer)               │    │
│  │  技术栈识别 │ 架构检测 │ Git 分析 │ 目录结构 │ 特性提取 │    │
│  └─────────────────────┬───────────────────────────────┘    │
│                        │                                     │
│         ┌──────────────┼──────────────┐                      │
│         ▼              ▼              ▼                      │
│  ┌────────────┐ ┌────────────┐ ┌─────────────┐              │
│  │  简历生成   │ │  面试生成   │ │   简历解析   │              │
│  │  generator  │ │interview-  │ │   parser    │              │
│  │            │ │ generator  │ │             │              │
│  └─────┬──────┘ └─────┬──────┘ └──────┬──────┘              │
│        │              │               │                      │
│  ┌─────▼──────┐ ┌─────▼──────┐ ┌──────▼─────┐              │
│  │  简历管理   │ │  面试管理   │ │  简历合并   │              │
│  │  manager   │ │interview-  │ │   merger    │              │
│  │            │ │  manager   │ │             │              │
│  └─────┬──────┘ └─────┬──────┘ └─────────────┘              │
│        │              │                                      │
│  ┌─────▼──────┐ ┌─────▼──────┐                              │
│  │  模板引擎   │ │  导出器     │                              │
│  │  template  │ │  exporter  │                              │
│  └────────────┘ └────────────┘                              │
├─────────────────────────────────────────────────────────────┤
│                      数据层                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 简历模板  │  │ AI Prompt │  │ 简历数据  │  │ 面试数据  │    │
│  │templates/ │  │ prompts/  │  │data/     │  │interviews│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 核心设计原则

1. **核心引擎与平台解耦**：核心逻辑不依赖任何 AI 平台，适配层只做"翻译"
2. **规则优先 + AI 兜底**：确定性任务用代码，创造性任务用 AI
3. **开闭原则**：新增平台只需加适配文件，不改核心代码
4. **分层容错**：每层都有降级策略，确保部分失败不影响整体
5. **共享分析器**：简历生成和面试问答共享同一个项目分析器，避免重复扫描

---

## 🛠️ 开发指南

### 环境要求

- Node.js >= 18
- npm >= 9

### 常用命令

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 运行
npm start

# 导出测试
npm run export:pdf
npm run export:word
```

### 添加新模板

1. 在 `src/templates/` 下创建模板文件，如 `my-style-zh.md`
2. 使用 `{{NAME}}`、`{{TITLE}}` 等占位符
3. 在 `src/core/template-engine.ts` 中添加渲染逻辑
4. 在 `src/core/exporter.ts` 中添加对应的 CSS 主题

### 添加新平台

1. 在 `src/adapters/` 下创建新目录
2. 编写规则文件，说明触发词和工作流程
3. 运行 `bash scripts/setup.sh` 测试部署

### 测试

```bash
# 编译并运行全面测试（81 个测试点）
npm test
```

---

## ❓ FAQ

### Q: 没有 Git 仓库的项目能用吗？

可以。项目分析器会跳过 Git 分析，但仍能识别技术栈和架构。只是不会有"提交次数"、"代码行数"等数据。

### Q: 支持扫描件 PDF 吗？

目前不支持。`pdf-parse` 只能提取文本层，扫描件需要 OCR。可以将扫描件转换为文本后使用。

### Q: 解析置信度低怎么办？

置信度低于 50% 时，系统会生成一个 AI Prompt，你可以在 AI Coding 工具中使用这个 Prompt 进行精确解析。

### Q: 如何自定义模板？

参考 `src/templates/` 下的现有模板，使用 `{{变量名}}` 作为占位符。支持的变量：
- `{{NAME}}` — 姓名
- `{{TITLE}}` — 职位头衔
- `{{EMAIL}}` — 邮箱
- `{{PHONE}}` — 电话
- `{{SUMMARY}}` — 个人简介
- `{{SKILLS}}` — 技能清单
- `{{WORK_EXPERIENCE}}` — 工作经历
- `{{PROJECTS}}` — 项目经历
- `{{EDUCATION}}` — 教育背景

### Q: 导出的 PDF 样式可以自定义吗？

可以。在 `src/core/exporter.ts` 的 `getTemplateCSS()` 方法中修改 CSS 样式。每种模板有独立的主题。

### Q: 支持哪些语言的项目？

支持所有主流语言：JavaScript/TypeScript、Python、Java、Go、Rust、C/C++、C#、Ruby、PHP、Swift、Kotlin、Dart 等。

---

## 📚 面试准备

项目包含两份面试准备文档：

### 1. 通用面试指南（适合初学者）

📖 [docs/interview-preparation.md](docs/interview-preparation.md)

涵盖 **21 个问题**，每个问题有「小白版」和「进阶版」回答：
- 架构设计类：为什么选择核心引擎+适配层架构
- 技术实现类：STAR 法则、模板引擎、PDF/Word 导出原理
- 设计模式类：策略模式、模板方法、解析器模式
- 工程实践类：错误处理、测试策略、性能优化
- 深度追问：技术风险、差异化、重新设计

### 2. 源码深度分析（适合进阶准备）

📖 [docs/code-interview-analysis.md](docs/code-interview-analysis.md)

基于**实际源码**逐模块分析，标注具体代码行号，涵盖 **18 个深度问题**：

| 模块 | 问题数 | 典型问题 |
|------|--------|---------|
| analyzer.ts | 5 | TECH_RULES 数据结构设计、权重打分算法、execSync 风险 |
| resume-parser.ts | 3 | 置信度计算公式、姓名提取逻辑、状态机设计 |
| resume-merger.ts | 2 | 三层相似度判断、模糊匹配策略 |
| exporter.ts | 3 | 正则替换顺序、CSS 主题设计、puppeteer 最佳实践 |
| index.ts | 1 | 两条分支的编排逻辑 |
| types/index.ts | 1 | projects 双层设计的领域建模 |
| 架构级 | 3 | 数据流图、单元测试设计、性能瓶颈分析 |

每个问题都包含：源码片段 → 设计思路 → 问题分析 → 改进方案。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/my-feature`
3. 提交更改：`git commit -m 'Add my feature'`
4. 推送分支：`git push origin feature/my-feature`
5. 提交 Pull Request

---

## 📄 License

[MIT](LICENSE)
