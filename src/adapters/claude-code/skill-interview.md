# 根据项目生成面试问答 Skill

> 根据当前项目自动生成资深面试官问答，帮助你准备技术面试

## 使用方式

在 Claude Code 中执行以下命令：

```
/generate-interview              # 根据当前项目生成面试问答
/generate-interview --role 前端工程师  # 针对特定岗位生成
/generate-interview --focus tech-stack # 重点关注技术栈原理
/generate-interview --difficulty advanced  # 只生成高级问题
/deep-dive React                 # 针对 React 生成追问链
/manage-interview                # 管理已有面试问答
/export-interview                # 导出为 Markdown
```

## Skill 行为规范

当用户调用此 Skill 时，你必须：

### 第一步：项目分析

1. 扫描当前项目根目录，识别：
   - **技术栈**：检查 package.json / pom.xml / go.mod 等依赖文件
   - **架构模式**：分析目录结构
   - **项目描述**：读取 README.md
   - **功能特性**：从代码和文档提取
   - **Git 贡献**：执行 git log 分析
2. 将分析结果整理为结构化数据

### 第二步：信息收集

向用户确认：
- **目标岗位**：如 "高级前端工程师"、"Java 架构师"
- **语言**：中文 / 英文
- **问题类别偏好**：
  - 技术栈原理（tech-stack）
  - 架构设计（architecture）
  - 项目细节（project-detail）
  - 问题解决（problem-solving）
  - 性能优化（performance）
  - 最佳实践（best-practices）
- **难度范围**：基础 / 中级 / 高级 / 专家

### 第三步：生成面试问答

针对每个技术点，生成由浅入深的问题链：

**问题设计原则**：
1. **不要问基础概念**：不问 "什么是 React"，要问 "React Fiber 架构的工作原理"
2. **结合项目实际**：每个问题都要能从项目中找到具体案例
3. **追问链设计**：每个主问题带 1-2 个追问，由浅入深
4. **考察深度**：从「会用」→「理解原理」→「踩过坑」→「能优化」

**问题示例**：

```
Q: 你们项目用了 Redis，能说说 Redis 的持久化机制吗？
追问1: RDB 和 AOF 的区别是什么？你们用的哪种？
追问2: 如果 Redis 宕机了，最多会丢多少数据？
追问3: 你们有没有遇到过 Redis 内存不足的问题？怎么处理的？
```

### 第四步：展示与迭代

1. 将生成的面试问答以 Markdown 格式展示给用户
2. 询问用户是否需要：
   - 增加某个技术的深度追问
   - 调整问题难度
   - 补充某个类别的问题
   - 模拟面试对话

### 第五步：保存与导出

- 保存为 JSON 格式到 `data/interviews/` 目录
- 支持导出为 Markdown
- 支持按类别/难度筛选

## 面试问答数据结构

```typescript
interface InterviewQA {
  question: string;           // 问题
  answer: string;             // 参考回答
  difficulty: 'basic' | 'intermediate' | 'advanced' | 'expert';
  category: 'tech-stack' | 'architecture' | 'project-detail' | ...;
  keyPoints: string[];        // 回答要点
  followUps: Array<{          // 追问
    question: string;
    answer: string;
  }>;
  relatedCode?: string;       // 关联的代码模块
}
```

## 文件位置

- 核心引擎：`src/core/interview-generator.ts`
- 问答管理：`src/core/interview-manager.ts`
- Prompt 模板：`src/prompts/generate-interview.md`
- 用户数据：`data/interviews/` 目录
