# 按照项目生成简历 Skill

> 根据当前项目自动生成专业简历，支持导入已有简历、中英文、多格式导出、简历管理

## 触发方式

当用户说出以下意图时，启动简历生成流程：

- "帮我生成简历" / "写简历" / "根据项目生成简历"
- "generate resume" / "create resume"
- "我有一份简历，想补充项目经历"
- "补充简历" / "更新简历" / "在简历里加项目"
- "导出简历" / "导出 PDF" / "导出 Word"
- "管理简历" / "列出简历" / "删除简历"

## Skill 行为规范

当用户调用此 Skill 时，你必须：

### 第一步：判断使用模式

询问用户或根据命令参数判断：

**模式 A — 从零生成**：用户没有已有简历，需要根据项目从零生成
**模式 B — 补充项目**：用户已有简历（PDF/Word/Markdown），想在现有简历基础上补充项目经历

如果是模式 B，先进入「已有简历导入流程」。

### 已有简历导入流程

1. 让用户提供简历文件路径（支持 PDF / Word / Markdown / 纯文本）
2. 读取并解析简历文件内容：
   - PDF：使用 `pdf-parse` 库提取文本
   - Word：使用 `mammoth` 库提取文本
   - Markdown/文本：直接读取
3. 使用规则引擎初步结构化提取：
   - 个人信息（姓名、联系方式、邮箱、GitHub）
   - 技能清单（按类别分组）
   - 工作经历（公司、职位、时间段）
   - 项目经历（项目名、描述、技术栈、职责、成果）
   - 教育经历（学校、学位、专业）
4. 如果提取置信度低，使用 AI 进一步解析：
   - 将原始文本传给 AI
   - 要求 AI 提取结构化的简历数据
   - 返回 JSON 格式的简历数据
5. 展示提取结果，让用户确认

### 第二步：项目分析

1. 扫描当前项目根目录，识别：
   - **技术栈**：检查 package.json / pom.xml / go.mod / requirements.txt / Cargo.toml 等依赖文件
   - **架构模式**：分析目录结构，判断是微服务/单体/SPA/CLI/库等
   - **项目描述**：读取 README.md 提取项目概述
   - **功能特性**：从 README 和代码结构提取主要功能
   - **Git 贡献**：执行 `git log` 分析提交历史、代码量、活跃时间
2. 将分析结果整理为结构化数据，展示给用户确认

### 第三步：信息收集

向用户确认以下信息（如果未在命令参数中指定）：

- **目标岗位**：如 "前端工程师"、"Java 后端开发"、"全栈工程师"
- **简历语言**：中文 / 英文 / 双语
- **简历模板**：默认 / 专业 / 创意 / 极简 / 技术 / 双栏 / 学术
- **个人信息**：姓名、联系方式、个人简介（可选，后续补充）

### 第四步：简历生成/合并

**从零生成**：基于项目分析结果，使用 STAR 法则生成简历内容

**补充项目**：将新项目经历合并到已有简历中：
- 智能去重：避免重复的技能和项目
- 增量更新：保留已有内容，只添加新项目
- 位置控制：新项目默认前置（最新项目在最前面）

生成要求（STAR 法则）：
- **Situation（情境）**：项目背景和面临的挑战
- **Task（任务）**：个人承担的职责
- **Action（行动）**：采取的技术方案和实施步骤
- **Result（结果）**：量化的成果和收益

内容要求：
- 每条描述控制在 1-2 行，简洁有力
- 量化成果：性能提升百分比、代码量、用户规模、效率提升
- 使用强动词：主导、设计、优化、搭建、重构（避免 "负责"、"参与"）
- 根据目标岗位调整技术侧重点

### 第五步：展示与迭代

1. 将生成的简历以 Markdown 格式展示给用户
2. 询问用户是否需要调整：
   - 增删项目经历
   - 调整描述措辞
   - 修改技术侧重点
   - 补充个人信息
   - 切换模板风格
3. 根据反馈迭代优化

### 第六步：导出与保存

- 默认保存为 JSON 格式到 `data/resumes/` 目录
- 支持导出为 Markdown / PDF / Word
- PDF 导出使用 puppeteer 渲染，支持 7 种模板主题样式
- Word 导出使用 docx 库

## 简历数据结构

```typescript
interface Resume {
  id: string;
  lang: 'zh' | 'en' | 'both';
  personalInfo: {
    name: string;
    title: string;      // 职位头衔
    email?: string;
    phone?: string;
    location?: string;
    github?: string;
    summary: string;    // 个人简介
  };
  workExperience: Array<{
    company: string;
    title: string;
    period: string;
    projects: ProjectEntry[];
  }>;
  projects: ProjectEntry[];
  education: Array<{
    school: string;
    degree: string;
    major: string;
    period: string;
  }>;
  skills: Array<{
    category: string;   // 如 "前端"、"后端"、"DevOps"
    skills: string[];
  }>;
}
```

## 文件位置

- 核心引擎：`src/core/` 目录
- 简历模板：`src/templates/` 目录
- AI Prompt：`src/prompts/` 目录
- 用户数据：`data/resumes/` 目录
- 导出文件：`data/exports/` 目录

## 注意事项

1. 项目分析时跳过 node_modules、.git、dist 等目录
2. Git 分析需要项目在 Git 仓库中
3. PDF 导出依赖 puppeteer，首次使用需要安装
4. 简历数据以 JSON 格式持久化，方便后续编辑
