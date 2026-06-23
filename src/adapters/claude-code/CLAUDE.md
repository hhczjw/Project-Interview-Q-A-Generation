# 按照项目生成简历 — Claude Code 项目配置

本项目是一个跨平台 AI Coding Skill，用于根据项目经历自动生成专业简历。

## 项目结构

```
src/
├── core/              # 核心引擎（平台无关）
│   ├── analyzer.ts    # 项目分析器 — 扫描技术栈、架构、Git 贡献
│   ├── resume-generator.ts  # 简历生成器 — 基于分析结果生成简历
│   ├── resume-manager.ts    # 简历管理器 — CRUD 操作
│   ├── template-engine.ts   # 模板引擎 — 渲染 Markdown
│   └── exporter.ts   # 导出器 — MD/PDF/Word
├── types/             # TypeScript 类型定义
├── templates/         # 简历模板
├── prompts/           # AI Prompt 模板
├── i18n/              # 国际化
└── adapters/          # 多平台适配层
```

## 开发命令

```bash
npm install          # 安装依赖
npm run build        # 编译 TypeScript
npm run start        # 运行
npm run export:pdf   # 导出 PDF
npm run export:word  # 导出 Word
```

## 核心概念

- **项目分析**：自动识别技术栈、架构模式、Git 贡献
- **简历生成**：使用 STAR 法则，量化成果，突出技术深度
- **多语言**：支持中文、英文、双语简历
- **多格式**：Markdown / PDF / Word
- **多平台**：Claude Code / Cursor / Windsurf / Copilot / Trae
