# 요구사항 문서

## 소개

NCP 숏폼 드라마 시리즈 작성 어시스턴트 SKILL.md를 업그레이드한다.
현재 SKILL.md는 단일 흐름으로 에피소드를 순차 작성하는 구조이나,
숏폼 드라마의 특성상 회차가 많고 기획 방향이 구간별로 달라지므로
**3단계 아이데이션 구조**를 도입하고, NCP 스키마의 `ideation` 필드를 각 단계에서 적극 활용한다.

## 용어 정의

- **Skill**: `.claude/skills/ncp-shortform/SKILL.md` — Claude가 숏폼 드라마 작성 시 참조하는 지침 파일
- **NCP_Schema**: `schema/ncp-schema.json` — Narrative Context Protocol JSON 스키마 (v1.3.0 이상)
- **Ideation_Node**: NCP 스키마의 `ideation` 오브젝트 내 `character`, `theme`, `plot`, `genre` 배열의 각 항목
- **Ideation_Phase**: 아이데이션 1차/2차/3차 각각의 기획 단계
- **Free_Episodes**: 무료 공개 회차 구간 (기본값: 1~10회)
- **Paid_Episodes**: 유료 회차 구간 (Free_Episodes 이후 ~ 최종회 이전 10회 전까지)
- **Final_Arc**: 최종회 이전 10회부터 최종회까지의 구간
- **Series_Config**: 사용자가 설정하는 전체 회차 수 및 각 아이데이션 구간 경계값
- **Ideation_JSON**: 각 아이데이션 단계 결과물로 출력되는 NCP `ideation` 필드를 포함한 JSON


---

## 요구사항

### 요구사항 1: 시리즈 설정 커스터마이징

**사용자 스토리:** 작가로서, 전체 회차 수와 각 아이데이션 구간의 경계를 직접 설정하고 싶다. 그래야 내 시리즈 규모에 맞는 기획 흐름을 가질 수 있다.

#### 인수 기준

1. THE Skill SHALL 시리즈 설정 단계에서 전체 회차 수를 입력받는다.
2. THE Skill SHALL 1차 아이데이션 구간의 마지막 회차(기본값: 10회)를 사용자가 변경할 수 있도록 한다.
3. THE Skill SHALL 3차 아이데이션 시작 기준인 "최종회 이전 N회"(기본값: 10회)를 사용자가 변경할 수 있도록 한다.
4. WHEN 사용자가 커스텀 값을 입력하지 않으면, THE Skill SHALL 기본값(1차: 10회, 3차 시작: 최종회 이전 10회)을 사용한다.
5. WHEN 사용자가 입력한 구간 경계값이 전체 회차 수를 초과하면, THE Skill SHALL 오류를 안내하고 재입력을 요청한다.
6. THE Skill SHALL 확정된 Series_Config를 시리즈 바이블에 포함하여 출력한다.

---

### 요구사항 2: 1차 아이데이션 — 무료 회차 기획

**사용자 스토리:** 작가로서, 무료 공개 구간(첫 N회)에 대한 기획을 먼저 집중적으로 수행하고 싶다. 그래야 독자를 유료 구간으로 유입시키는 훅을 설계할 수 있다.

#### 인수 기준

1. WHEN 시리즈 바이블이 확정되면, THE Skill SHALL 1차 아이데이션을 시작한다.
2. THE Skill SHALL 1차 아이데이션에서 Free_Episodes 구간 전체의 캐릭터, 테마, 플롯, 장르 방향을 탐색한다.
3. THE Skill SHALL 1차 아이데이션 결과를 NCP_Schema의 `ideation` 필드 구조(character, theme, plot, genre 배열)로 출력한다.
4. THE Skill SHALL 각 Ideation_Node에 `id`, `summary`, `title`(선택), `notes`(선택), `tags`(선택) 필드를 포함한다.
5. THE Skill SHALL 1차 아이데이션 JSON을 `examples/ideation-phase1.json`으로 저장하도록 안내한다.
6. WHEN 사용자가 1차 아이데이션 내용 수정을 요청하면, THE Skill SHALL 수정 사항을 반영한 후 에피소드 작성을 진행한다.
7. THE Skill SHALL 1차 아이데이션 완료 후 Free_Episodes 구간의 에피소드를 순차 작성한다.


---

### 요구사항 3: 2차 아이데이션 — 유료 회차 기획

**사용자 스토리:** 작가로서, 유료 구간이 시작되는 시점에 기획을 재점검하고 싶다. 그래야 유료 독자의 기대를 충족하는 갈등 심화와 캐릭터 발전을 설계할 수 있다.

#### 인수 기준

1. WHEN Free_Episodes 구간의 마지막 회차 작성이 완료되면, THE Skill SHALL 2차 아이데이션을 제안한다.
2. THE Skill SHALL 2차 아이데이션에서 Paid_Episodes 구간의 갈등 심화, 캐릭터 관계 변화, 중간 반전 플롯을 탐색한다.
3. THE Skill SHALL 2차 아이데이션 결과를 1차 아이데이션 Ideation_Node와 연속성을 유지하며 NCP_Schema `ideation` 구조로 출력한다.
4. THE Skill SHALL 2차 아이데이션 Ideation_Node의 `id`가 1차와 중복되지 않도록 한다.
5. THE Skill SHALL 2차 아이데이션 JSON을 `examples/ideation-phase2.json`으로 저장하도록 안내한다.
6. WHEN 사용자가 2차 아이데이션을 건너뛰겠다고 하면, THE Skill SHALL 즉시 Paid_Episodes 에피소드 작성을 진행한다.
7. THE Skill SHALL 2차 아이데이션 완료 후 Paid_Episodes 구간의 에피소드를 순차 작성한다.

---

### 요구사항 4: 3차 아이데이션 — 최종 결말 기획

**사용자 스토리:** 작가로서, 최종회를 앞둔 시점에 결말 방향을 구체화하고 싶다. 그래야 시리즈 전체 arc를 일관성 있게 마무리할 수 있다.

#### 인수 기준

1. WHEN Final_Arc 구간의 첫 회차 작성 직전이 되면, THE Skill SHALL 3차 아이데이션을 제안한다.
2. THE Skill SHALL 3차 아이데이션에서 결말 방향, 캐릭터 최종 변화(resolve), 시리즈 전체 outcome/judgment 확정을 탐색한다.
3. THE Skill SHALL 3차 아이데이션 결과를 NCP_Schema `ideation` 구조로 출력하며, 1차·2차 Ideation_Node와 `id` 중복이 없도록 한다.
4. THE Skill SHALL 3차 아이데이션 JSON을 `examples/ideation-phase3.json`으로 저장하도록 안내한다.
5. WHEN 사용자가 3차 아이데이션에서 outcome/judgment를 변경하면, THE Skill SHALL 변경된 값을 이후 에피소드 JSON에 반영한다.
6. WHEN 사용자가 3차 아이데이션을 건너뛰겠다고 하면, THE Skill SHALL 즉시 Final_Arc 에피소드 작성을 진행한다.
7. THE Skill SHALL 3차 아이데이션 완료 후 Final_Arc 구간의 에피소드를 순차 작성한다.


---

### 요구사항 5: Ideation_Node와 에피소드 JSON 연결

**사용자 스토리:** 작가로서, 아이데이션에서 정의한 캐릭터·테마·플롯 아이디어가 실제 에피소드 JSON에 반영되었는지 추적하고 싶다.

#### 인수 기준

1. THE Skill SHALL 각 에피소드 JSON의 `story.ideation` 필드에 해당 회차와 관련된 Ideation_Node를 포함한다.
2. THE Skill SHALL 에피소드 JSON의 `ideation` 필드가 NCP_Schema의 `ideation` 오브젝트 구조(character, theme, plot, genre 배열)를 준수하도록 한다.
3. WHEN 에피소드가 특정 Ideation_Node를 직접 구현하는 경우, THE Skill SHALL 해당 Ideation_Node의 `notes` 필드에 구현 회차를 기록하도록 안내한다.
4. THE Skill SHALL 에피소드 JSON 출력 전 오류 방지 체크리스트에 "ideation 필드가 NCP_Schema를 준수하는가" 항목을 포함한다.

---

### 요구사항 6: 아이데이션 단계 전환 안내

**사용자 스토리:** 작가로서, 현재 어느 아이데이션 단계에 있는지 명확히 알고 싶다. 그래야 기획의 흐름을 놓치지 않을 수 있다.

#### 인수 기준

1. THE Skill SHALL 각 아이데이션 단계 시작 시 현재 단계(1차/2차/3차)와 해당 구간 회차 범위를 명시한다.
2. THE Skill SHALL 아이데이션 단계 전환 시점(Free_Episodes 종료, Final_Arc 시작)을 에피소드 작성 흐름 안에서 자동으로 감지하여 사용자에게 알린다.
3. WHEN 사용자가 아이데이션 단계를 건너뛰거나 되돌아가길 원하면, THE Skill SHALL 해당 요청을 수용하고 현재 상태를 안내한다.
4. THE Skill SHALL 시리즈 진행 상황(현재 회차 / 전체 회차, 현재 아이데이션 단계)을 각 회차 작성 시작 시 한 줄로 표시한다.

