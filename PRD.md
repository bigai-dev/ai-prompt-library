# PRD: AI Prompt Library for Workshop Students

**Owner:** Jay
**Audience:** Vibe Coding workshop students (Malaysian Chinese SME owners)
**Built with:** Claude Code
**Last updated:** 2026-04-08

---

## 1. Goal & Context

Build a web-based AI Prompt Library that workshop students can browse to copy proven, ready-to-use prompts for building real software with Vibe Coding (Cursor / v0 / Claude). Each prompt is a "template" with a clear use case, fillable variables, difficulty rating, and time estimate. Jay manages all content from an admin portal; students consume via a public catalog.

The product is an ongoing asset across multiple cohorts, not a one-off handout. It must be cheap to host, easy to update, and feel premium enough that students perceive it as the authoritative Vibe Coding source in Southeast Asia.

### Success metrics (first 90 days)
1. 100+ prompts published across 8+ categories
2. 70% of workshop attendees visit the library within 7 days of class
3. Average 5+ prompt copies per active student
4. Less than 5 minutes for Jay to publish a new prompt end to end

---

## 2. User Roles

| Role | Access | Capabilities |
|---|---|---|
| **Public / Student** | No login required for browsing | Browse, search, filter, copy prompts, mark favorites (stored in localStorage, no account needed) |
| **Admin (Jay + Reeve)** | Email + password via Supabase Auth | Full CRUD on prompts, categories, tags, variables. Publish / unpublish. View copy analytics. |

No student accounts in v1. Favorites live in localStorage. This keeps friction at zero and removes auth complexity.

---

## 3. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Jay's stack, SSR for SEO on public pages |
| Styling | Tailwind CSS + shadcn/ui | Matches reference design, fast to build |
| Backend / DB | Supabase (Postgres + Auth + Row Level Security) | Jay's stack, single source of truth |
| API | Next.js Route Handlers (REST) calling Supabase | API-driven as requested, allows future mobile / WhatsApp bot reuse |
| Hosting | Vercel | Jay's stack |
| Analytics | Supabase table `prompt_events` (lightweight, no third party) | Privacy-friendly, free |

---

## 4. Information Architecture

```
/                          → Landing / featured prompts
/library                   → Full catalog with filters
/library/[category-slug]   → Category page
/prompt/[slug]             → Prompt detail (the screen in the reference image)
/favorites                 → Local-only favorites view
/admin                     → Admin login
/admin/prompts             → Prompt list (admin)
/admin/prompts/new         → Create prompt
/admin/prompts/[id]/edit   → Edit prompt
/admin/categories          → Category manager
/admin/analytics           → Copy counts, popular prompts
```

---

## 5. Data Model (Supabase / Postgres)

### `categories`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | text unique | e.g. `sales`, `marketing`, `finance` |
| name_zh | text | Chinese display name |
| name_en | text | English display name |
| icon | text | Lucide icon name |
| sort_order | int | |
| created_at | timestamptz | |

### `prompts`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | text unique | URL slug |
| title_zh | text | e.g. 一键 PDF 报价生成器 |
| title_en | text | |
| subtitle | text | One-line description shown under title |
| category_id | uuid FK → categories | |
| difficulty | enum | `easy` / `medium` / `hard` |
| estimated_minutes | int | e.g. 10 |
| version | text | e.g. `v2.3` |
| prompt_body | text | The actual prompt content (markdown) |
| preview_image_url | text nullable | Optional final result preview (like the QUOTATION mock) |
| boss_tip | text nullable | The yellow "老板小贴士" callout |
| status | enum | `draft` / `published` |
| times_copied | int default 0 | |
| times_viewed | int default 0 | |
| rating | numeric default 0 | |
| ratings_count | int default 0 | |
| created_at, updated_at | timestamptz | |

### `prompt_variables`
The blue fillable variables shown at the bottom of the reference screen.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| prompt_id | uuid FK → prompts | cascade delete |
| key | text | e.g. `company_name`, must match `{company_name}` token in prompt_body |
| label_zh | text | e.g. 公司名称 |
| label_en | text | |
| default_value | text | e.g. `Annex Creative Sdn Bhd` |
| input_type | enum | `text` / `number` / `select` / `textarea` |
| options | jsonb nullable | For `select` type |
| sort_order | int | |

### `prompt_tags` and `tags`
Standard many to many for free-form tags beyond category.

### `related_prompts`
| Column | Type |
|---|---|
| prompt_id | uuid FK |
| related_id | uuid FK |
| sort_order | int |

PK is composite (`prompt_id`, `related_id`).

### `prompt_events` (analytics)
| Column | Type | Notes |
|---|---|---|
| id | bigserial PK | |
| prompt_id | uuid FK | |
| event_type | enum | `view` / `copy` / `favorite` |
| anon_id | text | localStorage UUID, no PII |
| created_at | timestamptz | |

### Row Level Security
- `categories`, `prompts` (status = published), `prompt_variables`, `tags`, `related_prompts`: public SELECT
- All write operations: only authenticated users where `auth.users.email` is in an `admins` allowlist table
- `prompt_events`: public INSERT, admin SELECT only

---

## 6. API Endpoints

All routes under `/api/v1`. JSON in, JSON out. Admin routes protected by Supabase JWT middleware.

### Public

| Method | Path | Purpose |
|---|---|---|
| GET | `/categories` | List all categories |
| GET | `/prompts` | List published prompts. Query params: `category`, `difficulty`, `q` (search), `tag`, `limit`, `offset`, `sort` (`popular` / `recent` / `rating`) |
| GET | `/prompts/:slug` | Prompt detail including variables and related prompts |
| POST | `/prompts/:id/copy` | Increment copy counter, log event |
| POST | `/prompts/:id/view` | Increment view counter, log event |
| POST | `/prompts/:id/rate` | Body `{ rating: 1..5, anon_id }`. One rating per anon_id per prompt |

### Admin

| Method | Path | Purpose |
|---|---|---|
| POST | `/admin/prompts` | Create |
| PATCH | `/admin/prompts/:id` | Update |
| DELETE | `/admin/prompts/:id` | Delete |
| POST | `/admin/prompts/:id/publish` | Toggle status |
| POST | `/admin/categories` | Create category |
| PATCH | `/admin/categories/:id` | Update |
| GET | `/admin/analytics/overview` | Top prompts, total copies, daily trend |

Search uses Postgres full text search on `title_zh`, `title_en`, `subtitle`, `prompt_body`. For Chinese, use the `simple` config or `pg_jieba` if available; fall back to `ILIKE %q%` for v1 to keep it simple.

---

## 7. Public UI Specifications

### 7.1 Landing page (`/`)
- Hero: "Vibe Coding · Learning Hub · 学员专属 · 持续更新"
- Featured prompts grid (6 cards)
- Category tiles (icon + name + count)
- Search bar prominent at top
- CTA: "进入完整模板库 →"

### 7.2 Library page (`/library`)
- Left sidebar: category filter, difficulty filter (Easy / Medium / Hard), tag chips
- Top bar: search, sort dropdown (Popular / Newest / Highest rated), result count
- Card grid (3 columns desktop, 1 mobile). Each card shows:
  - Title (zh primary)
  - Subtitle
  - Category pill
  - Difficulty dot + estimated minutes
  - Version + students-used count
  - Star rating
- Pagination or infinite scroll
- Favorite heart icon top-right of each card (toggles localStorage)

### 7.3 Prompt detail page (`/prompt/[slug]`)
This is the screen in the reference image. Layout:

**Top bar:** breadcrumb (`全部模板 / 销售 / 一键 PDF 报价生成器`) + Favorite + "复制 Prompt" button (primary, top-right)

**Title block:**
- Title (zh), subtitle
- Pill row: difficulty, estimated minutes, version, students-used count, rating

**Two-column body (desktop):**

Left column (60%):
- "最终效果预览" preview card with `preview_image_url`
- "PROMPT 内容" dark code block. The prompt body renders with `{variable}` tokens highlighted in red and replaced live as the student fills variables below. Word count badge top-right.
- "需要填写的变量" grid of input fields, 2 columns. Each field shows label + input pre-filled with default value. Editing updates the prompt body in real time. Reset button.

Right column (40%):
- "使用步骤" numbered list (4 steps): Copy prompt → Fill variables → Paste into Vibe Coding → Deploy
- "老板小贴士" yellow callout
- "相关模板" list of 3 related prompts as compact cards

**Copy button behavior:**
- Copies the prompt body with variables already substituted
- Fires `POST /prompts/:id/copy`
- Toast: "已复制到剪贴板 ✓"

### 7.4 Favorites page (`/favorites`)
- Reads from localStorage key `prompt_library_favorites`
- Renders same card grid as `/library`
- Empty state with CTA back to library

### 7.5 Design tokens
- Colors: white background, slate text, yellow accent (#FCD34D) matching the lightning bolt logo, dark navy (#0F172A) for prompt code blocks
- Typography: Inter for Latin, Noto Sans SC for Chinese
- Rounded corners 12px on cards, 8px on buttons
- Subtle shadow on cards
- Responsive: mobile-first, breakpoints at 768 and 1024

---

## 8. Admin Portal Specifications

### 8.1 Login (`/admin`)
Supabase Auth email + password. Redirect to `/admin/prompts` on success.

### 8.2 Prompt list (`/admin/prompts`)
- Table: Title, Category, Difficulty, Status, Copies, Updated, Actions
- Filters: status, category, search
- Bulk publish / unpublish
- "New Prompt" button top-right

### 8.3 Prompt editor (`/admin/prompts/new` and `/[id]/edit`)
Two-column layout. Left: form. Right: live preview of the public prompt page.

Form fields:
1. Title (zh, en)
2. Slug (auto-generated from title, editable)
3. Subtitle
4. Category (select)
5. Tags (multi-select with create-new)
6. Difficulty (radio)
7. Estimated minutes (number)
8. Version (text)
9. Preview image (Supabase Storage upload)
10. Prompt body (markdown editor with syntax highlighting). Variable tokens wrapped in `{curly_braces}` are auto-detected and added to the variables section below.
11. Variables table (auto-populated from detected tokens):
    - Key (locked, from token)
    - Label zh / en
    - Default value
    - Input type
    - Sort order
    - Add row manually
12. Boss tip (textarea)
13. Related prompts (multi-select from existing prompts)
14. Status: Draft / Published

Save button is sticky bottom. Auto-save draft every 30 seconds.

### 8.4 Categories manager (`/admin/categories`)
Simple CRUD table. Drag-to-reorder for sort_order.

### 8.5 Analytics (`/admin/analytics`)
- Total views, total copies, total favorites (last 30 days)
- Top 10 prompts by copies
- Daily copy trend chart (last 30 days)
- Category distribution pie

---

## 9. Variable Substitution Logic

The prompt body uses `{key}` tokens. The frontend:

1. Parses prompt body for all `{[a-z_]+}` matches
2. Looks up each key in the prompt's variables array
3. Replaces tokens with current input values
4. Renders the result in the dark code block
5. Unmatched tokens stay highlighted red as a warning

The admin editor runs the same parser to auto-create variable rows when Jay types a new token in the body.

---

## 10. Seed Data

On first deploy, seed:
- 8 categories: 销售 (Sales), 营销 (Marketing), 财务 (Finance), 运营 (Operations), 客服 (Customer Service), 人事 (HR), 数据分析 (Data), 工具 (Utilities)
- 12 starter prompts across categories, including the PDF Quotation Generator from the reference image
- 1 admin user (Jay's email)

---

## 11. Out of Scope (v1)

- Student accounts and cloud-synced favorites
- Student prompt submissions
- Comments / reviews beyond star ratings
- Multi-language UI toggle (zh-only for v1, schema supports en for later)
- AI-powered prompt search (semantic / embeddings)
- Prompt versioning history
- Webhook integrations to n8n / Make
- WhatsApp bot frontend (planned for v2 reusing the API)

---

## 12. Build Order for Claude Code

Suggested implementation sequence so Claude Code can ship incrementally:

1. **Init project:** Next.js 14 + TypeScript + Tailwind + shadcn/ui, Supabase client setup, env vars
2. **Database:** Supabase migrations for all tables, RLS policies, seed script
3. **Public API routes:** categories, prompts list, prompt detail, copy/view/rate endpoints
4. **Public pages:** Landing, library with filters, prompt detail with variable substitution, favorites
5. **Admin auth:** Supabase Auth middleware, login page, allowlist check
6. **Admin pages:** Prompt list, prompt editor with auto-variable detection, categories manager
7. **Analytics:** Events table queries, admin dashboard
8. **Polish:** Loading states, empty states, error boundaries, mobile responsiveness, SEO meta tags
9. **Seed and deploy:** Push seed data, deploy to Vercel, smoke test

---

## 13. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
ADMIN_EMAIL_ALLOWLIST=jay@example.com,reeve@example.com
```

---

## 14. Acceptance Criteria

The build is done when:
- [ ] A student can land on `/`, browse `/library`, filter by category and difficulty, search, open a prompt, fill variables, copy the substituted prompt with one click
- [ ] Favorites persist across browser sessions
- [ ] Jay can log in to `/admin`, create a new prompt with variables, preview it, publish it, and see it appear on `/library` within seconds
- [ ] Auto-variable detection works when typing `{new_var}` in the editor
- [ ] Analytics dashboard shows real copy counts after a student copies a prompt
- [ ] Site loads under 2 seconds on 4G mobile in Malaysia
- [ ] All public pages are SEO-indexable and mobile-responsive
- [ ] RLS prevents non-admins from writing to any table