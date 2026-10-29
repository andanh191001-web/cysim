#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CySim — tools/check_i18n.py

LÀ GÌ   : Trọng tài chất lượng bản dịch. Không sửa file nào, chỉ đọc và báo
         cáo — dùng để chứng minh con số "% đã kiểm chứng" trên giao diện là
         thật, không phải nói dối.
CHẠY    : python tools/check_i18n.py --strict  (exit 1 khi còn LỖI thật;
         mục [2] chỉ là checklist tham khảo nên không chặn exit).

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
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent))
from i18n_scan import VI_LETTER, keep, normalize, scan  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
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


if __name__ == "__main__":
    main()
