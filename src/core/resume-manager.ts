/**
 * 简历管理器 — 管理多份简历的 CRUD 操作
 */

import * as fs from 'fs';
import * as path from 'path';
import { Resume, ResumeMeta, ResumeLang, TemplateStyle, PersonalInfo } from '../types';
import { v4 } from './utils';

export class ResumeManager {
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.join(process.cwd(), 'data', 'resumes');
    this.ensureDir(this.dataDir);
  }

  /**
   * 列出所有简历
   */
  list(): ResumeMeta[] {
    const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(this.dataDir, f), 'utf-8'));
      return {
        id: data.id,
        name: data.personalInfo?.name || '未命名',
        lang: data.lang,
        targetRole: data.targetRole,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * 获取指定简历
   */
  get(id: string): Resume | null {
    const filePath = path.join(this.dataDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  /**
   * 创建新简历
   */
  create(data: Partial<Resume>): Resume {
    const now = new Date().toISOString();
    const resume: Resume = {
      id: v4(),
      lang: data.lang || 'zh',
      template: data.template || 'default',
      targetRole: data.targetRole,
      personalInfo: data.personalInfo || this.emptyPersonalInfo(),
      workExperience: data.workExperience || [],
      projects: data.projects || [],
      education: data.education || [],
      skills: data.skills || [],
      createdAt: now,
      updatedAt: now,
    };

    this.save(resume);
    return resume;
  }

  /**
   * 更新简历
   */
  update(id: string, data: Partial<Resume>): Resume | null {
    const existing = this.get(id);
    if (!existing) return null;

    const updated: Resume = {
      ...existing,
      ...data,
      id: existing.id,         // 防止覆盖 ID
      createdAt: existing.createdAt, // 保留创建时间
      updatedAt: new Date().toISOString(),
    };

    this.save(updated);
    return updated;
  }

  /**
   * 删除简历
   */
  delete(id: string): boolean {
    const filePath = path.join(this.dataDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return false;
    fs.unlinkSync(filePath);
    return true;
  }

  /**
   * 复制简历
   */
  clone(id: string, newName?: string): Resume | null {
    const original = this.get(id);
    if (!original) return null;

    const now = new Date().toISOString();
    const cloned: Resume = {
      ...original,
      id: v4(),
      personalInfo: {
        ...original.personalInfo,
        name: newName || `${original.personalInfo.name} (副本)`,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.save(cloned);
    return cloned;
  }

  /**
   * 搜索简历
   */
  search(keyword: string): ResumeMeta[] {
    const all = this.list();
    const kw = keyword.toLowerCase();
    return all.filter(r =>
      r.name.toLowerCase().includes(kw) ||
      (r.targetRole && r.targetRole.toLowerCase().includes(kw))
    );
  }

  // ==================== 内部方法 ====================

  private save(resume: Resume): void {
    const filePath = path.join(this.dataDir, `${resume.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(resume, null, 2), 'utf-8');
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private emptyPersonalInfo(): PersonalInfo {
    return {
      name: '',
      title: '',
      summary: '',
    };
  }
}
