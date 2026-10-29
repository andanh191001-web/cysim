#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CySim — tools/gen_translations.py

LÀ GÌ   : Bước "build" của hệ thống dịch: biến mã nguồn tiếng Việt thành
         từ điển cho 5 ngôn ngữ mà không ai phải gõ tay chuỗi dịch.
CHẠY    : python tools/gen_translations.py --offline  (dựng lại file từ cache
         + bảng kiểm chứng, không gọi mạng) — đây là lệnh dùng hằng ngày sau
         khi sửa code. Bỏ --offline khi thật sự cần dịch chuỗi mới.
ĐẦU RA  : js/lang/<mã>.json (từ điển phẳng), js/lang/index.json (đếm số
         chuỗi theo tầng), js/lang/reviewed.json (chuỗi nào là của người),
         tools/.translation_cache.json (cache dịch máy, không vào app).

Thu mọi chuỗi tiếng Việt mà ứng dụng có thể hiển thị (index.html + toàn bộ
file trong js/, do tools/i18n_scan.py tìm giúp), dịch sang từng ngôn ngữ rồi
ghi ra js/lang/<mã>.json và js/lang/index.json.

AI THỨ TỰ QUYỀN LỰC (mục này giải thích vì sao file dịch không còn bị
"máy nói càn"):
  1. tools/translation_review.json — bản dịch ĐÃ ĐƯỢC NGƯỜI THẬT KIỂM CHỨNG.
     Không bao giờ bị dịch máy đè, kể cả khi cache cũ còn giá trị khác.
  2. js/i18n-curated.js — bộ từ điển tiếng Anh gốc của dự án, được nạp vào
     làm bản kiểm chứng cho en (trước đây file này bị bỏ qua nên en.json chứa
     "Cybersecurity Myths" trong khi curated đã ghi đúng "Cyber Legend").
  3. Chuỗi KHÔNG phải văn bản tiếng Việt (đường dẫn file, payload code, email,
     "localStorage", "1300 XP"...): ghi nguyên văn, không gọi dịch máy. Chính
     Google Translate mới là thủ phạm biến "js/lang/<mã>.json" thành
     "js/lang/<language-code>.json".
  4. tools/.translation_cache.json — những gì còn lại, dịch theo lô qua Google,
     có MyMemory dự phòng. File NẰM TRONG tools/ (xem CACHE_FILE), không phải
     ở thư mục gốc: nó là dữ liệu dựng, không phải thứ được nạp khi chạy app.
     Bản cũ để nhầm ở gốc sẽ được tự gộp về tools/ rồi dọn (migrate_legacy_cache)
     — nếu không, mỗi lần chạy là dịch lại toàn bộ chuỗi (~722 lúc viết dòng này,
     xem js/lang/index.json để biết số hiện tại) x 5 ngôn ngữ.

- Dịch theo lô (25 dòng/lần) để giảm số request, tự tách ra dịch từng dòng
  nếu kết quả trả về không khớp số dòng.
- Trước khi dựng, purge_cache() dọn rác khỏi cache (chuỗi đã chết, bản dịch
  chỉ bỏ dấu như "Mạnh"->"Manh", artifact như "thành"->"thành/ Date of
  completion", và mọi dòng mà NGƯỜI đã quyết). Không có bước này thì rác nằm
  lại mãi: check_i18n.py báo "máy 0" vì bảng review che trên, nhưng xoá một
  dòng review là rác quay về đúng chỗ đó.
- Bản dịch chứa artifact của API (<ph ...>, </ph>, x="...) bị loại: đó là thẻ
  đánh dấu cấu trúc, không phải chữ hiển thị.
- Không ghi đè dữ liệu cũ: file JSON luôn là hợp của cache + bản dịch mới.
- index.json ghi số chuỗi đã dịch của từng ngôn ngữ VÀ số đã kiểm chứng —
  giao diện dùng nó để in "100% · 27% đã kiểm chứng" cạnh tên mỗi lá cờ,
  người dùng biết rõ mình đang đọc chữ của ai.

Dùng:  python tools/gen_translations.py              # tất cả ngôn ngữ
       python tools/gen_translations.py en zh        # chỉ en và zh
       python tools/gen_translations.py --offline     # không gọi mạng, chỉ
                                                      # dựng lại file từ cache
                                                      # + bảng kiểm chứng
"""

import datetime
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

# Windows mặc định ra lệnh print bằng cp1252 -> tiếng Việt sẽ vỡ
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent))
from i18n_scan import scan  # noqa: E402  (bộ quét dùng chung)

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
CACHE_FILE = TOOLS / ".translation_cache.json"
# Nơi đặt sai của bản cũ — xem migrate_legacy_cache()
LEGACY_CACHE_FILE = ROOT / ".translation_cache.json"
REVIEW_FILE = TOOLS / "translation_review.json"
CURATED_JS = ROOT / "js" / "i18n-curated.js"
OUT_DIR = ROOT / "js" / "lang"

LANGS = {"en": "en", "zh": "zh-CN", "fr": "fr", "es": "es", "ja": "ja"}
SOURCE_LANG = "vi"
BATCH = 25
DELAY = 0.6
# Google tính giới lượt theo phút; gặp 429 thì nghỉ rồi thử lại thay vì bỏ
RETRY_WAITS = (20, 45, 90)
UA = {"User-Agent": "Mozilla/5.0 (CySim translation builder)"}

# Dấu đặc trưng của tiếng Việt. Không có chúng thì chuỗi là mã nguồn, đường
# dẫn hay số — dịch máy chỉ tổ phá, nên giữ nguyên văn.
VI_DIACRITICS = re.compile(
    r"[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]",
    re.IGNORECASE,
)
# Thẻ đánh dấu cấu trúc mà Google gtx chèn vào kết quả. Đưa vào từ điển là
# bệnh nặng hơn cả sai nghĩa: người dùng sẽ nhìn thấy nó trên giao diện.
ARTIFACT = re.compile(r"<\s*/?\s*ph\b|</ph>|\bx\s*=\s*\"", re.IGNORECASE)
# Chữ Việt gõ thiếu dấu. Liệt kê thủ công vì nhận diện tự động sẽ bắt nhầm
# tiếng Anh; thêm từ mới khi tools/check_i18n.py mục [4f] gọi tên.
ASCII_VI_WORDS = re.compile(r"\b(nhanh tay|lam on|chuc mung|ban be|mat khau|tai khoan)\b", re.IGNORECASE)


def normalize(text):
    """Đúng như normalize() trong js/i18n.js: mọi chuỗi đều đi qua đây trước
    khi trở thành khóa, nếu không key curated ' (giả đuôi).' không bao giờ
    khớp với '(giả đuôi).' mà trình duyệt tra."""
    return re.sub(r"\s+", " ", text).strip()


def is_translatable(text):
    """Chuỗi nào là văn bản cần dịch. Chữ Việt gõ mất dấu vẫn là chữ Việt —
    "2. Nhanh tay" mà coi là code thì người dùng Nhật thấy tiếng Việt trên
    màn hình. Danh sách này ngắn có chủ đích: thà thiếu để check_i18n.py báo
    (mục f) còn hơn nhận nhầm tiếng Anh thành tiếng Việt không dấu."""
    return bool(VI_DIACRITICS.search(text)) or bool(ASCII_VI_WORDS.search(text))


def http_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as res:
        return json.loads(res.read().decode("utf-8"))


def google_batch(text, target):
    params = urllib.parse.urlencode(
        {"client": "gtx", "sl": SOURCE_LANG, "tl": target, "dt": "t", "q": text}
    )
    data = http_json("https://translate.googleapis.com/translate_a/single?" + params)
    return "".join(seg[0] for seg in data[0] if seg and seg[0])


def mymemory_one(text, target):
    params = urllib.parse.urlencode({"q": text, "langpair": "%s|%s" % (SOURCE_LANG, target)})
    data = http_json("https://api.mymemory.translated.net/get?" + params)
    if data.get("responseData", {}).get("translatedText"):
        return data["responseData"]["translatedText"].strip()
    raise RuntimeError("MyMemory trả về rỗng")


def acceptable(value):
    """Bản dịch chỉ được nhận khi có chữ và không mang artifact của API."""
    return bool(value) and not ARTIFACT.search(value)


def translate_batch(lines, target, cache):
    """Trả về list bản dịch tương ứng từng dòng, hoặc None nếu lệch.

    None cũng là kết quả khi MỘT dòng bị loại (artifact), để caller rơi về
    dịch từng dòng — thà chậm còn hơn đưa thẻ <ph> vào từ điển."""
    todo = [l for l in lines if l not in cache]
    if not todo:
        return [cache.get(l) for l in lines]
    out = None
    for attempt, rest in enumerate((0,) + RETRY_WAITS):
        if rest:
            print("    bị chặn, nghỉ %ds rồi thử lại cả lô" % rest)
            time.sleep(rest)
        try:
            out = google_batch("\n".join(todo), target)
            break
        except Exception as exc:
            print("    lô lỗi (lần %d): %s" % (attempt + 1, exc))
    if out is None:
        return None
    parts = [p.strip() for p in out.split("\n")]
    if len(parts) != len(todo):
        return None
    for line, value in zip(todo, parts):
        if acceptable(value):
            cache[line] = value
        elif value:
            print("    loại artifact: %r" % line[:40])
    if any(l not in cache for l in lines):
        return None
    return [cache[l] for l in lines]


def translate_one(line, target, cache):
    if line in cache:
        return cache[line]
    for attempt, rest in enumerate((0,) + RETRY_WAITS):
        if rest:
            time.sleep(rest)
        try:
            out = google_batch(line, target).strip()
            if acceptable(out):
                cache[line] = out
                return cache[line]
        except Exception:
            pass
        try:
            out = mymemory_one(line, target)
            if acceptable(out):
                cache[line] = out
                return out
        except Exception:
            pass
    return None


def load_cache():
    migrate_legacy_cache()
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    return {}


def migrate_legacy_cache():
    """Dời bản cache từng nằm ở THƯ MỤC GỐC về tools/ — chạy một lần, tự tắt.

    Vì sao phải có: code luôn đọc tools/.translation_cache.json, nhưng bản cũ
    để file ở gốc. Ai giải nén một bản gửi kiểu đó mà không để ý thì cache coi
    như trống, và lệnh dịch sẽ chạy lại từ đầu TOÀN BỘ chuỗi (~722 lúc viết dòng
    này) x 5 ngôn ngữ
    (~500 request, rất dễ dính rate limit của nhà cung cấp miễn phí).

    Không mất dữ liệu: mọi mục của file gốc được gộp vào CACHE_FILE trước, ưu
    tiên giữ bản đã có trong tools/, chỉ khi ghi gộp thành công mới xoá file
    gốc. File gốc là dữ liệu dựng lại được, không phải code.
    """
    if not LEGACY_CACHE_FILE.exists():
        return
    try:
        legacy = json.loads(LEGACY_CACHE_FILE.read_text(encoding="utf-8"))
    except Exception as exc:
        print("  Bỏ qua %s: không đọc được JSON (%s)" % (LEGACY_CACHE_FILE.name, exc))
        return
    if not isinstance(legacy, dict):
        print("  Bỏ qua %s: không phải từ điển \"vi:xx\" -> {...}" % LEGACY_CACHE_FILE.name)
        return
    current = json.loads(CACHE_FILE.read_text(encoding="utf-8")) if CACHE_FILE.exists() else {}
    added = 0
    for pair, entries in legacy.items():
        if not isinstance(entries, dict):
            continue
        target = current.setdefault(pair, {})
        for source, value in entries.items():
            if source not in target:
                target[source] = value
                added += 1
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    save_cache(current)
    LEGACY_CACHE_FILE.unlink()
    print("  Đã gộp %d mục từ %s (thư mục gốc) vào %s rồi xoá bản trùng."
          % (added, LEGACY_CACHE_FILE.name, CACHE_FILE.relative_to(ROOT).as_posix()))


def save_cache(cache):
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=0), encoding="utf-8")


def bo_dau(text):
    """Bỏ dấu thanh để so hai chuỗi "có thật sự khác nhau không".
    "Mạnh" và "Manh" khác nhau ở đúng một dấu sắc."""
    return "".join(
        c for c in unicodedata.normalize("NFD", text.lower())
        if unicodedata.category(c) != "Mn"
    )


def purge_cache(cache, sources, curated, review):
    """Dọn rác khỏi tools/.translation_cache.json — việc mắt thường không thấy
    vì check_i18n.py đã bị bảng review che: từ điển dựng ra đúng, nhưng hàng
    rác vẫn nằm lại và chờ quay về.

    Bốn lý do một dòng đáng xoá:
      1. chuỗi gốc không còn trong app nữa (mảnh vỡ của một lần đổi chữ cũ);
      2. NGƯỜI THẬT đã quyết chuỗi đó (curated hoặc translation_review.json).
         Đây là "nợ ẩn" đúng nghĩa: bản dịch máy sai vẫn nằm dưới, ai xoá một
         dòng trong bảng review là rác hiện lên ngay chỗ đó;
      3. máy dịch chỉ bỏ dấu tiếng Việt thay vì dịch: "Mạnh" -> "Manh";
      4. kết quả mang artifact của API hoặc echo lại bản gốc:
         "thành" -> "thành/ Date of completion".

    Xoá xong, từ điển dựng lại KHÔNG đổi một chữ nào (tầng người luôn thắng ở
    resolve()); chỉ cái nợ biến mất, và nếu về sau có bỏ một dòng review thì
    chuỗi đó được dịch máy LẠI với ngữ cảnh hiện tại thay vì ăn lại bản rác.
    """
    dropped = {"not_live": 0, "human": 0, "no_op": 0, "artifact": 0}
    for pair, per_lang in cache.items():
        lang = pair.split(":", 1)[1] if ":" in pair else pair
        human = authoritative(lang, curated, review) if lang in LANGS else {}
        for source in list(per_lang):
            value = per_lang[source]
            if source not in sources:
                reason = "not_live"
            elif source in human:
                reason = "human"
            elif not value or not value.strip() or ARTIFACT.search(value):
                reason = "artifact"
            elif bo_dau(value) == bo_dau(source):
                reason = "no_op"
            elif source in value and len(value) > len(source):
                reason = "artifact"  # "thành/ Date of completion"
            else:
                continue
            del per_lang[source]
            dropped[reason] += 1
    total = sum(dropped.values())
    if total:
        print("Dọn %s: %d dòng bỏ (chuỗi chết %d | người đã duyệt %d | chỉ bỏ dấu %d | artifact %d)"
              % (CACHE_FILE.name, total, dropped["not_live"], dropped["human"],
                 dropped["no_op"], dropped["artifact"]))
    return dropped


PAIR = re.compile(r'"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"')


def load_curated():
    """Đọc EN_DICT_CURATED từ js/i18n-curated.js.

    File JS nên không parse được bằng json; thay vì nạp V8, bắt các cặp
    "khóa": "giá trị" rồi unescape đúng hai loại escape mà bộ từ điển này
    dùng (\\" và \\n). Khóa được normalize để khớp với cách i18n.js tra."""
    if not CURATED_JS.exists():
        return {}
    text = CURATED_JS.read_text(encoding="utf-8")
    out = {}
    for key, value in PAIR.findall(text):
        k = normalize(key.replace('\\"', '"').replace("\\n", "\n"))
        v = normalize(value.replace('\\"', '"').replace("\\n", "\n"))
        if k and v:
            out[k] = v
    out.pop("_doc", None)
    return out


def load_review():
    """{lang: {chuỗi gốc: bản dịch đã kiểm chứng}} từ tools/translation_review.json."""
    if not REVIEW_FILE.exists():
        print("KHONG CO %s — chi dung curated, moi thu con lai do may dich." % REVIEW_FILE.name)
        return {}
    doc = json.loads(REVIEW_FILE.read_text(encoding="utf-8"))
    table = doc.get("strings", doc)
    out = {lang: {} for lang in LANGS}
    for source, per_lang in table.items():
        key = normalize(source)
        for lang, value in per_lang.items():
            if lang in out and isinstance(value, str) and value.strip():
                out[lang][key] = normalize(value)
    return out


def authoritative(lang, curated, review):
    """Bản đã kiểm chứng của một ngôn ngữ: curated (chỉ tiếng Anh) rồi tới
    bảng review — review thắng vì nó mới và có đủ cả 5 thứ tiếng."""
    merged = dict(curated) if lang == "en" else {}
    merged.update(review.get(lang, {}))
    return merged


def resolve(lang, sources, cache, curated, review):
    """Ghép 4 tầng quyền lực thành từ điển cuối cùng + số liệu nguồn gốc."""
    human = authoritative(lang, curated, review)
    per_lang = cache.get("%s:%s" % (SOURCE_LANG, LANGS[lang]), {})
    dict_out, prov = {}, {"review": 0, "machine": 0, "code": 0, "missing": 0}
    for s in sources:
        if s in human:
            dict_out[s] = human[s]
            prov["review"] += 1
        elif not is_translatable(s):
            dict_out[s] = s  # duong dan / payload / so: giuyen van
            prov["code"] += 1
        elif s in per_lang:
            dict_out[s] = per_lang[s]
            prov["machine"] += 1
        else:
            prov["missing"] += 1
    return dict_out, prov


def write_dict(lang, dict_out):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.joinpath(lang + ".json").write_text(
        json.dumps(dict_out, ensure_ascii=False, indent=2, sort_keys=False),
        encoding="utf-8",
    )


def write_index(sources, all_prov):
    """js/lang/index.json — cho giao diện biết từng ngôn ngữ đã dịch sẵn bao
    nhiêu chuỗi VÀ bao nhiêu trong số đó là chữ người thật kiểm chứng.
    Chạy --offline cũng cập nhật được số liệu này."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    index = {
        "_doc": [
            "Bảng đếm chuỗi dịch sẵn của từng ngôn ngữ — do tools/gen_translations.py sinh,",
            "KHÔNG sửa tay. js/i18n.js đọc total + langs.<mã> để in '100% ✓' và phân biệt",
            "'người đã duyệt' (review) với 'máy dịch' (machine) ngay cạnh tên lá cờ.",
            "Từ điển thật nằm ở js/lang/<mã>.json; nguồn kiểm chứng nằm ở tools/translation_review.json.",
        ],
        "total": len(sources),
        "generated": datetime.date.today().isoformat(),
        "langs": {lang: all_prov[lang] for lang in all_prov},
    }
    OUT_DIR.joinpath("index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return index


def write_reviewed(sources, curated, review):
    """js/lang/reviewed.json — danh sách chuỗi nguồn mà bản dịch KHÔNG do máy
    tự sinh, để giao diện dán nhãn "đã người duyệt" thay vì khoe 100% dịch sẵn.

    Lưu theo tập chung (curated / review / code) rồi mỗi ngôn ngữ trỏ tới tên
    tập, vì danh sách trùng nhau rất nhiều: chép 5 lần 700 chuỗi thì file nặng
    mà chẳng thêm thông tin. runtime chỉ nạp file này khi bật chế độ báo lỗi."""
    present = set(sources)
    # Tập "review" chỉ chứa chuỗi đã có đủ bản dịch cho CẢ 5 ngôn ngữ: dùng
    # chung một danh sách mà thiếu thứ tiếng nào thì ngôn ngữ đó sẽ bị khoe
    # nhầm là đã duyệt. check_i18n.py báo nếu bảng review bị lệch.
    reviewed_all = set.intersection(*[set(v) for v in review.values()]) if review else set()
    sets = {
        "curated": sorted(k for k in curated if k in present),
        "review": sorted(reviewed_all & present),
        "code": sorted(s for s in sources if not is_translatable(s)),
    }
    # Chuỗi không phải văn bản (đường dẫn, payload, hash) hiển thị nguyên văn ở
    # mọi ngôn ngữ -> coi như đã kiểm chứng, không cần ai đọc lại.
    langs = {
        lang: (["curated", "review", "code"] if lang == "en" else ["review", "code"])
        for lang in LANGS
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.joinpath("reviewed.json").write_text(
        json.dumps(
            {
                "_doc": [
                    "Các tập chuỗi nguồn đã qua mắt người (curated + bảng review) và",
                    "chuỗi không phải văn bản nên giữ nguyên (code).",
                    "Do tools/gen_translations.py sinh — sửa thì sửa js/i18n-curated.js",
                    "hoặc tools/translation_review.json rồi chạy lại tool.",
                ],
                "generated": datetime.date.today().isoformat(),
                "sets": {k: v for k, v in sets.items() if v},
                "langs": {lang: [n for n in names if sets.get(n)] for lang, names in langs.items()},
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return {k: len(v) for k, v in sets.items()}


def main():
    args = [a for a in sys.argv[1:]]
    offline = "--offline" in args
    wanted = [a for a in args if not a.startswith("--")] or list(LANGS)
    unknown = [w for w in wanted if w not in LANGS]
    if unknown:
        sys.exit("Ngôn ngữ không hỗ trợ: %s (chấp nhận: %s)" % (unknown, ", ".join(LANGS)))

    sources, unwrapped = scan(ROOT)
    curated = load_curated()
    review = load_review()
    print("Tìm thấy %d chuỗi trong index.html + js/." % len(sources))
    print("  curated (js/i18n-curated.js): %d | review (%s): %d/%d ngôn ngữ"
          % (len(curated), REVIEW_FILE.name,
             sum(1 for v in review.values() if v), len(LANGS)))

    cache = load_cache()
    purge_cache(cache, sources, curated, review)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    all_prov = {}

    for lang in wanted:
        target = LANGS[lang]
        key = "%s:%s" % (SOURCE_LANG, target)
        per_lang = cache.setdefault(key, {})
        human = authoritative(lang, curated, review)
        # Không dịch máy những gì người thật đã duyệt hoặc không phải văn bản
        missing = [s for s in sources
                   if s not in human and s not in per_lang and is_translatable(s)]
        print("\n[%s] còn %d/%d chuỗi phải dịch máy" % (lang, len(missing), len(sources)))

        failed = 0
        for start in range(0, len(missing), BATCH):
            if offline:
                break
            chunk = missing[start:start + BATCH]
            if translate_batch(chunk, target, per_lang) is None:
                for line in chunk:
                    if translate_one(line, target, per_lang) is None:
                        print("    BỎ: %r" % line[:50])
                        failed += 1
            else:
                failed = 0
            dict_out, prov = resolve(lang, sources, cache, curated, review)
            print("  tiến độ %d/%d%s" % (dict_out and prov["review"] + prov["machine"] + prov["code"],
                                         len(sources), "  (%d chuỗi lỗi)" % failed if failed else ""))
            save_cache(cache)
            write_dict(lang, dict_out)
            if failed >= 5:
                print("[%s] nhà cung cấp đang chặn, dừng ở đây — chạy lại lệnh để dịch tiếp." % lang)
                break
            time.sleep(DELAY)

        dict_out, all_prov[lang] = resolve(lang, sources, cache, curated, review)
        write_dict(lang, dict_out)
        print("[%s] %d chuỗi: %d kiểm chứng + %d máy + %d giữ nguyên (code) → js/lang/%s.json"
              % (lang, len(dict_out), all_prov[lang]["review"], all_prov[lang]["machine"],
                 all_prov[lang]["code"], lang))
        if all_prov[lang]["missing"]:
            print("     còn %d chuỗi chưa có bản dịch — chạy lại lệnh này để dịch tiếp."
                  % all_prov[lang]["missing"])

    save_cache(cache)
    reviewed_counts = write_reviewed(sources, curated, review)
    index = write_index(sources, {**load_existing_index(), **all_prov} if offline else all_prov)
    print("\njs/lang/index.json: %d chuỗi gốc" % index["total"])
    for lang, prov in index["langs"].items():
        print("  %-3s kiểm chứng %3d | máy %3d | code %3d | thiếu %3d"
              % (lang, prov["review"], prov["machine"], prov["code"], prov["missing"]))
    print("js/lang/reviewed.json: curated %d | review %d | code %d chuỗi"
          % (reviewed_counts.get("curated", 0), reviewed_counts.get("review", 0),
             reviewed_counts.get("code", 0)))
    print("Xong. Chạy lại lệnh này bất cứ lúc nào để dịch tiếp phần còn thiếu.")


def load_existing_index():
    """Khi --offline chỉ chạy vài ngôn ngữ, các ngôn ngữ khác vẫn giữ số liệu cũ."""
    path = OUT_DIR / "index.json"
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return {k: v for k, v in data.get("langs", {}).items() if isinstance(v, dict)}
    except Exception:
        return {}


if __name__ == "__main__":
    main()
