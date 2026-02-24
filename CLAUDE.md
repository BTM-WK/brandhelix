# BrandHelix — AI Brand Marketing Channel Builder

## Project Overview
BrandHelix는 기업의 브랜드 정보를 입력하면 AI가 Brand DNA를 분석하고,
**판매사이트 · 블로그 · 인스타그램 · 틱톡/숏츠**를 일관된 브랜드 아이덴티티로
자동 생성하는 **B2B 마케팅 자동화 SaaS 플랫폼**이다.

- **Owner:** WK Marketing Group (WK마케팅그룹)
- **Design Doc:** https://www.notion.so/3111b1e4a4eb81e481e6f9a95a6489c9

---

## Tech Stack (STRICT — do not change without approval)
| Layer       | Technology                              | Note                          |
|-------------|----------------------------------------|-------------------------------|
| Frontend    | Next.js 14+ (App Router)               | TypeScript only               |
| Styling     | Tailwind CSS + shadcn/ui               | No other CSS framework        |
| State       | Zustand                                | No Redux, no Jotai            |
| Backend     | Next.js API Routes (Serverless)        | No separate server            |
| Database    | Supabase (PostgreSQL)                  | RLS on all tables             |
| Auth        | Supabase Auth                          | Magic link + Social           |
| AI          | Claude API (Sonnet 4.5 + Haiku 4.5)   | 2-phase generation            |
| Image Gen   | Satori + Sharp                         | React → SVG → PNG             |
| Crawling    | Playwright (headless Chromium)         | Screenshots + DOM analysis    |
| Storage     | Cloudflare R2                          | S3-compatible, free egress    |
| Site Host   | Cloudflare Pages                       | Static sites, free            |
| Deploy      | Vercel                                 | Serverless, auto-scale        |
| Queue       | Vercel KV (Redis)                      | Job queue + cache             |
| Cron        | Vercel Cron Jobs                       | Scheduled publishing          |
| Monitoring  | Sentry + PostHog                       | Error tracking + analytics    |

---

## Directory Structure
```
brandhelix/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # login, signup, forgot-password
│   │   ├── (dashboard)/             # Protected routes
│   │   │   ├── projects/            # Project list
│   │   │   └── project/[id]/        # Single project
│   │   │       ├── brand-dna/       # DNA wizard + report
│   │   │       ├── site/            # Sales site builder
│   │   │       ├── blog/            # Blog content
│   │   │       ├── instagram/       # Instagram content
│   │   │       ├── shortform/       # TikTok/Shorts
│   │   │       ├── style/           # Style settings
│   │   │       └── analytics/       # Usage & reports
│   │   ├── api/                     # API Routes
│   │   │   ├── auth/
│   │   │   ├── projects/
│   │   │   ├── brand-dna/
│   │   │   ├── generate/
│   │   │   ├── contents/
│   │   │   ├── deploy/
│   │   │   ├── images/
│   │   │   └── styles/
│   │   └── preview/[id]/            # Generated site preview
│   │
│   ├── engines/                     # Core business logic
│   │   ├── brand-dna/               # Engine 1
│   │   │   ├── collector/           # Form + crawling + search
│   │   │   ├── analyzer/            # Visual/verbal/competitor
│   │   │   └── profile-builder.ts   # Combine into 8-Layer
│   │   ├── content/                 # Engine 2
│   │   │   ├── generators/          # Per-channel generators
│   │   │   ├── style-engine/        # 8 copy styles
│   │   │   ├── prompt-engine/       # Prompt assembly + cache
│   │   │   └── quality-checker.ts   # Auto QA
│   │   ├── channel-builder/         # Engine 3
│   │   │   ├── site-builder/        # Templates + components + tokens
│   │   │   ├── blog-builder/
│   │   │   ├── instagram-builder/
│   │   │   └── shortform-builder/
│   │   └── deployer/                # Engine 4
│   │       ├── site-deployer.ts     # CF Pages deploy
│   │       ├── content-scheduler.ts # Cron-based publishing
│   │       └── domain-manager.ts    # Custom domains
│   │
│   ├── lib/                         # Shared utilities
│   │   ├── supabase/                # Client + server + admin
│   │   ├── claude/                  # API wrapper + token tracking + cache
│   │   ├── cloudflare/              # R2 + Pages API
│   │   ├── crawler/                 # Playwright helpers
│   │   ├── image/                   # Satori + Sharp pipeline
│   │   └── utils/                   # Color extraction, font detect, etc.
│   │
│   ├── components/                  # Shared UI components
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── layout/                  # Dashboard layout, sidebar
│   │   ├── brand-dna/               # DNA-specific components
│   │   └── content/                 # Content preview components
│   │
│   └── types/                       # Global TypeScript types
│       ├── brand-dna.ts
│       ├── content.ts
│       ├── project.ts
│       └── style.ts
│
├── supabase/
│   └── migrations/                  # SQL migrations (ordered)
├── public/
├── tests/
├── docs/                            # Phase instructions
│   └── phases/
├── .env.local.example
├── CLAUDE.md                        # THIS FILE
└── package.json
```

---

## Database Schema (Supabase PostgreSQL)

### Core Tables
```sql
-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','basic','pro','enterprise')),
  api_usage_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  website_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','dna_collecting','dna_complete','generating','active','paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand DNA (8-Layer JSONB)
CREATE TABLE public.brand_dna (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects UNIQUE NOT NULL,
  layers JSONB NOT NULL DEFAULT '{}',
  -- layers keys: company_identity, brand_core, target_audience,
  --   visual_identity, verbal_identity, competitive_position,
  --   channel_strategy, creative_style
  completeness_score INTEGER DEFAULT 0, -- 0-100
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crawl Results
CREATE TABLE public.crawl_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects NOT NULL,
  type TEXT NOT NULL, -- 'website','sns','blog','news','competitor'
  raw_data JSONB,
  analysis JSONB,
  crawled_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Contents
CREATE TABLE public.generated_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects NOT NULL,
  channel TEXT NOT NULL, -- 'site','blog','instagram','shortform'
  content_type TEXT NOT NULL,
  title TEXT,
  body JSONB NOT NULL,
  images TEXT[], -- R2 URLs
  copy_style TEXT, -- ogilvy, burnett, etc.
  design_tone TEXT, -- modern_minimal, etc.
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','approved','scheduled','published')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  tokens_used INTEGER DEFAULT 0,
  generation_cost NUMERIC(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Sites
CREATE TABLE public.generated_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects UNIQUE NOT NULL,
  pages JSONB NOT NULL, -- {page_name: {components, copy, images}}
  design_tokens JSONB, -- CSS custom properties
  template TEXT,
  deploy_url TEXT,
  custom_domain TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Usage Logs
CREATE TABLE public.api_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users NOT NULL,
  project_id UUID REFERENCES public.projects,
  model TEXT NOT NULL,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  cost NUMERIC(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt Cache
CREATE TABLE public.prompt_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  prompt_hash TEXT NOT NULL,
  response JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policy (ALL tables)
```sql
ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own data"
  ON public.{table} FOR ALL
  USING (user_id = auth.uid());
```

---

## 4 Core Engines

### Engine 1: Brand DNA Collector
**Pipeline:** User Input (3-step wizard) → Auto Crawl (parallel: web + SNS + blog + competitor) → AI Analysis (Claude Sonnet → 8-Layer JSON) → Profile Combine → User Review

**8 Layers:** company_identity, brand_core, target_audience, visual_identity, verbal_identity, competitive_position, channel_strategy, creative_style

### Engine 2: Content Generator
**Prompt Structure:**
- System: role + copy_style_preset + channel_rules + quality_criteria + forbidden_words
- Brand Context: 8-Layer JSON (relevant layers only)
- Task: channel + type + keywords + product + output_format

**2-Phase Generation:**
- Phase 1: Haiku (fast draft, structure)
- Phase 2: Sonnet (quality up, tone refinement)

**Quality Check:** length, keyword_density, forbidden_words, CTA_present, tone_match → retry max 2x

### Engine 3: Channel Builder
- **Site:** Template match → Design tokens → Component assembly → Copy insert → Image placement → Static Export
- **Blog:** Markdown → HTML + thumbnail (Satori)
- **Instagram:** React component → Satori (SVG) → Sharp (PNG 1080×1350) → R2
- **Shortform:** Script + subtitle text + image sequence + thumbnail

### Engine 4: Deployer
- **Site Deploy:** Static Export → Cloudflare Pages API → {id}.brandhelix.pages.dev
- **Scheduling:** Vercel Cron (hourly) → publish approved content
- **Domain:** CNAME-based custom domain

---

## Copy Styles (8 types)
| ID                | Name               | Traits                           |
|-------------------|--------------------|----------------------------------|
| ogilvy            | David Ogilvy       | Facts + numbers, long copy OK    |
| burnett           | Leo Burnett        | Everyday stories, warm, honest   |
| bernbach          | Bill Bernbach      | Unexpected twist, short impact   |
| clow              | Lee Clow           | Manifesto, bold, inspirational   |
| lee_jeseok        | 이제석 스타일         | One line + one visual = complete |
| brunch_essay      | 브런치 에세이          | Poetic, short/long mix, tasteful |
| kurly             | 마켓컬리 스타일        | Sensory details, origin stories  |
| editorial         | 무신사/29CM 에디토리얼  | Cool, English mix, minimal adj   |

## Design Tones (6 types)
| ID                | Name               | Color Scheme                     |
|-------------------|--------------------|----------------------------------|
| modern_minimal    | 모던 미니멀           | Monochrome + 1 accent            |
| natural_organic   | 내추럴 오가닉          | Earth tones, cream BG            |
| clinical_science  | 클리니컬 사이언스       | White + blue/green point         |
| premium_luxury    | 프리미엄 럭셔리        | Dark + gold/rose gold            |
| friendly_casual   | 친근 캐주얼           | Bright multi-color, pastel       |
| bold_energetic    | 볼드 에너제틱          | High-contrast, neon              |

---

## Coding Conventions
- **Language:** TypeScript ONLY (strict mode)
- **Components:** React Server Components by default, 'use client' only when needed
- **Naming:** camelCase for variables/functions, PascalCase for components/types
- **Files:** kebab-case for files/folders
- **Imports:** Use `@/` path alias (= src/)
- **Error Handling:** try-catch with proper error types, never silent catch
- **API Responses:** Always return `{ data, error }` pattern
- **Environment:** Use .env.local, never hardcode secrets
- **Comments:** Korean OK for business logic, English for technical comments
- **Testing:** Vitest for unit, Playwright for E2E

---

## Git Workflow

### Branch Strategy (Simplified Git Flow)
```
main          ← 배포용 (항상 안정, PR merge만 허용)
├── develop   ← 개발 통합 브랜치
│   ├── feature/phase1-session1   ← 세션별 피처 브랜치
│   ├── feature/phase1-session2
│   └── feature/phase2-session1
└── hotfix/*  ← 긴급 수정 (main에서 분기 → main+develop 동시 merge)
```

### Session별 작업 흐름
```bash
# 1. 새 세션 시작 시
git checkout develop
git pull origin develop
git checkout -b feature/phase1-session1

# 2. 작업 중 (자주 커밋)
git add .
git commit -m "feat: Brand DNA wizard Step 1 폼 구현"

# 3. 세션 완료 시
git checkout develop
git merge feature/phase1-session1
git push origin develop

# 4. Phase 완료 시 (안정 확인 후)
git checkout main
git merge develop
git push origin main
git tag v0.1.0  # Phase 1 완료 태그
```

### Commit Convention
| Prefix      | 용도                          | 예시                                    |
|-------------|-------------------------------|-----------------------------------------|
| `feat:`     | 새 기능                        | `feat: Brand DNA 8-Layer 프로필 생성`     |
| `fix:`      | 버그 수정                      | `fix: 크롤링 타임아웃 에러 처리`            |
| `docs:`     | 문서 변경                      | `docs: CLAUDE.md Git 섹션 추가`          |
| `refactor:` | 기능 변경 없는 코드 개선          | `refactor: Claude API 래퍼 모듈화`        |
| `style:`    | 코드 포맷팅 (기능 무관)          | `style: ESLint 자동 수정 적용`            |
| `chore:`    | 설정/빌드/의존성                 | `chore: Tailwind + shadcn/ui 초기 설정`  |
| `test:`     | 테스트 추가/수정                 | `test: Brand DNA API 유닛테스트 추가`      |

### 커밋 메시지 규칙
- 한글 OK (비즈니스 로직 설명에 효과적)
- 제목: 50자 이내, 현재형 (`추가한다` X → `추가` O)
- 본문(선택): 72자 줄바꿈, Why 중심 설명
- Phase/Session 참조: `feat: [P1-S1] 프로젝트 초기화 및 디렉토리 구조 생성`

### .gitignore (필수 항목)
```
node_modules/
.next/
.env.local
.env*.local
*.tsbuildinfo
.vercel
.turbo
coverage/
dist/
```

### GitHub Repository 초기 설정
```bash
# 프로젝트 루트에서
git init
git add .
git commit -m "chore: [P1-S1] BrandHelix 프로젝트 초기화"
git branch -M main
git remote add origin https://github.com/{username}/brandhelix.git
git push -u origin main
git checkout -b develop
git push -u origin develop
```

---

## Environment Variables (.env.local)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Claude API
ANTHROPIC_API_KEY=

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_PAGES_PROJECT=
CLOUDFLARE_API_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Current Status
- **Phase:** Not started (Phase 1: MVP planned)
- **Design:** Complete (see Notion doc above)
- **Next Action:** Initialize project, set up foundation

## Phase Instructions
See `docs/phases/` for detailed per-phase implementation guides.
