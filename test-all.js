/**
 * 全面自测脚本 — 覆盖所有模块和边界情况
 * 运行: npm test
 */

const path = require('path');
const fs = require('fs');

const {
  ProjectAnalyzer, ResumeGenerator, ResumeManager, ResumeParser,
  ResumeMerger, TemplateEngine, Exporter, InterviewGenerator,
  InterviewManager, quickGenerate, quickGenerateInterview,
  parseExistingResume, mergeTwoResumes,
} = require('./dist/index');

let passed = 0, failed = 0;
const errors = [];

function assert(cond, name, detail = '') {
  if (cond) { console.log(`  ✅ ${name}`); passed++; }
  else { console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`); failed++; errors.push(name); }
}

function mockResume(overrides = {}) {
  return {
    id: 'mock-' + Date.now(), lang: 'zh', template: 'default',
    personalInfo: { name: '测试用户', title: '前端工程师', email: 'test@test.com', phone: '13800138000', summary: '测试简介', ...overrides.personalInfo },
    workExperience: overrides.workExperience || [{
      company: '测试公司', title: '前端', period: '2021-至今',
      projects: [{ name: '工作项目', role: '负责人', period: '2022', description: '', techStack: ['React'], responsibilities: ['开发'], achievements: ['完成'] }],
    }],
    projects: overrides.projects || [{
      name: '独立项目', role: '全栈', period: '2023', description: '描述',
      techStack: ['React', 'Node.js'], responsibilities: ['开发'], achievements: ['10W用户'],
    }],
    education: [{ school: '测试大学', degree: '本科', major: '计算机', period: '2016-2020' }],
    skills: [{ category: '语言', skills: ['TypeScript', 'JavaScript'] }],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

async function run() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  按照项目生成简历 & 面试问答 Skill — 全面自测');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. 模块导入
  console.log('【1】模块导入');
  assert(typeof ProjectAnalyzer === 'function', 'ProjectAnalyzer');
  assert(typeof ResumeGenerator === 'function', 'ResumeGenerator');
  assert(typeof ResumeManager === 'function', 'ResumeManager');
  assert(typeof ResumeParser === 'function', 'ResumeParser');
  assert(typeof ResumeMerger === 'function', 'ResumeMerger');
  assert(typeof TemplateEngine === 'function', 'TemplateEngine');
  assert(typeof Exporter === 'function', 'Exporter');
  assert(typeof InterviewGenerator === 'function', 'InterviewGenerator');
  assert(typeof InterviewManager === 'function', 'InterviewManager');
  assert(typeof quickGenerate === 'function', 'quickGenerate');
  assert(typeof quickGenerateInterview === 'function', 'quickGenerateInterview');
  assert(typeof parseExistingResume === 'function', 'parseExistingResume');
  assert(typeof mergeTwoResumes === 'function', 'mergeTwoResumes');

  // 2. ProjectAnalyzer
  console.log('\n【2】ProjectAnalyzer');
  try {
    const analyzer = new ProjectAnalyzer(__dirname);
    const a = await analyzer.analyze();
    assert(a.name.length > 0, '项目名: ' + a.name);
    assert(a.techStack.languages.length > 0, '识别语言: ' + a.techStack.languages.join(', '));
    assert(typeof a.architecture === 'string', '架构: ' + a.architecture);
    assert(Array.isArray(a.features), 'features 是数组');
    assert(Array.isArray(a.highlights), 'highlights 是数组');
    assert(a.gitContribution !== undefined, 'Git 数据存在');
    assert(a.directoryStructure.includes('src/'), '目录结构包含 src/');
    const ts = await analyzer.detectTechStack();
    assert(ts.languages.includes('TypeScript'), 'detectTechStack 单独调用');
    const git = await analyzer.analyzeGit();
    assert(git.totalCommits > 0, 'Git 总提交: ' + git.totalCommits);
  } catch (e) { assert(false, 'ProjectAnalyzer', e.message); }

  // 3. ResumeManager
  console.log('\n【3】ResumeManager');
  try {
    const m = new ResumeManager(path.join(__dirname, 'data', 'resumes'));
    const r = m.create({ personalInfo: { name: '张三', title: '工程师', summary: '' } });
    assert(r.id.length > 0, '创建成功');
    assert(m.list().length >= 1, '列表正常');
    assert(m.get(r.id).personalInfo.name === '张三', '获取正常');
    const u = m.update(r.id, { personalInfo: { ...m.get(r.id).personalInfo, title: '高级' } });
    assert(u.personalInfo.title === '高级', '更新正常');
    assert(m.search('张三').length >= 1, '搜索正常');
    const c = m.clone(r.id, '李四');
    assert(c.personalInfo.name === '李四', '克隆正常');
    m.delete(r.id); m.delete(c.id);
    assert(m.get(r.id) === null, '删除成功');
  } catch (e) { assert(false, 'ResumeManager', e.message); }

  // 4. TemplateEngine
  console.log('\n【4】TemplateEngine');
  try {
    const engine = new TemplateEngine();
    const r = mockResume();
    r.lang = 'zh';
    const zh = engine.render(r);
    assert(zh.includes('# 测试用户'), '中文标题');
    assert(zh.includes('## 个人简介'), '中文简介');
    assert(zh.includes('## 技能清单'), '中文技能');
    assert(zh.includes('## 工作经历'), '中文工作');
    assert(zh.includes('## 项目经历'), '中文项目');
    assert(zh.includes('## 教育背景'), '中文教育');
    r.lang = 'en';
    const en = engine.render(r);
    assert(en.includes('## Summary'), '英文 Summary');
    assert(en.includes('## Skills'), '英文 Skills');
    assert(en.includes('## Work Experience'), '英文 Work');
  } catch (e) { assert(false, 'TemplateEngine', e.message); }

  // 5. Exporter
  console.log('\n【5】Exporter');
  try {
    const exporter = new Exporter();
    const r = mockResume();
    const out = path.join(__dirname, 'data', 'exports');
    const md = await exporter.export(r, { format: 'markdown', outputPath: out });
    assert(fs.existsSync(md), 'MD 文件存在');
    fs.unlinkSync(md);
    const pdf = await exporter.export(r, { format: 'pdf', outputPath: out });
    assert(fs.existsSync(pdf), 'PDF 文件存在');
    fs.unlinkSync(pdf);
    const word = await exporter.export(r, { format: 'word', outputPath: out });
    assert(fs.existsSync(word), 'Word 文件存在');
    fs.unlinkSync(word);
    try { await exporter.export(r, { format: 'xml' }); assert(false); }
    catch (e) { assert(e.message.includes('不支持'), '不支持格式报错'); }
  } catch (e) { assert(false, 'Exporter', e.message); }

  // 6. ResumeParser
  console.log('\n【6】ResumeParser');
  try {
    const parser = new ResumeParser();
    const tmp = path.join(__dirname, 'data', 'test-resume.txt');
    fs.writeFileSync(tmp, '张三\n高级前端工程师\ntest@test.com | 13800138000 | github.com/zhangsan\n\n个人简介\n5年经验\n\n技能\n编程语言: TypeScript, JavaScript\n框架: React, Vue\n\n教育背景\n北京大学 | 本科 | 计算机\n2016 - 2020');
    const r1 = await parser.parse(tmp);
    assert(r1.resume.personalInfo.name === '张三', '姓名: 张三');
    assert(r1.resume.personalInfo.email === 'test@test.com', '邮箱正确');
    assert(r1.resume.personalInfo.phone === '13800138000', '电话正确');
    assert(r1.resume.skills.length > 0, '技能提取成功');
    assert(r1.confidence > 0, '置信度: ' + Math.round(r1.confidence * 100) + '%');
    const prompt = parser.generateAIParsePrompt(r1);
    assert(prompt.includes('张三'), 'Prompt 包含姓名');
    try { await parser.parse('test.xyz'); assert(false); }
    catch (e) { assert(e.message.includes('不支持'), '格式报错'); }
    fs.unlinkSync(tmp);
  } catch (e) { assert(false, 'ResumeParser', e.message); }

  // 7. ResumeMerger
  console.log('\n【7】ResumeMerger');
  try {
    const merger = new ResumeMerger();
    const existing = mockResume();
    const analysis = {
      name: '新项目', description: '新描述',
      techStack: { languages: ['Go'], frameworks: ['Gin'], databases: ['PG'], middleware: [], devOps: [], testing: [], others: [] },
      architecture: 'microservice', features: ['功能A'], highlights: ['亮点A'], directoryStructure: '',
    };
    const preview = merger.previewMerge(existing, analysis);
    assert(preview.newProjects.length === 1, '预览：新增项目');
    const merged = merger.mergeWithAnalysis(existing, analysis);
    assert(merged.projects.length === 2, '合并：项目数 2');
    const merged2 = merger.mergeWithAnalysis(merged, analysis);
    assert(merged2.projects.length === 2, '去重：不重复添加');
    const r2 = mockResume({ projects: [{ name: '另一个项目', role: '开发', period: '2023', description: '', techStack: ['Vue'], responsibilities: [], achievements: [] }] });
    const m3 = merger.mergeResumes(existing, r2);
    assert(m3.projects.length === 2, '简历合并：项目数 2');
    const r3 = mockResume();
    const m4 = merger.mergeResumes(existing, r3);
    assert(m4.projects.length === 1, '相同项目：不重复');
  } catch (e) { assert(false, 'ResumeMerger', e.message); }

  // 8. InterviewGenerator
  console.log('\n【8】InterviewGenerator');
  try {
    const gen = new InterviewGenerator();
    const analysis = {
      name: '测试项目', description: '描述',
      techStack: { languages: ['TS'], frameworks: ['React', 'Vue'], databases: ['Redis'], middleware: ['Kafka'], devOps: ['Docker'], testing: ['Jest'], others: [] },
      architecture: 'spa', features: ['功能1', '功能2', '功能3', '功能4'], highlights: ['亮点1'], directoryStructure: '',
    };
    const sk = gen.generateSkeleton(analysis, { lang: 'zh', targetRole: '高级前端' });
    assert(sk.questions.length > 0, '骨架：问题数 ' + sk.questions.length);
    const p = gen.generatePrompt(analysis, { lang: 'zh' });
    assert(p.includes('测试项目'), 'Prompt 包含项目名');
    assert(p.includes('JSON'), 'Prompt 要求 JSON');
    const dd = gen.generateDeepDivePrompt('React', '项目背景', 'zh');
    assert(dd.includes('React'), '深度追问包含技术名');
  } catch (e) { assert(false, 'InterviewGenerator', e.message); }

  // 9. InterviewManager
  console.log('\n【9】InterviewManager');
  try {
    const m = new InterviewManager(path.join(__dirname, 'data', 'interviews'));
    const interview = m.create({
      projectName: '测试', lang: 'zh',
      questions: [
        { id: 'q1', question: 'Q1', answer: 'A1', difficulty: 'basic', category: 'tech-stack', keyPoints: ['K1'] },
        { id: 'q2', question: 'Q2', answer: 'A2', difficulty: 'advanced', category: 'architecture', keyPoints: ['K2'] },
      ],
    });
    assert(interview.questions.length === 2, '创建：2 个问题');
    assert(m.list().length >= 1, '列表正常');
    assert(m.get(interview.id) !== null, '获取正常');
    assert(m.filterByCategory(interview.id, 'tech-stack').length === 1, '按类别筛选');
    assert(m.filterByDifficulty(interview.id, 'basic').length === 1, '按难度筛选');
    assert(m.search(interview.id, 'Q1').length === 1, '搜索正常');
    const added = m.addQuestion(interview.id, { id: 'q3', question: 'Q3', answer: 'A3', difficulty: 'intermediate', category: 'performance', keyPoints: [] });
    assert(added.questions.length === 3, '添加问题');
    const removed = m.removeQuestion(interview.id, 'q3');
    assert(removed.questions.length === 2, '删除问题');
    const md = m.toMarkdown(interview.id);
    assert(md.includes('测试'), 'Markdown 包含项目名');
    m.delete(interview.id);
    assert(m.get(interview.id) === null, '删除成功');
  } catch (e) { assert(false, 'InterviewManager', e.message); }

  // 10. quickGenerate 集成
  console.log('\n【10】quickGenerate 集成');
  try {
    const r = await quickGenerate({
      projectPath: __dirname, lang: 'zh', template: 'professional',
      targetRole: '高级前端', personalInfo: { name: '集成用户', title: '前端' },
    });
    assert(r.analysis !== undefined, 'analysis 存在');
    assert(r.resume !== undefined, 'resume 存在');
    assert(r.markdown.includes('集成用户'), 'markdown 包含用户名');
    new ResumeManager().delete(r.resume.id);
  } catch (e) { assert(false, 'quickGenerate', e.message); }

  // 11. quickGenerateInterview 集成
  console.log('\n【11】quickGenerateInterview 集成');
  try {
    const r = await quickGenerateInterview({
      projectPath: __dirname, targetRole: '高级前端', lang: 'zh', questionsPerCategory: 2,
    });
    assert(r.analysis !== undefined, 'analysis 存在');
    assert(r.interview !== undefined, 'interview 存在');
    assert(r.interview.questions.length > 0, '问题数: ' + r.interview.questions.length);
    assert(r.markdown.length > 0, 'markdown 非空');
    assert(r.aiPrompt.length > 0, 'aiPrompt 非空');
    new InterviewManager().delete(r.interview.id);
  } catch (e) { assert(false, 'quickGenerateInterview', e.message); }

  // 12. 边界情况
  console.log('\n【12】边界情况');
  try {
    const emptyDir = path.join(__dirname, 'data', 'empty');
    if (!fs.existsSync(emptyDir)) fs.mkdirSync(emptyDir, { recursive: true });
    const a = new ProjectAnalyzer(emptyDir);
    assert((await a.detectTechStack()).languages.length === 0, '空项目无语言');
    assert((await a.analyzeGit()) === undefined, '空项目无 Git');
    fs.rmdirSync(emptyDir);
    const empty = mockResume({ projects: [], skills: [] });
    const analysis = { name: '新', description: '', techStack: { languages: ['Go'], frameworks: [], databases: [], middleware: [], devOps: [], testing: [], others: [] }, architecture: 'unknown', features: [], highlights: [], directoryStructure: '' };
    assert(new ResumeMerger().mergeWithAnalysis(empty, analysis).projects.length === 1, '空简历合并正常');
    const gen = new ResumeGenerator();
    assert(gen.generatePrompt(analysis, { lang: 'zh' }).length > 0, 'generatePrompt 正常');
    assert(gen.generateDraft(analysis, { lang: 'zh' }).projects?.length > 0, 'generateDraft 正常');
  } catch (e) { assert(false, '边界情况', e.message); }

  // 结果
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  结果: ${passed} 通过, ${failed} 失败`);
  console.log('═══════════════════════════════════════════════════════');
  if (failed > 0) {
    console.log('\n失败:');
    errors.forEach(e => console.log(`  ❌ ${e}`));
    process.exit(1);
  }
  console.log('');
}

run().catch(e => { console.error(e); process.exit(1); });
