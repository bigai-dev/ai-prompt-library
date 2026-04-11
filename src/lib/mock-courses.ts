export interface MockLesson {
  slug: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  loom_embed_url: string;
  duration_minutes: number;
}

export interface MockModule {
  id: string;
  title_zh: string;
  title_en: string;
  lessons: MockLesson[];
}

export interface MockCourse {
  slug: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  cover_image_url: string | null;
  modules: MockModule[];
}

// Helper to count all lessons in a course
export function getTotalLessons(course: MockCourse): number {
  return course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

// Helper to get total duration
export function getTotalDuration(course: MockCourse): number {
  return course.modules.reduce(
    (sum, m) =>
      sum + m.lessons.reduce((ls, l) => ls + l.duration_minutes, 0),
    0
  );
}

// Helper to flatten all lessons for prev/next navigation
export function getAllLessons(course: MockCourse): MockLesson[] {
  return course.modules.flatMap((m) => m.lessons);
}

// Find a course by slug
export function findCourse(slug: string): MockCourse | undefined {
  return MOCK_COURSES.find((c) => c.slug === slug);
}

// Find a lesson by slug within a course
export function findLesson(
  course: MockCourse,
  lessonSlug: string
): { lesson: MockLesson; module: MockModule } | undefined {
  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.slug === lessonSlug);
    if (lesson) return { lesson, module: mod };
  }
  return undefined;
}

export const MOCK_COURSES: MockCourse[] = [
  {
    slug: "vibe-coding-fundamentals",
    title_zh: "Vibe Coding 基础入门",
    title_en: "Vibe Coding Fundamentals",
    description_zh:
      "从零开始学习 Vibe Coding，掌握 AI 辅助编程的核心概念和工作流程。适合完全没有编程经验的老板们。",
    description_en:
      "Learn Vibe Coding from scratch. Master the core concepts and workflows of AI-assisted programming. Perfect for business owners with zero coding experience.",
    cover_image_url: null,
    modules: [
      {
        id: "mod-vf-1",
        title_zh: "什么是 Vibe Coding",
        title_en: "What is Vibe Coding",
        lessons: [
          {
            slug: "what-is-vibe-coding",
            title_zh: "Vibe Coding 是什么？为什么老板需要学？",
            title_en: "What is Vibe Coding? Why should business owners learn it?",
            description_zh:
              "了解 Vibe Coding 的定义、与传统编程的区别，以及它如何帮助 SME 老板快速构建工具。",
            description_en:
              "Understand what Vibe Coding is, how it differs from traditional programming, and how it helps SME owners build tools quickly.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-001",
            duration_minutes: 8,
          },
          {
            slug: "ai-tools-overview",
            title_zh: "AI 工具全景：Cursor、Claude、v0",
            title_en: "AI Tools Overview: Cursor, Claude, v0",
            description_zh:
              "快速了解目前最好用的 AI 编程工具，以及它们各自的强项和适用场景。",
            description_en:
              "A quick overview of the best AI coding tools available today and their strengths.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-002",
            duration_minutes: 12,
          },
          {
            slug: "mindset-shift",
            title_zh: "从「写代码」到「指挥 AI」的思维转变",
            title_en: "Mindset Shift: From Writing Code to Directing AI",
            description_zh:
              "学习如何用老板的思维来 \"指挥\" AI 写代码，而不是自己去学编程语言。",
            description_en:
              "Learn how to direct AI to write code using a business owner's mindset, instead of learning programming languages yourself.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-003",
            duration_minutes: 6,
          },
        ],
      },
      {
        id: "mod-vf-2",
        title_zh: "环境搭建",
        title_en: "Setting Up Your Environment",
        lessons: [
          {
            slug: "install-cursor",
            title_zh: "安装和设置 Cursor 编辑器",
            title_en: "Installing and Setting Up Cursor Editor",
            description_zh:
              "一步步教你下载、安装 Cursor，并完成初始设置。包括中文界面设置。",
            description_en:
              "Step-by-step guide to downloading, installing, and configuring Cursor editor.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-004",
            duration_minutes: 10,
          },
          {
            slug: "connect-claude",
            title_zh: "连接 Claude API 密钥",
            title_en: "Connecting Your Claude API Key",
            description_zh:
              "教你注册 Claude 账号、获取 API 密钥，并在 Cursor 中配置。",
            description_en:
              "How to register for Claude, get your API key, and configure it in Cursor.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-005",
            duration_minutes: 7,
          },
          {
            slug: "first-project",
            title_zh: "创建你的第一个项目",
            title_en: "Creating Your First Project",
            description_zh:
              "用 Cursor + Claude 从零创建一个简单的网页项目，体验完整的 Vibe Coding 流程。",
            description_en:
              "Create a simple web project from scratch using Cursor + Claude, experiencing the full Vibe Coding workflow.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-006",
            duration_minutes: 15,
          },
        ],
      },
      {
        id: "mod-vf-3",
        title_zh: "Prompt 技巧",
        title_en: "Prompt Techniques",
        lessons: [
          {
            slug: "effective-prompts",
            title_zh: "写出有效的 AI 指令",
            title_en: "Writing Effective AI Prompts",
            description_zh:
              "学习 Prompt 的基本结构和写作技巧，让 AI 更准确地理解你的需求。",
            description_en:
              "Learn the basic structure and writing techniques for prompts that help AI understand your requirements accurately.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-007",
            duration_minutes: 11,
          },
          {
            slug: "iterate-and-refine",
            title_zh: "迭代优化：当 AI 给出错误结果",
            title_en: "Iterate and Refine: When AI Gets It Wrong",
            description_zh:
              "AI 不会一次就给出完美答案。学习如何有效地迭代和修正 AI 的输出。",
            description_en:
              "AI won't give perfect answers on the first try. Learn how to effectively iterate and refine AI output.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-008",
            duration_minutes: 9,
          },
        ],
      },
    ],
  },
  {
    slug: "cursor-ai-masterclass",
    title_zh: "Cursor AI 实战操作",
    title_en: "Cursor AI Masterclass",
    description_zh:
      "深入学习 Cursor 编辑器的所有 AI 功能，包括 Composer、Chat、自动补全等。从基础操作到高级技巧，全面掌握。",
    description_en:
      "Deep dive into all AI features of the Cursor editor, including Composer, Chat, and auto-complete. From basics to advanced techniques.",
    cover_image_url: null,
    modules: [
      {
        id: "mod-cm-1",
        title_zh: "Cursor 核心功能",
        title_en: "Cursor Core Features",
        lessons: [
          {
            slug: "cursor-chat-basics",
            title_zh: "Cursor Chat：与 AI 对话写代码",
            title_en: "Cursor Chat: Coding Through AI Conversation",
            description_zh:
              "学习使用 Cursor Chat 功能，通过自然语言与 AI 对话来编写和修改代码。",
            description_en:
              "Learn to use Cursor Chat to write and modify code through natural language conversation with AI.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-009",
            duration_minutes: 14,
          },
          {
            slug: "cursor-composer",
            title_zh: "Composer：多文件编辑神器",
            title_en: "Composer: Multi-File Editing Powerhouse",
            description_zh:
              "Composer 可以同时编辑多个文件，是构建完整功能的最佳工具。",
            description_en:
              "Composer can edit multiple files simultaneously — the best tool for building complete features.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-010",
            duration_minutes: 16,
          },
          {
            slug: "cursor-autocomplete",
            title_zh: "Tab 自动补全和智能建议",
            title_en: "Tab Auto-complete and Smart Suggestions",
            description_zh:
              "利用 Cursor 的智能补全功能加速编码，减少重复劳动。",
            description_en:
              "Use Cursor's smart auto-complete to speed up coding and reduce repetitive work.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-011",
            duration_minutes: 8,
          },
        ],
      },
      {
        id: "mod-cm-2",
        title_zh: "实战项目",
        title_en: "Hands-On Projects",
        lessons: [
          {
            slug: "build-landing-page",
            title_zh: "实战：用 Cursor 做一个公司着陆页",
            title_en: "Hands-On: Build a Company Landing Page with Cursor",
            description_zh:
              "跟着视频，用 Cursor AI 从零做一个专业的公司着陆页。",
            description_en:
              "Follow along and build a professional company landing page from scratch using Cursor AI.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-012",
            duration_minutes: 25,
          },
          {
            slug: "build-quotation-tool",
            title_zh: "实战：做一个自动报价工具",
            title_en: "Hands-On: Build an Auto-Quotation Tool",
            description_zh:
              "用 Cursor + Claude 构建一个简单的报价生成工具，输入客户需求自动生成报价单。",
            description_en:
              "Build a simple quotation generator with Cursor + Claude that auto-generates quotes from customer requirements.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-013",
            duration_minutes: 30,
          },
        ],
      },
    ],
  },
  {
    slug: "claude-prompting-for-business",
    title_zh: "Claude 商业应用提示词",
    title_en: "Claude Prompting for Business",
    description_zh:
      "学习如何用 Claude 处理日常商业任务：写邮件、分析数据、生成报告、翻译文档。每个视频附带可直接使用的 Prompt 模板。",
    description_en:
      "Learn to use Claude for daily business tasks: writing emails, analyzing data, generating reports, translating documents. Each video comes with ready-to-use prompt templates.",
    cover_image_url: null,
    modules: [
      {
        id: "mod-cp-1",
        title_zh: "日常办公",
        title_en: "Daily Office Tasks",
        lessons: [
          {
            slug: "email-drafting",
            title_zh: "用 Claude 写专业商业邮件",
            title_en: "Drafting Professional Business Emails with Claude",
            description_zh:
              "学习如何用 Claude 快速撰写客户邮件、供应商沟通、内部通知等。",
            description_en:
              "Learn how to quickly draft customer emails, supplier communications, and internal notices with Claude.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-014",
            duration_minutes: 10,
          },
          {
            slug: "data-analysis",
            title_zh: "用 Claude 分析 Excel 数据",
            title_en: "Analyzing Excel Data with Claude",
            description_zh:
              "把 Excel 数据粘贴给 Claude，让它帮你分析趋势、找出异常、生成摘要。",
            description_en:
              "Paste Excel data into Claude and let it analyze trends, find anomalies, and generate summaries.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-015",
            duration_minutes: 13,
          },
          {
            slug: "meeting-minutes",
            title_zh: "AI 生成会议纪要和行动项",
            title_en: "AI-Generated Meeting Minutes and Action Items",
            description_zh:
              "录音转文字后，让 Claude 整理成结构化的会议纪要，自动提取行动项和负责人。",
            description_en:
              "After transcribing audio, let Claude organize it into structured meeting minutes with auto-extracted action items.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-016",
            duration_minutes: 9,
          },
        ],
      },
      {
        id: "mod-cp-2",
        title_zh: "营销与客户",
        title_en: "Marketing & Customer",
        lessons: [
          {
            slug: "social-media-content",
            title_zh: "用 Claude 批量生成社媒内容",
            title_en: "Batch-Generating Social Media Content with Claude",
            description_zh:
              "一次性生成一周的社交媒体帖子，包括文案、标签和发布时间建议。",
            description_en:
              "Generate a week's worth of social media posts at once, including copy, hashtags, and scheduling suggestions.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-017",
            duration_minutes: 12,
          },
          {
            slug: "customer-reply-templates",
            title_zh: "客户回复模板和 FAQ 生成",
            title_en: "Customer Reply Templates and FAQ Generation",
            description_zh:
              "用 Claude 分析常见客户问题，生成标准回复模板和 FAQ 页面内容。",
            description_en:
              "Use Claude to analyze common customer questions and generate standard reply templates and FAQ page content.",
            loom_embed_url: "https://www.loom.com/embed/placeholder-018",
            duration_minutes: 11,
          },
        ],
      },
    ],
  },
];
