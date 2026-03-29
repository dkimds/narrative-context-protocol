# NCP 숏폼 드라마 스킬 - Claude Desktop 설치 가이드

이 스킬은 NCP(Narrative Context Protocol) 스키마 기반으로 숏폼 드라마 시리즈를 체계적으로 작성할 수 있게 도와줍니다.

## 기능

- ✅ 7단계 구조화된 워크플로우 (시리즈 설정 → 아이데이션 → 에피소드 작성)
- ✅ 기승전결 구조의 90-120초 에피소드 자동 생성
- ✅ NCP v1.3.0 스키마 검증
- ✅ 3단계 아이데이션 프로세스 (무료/유료/결말 구간)
- ✅ JSON 형식으로 구조화된 출력

## Claude Desktop 설치 방법

### 1. ZIP 파일 다운로드

다음 파일을 다운로드하세요:
- `ncp-shortform-skill.zip` (37KB)

**포함된 파일:**
```
ncp-shortform/
├── SKILL.md                                    # 스킬 메인 프롬프트
├── README.md                                   # NCP 프로토콜 소개
├── SPECIFICATION.md                            # NCP 스키마 상세 설명
├── schema/
│   └── ncp-schema.json                         # NCP v1.3.0 스키마
├── templates/
│   ├── ideation-template.json                  # 아이데이션 템플릿
│   └── episode-template.json                   # 에피소드 템플릿
└── examples/
    ├── ideation-phase1.json                    # 1차 아이데이션 예시
    ├── ideation-phase2.json                    # 2차 아이데이션 예시
    ├── ideation-phase3.json                    # 3차 아이데이션 예시
    └── complete-storyform-template.json        # 완전한 스토리폼 예시
```

### 2. Claude Desktop에 업로드

1. **Claude Desktop** 앱 실행
2. **설정(Settings)** 열기
3. **Customize** 탭 선택
4. **Skills** 섹션으로 이동
5. **"+" 버튼** 클릭
6. **"Upload a skill"** 선택
7. `ncp-shortform-skill.zip` 파일 선택하여 업로드
8. 업로드 완료 후 **ncp-shortform** 스킬이 목록에 표시됩니다

### 3. 스킬 사용

#### 방법 1: 대화 시작 시 선택
- 새 대화를 시작할 때 스킬 선택 메뉴에서 **ncp-shortform** 선택

#### 방법 2: 대화 중 호출
- 대화 중에 다음과 같이 입력:
  ```
  @ncp-shortform 도시남녀 로맨스 작성해줘
  ```

## 사용 예시

### 1단계: 시리즈 초기화

```
시리즈 제목: 도시남녀
전체 회차: 60회
장르: 로맨스
```

스킬이 자동으로 시리즈 바이블을 생성합니다.

### 2단계: 1차 아이데이션

무료 구간(1~10회)의 캐릭터, 테마, 플롯, 장르를 기획합니다.

출력 형식:
```json
{
  "schema_version": "1.3.0",
  "story": {
    "ideation": {
      "character": [...],
      "theme": [...],
      "plot": [...],
      "genre": [...]
    }
  }
}
```

### 3단계: 에피소드 작성

기승전결 구조로 각 회차를 작성합니다:

```
기 (설정, 20초): 도시 한복판, 출근길의 주인공
승 (갈등, 35초): 엘리베이터에서 운명적 만남
전 (반전, 25초): 그는 신입사원의 상사였다
결 (해소, 10초): 어색한 첫 인사, 설레는 마음
```

JSON으로 자동 변환됩니다.

## 출력 파일 구조

스킬이 생성하는 파일들:

```
examples/
  ├── ideation-phase1.json    # 1차 아이데이션 (무료 구간)
  ├── ideation-phase2.json    # 2차 아이데이션 (유료 구간)
  ├── ideation-phase3.json    # 3차 아이데이션 (결말 구간)
  ├── ep01.json               # 1회 에피소드
  ├── ep02.json               # 2회 에피소드
  └── ...
```

## JSON 검증

생성된 JSON 파일을 검증하려면:

```bash
npm run validate:file -- ./examples/ep01.json
```

## NCP 스키마 핵심 개념

### 필수 필드

- `format`: "short_form"
- `target_duration_seconds`: 90 또는 120
- `moments`: 4개 (기승전결)
- `storybeats`: 시리즈 arc 위치 표시

### ID 네이밍 규칙

- Story: `story_[시리즈슬러그]-ep[NN]`
- Narrative: `narrative_ep[NN]-001`
- Beat: `beat_ep[NN]-[N]`
- Ideation: `idea_[category]_p[phase]_[NNN]`

### 구간 구조

| 구간 | 회차 범위 | 아이데이션 단계 |
|------|-----------|----------------|
| 무료 | 1~10회 | 1차 (캐릭터 소개, 갈등 씨앗) |
| 유료 | 11~50회 | 2차 (갈등 심화, 관계 발전) |
| 결말 | 51~60회 | 3차 (갈등 해소, 최종 변화) |

## 워크플로우 요약

1. **시리즈 설정** → 제목, 장르, 캐릭터, 전체 회차 확정
2. **1차 아이데이션** → 무료 구간 기획
3. **에피소드 작성 (무료)** → 1~10회 순차 작성
4. **2차 아이데이션** → 유료 구간 기획
5. **에피소드 작성 (유료)** → 11~50회 순차 작성
6. **3차 아이데이션** → 결말 구간 기획
7. **에피소드 작성 (결말)** → 51~60회 순차 작성

## 문제 해결

### 스킬이 보이지 않아요
- Claude Desktop을 재시작하세요
- 설정 > Customize > Skills에서 업로드 확인

### JSON 검증 오류가 나요
- `schema/ncp-schema.json` 파일이 프로젝트에 있는지 확인
- `npm install`로 의존성 설치 확인

### 에피소드 구조가 맞지 않아요
- moments가 정확히 4개인지 확인 (기승전결)
- 각 moment의 summary가 "기 —", "승 —", "전 —", "결 —"로 시작하는지 확인
- fabric duration 합계가 target_duration_seconds 이하인지 확인

## 라이선스

이 프로젝트는 ISC 라이선스를 따릅니다.

## 문의

이슈나 제안 사항이 있으면 GitHub Issues에 등록해주세요.
