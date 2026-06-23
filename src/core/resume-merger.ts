/**
 * 简历合并器 — 将已有简历与新项目分析结果合并
 *
 * 核心能力：
 * - 智能去重：避免重复的技能、项目、工作经历
 * - 增量更新：保留已有内容，只添加新项目
 * - 冲突处理：当新旧数据冲突时，提供策略选择
 */

import {
  Resume, ProjectEntry, WorkEntry, SkillSection,
  ProjectAnalysis, MergeOptions, PersonalInfo,
} from '../types';
import { v4 } from './utils';

export class ResumeMerger {
  /**
   * 将已有简历与新的项目分析结果合并
   */
  mergeWithAnalysis(
    existing: Resume,
    analysis: ProjectAnalysis,
    options: MergeOptions = {}
  ): Resume {
    const {
      overwriteProjects = false,
      mergeSkills = true,
      projectOrder = 'prepend',
    } = options;

    // 生成新项目条目
    const newProject = this.analysisToProject(analysis);

    // 合并项目经历
    let projects = [...existing.projects];
    if (overwriteProjects) {
      // 替换同名项目
      const idx = projects.findIndex(p => p.name === newProject.name);
      if (idx >= 0) {
        projects[idx] = newProject;
      } else {
        projects = projectOrder === 'prepend' ? [newProject, ...projects] : [...projects, newProject];
      }
    } else {
      // 检查是否已存在同名项目
      const exists = projects.some(p => this.isSimilarProject(p, newProject));
      if (!exists) {
        projects = projectOrder === 'prepend' ? [newProject, ...projects] : [...projects, newProject];
      } else {
        // 合并同名项目的增量信息
        projects = projects.map(p =>
          this.isSimilarProject(p, newProject) ? this.mergeProjectEntries(p, newProject) : p
        );
      }
    }

    // 合并技能清单
    let skills = [...existing.skills];
    if (mergeSkills) {
      skills = this.mergeSkills(skills, this.analysisToSkills(analysis));
    }

    // 更新工作经历中的项目
    const workExperience = this.updateWorkExperience(
      existing.workExperience,
      newProject,
      projectOrder
    );

    return {
      ...existing,
      projects,
      skills,
      workExperience,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 将两份简历合并
   */
  mergeResumes(primary: Resume, secondary: Resume, options: MergeOptions = {}): Resume {
    const { mergeSkills = true, projectOrder = 'prepend' } = options;

    // 合并个人信息（以 primary 为主）
    const personalInfo: PersonalInfo = {
      ...secondary.personalInfo,
      ...primary.personalInfo,
      // 合并联系方式（如果 primary 没有，用 secondary 的）
      email: primary.personalInfo.email || secondary.personalInfo.email,
      phone: primary.personalInfo.phone || secondary.personalInfo.phone,
      github: primary.personalInfo.github || secondary.personalInfo.github,
      linkedin: primary.personalInfo.linkedin || secondary.personalInfo.linkedin,
      website: primary.personalInfo.website || secondary.personalInfo.website,
    };

    // 合并项目经历（去重）
    let projects = [...primary.projects];
    for (const proj of secondary.projects) {
      if (!projects.some(p => this.isSimilarProject(p, proj))) {
        projects = projectOrder === 'prepend' ? [proj, ...projects] : [...projects, proj];
      }
    }

    // 合并工作经历
    let workExperience = [...primary.workExperience];
    for (const work of secondary.workExperience) {
      const existingIdx = workExperience.findIndex(w =>
        w.company === work.company && w.period === work.period
      );
      if (existingIdx >= 0) {
        // 合并同公司的工作经历
        workExperience[existingIdx] = this.mergeWorkEntries(
          workExperience[existingIdx],
          work
        );
      } else {
        workExperience.push(work);
      }
    }

    // 合并技能
    let skills = [...primary.skills];
    if (mergeSkills) {
      skills = this.mergeSkills(skills, secondary.skills);
    }

    // 合并教育经历
    const education = [...primary.education];
    for (const edu of secondary.education) {
      if (!education.some(e => e.school === edu.school && e.major === edu.major)) {
        education.push(edu);
      }
    }

    return {
      ...primary,
      personalInfo,
      projects,
      workExperience,
      skills,
      education,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 生成合并预览（展示将要发生的变化）
   */
  previewMerge(
    existing: Resume,
    analysis: ProjectAnalysis
  ): {
    newProjects: ProjectEntry[];
    updatedProjects: ProjectEntry[];
    newSkills: string[];
    unchanged: string[];
  } {
    const newProject = this.analysisToProject(analysis);
    const newSkills = this.analysisToSkills(analysis);

    const existingProjectNames = existing.projects.map(p => p.name.toLowerCase());
    const existingSkillNames = existing.skills.flatMap(s => s.skills.map(sk => sk.toLowerCase()));

    const isNew = !existingProjectNames.includes(newProject.name.toLowerCase()) &&
      !existing.projects.some(p => this.isSimilarProject(p, newProject));

    const newSkillItems = newSkills
      .flatMap(s => s.skills)
      .filter(s => !existingSkillNames.includes(s.toLowerCase()));

    return {
      newProjects: isNew ? [newProject] : [],
      updatedProjects: isNew ? [] : [newProject],
      newSkills: newSkillItems,
      unchanged: existing.projects
        .filter(p => !this.isSimilarProject(p, newProject))
        .map(p => p.name),
    };
  }

  // ==================== 内部方法 ====================

  /**
   * 将项目分析结果转为项目条目
   */
  private analysisToProject(analysis: ProjectAnalysis): ProjectEntry {
    const allTechs = [
      ...analysis.techStack.languages,
      ...analysis.techStack.frameworks,
      ...analysis.techStack.databases,
      ...analysis.techStack.middleware,
    ];

    return {
      name: analysis.name,
      role: '开发工程师', // 默认角色，后续可由用户修改
      period: analysis.gitContribution
        ? `${analysis.gitContribution.firstCommitDate?.split(' ')[0] || ''} - ${analysis.gitContribution.lastCommitDate?.split(' ')[0] || '至今'}`
        : '',
      description: analysis.description,
      techStack: allTechs.slice(0, 10),
      responsibilities: analysis.features.slice(0, 5),
      achievements: analysis.highlights,
    };
  }

  /**
   * 将项目分析结果转为技能清单
   */
  private analysisToSkills(analysis: ProjectAnalysis): SkillSection[] {
    const sections: SkillSection[] = [];
    const ts = analysis.techStack;

    if (ts.languages.length) sections.push({ category: '编程语言', skills: ts.languages, proficiency: 'proficient' });
    if (ts.frameworks.length) sections.push({ category: '框架', skills: ts.frameworks, proficiency: 'proficient' });
    if (ts.databases.length) sections.push({ category: '数据库', skills: ts.databases, proficiency: 'familiar' });
    if (ts.middleware.length) sections.push({ category: '中间件', skills: ts.middleware, proficiency: 'familiar' });
    if (ts.devOps.length) sections.push({ category: 'DevOps', skills: ts.devOps, proficiency: 'familiar' });

    return sections;
  }

  /**
   * 合并技能清单
   */
  private mergeSkills(existing: SkillSection[], newSkills: SkillSection[]): SkillSection[] {
    const merged = [...existing];

    for (const newSection of newSkills) {
      const existingIdx = merged.findIndex(s => s.category === newSection.category);
      if (existingIdx >= 0) {
        // 合并同类技能
        const existingSkills = merged[existingIdx].skills.map(s => s.toLowerCase());
        const uniqueNewSkills = newSection.skills.filter(
          s => !existingSkills.includes(s.toLowerCase())
        );
        merged[existingIdx] = {
          ...merged[existingIdx],
          skills: [...merged[existingIdx].skills, ...uniqueNewSkills],
        };
      } else {
        merged.push(newSection);
      }
    }

    return merged;
  }

  /**
   * 判断两个项目是否相似（同名或高度重叠）
   */
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

  /**
   * 合并两个项目条目
   */
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

  /**
   * 合并两个工作经历条目
   */
  private mergeWorkEntries(existing: WorkEntry, incoming: WorkEntry): WorkEntry {
    const mergedProjects = [...existing.projects];
    for (const proj of incoming.projects) {
      if (!mergedProjects.some(p => this.isSimilarProject(p, proj))) {
        mergedProjects.push(proj);
      }
    }

    return {
      ...existing,
      projects: mergedProjects,
    };
  }

  /**
   * 更新工作经历中的项目
   */
  private updateWorkExperience(
    workExperience: WorkEntry[],
    newProject: ProjectEntry,
    order: 'prepend' | 'append'
  ): WorkEntry[] {
    if (workExperience.length === 0) return workExperience;

    // 将新项目添加到最近的工作经历中
    const updated = [...workExperience];
    const latestWork = { ...updated[0] };

    const exists = latestWork.projects.some(p => this.isSimilarProject(p, newProject));
    if (!exists) {
      latestWork.projects = order === 'prepend'
        ? [newProject, ...latestWork.projects]
        : [...latestWork.projects, newProject];
      updated[0] = latestWork;
    }

    return updated;
  }

  /**
   * 判断两段文本是否相似
   */
  private isSimilarText(a: string, b: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^\w一-龥]/g, '');
    return normalize(a) === normalize(b);
  }
}
