# 구현 계획: NCP 숏폼 스킬 업그레이드

## 개요

`.claude/skills/ncp-shortform/SKILL.md`를 3단계 아이데이션 구조로 업그레이드한다.
결과물은 코드가 아니라 SKILL.md 파일 자체이며, 예시 JSON 파일과 구조 검증 스크립트가 함께 포함된다.
각 태스크는 SKILL.md의 특정 섹션을 작성하거나 수정하는 단위로 구성된다.

## 태스크

- [x] 1. SKILL.md 기본 구조 재편 — 7단계 골격 작성
  - 기존 SKILL.md의 "진행 방식" 섹션을 7단계 구조로 교체한다
  - 각 단계 헤더(1단계~7단계)와 한 줄 설명만 먼저 작성하고, 세부 내용은 이후 태스크에서 채운다
  - 기존 "숏폼 드라마의 핵심 원칙", "NCP 스키마 핵심 규칙", "시리즈 arc 관리", "오류 방지 체크리스트" 섹션은 유지한다
  - _요구사항: 1.6, 6.1_

- [x] 2. 1단계: Series_Config 설정 섹션 작성
  - [x] 2.1 Series_Config 설정 항목 작성
    - `total_episodes`, `phase1_end`(기본값 10), `final_arc_offset`(기본값 10) 입력 안내 작성
    - 기본값 미입력 시 자동 적용 규칙 명시
    - _요구사항: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.2 유효성 검사 규칙 및 오류 메시지 작성
    - `phase1_end >= total_episodes - final_arc_offset` 또는 `final_arc_offset >= total_episodes` 조건 위반 시 오류 메시지 형식 작성
    - 재입력 요청 흐름 명시
    - _요구사항: 1.5_
  - [x] 2.3 시리즈 바이블 출력 형식 업데이트
    - 기존 바이블 형식에 `[시리즈 구간]` 블록 추가 (무료/유료/최종결말 구간 범위 표시)
    - _요구사항: 1.6_

- [x] 3. 2단계: 1차 아이데이션 섹션 작성
  - [x] 3.1 1차 아이데이션 탐색 항목 작성
    - 단계 헤더에 현재 단계(1차)와 구간 회차 범위 표시 형식 명시
    - character, theme, plot, genre 4개 카테고리 탐색 초점 작성 (무료 구간 훅, 캐릭터 소개, 핵심 갈등 씨앗)
    - _요구사항: 2.1, 2.2, 6.1_
  - [x] 3.2 Ideation_Node 출력 형식 및 id 네이밍 규칙 작성
    - `id`, `summary`, `title`(선택), `notes`(선택), `tags`(선택) 필드 구조 명시
    - 1차 id 패턴 (`idea_[category]_p1_[NNN]`) 명시
    - _요구사항: 2.3, 2.4_
  - [x] 3.3 Ideation_JSON 출력 형식 및 저장 안내 작성
    - `schema_version: "1.3.0"`, `story.ideation` 구조를 포함한 JSON 템플릿 작성
    - `examples/ideation-phase1.json` 저장 안내 및 검증 명령어(`npm run validate:file`) 작성
    - 수정 요청 처리 흐름 명시
    - _요구사항: 2.3, 2.5, 2.6_

- [x] 4. 3단계: Free_Episodes 에피소드 작성 섹션 업데이트
  - [x] 4.1 진행 상황 한 줄 표시 형식 추가
    - `[진행] [N]회 / 총 [total]회 | 현재 구간: [무료/유료/최종결말] | 아이데이션: [N차] 완료` 형식 명시
    - 매 회차 A단계(회차 내용 제안) 시작 전 표시 규칙 작성
    - _요구사항: 6.4_
  - [x] 4.2 에피소드 JSON에 story.ideation 필드 추가
    - 기존 에피소드 JSON 템플릿에 `story.ideation` 필드 추가 (character, theme, plot, genre 배열)
    - 해당 회차 관련 Ideation_Node 선별 포함 규칙 명시
    - 특정 노드 직접 구현 시 `notes` 필드에 구현 회차 기록 안내 추가
    - `schema_version`을 `"1.3.0"`으로 업데이트
    - _요구사항: 5.1, 5.2, 5.3_
  - [x] 4.3 오류 방지 체크리스트에 ideation 항목 추가
    - 기존 체크리스트에 `ideation 필드가 NCP_Schema를 준수하는가` 항목 추가
    - _요구사항: 5.4_

- [x] 5. 체크포인트 — SKILL.md 1~3단계 검토
  - 1단계(Series_Config), 2단계(1차 아이데이션), 3단계(Free_Episodes) 섹션이 요구사항을 충족하는지 확인한다.
  - 모든 내용이 올바르면 다음 태스크로 진행한다. 질문이 있으면 사용자에게 확인한다.

- [x] 6. 4단계: 2차 아이데이션 섹션 작성
  - [x] 6.1 단계 전환 감지 조건 및 Continuity_Bridge (1차→2차) 작성
    - `phase1_end` 회차 완료 후 자동 감지 조건 명시
    - "2차 아이데이션을 시작할까요?" 안내 형식 작성
    - Continuity_Bridge 출력 형식 작성: `[1차에서 확립된 것]` 블록 (캐릭터, 핵심 갈등 씨앗, 테마 방향, 마지막 훅) + `[2차에서 이어받아야 할 것]` 블록
    - _요구사항: 3.1, 6.2_
  - [x] 6.2 2차 아이데이션 탐색 항목 및 id 규칙 작성
    - 갈등 심화, 캐릭터 관계 변화, 중간 반전 플롯 탐색 초점 작성
    - 2차 id 패턴 (`idea_[category]_p2_[NNN]`) 및 1차 중복 방지 규칙 명시
    - 연결 출처 기록 규칙 작성: `"1차 [원본_id] 에서 심화"`, `"1차 [원본_id] 에 대한 반전"`, `"2차 신규"`
    - _요구사항: 3.2, 3.3, 3.4_
  - [x] 6.3 2차 Ideation_JSON 저장 안내 및 건너뜀 처리 작성
    - `examples/ideation-phase2.json` 저장 안내 작성
    - 건너뜀 시 경고 메시지(`⚠️ 2차 아이데이션을 건너뜁니다...`) 및 즉시 진행 흐름 명시
    - _요구사항: 3.5, 3.6_

- [x] 7. 5단계: Paid_Episodes 에피소드 작성 섹션 작성
  - 3단계(Free_Episodes)와 동일한 흐름임을 명시하고 해당 섹션을 참조하도록 작성한다
  - 진행 상황 표시에서 `현재 구간: 유료` 예시 포함
  - _요구사항: 3.7, 6.4_

- [x] 8. 6단계: 3차 아이데이션 섹션 작성
  - [x] 8.1 단계 전환 감지 조건 및 Continuity_Bridge (1차+2차→3차) 작성
    - `total_episodes - final_arc_offset` 회차 완료 후 자동 감지 조건 명시
    - "3차 아이데이션을 시작할까요?" 안내 형식 작성
    - Continuity_Bridge 출력 형식 작성: `[시리즈 전체 흐름 요약]` 블록 (캐릭터 여정, 핵심 갈등 현황, 관계 변화, 테마 누적) + `[3차에서 해소해야 할 것]` 블록
    - _요구사항: 4.1, 6.2_
  - [x] 8.2 3차 아이데이션 탐색 항목 및 id 규칙 작성
    - 결말 방향, 캐릭터 최종 변화(resolve), outcome/judgment 확정 탐색 초점 작성
    - 3차 id 패턴 (`idea_[category]_p3_[NNN]`) 및 1차·2차 중복 방지 규칙 명시
    - 연결 출처 기록 규칙 작성: `"1차 [id] + 2차 [id] 해소"`, `"3차 신규 — 결말 전용"`
    - outcome/judgment 변경 시 이후 에피소드 JSON 반영 규칙 명시
    - _요구사항: 4.2, 4.3, 4.5_
  - [x] 8.3 3차 Ideation_JSON 저장 안내 및 건너뜀 처리 작성
    - `examples/ideation-phase3.json` 저장 안내 작성
    - 건너뜀 시 경고 메시지 및 즉시 진행 흐름 명시
    - _요구사항: 4.4, 4.6_

- [x] 9. 7단계: Final_Arc 에피소드 작성 섹션 작성
  - 3단계(Free_Episodes)와 동일한 흐름임을 명시하고 해당 섹션을 참조하도록 작성한다
  - 진행 상황 표시에서 `현재 구간: 최종결말` 예시 포함
  - _요구사항: 4.7, 6.4_

- [x] 10. 체크포인트 — SKILL.md 4~7단계 검토
  - 4단계(2차 아이데이션), 5단계(Paid_Episodes), 6단계(3차 아이데이션), 7단계(Final_Arc) 섹션이 요구사항을 충족하는지 확인한다.
  - 모든 내용이 올바르면 다음 태스크로 진행한다. 질문이 있으면 사용자에게 확인한다.

- [x] 11. 예시 파일 작성 — ideation-phase1.json
  - [x] 11.1 `examples/ideation-phase1.json` 작성
    - `schema_version: "1.3.0"`, `story.ideation` 구조 포함
    - character, theme, plot, genre 각 2개 이상의 Ideation_Node 포함
    - 1차 id 패턴(`idea_[category]_p1_[NNN]`) 준수
    - _요구사항: 2.3, 2.4, 2.5_
  - [x] 11.2 ideation-phase1.json 스키마 검증
    - `npm run validate:file -- ./examples/ideation-phase1.json` 실행하여 PASS 확인
    - _요구사항: 2.3 (Property 2: Ideation_JSON NCP 스키마 준수)_

- [x] 12. 예시 파일 작성 — ideation-phase2.json
  - [x] 12.1 `examples/ideation-phase2.json` 작성
    - Continuity_Bridge notes 포함 (1차 노드 참조: `"1차 [원본_id] 에서 심화"` 등)
    - 2차 id 패턴(`idea_[category]_p2_[NNN]`) 준수, 1차 id와 중복 없음
    - _요구사항: 3.3, 3.4, 3.5_
  - [x] 12.2 ideation-phase2.json 스키마 검증
    - `npm run validate:file -- ./examples/ideation-phase2.json` 실행하여 PASS 확인
    - _요구사항: 3.3 (Property 2, Property 3: id 전역 고유성)_

- [x] 13. 예시 파일 작성 — ideation-phase3.json
  - [x] 13.1 `examples/ideation-phase3.json` 작성
    - Continuity_Bridge notes 포함 (1차+2차 노드 참조: `"1차 [id] + 2차 [id] 해소"` 등)
    - 3차 id 패턴(`idea_[category]_p3_[NNN]`) 준수, 1차·2차 id와 중복 없음
    - outcome/judgment 확정 내용 포함
    - _요구사항: 4.2, 4.3, 4.4_
  - [x] 13.2 ideation-phase3.json 스키마 검증
    - `npm run validate:file -- ./examples/ideation-phase3.json` 실행하여 PASS 확인
    - _요구사항: 4.2 (Property 2, Property 3, Property 4)_

- [x] 14. 구조 검증 스크립트 작성 — tests/validate-skill-structure.js
  - [x] 14.1 SKILL.md 구조 검증 스크립트 작성
    - `tests/validate-skill-structure.js` 파일 생성
    - 다음 항목을 텍스트 검색으로 검증하는 Node.js 스크립트 작성:
      - Series_Config 설정 항목 (`total_episodes`, `phase1_end`, `final_arc_offset`, 기본값) 포함 여부
      - 시리즈 바이블 출력 형식에 구간 정보(`[시리즈 구간]`) 포함 여부
      - 1차/2차/3차 아이데이션 단계 섹션 존재 여부
      - 각 단계의 탐색 항목 (character, theme, plot, genre) 명시 여부
      - 저장 파일명 안내 (`ideation-phase1/2/3.json`) 포함 여부
      - 진행 상황 표시 형식(`[진행]`) 포함 여부
      - 단계 전환 감지 조건 명시 여부
      - 건너뜀/되돌아가기 처리 지침 포함 여부
      - 오류 방지 체크리스트에 `ideation` 항목 포함 여부
      - id 네이밍 규칙 (`p1_`, `p2_`, `p3_`) 명시 여부
    - _요구사항: 1.1~1.6, 2.1~2.5, 3.1~3.5, 4.1~4.4, 5.4, 6.1~6.4_
  - [ ]* 14.2 속성 기반 테스트 작성 (fast-check)
    - `fast-check` 라이브러리를 사용하여 다음 속성 테스트 작성:
    - **Property 1: Series_Config 유효성** — 임의의 total/phase1End/finalArcOffset 조합에서 유효성 검사 함수가 올바른 결과를 반환하는지 검증 (요구사항 1.5)
    - **Property 2: Ideation_JSON NCP 스키마 준수** — 임의의 Ideation_Node 집합이 id+summary 필수 필드를 포함하는지 검증 (요구사항 2.3, 3.3, 5.1, 5.2)
    - **Property 3: Ideation_Node id 전역 고유성** — p1_/p2_/p3_ 접두어 패턴으로 생성된 id 집합에 중복이 없는지 검증 (요구사항 3.4, 4.3)
    - **Property 4: Continuity_Bridge 연결 출처 추적 가능성** — 2차/3차 노드 중 이전 단계 노드를 이어받는 노드가 notes 필드에 원본 id를 포함하는지 검증 (요구사항 3.3, 4.2)
    - _요구사항: 1.5, 2.3, 3.3, 3.4, 4.2, 4.3 (Property 1~4)_

- [x] 15. 최종 체크포인트 — 전체 검토 및 통합
  - SKILL.md 전체 7단계 구조가 일관성 있게 연결되는지 검토한다.
  - 예시 파일 3개(ideation-phase1/2/3.json)가 서로 id 중복 없이 연속성을 유지하는지 확인한다.
  - `tests/validate-skill-structure.js`를 실행하여 SKILL.md 구조 검증이 통과하는지 확인한다.
  - 모든 검증이 통과하면 완료. 질문이 있으면 사용자에게 확인한다.

## 참고

- `*` 표시 서브태스크는 선택 사항으로 MVP에서 건너뛸 수 있다
- 각 태스크는 특정 요구사항을 참조하여 추적 가능성을 보장한다
- 체크포인트는 단계별 점진적 검증을 위해 포함되었다
- 속성 기반 테스트는 SKILL.md 지침의 논리적 정확성을 검증한다
