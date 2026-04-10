-- ============================================================
-- SEED DATA — AI Prompt Library
-- All IDs are auto-generated via gen_random_uuid().
-- References use slug-based subqueries — no hardcoded UUIDs.
-- ============================================================

-- Admin allowlist
insert into admins (email) values
  ('jay@bigai.my'),
  ('reeve@bigai.my');

-- Categories
insert into categories (slug, name_zh, name_en, icon, sort_order) values
  ('sales',            '销售',     'Sales',            'trending-up',    1),
  ('marketing',        '营销',     'Marketing',        'megaphone',      2),
  ('finance',          '财务',     'Finance',          'calculator',     3),
  ('operations',       '运营',     'Operations',       'settings',       4),
  ('customer-service', '客服',     'Customer Service',  'headphones',     5),
  ('hr',               '人事',     'HR',               'users',          6),
  ('data',             '数据分析', 'Data',             'bar-chart-3',    7),
  ('utilities',        '工具',     'Utilities',        'wrench',         8);

-- Tags
insert into tags (name, slug) values
  ('PDF',         'pdf'),
  ('Cursor',      'cursor'),
  ('Claude',      'claude'),
  ('v0',          'v0'),
  ('自动化',      'automation'),
  ('模板生成',    'template-gen'),
  ('数据处理',    'data-processing'),
  ('社交媒体',    'social-media'),
  ('Email',       'email'),
  ('Dashboard',   'dashboard');

-- Industries
insert into industries (slug, name_zh, name_en, sort_order) values
  ('fnb',           '餐饮',     'F&B',              1),
  ('retail',        '零售',     'Retail',           2),
  ('education',     '教育',     'Education',        3),
  ('technology',    '科技',     'Technology',       4),
  ('manufacturing', '制造',     'Manufacturing',    5),
  ('services',      '服务业',   'Services',         6),
  ('ecommerce',     '电商',     'E-commerce',       7),
  ('healthcare',    '医疗',     'Healthcare',       8),
  ('property',      '房地产',   'Property',         9),
  ('general',       '通用',     'General',         10);

-- ============================================================
-- Prompts (12 starter prompts)
-- ============================================================

insert into prompts (slug, title_zh, title_en, subtitle, category_id, difficulty, estimated_minutes, version, prompt_body, boss_tip, status) values

-- Sales (2)
('pdf-quotation-generator',
 '一键 PDF 报价生成器',
 'PDF Quotation Generator',
 '输入客户和产品信息，自动生成专业 PDF 报价单',
 (select id from categories where slug = 'sales'), 'medium', 15, 'v2.3',
 '你是一个专业的报价单生成器。请根据以下信息，生成一份格式规范的 PDF 报价单：

## 公司信息
- 公司名称：{company_name}
- 公司地址：{company_address}
- 联系电话：{company_phone}
- 邮箱：{company_email}

## 客户信息
- 客户名称：{client_name}
- 客户公司：{client_company}

## 产品列表
{product_list}

## 要求
1. 使用专业的报价单格式
2. 包含日期、报价编号（自动生成）
3. 自动计算小计和总计
4. 包含付款条款：{payment_terms}
5. 底部包含公司盖章位置
6. 支持 MYR 货币格式',
 '小贴士：报价单模板生成后，可以用 Cursor 进一步调整样式。建议先用少量产品测试，确认格式后再批量生成。',
 'published'),

('sales-follow-up-email',
 '销售跟进邮件生成器',
 'Sales Follow-up Email Generator',
 '根据客户互动历史，自动生成个性化跟进邮件',
 (select id from categories where slug = 'sales'), 'easy', 5, 'v1.0',
 '你是一位资深销售顾问。请根据以下信息，撰写一封专业的跟进邮件：

## 基本信息
- 销售人员：{sales_name}
- 客户名称：{client_name}
- 上次互动：{last_interaction}
- 产品/服务：{product_service}

## 跟进目的
{follow_up_purpose}

## 要求
1. 语气专业但亲切
2. 提及上次互动内容
3. 明确下一步行动
4. 控制在 200 字以内
5. 语言：{language}',
 '小贴士：跟进邮件最佳发送时间是工作日上午 10 点。记得在发送前检查客户名称是否正确！',
 'published'),

-- Marketing (2)
('social-media-content-calendar',
 '社交媒体内容日历生成器',
 'Social Media Content Calendar',
 '一键生成一周的社交媒体发帖计划',
 (select id from categories where slug = 'marketing'), 'easy', 10, 'v1.2',
 '你是一位社交媒体营销专家。请为以下品牌生成一周的内容日历：

## 品牌信息
- 品牌名称：{brand_name}
- 行业：{industry}
- 目标受众：{target_audience}
- 品牌调性：{brand_tone}

## 平台
{platforms}

## 要求
1. 生成周一到周五的发帖计划
2. 每天 1-2 个帖子
3. 包含：发帖时间、平台、内容类型、文案、建议配图说明
4. 混合内容类型（教育、互动、促销、幕后）
5. 包含相关 hashtag
6. 语言：{language}',
 '小贴士：内容日历生成后，建议用 Canva 或 v0 配合生成配图，效率翻倍！',
 'published'),

('ad-copy-generator',
 '广告文案批量生成器',
 'Ad Copy Batch Generator',
 '批量生成 Facebook / Google 广告文案变体',
 (select id from categories where slug = 'marketing'), 'medium', 10, 'v1.0',
 '你是一位数字广告专家。请为以下产品/服务生成多组广告文案：

## 产品信息
- 产品名称：{product_name}
- 核心卖点：{usp}
- 目标受众：{target_audience}
- 促销信息：{promotion}

## 平台：{ad_platform}

## 要求
1. 生成 5 组不同角度的广告文案
2. 每组包含：标题（25字内）、正文（90字内）、CTA
3. 角度分别为：痛点、好处、社会证明、紧迫感、故事
4. 适合 {ad_platform} 的格式规范
5. 语言：{language}',
 '小贴士：建议同时测试 3-5 组文案，跑 A/B 测试找出表现最好的版本。',
 'published'),

-- Finance (1)
('expense-report-analyzer',
 '费用报告分析器',
 'Expense Report Analyzer',
 '上传费用数据，自动分类分析并生成报告',
 (select id from categories where slug = 'finance'), 'medium', 15, 'v1.0',
 '你是一位财务分析师。请分析以下费用数据并生成报告：

## 公司信息
- 公司名称：{company_name}
- 报告期间：{report_period}
- 货币：{currency}

## 费用数据
{expense_data}

## 要求
1. 按类别分类所有费用（办公、交通、餐饮、市场、人力等）
2. 计算各类别占比
3. 与上期对比（如有数据）
4. 标注异常支出
5. 生成费用趋势建议
6. 输出格式：结构化报告 + 数据表格',
 '小贴士：可以直接将 Excel 数据复制粘贴到费用数据字段中，AI 能自动识别表格格式。',
 'published'),

-- Operations (2)
('sop-builder',
 'SOP 标准流程生成器',
 'SOP Builder',
 '输入业务流程描述，自动生成标准操作流程文档',
 (select id from categories where slug = 'operations'), 'easy', 10, 'v1.0',
 '你是一位运营管理专家。请根据以下信息生成标准操作流程（SOP）文档：

## 基本信息
- 流程名称：{process_name}
- 部门：{department}
- 负责人：{owner}

## 流程描述
{process_description}

## 要求
1. 生成编号清晰的步骤列表
2. 每个步骤包含：操作说明、负责角色、预计耗时、注意事项
3. 包含前置条件和完成标准
4. 包含异常处理流程
5. 适合打印的格式
6. 语言：中文',
 '小贴士：SOP 生成后建议让实际执行的员工审核一遍，确保步骤可行。好的 SOP 应该让新员工也能跟着操作。',
 'published'),

('meeting-minutes-generator',
 '会议纪要生成器',
 'Meeting Minutes Generator',
 '输入会议录音转文字，自动整理成结构化会议纪要',
 (select id from categories where slug = 'operations'), 'easy', 5, 'v1.0',
 '你是一位高效的会议记录员。请将以下会议内容整理成结构化会议纪要：

## 会议信息
- 会议主题：{meeting_topic}
- 日期：{meeting_date}
- 参与者：{participants}

## 会议内容
{meeting_content}

## 要求
1. 提取关键讨论点
2. 列出所有决议事项
3. 明确每项行动的负责人和截止日期
4. 标注待解决问题
5. 控制在 1 页内
6. 格式：标题、讨论要点、决议、行动项、下次会议',
 '小贴士：可以用手机录音后，先用语音转文字工具转录，再粘贴到这里整理。省时又准确！',
 'published'),

-- Customer Service (1)
('faq-generator',
 'FAQ 智能问答库生成器',
 'FAQ Generator',
 '根据产品/服务信息，自动生成常见问题解答',
 (select id from categories where slug = 'customer-service'), 'easy', 10, 'v1.0',
 '你是一位客户服务专家。请为以下产品/服务生成 FAQ 问答库：

## 产品/服务信息
- 名称：{product_name}
- 描述：{product_description}
- 价格范围：{price_range}
- 目标客户：{target_customer}

## 要求
1. 生成 {faq_count} 个常见问题及解答
2. 分类为：产品相关、价格相关、售后相关、技术相关
3. 回答要简洁专业，控制在 100 字以内
4. 语气友好但专业
5. 包含引导性回答（引导客户下一步行动）
6. 语言：{language}',
 '小贴士：FAQ 可以直接用在网站、WhatsApp 自动回复和客服培训中。建议每月更新一次，加入新的常见问题。',
 'published'),

-- HR (1)
('job-description-generator',
 '职位描述生成器',
 'Job Description Generator',
 '快速生成专业的招聘职位描述',
 (select id from categories where slug = 'hr'), 'easy', 5, 'v1.0',
 '你是一位人力资源专家。请生成以下职位的招聘描述：

## 职位信息
- 职位名称：{job_title}
- 部门：{department}
- 汇报对象：{report_to}
- 工作地点：{location}
- 工作类型：{job_type}

## 公司信息
- 公司名称：{company_name}
- 行业：{industry}

## 要求
1. 包含：职位概述、主要职责（5-8 条）、任职要求、加分项
2. 包含薪资范围（如适用）：{salary_range}
3. 包含公司福利亮点
4. 语气专业又有吸引力
5. 适合发布在 JobStreet / LinkedIn
6. 语言：{language}',
 '小贴士：发布前记得让部门主管审核职责描述，确保与实际工作内容一致。好的 JD 能帮你筛选掉 80% 不合适的候选人。',
 'published'),

-- Data (2)
('dashboard-builder',
 '数据仪表盘生成器',
 'Dashboard Builder',
 '描述你的数据需求，AI 帮你生成完整的仪表盘代码',
 (select id from categories where slug = 'data'), 'hard', 30, 'v1.0',
 '你是一位数据可视化专家和前端开发者。请根据以下需求生成一个数据仪表盘：

## 仪表盘信息
- 名称：{dashboard_name}
- 用途：{dashboard_purpose}
- 使用者：{dashboard_users}

## 数据指标
{metrics}

## 技术要求
- 框架：Next.js + Tailwind CSS
- 图表库：Recharts
- 响应式设计
- 组件化结构

## 要求
1. 生成完整可运行的代码
2. 包含：KPI 卡片、折线图、柱状图、饼图
3. 使用模拟数据
4. 配色方案：{color_scheme}
5. 包含日期筛选器
6. 移动端适配',
 '小贴士：仪表盘生成后，用 Cursor 打开项目，替换模拟数据为真实 API 即可。建议先确认老板最关心的 3-5 个指标。',
 'published'),

('csv-data-cleaner',
 'CSV 数据清洗助手',
 'CSV Data Cleaner',
 '上传 CSV 数据描述，生成数据清洗和转换脚本',
 (select id from categories where slug = 'data'), 'medium', 10, 'v1.0',
 '你是一位数据工程师。请根据以下 CSV 数据描述生成清洗脚本：

## 数据信息
- 文件名：{file_name}
- 数据描述：{data_description}
- 列名：{column_names}
- 数据量（约）：{row_count} 行

## 清洗需求
{cleaning_requirements}

## 要求
1. 生成 Python pandas 清洗脚本
2. 处理：缺失值、重复数据、格式统一、异常值
3. 包含数据验证步骤
4. 输出清洗后的 CSV
5. 打印清洗报告（处理前后对比）
6. 代码包含注释说明',
 '小贴士：数据清洗前先备份原始文件！建议先用小样本（前 100 行）测试脚本，确认无误后再处理全量数据。',
 'published'),

-- Utilities (1)
('landing-page-generator',
 '落地页快速生成器',
 'Landing Page Generator',
 '描述产品和目标，AI 生成完整的落地页代码',
 (select id from categories where slug = 'utilities'), 'hard', 20, 'v2.0',
 '你是一位全栈开发者和转化率优化专家。请生成一个高转化率的产品落地页：

## 产品信息
- 产品名称：{product_name}
- 一句话描述：{tagline}
- 核心卖点：{key_benefits}
- 目标受众：{target_audience}
- CTA 按钮文字：{cta_text}
- CTA 链接：{cta_link}

## 技术要求
- 使用 Next.js + Tailwind CSS
- 响应式设计（移动优先）
- 包含动画效果

## 页面结构
1. Hero 区域（大标题 + 副标题 + CTA）
2. 痛点/问题描述
3. 解决方案/功能介绍（3-4 个特点）
4. 社会证明/客户评价
5. 价格区域（如适用）：{pricing}
6. FAQ（3-5 个问题）
7. 底部 CTA + 联系方式：{contact_info}

## 配色方案：{color_scheme}',
 '小贴士：落地页的关键是聚焦一个目标。不要放太多链接分散注意力。用 v0 预览效果，满意后用 Cursor 部署到 Vercel。',
 'published');

-- ============================================================
-- Prompt Variables
-- ============================================================

-- PDF Quotation Generator
insert into prompt_variables (prompt_id, key, label_zh, label_en, default_value, input_type, sort_order) values
  ((select id from prompts where slug = 'pdf-quotation-generator'), 'company_name',    '公司名称',   'Company Name',    'Annex Creative Sdn Bhd', 'text', 1),
  ((select id from prompts where slug = 'pdf-quotation-generator'), 'company_address', '公司地址',   'Company Address',  'Kuala Lumpur, Malaysia',  'text', 2),
  ((select id from prompts where slug = 'pdf-quotation-generator'), 'company_phone',   '联系电话',   'Phone',           '+60 12-345 6789',         'text', 3),
  ((select id from prompts where slug = 'pdf-quotation-generator'), 'company_email',   '邮箱',       'Email',           'info@company.com',        'text', 4),
  ((select id from prompts where slug = 'pdf-quotation-generator'), 'client_name',     '客户名称',   'Client Name',     '张先生',                   'text', 5),
  ((select id from prompts where slug = 'pdf-quotation-generator'), 'client_company',  '客户公司',   'Client Company',  'ABC Trading Sdn Bhd',     'text', 6),
  ((select id from prompts where slug = 'pdf-quotation-generator'), 'product_list',    '产品列表',   'Product List',    '1. 网站设计 - RM 5,000\n2. Logo 设计 - RM 1,500\n3. 名片设计 - RM 500', 'textarea', 7),
  ((select id from prompts where slug = 'pdf-quotation-generator'), 'payment_terms',   '付款条款',   'Payment Terms',   '50% 预付，50% 完成后支付', 'text', 8);

-- Sales Follow-up Email
insert into prompt_variables (prompt_id, key, label_zh, label_en, default_value, input_type, sort_order) values
  ((select id from prompts where slug = 'sales-follow-up-email'), 'sales_name',        '销售人员',   'Sales Person',     '李明',           'text', 1),
  ((select id from prompts where slug = 'sales-follow-up-email'), 'client_name',       '客户名称',   'Client Name',      '王总',           'text', 2),
  ((select id from prompts where slug = 'sales-follow-up-email'), 'last_interaction',  '上次互动',   'Last Interaction',  '上周五电话沟通',  'text', 3),
  ((select id from prompts where slug = 'sales-follow-up-email'), 'product_service',   '产品/服务',  'Product/Service',   'ERP 系统',       'text', 4),
  ((select id from prompts where slug = 'sales-follow-up-email'), 'follow_up_purpose', '跟进目的',   'Follow-up Purpose', '确认是否需要安排产品演示', 'textarea', 5),
  ((select id from prompts where slug = 'sales-follow-up-email'), 'language',          '语言',       'Language',          '中文',           'select', 6);

-- Social Media Content Calendar
insert into prompt_variables (prompt_id, key, label_zh, label_en, default_value, input_type, sort_order) values
  ((select id from prompts where slug = 'social-media-content-calendar'), 'brand_name',       '品牌名称',   'Brand Name',        'My Brand',               'text', 1),
  ((select id from prompts where slug = 'social-media-content-calendar'), 'industry',         '行业',       'Industry',          '科技教育',              'text', 2),
  ((select id from prompts where slug = 'social-media-content-calendar'), 'target_audience',  '目标受众',   'Target Audience',   '25-45岁中小企业老板',    'text', 3),
  ((select id from prompts where slug = 'social-media-content-calendar'), 'brand_tone',       '品牌调性',   'Brand Tone',        '专业、亲切、实用',       'text', 4),
  ((select id from prompts where slug = 'social-media-content-calendar'), 'platforms',        '平台',       'Platforms',         'Facebook, Instagram, LinkedIn', 'text', 5),
  ((select id from prompts where slug = 'social-media-content-calendar'), 'language',         '语言',       'Language',          '中文为主，英文为辅',     'select', 6);

-- Ad Copy Generator
insert into prompt_variables (prompt_id, key, label_zh, label_en, default_value, input_type, sort_order) values
  ((select id from prompts where slug = 'ad-copy-generator'), 'product_name',     '产品名称',   'Product Name',      'Vibe Coding Workshop',  'text', 1),
  ((select id from prompts where slug = 'ad-copy-generator'), 'usp',              '核心卖点',   'USP',               '零基础2天学会用AI开发软件', 'text', 2),
  ((select id from prompts where slug = 'ad-copy-generator'), 'target_audience',  '目标受众',   'Target Audience',   '中小企业老板',            'text', 3),
  ((select id from prompts where slug = 'ad-copy-generator'), 'promotion',        '促销信息',   'Promotion',         '早鸟价 RM 997（原价 RM 1,997）', 'text', 4),
  ((select id from prompts where slug = 'ad-copy-generator'), 'ad_platform',      '广告平台',   'Ad Platform',       'Facebook',              'select', 5),
  ((select id from prompts where slug = 'ad-copy-generator'), 'language',         '语言',       'Language',          '中文',                   'select', 6);

-- Expense Report Analyzer
insert into prompt_variables (prompt_id, key, label_zh, label_en, default_value, input_type, sort_order) values
  ((select id from prompts where slug = 'expense-report-analyzer'), 'company_name',    '公司名称',   'Company Name',    'My Company Sdn Bhd', 'text', 1),
  ((select id from prompts where slug = 'expense-report-analyzer'), 'report_period',   '报告期间',   'Report Period',   '2024年3月',           'text', 2),
  ((select id from prompts where slug = 'expense-report-analyzer'), 'currency',        '货币',       'Currency',        'MYR',                'select', 3),
  ((select id from prompts where slug = 'expense-report-analyzer'), 'expense_data',    '费用数据',   'Expense Data',    '日期,类别,描述,金额\n2024-03-01,办公,文具,150\n2024-03-02,交通,Grab,45\n2024-03-03,餐饮,客户午餐,280', 'textarea', 4);

-- SOP Builder
insert into prompt_variables (prompt_id, key, label_zh, label_en, default_value, input_type, sort_order) values
  ((select id from prompts where slug = 'sop-builder'), 'process_name',        '流程名称',   'Process Name',       '新员工入职流程',     'text', 1),
  ((select id from prompts where slug = 'sop-builder'), 'department',          '部门',       'Department',         '人力资源部',         'text', 2),
  ((select id from prompts where slug = 'sop-builder'), 'owner',               '负责人',     'Owner',              'HR 经理',            'text', 3),
  ((select id from prompts where slug = 'sop-builder'), 'process_description', '流程描述',   'Process Description', '从收到入职通知到员工正式上班第一天的所有准备工作', 'textarea', 4);

-- Meeting Minutes Generator
insert into prompt_variables (prompt_id, key, label_zh, label_en, default_value, input_type, sort_order) values
  ((select id from prompts where slug = 'meeting-minutes-generator'), 'meeting_topic',   '会议主题',   'Meeting Topic',   '月度销售回顾',        'text', 1),
  ((select id from prompts where slug = 'meeting-minutes-generator'), 'meeting_date',    '日期',       'Date',            '2024-03-15',         'text', 2),
  ((select id from prompts where slug = 'meeting-minutes-generator'), 'participants',    '参与者',     'Participants',    '张总、李经理、王主管', 'text', 3),
  ((select id from prompts where slug = 'meeting-minutes-generator'), 'meeting_content', '会议内容',   'Meeting Content', '在此粘贴会议录音转文字内容...', 'textarea', 4);

-- FAQ Generator
insert into prompt_variables (prompt_id, key, label_zh, label_en, default_value, input_type, sort_order) values
  ((select id from prompts where slug = 'faq-generator'), 'product_name',        '产品名称',   'Product Name',        'Vibe Coding Workshop', 'text', 1),
  ((select id from prompts where slug = 'faq-generator'), 'product_description', '产品描述',   'Product Description',  '为中小企业老板设计的AI编程工作坊', 'textarea', 2),
  ((select id from prompts where slug = 'faq-generator'), 'price_range',         '价格范围',   'Price Range',          'RM 997 - RM 1,997',   'text', 3),
  ((select id from prompts where slug = 'faq-generator'), 'target_customer',     '目标客户',   'Target Customer',      '马来西亚中小企业老板', 'text', 4),
  ((select id from prompts where slug = 'faq-generator'), 'faq_count',           '问题数量',   'FAQ Count',            '15',                  'number', 5),
  ((select id from prompts where slug = 'faq-generator'), 'language',            '语言',       'Language',             '中文',                'select', 6);

-- Job Description Generator
insert into prompt_variables (prompt_id, key, label_zh, label_en, default_value, input_type, sort_order) values
  ((select id from prompts where slug = 'job-description-generator'), 'job_title',     '职位名称',   'Job Title',     'Digital Marketing Executive',  'text', 1),
  ((select id from prompts where slug = 'job-description-generator'), 'department',    '部门',       'Department',    '市场部',                       'text', 2),
  ((select id from prompts where slug = 'job-description-generator'), 'report_to',     '汇报对象',   'Report To',     '市场总监',                     'text', 3),
  ((select id from prompts where slug = 'job-description-generator'), 'location',      '工作地点',   'Location',      'Kuala Lumpur',                'text', 4),
  ((select id from prompts where slug = 'job-description-generator'), 'job_type',      '工作类型',   'Job Type',      '全职',                         'select', 5),
  ((select id from prompts where slug = 'job-description-generator'), 'company_name',  '公司名称',   'Company Name',  'My Company Sdn Bhd',              'text', 6),
  ((select id from prompts where slug = 'job-description-generator'), 'industry',      '行业',       'Industry',      '科技教育',                     'text', 7),
  ((select id from prompts where slug = 'job-description-generator'), 'salary_range',  '薪资范围',   'Salary Range',  'RM 4,000 - RM 6,000',        'text', 8),
  ((select id from prompts where slug = 'job-description-generator'), 'language',      '语言',       'Language',      '英文',                         'select', 9);

-- Dashboard Builder
insert into prompt_variables (prompt_id, key, label_zh, label_en, default_value, input_type, sort_order) values
  ((select id from prompts where slug = 'dashboard-builder'), 'dashboard_name',    '仪表盘名称', 'Dashboard Name',    '销售业绩仪表盘',     'text', 1),
  ((select id from prompts where slug = 'dashboard-builder'), 'dashboard_purpose', '用途',       'Purpose',           '追踪月度销售目标和团队表现', 'text', 2),
  ((select id from prompts where slug = 'dashboard-builder'), 'dashboard_users',   '使用者',     'Users',             '销售总监、区域经理', 'text', 3),
  ((select id from prompts where slug = 'dashboard-builder'), 'metrics',           '数据指标',   'Metrics',           '月销售额、订单数、客单价、转化率、团队排名', 'textarea', 4),
  ((select id from prompts where slug = 'dashboard-builder'), 'color_scheme',      '配色方案',   'Color Scheme',      '深色主题，蓝色为主色调', 'text', 5);

-- CSV Data Cleaner
insert into prompt_variables (prompt_id, key, label_zh, label_en, default_value, input_type, sort_order) values
  ((select id from prompts where slug = 'csv-data-cleaner'), 'file_name',              '文件名',     'File Name',              'sales_data.csv',        'text', 1),
  ((select id from prompts where slug = 'csv-data-cleaner'), 'data_description',       '数据描述',   'Data Description',        '2024年销售交易记录',     'text', 2),
  ((select id from prompts where slug = 'csv-data-cleaner'), 'column_names',           '列名',       'Column Names',            '日期,客户名,产品,数量,单价,总额', 'text', 3),
  ((select id from prompts where slug = 'csv-data-cleaner'), 'row_count',              '数据量',     'Row Count',               '5000',                  'number', 4),
  ((select id from prompts where slug = 'csv-data-cleaner'), 'cleaning_requirements',  '清洗需求',   'Cleaning Requirements',    '1. 统一日期格式\n2. 去除重复订单\n3. 填充缺失客户名\n4. 单价异常值处理', 'textarea', 5);

-- Landing Page Generator
insert into prompt_variables (prompt_id, key, label_zh, label_en, default_value, input_type, sort_order) values
  ((select id from prompts where slug = 'landing-page-generator'), 'product_name',     '产品名称',   'Product Name',      'Vibe Coding Workshop',       'text', 1),
  ((select id from prompts where slug = 'landing-page-generator'), 'tagline',          '一句话描述', 'Tagline',            '零基础，2天学会用AI开发软件',  'text', 2),
  ((select id from prompts where slug = 'landing-page-generator'), 'key_benefits',     '核心卖点',   'Key Benefits',       '1. 无需编程经验\n2. 实战项目驱动\n3. 小班教学（限20人）', 'textarea', 3),
  ((select id from prompts where slug = 'landing-page-generator'), 'target_audience',  '目标受众',   'Target Audience',    '马来西亚中小企业老板',         'text', 4),
  ((select id from prompts where slug = 'landing-page-generator'), 'cta_text',         'CTA 按钮',   'CTA Text',           '立即报名',                    'text', 5),
  ((select id from prompts where slug = 'landing-page-generator'), 'cta_link',         'CTA 链接',   'CTA Link',           'https://bigai.my/register',   'text', 6),
  ((select id from prompts where slug = 'landing-page-generator'), 'pricing',          '价格',       'Pricing',            '早鸟价 RM 997（原价 RM 1,997）', 'text', 7),
  ((select id from prompts where slug = 'landing-page-generator'), 'contact_info',     '联系方式',   'Contact Info',       'WhatsApp: +60 12-345 6789',   'text', 8),
  ((select id from prompts where slug = 'landing-page-generator'), 'color_scheme',     '配色方案',   'Color Scheme',       '黄色为主色调，深色背景',       'text', 9);

-- ============================================================
-- Prompt Tags
-- ============================================================
insert into prompt_tags (prompt_id, tag_id) values
  ((select id from prompts where slug = 'pdf-quotation-generator'),       (select id from tags where slug = 'pdf')),
  ((select id from prompts where slug = 'pdf-quotation-generator'),       (select id from tags where slug = 'cursor')),
  ((select id from prompts where slug = 'pdf-quotation-generator'),       (select id from tags where slug = 'template-gen')),
  ((select id from prompts where slug = 'sales-follow-up-email'),         (select id from tags where slug = 'email')),
  ((select id from prompts where slug = 'social-media-content-calendar'), (select id from tags where slug = 'social-media')),
  ((select id from prompts where slug = 'ad-copy-generator'),             (select id from tags where slug = 'social-media')),
  ((select id from prompts where slug = 'dashboard-builder'),             (select id from tags where slug = 'dashboard')),
  ((select id from prompts where slug = 'dashboard-builder'),             (select id from tags where slug = 'cursor')),
  ((select id from prompts where slug = 'csv-data-cleaner'),              (select id from tags where slug = 'data-processing')),
  ((select id from prompts where slug = 'landing-page-generator'),        (select id from tags where slug = 'cursor')),
  ((select id from prompts where slug = 'landing-page-generator'),        (select id from tags where slug = 'v0'));

-- ============================================================
-- Related Prompts
-- ============================================================
insert into related_prompts (prompt_id, related_id, sort_order) values
  ((select id from prompts where slug = 'pdf-quotation-generator'),       (select id from prompts where slug = 'sales-follow-up-email'),         1),
  ((select id from prompts where slug = 'pdf-quotation-generator'),       (select id from prompts where slug = 'expense-report-analyzer'),       2),
  ((select id from prompts where slug = 'sales-follow-up-email'),         (select id from prompts where slug = 'pdf-quotation-generator'),       1),
  ((select id from prompts where slug = 'social-media-content-calendar'), (select id from prompts where slug = 'ad-copy-generator'),             1),
  ((select id from prompts where slug = 'ad-copy-generator'),             (select id from prompts where slug = 'social-media-content-calendar'), 1),
  ((select id from prompts where slug = 'dashboard-builder'),             (select id from prompts where slug = 'csv-data-cleaner'),              1),
  ((select id from prompts where slug = 'csv-data-cleaner'),              (select id from prompts where slug = 'dashboard-builder'),             1),
  ((select id from prompts where slug = 'landing-page-generator'),        (select id from prompts where slug = 'ad-copy-generator'),             1);

-- ============================================================
-- Prompt Industries
-- ============================================================
insert into prompt_industries (prompt_id, industry_id) values
  -- PDF Quotation: general, services, manufacturing
  ((select id from prompts where slug = 'pdf-quotation-generator'), (select id from industries where slug = 'general')),
  ((select id from prompts where slug = 'pdf-quotation-generator'), (select id from industries where slug = 'services')),
  ((select id from prompts where slug = 'pdf-quotation-generator'), (select id from industries where slug = 'manufacturing')),
  -- Sales Follow-up: general
  ((select id from prompts where slug = 'sales-follow-up-email'), (select id from industries where slug = 'general')),
  -- Social Media: general, retail, fnb, ecommerce
  ((select id from prompts where slug = 'social-media-content-calendar'), (select id from industries where slug = 'general')),
  ((select id from prompts where slug = 'social-media-content-calendar'), (select id from industries where slug = 'retail')),
  ((select id from prompts where slug = 'social-media-content-calendar'), (select id from industries where slug = 'fnb')),
  ((select id from prompts where slug = 'social-media-content-calendar'), (select id from industries where slug = 'ecommerce')),
  -- Ad Copy: general, ecommerce, retail
  ((select id from prompts where slug = 'ad-copy-generator'), (select id from industries where slug = 'general')),
  ((select id from prompts where slug = 'ad-copy-generator'), (select id from industries where slug = 'ecommerce')),
  ((select id from prompts where slug = 'ad-copy-generator'), (select id from industries where slug = 'retail')),
  -- Expense Report: general
  ((select id from prompts where slug = 'expense-report-analyzer'), (select id from industries where slug = 'general')),
  -- SOP: general, manufacturing, services
  ((select id from prompts where slug = 'sop-builder'), (select id from industries where slug = 'general')),
  ((select id from prompts where slug = 'sop-builder'), (select id from industries where slug = 'manufacturing')),
  ((select id from prompts where slug = 'sop-builder'), (select id from industries where slug = 'services')),
  -- Meeting Minutes: general
  ((select id from prompts where slug = 'meeting-minutes-generator'), (select id from industries where slug = 'general')),
  -- FAQ: general, ecommerce, services
  ((select id from prompts where slug = 'faq-generator'), (select id from industries where slug = 'general')),
  ((select id from prompts where slug = 'faq-generator'), (select id from industries where slug = 'ecommerce')),
  ((select id from prompts where slug = 'faq-generator'), (select id from industries where slug = 'services')),
  -- Job Description: general
  ((select id from prompts where slug = 'job-description-generator'), (select id from industries where slug = 'general')),
  -- Dashboard: general, technology
  ((select id from prompts where slug = 'dashboard-builder'), (select id from industries where slug = 'general')),
  ((select id from prompts where slug = 'dashboard-builder'), (select id from industries where slug = 'technology')),
  -- CSV Cleaner: general
  ((select id from prompts where slug = 'csv-data-cleaner'), (select id from industries where slug = 'general')),
  -- Landing Page: general, ecommerce, technology
  ((select id from prompts where slug = 'landing-page-generator'), (select id from industries where slug = 'general')),
  ((select id from prompts where slug = 'landing-page-generator'), (select id from industries where slug = 'ecommerce')),
  ((select id from prompts where slug = 'landing-page-generator'), (select id from industries where slug = 'technology'));
