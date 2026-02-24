# Phase 1: MVP Foundation (Week 1–3)

> **Goal:** 프로젝트 초기화부터 Brand DNA 수집 + 콘텐츠 1건 생성까지 동작하는 최소 기능 완성
> **참조:** 반드시 프로젝트 루트의 `CLAUDE.md`를 먼저 읽고, Tech Stack / Directory Structure / DB Schema / Coding Conventions / Git Workflow를 따를 것.

---

## Session 1: 프로젝트 초기화 및 기반 구축

### 목표
Next.js 프로젝트 생성, 핵심 패키지 설치, 디렉토리 구조 세팅, 기본 라우팅 확인

### Step-by-Step

#### 1-1. Next.js 프로젝트 생성
```bash
npx create-next-app@latest brandhelix \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm
cd brandhelix
```

#### 1-2. 핵심 패키지 설치
```bash
# UI
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

# State
npm install zustand

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# AI
npm install @anthropic-ai/sdk

# Image
npm install satori sharp

# Utils
npm install zod date-fns nanoid

# Dev
npm install -D @types/node prettier eslint-config-prettier
```

#### 1-3. shadcn/ui 초기화
```bash
npx shadcn@latest init
# Style: Default, Color: Neutral, CSS variables: Yes

# 필수 컴포넌트 설치
npx shadcn@latest add button card input label textarea select tabs badge dialog sheet toast form separator avatar dropdown-menu progress skeleton
```

#### 1-4. 디렉토리 구조 생성
CLAUDE.md의 Directory Structure 섹션을 참조하여 다음 폴더를 모두 생성:
```
src/
├── app/(auth)/login/page.tsx
├── app/(auth)/signup/page.tsx
├── app/(dashboard)/projects/page.tsx
├── app/(dashboard)/project/[id]/page.tsx
├── app/(dashboard)/project/[id]/brand-dna/page.tsx
├── app/(dashboard)/project/[id]/site/page.tsx
├── app/(dashboard)/project/[id]/blog/page.tsx
├── app/(dashboard)/project/[id]/instagram/page.tsx
├── app/(dashboard)/project/[id]/shortform/page.tsx
├── app/(dashboard)/project/[id]/style/page.tsx
├── app/(dashboard)/project/[id]/analytics/page.tsx
├── app/(dashboard)/layout.tsx
├── app/api/auth/route.ts
├── app/api/projects/route.ts
├── app/api/brand-dna/route.ts
├── app/api/generate/route.ts
├── app/api/contents/route.ts
├── engines/brand-dna/collector/
├── engines/brand-dna/analyzer/
├── engines/brand-dna/profile-builder.ts
├── engines/content/generators/
├── engines/content/style-engine/
├── engines/content/prompt-engine/
├── engines/content/quality-checker.ts
├── engines/channel-builder/site-builder/
├── engines/channel-builder/blog-builder/
├── engines/channel-builder/instagram-builder/
├── engines/channel-builder/shortform-builder/
├── engines/deployer/site-deployer.ts
├── engines/deployer/content-scheduler.ts
├── engines/deployer/domain-manager.ts
├── lib/supabase/client.ts
├── lib/supabase/server.ts
├── lib/supabase/admin.ts
├── lib/claude/index.ts
├── lib/cloudflare/r2.ts
├── lib/cloudflare/pages.ts
├── lib/crawler/index.ts
├── lib/image/satori-pipeline.ts
├── lib/utils/index.ts
├── components/layout/dashboard-layout.tsx
├── components/layout/sidebar.tsx
├── components/layout/header.tsx
├── types/brand-dna.ts
├── types/content.ts
├── types/project.ts
├── types/style.ts
```

각 파일에 최소한의 placeholder 코드를 넣어둘 것:
- page.tsx → 기본 export default function
- route.ts → GET/POST handler skeleton
- .ts 유틸 → export 빈 함수 또는 TODO 주석

#### 1-5. 환경변수 템플릿
`.env.local.example` 파일 생성 (CLAUDE.md의 Environment Variables 섹션 참조)

#### 1-6. Git 초기화
CLAUDE.md의 Git Workflow 섹션을 따라:
```bash
git init
git add .
git commit -m "chore: [P1-S1] BrandHelix 프로젝트 초기화"
git branch -M main
# GitHub repo 생성 후:
# git remote add origin https://github.com/{username}/brandhelix.git
# git push -u origin main
git checkout -b develop
```

#### 1-7. 동작 확인
```bash
npm run dev
# http://localhost:3000 접속 → Next.js 기본 페이지 확인
# /projects, /project/test-id/brand-dna 등 라우트 접근 확인
```

### 완료 기준
- [x] `npm run dev`로 에러 없이 실행
- [x] 모든 라우트 접근 가능 (placeholder 페이지)
- [x] shadcn/ui 컴포넌트 정상 렌더링
- [x] Git 초기 커밋 완료, develop 브랜치 생성

### Git
```bash
git add .
git commit -m "chore: [P1-S1] 프로젝트 초기화, 디렉토리 구조, 패키지 설치 완료"
```

---

## Session 2: TypeScript 타입 정의 + Supabase 연동

### 목표
전체 도메인 타입 정의, Supabase 클라이언트 설정, DB 마이그레이션 준비

### Step-by-Step

#### 2-1. TypeScript 타입 정의
CLAUDE.md의 DB Schema를 기반으로 `src/types/` 파일 작성:

**src/types/project.ts**
```typescript
export interface Project {
  id: string;
  userId: string;
  name: string;
  industry?: string;
  websiteUrl?: string;
  status: 'draft' | 'dna_collecting' | 'dna_complete' | 'generating' | 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
}
```

**src/types/brand-dna.ts**
```typescript
export interface BrandDNA {
  id: string;
  projectId: string;
  layers: BrandDNALayers;
  completenessScore: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface BrandDNALayers {
  companyIdentity?: CompanyIdentity;
  brandCore?: BrandCore;
  targetAudience?: TargetAudience;
  visualIdentity?: VisualIdentity;
  verbalIdentity?: VerbalIdentity;
  competitivePosition?: CompetitivePosition;
  channelStrategy?: ChannelStrategy;
  creativeStyle?: CreativeStyle;
}

// 8-Layer 각각의 상세 인터페이스 정의
export interface CompanyIdentity {
  companyName: string;
  industry: string;
  foundedYear?: number;
  employeeCount?: string;
  annualRevenue?: string;
  mainProducts: string[];
  businessModel: string;
  missionStatement?: string;
}

export interface BrandCore {
  brandName: string;
  brandSlogan?: string;
  brandStory?: string;
  coreValues: string[];
  brandPersonality: string[]; // e.g., ['trustworthy', 'innovative']
  brandPromise?: string;
  usp: string; // Unique Selling Proposition
}

export interface TargetAudience {
  primaryAge: string;
  gender?: string;
  location?: string;
  income?: string;
  interests: string[];
  painPoints: string[];
  buyingMotivation: string[];
  mediaConsumption?: string[];
}

export interface VisualIdentity {
  primaryColors: string[];
  secondaryColors?: string[];
  logoUrl?: string;
  fontFamily?: string;
  imageStyle?: string; // e.g., 'photography', 'illustration'
  designTone: string; // CLAUDE.md Design Tones 참조
}

export interface VerbalIdentity {
  toneOfVoice: string[];
  writingStyle?: string;
  keyMessages: string[];
  forbiddenWords?: string[];
  copyStyle: string; // CLAUDE.md Copy Styles 참조
  hashtags?: string[];
}

export interface CompetitivePosition {
  directCompetitors: Competitor[];
  indirectCompetitors?: Competitor[];
  differentiators: string[];
  marketPosition?: string;
}

export interface Competitor {
  name: string;
  websiteUrl?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface ChannelStrategy {
  primaryChannel: string;
  channels: ChannelConfig[];
  postingFrequency?: Record<string, string>;
}

export interface ChannelConfig {
  channel: 'site' | 'blog' | 'instagram' | 'shortform';
  enabled: boolean;
  priority: number;
  goal?: string;
}

export interface CreativeStyle {
  copyStyle: string;   // 8 copy styles 중 선택
  designTone: string;  // 6 design tones 중 선택
  referenceUrls?: string[];
  moodKeywords?: string[];
}
```

**src/types/content.ts** — 생성된 콘텐츠 타입
**src/types/style.ts** — 카피 스타일, 디자인 톤 상수 정의

#### 2-2. Supabase 클라이언트 설정

**src/lib/supabase/client.ts** — 브라우저용 (createBrowserClient)
**src/lib/supabase/server.ts** — RSC/Route Handler용 (createServerClient)
**src/lib/supabase/admin.ts** — Service Role용 (관리자 작업)

> ⚠️ Supabase 키가 아직 없으면 `.env.local`에 빈 값으로 두고, 클라이언트 코드는 완성해둔다. 키 입력 후 바로 동작하도록.

#### 2-3. DB 마이그레이션 파일
`supabase/migrations/001_initial_schema.sql` — CLAUDE.md의 전체 CREATE TABLE + RLS 정책 포함

#### 2-4. Supabase 타입 자동생성 설정
```bash
# Supabase CLI 설치 후 (키 준비되면):
# npx supabase gen types typescript --project-id {ref} > src/types/supabase.ts
```

### 완료 기준
- [x] 모든 타입 정의 완료, import 에러 없음
- [x] Supabase 클라이언트 3종 (client/server/admin) 코드 완성
- [x] 마이그레이션 SQL 파일 준비

### Git
```bash
git checkout -b feature/phase1-session2
# ... 작업 ...
git add .
git commit -m "feat: [P1-S2] TypeScript 타입 정의 + Supabase 클라이언트 설정"
git checkout develop && git merge feature/phase1-session2
```

---

## Session 3: 대시보드 레이아웃 + 프로젝트 CRUD UI

### 목표
대시보드 레이아웃(사이드바+헤더), 프로젝트 목록/생성/상세 페이지 UI 구현

### Step-by-Step

#### 3-1. 대시보드 레이아웃
**src/app/(dashboard)/layout.tsx**
- 좌측 사이드바 (프로젝트 목록, 네비게이션)
- 상단 헤더 (사용자 정보, 알림)
- 메인 콘텐츠 영역
- 반응형: 모바일에서 사이드바 → Sheet 패널

**src/components/layout/sidebar.tsx**
- BrandHelix 로고
- 프로젝트 리스트 (접었다 펼 수 있는)
- 선택된 프로젝트의 서브메뉴: Brand DNA, 판매사이트, 블로그, 인스타그램, 숏폼, 스타일, 분석
- 하단: 설정, 사용량

**src/components/layout/header.tsx**
- 현재 위치 breadcrumb
- 사용자 아바타 + 드롭다운 (프로필, 로그아웃)

#### 3-2. 프로젝트 목록 페이지
**src/app/(dashboard)/projects/page.tsx**
- 프로젝트 카드 그리드 (이름, 업종, 상태 뱃지, 생성일)
- "새 프로젝트 만들기" 버튼 → Dialog
- 빈 상태: 온보딩 안내 메시지

#### 3-3. 새 프로젝트 생성 Dialog
- 입력: 프로젝트명, 업종(Select), 웹사이트 URL(선택)
- Zod validation
- 생성 후 → `/project/[id]/brand-dna` 로 이동

#### 3-4. 프로젝트 상세 페이지
**src/app/(dashboard)/project/[id]/page.tsx**
- 프로젝트 대시보드: 각 채널 상태 카드
- Brand DNA 완성도 Progress bar
- 최근 생성된 콘텐츠 미리보기

#### 3-5. Zustand 스토어
**src/stores/project-store.ts**
```typescript
interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<Project>;
  setCurrentProject: (project: Project) => void;
}
```

### 완료 기준
- [x] 대시보드 레이아웃 렌더링, 사이드바 네비게이션 동작
- [x] 프로젝트 목록 표시 (mock data OK)
- [x] 새 프로젝트 생성 Dialog 동작
- [x] 라우팅: projects → project/[id] → brand-dna 등 이동 정상

### Git
```bash
git checkout -b feature/phase1-session3
git add .
git commit -m "feat: [P1-S3] 대시보드 레이아웃 + 프로젝트 CRUD UI"
git checkout develop && git merge feature/phase1-session3
```

---

## Session 4: Brand DNA Wizard (3-Step 입력 폼)

### 목표
Brand DNA 수집을 위한 3단계 위자드 UI 구현

### Step-by-Step

#### 4-1. 위자드 컨테이너
**src/app/(dashboard)/project/[id]/brand-dna/page.tsx**
- 3-Step Progress indicator
- Step 간 이동 (이전/다음)
- 자동저장 (Zustand + debounce)

#### 4-2. Step 1: 기본 정보
- 회사명, 업종, 설립연도
- 주요 상품/서비스 (태그 입력)
- 비즈니스 모델
- 미션/비전 (선택)
- 웹사이트 URL → "자동 분석" 버튼 (Session 5에서 구현)

#### 4-3. Step 2: 브랜드 & 타겟
- 브랜드명, 슬로건
- 핵심 가치 (최대 5개 태그)
- 브랜드 퍼스낼리티 (미리 정의된 옵션에서 복수 선택)
- USP (차별화 포인트)
- 타겟 고객: 연령, 성별, 지역, 관심사, 페인포인트

#### 4-4. Step 3: 스타일 & 채널
- 카피 스타일 선택 (8종 카드 UI, 예시 포함)
- 디자인 톤 선택 (6종 카드 UI, 컬러 프리뷰 포함)
- 활성화할 채널 체크박스 (사이트, 블로그, 인스타, 숏폼)
- 경쟁사 입력 (이름 + URL, 최대 3개)
- 참고 URL (벤치마킹 사이트)

#### 4-5. Brand DNA Store
**src/stores/brand-dna-store.ts**
```typescript
interface BrandDNAStore {
  currentStep: number;
  layers: Partial<BrandDNALayers>;
  isDirty: boolean;
  setStep: (step: number) => void;
  updateLayer: <K extends keyof BrandDNALayers>(key: K, data: Partial<BrandDNALayers[K]>) => void;
  saveDraft: () => Promise<void>;
  calculateCompleteness: () => number;
}
```

#### 4-6. 카피 스타일 & 디자인 톤 프리뷰 컴포넌트
- 각 스타일별 예시 텍스트 표시
- 각 톤별 컬러 팔레트 + 미니 목업 표시
- 선택 시 하이라이트 효과

### 완료 기준
- [x] 3-Step 위자드 정상 동작 (이전/다음/진행률)
- [x] 모든 입력 필드 동작, Zod validation
- [x] 카피 스타일 8종 + 디자인 톤 6종 선택 UI
- [x] Zustand store에 데이터 저장
- [x] completeness score 계산 동작

### Git
```bash
git checkout -b feature/phase1-session4
git add .
git commit -m "feat: [P1-S4] Brand DNA 3-Step Wizard UI 구현"
git checkout develop && git merge feature/phase1-session4
```

---

## Session 5: Brand DNA AI 분석 + 첫 콘텐츠 생성

### 목표
웹사이트 크롤링 → Claude AI 분석 → 8-Layer 프로필 완성 → 블로그 글 1건 생성

### Step-by-Step

#### 5-1. 웹사이트 크롤링 (간소화 버전)
**src/lib/crawler/index.ts**
- 입력된 URL → `fetch`로 HTML 가져오기 (MVP에서는 Playwright 대신 간단한 fetch)
- meta 태그, og 태그, title, description 추출
- 주요 텍스트 콘텐츠 추출
- 이미지 URL 수집
- 결과 → `crawl_results` 테이블 저장

#### 5-2. Claude API 래퍼
**src/lib/claude/index.ts**
```typescript
export async function analyzeBrandDNA(
  userInput: Partial<BrandDNALayers>,
  crawlData: CrawlResult
): Promise<BrandDNALayers> {
  // System prompt: 브랜드 분석 전문가 역할
  // User: 수집된 데이터 + 사용자 입력
  // Output: 8-Layer JSON (structured output)
}

export async function generateContent(
  brandDNA: BrandDNA,
  channel: string,
  contentType: string,
  options: GenerateOptions
): Promise<GeneratedContent> {
  // 2-Phase: Haiku(구조) → Sonnet(품질)
}
```

**API Route: src/app/api/brand-dna/analyze/route.ts**
- POST: projectId → 크롤링 + AI 분석 → brand_dna 테이블 저장
- 진행률 반환 (SSE 또는 polling)

#### 5-3. Brand DNA 리포트 페이지
- AI 분석 완료 후 8-Layer 시각화
- 각 Layer별 카드 형태로 표시
- 수정 가능 (AI 결과를 사용자가 조정)
- "분석 다시 하기" 버튼

#### 5-4. 첫 콘텐츠 생성
**API Route: src/app/api/generate/route.ts**
- POST: projectId + channel('blog') + contentType('brand_story')
- Brand DNA 기반 블로그 글 1건 생성
- 2-Phase: Haiku → Sonnet
- 결과 → `generated_contents` 테이블 저장

#### 5-5. 콘텐츠 미리보기
- 생성된 블로그 글 미리보기 페이지
- 마크다운 렌더링
- "승인" / "재생성" 버튼

#### 5-6. API 사용량 로깅
**src/lib/claude/token-tracker.ts**
- 모든 Claude API 호출 시 토큰 수 + 비용 기록
- `api_usage_logs` 테이블 저장

### 완료 기준
- [x] URL 입력 → 크롤링 → 데이터 추출 동작
- [x] Claude API → 8-Layer Brand DNA 생성 동작
- [x] Brand DNA 리포트 페이지 표시
- [x] 블로그 글 1건 생성 + 미리보기
- [x] API 사용량 로깅

### Git
```bash
git checkout -b feature/phase1-session5
git add .
git commit -m "feat: [P1-S5] Brand DNA AI 분석 + 블로그 콘텐츠 생성"
git checkout develop && git merge feature/phase1-session5

# Phase 1 완료
git checkout main
git merge develop
git push origin main
git tag v0.1.0 -m "Phase 1: MVP Foundation 완료"
```

---

## Phase 1 완료 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | Next.js + Tailwind + shadcn/ui 프로젝트 동작 | ⬜ |
| 2 | 전체 디렉토리 구조 + placeholder 파일 | ⬜ |
| 3 | TypeScript 타입 시스템 완성 | ⬜ |
| 4 | Supabase 클라이언트 + 마이그레이션 준비 | ⬜ |
| 5 | 대시보드 레이아웃 + 프로젝트 CRUD | ⬜ |
| 6 | Brand DNA 3-Step Wizard | ⬜ |
| 7 | 웹사이트 크롤링 (기본) | ⬜ |
| 8 | Claude AI → 8-Layer Brand DNA 생성 | ⬜ |
| 9 | 블로그 콘텐츠 1건 생성 + 미리보기 | ⬜ |
| 10 | Git: main + develop 브랜치, v0.1.0 태그 | ⬜ |

---

## 다음 Phase 예고

**Phase 2: Content Engine (Week 4–6)**
- 4채널 콘텐츠 생성 (사이트/블로그/인스타/숏폼)
- 카피 스타일 8종 프리셋 구현
- 인스타그램 이미지 자동 생성 (Satori + Sharp)
- 콘텐츠 관리 대시보드
