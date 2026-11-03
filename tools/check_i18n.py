#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CySim — tools/check_i18n.py

LÀ GÌ   : Trọng tài chất lượng bản dịch. Không sửa file nào, chỉ đọc và báo
         cáo — dùng để chứng minh con số "% đã kiểm chứng" trên giao diện là
         thật, không phải nói dối.
CHẠY    : python tools/check_i18n.py --strict  (exit 1 khi còn LỖI thật;
         mục [2] chỉ là checklist tham khảo nên không chặn exit), hoặc
         python tools/check_i18n.py --ci để chạy luôn bảy khối kiểm tra của dự
         án trong một lệnh — i18n, node --check, ba bộ test JS, tự kiểm của
         proxy, quét phạm vi toàn cục, soi cách JS nối DOM, và chặn key Google
         lọt vào file git theo dõi (xem hàm ci()).

Bộ kiểm tra chất lượng (không gọi mạng, chạy được trước khi commit):

  1. Mỗi ngôn ngữ dịch tới đâu, tách rõ: người đã duyệt / máy dịch / chuỗi
     code giữ nguyên / còn thiếu. Một con số "100%" gộp là nói dối.
  2. Chuỗi tiếng Việt nằm ngoài t(...) — chữ hiển thị chưa ai bọc.
  3. Chuỗi chưa có trong từ điển (sẽ phải dịch ngay trên trình duyệt).
  4. Kiểm tra chất lượng: bản dịch rác lẫn vào, identifier bị dịch, bảng
     review bị thiếu thứ tiếng, key chết, và mảnh câu bị element cắt đôi.

Dùng:  python tools/check_i18n.py            # báo cáo đầy đủ
       python tools/check_i18n.py --strict    # exit 1 nếu còn lỗi thật
"""

import json
import os
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent))
from i18n_scan import VI_LETTER, keep, normalize, scan  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
# Hai hình dạng key Google: "AQ." (AI Studio hiện nay) và "AIza" (kiểu cũ).
KEY_GOOGLE = re.compile(r"(?<![A-Za-z0-9_-])(?:AQ\.[A-Za-z0-9_-]{40,}|AIza[0-9A-Za-z_-]{35})")
LANG_DIR = ROOT / "js" / "lang"
REVIEW_FILE = ROOT / "tools" / "translation_review.json"
LANGS = ("en", "zh", "fr", "es", "ja")

# Bản dịch máy chứa thẻ nội bộ của Google thì chắc chắn là rác.
ARTIFACT = re.compile(r"<\s*/?\s*ph\b|</ph>|\bx\s*=\s*\"", re.IGNORECASE)
# Chuỗi KHÔNG phải văn bản: đường dẫn, payload, hash, lệnh. Giữ nguyên 100%.
CODEISH = re.compile(r"^[\x21-\x7E]+$")  # toàn ASCII in được -> không phải tiếng Việt
# Mảnh câu: mở đầu bằng ký tự nối hoặc kết thúc bằng dấu mở — dịch máy không
# đủ ngữ cảnh nên dễ sai. Đây là lỗi CẤU TRÚC HTML, sửa bằng cách đưa element
# inline ra cuối câu.
FRAGMENT_HEAD = re.compile(r"^[\s\)\]\};,.\-—/:>|”\"']|^-> |^\u2192 ")
FRAGMENT_TAIL = re.compile(r"[\(\[\{,:;\-—>]$")
# Khai báo nằm ở CỘT 0 của một file <script> thường = tên rơi ra phạm vi toàn cục.
# Chỉ khối [5] của --ci dùng, để bắt hai file cùng khai một tên (xem giải thích
# in ra tại đó).
TOP_DECL = re.compile(r"^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)")
# Tên BÊN TRONG một IIFE nhưng bị gán thẳng ra window/globalThis/self: cũng là
# một tên toàn cục, chỉ khác ở chỗ cột 0 của nó không còn là `const` nên TOP_DECL
# không thấy. Khối [5] quét thêm dòng này để lỗ hổng "im lặng" của bản cũ khép
# lại — xem vì sao in ra tại đó.
GLOBAL_ASSIGN = re.compile(r"(?:^|[^\w$])(?:window|globalThis|self)\.([A-Za-z_$][\w$]*)\s*=[^=]")
# Khối [6]: mọi cách tham chiếu id trong JS + mọi cách một id được sinh ra.
ID_USE = re.compile(
    r"""\$\(\s*["']([A-Za-z][\w:-]*)["']|getElementById\(\s*["']([A-Za-z][\w:-]*)["']"""
    r"""|querySelector(?:All)?\(\s*["']#([A-Za-z][\w:-]*)["']"""
)
ID_BORN = re.compile(r"(?:\.id\s*=\s*|setAttribute\(\s*[\"']id[\"']\s*,\s*)[\"']([A-Za-z][\w:-]*)[\"']|id=[\"']([A-Za-z][\w:-]*)[\"']")
# Gán innerHTML = một chuỗi HTML được parse. Dự án đã chuyển hết sang
# createElement/textContent; khối [6] giữ con số đó bằng 0 thay vì bằng lời hứa.
INNER_HTML = re.compile(r"\.innerHTML\s*=[^=]")


def load_json(path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # file hỏng còn tệ hơn file thiếu
        print("  LỖI đọc %s: %s" % (path.name, exc))
        return default


def stats(index, lang):
    raw = (index.get("langs") or {}).get(lang)
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, int):  # index.json kiểu cũ: chỉ một con số tổng
        total = index.get("total", raw)
        return {"review": raw, "machine": 0, "code": 0, "missing": max(0, total - raw)}
    return {"review": 0, "machine": 0, "code": 0, "missing": 0}


def is_translatable(text):
    return bool(VI_LETTER.search(text))


def main():
    strict = "--strict" in sys.argv
    sources, unwrapped = scan(ROOT)
    index = load_json(LANG_DIR / "index.json", {})
    dicts = {lang: load_json(LANG_DIR / (lang + ".json"), {}) for lang in LANGS}
    problems = []

    print("Tổng số chuỗi tiếng Việt tìm thấy: %d" % len(sources))
    print("\n[1] Mỗi ngôn ngữ: đã người duyệt | máy dịch | giữ nguyên | còn thiếu")
    missing_total = 0
    for lang in LANGS:
        s = stats(index, lang)
        total = index.get("total") or len(sources)
        if not s and not dicts[lang]:
            print("  %-3s  chưa có file từ điển" % lang)
            problems.append("%s: thieu tu dien" % lang)
            missing_total += total
            continue
        ready = s["review"] + s["machine"] + s["code"]
        pct = round(ready / total * 100) if total else 100
        rpct = round(s["review"] / total * 100) if total else 100
        print("  %-3s  %4d/%-4d co ban dich (%3d%%) — nguoi duyet %4d (%3d%%) | may %4d | code %3d | thieu %3d"
              % (lang, ready, total, pct, s["review"], rpct, s["machine"], s["code"], s["missing"]))
        if not dicts[lang]:
            problems.append("%s: index.json co so lieu nhưng js/lang/%s.json khong ton tai" % (lang, lang))
        missing_total += s["missing"]

    print("\n[2] Chuỗi tiếng Việt nằm NGOÀI t(...) — checklist tham khảo, KHÔNG phải lỗi")
    if not unwrapped:
        print("  (không có)")
    for path, items in sorted(unwrapped.items()):
        print("  %s" % path)
        for s in items:
            print("     · %s" % s[:90])

    print("\n[3] Chuỗi chưa có trong từ điển en (sẽ phải dịch trên trình duyệt)")
    loose = [s for s in sources if s not in dicts["en"]]
    for s in loose[:40]:
        print("     · %s" % s[:90])
    if len(loose) > 40:
        print("     ... và %d chuỗi nữa (chạy: python tools/gen_translations.py)" % (len(loose) - 40))
    if not loose:
        print("  (không có — mọi chuỗi đã dịch sẵn)")
    if loose:
        problems.append("%d chuỗi chưa có trong js/lang/en.json" % len(loose))

    print("\n[4] Chất lượng bản dịch đã sinh")
    # Tập chuỗi do người duyệt (curated + bảng review + chuỗi code giữ nguyên):
    # mọi phép kiểm "máy dịch sai" bên dưới phải bỏ qua tập này, vì "1. Hash
    # SHA-256" -> "1. SHA-256 Hash" là chữ người viết, không phải máy.
    reviewed_names = load_json(LANG_DIR / "reviewed.json", {})
    sets = reviewed_names.get("sets", {})
    known_human = set().union(*[set(v) for v in sets.values()]) if sets else set()
    if not known_human:
        print("  (chưa có js/lang/reviewed.json — chạy python tools/gen_translations.py để kiểm tra chính xác)")

    # 4a. thẻ nội bộ của Google lọt vào từ điển
    dirty = {
        lang: [k for k, v in d.items() if v != k and ARTIFACT.search(v or "")]
        for lang, d in dicts.items()
    }
    n_dirty = sum(len(v) for v in dirty.values())
    print("  a) bản dịch chứa thẻ rác      : %d" % n_dirty)
    for lang, keys in dirty.items():
        for k in keys[:5]:
            print("     · %-3s %r -> %r" % (lang, k[:40], dicts[lang][k][:60]))
    if n_dirty:
        problems.append("%d ban dich chua the rac cua Google" % n_dirty)

    # 4b. identifier / code bị dịch đi nơi khác
    swapped = {
        lang: [k for k, v in d.items() if not is_translatable(k) and v != k and k not in known_human]
        for lang, d in dicts.items()
    }
    n_swapped = sum(len(v) for v in swapped.values())
    print("  b) chuỗi code bị dịch lệch    : %d" % n_swapped)
    for lang, keys in swapped.items():
        for k in keys[:5]:
            print("     · %-3s %r -> %r" % (lang, k[:40], dicts[lang][k][:60]))
    if n_swapped:
        problems.append("%d chuoi code/duong dan bi dich di noi khac" % n_swapped)

    # 4c. bảng review: đủ 5 thứ tiếng chưa, key còn sống không
    review = load_json(REVIEW_FILE, {})
    table = review.get("strings", review) or {}
    table = {normalize(k): v for k, v in table.items() if not k.startswith("_")}
    src_set = set(sources)
    dead = [k for k in table if k not in src_set]
    partial = {k: [l for l in LANGS if not (v or {}).get(l)] for k, v in table.items() if k in src_set}
    partial = {k: v for k, v in partial.items() if v}
    print("  c) bảng review %d chuỗi: thiếu ngôn ngữ %d, key chết %d"
          % (len(table), len(partial), len(dead)))
    for k, langs in list(partial.items())[:10]:
        print("     · thieu %-20s %r" % (",".join(langs), k[:50]))
    for k in dead[:10]:
        print("     · key khong con trong code: %r" % k[:60])
    if partial or dead:
        problems.append("translation_review.json: %d thieu ngon ngu, %d key chet" % (len(partial), len(dead)))

    # 4d. chuỗi ngắn (dễ sai ngữ cảnh) nhưng vẫn là máy dịch
    short_machine = []
    for s in sources:
        if len(s.split()) > 3 or not is_translatable(s):
            continue
        for lang in LANGS:
            value = dicts[lang].get(s)
            if value and value != s and s not in known_human:
                short_machine.append((lang, s, value))
                break
    print("  d) chuỗi ngắn chưa người duyệt: %d" % len(short_machine))
    for lang, s, v in short_machine[:15]:
        print("     · %-3s %r -> %r" % (lang, s[:40], v[:40]))
    if short_machine:
        problems.append("%d chuoi ngan van la may dich (them vao translation_review.json)" % len(short_machine))

    # 4e. mảnh câu bị element inline cắt đôi — nguyên nhân gốc của bản dịch lạc
    # ngữ cảnh. Chỉ tính mảnh CHƯA có người duyệt; mảnh dài đủ ngữ cảnh thì máy
    # dịch vẫn dùng được, không cần báo động.
    fragments = [
        s for s in sources
        if is_translatable(s) and keep(s) and (FRAGMENT_HEAD.search(s) or FRAGMENT_TAIL.search(s))
    ]
    loose_frags = [s for s in fragments if s not in known_human]
    print("  e) mảnh câu bị cắt: %d (đã duyệt %d, còn máy dịch %d)"
          % (len(fragments), len(fragments) - len(loose_frags), len(loose_frags)))
    for s in loose_frags[:15]:
        print("     · %r -> %r" % (s[:60], dicts["en"].get(s, "")[:50]))
    if len(loose_frags) > 15:
        print("     ... và %d mảnh nữa" % (len(loose_frags) - 15))
    print("     Cách sửa: đưa <code>/<b> ra CUỐI câu để một text node là cả câu;")
    print("     mảnh nào đã vào js/lang/ thì bổ sung vào translation_review.json.")
    if loose_frags:
        print("     (mục này cảnh báo để cải thiện dần, không chặn commit)")

    # 4f. chữ Việt không dấu bị giữ nguyên: "Nhanh tay", "Chuc mung"... máy không
    # nhận là tiếng Việt nên tool coi là code -> người dùng nước ngoài đọc nguyên
    # văn. Duy nhất người thật duyệt mới cứu được, nên bắt buộc liệt kê.
    ascii_vi = [s for s in sources if not is_translatable(s) and keep(s) and s in dicts["zh"]
                and dicts["zh"][s] == s and s not in known_human
                and re.search(r"[A-Za-z]{4,}", s) and " " in s and not re.search(r"[/\\:<>\.]", s)]
    print("  f) chuỗi Việt không dấu chưa duyệt: %d" % len(ascii_vi))
    for s in ascii_vi[:20]:
        print("     · %r" % s[:70])
    if len(ascii_vi) > 20:
        print("     ... và %d chuỗi nữa" % (len(ascii_vi) - 20))
    if ascii_vi:
        problems.append("%d chuoi Viet khong dau chua co ban dich nguoi" % len(ascii_vi))

    print("\nKết luận: còn %d lượt thiếu dịch tính trên cả 5 ngôn ngữ." % missing_total)
    n_unwrapped = sum(len(v) for v in unwrapped.values())
    if problems:
        print("Cần xử lý:")
        for p in problems:
            print("  ! %s" % p)
    else:
        print("Không có lỗi chất lượng nào.")
    # Mục [2] không chặn commit: phần lớn đó là dữ liệu (RANKS, tên nhân vật,
    # đơn vị thời gian) hoặc chữ giao của showToast()/complete() — những hàm đã
    # tự gọi t() bên trong, nên chuỗi đứng ngoài t() là HỢP LỆ. Bắt buộc bọc
    # hết sẽ dịch ngay lúc nạp script, đổi ngôn ngữ là chữ cũ đóng băng ngược
    # lại tiếng Việt. Error thật = problems (thiếu bản dịch, bản dịch rác).
    print("(checklist %d chuỗi đứng ngoài t(): %s)"
          % (n_unwrapped, "không có" if not n_unwrapped else "xem mục [2]"))
    if strict and problems:
        sys.exit(1)
    return len(problems)


def chay(cmd, tail=6):
    """Chạy một lệnh kiểm tra, trả (mã_thoát, mấy dòng cuối in ra). Mọi khối đều
    có thể thất bại, nên không được phép nộp một chuỗi "ĐẠT" không có bằng chứng:
    đường này giữ lại đúng câu lệnh in ra để người đọc thấy tận mắt."""
    import subprocess

    try:
        p = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=300)
    except (OSError, subprocess.TimeoutExpired) as exc:
        return 127, ["không chạy được: %s" % exc]
    out = (p.stdout or "") + (p.stderr or "")
    lines = [l for l in out.splitlines() if l.strip()]
    return p.returncode, lines[-tail:]


def ci():
    """--ci: MỘT lệnh cho toàn bộ cửa kiểm tra trước khi nộp bài.

    Người duyệt (nhược điểm 6) đòi CI / pre-commit tự động kiểm tra i18n. Hình
    thức cho phép ở đây: dự án không có bước build và không được thêm file (trần
    52 đã cắt), nên "CI" chính là lệnh này — `python tools/check_i18n.py --ci` —
    còn pre-commit hook thì phải do người dùng tự tạo trong `.git/hooks`; không
    có file nào trong repo thay được họ làm việc đó.

    Bảy khối: (1) i18n + từ điển, (2) `node --check` từng file js (kể cả `test/`),
    (3) ba bộ test JS, (4) tự kiểm của proxy, (5) trùng tên khai báo cấp cao nhất
    VÀ tên bị đẩy ra window/globalThis, (6) mọi id mà JS tham chiếu phải có node
    thật + không còn chỗ nào gán innerHTML, (7) không file nào git theo dõi chứa
    `.env` hay một chuỗi có hình dạng key Google.
    Khối nào thiếu dụng cụ chạy (không có node, thiếu Flask/SDK) in "BỎ QUA" ra mặt,
    không im lặng — một cái "xanh" giả còn tệ hơn "đỏ", vì người ta sẽ tưởng mọi thứ
    đã được kiểm. Riêng khối (5) và (6) không cần dụng cụ gì: chúng là lý do hai khối
    cần node không còn là chỗ duy nhất soi được phạm vi toàn cục và cách JS nối DOM."""
    import importlib.util
    import shutil

    results = []
    print("\n=== [1/7] i18n: từ điển + chất lượng bản dịch ===")
    results.append(("i18n + từ điển", main(), None))

    node = shutil.which("node")
    if not node and os.environ.get("CYSIM_NODE"):
        # May khong cai `node` trong PATH van phai chay duoc CA DUONG KIEM TRA,
        # khong chi duoc mot nu: CYSIM_NODE tro toi mot binary Node/Electron bat
        # ky (Qoder.exe cung duoc) + ELECTRON_RUN_AS_NODE thi no hanh xu nhu
        # `node` tran. Tu do nam khoi chua BỎ QUA nao cung co the xanh that.
        node = os.environ["CYSIM_NODE"]
        os.environ.setdefault("ELECTRON_RUN_AS_NODE", "1")
        print("\n(dùng CYSIM_NODE thay `node` trong PATH: %s)" % node)
    # test/ cũng là JS mà không có gì soi cú pháp hộ; gộp vào cùng một cửa.
    js = sorted(list(ROOT.rglob("js/**/*.js")) + list(ROOT.rglob("test/**/*.js")))
    if not node:
        print("\n=== [2/7] node --check %d file js+test ===" % len(js))
        print("BỎ QUA: không tìm thấy 'node' trong PATH — đặt biến CYSIM_NODE=đường-dẫn "
              "binary Node/Electron rồi chạy lại để hai khối 2 và 3 thật sự chạy.")
        results.append(("node --check", None, "thiếu node"))
    else:
        bad = []
        for f in js:
            rc, tail = chay([node, "--check", str(f)])
            if rc:
                bad.append("%s: %s" % (f.relative_to(ROOT), " | ".join(tail[:2])))
        print("\n=== [2/7] node --check %d file js+test ===" % len(js))
        print("  %s (%d file)" % ("ĐẠT" if not bad else "LỖI %d file" % len(bad), len(js)))
        for b in bad:
            print("  ! %s" % b)
        results.append(("node --check", len(bad), None))

    if not node:
        print("\n=== [3/7] test tự động ===")
        print("BỎ QUA: không tìm thấy 'node' trong PATH.")
        results.append(("test JS", None, "thiếu node"))
    else:
        fail = []
        print("\n=== [3/7] test tự động ===")
        for t in ("test/exam.test.js", "test/i18n.test.js", "test/labs.test.js"):
            rc, tail = chay([node, str(ROOT / t)])
            print("  %-22s %s" % (t, "ĐẠT" if rc == 0 else "LỖI"))
            for l in tail[-2:]:
                print("      %s" % l[:100])
            if rc:
                fail.append(t)
        results.append(("test JS", len(fail), None))

    thieu = [m for m in ("flask", "google.genai") if importlib.util.find_spec(m) is None]
    print("\n=== [4/7] server/gemini_proxy.py --check ===")
    if thieu:
        print("BỎ QUA: thiếu package %s (pip install -r server/requirements.txt)."
              % ", ".join(thieu))
        results.append(("proxy --check", None, "thiếu package"))
    else:
        rc, tail = chay([sys.executable, "server/gemini_proxy.py", "--check"])
        for l in tail:
            print("  %s" % l[:100])
        results.append(("proxy --check", 0 if rc == 0 else 1, None))

    print("\n=== [5/7] trùng tên cấp cao nhất + tên đẩy ra window/globalThis ===")
    ten, cong_khai = {}, {}
    files = sorted(list(ROOT.rglob("js/**/*.js")) + [ROOT / "sw.js"])
    for f in files:
        rel = f.relative_to(ROOT).as_posix()
        for ln in f.read_text(encoding="utf-8", errors="replace").splitlines():
            m = TOP_DECL.match(ln)
            if m:
                ten.setdefault(m.group(1), []).append(rel)
            for g in GLOBAL_ASSIGN.finditer(ln):
                cong_khai.setdefault(g.group(1), []).append(rel)
    trung = {k: v for k, v in ten.items() if len(v) > 1}
    print("  %d tên cột 0 trong %d file — trùng: %d" % (len(ten), len(files), len(trung)))
    for k, v in sorted(trung.items()):
        print("  ! %s: %s" % (k, ", ".join(v)))
    print("  Vì sao phải quét: <script> thường chia sẻ một phạm vi toàn cục, hai file cùng")
    print("  khai một tên thì file nạp sau ĐÈ file nạp trước, và không có build step nào")
    print("  báo hộ. Tên trùng in ra ở trên chưa chắc đã sai — có thể là hai biến cùng tên")
    print("  trong hai IIFE — nhưng phải nhìn tận mắt mới được khép.")
    # Phần bản cũ BỎ SÓT (nhược điểm 2, vòng 31-10): một tên KHAI BÊN TRONG IIFE
    # nhưng được gán thẳng ra window/globalThis vẫn là tên toàn cục y hệt, chỉ khác
    # là cột 0 của nó không còn là const/let/function nên TOP_DECL không bao giờ
    # thấy. Hai file cùng `globalThis.X = ...` là một vụ đè IM LẶNG.
    de_nghi = {k: v for k, v in cong_khai.items() if len(set(v)) > 1 or k in ten}
    print("  tên đưa thẳng ra window/globalThis: %d — %s"
          % (len(cong_khai), ", ".join(sorted(cong_khai)) or "(không có)"))
    for k, v in sorted(de_nghi.items()):
        print("  ! %s: gán ra window ở %s và %s"
              % (k, "/".join(sorted(set(v))),
                 "còn được gán ở một file khác" if len(set(v)) > 1
                 else "TRÙNG với một khai báo cột 0"))
    print("  Danh sách trên là các QUYẾT ĐỊNH có chủ ý (js/utils.js đưa numOf ra toàn cục")
    print("  để mọi file định dạng số giống nhau). Danh sách dài thêm mà chưa bàn là dấu")
    print("  hiệu một biến đang trốn khỏi phạm vi file — hoặc hai file đang giành nhau.")
    results.append(("trùng tên + cửa sổ toàn cục", len(trung) + len(de_nghi), None))

    print("\n=== [6/7] mọi id tham chiếu phải có node thật + 0 chỗ gán innerHTML ===")
    # Đây là phần gần nhất với "E2E" mà dự án làm được MÀ KHÔNG thêm file và KHÔNG
    # cần cài gì (trần 52/52 đã đầy; Playwright cần test/e2e.js + node_modules).
    # Nó không chứng minh hành vi: nó chứng minh NỐI DÂY. Một id gõ sai trong
    # js/labs/*.js là kiểu hỏng im lặng — phòng lab vẫn mở, vẫn vẽ, chỉ cái nút
    # đó không có ai nghe, và không có test thuần logic nào bắt được vì hàm vẫn
    # đúng khi chạy một mình.
    sinh_id, dung_id = set(), {}
    for f in files + [ROOT / "index.html"]:
        rel = f.relative_to(ROOT).as_posix()
        src = f.read_text(encoding="utf-8", errors="replace")
        for m in ID_BORN.finditer(src):
            sinh_id.add(next(g for g in m.groups() if g))
    for f in files:
        rel = f.relative_to(ROOT).as_posix()
        src = f.read_text(encoding="utf-8", errors="replace")
        for m in ID_USE.finditer(src):
            dung_id.setdefault(next(g for g in m.groups() if g), set()).add(rel)
    khong_co = {k: sorted(v) for k, v in dung_id.items() if k not in sinh_id}
    print("  %d id được $()/getElementById tham chiếu — có node thật: %d, không: %d"
          % (len(dung_id), len(dung_id) - len(khong_co), len(khong_co)))
    for k, v in sorted(khong_co.items()):
        print("  ! %s: %s" % (k, ", ".join(v)))
    gan_html = []
    for f in files:
        src = f.read_text(encoding="utf-8", errors="replace")
        if INNER_HTML.search(src):
            gan_html.append(f.relative_to(ROOT).as_posix())
    print("  chỗ gán .innerHTML = còn lại trong js/ + sw.js: %d%s"
          % (len(gan_html), (" — " + ", ".join(sorted(gan_html))) if gan_html else ""))
    print("  Vì sao chặn cả hai: id sai thì phòng lab câm đi một nửa mà không ai biết;")
    print("  innerHTML là con đường duy nhất để chữ người dùng biến thành code, nên giữ")
    print("  nó bằng một con số (0) chứ không bằng một lời hứa trong chú thích.")
    print("  Giới hạn, nói thẳng: khối này KHÔNG thay được Playwright. Nó không bấm thử,")
    print("  không đo thứ tự render, không biết một handler có ném lỗi hay không — muốn")
    print("  có E2E thật phải thêm file test/ và cài trình duyệt điều khiển được, cả hai")
    print("  đều cần người duyệt vì repo đã kín 52 suất.")
    results.append(("nối id + innerHTML", len(khong_co) + len(gan_html), None))

    print("\n=== [7/7] không có key Google trong file git theo dõi ===")
    # Bệnh thật 30-10-2026: `git add -f .env` đẩy key lên repo CÔNG KHAI, và từ đó
    # Google từ chối đúng chuỗi ấy (401) — "AI không chat được" mấy ngày liền mà
    # không dòng code nào sai. .gitignore không chặn được `-f`; khối này thì có.
    # Chỉ in file:dòng, KHÔNG BAO GIỜ in chuỗi tìm thấy.
    import subprocess

    if not shutil.which("git"):
        print("BỎ QUA: không có git trong PATH.")
        results.append(("không lộ key", None, "thiếu git"))
    else:
        lo, da_quet = [], set()
        # server/ là repo lồng (deploy riêng lên Render) nên phải quét cả hai.
        for repo in (ROOT, ROOT / "server"):
            if not (repo / ".git").exists():
                continue
            ds = subprocess.run(["git", "-C", str(repo), "ls-files", "-z"],
                                capture_output=True).stdout.decode("utf-8", "replace")
            for rel in filter(None, ds.split("\0")):
                f = repo / rel
                ten_hien = f.relative_to(ROOT).as_posix()
                if ten_hien in da_quet:
                    continue
                da_quet.add(ten_hien)
                if f.name == ".env":
                    lo.append("%s: file .env đang bị git theo dõi (git rm --cached)" % ten_hien)
                    continue
                if not f.is_file() or f.stat().st_size > 2_000_000:
                    continue
                try:
                    noi = f.read_text(encoding="utf-8")
                except (UnicodeDecodeError, OSError):
                    continue
                for so, dong in enumerate(noi.splitlines(), 1):
                    if KEY_GOOGLE.search(dong):
                        lo.append("%s:%d: có chuỗi dạng key Google" % (ten_hien, so))
        print("  %s" % ("ĐẠT — không file nào lộ key" if not lo else "LỖI %d chỗ" % len(lo)))
        for l in lo:
            print("  ! %s" % l)
        # Lịch sử thì không chặn được bằng một lần chạy: chỉ NÓI ra, vì sửa nó là
        # viết lại lịch sử + force-push — quyết định của chủ repo, không của script.
        rc, cu = chay(["git", "-C", str(ROOT), "log", "--all", "--format=%h %ad",
                       "--date=short", "--", ".env"], tail=20)
        if rc == 0 and cu:
            print("  CẢNH BÁO: lịch sử git vẫn còn .env ở %d commit (%s) — key nào từng"
                  % (len(cu), ", ".join(c.split()[0] for c in cu)))
            print("  nằm trong đó phải coi là đã lộ: xoá nó ở AI Studio và dùng key mới.")
        results.append(("không lộ key", len(lo), None))

    bo_qua = [name for name, n, skip in results if skip]
    loi = [name for name, n, skip in results if n]
    print("\n" + "=" * 58)
    for name, n, skip in results:
        print("  %-16s %s" % (name, ("BỎ QUA (%s)" % skip) if skip else ("ĐẠT" if not n else "LỖI")))
    if bo_qua:
        print("  CẦN NÓI: %d khối CHƯA được kiểm — cái 'xanh' ở trên không phải toàn bộ."
              % len(bo_qua))
    print("=" * 58)
    return 1 if loi else 0


if __name__ == "__main__":
    if "--ci" in sys.argv:
        sys.exit(ci())
    main()
