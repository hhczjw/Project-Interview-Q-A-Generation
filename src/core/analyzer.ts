/**
 * 项目分析器 — 扫描项目目录，提取技术栈、架构、亮点等信息
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectAnalysis, TechStack, ArchType, GitContribution } from '../types';

// ==================== 技术栈识别规则 ====================

const TECH_RULES: Record<keyof TechStack, Record<string, string[]>> = {
  languages: {
    'TypeScript': ['tsconfig.json', '*.ts', '*.tsx'],
    'JavaScript': ['package.json', '*.js', '*.jsx', '*.mjs'],
    'Python': ['requirements.txt', 'setup.py', 'pyproject.toml', '*.py', 'Pipfile'],
    'Java': ['pom.xml', 'build.gradle', '*.java'],
    'Go': ['go.mod', 'go.sum', '*.go'],
    'Rust': ['Cargo.toml', '*.rs'],
    'C++': ['CMakeLists.txt', '*.cpp', '*.cc', '*.h'],
    'C#': ['*.csproj', '*.sln', '*.cs'],
    'Ruby': ['Gemfile', '*.rb'],
    'PHP': ['composer.json', '*.php'],
    'Swift': ['*.swift', 'Package.swift'],
    'Kotlin': ['*.kt', '*.kts'],
    'Dart': ['pubspec.yaml', '*.dart'],
  },
  frameworks: {
    'React': ['react', 'react-dom'],
    'Vue': ['vue', '@vue/cli-service'],
    'Angular': ['@angular/core', '@angular/cli'],
    'Next.js': ['next'],
    'Nuxt': ['nuxt'],
    'Express': ['express'],
    'Koa': ['koa'],
    'NestJS': ['@nestjs/core', '@nestjs/common'],
    'Spring Boot': ['spring-boot'],
    'Django': ['django'],
    'Flask': ['flask'],
    'FastAPI': ['fastapi'],
    'Gin': ['github.com/gin-gonic/gin'],
    'Flutter': ['flutter'],
    'React Native': ['react-native'],
    'Electron': ['electron'],
    'Svelte': ['svelte'],
    'Astro': ['astro'],
    'Remix': ['@remix-run'],
  },
  databases: {
    'MySQL': ['mysql', 'mysql2'],
    'PostgreSQL': ['pg', 'postgres', 'postgresql'],
    'MongoDB': ['mongodb', 'mongoose'],
    'Redis': ['redis', 'ioredis'],
    'SQLite': ['sqlite3', 'better-sqlite3'],
    'Elasticsearch': ['elasticsearch', '@elastic/elasticsearch'],
    'ClickHouse': ['clickhouse'],
    'DynamoDB': ['aws-sdk', '@aws-sdk/client-dynamodb'],
    'Prisma': ['@prisma/client', 'prisma'],
    'TypeORM': ['typeorm'],
    'Drizzle': ['drizzle-orm'],
  },
  middleware: {
    'Nginx': ['nginx.conf', 'nginx'],
    'Kafka': ['kafka', 'kafkajs'],
    'RabbitMQ': ['amqplib', 'rabbitmq'],
    'gRPC': ['grpc', '@grpc/grpc-js'],
    'GraphQL': ['graphql', 'apollo-server'],
    'WebSocket': ['ws', 'socket.io'],
  },
  devOps: {
    'Docker': ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
    'Kubernetes': ['k8s', 'kubernetes', '*.yaml'],
    'GitHub Actions': ['.github/workflows'],
    'Jenkins': ['Jenkinsfile'],
    'Terraform': ['*.tf'],
    'AWS': ['aws-sdk', '@aws-sdk'],
    'Vercel': ['vercel.json'],
    'Nginx': ['nginx.conf'],
  },
  testing: {
    'Jest': ['jest', '@jest'],
    'Vitest': ['vitest'],
    'Mocha': ['mocha'],
    'Cypress': ['cypress'],
    'Playwright': ['@playwright/test', 'playwright'],
    'pytest': ['pytest'],
    'JUnit': ['junit'],
    'Testing Library': ['@testing-library'],
  },
  others: {
    'Webpack': ['webpack'],
    'Vite': ['vite'],
    'ESLint': ['eslint', '.eslintrc'],
    'Prettier': ['prettier', '.prettierrc'],
    'Husky': ['husky'],
    'Storybook': ['storybook'],
    'Swagger': ['swagger'],
    'Log4j': ['log4j'],
    'Axios': ['axios'],
    'Lodash': ['lodash'],
    'Day.js': ['dayjs'],
    'Zustand': ['zustand'],
    'Redux': ['redux', '@reduxjs/toolkit'],
    'Pinia': ['pinia'],
    'Vuex': ['vuex'],
  },
};

// ==================== 架构模式识别 ====================

interface ArchPattern {
  type: ArchType;
  indicators: string[];
  weight: number;
}

const ARCH_PATTERNS: ArchPattern[] = [
  { type: 'microservice', indicators: ['docker-compose', 'k8s', 'api-gateway', 'service-discovery'], weight: 3 },
  { type: 'monolith', indicators: ['single-app', 'mvc', 'monolith'], weight: 2 },
  { type: 'serverless', indicators: ['serverless.yml', 'lambda', 'cloud-functions'], weight: 3 },
  { type: 'spa', indicators: ['react', 'vue', 'angular', 'svelte'], weight: 2 },
  { type: 'cli', indicators: ['commander', 'yargs', 'inquirer', 'cli.js'], weight: 2 },
  { type: 'library', indicators: ['lib/', 'dist/', 'index.js', 'index.ts'], weight: 1 },
  { type: 'mobile', indicators: ['react-native', 'flutter', 'ionic'], weight: 3 },
];

// ==================== 分析器实现 ====================

export class ProjectAnalyzer {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * 执行完整的项目分析
   */
  async analyze(): Promise<ProjectAnalysis> {
    const [
      techStack,
      architecture,
      description,
      features,
      directoryStructure,
      packageInfo,
      gitContribution,
    ] = await Promise.all([
      this.detectTechStack(),
      this.detectArchitecture(),
      this.readDescription(),
      this.extractFeatures(),
      this.getDirectoryStructure(),
      this.readPackageInfo(),
      this.analyzeGit(),
    ]);

    const highlights = this.extractHighlights(techStack, features, gitContribution);

    return {
      name: this.getProjectName(),
      description,
      techStack,
      architecture,
      features,
      highlights,
      gitContribution,
      directoryStructure,
      packageInfo,
    };
  }

  /**
   * 检测技术栈
   */
  async detectTechStack(): Promise<TechStack> {
    const result: TechStack = {
      languages: [],
      frameworks: [],
      databases: [],
      middleware: [],
      devOps: [],
      testing: [],
      others: [],
    };

    // 扫描文件系统
    const files = await this.listFiles(this.projectPath, 3);

    // 读取依赖文件
    const deps = await this.collectDependencies();

    for (const [category, rules] of Object.entries(TECH_RULES)) {
      const cat = category as keyof TechStack;
      for (const [tech, patterns] of Object.entries(rules)) {
        const found = patterns.some(pattern => {
          // 检查文件匹配
          if (files.some(f => this.matchPattern(f, pattern))) return true;
          // 检查依赖匹配
          if (deps.some(d => d === pattern || d.startsWith(pattern))) return true;
          return false;
        });
        if (found && !result[cat].includes(tech)) {
          result[cat].push(tech);
        }
      }
    }

    return result;
  }

  /**
   * 检测架构类型
   */
  async detectArchitecture(): Promise<ArchType> {
    const files = await this.listFiles(this.projectPath, 2);
    const deps = await this.collectDependencies();
    const allItems = [...files, ...deps];

    const scores: Record<ArchType, number> = {
      monolith: 0, microservice: 0, serverless: 0,
      spa: 0, cli: 0, library: 0, mobile: 0, unknown: 0,
    };

    for (const pattern of ARCH_PATTERNS) {
      for (const indicator of pattern.indicators) {
        if (allItems.some(item => item.toLowerCase().includes(indicator.toLowerCase()))) {
          scores[pattern.type] += pattern.weight;
        }
      }
    }

    const bestType = Object.entries(scores)
      .filter(([k]) => k !== 'unknown')
      .sort((a, b) => b[1] - a[1])[0];

    return bestType && bestType[1] > 0 ? bestType[0] as ArchType : 'unknown';
  }

  /**
   * 读取项目描述（README）
   */
  async readDescription(): Promise<string> {
    const readmeFiles = ['README.md', 'README.MD', 'readme.md', 'README', 'README.txt'];
    for (const name of readmeFiles) {
      const filePath = path.join(this.projectPath, name);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // 提取第一段作为描述
        const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
        return lines.slice(0, 3).join(' ').substring(0, 500);
      }
    }
    return '';
  }

  /**
   * 提取项目特性
   */
  async extractFeatures(): Promise<string[]> {
    const features: string[] = [];
    const readmePath = path.join(this.projectPath, 'README.md');

    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf-8');
      // 提取特性列表（通常在 Features 或 功能 部分）
      const featureSection = content.match(/(?:##\s*(?:Features?|功能|特性)[\s\S]*?)(?=##|$)/i);
      if (featureSection) {
        const items = featureSection[0].match(/[-*]\s+.+/g);
        if (items) {
          features.push(...items.map(i => i.replace(/^[-*]\s+/, '').trim()));
        }
      }
    }

    return features;
  }

  /**
   * 获取目录结构
   */
  async getDirectoryStructure(maxDepth: number = 3): Promise<string> {
    const buildTree = (dir: string, depth: number, prefix: string = ''): string => {
      if (depth > maxDepth) return '';

      let result = '';
      try {
        const items = fs.readdirSync(dir)
          .filter(item => !item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== '__pycache__')
          .sort();

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const fullPath = path.join(dir, item);
          const isLast = i === items.length - 1;
          const connector = isLast ? '└── ' : '├── ';
          const nextPrefix = isLast ? '    ' : '│   ';

          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              result += `${prefix}${connector}${item}/\n`;
              result += buildTree(fullPath, depth + 1, prefix + nextPrefix);
            } else {
              result += `${prefix}${connector}${item}\n`;
            }
          } catch {
            // skip inaccessible files
          }
        }
      } catch {
        // skip inaccessible directories
      }
      return result;
    };

    return this.getProjectName() + '/\n' + buildTree(this.projectPath, 0);
  }

  /**
   * 读取包信息
   */
  async readPackageInfo(): Promise<Record<string, any> | undefined> {
    const files = ['package.json', 'pom.xml', 'build.gradle', 'go.mod', 'Cargo.toml', 'pyproject.toml'];
    for (const file of files) {
      const filePath = path.join(this.projectPath, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (file.endsWith('.json')) {
            return JSON.parse(content);
          }
          return { _file: file, _raw: content.substring(0, 1000) };
        } catch {
          return undefined;
        }
      }
    }
    return undefined;
  }

  /**
   * 分析 Git 贡献
   */
  async analyzeGit(): Promise<GitContribution | undefined> {
    const { execSync } = require('child_process');
    const gitDir = path.join(this.projectPath, '.git');

    if (!fs.existsSync(gitDir)) return undefined;

    try {
      const exec = (cmd: string) => {
        try {
          return execSync(cmd, { cwd: this.projectPath, encoding: 'utf-8' }).trim();
        } catch {
          return '';
        }
      };

      const totalCommits = parseInt(exec('git rev-list --count HEAD')) || 0;
      const firstCommitDate = exec('git log --reverse --format=%ai --max-count=1');
      const lastCommitDate = exec('git log --format=%ai --max-count=1');

      // 获取提交统计
      const shortstat = exec('git diff --shortstat HEAD~10 HEAD');
      const linesAdded = parseInt(shortstat.match(/(\d+) insertion/)?.[1] || '0');
      const linesDeleted = parseInt(shortstat.match(/(\d+) deletion/)?.[1] || '0');

      // 获取最近的提交信息
      const commitMessages = exec('git log --oneline --max-count=20')
        .split('\n')
        .map((line: string) => line.replace(/^[a-f0-9]+\s+/, ''))
        .filter(Boolean);

      // 获取修改最多的文件
      const topFiles = exec('git log --pretty=format: --name-only | sort | uniq -c | sort -rg | head -10')
        .split('\n')
        .map((line: string) => line.trim().split(/\s+/).pop() || '')
        .filter(Boolean);

      return {
        totalCommits,
        firstCommitDate,
        lastCommitDate,
        linesAdded,
        linesDeleted,
        topFiles,
        commitMessages,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * 提取项目亮点
   */
  private extractHighlights(techStack: TechStack, features: string[], git?: GitContribution): string[] {
    const highlights: string[] = [];

    // 技术栈亮点
    const allTechs = [
      ...techStack.languages,
      ...techStack.frameworks,
      ...techStack.databases,
      ...techStack.middleware,
    ];
    if (allTechs.length > 0) {
      highlights.push(`技术栈涵盖 ${allTechs.length} 项技术：${allTechs.slice(0, 8).join('、')}`);
    }

    // 特性亮点
    if (features.length > 3) {
      highlights.push(`项目包含 ${features.length} 项核心功能`);
    }

    // Git 亮点
    if (git) {
      if (git.totalCommits > 50) {
        highlights.push(`累计 ${git.totalCommits} 次代码提交，持续迭代优化`);
      }
      if (git.linesAdded > 1000) {
        highlights.push(`新增超过 ${git.linesAdded} 行代码`);
      }
    }

    return highlights;
  }

  // ==================== 工具方法 ====================

  private getProjectName(): string {
    const pkgPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        return pkg.name || path.basename(this.projectPath);
      } catch {}
    }
    return path.basename(this.projectPath);
  }

  private async listFiles(dir: string, maxDepth: number, currentDepth: number = 0): Promise<string[]> {
    if (currentDepth > maxDepth) return [];

    const results: string[] = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item.startsWith('.') || ['node_modules', 'dist', '__pycache__', '.git'].includes(item)) continue;

        const fullPath = path.join(dir, item);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            results.push(...(await this.listFiles(fullPath, maxDepth, currentDepth + 1)));
          } else {
            results.push(item);
          }
        } catch {}
      }
    } catch {}

    return results;
  }

  private async collectDependencies(): Promise<string[]> {
    const deps: string[] = [];
    const pkgPath = path.join(this.projectPath, 'package.json');

    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        deps.push(
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys(pkg.devDependencies || {}),
          ...Object.keys(pkg.peerDependencies || {}),
        );
      } catch {}
    }

    // Python
    const reqPath = path.join(this.projectPath, 'requirements.txt');
    if (fs.existsSync(reqPath)) {
      const content = fs.readFileSync(reqPath, 'utf-8');
      deps.push(...content.split('\n').map(l => l.split(/[=<>]/)[0].trim()).filter(Boolean));
    }

    // Go
    const goPath = path.join(this.projectPath, 'go.mod');
    if (fs.existsSync(goPath)) {
      const content = fs.readFileSync(goPath, 'utf-8');
      const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
      if (requireBlock) {
        deps.push(...requireBlock[1].split('\n').map(l => l.trim().split(/\s/)[0]).filter(Boolean));
      }
    }

    return deps;
  }

  private matchPattern(filename: string, pattern: string): boolean {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(filename);
    }
    return filename === pattern || filename.endsWith('/' + pattern) || filename.includes(pattern);
  }
}
