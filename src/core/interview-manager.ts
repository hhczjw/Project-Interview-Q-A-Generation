/**
 * 面试问答管理器 — 管理面试问答集合的 CRUD 操作
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  InterviewSet, InterviewSetMeta, InterviewQA,
  QuestionCategory, QuestionDifficulty,
} from '../types';

export class InterviewManager {
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.join(process.cwd(), 'data', 'interviews');
    this.ensureDir(this.dataDir);
  }

  /**
   * 列出所有面试问答集
   */
  list(): InterviewSetMeta[] {
    const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(this.dataDir, f), 'utf-8'));
      return {
        id: data.id,
        projectName: data.projectName,
        targetRole: data.targetRole,
        questionCount: data.questions?.length || 0,
        createdAt: data.createdAt,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * 获取指定面试问答集
   */
  get(id: string): InterviewSet | null {
    const filePath = path.join(this.dataDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  /**
   * 保存面试问答集
   */
  save(interview: InterviewSet): InterviewSet {
    const filePath = path.join(this.dataDir, `${interview.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(interview, null, 2), 'utf-8');
    return interview;
  }

  /**
   * 创建面试问答集
   */
  create(data: Partial<InterviewSet>): InterviewSet {
    const now = new Date().toISOString();
    const interview: InterviewSet = {
      id: data.id || this.generateId(),
      projectName: data.projectName || '未命名项目',
      targetRole: data.targetRole,
      lang: data.lang || 'zh',
      questions: data.questions || [],
      projectSummary: data.projectSummary || '',
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
    return this.save(interview);
  }

  /**
   * 删除面试问答集
   */
  delete(id: string): boolean {
    const filePath = path.join(this.dataDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return false;
    fs.unlinkSync(filePath);
    return true;
  }

  /**
   * 按类别筛选问题
   */
  filterByCategory(id: string, category: QuestionCategory): InterviewQA[] {
    const interview = this.get(id);
    if (!interview) return [];
    return interview.questions.filter(q => q.category === category);
  }

  /**
   * 按难度筛选问题
   */
  filterByDifficulty(id: string, difficulty: QuestionDifficulty): InterviewQA[] {
    const interview = this.get(id);
    if (!interview) return [];
    return interview.questions.filter(q => q.difficulty === difficulty);
  }

  /**
   * 搜索问题
   */
  search(id: string, keyword: string): InterviewQA[] {
    const interview = this.get(id);
    if (!interview) return [];
    const kw = keyword.toLowerCase();
    return interview.questions.filter(q =>
      q.question.toLowerCase().includes(kw) ||
      q.answer.toLowerCase().includes(kw)
    );
  }

  /**
   * 添加单个问题
   */
  addQuestion(id: string, qa: InterviewQA): InterviewSet | null {
    const interview = this.get(id);
    if (!interview) return null;
    interview.questions.push(qa);
    interview.updatedAt = new Date().toISOString();
    return this.save(interview);
  }

  /**
   * 删除单个问题
   */
  removeQuestion(id: string, qaId: string): InterviewSet | null {
    const interview = this.get(id);
    if (!interview) return null;
    interview.questions = interview.questions.filter(q => q.id !== qaId);
    interview.updatedAt = new Date().toISOString();
    return this.save(interview);
  }

  /**
   * 导出为 Markdown
   */
  toMarkdown(id: string): string {
    const interview = this.get(id);
    if (!interview) return '';

    const lines: string[] = [];
    lines.push(`# ${interview.projectName} — 面试问答`);
    lines.push('');

    if (interview.targetRole) {
      lines.push(`**目标岗位**: ${interview.targetRole}`);
      lines.push('');
    }

    // 按类别分组
    const categories = [...new Set(interview.questions.map(q => q.category))];

    for (const cat of categories) {
      const catQuestions = interview.questions.filter(q => q.category === cat);
      lines.push(`## ${this.categoryLabel(cat)}`);
      lines.push('');

      for (let i = 0; i < catQuestions.length; i++) {
        const qa = catQuestions[i];
        const diffLabel = this.difficultyLabel(qa.difficulty);

        lines.push(`### Q${i + 1}: ${qa.question}`);
        lines.push(`**难度**: ${diffLabel}`);
        lines.push('');

        if (qa.answer) {
          lines.push('**参考回答**:');
          lines.push('');
          lines.push(qa.answer);
          lines.push('');
        }

        if (qa.keyPoints && qa.keyPoints.length > 0) {
          lines.push('**回答要点**:');
          for (const point of qa.keyPoints) {
            lines.push(`- ${point}`);
          }
          lines.push('');
        }

        if (qa.followUps && qa.followUps.length > 0) {
          lines.push('**追问**:');
          for (const fu of qa.followUps) {
            lines.push(`- **Q**: ${fu.question}`);
            lines.push(`  **A**: ${fu.answer}`);
          }
          lines.push('');
        }

        lines.push('---');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ==================== 工具方法 ====================

  private categoryLabel(cat: QuestionCategory): string {
    const labels: Record<QuestionCategory, string> = {
      'tech-stack': '🔧 技术栈原理（结合项目）',
      'tech-fundamentals': '📖 技术八股文（基础原理）',
      'architecture': '🏗️ 架构设计',
      'project-detail': '📋 项目细节',
      'problem-solving': '🧩 问题解决',
      'performance': '⚡ 性能优化',
      'best-practices': '✅ 最佳实践',
      'system-design': '🏛️ 系统设计',
      'coding': '💻 编码能力',
      'soft-skills': '🤝 软技能',
    };
    return labels[cat] || cat;
  }

  private difficultyLabel(diff: QuestionDifficulty): string {
    const labels: Record<QuestionDifficulty, string> = {
      'basic': '⭐ 基础',
      'intermediate': '⭐⭐ 中级',
      'advanced': '⭐⭐⭐ 高级',
      'expert': '⭐⭐⭐⭐ 专家',
    };
    return labels[diff] || diff;
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
