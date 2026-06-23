/**
 * 简历解析器 — 从 PDF/Word/文本文件中解析简历内容
 *
 * 工作流程：
 * 1. 从文件中提取原始文本
 * 2. 使用规则引擎初步结构化
 * 3. 生成 AI Prompt 供进一步精确解析
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Resume, ParseResult, PersonalInfo, SkillSection,
  ProjectEntry, WorkEntry, EducationEntry,
} from '../types';
import { v4 } from './utils';

export class ResumeParser {
  /**
   * 解析简历文件
   */
  async parse(filePath: string): Promise<ParseResult> {
    const ext = path.extname(filePath).toLowerCase();
    let rawText = '';
    let source: ParseResult['source'] = 'text';

    switch (ext) {
      case '.pdf':
        rawText = await this.parsePDF(filePath);
        source = 'pdf';
        break;
      case '.docx':
      case '.doc':
        rawText = await this.parseWord(filePath);
        source = 'word';
        break;
      case '.txt':
      case '.md':
        rawText = fs.readFileSync(filePath, 'utf-8');
        source = 'text';
        break;
      default:
        throw new Error(`不支持的文件格式: ${ext}。支持 PDF (.pdf)、Word (.docx/.doc)、文本 (.txt/.md)`);
    }

    // 规则引擎初步解析
    const { resume, confidence, missingFields } = this.extractFromText(rawText);

    return {
      resume,
      confidence,
      rawText,
      missingFields,
      source,
    };
  }

  /**
   * 生成用于 AI 精确解析的 Prompt
   */
  generateAIParsePrompt(parseResult: ParseResult): string {
    return `你是一个简历解析专家。请从以下文本中提取结构化的简历信息。

## 原始简历文本

${parseResult.rawText}

## 已初步提取的信息

\`\`\`json
${JSON.stringify(parseResult.resume, null, 2)}
\`\`\`

## 缺失字段

${parseResult.missingFields.map(f => `- ${f}`).join('\n')}

## 要求

请提取以下信息并以 JSON 格式返回：

\`\`\`json
{
  "personalInfo": {
    "name": "姓名",
    "title": "职位头衔",
    "email": "邮箱",
    "phone": "电话",
    "location": "所在地",
    "github": "GitHub 地址",
    "summary": "个人简介（2-3句话）"
  },
  "skills": [
    {
      "category": "技能类别（如：编程语言、框架、数据库）",
      "skills": ["技能1", "技能2"]
    }
  ],
  "workExperience": [
    {
      "company": "公司名",
      "title": "职位",
      "period": "时间段",
      "description": "工作描述",
      "projects": [
        {
          "name": "项目名",
          "role": "角色",
          "period": "时间段",
          "description": "项目描述",
          "techStack": ["技术1", "技术2"],
          "responsibilities": ["职责1", "职责2"],
          "achievements": ["成果1", "成果2"]
        }
      ]
    }
  ],
  "education": [
    {
      "school": "学校名",
      "degree": "学位",
      "major": "专业",
      "period": "时间段",
      "gpa": "GPA（如有）"
    }
  ]
}
\`\`\`

## 注意

1. 如果文本中没有某个字段的信息，不要编造，直接省略该字段
2. 尽量保持原始简历的措辞，不要过度改写
3. 时间段格式统一为 "YYYY.MM - YYYY.MM" 或 "YYYY.MM - 至今"
4. 技能清单按类别分组
5. 项目经历中的成果尽量保留量化数据

请直接返回 JSON，不要包含任何解释。`;
  }

  // ==================== 文件解析 ====================

  /**
   * 解析 PDF 文件
   */
  private async parsePDF(filePath: string): Promise<string> {
    try {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    } catch (err) {
      throw new Error(
        `PDF 解析失败。请安装 pdf-parse 依赖：npm install pdf-parse\n` +
        `或者将 PDF 转换为文本/Word 格式后重试。\n` +
        `原始错误: ${err}`
      );
    }
  }

  /**
   * 解析 Word 文件
   */
  private async parseWord(filePath: string): Promise<string> {
    try {
      const mammoth = require('mammoth');
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (err) {
      throw new Error(
        `Word 解析失败。请安装 mammoth 依赖：npm install mammoth\n` +
        `或者将 Word 转换为文本格式后重试。\n` +
        `原始错误: ${err}`
      );
    }
  }

  // ==================== 规则引擎 ====================

  /**
   * 从文本中提取简历信息（规则引擎）
   */
  private extractFromText(text: string): {
    resume: Partial<Resume>;
    confidence: number;
    missingFields: string[];
  } {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const resume: Partial<Resume> = {
      id: v4(),
      personalInfo: { name: '', title: '', summary: '' },
      skills: [],
      workExperience: [],
      projects: [],
      education: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const missingFields: string[] = [];
    let confidence = 0;

    // 提取个人信息
    const personalResult = this.extractPersonalInfo(lines, text);
    resume.personalInfo = personalResult.info;
    confidence += personalResult.confidence;
    if (!personalResult.info.name) missingFields.push('personalInfo.name');
    if (!personalResult.info.email) missingFields.push('personalInfo.email');

    // 提取技能
    const skillsResult = this.extractSkills(lines, text);
    resume.skills = skillsResult.skills;
    confidence += skillsResult.confidence;
    if (skillsResult.skills.length === 0) missingFields.push('skills');

    // 提取教育经历
    const eduResult = this.extractEducation(lines, text);
    resume.education = eduResult.education;
    confidence += eduResult.confidence;
    if (eduResult.education.length === 0) missingFields.push('education');

    // 提取工作经历和项目
    const workResult = this.extractWorkAndProjects(lines, text);
    resume.workExperience = workResult.workExperience;
    resume.projects = workResult.projects;
    confidence += workResult.confidence;
    if (workResult.workExperience.length === 0) missingFields.push('workExperience');

    // 归一化置信度（0-1）
    confidence = Math.min(confidence / 4, 1);

    return { resume, confidence, missingFields };
  }

  /**
   * 提取个人信息
   */
  private extractPersonalInfo(lines: string[], fullText: string): {
    info: PersonalInfo;
    confidence: number;
  } {
    const info: PersonalInfo = { name: '', title: '', summary: '' };
    let confidence = 0;

    // 邮箱
    const emailMatch = fullText.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      info.email = emailMatch[0];
      confidence += 0.2;
    }

    // 电话（中国手机号）
    const phoneMatch = fullText.match(/(?:\+86[\s-]?)?1[3-9]\d{9}/);
    if (phoneMatch) {
      info.phone = phoneMatch[0];
      confidence += 0.1;
    }

    // GitHub
    const githubMatch = fullText.match(/github\.com\/[\w-]+/i);
    if (githubMatch) {
      info.github = `https://${githubMatch[0]}`;
      confidence += 0.1;
    }

    // LinkedIn
    const linkedinMatch = fullText.match(/linkedin\.com\/in\/[\w-]+/i);
    if (linkedinMatch) {
      info.linkedin = `https://${linkedinMatch[0]}`;
      confidence += 0.05;
    }

    // 网站
    const websiteMatch = fullText.match(/https?:\/\/(?!github\.com|linkedin\.com)[\w.-]+\.\w+/);
    if (websiteMatch) {
      info.website = websiteMatch[0];
      confidence += 0.05;
    }

    // 姓名（通常是第一行或最突出的文本）
    // 尝试从标题行提取（通常是最大的字体或第一行）
    const firstNonEmptyLine = lines.find(l => l.length > 0 && l.length < 20);
    if (firstNonEmptyLine && !firstNonEmptyLine.includes('@') && !firstNonEmptyLine.match(/\d{3}/)) {
      info.name = firstNonEmptyLine;
      confidence += 0.2;
    }

    // 职位头衔（常见职位关键词）
    const titleKeywords = [
      '工程师', '开发', '架构师', '设计师', '经理', '总监', 'CTO', 'CEO',
      'Engineer', 'Developer', 'Architect', 'Designer', 'Manager', 'Director',
      '前端', '后端', '全栈', '前端', '运维', '测试', '产品',
      'Frontend', 'Backend', 'Full Stack', 'DevOps', 'QA', 'Product',
      'Senior', 'Junior', 'Lead', 'Principal', 'Staff',
    ];

    for (const line of lines.slice(0, 5)) {
      if (titleKeywords.some(kw => line.includes(kw))) {
        info.title = line;
        confidence += 0.15;
        break;
      }
    }

    // 个人简介（通常在 "个人简介" / "Summary" 之后的段落）
    const summaryPatterns = [
      /(?:个人简介|自我评价|个人总结|Summary|About)\s*[:：]?\s*(.+)/i,
    ];
    for (const pattern of summaryPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        // 提取摘要后面的内容（直到下一个标题）
        const summaryStart = fullText.indexOf(match[0]);
        const afterSummary = fullText.substring(summaryStart + match[0].length);
        const nextSection = afterSummary.search(/(?:\n\s*(?:##|技能|工作|项目|教育|Skills|Work|Projects|Education))/);
        info.summary = (nextSection > 0 ? afterSummary.substring(0, nextSection) : afterSummary)
          .trim()
          .substring(0, 500);
        confidence += 0.15;
      }
    }

    return { info, confidence };
  }

  /**
   * 提取技能清单
   */
  private extractSkills(lines: string[], fullText: string): {
    skills: SkillSection[];
    confidence: number;
  } {
    const skills: SkillSection[] = [];
    let confidence = 0;

    // 查找技能部分
    const skillSectionPatterns = [
      /(?:技能|技术栈|专业技能|技术能力|Skills|Technical Skills|Tech Stack)/i,
    ];

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
          // 普通技能行
          const skillItems = line.split(/[,，、|]/).map(s => s.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean);
          currentSkills.push(...skillItems);
        }
      }
    }

    if (currentSkills.length > 0) {
      skills.push({ category: currentCategory, skills: currentSkills });
    }

    if (skills.length > 0) {
      confidence += 0.3;
    }

    return { skills, confidence };
  }

  /**
   * 提取教育经历
   */
  private extractEducation(lines: string[], fullText: string): {
    education: EducationEntry[];
    confidence: number;
  } {
    const education: EducationEntry[] = [];
    let confidence = 0;

    // 查找教育部分
    const eduSectionStart = lines.findIndex(l =>
      /^(?:教育|学历|Education|Academic)/i.test(l)
    );

    if (eduSectionStart === -1) return { education, confidence };

    // 提取教育部分的内容
    const eduLines = lines.slice(eduSectionStart + 1);
    let currentEdu: Partial<EducationEntry> | null = null;

    for (const line of eduLines) {
      // 遇到其他部分则停止
      if (/^(?:工作|项目|技能|经历|Work|Projects|Skills|Experience)/.test(line)) {
        break;
      }

      // 检测学校名（通常包含 "大学"、"学院"、"University" 等）
      const schoolMatch = line.match(/(.+?(?:大学|学院|学校|University|College|Institute).+?)(?:\s|$)/);
      if (schoolMatch) {
        if (currentEdu && currentEdu.school) {
          education.push(currentEdu as EducationEntry);
        }
        currentEdu = { school: schoolMatch[1].trim(), degree: '', major: '', period: '' };
        confidence += 0.2;
        continue;
      }

      // 检测学位和专业
      const degreeMatch = line.match(/(本科|硕士|博士|学士|研究生|Bachelor|Master|PhD|Doctor).*?(?:专业|Major)?[：:]?\s*(.+)/i);
      if (degreeMatch && currentEdu) {
        currentEdu.degree = degreeMatch[1].trim();
        currentEdu.major = degreeMatch[2]?.trim() || '';
        confidence += 0.1;
        continue;
      }

      // 检测时间段
      const periodMatch = line.match(/(\d{4}[\s.-]+\d{4}|\d{4}[\s.-]+至今|\d{4}[\s.-]+Present)/i);
      if (periodMatch && currentEdu) {
        currentEdu.period = periodMatch[1].trim();
        confidence += 0.05;
      }
    }

    if (currentEdu && currentEdu.school) {
      education.push(currentEdu as EducationEntry);
    }

    return { education, confidence };
  }

  /**
   * 提取工作经历和项目
   */
  private extractWorkAndProjects(lines: string[], fullText: string): {
    workExperience: WorkEntry[];
    projects: ProjectEntry[];
    confidence: number;
  } {
    const workExperience: WorkEntry[] = [];
    const projects: ProjectEntry[] = [];
    let confidence = 0;

    // 查找工作经历部分
    const workSectionStart = lines.findIndex(l =>
      /^(?:工作|经历|工作经验|Work|Experience|Employment)/i.test(l)
    );

    // 查找独立的项目部分
    const projectSectionStart = lines.findIndex(l =>
      /^(?:项目|项目经历|个人项目|Projects|Side Projects)/i.test(l)
    );

    // 提取工作经历
    if (workSectionStart !== -1) {
      const endIdx = projectSectionStart > workSectionStart ? projectSectionStart : lines.length;
      const workLines = lines.slice(workSectionStart + 1, endIdx);

      let currentWork: Partial<WorkEntry> | null = null;

      for (const line of workLines) {
        // 检测公司名和职位（格式：公司 | 职位 或 公司 - 职位）
        const companyMatch = line.match(/(.+?)\s*[|｜\-]\s*(.+)/);
        if (companyMatch) {
          if (currentWork && currentWork.company) {
            workExperience.push(currentWork as WorkEntry);
          }
          currentWork = {
            company: companyMatch[1].trim(),
            title: companyMatch[2].trim(),
            period: '',
            projects: [],
          };
          confidence += 0.15;
          continue;
        }

        // 检测时间段
        const periodMatch = line.match(/(\d{4}[\s.-]+\d{4}|\d{4}[\s.-]+至今|\d{4}[\s.-]+Present)/i);
        if (periodMatch && currentWork) {
          currentWork.period = periodMatch[1].trim();
          continue;
        }

        // 检测项目名
        const projectMatch = line.match(/^[•\-*]\s*(.+?)(?:\s*[-—]\s*(.+))?$/);
        if (projectMatch && currentWork) {
          const project: ProjectEntry = {
            name: projectMatch[1].trim(),
            role: projectMatch[2]?.trim() || currentWork.title || '',
            period: '',
            description: '',
            techStack: [],
            responsibilities: [],
            achievements: [],
          };
          currentWork.projects = currentWork.projects || [];
          currentWork.projects.push(project);
          confidence += 0.1;
        }
      }

      if (currentWork && currentWork.company) {
        workExperience.push(currentWork as WorkEntry);
      }
    }

    // 提取独立项目
    if (projectSectionStart !== -1) {
      const projectLines = lines.slice(projectSectionStart + 1);

      let currentProject: Partial<ProjectEntry> | null = null;

      for (const line of projectLines) {
        if (/^(?:工作|教育|技能|经历|Work|Education|Skills|Experience)/.test(line)) {
          break;
        }

        // 检测项目标题
        const titleMatch = line.match(/^#{1,3}\s*(.+)/) || line.match(/^[•\-*]\s*(.+?)(?:\s*[-—]\s*(.+))?$/);
        if (titleMatch) {
          if (currentProject && currentProject.name) {
            projects.push(currentProject as ProjectEntry);
          }
          currentProject = {
            name: titleMatch[1].trim(),
            role: titleMatch[2]?.trim() || '',
            period: '',
            description: '',
            techStack: [],
            responsibilities: [],
            achievements: [],
          };
          confidence += 0.1;
          continue;
        }

        // 检测技术栈
        const techMatch = line.match(/(?:技术栈|Tech Stack|技术)[：:]\s*(.+)/i);
        if (techMatch && currentProject) {
          currentProject.techStack = techMatch[1].split(/[,，、|]/).map(s => s.trim()).filter(Boolean);
          confidence += 0.05;
          continue;
        }

        // 检测职责和成果
        const bulletMatch = line.match(/^[•\-*]\s*(.+)/);
        if (bulletMatch && currentProject) {
          if (line.includes('★') || line.includes('✦') || /成果|亮点|Result|Achievement/i.test(line)) {
            currentProject.achievements = currentProject.achievements || [];
            currentProject.achievements.push(bulletMatch[1].trim());
          } else {
            currentProject.responsibilities = currentProject.responsibilities || [];
            currentProject.responsibilities.push(bulletMatch[1].trim());
          }
          confidence += 0.05;
        }
      }

      if (currentProject && currentProject.name) {
        projects.push(currentProject as ProjectEntry);
      }
    }

    return { workExperience, projects, confidence };
  }
}
