# Phase 2: Content Engine — Blog + Instagram (Week 5~7)

> **Goal:** 블로그 5종 타입 콘텐츠 생성 + 인스타그램 이미지 자동 생성 + 콘텐츠 관리 대시보드
> **Milestone:** 사이트 + 블로그 5편 + 인스타 10장 동시 생성 가능

---

## Session 1: 블로그 콘텐츠 엔진 (5종 타입)

### 목표
5종 블로그 타입별 프롬프트 시스템 + 생성 엔진 + 블로그 타입 선택 UI

### Step-by-Step

#### 1-1. 블로그 타입 정의
**src/types/blog.ts**
- 5종 타입: seo_filler, science_series, lifestyle_empathy, comparison_guide, brand_story
- 각 타입별 메타데이터 (목적, 구조, 길이, 이미지 규격)

#### 1-2. 블로그 프롬프트 엔진
**src/engines/content/generators/blog-generator.ts**
- 5종 타입별 system prompt 프리셋
- Brand DNA 기반 컨텍스트 조립
- SEO 규칙 주입 (키워드 밀도, 메타 디스크립션, 내부링크)
- 공통 카피라이팅 규칙 적용 (제목 40자, 도입 Pain Point, CTA 배치)

#### 1-3. 블로그 생성 API
**src/app/api/generate/blog/route.ts**
- POST: blogType + keywords + productName → 2-phase 생성
- SEO 메타데이터 포함 (title, description, keywords)

#### 1-4. 블로그 페이지 UI 강화
**src/app/(dashboard)/project/[id]/blog/page.tsx**
- 블로그 타입 선택 카드 UI (5종)
- 키워드/제품명 입력
- 생성된 콘텐츠 목록 (카드 그리드)
- 상세 미리보기 모달/페이지

### 완료 기준
- [ ] 5종 블로그 타입별 프롬프트 동작
- [ ] Brand DNA 기반 블로그 생성 API
- [ ] 타입 선택 → 키워드 입력 → 생성 → 미리보기 플로우

---

## Session 2: 블로그 썸네일 + 목록 UI

### 목표
Satori+Sharp 이미지 파이프라인으로 블로그 썸네일 자동 생성 + 콘텐츠 목록 관리

### Step-by-Step

#### 2-1. Satori + Sharp 이미지 파이프라인
**src/lib/image/satori-pipeline.ts**
- React 컴포넌트 → Satori (SVG) → Sharp (PNG) 변환
- 블로그 썸네일 템플릿 (1200×630px OG용)
- Design Tone 반영 (색상, 폰트 스타일)

#### 2-2. 썸네일 생성 API
**src/app/api/images/thumbnail/route.ts**
- POST: title + designTone + brandColors → PNG buffer
- R2 업로드 (MVP에서는 base64 반환)

#### 2-3. 블로그 목록/상세 UI
- 블로그 콘텐츠 목록 (썸네일 + 제목 + 타입 뱃지 + 상태)
- 상세 미리보기 (styled HTML 렌더링)
- 승인/재생성/삭제 액션

#### 2-4. Markdown → Styled HTML
- 마크다운 파서 + 브랜드 스타일 적용
- 코드 블록, 테이블, 이미지 등 렌더링

### 완료 기준
- [ ] 블로그 썸네일 자동 생성 동작
- [ ] 콘텐츠 목록 + 상세 미리보기 UI

---

## Session 3: 인스타그램 이미지 엔진

### 목표
Satori+Sharp로 인스타그램 이미지 자동 생성 (6종 타입 중 3종 우선)

### Step-by-Step

#### 3-1. 인스타그램 타입 정의
**src/types/instagram.ts**
- 6종: hero_product, info_card_carousel, routine_guide, before_after, brand_mood, event_promo
- 스펙: 1080×1350px (4:5), 캐러셀 3~7장

#### 3-2. 인스타그램 이미지 템플릿
**src/engines/channel-builder/instagram-builder/**
- React 컴포넌트 기반 템플릿 (Satori 호환)
- Design Tone별 스타일 변형
- 텍스트 오버레이 + 브랜드 로고 배치

#### 3-3. 이미지 생성 API
**src/app/api/images/instagram/route.ts**
- POST: type + content + designTone + brandDNA → PNG array
- 캐러셀: 여러 장 동시 생성

#### 3-4. 캡션 + 해시태그 생성
- Claude API로 캡션 자동 생성 (훅 → 본문 → CTA → 해시태그)
- 해시태그 15개 (대형 5 + 중형 5 + 니치 5)

### 완료 기준
- [ ] 인스타 이미지 1080×1350px 생성 동작
- [ ] 캐러셀 (다중 이미지) 생성
- [ ] 캡션 + 해시태그 자동 생성

---

## Session 4: 인스타그램 UI + Feed Grid

### 목표
인스타그램 콘텐츠 관리 페이지 + Feed Grid 미리보기

### Step-by-Step

#### 4-1. 인스타그램 페이지
**src/app/(dashboard)/project/[id]/instagram/page.tsx**
- 콘텐츠 타입 선택 (6종 카드)
- 생성 폼 (키워드, 제품, 추가 지시)
- 생성 결과 미리보기

#### 4-2. Feed Grid 미리보기
- 3×3 그리드 레이아웃 (인스타 피드 시뮬레이션)
- 9칸 사이클 패턴 자동 배치
- 드래그로 순서 변경

#### 4-3. 캐러셀 미리보기
- 좌우 스와이프 미리보기 UI
- 각 슬라이드 편집 가능

### 완료 기준
- [ ] 인스타 콘텐츠 생성 플로우 동작
- [ ] Feed Grid 미리보기
- [ ] 캐러셀 스와이프 미리보기

---

## Session 5: 콘텐츠 관리 + 크로스채널

### 목표
통합 콘텐츠 관리 대시보드 + 채널 간 연계 + 일괄 생성

### Step-by-Step

#### 5-1. 콘텐츠 관리 대시보드
- 전체 콘텐츠 목록 (채널별 필터, 상태별 필터)
- 일괄 승인/삭제
- 콘텐츠 상태 관리 (draft → approved → scheduled → published)

#### 5-2. 크로스채널 링크
- 블로그 → 사이트 자동 CTA 링크 (UTM 포함)
- 인스타 캡션 → 블로그/사이트 링크 안내

#### 5-3. 일괄 생성
- "블로그 5편 + 인스타 10장" 한번에 생성
- 진행률 표시 (생성 큐)

#### 5-4. 다운로드
- 인스타 이미지 개별/일괄 다운로드
- 블로그 콘텐츠 HTML/Markdown 내보내기

### 완료 기준
- [ ] 콘텐츠 관리 대시보드 동작
- [ ] 크로스채널 링크 자동 삽입
- [ ] 일괄 생성 + 다운로드

---

## Phase 2 완료 후 Git
```bash
git checkout main
git merge develop
git push origin main
git tag v0.2.0 -m "Phase 2: Content Engine 완료"
```
