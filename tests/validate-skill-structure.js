#!/usr/bin/env node
// validate-skill-structure.js
// SKILL.md 구조 검증 스크립트
// Feature: ncp-shortform-skill-upgrade

const fs = require('fs');
const path = require('path');

const SKILL_PATH = path.join(__dirname, '..', '.claude', 'skills', 'ncp-shortform', 'SKILL.md');

function check(label, content, pattern) {
    const found = typeof pattern === 'string'
        ? content.includes(pattern)
        : pattern.test(content);
    const status = found ? 'PASS' : 'FAIL';
    console.log(`  [${status}] ${label}`);
    return found;
}

let allPassed = true;

try {
    const content = fs.readFileSync(SKILL_PATH, 'utf8');
    console.log(`\n검증 대상: ${SKILL_PATH}\n`);

    console.log('── 1단계: Series_Config ──────────────────────────');
    allPassed &= check('total_episodes 항목 포함', content, 'total_episodes');
    allPassed &= check('phase1_end 항목 포함', content, 'phase1_end');
    allPassed &= check('final_arc_offset 항목 포함', content, 'final_arc_offset');
    allPassed &= check('기본값(10) 명시', content, '기본값');
    allPassed &= check('[시리즈 구간] 블록 포함', content, '[시리즈 구간]');
    allPassed &= check('유효성 검사 오류 메시지 포함', content, '구간 경계값이 올바르지 않습니다');

    console.log('\n── 2단계: 1차 아이데이션 ────────────────────────');
    allPassed &= check('1차 아이데이션 섹션 존재', content, '1차 아이데이션');
    allPassed &= check('character 탐색 항목 명시', content, 'character');
    allPassed &= check('theme 탐색 항목 명시', content, 'theme');
    allPassed &= check('plot 탐색 항목 명시', content, 'plot');
    allPassed &= check('genre 탐색 항목 명시', content, 'genre');
    allPassed &= check('p1_ id 네이밍 규칙 명시', content, 'p1_');
    allPassed &= check('ideation-phase1.json 저장 안내', content, 'ideation-phase1.json');

    console.log('\n── 3단계: Free_Episodes ──────────────────────────');
    allPassed &= check('[진행] 표시 형식 포함', content, '[진행]');
    allPassed &= check('story.ideation 필드 포함', content, 'story.ideation');
    allPassed &= check('schema_version 1.3.0 명시', content, '"1.3.0"');

    console.log('\n── 4단계: 2차 아이데이션 ────────────────────────');
    allPassed &= check('2차 아이데이션 섹션 존재', content, '2차 아이데이션');
    allPassed &= check('단계 전환 감지 조건 명시 (phase1_end 완료)', content, 'phase1_end');
    allPassed &= check('연속성 브리지 1차→2차 포함', content, '연속성 브리지: 1차 → 2차');
    allPassed &= check('p2_ id 네이밍 규칙 명시', content, 'p2_');
    allPassed &= check('ideation-phase2.json 저장 안내', content, 'ideation-phase2.json');
    allPassed &= check('2차 건너뜀 처리 포함', content, '2차 아이데이션을 건너뜁니다');

    console.log('\n── 5단계: Paid_Episodes ──────────────────────────');
    allPassed &= check('Paid_Episodes 섹션 존재', content, 'Paid_Episodes');
    allPassed &= check('현재 구간: 유료 예시 포함', content, '현재 구간: 유료');

    console.log('\n── 6단계: 3차 아이데이션 ────────────────────────');
    allPassed &= check('3차 아이데이션 섹션 존재', content, '3차 아이데이션');
    allPassed &= check('단계 전환 감지 조건 명시 (final_arc_offset)', content, 'final_arc_offset');
    allPassed &= check('연속성 브리지 1차+2차→3차 포함', content, '연속성 브리지: 1차+2차 → 3차');
    allPassed &= check('p3_ id 네이밍 규칙 명시', content, 'p3_');
    allPassed &= check('ideation-phase3.json 저장 안내', content, 'ideation-phase3.json');
    allPassed &= check('3차 건너뜀 처리 포함', content, '3차 아이데이션을 건너뜁니다');

    console.log('\n── 7단계: Final_Arc ──────────────────────────────');
    allPassed &= check('Final_Arc 섹션 존재', content, 'Final_Arc');
    allPassed &= check('현재 구간: 최종결말 예시 포함', content, '현재 구간: 최종결말');

    console.log('\n── 오류 방지 체크리스트 ──────────────────────────');
    allPassed &= check('ideation 항목 체크리스트 포함', content, 'story.ideation');

    console.log('\n' + '─'.repeat(50));
    if (allPassed) {
        console.log('PASS SKILL.md 구조 검증 통과\n');
        process.exit(0);
    } else {
        console.log('FAIL 일부 항목이 누락되었습니다\n');
        process.exit(1);
    }
} catch (err) {
    console.error(`오류: ${err.message}`);
    process.exit(1);
}
