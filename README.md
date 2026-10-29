# CySim — bản đồ dự án

Mô phỏng an ninh mạng chạy **hoàn toàn trong trình duyệt**: 13 phòng lab (SQLi, XSS,
CSRF, IDOR, phishing, DDoS, firewall, mật khẩu, định vị IP, diệt mã độc, SIEM, tài
khoản, chứng chỉ), **trang Lý thuyết** 12 chủ đề × 4 mục (mục 4.5), **kỳ thi tốt
nghiệp** 20 điểm trắc nghiệm + 20 điểm tự luận với phòng thi khoá điều hướng, trần
45 phút và một lượt **thi thử không tính điểm** từ 6 lab (mục 4.1–4.4), XP + bảng xếp
hạng, khung chat AI **nhận kèm ảnh**, phóng to được, chọn được **độ sâu câu trả lời** và
**in số giây đo thật** dưới từng câu (mục 5.1–5.2, 5.4), mở được cả khi
**mất mạng** (mục 5.3), và 6 ngôn ngữ tự dịch. Không build, không thư viện — 52
file, mở là chạy. Backend Python là tuỳ chọn, chỉ để gọi Gemini: `server/` cho máy
này, `netlify/` cho bản web công khai (mục 5.5).

## 1. Chạy thử

```bash
python -m http.server 8137 --bind 127.0.0.1    # rồi mở http://127.0.0.1:8137
```

Phải chạy qua `http://`, không mở bằng `file://` — Service Worker và `fetch()` từ
điển `js/lang/*.json` đều bị chặn trên giao thức file. Nếu dùng VS Code, Live Server
đã chốt cổng 5505 trong `.vscode/settings.json`.

Mở app qua `http://` **một lần khi còn mạng** là những lần sau rút mạng vẫn dùng
được: lab, lý thuyết, kỳ thi và tiến độ vẫn chạy (mục 5.3). Riêng khung chat AI,
tra cứu IP và dịch thuật cần internet — và app nói to điều đó thay vì để người
dùng đoán.

Không bắt buộc: app chạy đầy đủ mà **không** cần gì thêm. Chỉ khi muốn gọi Gemini
(khung chat AI và vài lab) thì chạy thêm process ở mục `server/`. Nút "Hỏi AI" ở
góc trái dưới màn hình luôn hiện sau khi đăng nhập; vừa mở khung chat, dòng
trạng thái `#aiStatus` đã nói rõ máy chủ đang ở nước nào (chưa chạy → kèm đúng
lệnh cần gõ; chạy nhưng `.env` trống key; mở trang bằng `file://` → bảo chạy qua
`http://`; máy này mất internet → nói **đúng** bệnh đó, màu hổ phách, không bảo đi
bật lại một thứ đang chạy; hay đã sẵn sàng — mục 5.3). Chưa chạy proxy thì
khung chat vẫn trả lời đúng hai câu danh tính ("Bạn là ai", "Ai viết ra bạn") và
báo mọi lỗi bằng đúng thứ tiếng đang bật, dưới dạng dòng "hệ thống" — không bao
giờ đội tên "CySim AI" và không bị lưu vào lịch sử. Câu trả lời hiện **dần từng chữ**
(stream) — chữ đầu tới máy chủ là tới màn hình, thay vì chờ cả câu; đang chờ thì
nút Gửi đổi thành **Dừng** và dòng chờ hiện số giây thật đã chờ, nên một lượt
Google chậm không biến thành màn hình treo. Mỗi câu **xong** thì dưới bong bóng có dòng
`chữ đầu X,Ys · hoàn tất Z,Ws · <tên model đã trả lời>` — số do chính trình duyệt đo từng
lượt, không phải lời quảng cáo (đo 29-10-2026: 8/8 lượt 1,3–2,6 giây; xem mục 5.4 để biết
cái nào đã đo và cái nào chỉ là may).

Để xem kỳ thi tốt nghiệp: hoàn thành đủ **12 nhiệm vụ phòng lab** rồi mở màn hình
**Chứng chỉ** và cuộn xuống cuối (mục 4). Chưa đủ 12 thì đề thi không hiện — đây là
cố ý: "thi trước, học sau" làm mất nghĩa của bằng tốt nghiệp.

## 2. Bản đồ file

Mỗi file source đều có khối chú thích đầu file theo **cùng một khuôn**:

| dòng trong chú thích | trả lời câu hỏi |
| --- | --- |
| `LÀ GÌ` | file này là cái gì, thuộc bài nào |
| `CHẠY` | nó chạy lúc nào, diễn biến ra sao từng bước |
| `CHẠM TỚI` (hoặc `TOÀN CẦU`) | định nghĩa global nào, đọc global nào, DOM id nào |
| `AN TOÀN` (vài lab) | vì sao lab không tự gây ra lỗ hổng thật |

### Gốc dự án

| File | Dòng | Là gì · code của cái gì · như thế nào |
| --- | --- | --- |
| `index.html` | 2687 | Toàn bộ markup SPA: 18 `<section class="view">` (mới nhất là `#theory` — trang **Lý thuyết**, xem mục 4.5), màn hình đăng nhập `#authOverlay`, khung chat AI `#aiPanel` (`role="dialog"`, bị nhốt Tab — xem dòng `ai.js`) + nút `#aiFab` + ô hồ sơ tự khai `#aiProfileInput` / dòng trạng thái hồ sơ `#aiProfileState` + dòng trạng thái máy chủ `#aiStatus` + nút **phóng to** `#aiExpand` + **khay ảnh** `#aiImageBtn` / `#aiImageInput` (file input ẩn, `accept` bốn định dạng) / `#aiImages` (hàng xem trước, `data-no-i18n`) / `#aiImageState` (`data-no-i18n`) + **ô độ sâu câu trả lời** `#aiDepth` (mục 5.4 — `data-no-i18n`, `<select>` rỗng trong HTML vì `OPTION` nằm trong `SKIP_TAGS` của `i18n.js`: viết chữ Việt sẵn vào `<option>` là kẹt tiếng Việt mãi, nên `js/ai.js` sơn cả nhãn lẫn `<option>` bằng `t()`), symbol `#i-image` trong sprite, biển mất mạng `#netFlag` (`role="status"`, câu chữ tĩnh nên engine dịch được — `app.js` chỉ bật/tắt `[hidden]`), toast, khung đề thi `#examBody` + `#examResult` và khung báo khoá `#certLockMsg` / `#certLockText` / `#certProgress` (nằm trong màn hình Chứng chỉ; `#certLockMsg` mang `data-no-i18n` vì `certificate.js` vẽ lại theo từng trạng thái khoá). Trang Lý thuyết là **HTML tĩnh, không có file JS riêng**: 12 thẻ `.card`, mỗi thẻ 4 dòng `h4.theory-k` (Khái niệm / Cơ chế / Dấu hiệu / Phòng thủ) + 4 đoạn + một nút `data-goto="<lab>"` do `app.js` bắt. Cuối `<body>` là 22 thẻ `<script>` **theo thứ tự bắt buộc** (utils → i18n-curated → i18n → app → auth → 15 file lab → ai → boot); `certificate.js` nạp **trước** `exam.js` nên mọi chỗ đọc `Labs.exam` phải kiểm tra lúc chạy, không lúc khai báo. id của section = tên trong `showView("...")`; đổi id ở đây mà không đổi trong JS là thành màn hình trắng. |
| `style.css` | 703 | Giao diện: biến màu trong `:root`, layout sidebar + lưới card, style riêng từng lab, khung chat AI nổi góc trái dưới (`.ai-retry` = nút "Thử lại" nhỏ nằm cuối dòng trạng thái máy chủ, `margin-left:auto` để dồn sang phải; `data-state="no_net"` và `data-state="external"` màu **hổ phách** để phân biệt với `offline` **đỏ** — hai bệnh khác nhau, cách sửa khác nhau; `external` hổ phách chứ không đỏ vì host miễn phí đang thức dậy, không phải đã chết), khay ảnh (`#aiImages` qua `.ai-images`, mỗi tấm `.ai-img` + nút `.ai-img-bo`, dòng `.ai-image-state`), ảnh trong bong bóng (`.ai-thumbs` / `.ai-thumb`) và dòng ghi chú cho lượt cũ (`.ai-img-note`), **ô độ sâu + dòng đo thời gian** (mục 5.4): `.ai-depth-row` = hàng label + `<select>` nằm ngay trên nút Gửi, phần `select` chỉ override `padding` / `font-size` / `background-position` — ghi đè `background` là xoá luôn mũi tên SVG mà `select{}` toàn cục đã nhét vào; `.ai-time` = dòng chữ nghiêng 11px dưới bong bóng trả lời, **không có dòng này là không có bằng chứng tốc độ**, nên nó là một phần của tính năng chứ không phải trang trí), `.ai-panel.ai-drop` = viền nét đứt khi kéo ảnh vào, **phóng to**: `.ai-panel{resize:both;overflow:hidden}` (kéo góc dưới-phải, không nhớ) + `.ai-panel.ai-wide` (to mặc định, nhớ trong `cysim-ai-rong`) và `resize:none` dưới 860px vì điện thoại không có chuột để kéo, biển `.net-flag` cố định giữa đỉnh màn hình, khối `.exam-*` cho đề thi (câu hỏi, phương án, ô tự luận, gạch đầu dòng đạt/thiếu, bảng kết quả đỏ-xanh, `.exam-lock` = dòng dashed hổ phách khi kỳ thi còn khoá, `.exam-bar` = thanh amber chứa nhãn "phòng thi đang khoá" + đồng hồ `#examHom` + nút toàn màn hình + nút rời phòng, `.exam-hg` = chữ đồng hồ mono, `.exam-hg-cap` = đồng hồ chuyển đỏ + đậm khi còn dưới 5 phút, `.exam-huy` = dòng đỏ báo lượt trước đã bị huỷ vì thoát phòng / thoát toàn màn hình / hết giờ, `.exam-che` = hai nút chọn lượt thi thật/thử với bản đang chọn viền cyan, `.exam-thu` = dòng có vạch dọc màu cyan bên trái, nói thẳng đây là lượt thi thử không tính điểm), `.theory-k` = nhãn nhỏ viết hoa in đè trên từng đoạn lý thuyết. Breakpoint 860px khớp điều kiện `window.innerWidth <= 860` trong `app.js`. |
| `sw.js` | 190 | Service Worker PWA. **`CORE` liệt kê đủ 34 file runtime** — khung, style, manifest, icon, **cả 15 file `js/labs/*.js`** và **cả 7 file `js/lang/*.json`** — vì app không có bước build nên cách chắc nhất để "mất mạng vẫn mở được" là nhớ hết: bản cũ chỉ liệt kê khung + `index.json`, kết quả là phòng lab nào chưa từng được mở khi còn mạng thì mất mạng là bật ra màn hình trắng. `install` ghi từng file bằng `Promise.allSettled` chứ **không** dùng `addAll` (một file sai tên là `addAll` bỏ trắng cả bundle, và trên màn hình không có dấu hiệu nào); file hỏng chỉ bị `console.warn` nêu tên. **Tên cache `cysim-<hash>` tự sinh từ danh sách `CORE`** (hash djb2 32-bit, cơ số 36): thêm/bớt một file là tên cache đổi và `activate` tự xoá bản cũ — không còn bước "nhớ đổi `cysim-v14` → v15", kiểu đó tồn tại để con người quên. Chiến lược: file của app là **network-first** (sửa code xong F5 thấy ngay), font Google là **cache-first + làm tươi ngầm** (`MAY_CACHE` liệt kê tường minh `fonts.googleapis.com` / `fonts.gstatic.com`; response `opaque` vẫn cất được), còn **mọi request khác origin bị bỏ qua tuyệt đối** — EmailJS, API dịch, tra cứu IP, proxy AI cổng 8000 và cả máy chủ AI ở host công khai (Render/Railway, đường 2 mục 5.5) không bao giờ nằm lại trong cache, vì đó là chữ của người dùng. **Cùng quy tắc đó nay áp cho `/api/*` cùng origin** (sửa 29-10-2026, xem mục 5.5): khi AI chạy trên Netlify thì máy chủ AI nằm ngay trên domain của app, nên `GET /api/health` đi qua luồng network-first và bị ghi vào cache — lần mất mạng sau đọc lại bản cũ, màn hình báo "sẵn sàng" trong khi máy chủ AI đã chết; trạng thái của một máy chủ không phải tài nguyên tĩnh. Điều hướng lỗi mạng thì trả `index.html` đã cache. Kiểm chứng: F12 → Application → Service Workers → bật Offline rồi tải lại. |
| `manifest.json` | 20 | Manifest PWA (tên, màu, `start_url`, icon). **JSON không có chú thích được** → file này được mô tả ở dòng này, không có block header. |
| `icons/icon.svg` | 14 | Khiên + dấu tích, SVG thuần. `manifest.json` trỏ tới, `sw.js` cache. |
| `.vscode/settings.json` | 9 | Một thiết lập: cổng 5505 cho Live Server. App không đọc file này. |
| `chay-ai.bat` | 75 | Bật cầu nối Gemini **bằng một cú nháy đúp** (Windows): `cd /d "%~dp0"` → **ba lần kiểm tra trước khi chạy** (Python có trong `PATH` không → `python -c "import google.genai"` có import được không → `.env` có tồn tại không) → `python server\gemini_proxy.py` → giữ cửa sổ, và **vòng `:loop` tự bật lại sau 5 giây** nếu proxy chết bất thường (mọi mã thoát, trừ `0` và `3221225786` = người dùng bấm Ctrl+C / tắt cửa sổ). Lần kiểm tra thứ hai sinh ra vì "Python đã cài" ≠ "SDK đã cài": thiếu `google-genai` thì python chết ở `ImportError` trong vòng lặp, cửa sổ flash rồi tắt, và khung chat chỉ báo "máy chủ offline" — đúng cái triệu chứng mà file này tồn tại để chữa. In ra lệnh sửa (`python -m pip install -r server\requirements.txt`) rồi `pause` để người dùng kịp đọc. Không chứa key (proxy tự đọc `.env`). Viết tiếng Anh không dấu vì `cmd.exe` ở codepage 8-bit sẽ hỏi hoá mọi ký tự Unicode. Đây là file duy nhất không phải code app. |
| `netlify.toml` | 78 | Cấu hình host tĩnh cho Netlify — **thêm ngày 29-10-2026, xem mục 5.5**. Bốn việc: `publish = "."` (app không có bước build nên thư mục gốc chính là thư mục web), `directory = "netlify/functions"`, hai rewrite `/api/gemini` + `/api/health` → `/.netlify/functions/gemini` với `status = 200` (để `js/ai.js` gọi **cùng nguồn**, không phải sửa code lần nữa), và bốn khối `force` chặn `/.env`, `/server/*`, `/tools/*`, `/_legacy/*` bằng 404. `force` là bắt buộc: Netlify ưu tiên file có thật nếu không ép, còn 404 (chứ không 200) để kẻ dò không phân biệt được "file có mà bị chặn" với "không có file". **Không chứa key** — file này ai mở repo cũng đọc được, nên nó chỉ chứa đường dẫn và tên biến. Bẫy ghi ngay trong header: kéo-thả cả thư mục lên Netlify Drop là upload luôn `.env` của máy bạn; deploy từ Git thì `.gitignore` giữ key ở lại máy, khối chặn `/.env` chỉ là lớp thứ hai cho lỡ tay. |
| `README.md` | — | File bạn đang đọc: bản đồ toàn dự án. |

### `js/` — nhân của app (nạp theo đúng thứ tự)

| File | Dòng | Vai trò |
| --- | --- | --- |
| `utils.js` | 177 | Nạp **đầu tiên**. Định nghĩa `$()`, `tr()`, `CyUtil` (escape HTML, hex, SHA-256/PBKDF2 qua Web Crypto, đọc-ghi JSON, `humanizeSeconds`, `sleep`, `logLine`, **`trapFocus`**). `trapFocus(vùng, biến kiện)` giữ vòng Tab/Mũi-Tên-Tab **trong** một vùng: lọc `button, input, select, textarea, a[href], [tabindex]`, bỏ `disabled` / `[hidden]` / thứ không có `getClientRects()`, rồi chặn đúng hai đầu — phần tử cuối + Tab và phần tử đầu + Shift+Tab. nằm đây chứ không nằm trong từng file là vì `auth.js` và `ai.js` phải dùng **cùng một** luật: hai bản sao của một quy tắc thể nào cũng lệch nhau về sau. Chỉ định nghĩa, không tự chạy. |
| `i18n-curated.js` | 438 | Nạp trước `i18n.js`. `EN_DICT_CURATED`: ~380 mục "tiếng Việt → tiếng Anh" người thật đã kiểm chứng (tầng 1). |
| `i18n.js` | 993 | Máy dịch + máy áp dụng. 5 tầng: OVERRIDE → REVIEWED → BUNDLED → CACHE → MACHINE. Định nghĩa `t()`, `setText()`, `currentLang`, `I18nAdmin`; phát sự kiện `cysim:language` **cả khi đổi ngôn ngữ lẫn khi từ điển về lúc khởi động** — thiếu lần thứ hai là mọi vùng `data-no-i18n` vẽ bằng `t()` kẹt ở bản dịch máy cũ. |
| `app.js` | 403 | Nhân giao diện: `showView`, `complete()`, `renderProgress()`, toast, `API` (lưu tiến độ theo từng tài khoản), `RANKS`/`RANK_MAP`/`TOTAL_MISSIONS`, **`completedMissions`** (Set nhiệm vụ đã hoàn thành — tên đầy đủ, không phải `done` cụt: một cái tên ba ký tự trong file 400 dòng bắt người đọc phải dò hết file mới hiểu `done` của cái gì), **`TOTAL_LABS`/`labsDone()`** (bộ đếm 12 nhiệm vụ lab, loại trừ `"cert"` để khỏi deadlock), bảng xếp hạng (dòng của người dùng thật + các hạng mẫu, kèm một dòng nói thẳng "chỉ dòng của bạn là tài khoản thật, phần còn lại là dữ liệu mẫu"), monitor giả lập, `Labs{}`. `showView()` là **cổng điều hướng duy nhất** và cũng là chỗ khoá phòng thi: nếu `Labs.exam.dangLam()` mà id không phải `certificate` thì chỉ hiện toast rồi trả về — sidebar, nút `data-goto` trong trang Lý thuyết hay lệnh chuyển màn hình nào khác đều đi qua cổng này nên không có đường vòng. `showView("certificate")` gọi cả `Labs.certificate.render()` lẫn `Labs.exam.render()`; sự kiện `cysim:language` cũng vẽ lại bài thi. `showView()` còn dừng lab khi rời trang của nó — `Labs.ddos.stop()`, `account.cancel()`, `firewall.cancelScan()`, `antivirus.stop()`, `realip.stop()` — theo quy ước *lab khai báo hàm dừng, `app.js` gọi*, không để mỗi lab tự nghe sự kiện (quy ước này ghi lại ở mục 6 bước 5). Danh sách vẽ lại khi đổi ngôn ngữ kết thúc bằng `Labs.ai?.render()`: thêm một vùng `data-no-i18n` mới mà quên nối vào đây thì vùng đó kẹt chữ Việt trên giao diện tiếng Pháp. Cuối file là `paintNetFlag()` — bật/tắt `#netFlag` theo `navigator.onLine` và hai sự kiện `online`/`offline` — cạnh khối đăng ký Service Worker, vì "mất mạng" là thông tin về **app**, không riêng gì khung chat: câu chữ nằm tĩnh trong HTML để engine dịch, JS chỉ đổi `[hidden]`. `navigator.onLine` chỉ là lời khai của trình duyệt (mạng LAN không ra internet vẫn báo `true`), nên biển này là cảnh báo THÊM, không phải hàng rào: chức năng nào cần mạng thật vẫn tự báo lỗi đúng bệnh của nó. |
| `auth.js` | 594 | Màn hình khoá: đăng ký/đăng nhập, mã 6 số (EmailJS thật hoặc chế độ demo), "Ghi nhớ đăng nhập", dock tài khoản góc phải. Cửa duy nhất: `Auth.gate(callback)`. Phát `cysim:session` mỗi lần phiên đổi. Overlay mang banner **CHẾ ĐỘ DEMO** nói thẳng tài khoản chỉ nằm trong `localStorage` của máy này, chưa có đường nào ra internet — không được phép để người đọc tưởng đây là hệ thống đăng nhập thật. `Tab`/`Shift+Tab` bị nhốt trong `#authOverlay` bằng `CyUtil.trapFocus` (một dòng listener, không còn hai chục dòng lọc phần tử chép tay), nên bàn phím không lọt được ra màn hình đứng sau khung khoá — bảng khoá là **màn hình có thật và có mục đích bị modal**, khác khung chat AI bên dưới. |
| `ai.js` | 1170 | Khung chat AI: nút `#aiFab` mở `#aiPanel`, hỏi `/api/health` để vẽ `#aiStatus` — nơi gọi AI mặc định **đổi theo nơi mở trang** (mục 5.5: máy này → cổng 8000, domain công khai → `/api/gemini` cùng nguồn, hoặc **thẳng một máy chủ ở host khác** khi `MAI_CONG_KHAI` có URL — đường Render, giữ được SSE và không có trần 60 s), và ở năm trạng thái `offline`, `no_key`, `no_net`, `remote`, `external`, chính dòng đó vẽ thêm nút **Thử lại** (`.ai-retry`) gọi `checkServer()` ngay tại chỗ, để bật `chay-ai.bat` (hoặc cắm lại mạng) xong bấm một cái là biết máy chủ đã sống, không phải đóng/mở panel hay gửi nhầm một câu; ở trạng thái `file` thì KHÔNG vẽ nút vì thử lại vô nghĩa. Hai listener `online`/`offline` ở cuối `bind()` cũng gọi lại `checkServer()` để dòng "mất internet" tự biến mất khi mạng về. Gửi `{prompt, lang, history, stream:true, profile, depth}` tới proxy (kèm `lang` để server ép câu trả lời đúng thứ tiếng, kèm `profile` là **hồ sơ tự khai do chính người dùng gõ** vào ô `#aiProfileInput` trong panel — mặc định **rỗng**, chỉ gửi khi ô có chữ, lưu theo tài khoản ở `cysim-ai-profile:<email>`, và dòng `#aiProfileState` nói thẳng lượt này có gửi kèm bao nhiêu ký tự hay không; không còn chuyện một hồ sơ cá nhân định sẵn bị gửi đi cho mọi tài khoản), **đọc từng mảnh chữ qua SSE và tô dần lên màn hình** — chữ đầu tới máy chủ là tới màn hình, không chờ cả câu. Khi đang chờ, nút `#aiSend` đổi thành **Dừng** (cùng một chỗ, không thêm nút mới) và bấm vào là `AbortController` cắt request; dòng "đang soạn" chuyển sang đếm giây thật (`Máy chủ AI đang chậm… đã chờ 23s`) sau 8 giây để phân biệt "Google đang nghĩ" với "app bị treo", và tới 60 giây thì đổi thành câu chỉ thẳng nguyên nhân (key bị Google xếp hàng) kèm cách sửa. `render()` luôn giữ bong bóng chờ khi vẽ lại (đổi ngôn ngữ giữa lượt cũng không làm nó biến mất — từng có bug này). Chữ đã về trước khi dừng vẫn được giữ, chỉ lượt bị cắt mới bị đánh dấu `transient`. Mở trang bằng `file://` thì báo đúng bệnh "trình duyệt chặn request" kèm lệnh `python -m http.server`, không đổ tại máy chủ chưa chạy; máy chủ không trả lời thì câu báo lỗi hướng dẫn nháy đúp `chay-ai.bat`. Mỗi tài khoản một lịch sử (`cysim-ai:<email>`), nút xoá lịch sử, câu hỏi danh tính vẫn trả lời được khi proxy chết. Lỗi là dòng `system`: không nhãn, không lưu, không gửi lại cho Gemini. Hồ sơ nằm trong `<textarea>`, mà `TEXTAREA` thuộc `SKIP_TAGS` của `i18n.js` (engine cố tình không đụng chữ người dùng gõ) — hệ luỵ là `placeholder` và `aria-label` của ô cũng không bao giờ được dịch, nên `paintProfileState()` tự vẽ lại hai thuộc tính đó bằng `t()` mỗi lần đổi ngôn ngữ. Panel mang `role="dialog"` và bị **nhốt focus** bằng `CyUtil.trapFocus` (Tab ở nút cuối quay về nút đầu, Shift+Tab ở nút đầu ra nút cuối) — nhưng khác bảng khoá, đây là dialog **không modal** nên nó có đường thoát rõ ràng: `Esc` đóng, nút ✕ mang `title="Đóng (Esc)"`, và khi đóng focus **quay về `#aiFab`** thay vì rơi xuống `<body>` (WCAG 2.1.2: vòng lặp bàn phím luôn phải có lối ra, nhốt người dùng trong một khung chat không cho họ đi đâu là lỗi truy cập, không phải tính năng). **ẢNH** (mục 5.1): ba đường vào một khay — nút `#aiImageBtn` mở `#aiImageInput`, kéo-thả vào panel (`.ai-drop`), `Ctrl+V` trong ô gõ — tất cả đi qua `themAnh()` → `thuNhoAnh()` (canvas, cạnh dài tối đa 1568 px, JPEG 0,85, nền trắng vì JPEG không có kênh alpha; GIF và ảnh dưới 300 KB gửi nguyên bản để khỏi mất animation/nét), rồi vào mảng `anh` **chỉ trong RAM**. Trần máy cliente đặt **nghiêm ngặt hơn** máy chủ (3 tấm × 1,5 MB, server cho 4 × 2 MB / tổng 6 MB) để không thao tác nào trên màn hình chạm tới lỗi 413 khô khan. `send()` gỡ khay trước khi hỏi, ảnh gắn vào đúng một lượt, không nằm trong `history`, không xuống localStorage (`save()` chỉ ghi `soAnh`), bị xoá khi đổi tài khoản (`syncAccount()`), và được trả về khay khi lượt hỏi thất bại để bấm Gửi lại là đủ. `#aiImages` / `#aiImageState` mang `data-no-i18n` nên `veAnhKem()` tự sơn lại nhãn bằng `t()` khi đổi ngôn ngữ; dung lượng ghi bằng `CyUtil.formatBytes` (một tấm 72 B mà in "0.00 MB" thì người dùng tưởng hệ thống chưa nhận gì). **PHÓNG TO** (mục 5.2): `#aiExpand` lật class `.ai-wide` và nhớ lựa chọn vào `cysim-ai-rong` (theo máy, không theo tài khoản), nhãn do `veRong()` vẽ bằng `t()` kèm `aria-pressed`; kéo góc khung (CSS `resize`) thì to tuỳ ý, không nhớ. **ĐỘ SÂU + ĐỒNG HỒ** (mục 5.4): `#aiDepth` cho chọn `nhanh` \| `can-bang` \| `ky`, mã gửi xuống máy chủ **đúng bằng** khoá `DEPTH_MAP` trong proxy (slug ASCII không dấu, gạch nối), lựa chọn nhớ ở `cysim-ai-depth` theo máy; `docDoSau()` kiểm giá trị đọc được khỏi localStorage rồi mới gửi, nên một tay nào đó sửa `cysim-ai-depth` thành `"ky "` hay `"CAN_BANG"` vẫn không làm proxy nhận chữ rác. Mỗi câu trả lời được gắn một dòng `.ai-time` **"chữ đầu X,Ys · hoàn tất Z,Ws · <model>"** do `send()` đo bằng `performance`-grade `Date.now()`: chữ đầu = lúc mảnh SSE đầu tiên tới máy khách, hoàn tất = lúc stream đóng, `<model>` = tên máy chủ **tự khai** ở sự kiện SSE chót (đúng vào lúc proxy âm thầm đổi sang model dự phòng thì tên trên màn hình đổi theo — không có đường nào để tốc độ thật bị che). `leSec()` in dấu phẩy kiểu Việt khi UI đang tiếng Việt. Nhãn ba mức chỉ hứa cái **đã đo**: mức Nhanh cắt trần token nên câu *xong* sớm hơn chứ không làm chữ đầu tới sớm hơn, mức Kỹ nói "có thể lâu hơn" chứ không dám chắc. `Labs.ai` mở thêm `themAnh` và `soAnh()` cho kiểm thử tự động. Nạp **trước** `boot.js`. |
| `boot.js` | 35 | Nạp **cuối cùng**. `Auth.gate(startApp)` → đọc tiến độ đã lưu → `showView()`; đang ngồi trong phòng thi (`Labs.exam.dangLam()`) thì mở `certificate` thay vì `dashboard`, để F5 giữa bài vẫn trả người làm bài về đúng phòng. |

### `js/labs/` — 15 file, mỗi file một màn hình

| File | Nhiệm vụ (`data-k`) | Nội dung |
| --- | --- | --- |
| `account.js` | `acct` | Tạo tài khoản demo → đăng nhập + MFA → **dò mật khẩu bằng SHA-256 thật**, có nút huỷ. |
| `sqli.js` | `sqli` | `classify()` đọc cú pháp SQL thật (nháy đơn đóng chưa, gì đứng sau) → union / orderby / auth-bypass / literal / broken. Chế độ safe dùng `?`. |
| `phishing.js` | `phish` | Hai trang đăng nhập cạnh nhau, tìm 3 điểm bất thường qua `[data-spot]`. |
| `ddos.js` | `ddos` | Trò chơi phòng thủ: mỗi 800ms sinh IP, tick 1000ms trừ máu, BLOCK/Auto-Block/Cloudflare. Bảng trên màn hình quá 40 thẻ thì gỡ thẻ cũ nhất và **cộng luôn vào dòng "Bị gỡ khỏi danh sách"** — con số lấy từ bộ đếm thật, không phải chữ trang trí; kết luận cuối trận nói đủ cả ba (chặn · lọt · bị gỡ). Đổi ngôn ngữ giữa trận là `repaint()` vẽ lại toàn bộ, không để kẹt chữ Việt. |
| `password.js` | `pwd` | Thời gian bẻ khóa **tính thật** từ không gian ký tự ÷ 1 THash/giây, 5 tiêu chí. |
| `firewall.js` | `fw` | Lưới 6 cổng + công tắc tường lửa; quét cổng chỉ là đồng hồ mô phỏng. |
| `realip.js` | `realip` | **Lab duy nhất gọi ra ngoài**: bốn nhà cung cấp đã đo thật (ipinfo.io → get.geojs.io → ipwho.is → ipapi.co), mỗi nhà trả về một khuôn; nhà nào báo 429 bị "nghỉ" 10 phút nên lần tra sau bỏ qua ngay, nhớ kết quả trong phiên (tối đa 24 IP), và một lần bấm không phát hai request song song. IP riêng/không định tuyến được (`bogon`) báo "không tồn tại" chứ không in bảng toàn N/A. |
| `antivirus.js` | `av` | Quét **file thật người dùng chọn** (SHA-256, EICAR, đuôi kép, 9 mẫu hành vi). Nút "Demo giao diện" không tính hoàn thành. |
| `csrf.js` | `csrf` | Log request ẩn 9 dòng, số dư 10.000.000 → 1.000.000 VND. |
| `idor.js` | `idor` | "API" giả trả hồ sơ theo ID; đổi ID khác 1 là xem trộm dữ liệu người khác. |
| `xss.js` | `xss` | Payload chạy thật trong `iframe sandbox="allow-scripts"` → cô lập khỏi trang cha. |
| `siem.js` | `siem` | 20 dòng log, ẩn 3 cuộc tấn công; đủ 3 loại và 0 dòng sai mới XUẤT SẮC. |
| `certificate.js` | `cert` | **Nhiệm vụ thứ 13** — tấm bằng do kỳ thi dưới đây cấp. Mở khoá theo `lockState()`: còn thiếu lab → chưa nộp thi → thi chưa đỗ → mở. `#certNameForm` (ô nhập họ tên để in bằng) **ẩn khi kỳ thi còn khoá** — `certificate.js:125` — để không ai gõ tên rồi tưởng mình đã lấy được bằng. Từ `Labs.exam.THI_THU` (6) trở lên thì dòng khoá đổi thành "chưa đủ 12 để thi **thật**, nhưng lượt **thử** đã mở — xem khung thi cuối trang": dưới ngưỡng đó khung thi thử thật sự nằm ngay bên dưới, nên nói "chưa mở được gì cả" là nói sai. Mã = `sha256(tên\|cấp\|ngày)` cắt 8 ký tự; in thêm dòng học lực (chỉ khi đỗ) lên ảnh PNG 1400×900 tải về. |
| `exam.js` | 871 | **Kỳ thi tốt nghiệp** (mục 4): 10 câu trắc nghiệm 2đ + 4 câu tự luận 5đ, chấm tại chỗ. **Hai lượt, một máy chấm**: thi **thật** mở ở 12 nhiệm vụ và ghi kết quả vào `cysim-exam:<id>`; thi **thử** (không tính điểm) mở từ 6 nhiệm vụ và ghi vào `cysim-exam-thu:<id>`. `Labs.exam.dat()` / `.ketQua()` chỉ đọc khoá thứ nhất, nên điểm lượt thử **không có đường nào** tới chứng chỉ — không phải do một cờ `if` dễ bị quên, mà do dữ liệu nằm ở chỗ mà cổng chứng chỉ không nhìn thấy. Bảng chuyển lượt chỉ hiện khi cả hai mở; dưới 12 nhiệm vụ thì vẫn có dòng "đây là lượt thi thử…" để không ai làm một lượt vô điểm mà tưởng vừa thi thật. **Trần 45 phút** (`THOI_GIAN_PHUT`) tính bằng mốc `hetLuc` tuyệt đối trong bài đã lưu: F5, ngủ tab hay tắt máy không tặng thêm phút nào, đếm ngược hiện trên `.exam-bar` (`#examHom`, đổi đỏ dưới 5 phút), hết giờ thì `nopBai(true)` nộp hộ phần đã làm và in dòng "bài được nộp tự động vì hết giờ". Nhịp 1 giây chỉ sửa một text node, **không** gọi `render()`, để con trỏ đang gõ trong ô tự luận không bị bay. Có **phòng thi** (cờ `lam` + `fs`): cửa phòng → vào phòng (xin toàn màn hình + thanh `.exam-bar`) → nộp bài hoặc rời phòng; **thoát toàn màn hình khi chưa nộp là mất bài** (mục 4.2). `dangLam()` đọc thẳng localStorage và **tính cả hai lượt** để `app.js` hỏi khoá điều hướng. Không phải nhiệm vụ → không cộng XP, không đụng `TOTAL_MISSIONS`. |
| `guide.js` | — | Trang Hướng dẫn (không tính XP): bảng cấu hình EmailJS + bảng I18n (coverage, dịch hàng loạt, xuất từ điển, chế độ báo lỗi). |

### `js/lang/` — dữ liệu **sinh ra**, không sửa tay

| File | Nội dung |
| --- | --- |
| `en.json` `zh.json` `fr.json` `es.json` `ja.json` | Mỗi file **975 mục**, từ điển phẳng `"tiếng Việt": "bản dịch"` — đủ 975 chuỗi mà `check_i18n.py` tìm thấy, nên không còn chuỗi nào phải dịch trên trình duyệt. |
| `index.json` | Đếm theo tầng cho từng ngôn ngữ (`review/machine/code/missing`) — giao diện đọc để in `· 100% ✓`. Có `_doc` tự mô tả. |
| `reviewed.json` | Chuỗi nào **không do máy sinh** (tập `curated`/`review`/`code`). Có `_doc` tự mô tả. |

JSON thuần không cho phép comment, nên ba loại file trên được giải thích ở đây và
bằng khóa `_doc` (riêng hai file metadata).

### `tools/` — Python dựng từ điển (chạy trên máy, không nạp vào app)

| File | Dòng | Vai trò |
| --- | --- | --- |
| `i18n_scan.py` | 353 | Thư viện: tìm mọi chuỗi tiếng Việt trong `index.html` + `js/`. **Bỏ qua comment** → viết tài liệu tiếng Việt dài trong code không sinh thêm chuỗi cần dịch. **`decode_escapes()`** biến chuỗi trong source thành ĐÚNG ký tự mà engine JS nhìn thấy lúc chạy: trước đây `_string_literals()` thả nguyên text escape (`\"`, `\n`) vào bộ đếm, nên những key như `"<b>"` bị ghi vào từ điển với `\"` trong tên — không bao giờ khớp lúc chạy, tức là một họ chuỗi im lặng không bao giờ được dịch. |
| `gen_translations.py` | 539 | Dịch + ghi `js/lang/*.json`. Thứ tự quyền lực: `translation_review.json` → `i18n-curated.js` → chuỗi code giữ nguyên → cache dịch máy. `--offline` **dọn cache dịch máy**: bỏ mọi dòng mà key đã chết, key không phải tiếng Việt, hoặc value là bản sao vô nghĩa của key (kết quả HTM/JS trả về khi API dịch chết) — 3 496 dòng rác đã bị xoá một lần bằng cách này, và rác nằm lại thì vẫn là "technical debt ẩn" vì `check_i18n.py` chỉ phạt dòng được dùng. |
| `check_i18n.py` | 244 | Trọng tài: % theo tầng, chuỗi ngoài `t()` (chỉ là checklist), bản dịch rác, key chết. |
| `translation_review.json` | 6264 | **893 chuỗi × 5 ngôn ngữ do người thật dịch.** Không bao giờ bị máy đè. |
| `.translation_cache.json` | 869 | Cache đáp án dịch máy (`vi:en`, `vi:zh-CN`, …), còn **858 dòng** sau lượt dọn rác (từ 4 365 dòng). Dữ liệu dựng, không nạp khi chạy app. `máy 0` trong báo cáo là số dòng **được dùng thật**, không phải số dòng trong file — vì vậy mới cần `--offline` dọn lại định kỳ. |

### `test/` — kiểm thử tự động (không cần trình duyệt, không cần cài gì thêm)

| File | Dòng | Kiểm chứng cái gì |
| --- | --- | --- |
| `exam.test.js` | 237 | **Máy chấm của kỳ thi** (`js/labs/exam.js` → `Labs.exam.tinhDiem`) chạy trên input thật, không phải mô tả: bài bỏ trống ra 0/20 cho **cả hai** phần (không phải 0 trắc nghiệm + điểm thưởng ẩn); 10/10 trắc nghiệm = 20đ; 5/10 = 10đ, đúng ngưỡng đỗ; tự luận chấm theo từng ý, không vượt trần 20đ; một đáp án **một từ khoá** trong bài ngắn thì **không** được tính, nhưng hai từ khoá cùng lượt thì có, và một từ khoá trong bài ≥80 ký tự cũng có — tức là nguyên văn ba nhánh của `chamTungDe()`, kể cả nhánh dễ bị nới tay nhất. Nửa sau chạy trên **`localStorage` giả**: giấy thi ghi vào `cysim-exam-thu:<id>` (lượt thử) với điểm 20/20 **không** làm `Labs.exam.dat()` thành true và không để lộ kết quả qua `.ketQua()`; đúng số điểm đó ghi vào `cysim-exam:<id>` thì đỗ — tức là "thi thử không tính điểm" được đo bằng đúng cái cổng mà chứng chỉ đi qua, chứ không bằng một dòng mô tả. Thêm: chưa vào phòng thì `dangLam()` false, đang làm dở lượt thử thì `dangLam()` true (khoá điều hướng tính cả lượt thử), và bài lưu sai khuôn (thiếu câu, của đề cũ) bị bỏ thay vì làm nổ màn hình. |
| `i18n.test.js` | 346 | **Bản thân máy dịch** (`js/i18n.js`) trên năm từ điển thật trong `js/lang/`: thứ tự quyền lực fix > review > machine > code; `normalize` gom khoảng trắng thừa nên lookup không hỏng vì một dấu cách; `sanitizeRuntime` loại rác kiểu `"0"→"0"` ngay khi nạp; chuỗi lạ trả `null` ở cả `layerFor`, `lookup`, `provenance` chứ không âm thầm trả nguyên văn; `provenance` phân biệt review và machine; bất biến **`máy 0`** của `fr.json` được assert, nên một lượt dựng từ điển nào sinh ra bản dịch chưa ai duyệt là test đỏ ngay; tra ngược bản dịch về nguồn; `t()` ở tiếng Việt trả nguyên văn và **không** bỏ hàng đợi dịch máy; và **`fetch` giả chỉ cho đọc file `js/…` trên đĩa** — mọi URL khác trả `ok:false`, nên cái assert "test chạy offline hoàn toàn" là thật, không phải tuyên bố. |

Khuôn khổ: **không có jest/vitest, cố ý.** App là 22 thẻ `<script>` nạp vào **một
phạm vi toàn cục duy nhất**, nên `vm.runInContext` cho phép nạp đúng các file
nguồn thật vào cùng một context và đọc tiếp các binding `const`/`let` cấp cao
nhất mà `import` không lấy được — đó là lý do test không cần (và không được phép)
copy lại logic. Test chỉ nạp những gì nó kiểm chứng: `exam.test.js` đưa vào một bộ
stub tối thiểu có chú thích từng dòng (`$`, `document`, `localStorage`, `t`,
`showToast`, `Auth`, `CyUtil`, `TOTAL_LABS`…), `i18n.test.js` nạp `utils.js` +
`i18n-curated.js` + `i18n.js` thật rồi tự tạo DOM stub, `MutationObserver`,
`CustomEvent`.

**Giới hạn, nói thẳng:** 15 lab là IIFE, nội bộ không truy cập được từ Node, nên
phần *dâng DOM / bấm nút / đồng hồ đếm ngược* của lab vẫn chỉ được kiểm chứng bằng
cách mở trình duyệt (mục 1) — kể cả nhịp 1 giây của `#examHom` và luật "F5 không
tặng thêm phút nào". Hai file test này phong toả ba thứ dễ hỏng nhất mà lỗi của nó
không hiện ra màn hình — **điểm thi**, **cách ly lượt thi thử / lượt thi thật**, và
**từ điển ngôn ngữ** — chứ không phải toàn bộ app.

### `server/` — tuỳ chọn: cầu nối Google Gemini (Python, không bắt buộc để chạy app)

| File | Dòng | Vai trò |
| --- | --- | --- |
| `gemini_proxy.py` | 1271 | Flask proxy: `POST /api/gemini {prompt, lang?, history?, profile?, images?, model?, depth?, stream?}` → gọi Gemini (mặc định **`gemini-flash-lite-latest`**, đổi bằng `GEMINI_MODEL`) bằng key **ở máy chủ**. `stream:true` trả `text/event-stream`: nhiều dòng `data: {"delta":"…"}` rồi một dòng chót `{"ok":true,"text":…,"model":…}` hoặc `{"ok":false,"code":…}`; không gửi `stream` thì vẫn nhận JSON `{ok,text,model}` như cũ — `model` là mô hình **thực sự** trả lời (có thể là bản dự phòng), và `js/ai.js` in đúng tên đó ra dưới bong bóng để người dùng thấy lúc nào proxy phải đổi model. Kèm `system_instruction` (AI của CySim, do Nguyễn Trí Đức viết, trả lời mọi chủ đề, **được nhắc phải viết gọn dưới ~150 từ**), `instruction_for(lang, ho_so)` nối thêm khối "BẮT BUỘC VỀ NGÔN NGỮ" → hỏi tiếng nào trả lời tiếng đó (`lang` lạ hoặc thiếu thì giữ khuôn gốc), và nối **hồ sơ người học** mà `js/ai.js` gửi lên: `clean_profile()` bỏ ký tự điều khiển, nén dòng trắng, cắt ở `MAX_PROFILE_CHARS = 2000` rồi mới đưa vào `system_instruction`, nên một body độc hại không phình chỉ thị; hồ sơ chỉ dùng để cá nhân hoá, không đọc lại thành tiếng cho người dùng, và proxy không tự bịa thêm chi tiết đời tư. Lịch sử gửi lên bị cắt còn 16 lượt / 9 000 ký tự. **Ảnh kèm** (mục 5.1): body có thể mang `images:[{mime,data(base64)}]`, và `clean_images()` là chốt kiểm soát độc lập — trình duyệt đã chặn một lần vẫn không được tin, vì payload gửi tới cổng 8000 không phải thứ do trang này tạo ra. Chốt đó giữ `ANH_CHO_PHEP` = PNG/JPEG/WebP/GIF, tối đa `MAX_IMAGES = 4` tấm, `MAX_IMAGE_BYTES = 2 MB` một ảnh, `MAX_IMAGES_BYTES = 6 MB` một lượt, rồi mới ghép `types.Part.from_bytes()` vào **trước** chữ của lượt hỏi trong cùng một `user` content (đảo ngược là mô hình trả lời câu chữ rồi quên tấm ảnh). Base64 rác bị bắt ở đây chứ không để nổ thành `api`. Vượt trần nào thì trả mã đó: `bad_image` cho "không phải ảnh được nhận", `too_large` cho "ảnh quá khổ" — `MAX_BODY_BYTES = 12 MB` đặt cao hơn trần ảnh để Flask không kịp trả 413 khô khan trước khi người dùng nghe thấy một câu hướng dẫn. `--check` có nguyên khối `ẢNH GỬI KÈM` chạy sáu ca sai (không phải danh sách, sai mime, base64 rác, quá trần một ảnh, quá số ảnh, quá tổng) và một ca đúng để chứng minh chốt này thật sự chặn, không chỉ tồn tại. Từ 29-10-2026 `--check` còn một khối nữa, `đối chiếu bản Netlify`: `doi_chieu_netlify()` đọc **cả hai file bằng `ast`** và so 18 mục (`SYSTEM_INSTRUCTION`, `TEN_NGU_TRONG_APP`, `CHAT_ROLES`, `ANH_CHO_PHEP`, ba tên model, 13 con số trần, `SO_LAN_THU_LAI`) **từng ký tự**; không import bản kia vì import là để `.env` của máy này quyết định câu trả lời, và so với `ast` thì lệch một dấu phẩy trong `DEPTH_MAP` cũng hiện ra tên mục thay vì thành lỗi lúc 2 giờ sáng trên host. Thiếu file Netlify thì in "BỎ QUA" chứ không hỏng lệnh — repo này vẫn phải `--check` được nếu ai đó chỉ lấy `server/`. **Chống quá tải của Google:** `mo_stream()` thử mô hình chính `SO_LAN_THU_LAI = 2` lần, nghỉ theo `THANG_NGHI = (0.0, 1.5)` — lần đầu thử **ngay**, lần hai nghỉ 1,5 giây — rồi mới chuyển sang `GEMINI_FALLBACK_MODEL`; 503 không nổ ở `generate_content_stream()` mà ở **mảnh chữ đầu tiên**, nên vòng retry phải bọc luôn `next(gen)` — bọc mỗi lời gọi hàm thì không bao giờ bắt được lỗi. Bản cũ nghỉ 1,5 → 3 → 6 giây trước cả ba lần thử: một lượt bị Google từ chối là người dùng ngồi nhìn khung chat im lặng ~10,5 giây chết rồi mới tới lúc model đỡ đạn bắt đầu, và đó chính là con số "AI hỏng" mà người dùng gọi lên. **Độ sâu câu trả lời** (mục 5.4): trường `depth` = `nhanh` \| `can-bang` \| `ky` tra `DEPTH_MAP` để đổi *cùng lúc* model, `max_output_tokens` và `temperature`; giá trị lạ hoặc thiếu thì rơi về `UU_DAI_MAC_DINH` (= đúng hành vi cũ, không báo lỗi, không âm thầm đổi model người dùng), `chieu_sau()` gấp khoảng trắng/gạch dưới thành gạch nối nên `CAN_BANG` vẫn khớp, và bảng đang chạy luôn xem được ở `GET /api/health` → `depths`. tuning: `max_output_tokens` = `GEMINI_MAX_TOKENS` (**2048**; trần cũ 1024 cắt câu tiếng Việt giữa chừng vì tiếng Việt có dấu ăn token nhanh gấp đôi — đã gặp thật và đã nâng), `thinking_config` chỉ gửi khi `GEMINI_THINKING_BUDGET` không trống. `GET /api/health` (kèm `fallback`), `POST /api/config {lang}` (in ra đúng chỉ thị đang dùng cho từng thứ tiếng), `--selftest`, `--check`. `debug=False` luôn; còn **nơi nghe** thì do môi trường: `GEMINI_PROXY_HOST` (mặc định `127.0.0.1`) và cổng `GEMINI_PROXY_PORT` → `PORT` → `8000`, nên cùng một file vừa là proxy cục bộ vừa là máy chủ công khai (mục 5.5, đường 2). Ở chế độ công khai có thêm **hai lớp hãm**: `CYSIM_ORIGINS` (nguồn được phép — loopback LUÔN được tha để `chay-ai.bat` và Live Server không bao giờ bị khóa, kể cả khi quên khai) và `CYSIM_RPM` (mặc định 20 lượt/phút cho một IP, `0` là tắt hẳn). Nói thẳng như file đã nói: cả hai là **đồ hãm, không phải tường** — `Origin` là chữ do trình duyệt gửi nên curl giả được trong một dòng, và bộ đếm chỉ sống trong một tiến trình. Cái thật sự chặn hoá đơn vẫn là trần nội dung (`MAX_PROMPT_CHARS`, lịch sử 16 lượt / 9 000 ký tự, trần ảnh). CORS: mọi origin có host `127.0.0.1` / `localhost` / `[::1]` **ở bất kỳ cổng nào** đều được phép (app mở trên VS Code Live Server 5500, 3000… gọi được ngay), cộng thêm danh sách `CYSIM_ORIGINS` khi máy chủ ra ngoài; reply chỉ đóng dấu `Access-Control-Allow-Origin` khi origin khớp, nên không có chuyện mở toang cho thiên hạ — và đó cũng là lý do bản Render **phải** khai `CYSIM_ORIGINS=https://<domain-của-trang>`, nếu không thì trình duyệt đọc response ở đâu được nữa. `--check` có khối `hai lớp hãm công khai` đo đủ hai chiều: RPM=3 chặn đúng lượt thứ 4, origin lạ bị 403, origin khớp và loopback và client không gửi `Origin` (curl) đều đi qua. |
| `requirements.txt` | 3 | `google-genai` + `Flask`. Đã kiểm thử với google-genai 2.33.0 / Flask 3.1.3 / Python 3.13. |
| `.env.example` (gốc) | 77 | Khuôn khai báo `GEMINI_API_KEY` (**để trống trong template — bao giờ cũng vậy, đừng dán key thật vào file này**: chiều 29-10-2026 phát hiện chính key thật đã bị dán vào đây khi đổi key mới, và đã được trả về trống. File này được commit và được phát công khai như mọi file khác — key nằm trong nó là key công khai, phải thu hồi ở Google AI Studio), `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `GEMINI_DEEP_MODEL` (model cho mức "Kỹ" của ô độ sâu — mục 5.4), cổng, CORS, `GEMINI_SYSTEM_PROMPT`, và hai núm vặn `GEMINI_MAX_TOKENS` / `GEMINI_THINKING_BUDGET` để dạng comment. Mỗi dòng cấu hình đều kèm **số giây đo thật** và ngày đo, kể cả những lần đo ra số xấu (~3 phút ngày 27-10, 173,6 s với key mới chiều 29-10) — template là chỗ duy nhất người đọc có thể biết mặc định này đến từ đâu. Copy thành `.env`. |
| `.env` (gốc, không commit) | 50 | Đã tạo sẵn trên máy này, **đã có key thật** (không in ra tài liệu nào). `load_dotenv()` chạy **trước** khối cấu hình nên `GEMINI_MODEL` trong file này có tác dụng; bản cũ đọc `.env` sau khi `MODEL` đã snapshot — sửa dòng model mà không thấy đổi là vì thế. Dán key mới vào lúc máy chủ đang chạy không cần bật lại (`get_client()` tự đọc lại `.env` khi môi trường còn trống key); sửa một key **đã nạp** thì vẫn phải bật lại — chiều 29-10 proxy được bật lại nên key mới (sửa lúc 11:47, 53 ký tự) đã có hiệu lực, `/api/health` báo `keyConfigured:true`. Trên máy này nó đang để `GEMINI_MODEL=gemini-flash-lite-latest` + `GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite` và **không có** dòng `GEMINI_DEEP_MODEL` — mức "Kỹ" vì thế rơi về mặc định trong code, cũng là `gemini-3.5-flash-lite` (`/api/health` xác nhận cả ba ô). |
| `.gitignore` (gốc) | 12 | Chặn commit `.env`, `__pycache__`, `.venv`. `.env.*` bị chặn nhưng có `!.env.example` để template vẫn vào repo — đó chính là lý do template phải để trống key. |

Vì sao phải có proxy: gọi Gemini thẳng từ trình duyệt thì key nằm trong file tải
về, ai bấm F12 cũng lấy được. `server/` **không** được nạp khi mở app và nằm ngoài
quy ước "thuần JS": muốn dùng thì chạy thêm một process.

```bash
python -m pip install -r server/requirements.txt
cp .env.example .env    # máy này đã có .env sẵn -> bỏ qua dòng này, chỉ MỞ .env dán key MỚI vào
                        # (key đã lộ ở đâu đó = thu hồi ở aistudio.google.com rồi tạo lại)
python server/gemini_proxy.py --check      # test ghép lịch sử + ép ngôn ngữ, không cần mạng, không cần key
python server/gemini_proxy.py --selftest   # gọi thật: 3 câu mẫu + 2 câu hỏi danh tính
python server/gemini_proxy.py              # chạy http://127.0.0.1:8000
```

Trên Windows, khỏi cần terminal: **nháy đúp `chay-ai.bat`** (bên cạnh file này) — nó
`cd` về thư mục dự án rồi chạy đúng lệnh `python server/gemini_proxy.py`, giữ cửa
sổ mở, và **tự bật lại sau 5 giây** nếu proxy chết giữa đường (mã thoát khác 0 và
khác `0xC000013A`). Tắt AI = tắt cửa sổ đó. Đây là cách khuyên dùng vì lý do thực
tế: "khung AI không dùng được" hầu như luôn là "quên bật proxy" hoặc "cửa sổ chạy
proxy bị đóng", chứ không phải code hỏng.

Hai chỗ để người dùng tự chữa mà không cần đọc tới file nào:

- Dòng `#aiStatus` vẽ bệnh **trước khi gõ**: `offline` (chưa bật proxy trên chính
  máy này), `no_key` (`.env` trống), `file` (mở app bằng `file://` — trình duyệt
  chặn, phải chạy qua `http`), `no_net` (máy này mất internet — **màu hổ phách,
  không phải đỏ**), `remote` (trang đang chạy trên một domain công khai **không
  kèm máy chủ AI** — mục 5.5), `ready` (kèm tên mô hình). `no_net` tách ra riêng
  vì hai bệnh khác nhau mà một lời khuyên thì sai: proxy nằm trên chính máy này
  nên nó **vẫn sống** khi mất
  mạng, chỉ có Google là gọi không được; gộp chung vào `offline` là bảo người dùng
  đi bật lại một thứ đang chạy — và làm hỏng luôn lời hứa "app học được cả khi
  mất mạng", vì phần còn lại vẫn dùng tốt.
- Ở `offline`, `no_key`, `no_net` và `remote` có nút **Thử lại** ngay cuối dòng
  (`.ai-retry` trong `style.css`): bật `chay-ai.bat` (hoặc cắm lại cáp) xong bấm một
  cái là hỏi lại `/api/health`. Không có nút thì `checkServer()` chỉ chạy lúc mở panel và lúc bấm
  Gửi, nghĩa là cách duy nhất để biết máy chủ đã sống là đóng/mở panel hoặc gửi
  nhầm một câu — đúng cái vòng lặp làm người dùng tin rằng app hỏng. Ở `file` thì
  **không** vẽ nút: thử lại không thay đổi được gì nên vẽ ra là hứa cuội.

Giao diện gọi bằng một hàm. Bản **không stream** (curl, script kiểm tra, client cũ):

```js
async function askGemini(prompt, history, lang) {
  const res = await fetch("http://127.0.0.1:8000/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // history = [{role:"user"|"model", text}, ...] mới nhất ở cuối, có thể bỏ trống
    // lang = mã ngôn ngữ đang bật trong app (vi|en|zh|fr|es|ja) -> server ép trả lời tiếng đó
    body: JSON.stringify({ prompt, history, lang }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.code || ("HTTP " + res.status));
  return data.text;
}
```

`js/ai.js` thêm `"stream": true` vào body và tự đọc SSE — đó là lý do khung chat hiện
chữ dần thay vì ngồi chờ:

```js
// images: chỉ có mặt khi lượt này đính ảnh — [{mime, data(base64)}, ...]; không gửi
// trường này khi rỗng để payload của một câu hỏi thường y hệt như trước.
const res = await fetch(ENDPOINT, { method: "POST", headers: {...}, body: JSON.stringify({ prompt, history, lang, stream: true, images }) });
const reader = res.body.getReader(), giaiMa = new TextDecoder();
let dem = "";
for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  dem += giaiMa.decode(value, { stream: true });
  const events = dem.split("\n\n");
  dem = events.pop();                 // phần còn dở, để lại cho lượt đọc sau
  for (const e of events) {
    const line = e.split("\n").find((l) => l.startsWith("data: "));
    if (!line) continue;               // dòng rác không làm hỏng cả câu trả lời đã về
    const obj = JSON.parse(line.slice(6));   // bỏ chữ "data: "
    if (typeof obj.delta === "string") text += obj.delta;   // tô dần lên bong bóng
    else if (obj.ok === false) code = obj.code;              // dòng chót: xong hoặc lỗi
  }
}
```

Hai chi tiết dễ sai khi sửa đoạn này: `res.body` chỉ đọc được **một lần** (đừng có
`.text()` rồi mới parse), và `no_key` được resolve thành JSON 503 **trước** khi gửi
header stream — nếu để ngược thì trình duyệt nhận một stream mở rồi mới thấy lỗi.

Mọi response lỗi có `{ok:false, code, error}`. `code` là hợp đồng với giao diện
(`no_key`, `bad_key`, `quota`, `overloaded`, `api`, `empty`, `too_long`, `bad_request`,
`bad_model`, `bad_history`, `bad_image`, `too_large`, `unknown`); `js/ai.js` dịch `code`
ra đúng thứ tiếng đang bật, còn `error` (tiếng Việt) chỉ dành cho log — nhờ vậy màn hình
tiếng Nhật không bao giờ hiện chữ Việt của máy chủ. Google trả 503/504 (mô hình quá tải,
xảy ra thật lúc cao điểm) thành mã `overloaded` riêng, không lẫn vào `api`, để câu báo
lỗi nói được "chờ một lát rồi bấm Gửi lại" thay vì "xem console". `bad_image` và
`too_large` là hai mã của đường ảnh (mục 5.1): cái thứ nhất là "thứ này không phải ảnh
được nhận", cái thứ hai là "ảnh thật nhưng quá khổ", và người dùng xử lý hai chuyện đó
bằng hai cách khác nhau nên không được dồn thành một câu "gửi lỗi". `no_net` và `file`
thì **không** tới từ proxy: `js/ai.js` tự sinh ra trước khi kịp mở một request, vì có
gọi đi cũng không bao giờ có trả lời.

**Chậm và quá tải là hai chuyện khác nhau, và cả hai đều đã xảy ra thật.** Mô hình Lite
từng nhanh (1,5–5,2 giây ra chữ, đo 26-10-2026 — hôm sau thì không còn đúng nữa, xem
đo 27-10 bên dưới) nhưng Google từ chối nó bằng 503 "high demand" từng chục phút một
vài ngày. Vì thế một lượt đi qua ba lớp đỡ: (1) `mo_stream()` thử lại mô hình chính
`SO_LAN_THU_LAI = 2` lần theo `THANG_NGHI = (0.0, 1.5)` — lần đầu thử **ngay**, lần hai
nghỉ 1,5 giây; (2) vẫn 503 thì chuyển sang `GEMINI_FALLBACK_MODEL` (mặc định
`gemini-3.5-flash-lite`); (3) hết đường thì `overloaded` mới tới người
dùng, kèm câu nói rõ proxy **đã** tự thử lại. Bẫy lớn nhất khi viết lớp (1): SDK trả một generator nên
`generate_content_stream()` **không** nổ — 503 chỉ hiện ra ở `next()` đầu tiên, và
code chỉ bọc lời gọi hàm thì retry vĩnh viễn không chạy (đã đo: failure sau đúng
1,0 giây). Ngày 26-10-2026, 8/8 lượt thành công sau khi sửa, so với 5/8 trước đó.

Thang nghỉ bản cũ (1,5s → 3s → 6s, ba lần thử) **đã bị cắt mất 7 giây** khi đo đầu cuối
ngày 28-10-2026: một lượt bị Google từ chối là người dùng ngồi nhìn khung chat im lặng
~10,5 giây chết rồi mới tới lúc model đỡ đạn bắt đầu — con số đó, chứ không phải máy
chậm, là cái khiến người dùng gọi lên rằng "AI hỏng". 503 nghĩa là "hết chỗ ngay lúc
này", nên thử lại tức thì gần như luôn lọt sang cửa khác.

Phía giao diện, người dùng không bao giờ phải ngồi nhìn một khung đứng im: nút Gửi
biến thành **Dừng** khi đang chờ (bấm là `abort()` thật, chữ đã về vẫn được giữ), sau
8 giây không có mảnh chữ nào thì dòng chờ đổi thành `Máy chủ AI đang chậm… đã chờ 23s`
— đếm giây thật, không phải giả định — và tới giây 60 dòng đó nói thẳng nguyên nhân:
`Vẫn chưa có chữ nào sau 62s — key Gemini này đang bị Google xếp hàng. Cách duy nhất
hết chậm: thay key mới trong .env rồi bật lại chay-ai.bat.` Mở app bằng
`file://` thì request không "chết ngay" mà treo vô hạn, nên `ai.js` chặn trước và nói
đúng bệnh ("trình duyệt chặn request, chạy qua http"), thay vì đổ oan cho máy chủ
chưa chạy. CORS cũng không còn bắt người dùng phải đúng cổng 8137: proxy nhận mọi
origin loopback, nên VS Code Live Server (5500) hay `localhost:3000` dùng được ngay.

Hỏi tiếng nào phải trả lời tiếng đó: `instruction_for(lang)` nối vào SystemInstruction
một khối "BẮT BUỘC VỀ NGÔN NGỮ" nêu đích danh thứ tiếng (`tiếng Việt`, `日本語`…),
kèm hai điều kiện thắng-phụ đã kiểm chứng bằng `--check`: lịch sử lẫn tiếng Anh
không được kéo câu trả lời về tiếng Anh (chỉ nhìn câu hỏi mới nhất), và nếu chính
câu hỏi mới nhất viết bằng tiếng khác thì trả lời theo tiếng của câu hỏi. Tên riêng,
đường dẫn, lệnh, công thức giữ nguyên. `lang` không nằm trong danh sách (hoặc thiếu)
=> dùng khuôn gốc, không ghép gì. Muốn xem bản chỉ thị thật: `POST /api/config {lang}`.

Đã thử với key thật: `lang=vi` + lịch sử TOÀN tiếng Anh → trả lời tiếng Việt (trước
đây nó bắt chước tiếng Anh của lịch sử); `lang=vi` + câu hỏi tiếng Anh → trả lời
tiếng Anh, đúng ngoại lệ. Nghĩa là thứ tiếng của CÂU HỎI mới nhất thắng ngôn ngữ UI;
muốn đổi lại thì sửa ba dòng ghép thêm trong `instruction_for()`, không đụng giao diện.

**Độ trễ — các thay đổi đã áp dụng.** Cột "sau" ghi **số đo thật kèm ngày**, không ghi một
con số duy nhất cho mọi ngày: cũng một key, cũng một model, ngày 26-10 ra 1,5–5,2 giây,
ngày 27-10 ra ~3 phút, ngày 29-10 ra 1,3–2,6 giây.

| thay đổi | trước | sau (đo thật) |
| --- | --- | --- |
| Model mặc định hiện tại `gemini-flash-lite-latest` (đổi từ `gemini-3.1-flash-lite`, rồi từ `gemini-flash-latest`) | `gemini-flash-latest`: **241,7 s** mới ra chữ đầu · `gemini-3.1-flash-lite`: cơn 503 liên tục, một lượt **71,9 s** | **8/8 lượt 1,3–2,6 s, chữ đầu 0,64–1,71 s** (29-10-2026, đi qua chính proxy này). Ngày 27-10 cùng key thì mọi cấu hình đều ~3 phút (bảng dưới) |
| Stream từng mảnh (`stream:true` + SSE) | chờ cả câu mới hiện | chữ đầu tới máy chủ là tới màn hình |
| Cắt lịch sử gửi lên (16 lượt / 9 000 ký tự) | gửi cả lịch sử, prompt càng dài càng chậm | prompt gọn, token đầu vào giảm; **không đổi được giây** — đã đo, xem mục "payload" dưới bảng |
| `system_instruction` bắt viết gọn (< ~150 từ, không mở/ kết bài rườm rà) | câu trả lời dài, phải chờ viết hết | ít token đầu ra hơn |
| Nâng trần `GEMINI_MAX_TOKENS` 1024 → 2048 | câu tiếng Việt ~700 ký tự **bị cắt giữa chừng** (đây là bug, không phải mô hình hết ý) | hỏi dài vẫn trọn câu: 2 233 ký tự |
| Ô **Độ sâu** gửi `depth` + `DEPTH_MAP` (mục 5.4) | một tốc độ duy nhất cho mọi câu, ai chậm thì chịu | mức Nhanh trần 512 token: câu **xong** sớm hơn (1,3–1,7 s vs 1,45–2,6 s), chữ đầu **không** sớm hơn — đã đo, và nhãn trên màn hình nói đúng điều đó chứ không hứa bừa |
| Dòng `.ai-time` in **số giây đo được + model thật** dưới mỗi câu | người dùng chỉ có thể tin (hoặc không tin) lời quảng cáo | tự kiểm chứng từng lượt: `chữ đầu 1,2s · hoàn tất 2,1s · gemini-flash-lite-latest` |
| Retry 503 **từ mảnh chữ đầu tiên** + nghỉ 0s → 1,5s (2 lần) | 3/8 lượt chết hẳn vì Google báo "high demand"; thang cũ 1,5→3→6 s làm một lượt hỏng thành ~10,5 s im lặng | 8/8 lượt có câu trả lời (đo 26-10-2026); từ 28-10 không còn 7 giây chết trước khi đổi model |
| `GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite` | Lite hỏng là hết đường, người dùng chỉ thấy `overloaded` | lượt vẫn chạy được; đây là đường **chống lỗi** chứ không phải đường tốc độ (đo 29-10: 1,6–1,8 s, nhưng các đợt đo trước ~18–29 s) |
| Nút **Dừng** + dòng đếm giây | chờ 60 s không lối thoát, trông như app treo | cắt được request, chữ đã về vẫn giữ, biết đang chờ bao lâu |
| CORS nhận mọi cổng loopback | đổi sang cổng 5500/3000 là proxy từ chối, hiện ra như "AI chết" | 8137 / 5500 / 3000 đều gọi được, origin lạ vẫn bị chặn |
| Chặn xin lỗi khi mở bằng `file://` | request treo vô hạn, khung chat đứng im | báo ngay "trình duyệt chặn request" + in đúng lệnh `python -m http.server` |

**27-10-2026: "AI không dùng được" là thật, và thủ phạm là cái key chứ không phải code.**
Đo lại năm cấu hình, mỗi cấu hình một lượt thật đi qua proxy, cùng một câu hỏi:

| cấu hình `GEMINI_*` | chữ đầu | cả câu |
| --- | --- | --- |
| `MODEL=gemini-3.1-flash-lite` (mặc định **lúc đó**) | 177,4 s | 177,9 s |
| `MODEL=gemini-3.1-flash-lite` + `THINKING_BUDGET=0` | 178,7 s | 179,3 s |
| `MODEL=gemini-3.1-flash-lite` + `THINKING_LEVEL=minimal` | 189,5 s | 190,1 s |
| `MODEL=gemini-flash-lite-latest` | 174,3 s | 174,9 s |
| `MODEL=gemini-3.1-flash-lite` + `MAX_OUTPUT_TOKENS=128` | 191,7 s | 192,4 s |

Không có 503, không có `overloaded`, câu trả lời vẫn đúng ngôn ngữ — chỉ mất ~3 phút
mỗi lượt; một probe thẳng API với `maxOutputTokens=8` (chỉ xin 8 token) cũng mất
**170,7 s**. Mảnh bằng chứng quyết định: `GET
/v1beta/models` (chỉ liệt kê model, không suy luận gì) mất **168,8 s**, trong khi cùng
host và đường dẫn đó mà **key sai** thì Google trả lời trong **0,5 s**. Nghĩa là yêu cầu
bị giữ ở tầng tài khoản/key trước khi tới mô hình, nên đổi model, tắt "suy nghĩ" hay cắt
token đều vô ích — năm con số trong bảng chỉ dao động ~17 giây, đó là nhiễu mạng chứ
không phải khác biệt cấu hình. Việc cần làm nằm ngoài repo: thu hồi key cũ ở
`aistudio.google.com` (nó đã bị dán vào chat nên coi như lộ), ghi key mới vào `.env`, bật
lại proxy bằng `chay-ai.bat`. Đã kiểm từng đường trong app để không đổ oan: `/api/health`
sống, CORS chấp nhận origin từ cổng 5505 của người dùng, stream SSE tô chữ thật, nút Dừng
abort được, bong bóng chờ hiện suốt — triệu chứng đến từ phía Google.

**29-10-2026: đo lại, lần này cả 8/8 lượt đều dưới 3 giây.** Tám lượt thật gửi qua
`POST /api/gemini` trên máy này, stream bật, mỗi lượt in ra `chữ đầu` + `cả câu` +
model **máy chủ tự khai**:

| mức `depth` | model thật trả lời | chữ đầu | cả câu | số lượt |
| --- | --- | --- | --- | --- |
| `nhanh` (trần 512 token) | `gemini-flash-lite-latest` | 0,79–1,25 s | **1,31–1,74 s** | 3 |
| `can-bang` (mặc định) | `gemini-flash-lite-latest` | 0,64–1,71 s | **1,45–2,61 s** | 3 |
| `ky` (`GEMINI_DEEP_MODEL`) | `gemini-3.5-flash-lite` | 0,76–0,83 s | **1,64–1,81 s** | 2 |

Ba thứ đọc được từ bảng, và cả ba đều là số chứ không phải cảm nhận: **(1)** yêu cầu
"trả lời chưa tới 10 giây" đang đạt với margins lớn — lượt chậm nhất 2,61 s;
**(2)** chữ đầu **không** sớm hơn khi cắt token (0,79 s vs 0,64 s, trong biên nhiễu),
còn tổng thời gian thì ngắn thật vì câu ngắn thật — đó là lý do nhãn mức Nhanh nói
"câu ngắn, xong sớm" chứ không nói "trả lời tức thì"; **(3)** mức `ky` hôm nay **không**
chậm hơn mức `can-bang`, nên đừng viết vào tài liệu nào rằng model mạnh là model chậm —
mỗi lần chỉ đo được đúng một buổi, và đó cũng là lý do con số hiển thị ngay dưới từng
câu trả lời trên màn hình thay vì chỉ nằm ở đây. Một đợt đo khác cùng ngày cho 10/11 lượt
1,2–2,4 s và **một lượt 22,9 s**: Google xếp hàng thì vẫn có ngoại lệ, app không làm gì
thêm được, người dùng chỉ cần thấy đúng 22,9 giây đó trên màn hình.

Vì sao 27-10 ra ~3 phút còn sáng 29-10 ra ~2 giây? Buổi chiều 29-10 có một phép thử
A/B tình huống: người dùng đổi sang **key mới** trong `.env` (11:47, vẫn 53 ký tự, không
in ra tài liệu nào) rồi đo lại y nguyên code, y nguyên model, đi qua y nguyên proxy —
một câu 642 ký tự mất **173,6 giây**. Probe quyết định: `GET /v1beta/models` với đúng key
đó — một lời gọi **không suy luận gì cả**, chỉ liệt kê danh sách mô hình — mất **168,9
giây** (168,8 giây vào ngày 27-10, y hệt). Chậm nằm ở cửa của Google TRƯỚC khi một token
nào được sinh ra, nên không model, không `thinking_budget`, không trần token nào sửa được.
Vẫn không phải bằng chứng tuyệt đối rằng "tại key" — hai key cùng một tài khoản Google và
lần đổi key cũng là lần đổi giờ đo — nên repo chỉ cam kết điều đo được: **bệnh không nằm
trong code của dự án này**, và con số thật hiển thị dưới từng câu trả lời trên màn hình.

`GEMINI_THINKING_BUDGET` để trống vẫn là mặc định hợp lý (`thinking_budget=0` chạy được
trên `gemini-3.1-flash-lite` nhưng không nhanh hơn chút nào: 178,7 s so với 177,4 s;
đo 29-10 thì mức mặc định đã ra chữ đầu sau 0,64–1,71 s, không còn gì để "cứu" bằng con
số này). Muốn đổi model: sửa `.env` rồi **bật lại proxy**. Đổi lên bản "thông minh" hơn là chấp
nhận người dùng ngồi chờ. Lưu ý trung thực: các con số ở hai bảng trên là lúc đo, không
phải bảo đảm; khi Google quá tải vẫn ra `overloaded`. Đường SSE đã chạy thật đầu cuối:
một tab trình duyệt nhận và tô dần câu trả lời 936 ký tự tiếng Việt, bong bóng lưu đúng
vào `cysim-ai:<id>`. (Lần kiểm trước đó phải dùng stream giả lập vì tab tự động giữ
`res.body` rất lâu; tab đó cũng chỉ cho phép script chạy dưới ~15 giây, nên gửi rồi đọc
kết quả ở lệnh tách sau.)

Proxy chạy ở cổng khác? Không sửa code: mở console và ghi
`localStorage.setItem("cysim-ai-endpoint", "http://127.0.0.1:9000/api/gemini")`
rồi nạp lại trang. Ô đó ghi đè **mặc định đã tự đổi theo nơi mở trang** (mục 5.5):
máy này → `http://127.0.0.1:8000/api/gemini`, domain công khai → `/api/gemini`
cùng nguồn. Muốn đổi luôn cả lịch sử của một tài khoản: xoá
`cysim-ai:<email>` (hoặc bấm "Xoá lịch sử" ngay trong khung chat).

### `netlify/` — máy chủ AI cho bản web công khai (thêm 29-10-2026)

| File | Dòng | Là gì · code của cái gì · như thế nào |
| --- | --- | --- |
| `netlify/functions/gemini.py` | 816 | Bản **serverless** của `server/gemini_proxy.py`: cùng hợp đồng (`POST /api/gemini` → `{ok,text,model}`, `GET /api/health` → `{ok,model,keyConfigured,depths,images}`), cùng bộ mã lỗi, nhưng không đòi ai bật Python. Chỉ dùng **thư viện chuẩn** (`urllib`, `concurrent.futures`) — không `requirements.txt`, không SDK — gọi thẳng `https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent` với key đặt trong header `x-goog-api-key` (query string `?key=` bị ghi vào log của mọi thiết bị trung gian). `handler(event, context)` một cửa cho hai đường dẫn: `GET` → health, `POST` → câu hỏi, `OPTIONS` → 204 kèm CORS (để ô `cysim-ai-endpoint` trỏ từ máy khác tới được — đúng cái lỗi CORS mà proxy đã trả giá một buổi). Phần dễ hỏng nhất của một bản sao là **ghép payload**, nên `SYSTEM_INSTRUCTION` (4.023 ký tự), `TEN_NGU_TRONG_APP`, `CHAT_ROLES`, `ANH_CHO_PHEP` và 13 con số trần được `--check` của proxy đối chiếu **từng ký tự bằng `ast`** (đọc nguồn, không import — import là để `.env` của máy này quyết định "hai bản có khớp không"). Tự kiểm tra không cần mạng + không cần key: `python netlify/functions/gemini.py` → sáu khối ĐẠT (chỉ dẫn, lịch sử + khuôn contents, ảnh, ép ngôn ngữ, độ sâu, health). |

**Ba chỗ đi mượn từ proxy và một chỗ không đi mượn.** Đi mượn: toàn bộ khối làm
sạch (`clean_profile` / `clean_images` / `sanitize_history` — chặn dung lượng bằng
**độ dài chữ trước khi giải mã base64**, vì một chuỗi 500 MB giải mã xong thì hàm đã
chết vì hết bộ nhớ), `instruction_for()` (khuôn gốc + khối "HỒ SƠ NGƯỜI HỌC" + khối
"BẮT BUỘC VỀ NGÔN NGỮ"), và thang chống lỗi 503/504 (thử model chính 3 lần, nghỉ 0 s
rồi 1,5 s, cuối cùng đổi sang `GEMINI_FALLBACK_MODEL`). Không đi mượn được: **stream**.
AWS Lambda / Netlify Functions buffer toàn bộ response, nên không có `text/event-stream`
và không có hiệu ứng chữ dần — `js/ai.js` nhận thẳng JSON (mục 5.5, dòng "Đọc được câu
trả lời không SSE") và `.ai-time` chỉ in `hoàn tất Xs · <model>`, không bịa số "chữ đầu".

**Hạn giờ là phần phải tự dựng, vì timeout socket không đủ.** `GEMINI_FUNCTION_DEADLINE`
(mặc định 55 s, dưới trần 60 s của Netlify) được thi hành bằng
`ThreadPoolExecutor.submit(_goi, …).result(timeout=…)` chứ không phải bằng
`urlopen(timeout=…)`. Đo thật 29-10-2026 với chính hàm này và key của máy này: đặt
DEADLINE=6 rồi gọi, **socket timeout không cắt** — urllib ngồi chờ tới 49,9 giây rồi
trả 200; sau khi đổi sang sợi chia, cùng request bị cắt đúng **6,0 giây** và trả
`{ok:false, code:"overloaded"}`. Vì sao socket timeout không cắt thì chưa kết luận được
(chỉ Google biết bên trong nó gửi gì), nhưng con số lặp lại y hệt, và hệ luỵ thì rõ:
nếu chỉ tin timeout, trên Netlify đúng những lượt chậm nhất — tức là những lượt cần
câu hướng dẫn nhất — sẽ bị host giết và trình duyệt nhận một trang lỗi HTML mà
`js/ai.js` không dịch được thành lời khuyên nào.

**Ba lớp hãm của một endpoint công khai, nói rõ lớp nào là tường.** (1) Trần nội dung
là thật: prompt 4.000 ký tự, hồ sơ 2.000, lịch sử 16 lượt / 9.000 ký tự, 4 ảnh × 2 MB /
tổng 6 MB, body 12 MB — đó là chỗ chặn hoá đơn. (2) `CYSIM_RPM` (mặc định 20 lượt/phút
theo IP `x-nf-client-connection-ip`) chỉ là **đồ hãm**: bộ đếm sống trong một container
ấm, Netlify sinh thêm container khi tải tăng. (3) Lọc Origin **mặc định TẮT** và đó là
quyết định có lý do: curl giả `Origin:` trong một dòng, trong khi Netlify đặt biến `URL`
theo domain production — thêm domain riêng vào site là mọi lượt mở bằng tên
`.netlify.app` cũ rơi xuống 403, đúng cái bệnh "máy chủ AI chưa chạy" mà dự án này đã
mất một buổi để chữa. Muốn khoá thật thì khai `CYSIM_ORIGINS=https://domain-cua-ban`,
hoặc khoá cả site bằng cơ chế Access control của Netlify (plan nào có thì bật); **không**
nhét token chung vào `js/`: token nằm trong file công khai thì không còn là mật khẩu.

**Bằng chứng đã có (29-10-2026, gọi Google thật qua đúng `handler`):**
`HTTP 200 trong 170,5 s | ok=True model=gemini-flash-lite-latest 650 ký tự`, câu trả lời
tiếng Việt đúng khuôn "trả lời thẳng trước, giải thích sau" → payload REST được Google
chấp nhận, không phải chỉ chạy với mock. Cũng đo luôn: key này **chậm hơn mọi trần
serverless** (170,5 s > 60 s của host > 55 s tự cắt), nên trên Netlify **với key hiện tại**
mọi lượt sẽ trả `overloaded` chứ không trả lời. Đây là chuyện của key/tài khoản Google
(đã đo và ghi ở mục `server/`), không phải của code: cùng khuôn gọi đó, một key nhanh
đã đo 1,3–2,6 s thì nằm gọn trong 55 giây.

**Chưa kiểm chứng:** một lần deploy thật. File mới chỉ nằm trong thư mục này;
`cysim.netlify.app` vẫn chạy bản cũ cho tới khi bạn deploy lại. Các bước và điều phải
đổi trong dashboard ghi ở mục 5.5.

### _legacy/ — code chết, giữ lại để không mất lịch sử

`auth.legacy.js` (371 dòng) là bản `auth.js` cũ. Không file nào nạp, tên đã đổi nên
trình duyệt cũng không tự nạp. Đầu file ghi rõ nó là gì và 3 lỗi mà bản hiện tại đã sửa.

## 3. Lệnh hằng ngày

```bash
# Sau khi thêm/sửa chữ trong code — dựng lại từ điển, không gọi mạng
PYTHONIOENCODING=utf-8 python tools/gen_translations.py --offline

# Kiểm tra trước khi nộp: exit != 0 khi còn lỗi thật
PYTHONIOENCODING=utf-8 python tools/check_i18n.py --strict

# Kiểm thử tự động (2 file, exit != 0 khi máy chấm hoặc máy dịch sai)
node test/exam.test.js
node test/i18n.test.js

# Syntax-check một file JS vừa sửa, không chạy app
node --check js/ai.js

# Kiểm tra proxy mà KHÔNG cần key và KHÔNG cần mạng: mọi khối in "ĐẠT" (ghép lịch
# sử, ảnh kèm, ép ngôn ngữ, độ sâu DEPTH_MAP, hai lớp hãm công khai CYSIM_ORIGINS +
# CYSIM_RPM, chỉ dẫn hệ thống) — exit != 0 khi cấu hình lệch, ví dụ ai đó đổi khoá
# DEPTH_MAP thành chữ có dấu cách. Lệnh này còn đối chiếu bản Netlify (mục dưới)
# bằng `ast`: 18 mục phải khớp từng ký tự.
PYTHONIOENCODING=utf-8 python server/gemini_proxy.py --check

# Kiểm tra hàm serverless — cũng không cần key, không cần mạng, sáu khối "ĐẠT"
PYTHONIOENCODING=utf-8 python netlify/functions/gemini.py
```

`node` ở đây là Node 20+ bất kỳ. Trên máy này Node không nằm trong `PATH` — chỉ
có Node nhúng trong Qoder — nên hai lệnh test chạy được bằng:
`ELECTRON_RUN_AS_NODE=1 "<đường-dẫn-Qoder.exe>" test/exam.test.js` (và tương tự
cho `--check`). Test không cài dependency, không gọi mạng, không cần trình duyệt.

Trạng thái hiện tại: **1004 chuỗi gốc**, cả 5 ngôn ngữ `máy 0 | thiếu 0`,
`en` 933 chuỗi người duyệt + 71 chuỗi code, `zh/fr/es/ja` 922 + 82; bảng review
922 chuỗi; `check_i18n.py --strict` exit 0; `test/exam.test.js` **21 đạt / 0 lỗi**,
`test/i18n.test.js` **33 đạt / 0 lỗi**, `server/gemini_proxy.py --check` và
`netlify/functions/gemini.py` đều ĐẠT.

Ba lệnh Python để lại `__pycache__/` (bộ nhớ đệm của Python, sinh mỗi lần chạy —
kể cả `netlify/functions/__pycache__` khi chạy hàm trực tiếp).
Xoá nó trước khi đếm file hay đóng bài: `rm -rf tools/__pycache__ netlify/functions/__pycache__ server/__pycache__`.

## 4. Kỳ thi tốt nghiệp và dây chuyền cấp bằng (`js/labs/exam.js`)

Bằng tốt nghiệp là **một chuỗi khoá ba tầng**, không phải "làm 6 nhiệm vụ là có
bằng":

```
12 nhiệm vụ phòng lab  ──►  mở KỲ THI THẬT  (labsDone() >= TOTAL_LABS)
 6 nhiệm vụ phòng lab  ──►  mở lượt THI THỬ (không tính điểm — mục 4.3)
đỗ CẢ HAI phần (≥10/20) ──►  mở chứng chỉ   (Labs.exam.dat())
chứng chỉ               ──►  complete("cert") = nhiệm vụ thứ 13
```

`TOTAL_LABS = TOTAL_MISSIONS - 1 = 12` và `labsDone()` **loại trừ** `"cert"` — vì
`"cert"` chính là tấm bằng do kỳ thi này cấp; đếm nó vào điều kiện mở thi là tạo
ra deadlock (phải thi mới có bằng, mà bằng lại là nhiệm vụ cần làm để được thi).
Dưới 6 lab thì `exam.js` chỉ vẽ dòng khoá cùng hai bộ đếm `n / 12` (thi thật) và
`6 nhiệm vụ` (thi thử), ẩn cả hai nút và bỏ trống `#certGrade`; từ 6 lab thì khung
thi hiện ra nhưng ở lượt thử. `certificate.js` vẽ `#certLockMsg` theo đúng một trong
ba trạng thái: còn thiếu lab · đủ điều kiện nhưng chưa nộp bài · nộp rồi nhưng
chưa đỗ (kèm điểm từng phần) — nhánh "còn thiếu lab" đổi lời nhắn tuỳ `st.labs` đã
qua ngưỡng thi thử hay chưa (mục 4.3). Số liệu lấy từ `labsDone()` và
`Labs.exam.ketQua()`, nên đổi ngôn ngữ giữa lúc thi vẫn đúng thứ tiếng.

Đề thi nằm cuối màn hình **Chứng chỉ**. Mỗi phần thang **20 điểm**, xét bằng
**phần thấp hơn** (`Math.min(diemTN, diemTL)`), nên không thể đỗ nhờ một phần:

| phần | số câu | điểm | cách chấm |
| --- | --- | --- | --- |
| 1 · Trắc nghiệm | 10 | 2 điểm/câu = 20 | so **chỉ số** đáp án đúng (`d` trong `TRAC_NGHIEMLY`) — đổi ngôn ngữ không mất điểm |
| 2 · Tự luận | 4 | 5 ý × 1 điểm = 20 | bài dưới `KY_TU_TOI_THIEU = 30` ký tự (sau `chuanHoa()`, bỏ dấu, bỏ khoảng trắng) coi như bỏ, trả 0 cho cả 5 ý. Trên ngưỡng đó thì **một ý ăn điểm khi khớp ≥ 2 từ khoá** `TU_KHOA_TOI_THIEU` **hoặc** khớp ≥ 1 từ khoá trong bài dài ≥ `KY_TU_DAI = 80` ký tự. Nhánh "một từ khoá + bài dài" tồn tại có lý do: học sinh viết đủ ý bằng đúng một thuật ngữ nhưng diễn giải dài thì vẫn hiểu bài — còn một từ khoá lóe lên trong bài hai dòng thì không. `test/exam.test.js` khoá cả ba nhánh này. |

Xếp loại (**học lực in trên bằng**): **> 15 → Giỏi**, **10–15 → Khá**, **< 10 →
chưa cấp bằng**. Ngưỡng nằm ở `DIEM_GIOI` / `DIEM_DAT` đầu file; `>15` là chặt,
`>=10` là rộng để điểm 10 và 15 không rơi vào khoảng trống.

Học lực ghi lên `#certGrade` ("Xếp loại tốt nghiệp: …") **chỉ khi đỗ**;
`certificate.js` đọc đúng node đó để in lên ảnh PNG — chưa thi hoặc thi chưa đỗ
thì dòng ẩn, ảnh không có dòng rỗng và khung bằng không hiện. Nút **Nộp bài thi**
gọi thêm `Labs.certificate.render()` vì hai khung nằm chung một trang: chấm xong
là thấy ngay bằng hay chưa.

Bài làm lưu ở `cysim-exam:<Auth.id()>` (lượt thật) và `cysim-exam-thu:<Auth.id()>`
(lượt thử), chỉ chứa **chỉ số, boolean, điểm, ngày** —
không chứa chữ đã dịch, nên mở lại trên màn hình tiếng Nhật vẫn đọc đúng. Vùng
`#examBody` / `#examResult` / `#certLockMsg` mang `data-no-i18n`: engine dịch không
chạm tới, mọi chữ phải đi qua `t()` trong `exam.js` / `certificate.js` và `app.js`
phải gọi lại `Labs.exam.render()` khi đổi ngôn ngữ (đã nối ở sự kiện
`cysim:language`).

**Sửa/bỏ tính năng này:** 6 hằng số đầu file `exam.js` đổi được thang điểm, trần
thời gian và ngưỡng thi thử mà không động logic; thêm câu hỏi = thêm object vào
`TRAC_NGHIEMLY` / `TU_LUAN` rồi chạy hai
lệnh ở mục 3 (mỗi chuỗi mới phải có bản dịch người viết trong
`tools/translation_review.json` cho đủ 5 ngôn ngữ, không để máy điền). Bài thi **không**
phải nhiệm vụ: cố ý không cộng XP, không tăng `TOTAL_MISSIONS`, để điểm thi không lẫn
với điểm làm lab.

### 4.1 Phòng thi: vào là ở lại, không đi đâu được nữa

`render()` của `exam.js` có **ba trạng thái vẽ** trong cùng `#examBody`, quyết định
bởi cờ `lam` (boolean) trong `cysim-exam:<id>` / `cysim-exam-thu:<id>` — lượt nào
đang mở do `chonLuot()` chọn (mục 4.3):

| cờ | màn vẽ | mô tả |
| --- | --- | --- |
| `lam = false`, chưa chấm | **cửa phòng** | `h3 "Phòng thi tốt nghiệp"` + bảng chọn lượt (chỉ khi đủ 12 lab) + dòng "đây là lượt thi thử…" (mọi lần dưới 12 lab) + dòng quy tắc + ghi chú `exam-lock` + nút **Vào phòng thi** (nút do JS tạo, không có trong HTML). Hai nút Nộp/Đặt lại ẩn, `#examResult` xoá trắng. |
| `lam = true`, chưa chấm | **trong phòng** | 14 câu + thanh `.exam-bar` màu hổ phách: dòng "đang ở trong phòng thi, mọi trang khác bị khoá", **đồng hồ `#examHom`** (mục 4.4), nút **Toàn màn hình / Thoát toàn màn hình**, nút **Rời phòng thi**. |
| đã chấm | **kết quả** | bảng điểm đỏ–xanh + học lực; thêm dòng "Kết quả thi thử" nếu lượt đó là lượt thử; rời trạng thái này chỉ bằng nút **Đặt lại bài** (xoá bài của đúng lượt đang mở, tắt toàn màn hình, quay về cửa phòng). |

Khoá nằm ở `app.js` chứ không nằm ở `exam.js`: `showView()` là **cổng duy nhất** mà
mọi lần đổi màn hình đi qua (sidebar, chip nhiệm vụ, nút `data-goto` trong trang Lý
thuyết, `boot.js`), nên chỉ cần chặn ở đó là hết đường vòng —

```js
if (id !== "certificate" && Labs.exam?.dangLam()) { showToast(...); return; }
```

`dangLam()` đọc **thẳng localStorage** chứ không đọc biến `bai`, vì `bai` bị gán lại
trong lúc render; gọi ngược lại sẽ làm hỏng bài đang làm. Toàn màn hình chỉ là
**best-effort**: `requestFullscreen()` cần cú bấm thật của người dùng, tự động hoặc
`Esc` là thoát, nên app không coi nó là điều kiện an toàn — điều khoá thật là `showView`.
Nộp bài và Đặt lại bài đều gọi `toanManHinh(false)` trước, vì nếu không thì máy vẫn
ở chế độ toàn màn hình trong khi màn hình đã mở khoá. F5 giữa bài: `boot.js` thấy
`dangLam()` là mở `certificate` thay vì `dashboard`, người làm bài về lại đúng trang
thi — nhưng từ 4.2, F5 **trong** lúc đã vào toàn màn hình là mất bài.

### 4.2 Thoát toàn màn hình = mất bài (`huyLuot()`)

Yêu cầu của người dùng: "làm thêm phần khi thoát khỏi toàn màn hình thì sẽ không cho
làm bài thi nữa." `cysim-exam:<id>` có thêm hai cờ bên cạnh `lam`:

| cờ | ai ghi | ý nghĩa |
| --- | --- | --- |
| `fs` | `toanManHinh(true)` **chỉ khi** `requestFullscreen()` resolve | lượt này đã VÀO được toàn màn hình thật |
| `huy` | `huyLuot()` | lượt trước mất vì gì: `"fs"` (thoát toàn màn hình) hay `"roi"` (bấm Rời phòng thi) — chỉ để vẽ câu giải thích |

`huyLuot(lyDo)` là lối ra duy nhất của một lượt hỏng: `lam=false`, `fs=false`,
`huy=lyDo`, rồi **xoá sạch `tn` và `tl`** và `luu()`. Không có đường nào quay lại bài
cũ — đó chính là hình phạt mà đề bài yêu cầu.

Bốn đường thoát, chỉ ba đường bị phạt:

- **Esc / nút "Thoát toàn màn hình"** → trình duyệt bắn `fullscreenchange`; listener
  thấy `dangLam() && !document.fullscreenElement && bai.fs` thì gọi `huyLuot("fs")`,
  vẽ lại cửa phòng và toast "Đã thoát toàn màn hình. Lượt thi này bị huỷ và bài làm
  bị xoá."
- **F5** → trình duyệt tự bỏ toàn màn hình và **không** bắn sự kiện nào, nên kiểm tra
  nằm ngay trong `render()`: `if (!daCham && bai.lam && bai.fs && !document.fullscreenElement) huyLuot("fs")`.
- **"Rời phòng thi"** → cũng `huyLuot("roi")`: nếu không thì nút này là cửa lách để
  thoát toàn màn hình mà vẫn giữ bài.
- **"Nộp bài thi"** → **không** bị phạt: handler đặt `bai.lam=false; bai.fs=false;
  bai.huy=null` trong bộ nhớ, gọi `toanManHinh(false)` rồi `luu()`. Nghe có vẻ sai thứ
  tự (`exitFullscreen()` chạy trước khi ghi storage), nhưng `fullscreenchange` bao giờ
  cũng nằm ở task **sau** — JS đơn luồng nên `luu()` kịp ghi `lam=false` xuống
  `cysim-exam:<id>` trước khi listener đọc `dangLam()`. Cùng đường cho nút Đặt lại.

Hai bất biến phải giữ:

1. `fs` chỉ bật khi `requestFullscreen()` **resolve**. Trình duyệt có thể từ chối
   (không phải user gesture, iframe không được `allowfullscreen`): khi đó `fs` vẫn
   `false`, thoát fullscreen không xoá bài — lỗi của trình duyệt không được biến
   thành án phạt với học viên.
2. `lam=false` phải ghi xuống **trước** mọi `exitFullscreen()`. Đảo thứ tự là nộp bài
   xong bị trừ sạch.

Cửa phòng (`lam=false`, chưa chấm) giờ vẽ thêm dòng đỏ `.exam-huy` nếu `huy` khác
`null`, nói rõ lượt trước mất vì gì, và quy tắc in trong `exam-lock` đã nói thẳng:
*"Thoát toàn màn hình khi chưa nộp bài là mất bài, làm lại từ đầu."*

Kiểm chứng 28-10-2026 trong trình duyệt tự động (phải giả lập `requestFullscreen()`
vì tab tự động không được cấp toàn màn hình thật): bấm Rời phòng thi → cửa phòng +
`.exam-huy` bản "rời phòng", đáp án về 0; vào phòng có `fs` → thanh `.exam-bar` in
thêm dòng cảnh báo; `fullscreenchange` lúc `fullscreenElement` rỗng → huỷ + xoá +
`dangLam()` false; `render()` khi `lam && fs && !fullscreenElement` (ca khúc F5) →
cũng huỷ; nộp bài đủ 14 câu → bảng điểm 8/20 + 5/20 sống nguyên, `huy` vẫn `null`.
Chuỗi mới đọc đúng trên màn hình ở vi / en / ja. **Toàn màn hình thật và phím Esc
thật chưa thể bấm từ tab tự động** — hai đường đó chỉ được suy ra từ cùng một nhánh
listener, không phải đo trực tiếp.

### 4.3 Hai lượt thi: thử (từ 6 lab) và thật (từ 12 lab)

Một tấm bằng chỉ có **một vé thi** là chỗ dễ gây hối hận nhất của cả app: làm dở,
thoát toàn màn hình, hết giờ là mất hết. Nên từ `THI_THU_TU_SO_LAB = 6` nhiệm vụ,
`exam.js` mở thêm lượt **thi thử** — cùng đề, cùng `tinhDiem()`, cùng ngưỡng đỗ,
chỉ khác một chuyện: kết quả không có đường nào tới chứng chỉ.

Cách ly bằng **đường đi của dữ liệu**, không bằng một cờ `if`:

| | lượt THẬT | lượt THỬ |
| --- | --- | --- |
| mở khi | `labsDone() >= TOTAL_LABS` (12) | `labsDone() >= 6` |
| khoá localStorage | `cysim-exam:<id>` | `cysim-exam-thu:<id>` |
| `Labs.exam.ketQua()` / `.dat()` | đọc khoá này | **nhìn không thấy** |
| `Labs.certificate.render()` sau khi nộp | có gọi | **không gọi** |
| dòng trên bảng điểm | "Bằng tốt nghiệp: …" | "Kết quả thi thử: …" + dòng `.exam-thu` |

`chonLuot()` quyết định màn hình đang mở lượt nào: đang ngồi trong phòng nào thì
giữ phòng đó (F5 giữa lượt thử không đá người làm ra cửa phòng thật), còn lại đủ
12 nhiệm vụ thì theo nút đã bấm, dưới 12 thì mặc định lượt thử. Bảng chuyển lượt
chỉ vẽ khi cả hai lượt cùng mở; **dưới 12 nhiệm vụ thì hai nút không hiện nhưng
dòng "đây là lượt thi thử…" vẫn phải hiện** — ẩn nó đi là để học viên làm một lượt
vô điểm mà tưởng mình vừa thi thật, đúng cái lỗi "cái gì giả phải được nói là giả".
Đang ngồi trong phòng thì hai nút bị `disabled`: đổi được ô bài giữa lượt thì đồng
hồ và khoá điều hướng thành trò đùa.

Bảng dưới đây là những gì `test/exam.test.js` đo (không phải mô tả): giấy thi 20/20
ghi vào `cysim-exam-thu:<id>` → `dat()` vẫn `false`, `ketQua()` vẫn `null`; chép
đúng số đó sang `cysim-exam:<id>` → `dat()` `true`.

### 4.4 Đồng hồ 45 phút

`THOI_GIAN_PHUT = 45` được ghi xuống bài thi dưới dạng **mốc tuyệt đối** `hetLuc`
(`Date.now() + 45 phút`), không phải số phút còn lại trong bộ nhớ. Vì vậy F5, đổi
tab, máy ngủ giữa chừng **không tặng thêm phút nào** — đã đo: vào phòng còn 45:00,
reload giữa lượt, đồng hồ tiếp tục ở 44:19 với `hetLuc` cũ.

- Nhịp `setInterval` 1 giây gọi `capDongHo()`, hàm này **chỉ** sửa `textContent`
  của `#examHom` và bật `.exam-hg-cap` (đỏ + đậm) khi còn ≤ 5 phút. Nó cố ý không
  gọi `render()`: `render()` dựng lại cả 14 câu, con trỏ đang gõ trong ô tự luận
  sẽ bay mất — người làm bài mất chữ giữa câu chỉ vì một cái đồng hồ là lỗi của
  app, không phải của họ.
- Tới 0 thì `nopBai(true)`: bỏ qua chốt "vẫn còn câu trắc nghiệm chưa được trả
  lời", chấm đúng phần đã làm, ghi `ketQua.hetGio = true`, in dòng "Bài được nộp
  tự động vì hết giờ." và toast "Hết giờ — bài đã được nộp tự động." Giữ chốt đó
  ở đường này chỉ biến giới hạn 45 phút thành một lời khuyên.
- `render()` còn kiểm tra hạn ngay khi vẽ, để một lượt đã quá hạn từ lâu (máy tắt,
  tab ngủ suốt đêm) không hiển thị đề của một bài đã nộp.
- `huyLuot()` / `nopBai()` xoá `hetLuc` và `dungDongHo()` trước: lượt đã đóng thì
  đồng hồ cũ không còn nghĩa gì, và hai `setInterval` cùng chạy là hai đồng hồ.

**Nói thẳng giới hạn:** đây là đồng hồ chạy trên máy người học, chỉnh clock hệ điều
hành là qua mặt được, và app không có server nào để đối chiếu thời gian. Nó có giá
trị như một kỷ luật thi, không phải như một chốt chặn. Muốn chốt thật thì điểm và
thời gian phải được server cấp — đó là việc của một phiên bản có backend.

Kiểm chứng 28-10-2026 trong trình duyệt tự động: vào phòng lượt thử → `.exam-bar`
in "Thời gian còn lại: 45:00", `hetLuc` đúng +45 phút; sau 3 giây chữ đổi thành
44:44 → 44:40; reload giữa lượt vẫn còn 44 phút (không reset); ép `hetLuc` về quá
khứ rồi reload → bài tự nộp, bảng điểm hiện "Kết quả thi thử: Chưa đủ điểm cấp
bằng" + dòng "Bài được nộp tự động vì hết giờ.", `lam=false`, `hetLuc=null`, và
`Labs.exam.dat()` vẫn `false` dù lượt vừa nộp đạt 20/20 ở lượt thật; đang làm dở
lượt thử mà `showView("sqli")` → toast chặn, ở lại trang Chứng chỉ; chuyển sang
tiếng Anh, toàn bộ chữ mới (`Time remaining`, `Practice run · not scored`, `This is
a practice run: …`) hiện bản dịch người viết, không phải bản máy.

## 4.5 Trang Lý thuyết (`#theory`)

Yêu cầu của người dùng: "Thêm vào phần lý thuyết nữa, phải viết đầy đủ, chỉn chu."
Quy mô đã chốt: **một trang riêng trong sidebar, 12 chủ đề** — đúng 12 phòng lab,
thứ tự sidebar — và **dịch tay cả 5 ngôn ngữ**, không lấy bản dịch máy.

Cấu trúc mỗi chủ đề là một khuôn cố định, cũng là khuôn một người làm SOC phải hỏi:

| nhãn `h4.theory-k` | nội dung |
| --- | --- |
| **Khái niệm** | định nghĩa một câu, không ví dụ |
| **Cơ chế** | vì sao nó chạy được, nói rõ chỗ máy chủ bị đánh lừa |
| **Dấu hiệu** | log / hành vi nào cho thấy đang bị |
| **Phòng thủ** | việc làm cụ thể, ưu tiên cái chặn được gốc |

Không có file JS riêng: trang là HTML tĩnh trong `index.html` nên engine i18n dịch
bằng đúng cơ chế mọi markup khác, và `check_i18n.py` bắt được mọi chuỗi mới. Nút
cuối mỗi thẻ mang `data-goto="<lab>"` → `app.js` gọi `showView()`; đang ngồi trong
phòng thi thì bị chặn y như mọi trang khác (mục 4.1). Dòng kết trang nói thẳng
"Trang này chỉ chữ, không chỉ bài" — đọc lý thuyết **không** cộng XP, không mở khoá
gì cả; vẫn phải vào lab.

## 5. Khung chat AI: ảnh kèm, phóng to, độ sâu câu trả lời, chạy khi mất mạng và bản web công khai

Bốn tính năng này sinh ra từ bốn câu hỏi của người dùng: *"làm thêm phần mà nhận
được cả ảnh nữa, ở trong phần AI ý, phải nhận được ảnh và làm cho cái khung của
chat AI có thể được mở rộng to ra"*; *"làm thêm cả phần mà app vào được mà không
cần internet"*; *"làm thêm phần mà làm cho AI trả lời nhanh hết cỡ có thể, phải
giống y như gemini thật, trả lời trong chưa đầy 10 giây. Phải làm AI thông minh
hơn"*; và *"khi tôi up sản phẩm này lên netlify thì nó bị lỗi phần AI này
(cysim.netlify.app)…"*. Ba câu đầu nằm trọn trong ba file đã có (`js/ai.js`, `sw.js`,
`js/app.js`) cộng markup/style, **không thêm file nào**. Câu thứ tư thì không giữ
được như vậy: host tĩnh không chạy Python nên cần một máy chủ serverless — hai file
mới (`netlify.toml`, `netlify/functions/gemini.py`), và bạn Đức đồng ý nâng trần 50
lên **52** để có chỗ cho chúng (mục 5.5 và mục 7).

### 5.1 Ảnh kèm theo một lượt hỏi (`js/ai.js`)

**Ba đường vào, một khay.** Tất cả đi qua `themAnh()`:

| đường vào | code | chi tiết quyết định hành vi |
| --- | --- | --- |
| Nút **Đính ảnh** `#aiImageBtn` | mở `#aiImageInput` | file input **ẩn** (`hidden`, `tabindex="-1"`, `aria-hidden`), `accept="image/png,image/jpeg,image/webp,image/gif"` + `multiple`. Ẩn nên `CyUtil.trapFocus` loại đúng khỏi vòng Tab — input ẩn mà vẫn nhận Tab là bẫy bàn phím. |
| Kéo–thả vào khung | `dragover` / `drop` | viền nét đứt `.ai-drop` **chỉ** bật khi `e.dataTransfer.types` có `Files`, nên kéo một dòng chữ qua khung chat không bị báo "thả ảnh vào đây". |
| `Ctrl+V` trong ô gõ | `anhTuSuKien()` | clipboard **không** có file ảnh thì hàm trả `false` và **không** `preventDefault()` — dán chữ vẫn chạy y như trước. Chặn vô điều kiện ở đây là giết tính năng paste. |

**Thu nhỏ trước khi gửi** (`thuNhoAnh()`), vì một tấm ảnh điện thoại 4000×3000
nặng tới 6 MB và Google cũng chỉ "nhìn" ảnh ở cỡ hữu hạn:

1. `FileReader` → base64; số byte thật suy ra từ độ dài base64 (`× 3/4`) — không
   cần giải mã cả ảnh để đo.
2. Vượt `MAX_IMAGE_BYTES = 1 500 000` ngay từ đầu → từ chối, khỏi vẽ canvas.
3. **GIF** hoặc ảnh **≤ 300 KB** → gửi nguyên bản. Vẽ lại GIF bằng canvas là mất
   tích animation; nén lại một ảnh đã nhẹ chỉ làm mờ thêm.
4. Còn lại: canvas, cạnh dài tối đa `ANH_MAX_CANH = 1568` px, `toDataURL("image/jpeg", 0.85)`,
   **nền trắng** vì JPEG không có kênh alpha (nền mặc định là đen sì). 1568 px là
   cỡ chữ trong ảnh chụp màn hình vẫn đọc được.
5. Đo lại **sau** khi nén; vẫn vượt trần thì vẫn từ chối — trần là trần, không
   phải gợi ý.
6. Mỗi lý do hỏng một câu toast riêng: "không phải file ảnh" · "vượt trần 1,5 MB"
   · "không đọc được ảnh này" · "đã đính kèm đủ số ảnh cho một lượt". Gộp thành
   một lỗi chung thì người dùng không biết sửa gì.

**Trần máy khách nghiêm ngặt hơn máy chủ**: 3 tấm × 1,5 MB ở trình duyệt, còn
`server/gemini_proxy.py` cho 4 tấm × 2 MB / tổng 6 MB / body 12 MB. Đặt ngược lại
thì người dùng làm đúng những gì màn hình cho phép rồi ăn một lỗi 413 khô khan do
Flask sinh ra — trần chỉ có nghĩa ở chỗ người dùng thực sự chạm tới được.

**Vòng đời của ảnh — phần bảo mật của tính năng, không phải phần trang trí:**

- `anh[]` sống **trong RAM của trang**, không có bản sao nào khác.
- `send()` gỡ khay trước khi hỏi; ảnh gắn vào đúng **một** lượt (`addMessage("user", prompt, false, anhHoi)`).
- Trường `images` chỉ xuất hiện trong payload của lượt đó. `history` gửi lên proxy
  vẫn chỉ là `{role, text}` — ảnh **không** đi theo các lượt sau.
- `save()` chỉ ghi `soAnh` (số tấm) vào localStorage để vẽ lại dòng ghi chú trên
  bong bóng cũ; **dữ liệu ảnh không bao giờ xuống đĩa**.
- `syncAccount()` **xoá khay khi đổi tài khoản**: một tấm ảnh chụp màn hình bài tập
  hay tờ giấy riêng rơi vào lượt hỏi của người dùng kế tiếp trên cùng máy là đúng
  kiểu tai nạn mà một app dạy bảo mật không được phép có.
- Lượt hỏi thất bại → ảnh **được trả về khay**, bấm Gửi lại là đủ, không phải chọn
  lại từ đầu.
- Tray và bong bóng nói thẳng điều đó: dòng `#aiImageState` "chỉ đi kèm lượt hỏi
  này, không lưu lại", `.ai-note` trong panel, và `.ai-img-note` trên lượt cũ chỉ
  ghi *số tấm*, không ghi lại ảnh.

`#aiImages` / `#aiImageState` mang `data-no-i18n` nên `veAnhKem()` phải tự sơn lại
`alt`, `title`, `aria-label` bằng `t()` mỗi lần vẽ — và dung lượng ghi bằng
`CyUtil.formatBytes`: một tấm 68 byte mà in "0.00 MB" thì người dùng tưởng hệ
thống chưa nhận gì.

**Kiểm chứng 28-10-2026:** `python server/gemini_proxy.py --check` → khối `ẢNH GỬI
KÈM` chạy 6 ca sai + 1 ca đúng; proxy đang chạy từ chối 3 ca `bad_image` qua HTTP
thật; một tấm PNG đi hết đường `browser → proxy → Gemini → câu trả lời`. **Chưa**
kiểm chứng ở tầng nội dung (kiểu "tấm ảnh này màu gì") nên phần *mô hình nhìn hiểu
đến đâu* chưa được đo — chỉ đường truyền là được đo.

### 5.2 Phóng to và kéo rộng khung chat

Hai tầng, vì hai nhu cầu khác nhau thật sự:

- **Nút `#aiExpand`** lật class `.ai-wide` — cỡ rộng sẵn `width:min(1000px, calc(100vw - 300px))`,
  `max-height:min(920px, 92vh)`, `min-height` khung log 280 px, vẫn **chừa sidebar
  272 px** nên không che menu. Lựa chọn được nhớ trong `cysim-ai-rong` — theo
  **máy**, không theo tài khoản, vì khổ màn hình là chuyện của cái màn hình.
  `aria-pressed` + nhãn do `veRong()` vẽ lại bằng `t()` (kèm `title`), nên đổi
  ngôn ngữ giữa lúc dùng không kẹt chữ Việt.
- **Kéo góc dưới-phải** của khung (`.ai-panel{resize:both;overflow:hidden}`) — to
  tuỳ ý, **không nhớ**: muốn xem tạm một tấm ảnh thật to thì kéo, không phải bấm.
  Dưới 860 px thì `resize:none`, vì điện thoại không có chuột để kéo; ở đó
  `.ai-wide` bám lề `left/right/bottom:8px` và cao 92 vh.

### 5.3 Mở app khi mất mạng (`sw.js` + `js/app.js`)

Bốn việc, mỗi việc vá một lỗ có thật:

1. **`CORE` liệt kê đủ 34 file runtime** — khung, style, manifest, icon, 22 thẻ
   `<script>` (tức **cả 15 file `js/labs/*.js`**) và **cả 7 file `js/lang/*.json`**.
   App không có bước build nên cách chắc nhất để "mất mạng vẫn mở được" là nhớ
   hết. Bản cũ chỉ liệt kê khung + `index.json`: phòng lab nào chưa từng được mở
   khi còn mạng thì mất mạng là bật ra màn hình trắng.
2. **`Promise.allSettled`, không `addAll`** — một file sai tên làm `addAll` bỏ
   trắng cả bundle, và trên màn hình không có dấu hiệu nào; ở đây file hỏng bị
   `console.warn` nêu đúng tên.
3. **Tên cache `cysim-<hash>` tự sinh từ `CORE`** (djb2 32-bit, cơ số 36): thêm hay
   bớt một file là tên cache đổi và `activate` tự xoá bản cũ — hết kiểu "nhớ sửa
   v14 → v15", một bước tồn tại chỉ để con người quên.
4. **Font Google: cache-first + làm tươi ngầm** — `MAY_CACHE` liệt kê tường minh
   `fonts.googleapis.com` / `fonts.gstatic.com`, response `opaque` vẫn được cất.
   **Mọi request khác origin còn lại bị bỏ qua tuyệt đối**: EmailJS, API dịch, tra
   cứu IP và proxy AI cổng 8000 không bao giờ nằm lại trong cache, vì đó là chữ
   của người dùng. Điều hướng lỗi mạng thì trả `index.html` đã cache.

File của app vẫn là **network-first**, nên sửa code xong F5 là thấy thay đổi và
đổi *nội dung* file không cần đụng tới tên cache.

**Chỗ nói thẳng giới hạn.** `navigator.onLine` chỉ là lời khai của trình duyệt —
một mạng LAN không có lối ra internet vẫn báo `true`. Vì vậy biển `#netFlag`
(`paintNetFlag()` cuối `js/app.js`, đổi `[hidden]` theo `online`/`offline`) là cảnh
báo **THÊM**, không phải hàng rào: chức năng nào cần mạng thật vẫn tự báo đúng
bệnh của nó. Câu chữ nằm tĩnh trong HTML để engine i18n dịch được; JS chỉ bật/tắt.

Khung chat thì đi xa hơn một cái biển: nó **phân biệt hai bệnh**. `no_net` (màu hổ
phách) khác `offline` (đỏ), và đây không phải làm đẹp — proxy chạy trên chính máy
này nên nó **vẫn sống** khi mất mạng, chỉ có Google là gọi không được; gộp hai
trạng thái thành một là bảo người ta đi bật lại một thứ đang chạy. Khi
`navigator.onLine === false` thì `ask()` **return ngay** `{code:"no_net"}` thay vì
mở một request không bao giờ có trả lời, và `window.addEventListener("online")`
gọi lại `checkServer()` nên dòng bệnh tự biến mất khi mạng về, không cần đóng mở
panel.

**Kiểm chứng 28-10-2026:** tắt hẳn `python -m http.server` trên một cổng riêng
(5599 — cố ý không đụng cổng 5505 của VS Code) rồi tải lại đúng origin đó: app mở
được từ cache, console 0 lỗi, `cysim-<hash>` chứa đủ 34 response. Trên máy người
dùng: F12 → Application → Service Workers → tích Offline → tải lại, và nhớ rằng
lần đầu tiên phải mở app **khi còn mạng** để `install` ghi được `CORE`.

### 5.4 Độ sâu câu trả lời và đồng hồ đo thật (`#aiDepth` + `.ai-time`)

Yêu cầu đặt ra là "AI trả lời nhanh hết cỡ, chưa đầy 10 giây, và thông minh hơn". Phần
"nhanh" không thể hứa bằng lời — nó phải hiện ra được từng lượt — nên tính năng làm ra
gồm **một ô chọn** và **một dòng số đo**, còn tốc độ thật thì do Google quyết định theo
giờ trong ngày.

**Ô "Độ sâu câu trả lời" (`#aiDepth`).** Ba mức, mã gửi nguyên văn trong trường `depth`:

| mức | Proxy làm gì (`DEPTH_MAP`) | dùng khi |
| --- | --- | --- |
| `nhanh` | model chính + `max_output_tokens` **512** + `temperature` 0,4 | muốn xong sớm, không cần dài dòng |
| `can-bang` (mặc định) | model chính + `GEMINI_MAX_TOKENS` (2048) + 0,6 | bình thường — **bằng đúng hành vi trước khi có ô này** |
| `ky` | `GEMINI_DEEP_MODEL` + 2048 + 0,6 | câu cần phân tích sâu, sẵn sàng chờ |

Bốn ràng buộc đã kiểm chứng bằng `python server/gemini_proxy.py --check` (khối "độ sâu
câu trả lời: ĐẠT"), không phải bốn dòng chú thích:

- Khoá là **slug ASCII không dấu, gạch nối**. `chieu_sau()` gấp khoảng trắng và gạch
  dưới thành gạch nối, nên `Can Bang` / `CAN_BANG` / `" can-bang "` cùng khớp; giá trị
  **lạ** thì rơi về `UU_DAI_MAC_DINH` chứ không báo lỗi và không được phép đổi model mà
  client đã chỉ định rõ.
- Bản đầu đặt khoá `"can bang"` (dấu cách) trong khi hàm đổi dấu cách thành gạch nối →
  mức Cân bằng **không bao giờ khớp**, âm thầm rơi về mặc định. May là hai ô giống hệt
  nhau nên không ai phát hiện — bug kiểu này chỉ lộ khi thêm mức thứ ba. `--check` giờ
  chặn bằng `all(" " not in t for t in DEPTH_MAP)`.
- Mức Kỹ **đổi model chứ không đổi trần token**, và `.env.example` nói thẳng: xoá dòng
  `GEMINI_DEEP_MODEL` thì "Kỹ" và "Cân bằng" là hai nhãn trên một hành vi giống hệt
  nhau. Một ô chọn rỗng tuếch còn tệ hơn không có ô chọn.
- `<option>` do `js/ai.js` sơn bằng `t()`, không viết chữ Việt sẵn trong `index.html`:
  `SKIP_TAGS` của `i18n.js` bỏ qua thẻ `OPTION`, nên viết tĩnh vào HTML là ô đó kẹt
  tiếng Việt vĩnh viễn trên giao diện tiếng Pháp.

**Dòng số đo (`.ai-time`).** Dưới mỗi câu trả lời, `send()` in `chữ đầu X,Ys · hoàn tất
Z,Ws · <model>`: chữ đầu = khoảng từ lúc bấm Gửi tới **mảnh SSE đầu tiên tới máy khách**,
hoàn tất = tới lúc stream đóng, `<model>` = tên mô hình **máy chủ khai** ở sự kiện SSE
chót. Con số thứ ba là mấu chốt trung thực: đúng vào lúc proxy phải đổi sang model dự
phòng vì Google quá tải thì tên trên màn hình đổi theo, nên không có chuyện "hoả nhanh"
bằng model này rồi âm thầm trả lời bằng model khác. Số hiển thị cũng đi qua `leSec()` để
UI tiếng Việt dùng dấu phẩy. Dòng này **được lưu cùng lịch sử** (`save()` giữ trường
`thoiGian`), nên mở lại trang vẫn thấy lượt cũ hết bao lâu — nếu chỉ in lúc stream đang
chạy thì nó thành trò trình diễn, không thành bằng chứng.

**Số đo thật, 29-10-2026, đi qua proxy trên máy này** (bảng đầy đủ ở mục độ trễ): `nhanh`
1,31–1,74 s · `can-bang` 1,45–2,61 s · `ky` 1,64–1,81 s, 8/8 lượt, chữ đầu 0,64–1,71 s.
Yêu cầu "< 10 giây" đạt, và đạt **vì nó được đo**, không vì chọn được model thần thánh:
cũng key và config đó, ngày 27-10 đo ra ~3 phút mỗi lượt, và một đợt đo khác ngày
28–29-10 có một lượt 22,9 s. Hai quyết định **đã thử rồi bỏ** vì đo không có kết quả:
hedge (gửi song song hai model, lấy câu về trước) và cache câu trả lời tại chỗ — với
1,3–2,6 s thì chúng chỉ thêm rủi ro trả lời cũ; warm-up TLS lúc bật máy chủ cũng bỏ vì
mua ~0,5 s cho riêng lượt đầu bằng tiền API.

**Kiểm chứng trong trình duyệt (29-10-2026, `http://127.0.0.1:5505/`):** chọn
"Kỹ — sâu hơn, có thể lâu hơn" rồi gửi một câu, dòng in ra dưới bong bóng đúng nguyên
văn `chữ đầu 0,9s · hoàn tất 1,0s · gemini-3.5-flash-lite` — tức ô chọn đã đổi model THẬT
chứ không chỉ đổi nhãn, và dấu phẩy kiểu Việt (`leSec())` hoạt động. `localStorage` nhận
`cysim-ai-depth=ky` ngay khi bấm chọn. Đổi ngôn ngữ sang `fr` rồi `ja`: cả nhãn ô lẫn ba
`<option>` sơn lại theo `t()` ("Profondeur de la réponse" / "回答の深さ"; "Rapide — réponse
courte, terminée plus tôt" / "高速 — 回答は短く、早く終わる") và giá trị đang chọn **không
đổi** (vẫn `can-bang`) — repaint không được phép làm mất lựa chọn.
Hai điểm phải biết khi tự kiểm: `body.auth-locked .ai-panel{display:none}` làm khung chat
**ẩn khi màn hình đăng nhập còn lên** (đúng ý đồ, không phải bug — `getBoundingClientRect()`
trả 0 lúc đó, và `Labs.ai.open(true)` return sớm nếu `hidden` đã bằng trạng thái mong
muốn), và ô chọn chỉ có nghĩa khi proxy **đã bật lại** sau khi `.env` đổi.

### 5.5 Mở app trên Netlify / host tĩnh: AI cần gì, và vì sao key KHÔNG thiếu

**Bệnh thật (29-10-2026, `cysim.netlify.app`).** Khung chat báo
"Máy chủ AI chưa chạy. Nháy đúp file chay-ai.bat…" ngay trên trang công khai. Ba
bằng chứng lấy bằng `curl`:

| lệnh | kết quả | nghĩa |
| --- | --- | --- |
| `curl https://cysim.netlify.app/js/ai.js` | còn nguyên `DEFAULT_ENDPOINT = "http://127.0.0.1:8000/api/gemini"` | trang của khách bảo trình duyệt của khách gọi… chính máy của khách |
| `curl -o /dev/null -w %{http_code} https://cysim.netlify.app/.env` | **404** | key không nằm trên host — `.gitignore` chắn, và đó là hành vi ĐÚNG |
| `curl https://cysim.netlify.app/.netlify/functions/gemini` | 404 | host đó không có hàm AI nào cả |

Không có "chỗ nào thiếu key" trong dự án này. Đường đi của key đúng hai chỗ:
`GEMINI_API_KEY` trong `.env` (máy này đã có, 53 ký tự, không in vào tài liệu nào)
và `load_dotenv()` trong `server/gemini_proxy.py`. Netlify không hề thiếu key —
Netlify thiếu **máy chủ**: host tĩnh chỉ phát file, không chạy Flask, không giữ
tiến trình Python, nên không có gì nghe ở cổng 8000. Trang gốc là `https` còn proxy
là `http://127.0.0.1` nên kể cả khi proxy sống, yêu cầu vẫn bị chặn vì khác scheme.

**Năm chỗ đã sửa, tất cả nằm trong `js/ai.js`:**

| chỗ | code | nội dung |
| --- | --- | --- |
| Nơi gọi mặc định | `js/ai.js:125-129` | `MAY_TINH_NAY` test `location.hostname`: máy này (`127.0.0.1` / `localhost` / `[::1]` / `file://` ⇒ hostname rỗng) → `http://127.0.0.1:8000/api/gemini` như trước; **một domain công khai → `/api/gemini` cùng nguồn**, tức bản deploy chỉ cần gắn máy chủ AI vào đúng đường đó là khung chat sống, không phải sửa code lần nữa. `cysim-ai-endpoint` vẫn là ô ghi đè, thắng cả hai. |
| Trạng thái mới `remote` | `js/ai.js:656`, `:689`, `:738`, `checkServer()` | `#aiStatus` nói thẳng "Bản web này không kèm máy chủ AI nên khung chat không chạy được ở đây. Mọi phòng lab, bài thi và chứng chỉ vẫn dùng bình thường." và in **đúng URL đã gọi** (`noiGoi(healthUrl())`) để người deploy thấy app đang gõ cửa đường nào. Nút **Thử lại** vẫn vẽ: deploy xong bấm tại chỗ là biết, không phải tải lại cả trang. |
| Bệnh thật khi Gửi | `js/ai.js:873` | Host tĩnh trả 404/501 bằng HTML (không có JSON mã lỗi) → trước đây ra "AI không trả lời được. Xem console (F12)", đuổi người dùng đi tìm lỗi của một thứ chưa từng tồn tại; giờ đi cùng mã `offline` và `loiTuCode()` chọn câu theo nơi mở trang. |
| Đọc được câu trả lời không SSE | `js/ai.js:865` | Hàm serverless (AWS Lambda / Netlify Function) bị buffer toàn bộ response, không phát `text/event-stream` được, chúng trả `{"ok":true,"text":…,"model":…}`. Bản cũ coi mọi phản hồi không phải SSE là lỗi nên **câu trả lời nằm sẵn trong tay vẫn bị báo "unknown"**; giờ nhận thẳng, và `.ai-time` in "hoàn tất Xs · `<model>`" (mục 5.4) — không bịa số "chữ đầu" cho một phản hồi chưa từng được phát dần. |
| Trạng thái mới `external` + mã `forbidden` | `js/ai.js:662`, `:792`, `mayChuBenNgoai()` ở `:190` | Hai chỗ bản cũ nói dối mà người đọc không thể biết: (1) máy chủ ở host khác (Render/Railway/VPS) đang ngủ mà app báo "bản web này **không kèm** máy chủ AI" là nói sai — có, nó chỉ chưa trả lời; giờ `mayChuBenNgoai()` so origin của URL đã phân giải với origin của trang và vẽ `external`: chấm hổ phách (`style.css`), đúng URL health đã gọi, nút Thử lại, và câu "…máy chủ miễn phí có thể đang ngủ — bấm Thử lại và chờ một phút; nếu vẫn im thì máy chủ chưa chạy, hoặc chưa khai tên trang này vào CYSIM_ORIGINS." (2) 403 `forbidden` do chốt `CYSIM_ORIGINS` của proxy trả về trước đây rơi vào `unknown` ("xem console"); giờ nó chỉ đúng chỗ sửa — cấu hình máy chủ, không đổ lỗi người đang hỏi. `file://` vẫn được `mayChuCuaToi()` chặn lại trước, nên ba nhánh không chồng nhau. |

**Điều cố ý KHÔNG làm.** Không dán key vào `js/*.js`, `index.html`, `manifest.json`
hay `.env.example`. Host tĩnh phát **mọi** file cho **mọi** người: cùng một lệnh
`curl` ở bảng trên lấy được key trong bundle, và key trong bundle là key công khai —
kẻ quét GitHub/AI-URLs sẽ tiêu hết hạn mức, còn hóa đơn và trách nhiệm thuộc về chủ
key. Môi trường của Netlify (`Site settings → Environment variables`) cũng không
phải lối tắt cho file tĩnh: biến đó chỉ tới được code chạy **trên server** — tức
`netlify/functions/gemini.py` bên dưới — chứ không rơi vào file gửi cho trình
duyệt. Đây là cùng một bài học mà `js/labs/` dạy người học,
nên app không được phép làm khác để "cho nó chạy".

**Muốn AI chạy thật trên domain công khai** thì cần một máy chủ AI. Ngày 29-10-2026
làm **cả hai đường**: đường 1 thêm đúng hai file (`netlify.toml` +
`netlify/functions/gemini.py`) nên trần 50 file của mục 7 được nâng lên **52** — số
file mới là 2, không phải 3, vì hàm chỉ dùng thư viện chuẩn của Python; đường 2
**không thêm file nào**, chỉ đổi cách cấu hình `server/gemini_proxy.py` và một dòng
trong `js/ai.js`. Hai đường thay thế nhau bằng một biến: `MAI_CONG_KHAI` trống thì
đi đường 1, có URL thì đi đường 2.

1. **Netlify Function — ĐÃ LÀM.** Hai file mới: `netlify.toml` (redirect
   `/api/gemini` + `/api/health` → `/.netlify/functions/gemini`, che `/.env`,
   `/server/`, `/tools/`, `/_legacy/`) và `netlify/functions/gemini.py` (gọi thẳng
   `…/v1beta/models/<model>:generateContent` bằng `urllib`, không SDK, không
   `requirements.txt`; key đọc từ biến môi trường của Netlify). Mô tả đầy đủ, kèm
   số đo thật và các hạn giờ, ở mục `netlify/` trong phần 2. **Không phải sửa code
   app lần nữa**: `js/ai.js` đã tự chọn `/api/gemini` cùng nguồn cho mọi origin
   không phải loopback.

   Ba bước trong dashboard, theo đúng thứ tự:

   | # | Việc | Nơi bấm | Điều phải thấy |
   | --- | --- | --- | --- |
   | 1 | Khai key | Site configuration → Environment variables → `GEMINI_API_KEY` | cùng giá trị đang nằm trong `.env` của máy này; đánh dấu Secret nếu plan cho phép. Các biến khác (`GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `GEMINI_DEEP_MODEL`, `GEMINI_MAX_TOKENS`, `GEMINI_THINKING_BUDGET`, `GEMINI_FUNCTION_DEADLINE`, `CYSIM_RPM`, `CYSIM_ORIGINS`) **để trống cũng chạy**, vì mặc định đã nằm trong hàm. |
   | 2 | Deploy | Kéo **repo** lên GitHub rồi Connect new site from Git, hoặc Netlify Drop | Nên đi đường Git: `git status` thấy `.env` bị ignore nên key không rời khỏi máy. Drop thì phải chắc rằng thư mục upload **không kèm `.env`** — host tĩnh mà nhận được nó là coi như đã dán key lên trang công khai (redirect 404 trong `netlify.toml` là khoá thứ hai, không phải khoá duy nhất). Kéo **file** lẻ tẻ thì không có hàm nào chạy: `netlify.toml` và thư mục `netlify/functions/` phải nằm trong bản deploy. |
   | 3 | Xác nhận | `curl https://<site>/api/health` | JSON có `keyConfigured:true` và danh sách `depths`. `false` → hàm đã sống nhưng quên bước 1 (khung chat sẽ nói đúng chỗ thiếu, mã `no_key`). |

   Cái được và cái mất, nói thẳng: **mất** hiệu ứng chữ dần (Lambda buffer, không
   có `text/event-stream`) và thêm cold-start vài giây cho lượt đầu; **được** một
   máy chủ AI không đòi ai bật Python, và `.ai-time` vẫn in số đo thật. CẢNH BÁO
   thật nhất: với key hiện tại, câu trả lời đo được **170,5 s**, lớn hơn trần 60 s
   của host lẫn 55 s hàm tự cắt, nên trên Netlify **mọi lượt sẽ báo `overloaded`**
   cho tới khi đổi sang key nhanh (đã đo 1,3–2,6 s) — xem mục `server/`. Deploy
   xong mà thấy chữ đỏ đó thì lỗi nằm ở tốc độ của Google với key này, không phải
   ở hàm.
2. **Render Free chạy đúng `server/gemini_proxy.py` — ĐÃ LÀM CODE, CÒN THIẾP BẠN BẤM
   (29-10-2026).** Đường này sinh ra vì một con số: **Netlify giới hạn rewrite dạng
   proxy ở 26 giây**, trong khi một câu trả lời của key này đo qua `handler` hôm
   29-10 là **176,9 giây**. Để Netlify chuyển tiếp hộ `/api/gemini → Render` là cắt
   đúng 26 giây, chết giữa chừng một cách đều đặn. Nên trình duyệt gọi **thẳng**
   máy chủ Python, còn `netlify.toml` + hàm Netlify vẫn nguyên đó cho ai để
   `MAI_CONG_KHAI` trống. **Zero file mới** (repo vẫn 52): `server/requirements.txt`
   đã có sẵn `google-genai` + `Flask`, và proxy đã tự đọc `PORT` mà Render cấp.

   | # | Việc | Nơi điền | Điều phải thấy |
   | --- | --- | --- | --- |
   | 1 | Tạo Web Service từ repo GitHub | Render → New → Web Service, Root directory `/` | Runtime tự nhận Python |
   | 2 | Build command | `pip install -r server/requirements.txt` | Mặc định của Render trỏ `requirements.txt` ở gốc repo — file này nằm trong `server/`, nên phải sửa một dòng |
   | 3 | Start command | `python server/gemini_proxy.py` | Không cần gunicorn: trần thời gian của Render đủ lớn cho một lời gọi dài, còn `app.run()` là cách chạy đã đo trên máy này. Gunicorn bản default có `--timeout 30` và sẽ **giết** một lượt 176 s. |
   | 4 | Environment variables | `GEMINI_API_KEY` (key MỚI, không phải key đã lộ), `GEMINI_PROXY_HOST=0.0.0.0`, `CYSIM_ORIGINS=https://<domain-của-trang>`; `CYSIM_RPM` tùy chọn (mặc định 20) | `PORT` **đừng đặt** — Render tự cấp và code đã đọc `PORT`. `GEMINI_PROXY_HOST` thì PHẢI đặt `0.0.0.0`, nếu không proxy nghe ở 127.0.0.1 và Render báo "app không phản hồi". |
   | 5 | Dán URL máy chủ vào app | `js/ai.js` — `const MAI_CONG_KHAI = "https://<tên>.onrender.com"` (không có `/api/gemini` phía sau, code tự ghép; không có `/` ở cuối, code tự cắt) | Commit + deploy lại Netlify. Đây là dòng **duy nhất** phải sửa, và URL máy chủ không phải bí mật — key thì có, và key nằm lại phía Render. |
   | 6 | Xác nhận | `curl https://<tên>.onrender.com/api/health` | `keyConfigured:true` + danh sách `depths`. Quên bước 5 thì app vẫn gõ cửa `/api/gemini` cùng nguồn và vẽ bệnh đúng như đường 1 mô tả. |

   Cái được so với đường 1: **giữ được chữ về dần** (tiến trình thật, không bị
   buffer, `text/event-stream` chạy nguyên như trên máy này) và **không có trần 60
   giây**. Cái mất, nói thẳng đủ để không ai bị bất ngờ: host miễn phí **ngủ sau
   ~15 phút không ai hỏi**, cú gọi đầu tiên mất khoảng một phút để đánh thức — vì
   vậy `js/ai.js` có trạng thái mới `external` ("Không gọi được máy chủ AI ở địa chỉ
   đã khai… bấm Thử lại và chờ một phút"), vẽ chấm hổ phách kèm đúng URL đã gọi và
   nút **Thử lại**, thay vì nói dối "bản web này không kèm máy chủ AI" về một máy
   chủ đang thức dậy. Trần nội dung (prompt 2 000 ký tự, lịch sử 9 000 ký tự, 4 ảnh
   × 2 MB) vẫn là thứ chặn hoá đơn, còn `CYSIM_ORIGINS` + `CYSIM_RPM` chỉ là đồ hãm:
   `Origin` curl giả được trong một dòng, nên ai cố tình đốt key vẫn POST được vào
   URL công khai — muốn khoá thật phải thêm token chung, và việc đó **chưa** làm.
   Và điều quan trọng nhất vẫn nguyên như đường 1: **với key hiện tại thì Render
   không làm câu trả lời nhanh lên**, nó chỉ không cắt nó ở 60 giây.

   Kiểm chứng bằng thật, không bằng tưởng (29-10-2026, giả đúng hình dáng Render:
   **hai origin khác nhau trên cùng máy**, page ở `http://192.168.1.4:8138`, proxy ở
   `:8123` với `GEMINI_PROXY_HOST=0.0.0.0` + `CYSIM_ORIGINS=http://192.168.1.4:8138`):
   - Origin đã khai → `GET /api/health` về 200 **kèm** `Access-Control-Allow-Origin:
     http://192.168.1.4:8138`; khung chat vẽ `data-state="ready"` + đúng tên model.
   - Origin lạ → `POST /api/gemini` trả **403 `{"code":"forbidden"}`**, và `GET
     /api/health` không gắn CORS → trình duyệt đọc không được, app báo `external`
     thay vì đổ lỗi bừa. Quên bước 4 (`CYSIM_ORIGINS`) là ra đúng bệnh này.
   - `data-state="external"` chấm `rgb(255,180,84)` (hổ phách, không phải đỏ), in
     đúng `http://cysim-demo.invalid/api/health`, có nút Thử lại; bản `fr` hiện câu
     dịch người viết đã duyệt — tức chuỗi mới đi hết đường `t()` → `js/lang`.
   - Một câu hỏi thật gửi qua origin khác **đi tới đích**: `.ai-time` in "chữ đầu
     **171,2 s** · hoàn tất 171,3 s · `gemini-flash-lite-latest`", bong bóng model
     hiện đủ chữ. Trong lúc chờ, dòng pending đổi thành "Vẫn chưa có chữ nào sau
     81s — key Gemini này đang bị Google xếp hàng…". Hai chuyện cùng được chứng
     minh ở đây: lời hứa "chữ về dần" sống nguyên qua hai origin, và **trần 26 s của
     rewrite Netlify sẽ cắt đúng câu này giữa chừng** — 171,2 s > 26 s, nên mới phải
     gọi thẳng.
   - **Chưa kiểm chứng:** một instance Render thật (cần tài khoản của bạn) và trần
     thời gian request của Render — con số ~100 phút lấy từ tài liệu của host, chưa
     đo ở đây. Mọi con số của riêng dự án này (26 s / 60 s / 176,9 s) là số đo thật.

Không chọn gì cũng không sao: AI là tính năng cần một máy chủ, còn 12 phòng lab,
kỳ thi tốt nghiệp, chứng chỉ, 5 thứ tiếng và chế độ ngoại tuyến (mục 5.3) vẫn chạy
nguyên trên Netlify vì chúng chỉ cần file tĩnh.

**Kiểm chứng (29-10-2026, tab tự động):**
- Loopback `http://127.0.0.1:8137` → `#aiStatus` `data-state="ready"` kèm đúng tên
  model `gemini-flash-lite-latest` (bản `fr`: "Connecté au serveur d'IA."), proxy vừa
  bật lại nên **key mới đã được nạp và `/api/health` báo `keyConfigured:true`**.
- Origin **không** loopback `http://192.168.1.4:8138` (`python -m http.server
  --bind 0.0.0.0`, không có AI — mô phỏng đúng Netlify): `data-state="remote"`, in
  kèm `http://192.168.1.4:8138/api/health`; gửi một câu → bong bóng `system` nói
  đúng câu "remote" chứ không phải "xem console (F12)". Sơn lại ở `ja` / `fr` /
  `es` / `zh`: cả bốn đều là bản dịch người viết, `js/lang/*.json` vẫn `máy 0 |
  thiếu 0`.
- Máy chủ JSON-not-SSE giả lập (scratch ngoài repo, đã xoá) → câu trả lời vào
  bong bóng, `.ai-time` = "hoàn tất 0,0s · `stub-serverless`".
- **Hàm serverless, không cần mạng và không cần key:** `python
  netlify/functions/gemini.py` → `TỰ KIỂM TRA: ĐẠT toàn bộ` (sáu khối), và một
  harness gọi `handler` bằng event giả lập của Netlify → `38/38 đạt | hỏi: không`
  (health, CORS, origin, giới hạn nội dung, mọi mã lỗi, ảnh, độ sâu). `--check`
  của proxy đối chiếu bản sao bằng `ast` → `18 mục khớp từng ký tự`.
- **Gọi Google thật qua đúng `handler`:** `HTTP 200 trong 170,5 s` với 650 ký tự
  tiếng Việt; đặt `GEMINI_FUNCTION_DEADLINE=6` thì cắt đúng **6,0 s** và trả
  `code:"overloaded"` (trước khi chuyển sang sợi chia, cùng request đó ngồi chờ
  tới 49,9 s rồi mới về — socket timeout không cắt, xem mục `netlify/`).
- **Chưa kiểm chứng:** `cysim.netlify.app` thật, kể cả một lần deploy của hàm mới.
  Code mới chỉ ở thư mục này; host vẫn đang chạy bản cũ cho tới khi **bạn deploy
  lại** (bảng ba bước ở trên). Service Worker không giữ bản cũ: `sw.js` đi
  network-first cho file của chính app, nên lần mở kế tiếp có mạng là lấy bản mới
  — và `/api/*` đã được loại khỏi cache, vì lưu `GET /api/health` offline là màn
  hình sẽ nói "sẵn sàng" về một máy chủ đã chết.

## 6. Thêm một phòng lab mới (6 bước, không thêm file nào khác)

1. Tạo `js/labs/<ten>.js`, mở đầu bằng khuôn chú thích `LÀ GÌ / CHẠY / CHẠM TỚI`,
   bọc trong IIFE, cuối file ghi `Labs.<ten> = { ... }` nếu cần dọn timer.
2. Mọi chữ hiển thị bọc `t("…")`; số đặt ngoài chuỗi (`t("...") + " 20s"`).
   Dòng chứa chữ Việt mà **không** lên màn hình thì thêm `// i18n-skip`.
   Chữ do JS ghi vào phần tử (`el.textContent = ...`) thì dùng `setText(el, "…")`
   thay cho `t()`: nó ghi bản dịch của ngôn ngữ đang hiển thị **và** nguồn tiếng
   Việt, nên không nhấp nháy chữ Việt và không bị dịch đè lên bản dịch.
3. Thêm `<section class="view" id="<ten>">` + một nút `data-view="<ten>"` +
   một chip `data-k="<key>"` vào `index.html`.
4. Thêm `<script src="js/labs/<ten>.js"></script>` **trước** `js/boot.js`.
5. Gọi `complete("<key>", "…")` khi người học đạt. Muốn lab tự dừng khi rời trang,
   nối vào `showView()` trong `app.js` theo quy ước `Labs.<ten>.stop?.()`.
6. `TOTAL_MISSIONS` trong `app.js` +1, rồi chạy hai lệnh ở mục 3.

## 7. Ràng buộc của dự án

- **Không quá 52 file** — hiện **52**, chạm trần: 51 file thật của dự án + `.env`
  (không theo dõi, machine-local). Trần trước là 50; ngày 29-10-2026 bạn Đức đồng ý
  nâng lên 52 để lấy máy chủ AI trên Netlify (`netlify.toml` +
  `netlify/functions/gemini.py`, hai file — không file thứ ba vì hàm chỉ dùng thư
  viện chuẩn, nên không có `requirements.txt`). Đã tính README, launcher
  `chay-ai.bat`, `server/gemini_proxy.py` + `server/requirements.txt`, `js/ai.js`,
  `js/labs/exam.js`, `.env.example` + `.gitignore`, `_legacy/auth.legacy.js`; chưa
  tính `__pycache__` và file tạm. **Vì đã chạm trần, thêm file mới thì phải gộp
  hoặc dời bớt — không mở tuỳ tiện.** Đếm lại trước khi nộp:
  `find . -type f -not -path "./.git/*" -not -path "*__pycache__*" | wc -l`
- **Không xoá code**, chỉ dời thứ không cần thiết. Code chết vào `_legacy/` kèm chú
  thích vì sao chết; chỉ xoá file tạm do chính tôi tạo (`tools/_add_headers.py` đã
  bị xoá sau khi dùng, `__pycache__` cũng vậy).
- **Không hardcode secret.** Key Gemini chỉ sống trong `.env` (đã `.gitignore`);
  `.env.example` là template nên `GEMINI_API_KEY=` luôn để trống — `.gitignore` có
  `!.env.example` nên dán key vào đó là commit luôn key. Một key đã từng bị dán
  vào khung chat hay paste lên nơi công khai coi như **đã rò rỉ**: thu hồi và đổi
  key trên Google AI Studio rồi cập nhật `.env`, không chỉ xoá khỏi file.
- **Cái gì giả phải được nói là giả.** `auth.js` và bảng xếp hạng là **demo chạy
  trong trình duyệt**: tài khoản, mã 6 số và điểm chỉ nằm trong `localStorage` của
  máy này, không có server nào nhận chúng. Vì vậy màn hình đăng nhập mang banner
  **CHẾ ĐỘ DEMO**, và bảng xếp hạng ghi rõ **chỉ dòng của bạn là tài khoản thật,
  các hạng còn lại là dữ liệu mẫu** (`RANKS` trong `app.js`). App không có đường
  nào "nâng cấp" lên auth thật — nên thà nói thẳng còn hơn để người học tưởng mình
  vừa đăng nhập bằng PBKDF2 150k vòng qua internet. Cùng nguyên tắc đó áp cho lượt
  **thi thử**: dù chấm bằng đúng máy chấm của đề thật, nó lúc nào cũng phải tự nói
  rõ mình là lượt thử — dòng `.exam-thu` ngay dưới tiêu đề cửa phòng, dòng "Kết quả
  thi thử" trên bảng điểm và một khoá `cysim-exam-thu:<id>` riêng, để không ai làm
  một lượt vô điểm mà tưởng mình vừa lấy bằng.
- **Không nhét dữ liệu cá nhân định sẵn vào luồng đi của mọi người dùng.** Trước
  đây `ai.js` gửi kèm một hồ sơ tự khai cứng (tên, năm sinh, trường, cân nặng) cho
  **mọi** tài khoản. Giờ hồ sơ là ô nhập `#aiProfileInput` mặc định rỗng, chỉ gửi
  khi người dùng tự gõ, lưu riêng theo tài khoản (`cysim-ai-profile:<email>`), và
  `#aiProfileState` nói cho người dùng biết lượt này có gửi kèm bao nhiêu ký tự.
- **Trung thực về số liệu**: tỉ lệ `%` trên lá cờ là `(chuỗi người duyệt + chuỗi code)/tổng`,
  dấu `~` nghĩa là còn chữ máy dịch. Không được khoe 100% khi chưa phải 100%.
- **Trung thực về kiểm thử**: `test/` phong toả máy chấm điểm và máy dịch; phần
  tương tác DOM của 15 lab vẫn chỉ được xác minh bằng tay trong trình duyệt, và
  điều đó ghi ngay trong mục `test/` chứ không ẩn đi.
