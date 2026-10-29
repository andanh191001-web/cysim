#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CySim — tools/i18n_scan.py
Bộ quét dùng chung cho tools/gen_translations.py và tools/check_i18n.py.

LÀ GÌ   : Thư viện, KHÔNG chạy một mình (không có __main__) — hai file kia
         import scan() từ đây.
CHẠY    : scan(root) đọc index.html + mọi file trong js/ theo ngôi thứ ba.
QUY ƯỚC : chỉ lấy CHUỖI NGUỒN trong mã nguồn. Chú thích (//, /* */, <!-- -->)
         không bao giờ được đưa vào từ điển, nên viết tài liệu tiếng Việt dài
         trong đầu file thoải mái — thêm chữ mới vào code là lệnh dịch tự thấy.

Nhiệm vụ: tìm mọi chuỗi tiếng Việt mà ứng dụng có thể hiển thị, bao gồm
  1. văn bản tĩnh + placeholder/title/aria-label trong index.html
  2. mọi chuỗi động khai báo bằng data-i18n-src
  3. chuỗi trong TOÀN BỘ file js/ (kể cả những chuỗi nằm trong mảng rồi mới
     được t(...) — vì vậy mới bắt được chuỗi chưa ai bọc t())

Không có bước nào phải gõ tay danh sách chuỗi: thêm chữ mới vào code là lệnh
dịch tự thấy.
"""

from __future__ import annotations

import re
from html.parser import HTMLParser
from pathlib import Path

# Ký tự có dấu của tiếng Việt (LaTeX 1 + Latin Extended A/B)
VI_LETTER = re.compile(r"[\u00C0-\u00FF\u0102-\u01B0\u1EA0-\u1EFF]")
ANY_LETTER = re.compile(r"[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]")

# Nội dung của những thẻ này không bao giờ là chữ hiển thị trên màn hình.
# "head" cố tình không nằm trong danh sách: nó chỉ chứa meta/link/style/script
# và <title>, mà tiêu đề tab thì ĐƯỢC hiển thị, nên phải giữ lại.
DROP_TAGS = {"script", "style", "noscript", "svg"}

# Thuộc tính mà trình duyệt hiển thị dưới dạng chữ (tooltip, ô gợi ý).
ATTR_TEXT_KEYS = ("placeholder", "title", "aria-label")

# Nguyên hàm dịch chuỗi động. Chuỗi nằm trong tham số của chúng luôn an toàn.
TRANSLATE_FNS = ("t", "tr")


def keep(s: str) -> bool:
    """Lọc chuỗi vô nghĩa: quá ngắn/dài, toàn số, toàn ký hiệu."""
    s = s.strip()
    if len(s) < 2 or len(s) > 400:
        return False
    if not ANY_LETTER.search(s):
        return False
    if re.fullmatch(r"[\W\d_]+", s):
        return False
    return True


def normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


# ---------------------------------------------------------------- Escapes ----
_SIMPLE_ESCAPE = {
    "n": "\n", "t": "\t", "r": "\r", "f": "\f", "v": "\v", "b": "\b", "0": "\0",
}


def decode_escapes(text: str) -> str:
    """Trả về ĐÚNG chuỗi mà engine JS nhìn thấy lúc chạy.

    Đây là lỗi mà bộ quét cũ tự gây ra: nó giữ nguyên hai ký tự \\" trong
    chuỗi nguồn, nên từ điển sinh ra chứa khoá 'Vinh danh \\"Top 10..."' trong
    khi lúc chạy app lại tra bằng 'Vinh danh "Top 10..."'. Khoá không khớp nghĩa
    là chuỗi đó hiện tiếng Việt trên mọi ngôn ngữ khác mà không ai thấy trong
    báo cáo "thiếu" — vì báo cáo vẫn đếm nó là đã dịch. \n cũng vậy: \n trong
    mã là một ký tự xuống dòng, không phải hai ký tự.
    """
    out: list[str] = []
    i, n = 0, len(text)
    while i < n:
        c = text[i]
        if c != "\\" or i + 1 >= n:
            out.append(c)
            i += 1
            continue
        nxt = text[i + 1]
        if nxt in _SIMPLE_ESCAPE:
            out.append(_SIMPLE_ESCAPE[nxt])
            i += 2
            continue
        if nxt == "u":
            if i + 2 < n and text[i + 2] == "{":
                close = text.find("}", i + 3)
                if close > 0:
                    try:
                        out.append(chr(int(text[i + 3:close], 16)))
                        i = close + 1
                        continue
                    except ValueError:
                        pass
            elif i + 6 <= n:
                try:
                    out.append(chr(int(text[i + 2:i + 6], 16)))
                    i += 6
                    continue
                except ValueError:
                    pass
        if nxt == "x" and i + 4 <= n:
            try:
                out.append(chr(int(text[i + 2:i + 4], 16)))
                i += 4
                continue
            except ValueError:
                pass
        out.append(nxt)  # \" \' \` \\ và mọi escape lạ: giữ chính ký tự đó
        i += 2
    return "".join(out)


# ---------------------------------------------------------------- HTML ----
class _HtmlTextParser(HTMLParser):
    """Sinh ra đúng một mảnh văn bản cho mỗi text node mà trình duyệt tạo ra.

    Không dùng regex để cắt tag: index.html có thuộc tính chứa markup thật,
    ví dụ data-xss-payload="<svg/onload=...>". Regex nhận nhầm mảnh đó là thẻ
    <svg> rồi ăn tới </svg> gần nhất, xoá sạch hàng trăm dòng giao diện khỏi
    danh sách chuỗi cần dịch. HTMLParser hiểu giá trị thuộc tính nên không mắc
    lỗi này và tự giải mã ký tự thực thể (&lt; &amp; ...).
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.pieces: list[str] = []
        self.attrs: list[str] = []
        self._skip = 0  # độ sâu bên trong script/style/noscript/svg

    def handle_starttag(self, tag, attrs):
        if tag in DROP_TAGS:
            self._skip += 1
        if self._skip:
            return
        for name, value in attrs:
            if name in ATTR_TEXT_KEYS and value:
                self.attrs.append(value)
            elif name == "data-i18n-src" and value:
                # Cách khai báo chuỗi động ngay trong markup: "chuỗi\nchuỗi"
                self.attrs.append(value.replace("\\n", "\n"))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag in DROP_TAGS:
            self._skip -= 1

    def handle_endtag(self, tag):
        if tag in DROP_TAGS and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if not self._skip:
            self.pieces.append(data)


def from_html(path: Path) -> list[str]:
    parser = _HtmlTextParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    # Một text node có thể trải dài qua nhiều dòng trong tệp nguồn: trình duyệt
    # gộp hết vào cùng một node nên khóa từ điển cũng phải là cả đoạn.
    raw = parser.pieces + parser.attrs
    flat = [normalize(t) for t in raw]
    return [s for s in flat if keep(s)]


# ------------------------------------------------------------ JavaScript ----
def _string_literals(src: str) -> list[tuple[int, int, str]]:
    """Máy trạng thái nhỏ: bỏ qua comment, nhận diện regex literal, trả về
    (start, end, nội dung) của mọi chuỗi."""
    out: list[tuple[int, int, str]] = []
    i, n = 0, len(src)
    prev_sig = ""  # ký tự có nghĩa gần nhất, dùng để phân biệt / chia và regex
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ""
        if c == "/" and nxt == "/":
            j = src.find("\n", i)
            i = n if j < 0 else j
            continue
        if c == "/" and nxt == "*":
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c == "/" and prev_sig in "(,=:[!&|?{};+-*%^~<>" and nxt not in "/*":
            # regex literal: ăn tới dấu / đóng ngoài [...]
            j = i + 1
            in_class = False
            while j < n:
                d = src[j]
                if d == "\\":
                    j += 2
                    continue
                if d == "[":
                    in_class = True
                elif d == "]":
                    in_class = False
                elif d == "/" and not in_class:
                    break
                elif d == "\n":
                    break
                j += 1
            i = min(j + 1, n)
            prev_sig = "/"
            continue
        if c in "\"'`":
            quote = c
            j = i + 1
            buf = []
            closed = False
            while j < n:
                d = src[j]
                if d == "\\":
                    buf.append(src[j : j + 2])
                    j += 2
                    continue
                if d == quote:
                    closed = True
                    break
                if quote != "`" and d == "\n":
                    break  # chuỗi một dòng không được xuống dòng
                buf.append(d)
                j += 1
            if closed:
                text = "".join(buf)
                if quote == "`" and "${" in text:
                    # Template literal có nội suy không phải là một khóa tĩnh,
                    # nhưng t("...") VIẾT BÊN TRONG ${...} thì có. Phải lách vào
                    # từng biểu thức ${...}, nếu không mọi chuỗi động kiểu
                    # `[*] ${t("Đang kết nối...")}` lọt lưới và phải dịch trên
                    # trình duyệt thay vì lấy trong từ điển ra.
                    for code_start, code in _interpolations(i + 1, text):
                        for a, b, inner in _string_literals(code):
                            out.append((code_start + a, code_start + b, inner))
                elif text:
                    out.append((i, j, decode_escapes(text)))
                i = j + 1
                prev_sig = quote
                continue
            i = j + 1
            continue
        if c not in " \t\r\n":
            prev_sig = c
        i += 1
    return out


def _interpolations(base: int, text: str) -> list[tuple[int, str]]:
    """(vị trí tuyệt đối của mã nguồn, mã nguồn) của từng ${...} trong template."""
    found = []
    i = 0
    while True:
        a = text.find("${", i)
        if a < 0:
            return found
        depth = 1
        j = a + 2
        while j < len(text) and depth:
            if text[j] == "{":
                depth += 1
            elif text[j] == "}":
                depth -= 1
            j += 1
        found.append((base + a + 2, text[a + 2 : max(a + 2, j - 1)]))
        i = j


def _t_call_spans(src: str, names=TRANSLATE_FNS) -> list[tuple[int, int]]:
    """Vùng (start, end) của từng lời gọi t(...) / tr(...) kể cả ternary."""
    spans = []
    for m in re.finditer(r"\b(%s)\s*\(" % "|".join(names), src):
        depth = 0
        j = m.end() - 1
        while j < len(src):
            if src[j] == "(":
                depth += 1
            elif src[j] == ")":
                depth -= 1
                if depth == 0:
                    spans.append((m.start(), j))
                    break
            j += 1
    return spans


def _enclosed(src: str, start: int, end: int) -> bool:
    return any(a <= start and end <= b for a, b in _t_call_spans(src))


def from_js(path: Path) -> tuple[list[str], list[str]]:
    """Trả về (mọi chuỗi tiếng Việt, những chuỗi KHÔNG nằm trong t/tr())."""
    src = path.read_text(encoding="utf-8")
    # Dòng đánh dấu "// i18n-skip" chứa chữ Việt nhưng không bao giờ lên màn
    # hình (nhật ký file, mô tả trong JSON export...). Cho nó ra khỏi danh sách
    # để từ điển chỉ chứa thứ người dùng thật sự nhìn thấy.
    skip_lines = {i for i, line in enumerate(src.split("\n")) if "i18n-skip" in line}
    line_starts = []
    pos = 0
    for line in src.split("\n"):
        line_starts.append(pos)
        pos += len(line) + 1

    def line_of(index: int) -> int:
        lo, hi = 0, len(line_starts) - 1
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if line_starts[mid] <= index:
                lo = mid
            else:
                hi = mid - 1
        return lo

    all_vi: list[str] = []
    unwrapped: list[str] = []
    for start, end, text in _string_literals(src):
        s = normalize(text)
        if not keep(s) or not VI_LETTER.search(s):
            continue  # không phải tiếng Việt -> không cần dịch
        if line_of(start) in skip_lines:
            continue
        in_t = _enclosed(src, start, end)
        if not in_t:
            # Log dành cho lập trình viên (console.*): không hiển thị cho người
            # dùng nên không việc gì phải đưa vào từ điển.
            if any(a <= start and end <= b for a, b in _t_call_spans(src, ("log", "warn", "info", "error", "debug"))):
                continue
        all_vi.append(s)
        if not in_t:
            unwrapped.append(s)
    return all_vi, unwrapped


# File từ điển curated: khóa của nó vốn là tiếng Việt, không phải chuỗi quên bọc.
REPORT_SKIP = {"i18n-curated.js"}


def scan(root: Path) -> tuple[list[str], dict[str, list[str]]]:
    """Toàn bộ nguồn tiếng Việt + báo cáo chuỗi chưa được bọc t()."""
    sources: list[str] = list(from_html(root / "index.html"))
    unwrapped: dict[str, list[str]] = {}
    for js in sorted((root / "js").rglob("*.js")):
        vi, loose = from_js(js)
        sources += vi
        if loose and js.name not in REPORT_SKIP:
            unwrapped[str(js.relative_to(root))] = sorted(set(loose))
    return sorted(set(s for s in sources if s)), unwrapped
