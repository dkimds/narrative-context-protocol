#!/usr/bin/env node
'use strict';

/**
 * gen_pdf.js — NCP 에피소드 JSON → 드라마 기획서 PDF
 *
 * Usage:
 *   npm run pdf                          → 제목/파일명 ep01.json에서 자동 감지
 *   npm run pdf -- "제목"               → 제목 직접 지정, 파일명은 제목에서 자동
 *   npm run pdf -- "제목" "파일명.pdf"  → 제목과 파일명 모두 직접 지정
 *
 * Output: productions/{파일명}.pdf
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ── 상수 ─────────────────────────────────────────────────────────────────────

const FONT_PATH = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf';

const C = {
    ACCENT: '#B41E32',
    DARK:   '#1E1E1E',
    GRAY:   '#646464',
    LIGHT:  '#F5F5F5',
    WHITE:  '#FFFFFF',
    LINE:   '#DCDCDC',
    GREEN:  '#1E823C',
};

// A4: 595.28 × 841.89 pt
const PAGE_W  = 595.28;
const MARGIN  = 40;
const CW      = PAGE_W - MARGIN * 2; // content width = 515.28

const repoRoot       = path.join(__dirname, '..');
const productionsDir = path.join(repoRoot, 'productions');

// ── 유틸 ─────────────────────────────────────────────────────────────────────

function safe(v)  { return v != null ? String(v) : ''; }

function parseSeriesTitle(ep) {
    const title = safe(ep?.story?.title);
    const m = title.match(/^(.+?)\s+\d+회/);
    return m ? m[1].trim() : title.split('—')[0].trim();
}

function slugify(s) {
    return s.replace(/\s+/g, '-').replace(/[^\w가-힣\-]/g, '');
}

function loadEpisodes() {
    if (!fs.existsSync(productionsDir)) return [];
    return fs.readdirSync(productionsDir)
        .filter(f => /^ep\d+\.json$/.test(f))
        .sort()
        .map(f => JSON.parse(fs.readFileSync(path.join(productionsDir, f), 'utf8')));
}

function getOutcome(ep) {
    const dynamics = ep?.story?.narratives?.[0]?.subtext?.dynamics || [];
    return dynamics.find(d => d.dynamic === 'story_outcome')?.vector || '';
}

function outcomeColor(v) {
    return ['success', 'good', 'change'].includes(v) ? C.GREEN : C.ACCENT;
}

function getSubtitle(ep) {
    const t = safe(ep?.story?.title);
    return t.includes('—') ? t.split('—').pop().trim() : t;
}

function getFabricTime(moment) {
    for (const f of (moment.fabric || [])) {
        if (f.type === 'time') return `${f.limit}초`;
    }
    return '';
}

// ── PDF 헬퍼 ─────────────────────────────────────────────────────────────────

function sectionHeader(doc, text) {
    if (doc.y > 750) doc.addPage();
    doc.y += 6;
    doc.moveTo(MARGIN, doc.y)
       .lineTo(MARGIN + CW, doc.y)
       .lineWidth(1).strokeColor(C.ACCENT).stroke();
    doc.fillColor(C.ACCENT).font('B').fontSize(10)
       .text(text, MARGIN, doc.y + 2, { width: CW });
    doc.y += 6;
    doc.fillColor(C.DARK);
}

// ── 커버 페이지 ───────────────────────────────────────────────────────────────

function buildCover(doc, seriesTitle, genre, count) {
    // 상단 빨간 배너
    doc.rect(0, 0, PAGE_W, 160).fill(C.ACCENT);

    doc.fillColor(C.WHITE).font('B').fontSize(26)
       .text(seriesTitle, MARGIN, 36, { width: CW });

    doc.font('R').fontSize(11)
       .text(safe(genre), MARGIN, 82, { width: CW });

    // 본문
    doc.fillColor(C.DARK).font('R').fontSize(11);
    doc.text(
        `에피소드 묶음: 1회 – ${count}회\n` +
        `포맷: 숏폼 드라마 (vertical video, 90~120초/편)\n` +
        `스키마: NCP v1.2.0 (Narrative Context Protocol)`,
        MARGIN, 185, { width: CW, lineGap: 3 }
    );

    // 구분선
    doc.moveTo(MARGIN, 285).lineTo(MARGIN + CW, 285)
       .lineWidth(0.8).strokeColor(C.ACCENT).stroke();

    // 설명
    doc.fillColor(C.GRAY).font('R').fontSize(8.5);
    doc.text(
        '이 문서는 NCP JSON 에피소드 파일을 드라마 기획서 형식으로 변환한 것입니다.\n' +
        '각 에피소드는 기승전결 4개의 moment로 구성되며, subtext(서사 구조)와\n' +
        'storytelling(연출 구체화)으로 이중 레이어로 기술됩니다.',
        MARGIN, 296, { width: CW, lineGap: 2 }
    );
}

// ── arc 요약 페이지 ───────────────────────────────────────────────────────────

function buildArcSummary(doc, episodes) {
    doc.addPage();

    // 헤더 배너
    const bannerH = 36;
    const bannerY = doc.y;
    doc.rect(0, bannerY, PAGE_W, bannerH).fill(C.ACCENT);
    doc.fillColor(C.WHITE).font('B').fontSize(14)
       .text('시리즈 전체 아크', MARGIN, bannerY + 10, { width: CW });
    doc.y = bannerY + bannerH + 14;

    // 컬럼 너비 (pt): 회차 | 부제목 | 결말 | 로그라인
    const C0 = 44, C1 = 110, C2 = 58, C3 = CW - C0 - C1 - C2;
    const ROW_H = 36;

    // 컬럼 헤더
    const hdrY = doc.y;
    doc.rect(MARGIN, hdrY, CW, 18).fill('#F0F0F0');
    doc.fillColor(C.GRAY).font('B').fontSize(7.5);
    doc.text('회차',    MARGIN + 3,            hdrY + 5, { width: C0 - 4,   lineBreak: false });
    doc.text('부제목',  MARGIN + C0 + 2,        hdrY + 5, { width: C1 - 4,   lineBreak: false });
    doc.text('결말',    MARGIN + C0+C1 + 2,     hdrY + 5, { width: C2 - 4,   lineBreak: false });
    doc.text('로그라인',MARGIN + C0+C1+C2 + 2,  hdrY + 5, { width: C3 - 4,   lineBreak: false });
    doc.y = hdrY + 20;

    // 행 (row)
    episodes.forEach((ep, i) => {
        if (doc.y > 770) doc.addPage();
        const rowY = doc.y;
        const outcome = getOutcome(ep);
        const barColor = outcomeColor(outcome);
        const bg = i % 2 === 0 ? C.WHITE : '#FAF8FC';
        const subtitle = getSubtitle(ep);
        const logline  = safe(ep.story?.logline);

        doc.rect(MARGIN, rowY, CW, ROW_H).fill(bg);
        doc.rect(MARGIN, rowY, 3, ROW_H).fill(barColor);

        // 회차
        doc.fillColor(barColor).font('B').fontSize(9)
           .text(`${i+1}회`, MARGIN + 6, rowY + 12, { width: C0 - 8, lineBreak: false });

        // 부제목
        doc.fillColor(C.DARK).font('B').fontSize(8.5)
           .text(subtitle, MARGIN + C0 + 2, rowY + 10, {
               width: C1 - 4, height: ROW_H - 6, ellipsis: true, lineBreak: false
           });

        // 결말
        doc.fillColor(barColor).font('R').fontSize(8)
           .text(outcome, MARGIN + C0 + C1 + 2, rowY + 12, { width: C2 - 4, lineBreak: false });

        // 로그라인 (최대 2줄)
        doc.fillColor(C.DARK).font('R').fontSize(8)
           .text(logline, MARGIN + C0 + C1 + C2 + 2, rowY + 5, {
               width: C3 - 4, height: ROW_H - 8, ellipsis: true
           });

        // 하단 구분선
        doc.moveTo(MARGIN, rowY + ROW_H)
           .lineTo(MARGIN + CW, rowY + ROW_H)
           .lineWidth(0.2).strokeColor(C.LINE).stroke();

        doc.y = rowY + ROW_H;
    });

    doc.y += 12;
}

// ── 에피소드 페이지 ───────────────────────────────────────────────────────────

function buildEpisodePage(doc, data) {
    doc.addPage();

    const story    = data.story;
    const narrative = story.narratives[0];
    const sub = narrative.subtext;
    const st  = narrative.storytelling;

    const title    = safe(story.title);
    const logline  = safe(story.logline);
    const duration = story.target_duration_seconds || 0;
    const moments  = st.moments || [];
    const dynamics = sub.dynamics || [];
    const storybeats = sub.storybeats || [];

    // ── 에피소드 헤더 배너 ─────────────────────────────────────────────────────
    const bannerY = doc.y;
    const bannerH = 36;
    doc.rect(0, bannerY, PAGE_W, bannerH).fill(C.ACCENT);
    doc.fillColor(C.WHITE).font('B').fontSize(13)
       .text(title, MARGIN, bannerY + 10, { width: CW });
    doc.y = bannerY + bannerH + 6;

    // 목표 시간
    doc.fillColor(C.GRAY).font('R').fontSize(8)
       .text(`목표 시간: ${duration}초`, MARGIN, doc.y, { width: CW });
    doc.y += 10;

    // ── 로그라인 박스 ──────────────────────────────────────────────────────────
    const logY = doc.y;
    doc.rect(MARGIN, logY, CW, 26).fill(C.LIGHT);
    doc.fillColor(C.ACCENT).font('B').fontSize(7.5)
       .text('LOGLINE', MARGIN + 4, logY + 3, { width: CW - 8, lineBreak: false });
    doc.fillColor(C.DARK).font('R').fontSize(8.5)
       .text(logline, MARGIN + 4, logY + 13, { width: CW - 8, lineBreak: false });
    doc.y = logY + 30;

    // ── 기승전결 ───────────────────────────────────────────────────────────────
    sectionHeader(doc, '기승전결 구성');

    const ACT_BG = ['#DCF5DC', '#DCEBFA', '#FFF5DC', '#F5DCEB'];

    moments.forEach((m, mi) => {
        if (doc.y > 730) doc.addPage();

        const bg = ACT_BG[mi % 4];
        const label     = safe(m.summary);
        const timeLimit = getFabricTime(m);
        const synopsis  = safe(m.synopsis);
        const setting   = safe(m.setting);
        const timing    = safe(m.timing);
        const imp       = safe(m.imperatives);

        const boxStartY = doc.y;

        // 박스 배경 (높이는 나중에 알 수 없으므로 먼저 내용 출력 후 선 그리기)
        doc.save();

        // 제목 줄
        doc.fillColor(C.DARK).font('B').fontSize(9)
           .text(label, MARGIN + 4, boxStartY + 4, { width: CW - 60, lineBreak: false });

        if (timeLimit) {
            doc.fillColor(C.GRAY).font('R').fontSize(8)
               .text(timeLimit, MARGIN + CW - 36, boxStartY + 4, { width: 34, align: 'right', lineBreak: false });
        }

        doc.y = boxStartY + 16;

        // 장소 + 타이밍
        const info = [setting, timing].filter(Boolean).join('  |  ');
        if (info) {
            doc.fillColor(C.GRAY).font('R').fontSize(7.5)
               .text(info, MARGIN + 4, doc.y, { width: CW - 8 });
            doc.y += 2;
        }

        // 시놉시스
        if (synopsis) {
            doc.fillColor(C.DARK).font('R').fontSize(8.5)
               .text(synopsis, MARGIN + 4, doc.y, { width: CW - 8 });
            doc.y += 2;
        }

        // 연출 노트
        if (imp) {
            doc.fillColor('#785020').font('R').fontSize(7.5)
               .text(`[연출] ${imp}`, MARGIN + 4, doc.y, { width: CW - 8 });
            doc.y += 2;
        }

        const boxEndY = doc.y + 4;
        doc.restore();

        // 박스 배경 (사후에 그려서 텍스트 뒤로 보내는 대신, 먼저 그리고 텍스트 다시 출력)
        // — pdfkit은 레이어 개념 없음. 배경을 먼저 칠해야 하므로 2패스 방식 사용
        // 간단히: 배경 먼저 그리기 위해 save/restore + beginText 사용
        // → 대신 배경에 반투명 색상을 쓰거나, 배경만 미리 그리는 방식을 채택.

        // 실용적 해결: doc.y를 저장하고 배경 먼저, 텍스트 나중
        // pdfkit PDF는 draw order = layering 이므로 아래 방식이 맞음:
        // 1) rect 그리기 (배경)  2) 텍스트 그리기
        // 이미 텍스트를 먼저 그렸으므로 테두리(stroke)만 추가
        const boxH = boxEndY - boxStartY;
        doc.rect(MARGIN, boxStartY, CW, boxH)
           .lineWidth(0.3).strokeColor(C.LINE).stroke();

        doc.y = boxEndY + 4;
    });

    // ── 서사 다이나믹 ─────────────────────────────────────────────────────────
    if (dynamics.length > 0) {
        if (doc.y > 740) doc.addPage();
        sectionHeader(doc, '서사 다이나믹');

        dynamics.forEach(d => {
            if (doc.y > 760) doc.addPage();
            const vec = safe(d.vector);
            const vc  = outcomeColor(vec);
            const dy  = doc.y;

            doc.fillColor(vc).font('B').fontSize(8)
               .text(`${d.dynamic} [${vec}]`, MARGIN, dy, { width: 140, lineBreak: false });
            doc.fillColor(C.DARK).font('R').fontSize(8)
               .text(safe(d.summary), MARGIN + 144, dy, { width: CW - 144 });
            doc.y += 4;
        });
    }

    // ── 스토리비트 ────────────────────────────────────────────────────────────
    if (storybeats.length > 0) {
        if (doc.y > 720) doc.addPage();
        sectionHeader(doc, '스토리비트');

        storybeats.forEach(b => {
            if (doc.y > 750) doc.addPage();
            const bY = doc.y;
            doc.rect(MARGIN, bY, CW, 32).fill('#EBEBF5');
            doc.fillColor(C.DARK).font('B').fontSize(7)
               .text(
                   `scope:${b.scope}  seq:${b.sequence}  nf:${b.narrative_function}`,
                   MARGIN + 3, bY + 3, { width: CW - 6, lineBreak: false }
               );
            doc.fillColor(C.DARK).font('R').fontSize(7.5)
               .text(safe(b.summary), MARGIN + 3, bY + 13, { width: CW - 6, height: 16, ellipsis: true });
            doc.y = bY + 36;
        });
    }

    // 하단 구분선
    if (doc.y < 820) {
        doc.moveTo(MARGIN, doc.y + 2)
           .lineTo(MARGIN + CW, doc.y + 2)
           .lineWidth(0.3).strokeColor(C.LINE).stroke();
    }
}

// ── 등장인물 페이지 ───────────────────────────────────────────────────────────

function collectAllPlayers(episodes) {
    const seen = new Set();
    const result = [];
    for (const ep of episodes) {
        const ps = ep?.story?.narratives?.[0]?.subtext?.players || [];
        for (const p of ps) {
            if (!seen.has(p.id)) {
                seen.add(p.id);
                result.push(p);
            }
        }
    }
    const order = { protagonist: 0, influence_character: 1 };
    return result.sort((a, b) => (order[a.role] ?? 2) - (order[b.role] ?? 2));
}

const ROLE_LABEL = {
    protagonist:         '주인공',
    influence_character: '인플루언스 캐릭터',
    supporting:          '조연',
};

function roleColor(role) {
    if (role === 'protagonist')         return C.ACCENT;
    if (role === 'influence_character') return '#3C64A0';
    return C.GRAY;
}

function buildCharacterPage(doc, episodes) {
    doc.addPage();

    const bannerY = doc.y;
    const bannerH = 36;
    doc.rect(0, bannerY, PAGE_W, bannerH).fill(C.ACCENT);
    doc.fillColor(C.WHITE).font('B').fontSize(14)
       .text('등장인물', MARGIN, bannerY + 10, { width: CW });
    doc.y = bannerY + bannerH + 16;

    const players = collectAllPlayers(episodes);
    const LW = 28; // 레이블 열 너비
    const TW = CW - LW - 8; // 텍스트 열 너비

    players.forEach(p => {
        if (doc.y > 700) doc.addPage();

        const rc = roleColor(p.role);
        const label = ROLE_LABEL[p.role] || p.role;
        const cardStartY = doc.y;

        // ── 이름 배지 ─────────────────────────────────────────────────────────
        doc.rect(MARGIN, cardStartY, CW, 18).fill(rc);
        doc.fillColor(C.WHITE).font('B').fontSize(10)
           .text(p.name, MARGIN + 6, cardStartY + 3, { width: 120, lineBreak: false });
        doc.fillColor(C.WHITE).font('R').fontSize(8)
           .text(label, MARGIN + 130, cardStartY + 5, { width: CW - 136, lineBreak: false });
        doc.y = cardStartY + 22;

        // ── 외형 ─────────────────────────────────────────────────────────────
        const visual = safe(p.visual);
        if (visual) {
            const vy = doc.y;
            doc.fillColor(C.GRAY).font('B').fontSize(7.5)
               .text('외형', MARGIN + 4, vy, { width: LW, lineBreak: false });
            doc.fillColor(C.DARK).font('R').fontSize(8)
               .text(visual, MARGIN + 4 + LW, vy, { width: TW });
            if (doc.y < vy + 10) doc.y = vy + 10;
        }

        // ── 목소리 ───────────────────────────────────────────────────────────
        const audio = safe(p.audio);
        if (audio) {
            const ay = doc.y;
            doc.fillColor(C.GRAY).font('B').fontSize(7.5)
               .text('목소리', MARGIN + 4, ay, { width: LW, lineBreak: false });
            doc.fillColor(C.DARK).font('R').fontSize(8)
               .text(audio, MARGIN + 4 + LW, ay, { width: TW });
            if (doc.y < ay + 10) doc.y = ay + 10;
        }

        // ── 소개 ─────────────────────────────────────────────────────────────
        const summary = safe(p.summary);
        if (summary) {
            const sy = doc.y;
            doc.fillColor(C.GRAY).font('B').fontSize(7.5)
               .text('소개', MARGIN + 4, sy, { width: LW, lineBreak: false });
            doc.fillColor(C.DARK).font('R').fontSize(8)
               .text(summary, MARGIN + 4 + LW, sy, { width: TW });
            if (doc.y < sy + 10) doc.y = sy + 10;
        }

        // 하단 여백 + 구분선
        doc.y += 6;
        doc.moveTo(MARGIN, doc.y)
           .lineTo(MARGIN + CW, doc.y)
           .lineWidth(0.2).strokeColor(C.LINE).stroke();
        doc.y += 10;
    });
}

// ── 메인 ─────────────────────────────────────────────────────────────────────

function main() {
    const episodes = loadEpisodes();
    if (episodes.length === 0) {
        console.error('Error: productions/ 디렉토리에 ep*.json 파일이 없습니다.');
        process.exit(1);
    }

    // CLI 인수 처리
    const argTitle  = process.argv[2]; // "제목"
    const argOutput = process.argv[3]; // "파일명.pdf" (선택)

    const seriesTitle = argTitle || parseSeriesTitle(episodes[0]);
    const genre       = safe(episodes[0].story?.genre);

    let outputFile;
    if (argOutput) {
        outputFile = argOutput.endsWith('.pdf') ? argOutput : `${argOutput}.pdf`;
    } else {
        outputFile = `${slugify(seriesTitle)}.pdf`;
    }
    const outputPath = path.join(productionsDir, outputFile);

    console.log(`시리즈: ${seriesTitle}`);
    console.log(`에피소드: ${episodes.length}편`);
    console.log(`출력: ${outputPath}`);

    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, autoFirstPage: true });

    // 폰트 등록 (Arial Unicode — macOS 기본 TTF, 한국어 지원)
    if (!fs.existsSync(FONT_PATH)) {
        console.error(`폰트 파일 없음: ${FONT_PATH}`);
        console.error('macOS 기본 폰트가 필요합니다.');
        process.exit(1);
    }
    doc.registerFont('R', FONT_PATH);
    doc.registerFont('B', FONT_PATH); // bold 별도 파일 없음: 동일 파일 사용

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // 표지
    buildCover(doc, seriesTitle, genre, episodes.length);

    // 등장인물
    buildCharacterPage(doc, episodes);

    // arc 요약
    buildArcSummary(doc, episodes);

    // 에피소드별 페이지
    for (const ep of episodes) {
        buildEpisodePage(doc, ep);
    }

    doc.end();
    stream.on('finish', () => {
        console.log('PDF 생성 완료.');
    });
    stream.on('error', (err) => {
        console.error('PDF 저장 오류:', err.message);
        process.exit(1);
    });
}

main();
