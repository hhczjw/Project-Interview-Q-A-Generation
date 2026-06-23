# 按照项目生成简历 — GitHub Copilot Instructions

当用户要求生成简历时，请按照以下流程操作：

## 触发词

- "生成简历" / "写简历" / "generate resume"
- "根据项目写简历"
- "/generate-resume" / "/resume"

## 流程

### 1. 分析当前项目

扫描项目文件，提取：
- 技术栈（从 package.json / pom.xml / go.mod 等）
- 架构模式（从目录结构）
- 项目描述（从 README.md）
- Git 贡献（从 git log）

### 2. 确认信息

询问用户：目标岗位、简历语言、个人信息

### 3. 生成内容

使用 STAR 法则，量化成果，使用强动词，每条 1-2 行。

### 4. 输出

Markdown 格式简历，包含：个人信息、简介、技能、工作经历、项目经历、教育背景。
