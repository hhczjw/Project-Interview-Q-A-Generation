# 基于源码的面试深度分析

> 本文档基于项目实际源码，逐模块分析面试官可能追问的技术细节。
> 每个问题都标注了具体的代码位置，方便你对照源码理解。

---

## 目录

1. [analyzer.ts — 项目分析器](#1-analyzer.ts--项目分析器)
2. [resume-parser.ts — 简历解析器](#2-resume-parser.ts--简历解析器)
3. [resume-merger.ts — 简历合并器](#3-resume-merger.ts--简历合并器)
4. [exporter.ts — 导出器](#4-exporter.ts--导出器)
5. [index.ts — 入口与编排](#5-index.ts--入口与编排)
6. [types/index.ts — 类型设计](#6-typesindexts--类型设计)
7. [架构级追问](#7-架构级追问)

---

## 1. analyzer.ts — 项目分析器

### 源码位置：`src/core/analyzer.ts`

---

### Q1: `TECH_RULES`（第 11-106 行）的数据结构为什么用 `Record<keyof TechStack, Record<string, string[]>>` 而不是数组或 Map？

**源码片段**：
```typescript
// 第 11 行
const TECH_RULES: Record<keyof TechStack, Record<string, string[]>> = {
  languages: {
    'TypeScript': ['tsconfig.json', '*.ts', '*.tsx'],
    'JavaScript': ['package.json', '*.js', '*.jsx', '*.mjs'],
    // ...
  },
  // ...
};
```

**回答**：

> 这个数据结构的设计考虑了三点：
>
> **1. 类型安全**：`Record<keyof TechStack, ...>` 保证了外层 key 必须是 `TechStack` 接口定义的字段（languages/frameworks/databases 等），如果漏掉某个分类，TypeScript 编译时会报错。
>
> **2. 查询效率**：外层用对象（哈希表），查找某个分类是 O(1)。如果用数组，需要遍历。内层 `Record<string, string[]>` 同理，按技术名查找也是 O(1)。
>
> **3. 可读性**：嵌套对象的结构直观地表达了「分类 → 技术 → 特征文件」的三层关系，比扁平数组更容易理解。
>
> **对比 Map**：Map 的优势是 key 可以是任意类型，但这里 key 都是字符串，用普通对象更简洁，不需要 `.get()` / `.has()` 的语法。

---

### Q2: `detectTechStack()`（第 175-208 行）的双重匹配策略是怎么工作的？为什么要两层？

**源码片段**：
```typescript
// 第 195-201 行
const found = patterns.some(pattern => {
  // 检查文件匹配
  if (files.some(f => this.matchPattern(f, pattern))) return true;
  // 检查依赖匹配
  if (deps.some(d => d === pattern || d.startsWith(pattern))) return true;
  return false;
});
```

**回答**：

> 两层匹配解决的是不同场景的识别问题：
>
> **第一层：文件匹配** — 匹配项目中的实际文件名
> - 用于识别**语言**（如 `*.ts` → TypeScript）和**工具**（如 `Dockerfile` → Docker）
> - 这些是「你项目里有这个文件」就能确定的
>
> **第二层：依赖匹配** — 匹配 `package.json` 等配置文件中的依赖名
> - 用于识别**框架和库**（如 `react` → React）
> - 因为 `react` 不是文件名，而是 `package.json` 里 `dependencies` 的 key
>
> **为什么需要两层？** 因为有些技术只能通过文件识别（如 Docker），有些只能通过依赖识别（如 React）。如果只用一层，会漏掉另一层才能识别的技术。
>
> **实际效果**：对于一个 `package.json` 里有 `"react": "^18.0.0"` 的项目：
> - 第一层匹配 `package.json` → 识别出 JavaScript
> - 第二层匹配 `react` → 识别出 React

---

### Q3: `detectArchitecture()`（第 214-237 行）的权重打分算法有什么优缺点？

**源码片段**：
```typescript
// 第 116-124 行
const ARCH_PATTERNS: ArchPattern[] = [
  { type: 'microservice', indicators: ['docker-compose', 'k8s', 'api-gateway', 'service-discovery'], weight: 3 },
  { type: 'spa', indicators: ['react', 'vue', 'angular', 'svelte'], weight: 2 },
  { type: 'cli', indicators: ['commander', 'yargs', 'inquirer', 'cli.js'], weight: 2 },
  // ...
];

// 第 224-230 行
for (const pattern of ARCH_PATTERNS) {
  for (const indicator of pattern.indicators) {
    if (allItems.some(item => item.toLowerCase().includes(indicator.toLowerCase()))) {
      scores[pattern.type] += pattern.weight;
    }
  }
}

// 第 232-236 行
const bestType = Object.entries(scores)
  .filter(([k]) => k !== 'unknown')
  .sort((a, b) => b[1] - a[1])[0];
return bestType && bestType[1] > 0 ? bestType[0] as ArchType : 'unknown';
```

**回答**：

> **优点**：
> 1. **简单直观**：权重是人工设定的，容易理解和调整
> 2. **容错性好**：即使某个指标缺失，其他指标仍能工作。比如没有 `api-gateway` 但有 `docker-compose` + `k8s`，微服务仍有 6 分
> 3. **可扩展**：新增架构类型只需在 `ARCH_PATTERNS` 数组里加一行
>
> **缺点**：
> 1. **权重是经验值**：`microservice` 的 weight 是 3，`library` 是 1，这个比例是拍脑袋定的，没有数据支撑
> 2. **关键词冲突**：`react` 同时出现在 `spa` 和 `mobile`（react-native）的 indicators 里，可能导致误判
> 3. **语义太弱**：`includes()` 是子串匹配，`k8s` 可能匹配到无关的文件名
>
> **如果要改进**：
> - 用 TF-IDF 或机器学习模型替代手工权重
> - 增加上下文分析（比如同时有 `react` 和 `react-native` 时优先判 mobile）
> - 支持多架构混合（比如「微服务 + SPA」）

---

### Q4: `analyzeGit()`（第 344-392 行）的 `execSync` 有什么风险？为什么不用异步？

**源码片段**：
```typescript
// 第 345 行
const { execSync } = require('child_process');

// 第 351-356 行
const exec = (cmd: string) => {
  try {
    return execSync(cmd, { cwd: this.projectPath, encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
};
```

**回答**：

> **风险**：
> 1. **阻塞事件循环**：`execSync` 会阻塞 Node.js 进程直到命令执行完成。如果 `git log` 在一个超大仓库（10万+ commits）上执行，可能阻塞几秒甚至更久
> 2. **命令注入**：如果 `projectPath` 包含恶意字符，可能被注入到 shell 命令中。不过这里用的是 `cwd` 参数而不是拼接命令，风险较小
> 3. **超时问题**：没有设置 timeout，如果 git 挂起（比如等待 SSH 密码），进程会一直卡住
>
> **为什么不用异步？**
> - 这里用了 `Promise.all()`（第 139-155 行）并行执行多个分析任务，`analyzeGit()` 只是其中一个
> - `execSync` 在这个上下文中不会阻塞其他任务，因为 `Promise.all` 会让每个任务在独立的微任务中执行
> - 但如果要改成 `exec`（异步），代码会更复杂（需要 promisify），收益不大
>
> **改进方案**：
> ```typescript
> // 加超时保护
> execSync(cmd, { cwd: this.projectPath, encoding: 'utf-8', timeout: 10000 });
> ```

---

### Q5: `matchPattern()`（第 501-507 行）的 glob 匹配实现有什么问题？

**源码片段**：
```typescript
// 第 501-507 行
private matchPattern(filename: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(filename);
  }
  return filename === pattern || filename.endsWith('/' + pattern) || filename.includes(pattern);
}
```

**回答**：

> **问题**：
>
> 1. **`*` 转义不完整**：`pattern.replace(/\*/g, '.*')` 只处理了 `*`，但没有转义其他正则特殊字符。如果 pattern 是 `*.ts`，没问题；但如果是 `package.json`，`.` 没有被转义，会匹配 `packageXjson` 这样的异常文件名
>
> 2. **`includes()` 太宽松**：第 506 行的 `filename.includes(pattern)` 会导致误匹配。比如 pattern 是 `nginx`，会匹配到 `my-nginx-config.txt` 这种无关文件
>
> 3. **不支持 `**` 和 `?`**：标准的 glob 支持 `**`（递归匹配目录）和 `?`（匹配单个字符），这里只支持 `*`
>
> **改进方案**：
> ```typescript
> private matchPattern(filename: string, pattern: string): boolean {
>   if (pattern.includes('*')) {
>     // 转义所有正则特殊字符，再替换 glob 通配符
>     const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
>     const regex = new RegExp('^' + escaped.replace(/\*/g, '.*') + '$');
>     return regex.test(filename);
>   }
>   return filename === pattern || filename.endsWith('/' + pattern);
> }
> ```

---

## 2. resume-parser.ts — 简历解析器

### 源码位置：`src/core/resume-parser.ts`

---

### Q6: `extractFromText()`（第 184-234 行）的置信度计算公式是怎么设计的？为什么除以 4？

**源码片段**：
```typescript
// 第 204-231 行
const personalResult = this.extractPersonalInfo(lines, text);
confidence += personalResult.confidence;  // 最高约 0.85

const skillsResult = this.extractSkills(lines, text);
confidence += skillsResult.confidence;    // 最高 0.3

const eduResult = this.extractEducation(lines, text);
confidence += eduResult.confidence;       // 最高约 0.35

const workResult = this.extractWorkAndProjects(lines, text);
confidence += workResult.confidence;      // 最高约 0.4

// 第 231 行
confidence = Math.min(confidence / 4, 1);
```

**回答**：

> **设计思路**：
>
> 四个提取器各自输出 0-1 的置信度，但它们的上限不同：
> - `extractPersonalInfo`：最高约 0.85（邮箱 0.2 + 电话 0.1 + GitHub 0.1 + 姓名 0.2 + 职位 0.15 + 简介 0.15）
> - `extractSkills`：最高 0.3
> - `extractEducation`：最高约 0.35
> - `extractWorkAndProjects`：最高约 0.4
>
> 理论最大值：0.85 + 0.3 + 0.35 + 0.4 = 1.9
>
> 除以 4 是为了**归一化到 0-1 区间**。但实际上理论最大值是 1.9 不是 4，所以这个除数偏大，会导致置信度偏低。
>
> **这是一个设计缺陷**。更准确的做法是：
> ```typescript
> // 按各模块的理论最大值归一化
> const maxConfidence = 0.85 + 0.3 + 0.35 + 0.4; // 1.9
> confidence = Math.min(confidence / maxConfidence, 1);
> ```
>
> **面试时可以说**：「置信度计算是一个加权求和 + 归一化的过程。当前的除数 4 是一个保守估计，宁可让置信度偏低触发 AI 二次解析，也不要偏高导致误判。」

---

### Q7: `extractPersonalInfo()`（第 239-325 行）的姓名提取逻辑（第 283-287 行）有什么问题？

**源码片段**：
```typescript
// 第 283-287 行
const firstNonEmptyLine = lines.find(l => l.length > 0 && l.length < 20);
if (firstNonEmptyLine && !firstNonEmptyLine.includes('@') && !firstNonEmptyLine.match(/\d{3}/)) {
  info.name = firstNonEmptyLine;
  confidence += 0.2;
}
```

**回答**：

> **问题**：
>
> 1. **假设太强**：假设简历第一行就是姓名，但很多简历第一行可能是「个人简历」、「Resume」等标题
>
> 2. **过滤条件太弱**：只排除了包含 `@` 和三位数字的行，但没有排除：
>    - 「求职意向：前端工程师」
>    - 「13800138000」（手机号刚好没有连续三位数字的情况）
>    - 「北京市海淀区」
>
> 3. **长度限制 20 字符**：对于英文名 `John Smith` 没问题，但对于中文名「欧阳娜娜」（4 字符）也 OK。但如果第一行是「Senior Software Engineer」（27 字符），会被跳过
>
> **改进方案**：
> ```typescript
> // 结合多种信号判断姓名
> const namePatterns = [
>   /^[一-龥]{2,4}$/,  // 纯中文 2-4 字
>   /^[A-Z][a-z]+ [A-Z][a-z]+$/,  // 英文名格式
> ];
> const isName = namePatterns.some(p => p.test(firstNonEmptyLine));
> const isNotTitle = !/工程师|开发|经理|Engineer|Developer|Manager/i.test(firstNonEmptyLine);
> if (isName && isNotTitle) {
>   info.name = firstNonEmptyLine;
> }
> ```

---

### Q8: `extractSkills()`（第 330-388 行）的状态机是怎么工作的？

**源码片段**：
```typescript
// 第 342-377 行
let inSkillSection = false;
let currentCategory = '技术技能';
let currentSkills: string[] = [];

for (const line of lines) {
  // 检测技能部分开始
  if (skillSectionPatterns.some(p => p.test(line))) {
    inSkillSection = true;
    continue;
  }

  // 检测其他部分开始（结束技能部分）
  if (inSkillSection && /^(?:工作|项目|教育|经历|Work|Projects|Education|Experience)/.test(line)) {
    if (currentSkills.length > 0) {
      skills.push({ category: currentCategory, skills: currentSkills });
    }
    inSkillSection = false;
    break;
  }

  if (inSkillSection) {
    // 检测分类行（如 "前端: React, Vue"）
    const categoryMatch = line.match(/^[\s]*[•\-*]?\s*(.+?)[：:]\s*(.+)/);
    if (categoryMatch) {
      if (currentSkills.length > 0) {
        skills.push({ category: currentCategory, skills: currentSkills });
      }
      currentCategory = categoryMatch[1].trim();
      currentSkills = categoryMatch[2].split(/[,，、|]/).map(s => s.trim()).filter(Boolean);
    } else {
      const skillItems = line.split(/[,，、|]/).map(s => s.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean);
      currentSkills.push(...skillItems);
    }
  }
}
```

**回答**：

> 这是一个简单的**有限状态机（FSM）**，有两个状态：
>
> ```
> ┌─────────────┐    遇到技能标题     ┌─────────────┐
> │  非技能区域  │ ─────────────────→ │  技能区域    │
> │ (inSkill=F) │                    │ (inSkill=T) │
> └─────────────┘ ←───────────────── └─────────────┘
>                  遇到其他部分标题
> ```
>
> **在技能区域内**，逐行处理：
> 1. 遇到「分类行」（如 `前端: React, Vue`）→ 保存当前分类，开始新分类
> 2. 遇到普通行 → 按分隔符（逗号、顿号、竖线）拆分，追加到当前分类
>
> **优点**：逻辑清晰，易于理解和维护
>
> **缺点**：
> 1. **状态转换不可靠**：用正则 `/^(?:工作|项目|教育|...)/` 判断「离开技能区域」，但有些简历的标题格式不标准（如「◆ 工作经历」）
> 2. **不支持嵌套**：如果技能区域里有子分类，会被当成普通技能行
> 3. **break 过早**：第 359 行遇到第一个非技能标题就 `break`，但如果简历结构是「技能 → 工作 → 技能补充」，后面的技能会被忽略

---

## 3. resume-merger.ts — 简历合并器

### 源码位置：`src/core/resume-merger.ts`

---

### Q9: `isSimilarProject()`（第 253-268 行）的三层判断逻辑是怎么工作的？有什么边界情况？

**源码片段**：
```typescript
// 第 253-268 行
private isSimilarProject(a: ProjectEntry, b: ProjectEntry): boolean {
  // 名称完全匹配
  if (a.name.toLowerCase() === b.name.toLowerCase()) return true;

  // 名称包含关系
  if (a.name.toLowerCase().includes(b.name.toLowerCase()) ||
    b.name.toLowerCase().includes(a.name.toLowerCase())) return true;

  // 技术栈重叠度超过 70%
  const aTechs = new Set(a.techStack.map(t => t.toLowerCase()));
  const bTechs = b.techStack.map(t => t.toLowerCase());
  const overlap = bTechs.filter(t => aTechs.has(t)).length;
  if (bTechs.length > 0 && overlap / bTechs.length > 0.7) return true;

  return false;
}
```

**回答**：

> **三层判断**：
>
> 1. **名称完全匹配**：最严格，`"电商平台" === "电商平台"`
> 2. **名称包含关系**：宽松一些，`"电商平台" 包含 "电商"` → true
> 3. **技术栈重叠**：最宽松，只要 70% 的技术栈相同就认为是同一项目
>
> **边界情况**：
>
> | 场景 | 结果 | 问题 |
> |------|------|------|
> | "电商平台" vs "电商后台" | true | 第二层包含关系会误判 |
> | "React 项目" vs "Vue 项目" | 取决于技术栈 | 如果都有 React+Vue+Node，第三层会误判 |
> | 空技术栈 `[]` vs `[]` | false | `bTechs.length > 0` 保护了除零错误 |
> | "ABC" vs "ABCD" | true | 包含关系太宽松 |
>
> **面试时可以说**：「这是一个权衡精确度和召回率的设计。三层判断从严格到宽松，优先保证不遗漏（高召回率），接受一定的误判（低精确度）。因为简历合并时误判的代价只是「合并了不该合并的项目」，用户可以手动调整；但漏判的代价是「简历里出现重复项目」，更难发现。」

---

### Q10: `mergeProjectEntries()`（第 273-297 行）的合并策略是什么？为什么用 `isSimilarText` 而不是精确匹配？

**源码片段**：
```typescript
// 第 273-297 行
private mergeProjectEntries(existing: ProjectEntry, incoming: ProjectEntry): ProjectEntry {
  const mergedResponsibilities = [...existing.responsibilities];
  for (const resp of incoming.responsibilities) {
    if (!mergedResponsibilities.some(r => this.isSimilarText(r, resp))) {
      mergedResponsibilities.push(resp);
    }
  }

  const mergedAchievements = [...existing.achievements];
  for (const ach of incoming.achievements) {
    if (!mergedAchievements.some(a => this.isSimilarText(a, ach))) {
      mergedAchievements.push(ach);
    }
  }

  const mergedTechStack = [...new Set([...existing.techStack, ...incoming.techStack])];

  return {
    ...existing,
    description: incoming.description || existing.description,
    techStack: mergedTechStack,
    responsibilities: mergedResponsibilities,
    achievements: mergedAchievements,
  };
}
```

**回答**：

> **合并策略**：
> - **职责和成果**：增量添加，用 `isSimilarText` 去重（模糊匹配）
> - **技术栈**：集合合并，用 `Set` 去重（精确匹配）
> - **描述**：用新的覆盖旧的（`incoming.description || existing.description`）
>
> **为什么用模糊匹配？**
>
> 考虑这个场景：
> ```
> 旧职责：「主导前端架构设计，使用 React + TypeScript」
> 新职责：「主导前端架构设计，使用React+TypeScript」
> ```
>
> 这两条语义相同，但格式略有不同（空格、符号）。如果用精确匹配，会被当成两条不同的职责。`isSimilarText` 先归一化（转小写、去除标点），再比较，能识别这种情况。
>
> **`isSimilarText` 的实现**（第 344-347 行）：
> ```typescript
> private isSimilarText(a: string, b: string): boolean {
>   const normalize = (s: string) => s.toLowerCase().replace(/[^\w一-龥]/g, '');
>   return normalize(a) === normalize(b);
> }
> ```
>
> **局限**：只能处理格式差异，不能处理语义相似但措辞不同的情况（如「性能优化」vs「提升系统性能」）。要处理语义相似需要用 NLP 或 Embedding。

---

## 4. exporter.ts — 导出器

### 源码位置：`src/core/exporter.ts`

---

### Q11: `markdownToHTML()`（第 203-228 行）的正则替换有什么顺序问题？

**源码片段**：
```typescript
// 第 205-214 行
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
```

**回答**：

> **顺序是精心安排的**：
>
> 1. **先处理标题**（h3 → h2 → h1）：因为 `## ` 是 `# ` 的超集，如果先处理 h1，`## 标题` 会被错误匹配
> 2. **再处理强调**（粗体 → 斜体）：粗体 `**text**` 包含斜体 `*text*` 的符号，如果先处理斜体，粗体会被破坏
> 3. **再处理列表**（li → ul）：先把 `- item` 转成 `<li>item</li>`，再把连续的 `<li>` 包进 `<ul>`
> 4. **最后处理换行**：`\n\n`（段落）优先于 `\n`（行内换行）
>
> **问题**：
>
> 1. **粗体会吃掉斜体**：`***粗斜体***` 会被先匹配粗体变成 `<strong>*粗斜体*</strong>`，斜体符号残留
> 2. **列表嵌套不支持**：所有 `<li>` 都被包进同一个 `<ul>`，不支持嵌套列表
> 3. **HTML 注入**：如果简历内容包含 `<script>` 标签，不会被转义，可能导致 XSS
>
> **改进方案**：使用成熟的 Markdown 解析库如 `marked` 或 `markdown-it`

---

### Q12: `getTemplateCSS()`（第 233-316 行）的 CSS 主题是怎么实现的？有什么设计模式？

**源码片段**：
```typescript
// 第 233-316 行
private getTemplateCSS(style: string): string {
  const base = `
    body { font-family: ... }
    ul { padding-left: 20px; }
    // ...
  `;

  const themes: Record<string, string> = {
    default: `${base} h1 { color: #1a1a1a; ... }`,
    professional: `${base} body { border-top: 4px solid #1a237e; ... }`,
    creative: `${base} body { background: linear-gradient(...); ... }`,
    // ...
  };

  return themes[style] || themes.default;
}
```

**回答**：

> **设计模式**：**策略模式 + 模板方法模式**
>
> - **策略模式**：`themes` 对象存储了多个 CSS 策略，根据 `style` 参数选择
> - **模板方法模式**：`base` 变量定义了公共样式（模板），每个主题在 `base` 基础上扩展（覆写）
>
> **为什么用字符串拼接而不是 CSS-in-JS？**
> 1. 这些 CSS 最终要嵌入到 HTML 字符串中给 puppeteer 渲染，不需要 CSS-in-JS 的运行时能力
> 2. 字符串拼接最简单，没有额外依赖
> 3. 每个主题的 CSS 量很小（10-15 行），不需要模块化
>
> **`|| themes.default` 的作用**：兜底处理未知的 style 值，确保不会返回 `undefined`

---

### Q13: `exportPDF()`（第 53-80 行）的 puppeteer 使用有什么最佳实践？

**源码片段**：
```typescript
// 第 60-70 行
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
```

**回答**：

> **最佳实践**：
>
> 1. **`headless: true`**：无头模式，不显示浏览器窗口，适合服务器环境
> 2. **`waitUntil: 'networkidle0'`**：等待页面没有网络请求再生成 PDF，确保字体、图片等资源加载完成
> 3. **`printBackground: true`**：打印背景色和背景图，否则创意模板的渐变背景不会显示
> 4. **`browser.close()`**：及时关闭浏览器释放内存
>
> **问题**：
>
> 1. **没有错误恢复**：如果 `page.pdf()` 抛异常，`browser.close()` 不会被执行（虽然有 try-catch，但 catch 里没有 close）
> 2. **没有并发控制**：如果同时调用多次 `exportPDF()`，会启动多个 Chrome 进程，可能耗尽内存
> 3. **启动开销大**：每次调用都启动一个新的 Chrome 进程，约 200-500ms
>
> **改进方案**：
> ```typescript
> // 使用 try-finally 确保关闭
> const browser = await puppeteer.launch({ headless: true });
> try {
>   const page = await browser.newPage();
>   await page.setContent(html, { waitUntil: 'networkidle0' });
>   await page.pdf({ ... });
> } finally {
>   await browser.close();
> }
>
> // 或者使用浏览器池复用实例
> ```

---

## 5. index.ts — 入口与编排

### 源码位置：`src/index.ts`

---

### Q14: `quickGenerate()`（第 67-166 行）的两条分支（模式 A / 模式 B）是怎么编排的？

**源码片段**：
```typescript
// 第 86-144 行
if (existingResumePath) {
  // 模式 A：在已有简历基础上补充项目经历
  const parser = new ResumeParser();
  const parseResult = await parser.parse(existingResumePath);

  let existingResume: Partial<Resume>;
  if (parseResult.confidence < 0.5) {
    console.log(`⚠️  解析置信度较低...`);
    existingResume = parseResult.resume;
  } else {
    existingResume = parseResult.resume;
  }

  const merger = new ResumeMerger();
  const baseResume: Resume = { ... };
  resume = merger.mergeWithAnalysis(baseResume, analysis, { projectOrder: 'prepend', mergeSkills: true });

  if (personalInfo) {
    resume.personalInfo = { ...resume.personalInfo, ...personalInfo };
  }

  resume = manager.create(resume);
} else {
  // 模式 B：从零生成简历
  const generator = new ResumeGenerator();
  const draft = generator.generateDraft(analysis, { lang, template, targetRole, personalInfo });
  resume = manager.create(draft);
}
```

**回答**：

> **编排逻辑**：
>
> ```
> quickGenerate()
>   │
>   ├── 1. 分析项目（两条分支共享）
>   │
>   ├── 2. 判断模式
>   │     ├── existingResumePath 存在 → 模式 A
>   │     └── 不存在 → 模式 B
>   │
>   ├── 3A. 模式 A：解析 → 合并 → 保存
>   │     ├── parse(existingResumePath)
>   │     ├── confidence < 0.5 ? 警告 : 继续
>   │     ├── mergeWithAnalysis(baseResume, analysis)
>   │     └── manager.create(resume)
>   │
>   ├── 3B. 模式 B：生成 → 保存
>   │     ├── generateDraft(analysis, options)
>   │     └── manager.create(draft)
>   │
>   ├── 4. 渲染 Markdown（共享）
>   │
>   └── 5. 可选导出（共享）
> ```
>
> **设计亮点**：
> 1. **共享步骤提取**：项目分析、Markdown 渲染、导出是两条分支共享的，避免代码重复
> 2. **置信度检查**：低置信度时只打印警告，不阻断流程，让用户决定是否继续
> 3. **个人信息合并**：`personalInfo` 参数会覆盖解析出的个人信息，给用户修正的机会
>
> **问题**：
> 1. **置信度 < 0.5 时没有降级策略**：只是打印警告，仍然使用低质量的解析结果
> 2. **没有回滚机制**：如果合并后的简历有问题，需要手动调用 `manager.delete()` 删除

---

## 6. types/index.ts — 类型设计

### 源码位置：`src/types/index.ts`

---

### Q15: `Resume` 接口的 `projects` 和 `workExperience[].projects` 有什么区别？为什么要分开？

**源码片段**：
```typescript
// 第 112-124 行
export interface Resume {
  id: string;
  personalInfo: PersonalInfo;
  workExperience: WorkEntry[];  // 包含 projects
  projects: ProjectEntry[];     // 独立项目
  education: EducationEntry[];
  skills: SkillSection[];
  // ...
}

// 第 87-92 行
export interface WorkEntry {
  company: string;
  title: string;
  projects: ProjectEntry[];  // 公司下的项目
}
```

**回答**：

> **两种项目**：
>
> 1. **`workExperience[].projects`**：公司内的项目，隶属于某段工作经历
>    - 例：在字节跳动做的「电商平台」项目
>    - 有上下文：公司名、职位、时间段
>
> 2. **`Resume.projects`**：独立项目，不属于任何工作经历
>    - 例：个人开源项目、Side Project
>    - 没有公司上下文
>
> **为什么要分开？**
>
> 简历排版时需要不同的展示方式：
> ```
> ## 工作经历
> ### 字节跳动 | 高级前端工程师
>   #### 电商平台 — 前端负责人    ← workExperience[].projects
>   #### 用户中心 — 前端开发      ← workExperience[].projects
>
> ## 项目经历
> ### 开源组件库                  ← Resume.projects（独立展示）
> ```
>
> **面试时可以说**：「这是一个领域建模的问题。工作经历和项目经历在简历中是两种不同的实体，它们之间是「一对多」的关系。把项目放在工作经历下面，能保持简历的层次结构。」

---

## 7. 架构级追问

### Q16: 整个系统的数据流是怎样的？画出完整的数据流图。

**回答**：

```
输入                     处理                        输出
─────                    ─────                       ─────

项目目录                 ProjectAnalyzer              ProjectAnalysis
  │                      ├── detectTechStack()         ├── techStack
  │                      ├── detectArchitecture()      ├── architecture
  │                      ├── analyzeGit()              ├── gitContribution
  │                      └── extractFeatures()         └── features
  │
  │                      ResumeParser                  ParseResult（可选）
已有简历（PDF/Word）      ├── parsePDF/Word()           ├── resume
  │                      ├── extractFromText()         ├── confidence
  │                      └── generateAIParsePrompt()   └── aiPrompt
  │
  │                      ResumeMerger                  Resume
  │（合并）               ├── mergeWithAnalysis()       ├── projects（合并后）
  │                      ├── mergeSkills()             ├── skills（去重后）
  │                      └── isSimilarProject()        └── workExperience
  │
  │                      ResumeGenerator               Partial<Resume>
  │（从零生成）            ├── generateDraft()           ├── projects
  │                      └── generatePrompt()          └── skills
  │
  │                      TemplateEngine                string（Markdown）
  │（渲染）               └── render()
  │
  │                      Exporter                      string（文件路径）
  └（导出）               ├── exportMarkdown()
                          ├── exportPDF()               .md / .pdf / .docx
                          └── exportWord()
```

---

### Q17: 如果要给这个项目加单元测试，你会怎么设计测试用例？

**回答**：

> **核心原则**：测试纯函数，mock 外部依赖（文件系统、git 命令）
>
> ```typescript
> // analyzer.test.ts
> describe('ProjectAnalyzer', () => {
>   // 用 fixture 目录模拟不同项目
>   it('应识别 React 项目', async () => {
>     const analyzer = new ProjectAnalyzer('./fixtures/react-project');
>     const techStack = await analyzer.detectTechStack();
>     expect(techStack.frameworks).toContain('React');
>   });
>
>   it('应识别 Go 项目', async () => {
>     const analyzer = new ProjectAnalyzer('./fixtures/go-project');
>     const techStack = await analyzer.detectTechStack();
>     expect(techStack.languages).toContain('Go');
>   });
>
>   it('无 Git 仓库时应返回 undefined', async () => {
>     const analyzer = new ProjectAnalyzer('./fixtures/no-git');
>     const git = await analyzer.analyzeGit();
>     expect(git).toBeUndefined();
>   });
> });
>
> // merger.test.ts
> describe('ResumeMerger', () => {
>   it('同名项目应合并而非重复', () => {
>     const merger = new ResumeMerger();
>     const result = merger.mergeWithAnalysis(existing, analysis);
>     expect(result.projects.filter(p => p.name === '电商平台')).toHaveLength(1);
>   });
>
>   it('不同项目应都保留', () => {
>     const merger = new ResumeMerger();
>     const result = merger.mergeWithAnalysis(existing, analysis);
>     expect(result.projects).toHaveLength(2);
>   });
>
>   it('重复技能应去重', () => {
>     const merger = new ResumeMerger();
>     const result = merger.mergeWithAnalysis(existing, analysis);
>     const reactCount = result.skills
>       .flatMap(s => s.skills)
>       .filter(s => s === 'React').length;
>     expect(reactCount).toBe(1);
>   });
> });
>
> // parser.test.ts
> describe('ResumeParser', () => {
>   it('应提取邮箱', () => {
>     const parser = new ResumeParser();
>     const result = parser['extractFromText']('联系我：test@example.com');
>     expect(result.resume.personalInfo?.email).toBe('test@example.com');
>   });
>
>   it('应提取中文手机号', () => {
>     const result = parser['extractFromText']('电话：13800138000');
>     expect(result.resume.personalInfo?.phone).toBe('13800138000');
>   });
>
>   it('置信度应随提取字段增加而提高', () => {
>     const low = parser['extractFromText']('张三');
>     const high = parser['extractFromText']('张三\nzhangsan@test.com\n13800138000\n技能: React, Vue');
>     expect(high.confidence).toBeGreaterThan(low.confidence);
>   });
> });
> ```

---

### Q18: 项目中有哪些可以优化的性能瓶颈？

**回答**：

> | 瓶颈 | 位置 | 优化方案 |
> |------|------|---------|
> | `listFiles()` 递归扫描 | analyzer.ts:442 | 用 `glob` 库替代，支持流式处理 |
> | `execSync` 阻塞 | analyzer.ts:345 | 改用 `exec`（异步），加超时保护 |
> | `readFileSync` 同步读取 | analyzer.ts:247,470 等 | 改用 `fs.promises.readFile` |
> | puppeteer 启动开销 | exporter.ts:60 | 用浏览器池复用实例 |
> | `matchPattern` 嵌套循环 | analyzer.ts:195-201 | 用 Set 或 Trie 树优化查找 |
> | Markdown 正则替换 | exporter.ts:205-214 | 用 `marked` 库替代，性能更好 |
>
> **最大的瓶颈**是 `listFiles()` + `collectDependencies()` 的双重扫描。当前代码在 `detectTechStack()` 和 `detectArchitecture()` 中分别调用了这两个方法，导致文件系统被扫描了两次。可以通过缓存解决：
>
> ```typescript
> private fileCache: string[] | null = null;
> private depCache: string[] | null = null;
>
> private async getCachedFiles(): Promise<string[]> {
>   if (!this.fileCache) this.fileCache = await this.listFiles(this.projectPath, 3);
>   return this.fileCache;
> }
> ```
