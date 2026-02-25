#!/usr/bin/env python3
"""Generate a drama planning PDF from ep01~ep10 NCP JSON files."""

import json
import os
from fpdf import FPDF

FONT_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
EXAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "productions")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "productions", "mafia-king-ep01-10.pdf")

ACCENT = (180, 30, 50)     # deep red
DARK   = (30, 30, 30)
GRAY   = (100, 100, 100)
LIGHT  = (245, 245, 245)
WHITE  = (255, 255, 255)
LINE   = (220, 220, 220)
GREEN  = (30, 130, 60)


class DramaPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.add_font("SDGothic", "", FONT_PATH)
        self.add_font("SDGothic", "B", FONT_PATH)
        self.set_auto_page_break(auto=True, margin=18)

    # ── helpers ──────────────────────────────────────────────────────────────

    def _safe(self, txt):
        return str(txt) if txt else ""

    def _wrap_text(self, txt, font_size, max_w):
        self.set_font("SDGothic", size=font_size)
        words = txt.split()
        lines, cur = [], ""
        for w in words:
            test = (cur + " " + w).strip()
            if self.get_string_width(test) <= max_w:
                cur = test
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines if lines else [""]

    def cell_wrapped(self, x, y, w, txt, font_size=9, color=None, bold=False):
        if color:
            self.set_text_color(*color)
        style = "B" if bold else ""
        self.set_font("SDGothic", style=style, size=font_size)
        lines = self._wrap_text(self._safe(txt), font_size, w - 2)
        lh = font_size * 0.45
        for line in lines:
            self.set_xy(x, y)
            self.cell(w, lh, line, ln=0)
            y += lh
        self.set_text_color(*DARK)
        return y + 1

    # ── cover page ────────────────────────────────────────────────────────────

    def cover(self, series_title, genre, total_episodes):
        self.add_page()
        self.set_fill_color(*ACCENT)
        self.rect(0, 0, 210, 60, "F")

        self.set_text_color(*WHITE)
        self.set_font("SDGothic", style="B", size=22)
        self.set_xy(15, 16)
        self.cell(180, 12, self._safe(series_title), ln=1)

        self.set_font("SDGothic", size=10)
        self.set_xy(15, 30)
        self.cell(180, 8, self._safe(genre), ln=1)

        self.set_text_color(*DARK)
        self.set_font("SDGothic", size=11)
        self.set_xy(15, 68)
        self.multi_cell(180, 7, f"에피소드 묶음: 1회 – {total_episodes}회\n"
                        "포맷: 숏폼 드라마 (vertical video, 90~120초/편)\n"
                        "스키마: NCP v1.2.0 (Narrative Context Protocol)")

        self.set_draw_color(*ACCENT)
        self.set_line_width(0.6)
        self.line(15, 105, 195, 105)

        self.set_font("SDGothic", size=9)
        self.set_text_color(*GRAY)
        self.set_xy(15, 108)
        self.multi_cell(180, 6,
            "이 문서는 NCP JSON 에피소드 파일(ep01~ep10)을 드라마 기획서 형식으로 변환한 것입니다.\n"
            "각 에피소드는 기승전결 4개의 moment로 구성되며, subtext(서사 구조)와\n"
            "storytelling(연출 구체화)으로 이중 레이어로 기술됩니다.")

    # ── arc summary page ──────────────────────────────────────────────────────

    def arc_summary_page(self, episodes):
        self.add_page()

        # header
        self.set_fill_color(*ACCENT)
        self.rect(0, self.get_y(), 210, 14, "F")
        self.set_text_color(*WHITE)
        self.set_font("SDGothic", style="B", size=13)
        self.set_xy(15, self.get_y() + 2)
        self.cell(180, 10, "시리즈 전체 아크: 1~10회 흐름", ln=1)
        self.set_y(self.get_y() + 4)

        # column widths: 회차(18) | 부제목(38) | outcome(22) | 로그라인(rest)
        lm = 15
        pw = 180
        c0, c1, c2, c3 = 18, 38, 22, pw - 18 - 38 - 22  # 104

        # column header row
        self.set_fill_color(240, 240, 240)
        self.rect(lm, self.get_y(), pw, 6, "F")
        self.set_font("SDGothic", style="B", size=7.5)
        self.set_text_color(*GRAY)
        y = self.get_y() + 0.5
        for cx, cw, label in [
            (lm,          c0, "회차"),
            (lm+c0,       c1, "부제목"),
            (lm+c0+c1,    c2, "결말"),
            (lm+c0+c1+c2, c3, "로그라인"),
        ]:
            self.set_xy(cx + 1, y)
            self.cell(cw - 2, 5, label, ln=0)
        self.set_y(self.get_y() + 7)

        # rows
        row_colors = [(255, 255, 255), (250, 248, 252)]
        for i, ep_data in enumerate(episodes):
            story = ep_data["story"]
            ep_num = i + 1

            # extract subtitle after last "—"
            raw_title = story.get("title", "")
            subtitle = raw_title.split("—")[-1].strip() if "—" in raw_title else raw_title

            logline = self._safe(story.get("logline", ""))
            dynamics = story["narratives"][0]["subtext"].get("dynamics", [])
            outcome = next(
                (d.get("vector", "") for d in dynamics if d.get("dynamic") == "story_outcome"),
                ""
            )

            # row height based on logline length
            self.set_font("SDGothic", size=8)
            log_lines = len(self._wrap_text(logline, 8, c3 - 4))
            row_h = max(7, log_lines * 3.8 + 3)

            row_y = self.get_y()
            self.set_fill_color(*row_colors[i % 2])
            self.rect(lm, row_y, pw, row_h, "F")

            # subtle left accent bar for outcome
            bar_color = GREEN if outcome in ("success", "good") else ACCENT if outcome == "failure" else GRAY
            self.set_fill_color(*bar_color)
            self.rect(lm, row_y, 2, row_h, "F")

            # 회차
            self.set_font("SDGothic", style="B", size=8)
            self.set_text_color(*bar_color)
            self.set_xy(lm + 3, row_y + (row_h - 4) / 2)
            self.cell(c0 - 3, 4, f"{ep_num}회", ln=0)

            # 부제목
            self.set_font("SDGothic", style="B", size=8)
            self.set_text_color(*DARK)
            self.set_xy(lm + c0, row_y + (row_h - 4) / 2)
            self.cell(c1 - 2, 4, subtitle, ln=0)

            # outcome badge
            self.set_font("SDGothic", size=7.5)
            self.set_text_color(*bar_color)
            self.set_xy(lm + c0 + c1 + 1, row_y + (row_h - 4) / 2)
            self.cell(c2 - 2, 4, outcome, ln=0)

            # 로그라인 (wrapped)
            self.cell_wrapped(
                lm + c0 + c1 + c2 + 1,
                row_y + 1.5,
                c3 - 2,
                logline,
                font_size=8,
                color=DARK,
            )

            # row border
            self.set_draw_color(*LINE)
            self.set_line_width(0.1)
            self.line(lm, row_y + row_h, lm + pw, row_y + row_h)

            self.set_y(row_y + row_h)

        self.set_y(self.get_y() + 4)

    # ── episode page ──────────────────────────────────────────────────────────

    def episode_page(self, data):
        story = data["story"]
        narrative = story["narratives"][0]
        sub = narrative["subtext"]
        st  = narrative["storytelling"]

        title    = self._safe(story.get("title", ""))
        logline  = self._safe(story.get("logline", ""))
        genre    = self._safe(story.get("genre", ""))
        duration = story.get("target_duration_seconds", 0)
        moments  = st.get("moments", [])
        players  = sub.get("players", [])
        dynamics = sub.get("dynamics", [])
        storybeats = sub.get("storybeats", [])

        self.add_page()
        pw = 180
        lm = 15

        # ── episode header bar ───────────────────────────────────────────────
        self.set_fill_color(*ACCENT)
        self.rect(0, self.get_y(), 210, 14, "F")
        self.set_text_color(*WHITE)
        self.set_font("SDGothic", style="B", size=13)
        self.set_xy(lm, self.get_y() + 2)
        self.cell(pw, 10, title, ln=1)
        self.set_y(self.get_y() + 3)

        # ── meta + logline ────────────────────────────────────────────────────
        self.set_font("SDGothic", size=8)
        self.set_text_color(*GRAY)
        self.set_x(lm)
        self.cell(pw, 5, f"목표 시간: {duration}초", ln=1)

        self.set_fill_color(*LIGHT)
        y0 = self.get_y()
        self.rect(lm, y0, pw, 11, "F")
        self.set_text_color(*ACCENT)
        self.set_font("SDGothic", style="B", size=7.5)
        self.set_xy(lm + 2, y0 + 1)
        self.cell(18, 4.5, "LOGLINE", ln=0)
        self.set_text_color(*DARK)
        self.set_font("SDGothic", size=8.5)
        self.set_xy(lm + 2, y0 + 6)
        self.cell(pw - 4, 4.5, logline, ln=1)
        self.set_y(y0 + 13)

        # ── section: 기승전결 (FIRST — most important) ─────────────────────────
        self._section_title("기승전결 구성")
        act_colors = [
            (220, 245, 220),  # 기
            (220, 235, 250),  # 승
            (255, 245, 220),  # 전
            (245, 220, 230),  # 결
        ]
        for mi, m in enumerate(moments):
            if self.get_y() > 260:
                self.add_page()
            bg = act_colors[mi % 4]
            label = m.get("summary", f"moment {mi+1}")
            duration_limit = ""
            for fab in m.get("fabric", []):
                if fab.get("type") == "duration":
                    duration_limit = f"{fab['limit']}초"

            box_y = self.get_y()
            synopsis_lines = len(self._wrap_text(m.get("synopsis", ""), 8.5, pw - 10))
            imp_lines = len(self._wrap_text(m.get("imperatives", ""), 7.5, pw - 10))
            box_h = 8 + synopsis_lines * 4 + imp_lines * 3.5 + 10

            self.set_fill_color(*bg)
            self.set_draw_color(*LINE)
            self.set_line_width(0.15)
            self.rect(lm, box_y, pw, box_h, "FD")

            self.set_text_color(*DARK)
            self.set_font("SDGothic", style="B", size=9)
            self.set_xy(lm + 3, box_y + 2)
            self.cell(120, 5, label, ln=0)
            if duration_limit:
                self.set_font("SDGothic", size=7.5)
                self.set_text_color(*GRAY)
                self.set_xy(lm + pw - 22, box_y + 2)
                self.cell(20, 5, duration_limit, align="R", ln=0)
            y = box_y + 8

            setting = m.get("setting", "")
            timing  = m.get("timing", "")
            if setting or timing:
                info = "  |  ".join(filter(None, [setting, timing]))
                y = self.cell_wrapped(lm + 3, y, pw - 6, info, font_size=7.5, color=GRAY)

            synopsis = m.get("synopsis", "")
            if synopsis:
                y = self.cell_wrapped(lm + 3, y, pw - 6, synopsis, font_size=8.5, color=DARK)

            imp = m.get("imperatives", "")
            if imp:
                y = self.cell_wrapped(lm + 3, y, pw - 6, f"[연출] {imp}", font_size=7.5, color=(120, 80, 30))

            self.set_y(box_y + box_h + 2)

        # ── section: 인물 (compact) ────────────────────────────────────────────
        self._section_title("인물")
        self._render_players_compact(players, lm, pw)

        # ── section: 서사 다이나믹 (summary only) ─────────────────────────────
        self._section_title("서사 다이나믹")
        for d in dynamics:
            y = self.get_y()
            vec = d.get("vector", "")
            vec_color = GREEN if vec in ("change", "success", "good") else ACCENT
            self.set_font("SDGothic", style="B", size=8)
            self.set_text_color(*vec_color)
            self.set_xy(lm, y)
            self.cell(46, 5, f"{d.get('dynamic', '')} [{vec}]", ln=0)
            self.set_font("SDGothic", size=8)
            self.set_text_color(*DARK)
            self.set_xy(lm + 47, y)
            self.cell(pw - 47, 5, d.get("summary", ""), ln=1)
            self.set_y(self.get_y() + 1)

        # ── section: 스토리비트 ───────────────────────────────────────────────
        self._section_title("스토리비트")
        for b in storybeats:
            y = self.get_y()
            self.set_fill_color(235, 235, 245)
            self.set_draw_color(*LINE)
            self.rect(lm, y, pw, 13, "FD")
            self.set_font("SDGothic", style="B", size=7)
            self.set_text_color(*DARK)
            self.set_xy(lm + 2, y + 1)
            meta = (f"scope:{b.get('scope','')}  seq:{b.get('sequence','')}  "
                    f"signpost:{b.get('signpost','')}  throughline:{b.get('throughline','')}  "
                    f"nf:{b.get('narrative_function','')}")
            self.cell(pw - 4, 4.5, meta, ln=1)
            self.set_font("SDGothic", size=7)
            self.set_xy(lm + 2, y + 7)
            self.multi_cell(pw - 4, 4, b.get("summary", ""))
            self.set_y(y + 15)

        # ── footer line ──────────────────────────────────────────────────────
        self.set_draw_color(*LINE)
        self.line(lm, self.get_y() + 1, lm + pw, self.get_y() + 1)
        self.set_y(self.get_y() + 3)

    def _render_players_compact(self, players, lm, pw):
        """Compact 2-column player cards: role+name badge + audio only."""
        col_w = pw / 2 - 2
        col_x = [lm, lm + col_w + 4]
        box_h = 14

        for i, p in enumerate(players):
            cx = col_x[i % 2]
            if i % 2 == 0:
                row_y = self.get_y()

            self.set_fill_color(250, 250, 250)
            self.set_draw_color(*LINE)
            self.set_line_width(0.15)
            self.rect(cx, row_y, col_w, box_h, "FD")

            # role badge
            role_color = ACCENT if "Main" in p.get("role", "") else (60, 100, 160)
            self.set_fill_color(*role_color)
            self.rect(cx + 1, row_y + 1, col_w - 2, 4.5, "F")
            self.set_text_color(*WHITE)
            self.set_font("SDGothic", size=6.5)
            self.set_xy(cx + 2, row_y + 1)
            self.cell(col_w - 3, 4.5, f"{p.get('role', '')}  {p.get('name', '')}", ln=0)

            # audio
            self.set_text_color(*DARK)
            self.set_font("SDGothic", size=7.5)
            self.set_xy(cx + 2, row_y + 7)
            audio = self._safe(p.get("audio", ""))
            self.cell(col_w - 3, 4.5, audio[:60] + ("…" if len(audio) > 60 else ""), ln=0)

            if i % 2 == 1:
                self.set_y(row_y + box_h + 2)

        # odd number of players: advance past last row
        if len(players) % 2 == 1:
            self.set_y(row_y + box_h + 2)
        else:
            self.set_y(self.get_y() + 2)

    def _section_title(self, text):
        if self.get_y() > 265:
            self.add_page()
        self.set_y(self.get_y() + 2)
        self.set_draw_color(*ACCENT)
        self.set_line_width(0.5)
        y = self.get_y()
        self.line(15, y, 195, y)
        self.set_font("SDGothic", style="B", size=9)
        self.set_text_color(*ACCENT)
        self.set_xy(15, y + 1)
        self.cell(180, 5, text, ln=1)
        self.set_text_color(*DARK)
        self.set_y(self.get_y() + 1)

    def footer(self):
        self.set_y(-12)
        self.set_font("SDGothic", size=7)
        self.set_text_color(*GRAY)
        self.cell(0, 5, f"마피아 킹 – 왕의 아이를 가진 여자  |  NCP v1.2.0  |  {self.page_no()}", align="C")


def main():
    pdf = DramaPDF()
    pdf.set_margins(15, 15, 15)

    episodes = []
    for i in range(1, 11):
        path = os.path.join(EXAMPLES_DIR, f"ep{i:02d}.json")
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                episodes.append(json.load(f))

    if not episodes:
        print("No episode files found.")
        return

    series_title = "마피아 킹 – 왕의 아이를 가진 여자"
    genre = episodes[0]["story"].get("genre", "")

    pdf.cover(series_title, genre, len(episodes))
    pdf.arc_summary_page(episodes)

    for ep_data in episodes:
        pdf.episode_page(ep_data)

    pdf.output(OUTPUT_PATH)
    print(f"PDF saved: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
