# 按照项目生成简历 Skill — 面试深度准备手册

> 本文档模拟资深面试官从浅到深的提问方式，帮助你逐步理解项目底层原理。
> 每个问题都有「小白版」和「进阶版」回答。

---

## 目录

1. [项目概述类问题](#1-项目概述类问题)
2. [架构设计类问题](#2-架构设计类问题)
3. [技术实现类问题](#3-技术实现类问题)
4. [设计模式类问题](#4-设计模式类问题)
5. [工程实践类问题](#5-工程实践类问题)
6. [性能与优化类问题](#6-性能与优化类问题)
7. [扩展性与可维护性](#7-扩展性与可维护性)
8. [深度追问（资深面试官风格）](#8-深度追问资深面试官风格)

---

## 1. 项目概述类问题

### Q1: 用一分钟介绍一下你这个项目

**小白版回答：**

> 我做了一个"根据项目自动生成简历"的工具。它能扫描你正在开发的项目，自动识别你用了什么技术栈（比如 React、Node.js）、项目是什么架构（微服务还是单体）、你提交了多少代码。然后根据这些信息，用 AI 帮你写一份专业的简历。
>
> 它支持 Claude Code、Cursor、Windsurf 等主流 AI Coding 工具，还能导出 PDF 和 Word。

**进阶版回答：**

> 这是一个跨平台的 AI Coding Skill，核心解决的问题是：**开发者有技术能力但不擅长写简历**。
>
> 架构上分为三层：
> 1. **核心引擎层**（平台无关）：项目分析器、简历生成器、简历管理器、模板引擎、导出器
> 2. **适配层**：为 Claude Code、Cursor、Windsurf 等平台提供各自的规则文件
> 3. **数据层**：简历以 JSON 持久化，支持 CRUD 和版本管理
>
> 技术上，项目分析器通过文件扫描 + 依赖解析 + Git 历史分析来提取项目信息，简历生成器使用 STAR 法则 + AI Prompt 生成专业内容，导出器支持 Markdown/PDF/Word 三种格式，PDF 渲染用 puppeteer，Word 用 docx 库。

---

### Q2: 为什么要做这个项目？解决了什么痛点？

**小白版：**

> 写简历很痛苦。尤其是技术人，知道自己做了什么，但不知道怎么写成简历上的文字。而且每次换工作都要重新写，很浪费时间。这个工具能自动从你的项目里提取信息，帮你写简历。

**进阶版：**

> 痛点有三个层面：
> 1. **信息提取难**：开发者做了很多工作，但没有量化记录。项目用了什么技术、自己贡献了多少代码、性能优化了多少，这些数据散落在代码仓库和 Git 历史里，需要工具来提取。
> 2. **表达能力弱**：技术人擅长写代码，不擅长写文字。STAR 法则、量化成果、强动词这些简历技巧，很多人不知道。
> 3. **重复劳动**：每次求职都要重新整理简历，如果有工具能自动同步项目信息，就能大幅减少重复工作。
>
> 我的项目通过 **自动化信息提取 + AI 内容生成 + 模板系统** 解决了这三个问题。

---

## 2. 架构设计类问题

### Q3: 为什么选择「核心引擎 + 适配层」的架构？有没有考虑过其他方案？

**小白版：**

> 因为我想让这个工具能在多个 AI 平台上使用。如果每个平台都写一套完整逻辑，代码会重复很多。所以我把核心逻辑抽出来，每个平台只需要写一个"翻译层"，告诉 AI 怎么调用核心逻辑就行。

**进阶版：**

> 考虑过三种方案：
>
> **方案 A：每个平台独立实现**
> - 优点：每个平台可以针对其特性做最优适配
> - 缺点：代码重复率高，维护成本是 N 倍
>
> **方案 B：核心引擎 + 适配层**（最终选择）
> - 优点：核心逻辑复用，新增平台只需加适配文件，符合开闭原则
> - 缺点：适配层能力受限于核心引擎的接口设计
>
> **方案 C：微服务架构，每个模块独立部署**
> - 优点：极致解耦，可以独立扩展
> - 缺点：对于一个 Skill 工具来说太重了，部署和运维成本高
>
> 最终选方案 B 是因为：这是一个**本地工具**，不需要网络通信，核心引擎和适配层在同一进程内运行，方案 B 的复杂度刚好合适。

**追问：如果要支持 10 个平台，这个架构还能撑住吗？**

> 可以。因为适配层是 **声明式** 的（本质上就是告诉 AI "遇到这个意图时调用哪个函数"），不是命令式的代码。新增平台只需要：
> 1. 在 `src/adapters/` 下加一个目录
> 2. 写一个规则文件（Markdown 格式）
> 3. 运行 `setup.sh` 部署
>
> 核心引擎零改动。这就是开闭原则的体现——对扩展开放，对修改关闭。

---

### Q4: 项目分析器的设计思路是什么？怎么做到"智能"识别技术栈？

**小白版：**

> 我预定义了一个"技术识别表"，里面记录了每种技术对应的特征文件。比如看到 `package.json` 里有 `react` 依赖，就知道这个项目用了 React。看到 `Dockerfile`，就知道用了 Docker。

**进阶版：**

> 项目分析器采用 **多维度特征匹配** 策略：
>
> ```
> 技术栈识别 = 文件特征匹配 + 依赖解析 + 目录结构分析
> ```
>
> 具体来说：
>
> **第一层：文件特征匹配**
> - 扫描项目目录（最深 3 层），收集所有文件名
> - 匹配预定义的 30+ 种特征文件（如 `tsconfig.json` → TypeScript，`go.mod` → Go）
>
> **第二层：依赖解析**
> - 读取 `package.json` 的 `dependencies` + `devDependencies`
> - 读取 `requirements.txt`、`go.mod` 等
> - 匹配 50+ 种框架/库的依赖名
>
> **第三层：架构模式识别**
> - 基于关键词权重打分：有 `docker-compose` + `k8s` + `api-gateway` → 微服务（权重 3+3+3=9）
> - 有 `react` + `vue` → SPA（权重 2+2=4）
> - 取最高分的架构类型
>
> **第四层：Git 贡献分析**
> - `git rev-list --count HEAD` → 总提交数
> - `git log --reverse --format=%ai` → 首次/最近提交时间
> - `git diff --shortstat` → 代码增删行数
>
> 这种分层设计的好处是：即使某一层失败（比如没有 Git 仓库），其他层仍然能工作。

**追问：如果一个项目同时用了 React 和 Vue 怎么办？**

> 都会识别出来。技术栈识别是 **集合收集**，不是互斥判断。最终在简历上会写 "技术栈涵盖 React、Vue 等 5 项技术"。实际上这种情况在微前端架构中很常见。

---

### Q5: 简历解析器是怎么从 PDF/Word 中提取结构化数据的？

**小白版：**

> PDF 和 Word 本质上是"带格式的文本"。我用库把它们转成纯文本，然后用正则表达式（一种文本匹配工具）去找关键信息，比如邮箱、电话、学校名。最后把找到的信息组装成简历数据。

**进阶版：**

> 解析流程分三步：
>
> ```
> 原始文件 → 文本提取 → 规则引擎解析 → AI 二次解析（可选）
> ```
>
> **Step 1：文本提取**
> - PDF：用 `pdf-parse` 库，它底层是 Mozilla 的 PDF.js，能提取文本层
> - Word：用 `mammoth` 库，它解析 .docx 的 XML 结构提取文本
>
> **Step 2：规则引擎解析**
> 这是最核心的部分，我设计了一个 **分块 + 模式匹配** 的策略：
>
> ```
> 1. 按标题分块：找到 "工作经历"、"项目经历"、"教育背景" 等标题，把文本切成块
> 2. 块内提取：
>    - 个人信息块：正则匹配邮箱、电话、GitHub
>    - 技能块：按 "类别: 技能1, 技能2" 格式提取
>    - 工作块：按 "公司 | 职位" 格式提取
>    - 教育块：匹配 "大学"、"学院" 等关键词
> 3. 置信度评估：每个字段独立评分，总分 0-1
> ```
>
> **Step 3：AI 二次解析**
> 当置信度 < 0.5 时，生成一个结构化的 Prompt：
> - 包含原始文本
> - 包含初步解析结果
> - 指示 AI 输出 JSON 格式的简历数据
>
> 这样设计的好处是：**规则引擎零成本处理 70% 的标准简历，AI 处理剩下 30% 的非标简历**。

**追问：如果简历是扫描件（图片 PDF）怎么办？**

> 目前不支持。`pdf-parse` 只能提取文本层，扫描件没有文本层。要支持的话需要：
> 1. 用 OCR 引擎（如 Tesseract）提取文字
> 2. 再送入规则引擎/AI 解析
>
> 这是一个明确的已知限制，可以在 README 中说明。

---

## 3. 技术实现类问题

### Q6: STAR 法则在代码中是怎么体现的？

**小白版：**

> STAR 是简历写作技巧：Situation（背景）、Task（任务）、Action（行动）、Result（结果）。我在生成简历的 Prompt 里明确告诉 AI 按这个结构写，还给了示例。

**进阶版：**

> STAR 法则不是在代码里硬编码的，而是通过 **Prompt Engineering** 实现的。
>
> 在 `src/prompts/generate-resume.md` 中：
>
> ```
> 请按照模板格式，用专业的语言重写简历内容。要求：
> 1. 使用 STAR 法则描述项目经历（情境-任务-行动-结果）
> 2. 量化成果（性能提升百分比、代码量、用户数等）
> 3. 突出技术深度和解决问题的能力
> ```
>
> 同时在 Prompt 中提供了具体的反例和正例：
> ```
> ❌ "负责前端开发"
> ✅ "主导了 XX 系统的前端架构设计，使用 React + TypeScript 重构了 2W+ 行代码，
>    首屏加载时间从 3s 降至 1.2s，用户留存率提升 15%"
> ```
>
> 这种 **规则 + 示例** 的 Prompt 设计，比单纯给规则效果好很多。

---

### Q7: 模板引擎是怎么工作的？为什么不用 Handlebars 或 EJS？

**小白版：**

> 模板就是一个带占位符的 Markdown 文件，比如 `{{NAME}}` 会被替换成真实姓名。我用简单的字符串替换实现的，不需要引入复杂的模板库。

**进阶版：**

> 模板引擎用的是 **字符串插值**，核心代码：
>
> ```typescript
> private interpolate(template: string, vars: Record<string, string>): string {
>   let result = template;
>   for (const [key, value] of Object.entries(vars)) {
>     result = result.replace(new RegExp(key, 'g'), value);
>   }
>   return result;
> }
> ```
>
> **为什么不用 Handlebars/EJS？**
>
> | 维度 | 字符串插值 | Handlebars |
> |------|-----------|-----------|
> | 复杂度 | 极低 | 中等 |
> | 依赖 | 无 | 需要安装 |
> | 功能 | 只做替换 | 支持条件、循环 |
> | 适用场景 | 简单模板 | 复杂模板 |
>
> 当前的简历模板结构简单（标题 + 段落 + 列表），字符串插值足够。如果未来需要条件渲染（比如"有 GitHub 才显示 GitHub 链接"），可以升级到 Handlebars。
>
> 但升级时要注意 **向后兼容**——现有的模板文件不需要改动，只需要扩展引擎的能力。

---

### Q8: 导出 PDF 时，puppeteer 是怎么把 Markdown 变成 PDF 的？

**小白版：**

> puppeteer 是一个"无头浏览器"，可以理解成一个没有界面的 Chrome。我先把 Markdown 转成 HTML，然后用 puppeteer 打开这个 HTML，调用浏览器的"打印"功能，输出成 PDF。

**进阶版：**

> 导出链路是：
>
> ```
> Resume (JSON)
>   ↓ TemplateEngine.render()
> Markdown
>   ↓ markdownToHTML()
> HTML (带 CSS 样式)
>   ↓ puppeteer.launch() → page.setContent() → page.pdf()
> PDF 文件
> ```
>
> 关键代码：
>
> ```typescript
> const browser = await puppeteer.launch({ headless: true });
> const page = await browser.newPage();
> await page.setContent(html, { waitUntil: 'networkidle0' });
> await page.pdf({
>   path: filePath,
>   format: 'A4',
>   margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
>   printBackground: true,
> });
> ```
>
> `waitUntil: 'networkidle0'` 的意思是等到页面没有网络请求了再生成 PDF，确保所有资源加载完成。
>
> **为什么用 puppeteer 而不是 pdfkit/jsPDF？**
>
> - puppeteer：渲染效果最好（浏览器引擎），支持复杂 CSS，但体积大（~300MB）
> - pdfkit：轻量，但需要手动绘制每个元素，代码量大
> - jsPDF：中等，但 CSS 支持有限
>
> 对于简历这种需要精美排版的场景，puppeteer 是最佳选择。如果是在 CI/CD 环境中，可以用 puppeteer-core + 已安装的 Chrome。

---

### Q9: Word 导出用的 docx 库，它的底层原理是什么？

**小白版：**

> .docx 文件本质上是一个 ZIP 压缩包，里面有很多 XML 文件，描述了文档的结构和内容。docx 库帮你生成这些 XML 文件，然后打包成 .docx。

**进阶版：**

> .docx 是 Office Open XML (OOXML) 格式，结构如下：
>
> ```
> resume.docx (ZIP)
> ├── [Content_Types].xml      // 文件类型声明
> ├── _rels/.rels              // 关系定义
> ├── word/
> │   ├── document.xml         // 文档内容（核心）
> │   ├── styles.xml           // 样式定义
> │   ├── fontTable.xml        // 字体表
> │   └── _rels/document.xml.rels  // 文档内部关系
> ```
>
> `docx` 库的工作原理：
> 1. 创建 `Document` 对象，在内存中构建文档树
> 2. 添加 `Paragraph`、`TextRun` 等节点
> 3. `Packer.toBuffer()` 时，将文档树序列化为 XML
> 4. 用 `jszip` 打包成 ZIP
>
> ```typescript
> const doc = new Document({
>   sections: [{
>     children: [
>       new Paragraph({
>         children: [new TextRun({ text: "张三", bold: true, size: 32 })],
>         heading: HeadingLevel.HEADING_1,
>       }),
>     ],
>   }],
> });
> const buffer = await Packer.toBuffer(doc);
> ```
>
> `size: 32` 的单位是 half-points，所以 32 = 16pt 字号。

---

## 4. 设计模式类问题

### Q10: 项目中用了哪些设计模式？

**小白版：**

> 用了一些常见的设计模式，比如：
> - **单例模式**：简历管理器，全局只有一个实例
> - **策略模式**：导出器根据格式选择不同的导出策略（Markdown/PDF/Word）
> - **模板方法模式**：中英文简历的渲染流程相同，只是内容不同

**进阶版：**

> 项目中体现了以下设计模式：
>
> **1. 策略模式（Strategy Pattern）**
> ```typescript
> // Exporter 中根据 format 选择不同的导出策略
> switch (options.format) {
>   case 'markdown': return this.exportMarkdown(...);
>   case 'pdf':      return this.exportPDF(...);
>   case 'word':     return this.exportWord(...);
> }
> ```
> 未来可以改成注册式策略，支持用户自定义导出器。
>
> **2. 模板方法模式（Template Method Pattern）**
> ```typescript
> // TemplateEngine 中 renderZh 和 renderEn 共享相同的渲染流程
> render(resume) {
>   if (resume.lang === 'en') return this.renderEn(resume);
>   return this.renderZh(resume);
> }
> ```
> 渲染流程（标题 → 联系方式 → 简介 → 技能 → 经历 → 教育）是固定的，只是每个部分的文案不同。
>
> **3. 解析器模式（Parser Pattern）**
> ```typescript
> // ResumeParser 的链式处理
> 原始文件 → 文本提取 → 规则解析 → 置信度评估 → AI Prompt 生成
> ```
> 每一步都是独立的，可以单独测试和替换。
>
> **4. 适配器模式（Adapter Pattern）**
> ```
> 核心引擎（统一接口）
>   ├── Claude Code 适配器（skill.md）
>   ├── Cursor 适配器（.cursorrules）
>   ├── Windsurf 适配器（.windsurfrules）
>   └── ...
> ```
> 每个适配器把核心引擎的能力"翻译"成对应平台的格式。

---

### Q11: 为什么不直接让 AI 做所有事情，还要写这么多 TypeScript 代码？

**小白版：**

> AI 擅长写文字，但不擅长精确的数据处理。比如"从 package.json 里提取依赖名"这种事，用代码做又快又准，用 AI 做又慢又有幻觉。所以代码负责"提取数据"，AI 负责"写文字"，各司其职。

**进阶版：**

> 这是一个 **AI + 代码协同** 的架构设计问题。我的原则是：
>
> | 任务 | 适合谁 | 原因 |
> |------|--------|------|
> | 文件扫描、依赖解析 | 代码 | 精确、快速、无幻觉 |
> | Git 历史分析 | 代码 | 需要精确的数字 |
> | 技术栈识别 | 代码 | 基于确定性规则 |
> | 简历内容撰写 | AI | 需要语言组织能力 |
> | 措辞优化 | AI | 需要理解语义 |
> | 模板渲染 | 代码 | 确定性的字符串操作 |
>
> 如果全部交给 AI：
> 1. **成本高**：每次调用都要消耗 token
> 2. **不稳定**：AI 可能遗漏某些技术栈
> 3. **慢**：AI 推理需要时间
>
> 所以代码做"确定性的事"，AI 做"创造性的事"，这是最优解。

---

## 5. 工程实践类问题

### Q12: 项目是怎么做错误处理的？

**小白版：**

> 对于可能出错的地方（比如文件不存在、依赖库没安装），我都加了 try-catch，出错时会给出友好的提示信息，告诉用户怎么解决。

**进阶版：**

> 采用 **分层容错** 策略：
>
> **第一层：输入验证**
> ```typescript
> // 解析简历时检查文件格式
> const ext = path.extname(filePath).toLowerCase();
> if (!['.pdf', '.docx', '.doc', '.txt', '.md'].includes(ext)) {
>   throw new Error(`不支持的文件格式: ${ext}`);
> }
> ```
>
> **第二层：依赖降级**
> ```typescript
> // PDF 导出失败时降级为 HTML
> try {
>   const puppeteer = require('puppeteer');
>   // ... 生成 PDF
> } catch (err) {
>   // 降级为 HTML
>   fs.writeFileSync(htmlPath, html, 'utf-8');
>   console.log(`⚠️ PDF 生成需要 puppeteer，已导出 HTML 格式`);
> }
> ```
>
> **第三层：置信度评估**
> ```typescript
> // 解析简历时评估置信度
> if (parseResult.confidence < 0.5) {
>   console.log(`⚠️ 解析置信度较低，建议使用 AI 进一步解析`);
>   // 生成 AI Prompt 作为兜底
> }
> ```
>
> **第四层：用户提示**
> 所有错误信息都包含：
> - 错误原因
> - 解决方案（如"请安装 xxx 依赖"）
> - 降级方案（如"已导出为 HTML 格式"）

---

### Q13: 测试策略是什么？

**小白版：**

> 目前主要是手动测试。核心模块（分析器、解析器、合并器）都有明确的输入输出，可以用单元测试覆盖。

**进阶版：**

> 当前阶段以手动测试为主，但设计上已经为自动化测试做好了准备：
>
> **可测试性设计：**
> 1. **纯函数多**：`extractFromText`、`isSimilarProject` 等都是纯函数，输入确定输出确定
> 2. **依赖可注入**：`ProjectAnalyzer` 接受 `projectPath` 参数，测试时可以用 fixture 目录
> 3. **接口清晰**：每个模块都有明确的 TypeScript 接口
>
> **推荐的测试策略：**
> ```
> 单元测试（Jest）
>   ├── analyzer.test.ts    // 用 fixture 项目测试技术栈识别
>   ├── parser.test.ts      // 用示例简历测试解析
>   ├── merger.test.ts      // 测试合并逻辑和去重
>   └── template.test.ts    // 测试模板渲染
>
> 集成测试
>   ├── quickGenerate.test.ts  // 端到端生成流程
>   └── export.test.ts         // 导出格式验证
> ```

---

## 6. 性能与优化类问题

### Q14: 如果项目很大（比如 node_modules 有几万个文件），分析会不会很慢？

**小白版：**

> 会。但我已经做了优化——扫描时会跳过 `node_modules`、`.git`、`dist` 这些目录，只扫描有意义的文件。

**进阶版：**

> 当前的优化措施：
>
> **1. 目录黑名单过滤**
> ```typescript
> if (item.startsWith('.') || ['node_modules', 'dist', '__pycache__', '.git'].includes(item)) continue;
> ```
>
> **2. 深度限制**
> ```typescript
> // 最多扫描 3 层目录
> async listFiles(dir: string, maxDepth: number, currentDepth: number = 0)
> ```
>
> **3. 并行分析**
> ```typescript
> const [techStack, architecture, description, ...] = await Promise.all([
>   this.detectTechStack(),
>   this.detectArchitecture(),
>   this.readDescription(),
>   // ...
> ]);
> ```
>
> **如果还不够快，可以进一步优化：**
> 1. **缓存**：分析结果缓存到 `.cache` 目录，文件没变就跳过
> 2. **增量分析**：只分析 Git diff 涉及的文件
> 3. **流式处理**：边扫描边出结果，不等全部完成

---

### Q15: 内存占用会不会很大？

**小白版：**

> 正常情况下不会。分析一个普通项目（几百个文件），内存占用大概几十 MB。只有在分析超大项目或者同时处理多个简历时才需要注意。

**进阶版：**

> 主要的内存消耗点：
>
> 1. **文件列表**：`listFiles` 返回所有文件名的数组，1000 个文件 ≈ 100KB
> 2. **Git 日志**：`git log` 输出 20 条 ≈ 5KB
> 3. **简历数据**：JSON 格式 ≈ 5-10KB
>
> 最大的内存消耗是 **puppeteer**（PDF 导出时），它会启动一个 Chrome 进程，占用约 100-200MB。
>
> 优化建议：
> - 用完 puppeteer 后及时 `browser.close()`
> - 如果批量导出，考虑串行而不是并行
> - 可以用 puppeteer-pool 管理浏览器实例

---

## 7. 扩展性与可维护性

### Q16: 如果要支持"根据 JD（职位描述）定制简历"，怎么改？

**小白版：**

> 加一个新的输入：用户粘贴 JD 文本，AI 分析 JD 里要求的技能，然后在生成简历时重点突出这些技能。

**进阶版：**

> 需要改动三个地方：
>
> **1. 新增 JD 解析器**
> ```typescript
> class JDParser {
>   parse(jdText: string): JDRequirements {
>     return {
>       requiredSkills: string[],    // 必备技能
>       preferredSkills: string[],   // 加分技能
>       experienceLevel: string,     // 经验要求
>       responsibilities: string[],  // 岗位职责
>     };
>   }
> }
> ```
>
> **2. 修改简历生成器**
> ```typescript
> generateDraft(analysis, options) {
>   // 原有逻辑
>   const draft = ...;
>   // 新增：根据 JD 调整侧重点
>   if (options.jdRequirements) {
>     draft.skills = this.prioritizeSkills(draft.skills, options.jdRequirements);
>     draft.projects = this.highlightRelevantProjects(draft.projects, options.jdRequirements);
>   }
>   return draft;
> }
> ```
>
> **3. 更新 Prompt**
> ```
> 目标岗位 JD：{{JOB_DESCRIPTION}}
> 请重点突出以下技能：{{REQUIRED_SKILLS}}
> ```
>
> 核心引擎的架构不需要改，只需要扩展生成器的输入参数。

---

### Q17: 如果要支持多人协作（团队版简历库），架构需要怎么调整？

**小白版：**

> 需要加一个后端服务器，把简历数据存在数据库里，多人通过 API 访问。前端可以做一个 Web 页面。

**进阶版：**

> 当前架构是 **纯本地** 的，要支持多人协作需要：
>
> **1. 数据层改造**
> ```
> 本地 JSON 文件 → 数据库（PostgreSQL / MongoDB）
> ```
>
> **2. 新增 API 层**
> ```
> src/
>   api/
>     routes/
>       resume.ts    // CRUD API
>       analysis.ts  // 项目分析 API
>     middleware/
>       auth.ts      // 认证
>       rateLimit.ts // 限流
> ```
>
> **3. 核心引擎不变**
> `analyzer.ts`、`resume-generator.ts` 等核心模块不需要改，它们是纯逻辑层，不依赖存储方式。
>
> **4. 新增 Web UI**
> ```
> web/
>   src/
>     pages/
>       ResumeEditor.tsx   // 简历编辑器
>       ProjectSelect.tsx  // 项目选择
>     components/
>       TemplatePreview.tsx // 模板预览
> ```
>
> 这就是 **核心引擎 + 适配层** 架构的优势——核心引擎可以被 CLI、API、Web UI 等多种前端复用。

---

## 8. 深度追问（资深面试官风格）

### Q18: 如果我告诉你，市面上已经有很多简历生成工具了，你这个项目有什么不一样的？

**回答：**

> 市面上的简历工具大多有两个问题：
>
> 1. **手动填写**：用户需要自己输入项目经历、技能等信息，本质上是一个表单工具
> 2. **通用模板**：模板是面向所有人的，不是针对开发者的
>
> 我的项目的差异化在于：
>
> - **自动化**：从代码仓库自动提取信息，不需要手动填写
> - **开发者专属**：识别技术栈、分析 Git 贡献、理解架构模式
> - **AI 原生**：不是传统的表单 + 模板，而是 AI 理解项目后生成内容
> - **跨平台**：不是独立的 Web 应用，而是嵌入到开发者已有的工作流中（IDE 里直接用）

---

### Q19: 你觉得这个项目最大的技术风险是什么？

**回答：**

> **简历解析的准确性**。
>
> 简历格式千差万别——有的用表格、有的用分隔线、有的是两栏布局、有的是图片 PDF。规则引擎只能处理标准格式，非标准格式需要 AI，但 AI 也有幻觉风险。
>
> 我的应对策略是：
> 1. 置信度评估：让用户知道解析结果是否可靠
> 2. AI 兜底：低置信度时生成 AI Prompt 二次解析
> 3. 用户确认：解析结果展示给用户确认，而不是直接使用
>
> 这是一个 **人机协作** 的设计——机器做初步工作，人做最终决策。

---

### Q20: 如果让你重新设计这个项目，你会做什么不同的决定？

**回答：**

> 三件事：
>
> 1. **模板系统用 Handlebars**：当前的字符串插值太简单，无法处理条件渲染（比如"有 GitHub 才显示"）。Handlebars 的 `{{#if}}` 和 `{{#each}}` 能让模板更灵活。
>
> 2. **解析器用 LLM-first**：当前是规则引擎优先、AI 兜底。但随着 LLM 成本降低，可以直接用 LLM 做解析，准确率更高，代码更简单。
>
> 3. **加一个 Web UI**：CLI 工具对开发者友好，但非技术用户（比如求职顾问）需要可视化界面。一个简单的 Web 编辑器能扩大用户群。

---

### Q21: 这个项目你怎么衡量它的成功？有哪些指标？

**回答：**

> **技术指标：**
> - 技术栈识别准确率：目标 > 90%
> - 简历解析置信度：目标 > 0.7（标准格式）
> - 导出成功率：目标 > 99%
>
> **用户指标：**
> - 简历生成耗时：目标 < 30s（含 AI 生成）
> - 用户迭代次数：越少说明初稿质量越高
> - 模板使用分布：了解用户偏好
>
> **业务指标：**
> - 覆盖平台数：当前 5 个，目标 10 个
> - GitHub Stars / 下载量
> - 用户反馈评分

---

## 附录：常见追问清单

| 问题 | 考察点 |
|------|--------|
| "为什么不用 Python？" | 技术选型的思考 |
| "如果用户没有 Git 仓库怎么办？" | 边界情况处理 |
| "中英文简历有什么区别？" | 国际化理解 |
| "怎么处理简历中的隐私信息？" | 安全意识 |
| "这个项目你学到了什么？" | 反思能力 |
| "如果团队要接手这个项目，你怎么做交接？" | 工程素养 |
| "你在这个项目中最骄傲的代码是哪段？" | 代码品味 |

---

## 学习路径建议

如果你是小白，建议按以下顺序理解这个项目：

```
1. 先看 types/index.ts → 理解数据结构
2. 看 core/analyzer.ts → 理解项目分析逻辑
3. 看 core/resume-generator.ts → 理解简历生成逻辑
4. 看 core/template-engine.ts → 理解模板渲染
5. 看 core/exporter.ts → 理解导出逻辑
6. 看 core/resume-parser.ts → 理解简历解析
7. 看 core/resume-merger.ts → 理解合并逻辑
8. 看 adapters/ → 理解多平台适配
9. 看 index.ts → 理解整体串联
```

每看一个模块，试着回答：
- 这个模块做什么？
- 输入是什么？输出是什么？
- 用了什么技术/算法？
- 有什么边界情况需要处理？
