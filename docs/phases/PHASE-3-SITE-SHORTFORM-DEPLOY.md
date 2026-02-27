# Phase 3: Site Builder + Shortform + Deployer (Week 8~10)

> **Goal:** 숏폼(틱톡/숏츠) 콘텐츠 엔진 + 판매사이트 빌더 + 배포 시스템
> **Milestone:** 4개 채널(사이트·블로그·인스타·숏폼) 전체 생성 + 사이트 배포 가능

---

## Session 1: 숏폼 타입 정의 + 스크립트 생성 엔진

### 목표
숏폼 콘텐츠 타입 정의 + Claude 2-phase 스크립트 생성 엔진 + API

### Step-by-Step

#### 1-1. 숏폼 타입 정의
**src/types/shortform.ts**
- 5종 타입: hook_product, how_to_tutorial, myth_buster, before_after_reveal, trend_challenge
- 각 타입별 메타데이터 (목적, 구조, 길이 15~60초, 씬 수)

#### 1-2. 숏폼 스크립트 생성 엔진
**src/engines/content/generators/shortform-generator.ts**
- 2-phase: Haiku (스크립트 구조) → Sonnet (톤 정제)
- 출력: hookLine + scenes[] (narration + visualDescription + duration) + CTA + subtitles
- Brand DNA 기반 톤앤보이스 적용

#### 1-3. 숏폼 생성 API
**src/app/api/generate/shortform/route.ts**
- POST: shortformType + productName + keywords + brandDNA → 스크립트 JSON
- Token tracking + cost calculation

#### 1-4. 타입 선택 컴포넌트
**src/components/content/shortform-type-selector.tsx**
- 5종 카드 그리드 (인스타 타입 셀렉터 패턴 재사용)

### 완료 기준
- [ ] 5종 숏폼 타입 정의 완료
- [ ] 스크립트 생성 API 동작 (hookLine + scenes + CTA)
- [ ] generators/index.ts에서 숏폼 제너레이터 re-export

---

## Session 2: 숏폼 썸네일 + UI 페이지

### 목표
Satori 기반 숏폼 썸네일 생성 + 전체 숏폼 페이지 UI

### Step-by-Step

#### 2-1. 숏폼 썸네일 템플릿
**src/engines/channel-builder/shortform-builder/**
- Satori 호환 React 컴포넌트 (1080×1920 세로형)
- 5종 타입별 레이아웃 변형
- Design Tone 색상 적용

#### 2-2. 썸네일 API
**src/app/api/images/shortform/route.ts**
- POST: hookLine + type + designTone → PNG (base64)

#### 2-3. 스크립트 미리보기 컴포넌트
**src/components/content/shortform-preview.tsx**
- 씬별 타임라인 카드
- 나레이션 + 비주얼 디스크립션 표시
- 자막 미리보기

#### 2-4. 숏폼 페이지 전체 UI
**src/app/(dashboard)/project/[id]/shortform/page.tsx**
- 타입 선택 → 옵션 폼 → 생성 → 결과 미리보기
- 스크립트 + 썸네일 동시 표시

### 완료 기준
- [ ] 숏폼 썸네일 1080×1920 생성 동작
- [ ] 스크립트 타임라인 미리보기 UI
- [ ] 타입 선택 → 생성 → 미리보기 전체 플로우

---

## Session 3: 판매사이트 템플릿 + 디자인 토큰 + 생성 엔진

### 목표
사이트 템플릿 시스템 + 디자인 토큰 + 섹션 카피 생성

### Step-by-Step

#### 3-1. 사이트 타입 정의
**src/types/site.ts**
- 4종 템플릿: product_landing, brand_story_page, service_showcase, event_promotion
- 각 템플릿별 섹션 구성 정의

#### 3-2. 디자인 토큰 시스템
**src/engines/channel-builder/site-builder/design-tokens.ts**
- Design Tone → CSS Custom Properties 매핑
- 색상, 타이포그래피, 간격, 그림자 등

#### 3-3. 섹션 컴포넌트 정의
**src/engines/channel-builder/site-builder/sections.ts**
- Hero, Features, Testimonials, CTA, ProductGrid, FAQ, Footer 등 8개 섹션
- 각 섹션의 Props 타입 + HTML 생성 함수

#### 3-4. 사이트 카피 생성 엔진
**src/engines/channel-builder/site-builder/index.ts**
- Claude 2-phase로 섹션별 카피 생성
- Brand DNA → 섹션별 headline/body/CTA 조립
- 디자인 토큰 + 카피 → HTML 조합

#### 3-5. 사이트 생성 API
**src/app/api/generate/site/route.ts**
- POST: templateType + brandDNA + copyStyle + designTone → GeneratedSite

### 완료 기준
- [ ] 4종 사이트 템플릿 정의
- [ ] Design Tone → CSS 토큰 변환
- [ ] 섹션별 카피 생성 API 동작
- [ ] 완성된 HTML 사이트 output

---

## Session 4: 판매사이트 UI + 미리보기

### 목표
사이트 빌더 대시보드 UI + 실시간 미리보기

### Step-by-Step

#### 4-1. 사이트 빌더 페이지
**src/app/(dashboard)/project/[id]/site/page.tsx**
- 템플릿 선택 → 옵션 설정 → 생성 → 미리보기
- 섹션 순서 편집 (드래그)

#### 4-2. 사이트 미리보기 컴포넌트
**src/components/content/site-preview.tsx**
- iframe 기반 실시간 미리보기
- 모바일/데스크톱 뷰포트 전환
- 섹션별 하이라이트

#### 4-3. 사이트 미리보기 라우트
**src/app/preview/[id]/page.tsx**
- SSR로 GeneratedSite → HTML 렌더링
- 디자인 토큰 CSS 주입

#### 4-4. 사이트 상세 모달
**src/components/content/site-detail-modal.tsx**
- 생성된 사이트 상세 정보
- 배포 상태, 버전, 도메인 관리

### 완료 기준
- [ ] 템플릿 선택 → 생성 → 미리보기 전체 플로우
- [ ] 모바일/데스크톱 반응형 미리보기
- [ ] 섹션 편집 UI

---

## Session 5: 배포 시스템 (CF Pages + 콘텐츠 스케줄러)

### 목표
Cloudflare Pages 배포 + 콘텐츠 발행 스케줄링

### Step-by-Step

#### 5-1. Cloudflare R2 + Pages 클라이언트
**src/lib/cloudflare/r2.ts, pages.ts**
- R2: 이미지 업로드/조회 래퍼
- Pages: 프로젝트 생성/배포/상태 확인

#### 5-2. 사이트 배포 엔진
**src/engines/deployer/site-deployer.ts**
- GeneratedSite → Static HTML/CSS → CF Pages 업로드
- deploy URL: {projectId}.brandhelix.pages.dev
- 배포 상태 추적

#### 5-3. 콘텐츠 스케줄러
**src/engines/deployer/content-scheduler.ts**
- scheduled 상태 콘텐츠 → 시간 확인 → published 전환
- 발행 로그 기록

#### 5-4. 도메인 관리
**src/engines/deployer/domain-manager.ts**
- Custom CNAME 설정 API
- SSL 프로비저닝 상태 체크

#### 5-5. 배포 API
**src/app/api/deploy/route.ts**
- POST: 사이트 배포 트리거
- GET: 배포 상태 확인

#### 5-6. 스케줄 API
**src/app/api/cron/publish/route.ts**
- Vercel Cron에서 매시간 호출
- 발행 대상 콘텐츠 처리

### 완료 기준
- [ ] 사이트 배포 → CF Pages URL 발급
- [ ] 콘텐츠 스케줄링 → 자동 발행
- [ ] 배포 상태 대시보드

---

## Phase 3 완료 후 Git
```bash
git checkout main
git merge develop
git push origin main
git tag v0.3.0 -m "Phase 3: Site Builder + Shortform + Deployer 완료"
```
