# CySim — bản đồ dự án

**LÀ GÌ** — Mô phỏng an ninh mạng chạy **hoàn toàn trong trình duyệt**: 12 phòng
lab (SQLi, XSS, CSRF, IDOR, phishing, DDoS, firewall, mật khẩu, định vị IP, diệt
mã độc, SIEM, tài khoản) cùng màn Chứng chỉ do kỳ thi cấp — tổng 13 nhiệm vụ,
**trang Lý thuyết** 12 chủ đề × 4 mục (mục
4.5), **kỳ thi tốt nghiệp** 20 điểm trắc nghiệm + 20 điểm tự luận với phòng thi
khoá điều hướng, trần 45 phút và một lượt **thi thử không tính điểm** từ 6 lab
(mục 4.1–4.4), XP + bảng xếp hạng, khung chat AI **nhận kèm ảnh**, phóng to được,
chọn được **độ sâu câu trả lời** và **in số giây đo thật** dưới từng câu (mục
5.1–5.2, 5.4), mở được cả khi **mất mạng** (mục 5.3), và 6 ngôn ngữ tự dịch.
Không build, không thư viện — 51 file, mở là chạy. Backend Python là tuỳ chọn,
chỉ để gọi Gemini: `server/` cho máy này và cho máy chủ công khai trên Render
(`netlify.toml` chỉ còn việc cấu hình host tĩnh — mục 5.5).

**PHẦN DÀNH CHO NGƯỜI MỚI** (mục 6) — vào là học được ngay: **chế độ khách** không
cần tài khoản, thẻ **"Bắt đầu ở đây — ba bước"** trên dashboard, trang **Cài đặt**
cho người dùng tự chỉnh nền tối / nền sáng, cỡ chữ, hiệu ứng, độ tương phản, ngôn
ngữ và **xuất / nạp / xoá** chính dữ liệu của mình, trang **Quản trị** (chỉ tài
khoản có role `admin`) để bật/tắt từng tính năng và đặt trần lượt hỏi AI cho cả
máy. Hai trang đó là một người lớn trông một lớp trên **chung một máy**, không
phải hệ thống phân quyền — cả hai đều nói thẳng điều đó trên màn hình.

**ĐỌC THẾ NÀO** — mục lục ngay dưới đây bấm được tới từng mục, và file này dài
~1.870 dòng (đo 31-10-2026) nên không viết ra để đọc tuyến tính: mục 1 để chạy thử, mục 2 để tìm code
nằm ở file nào, mục 3 để lấy lệnh, mục 8 để biết ràng buộc; các mục 4–6 giải thích
từng tính năng và chỉ cần đọc khi đụng tới tính năng đó. Mỗi file source mở đầu bằng
khối chú thích `LÀ GÌ / CHẠY / TOÀN CẦU` — đọc khối đó trước khi đọc code của file,
nó nói file này là cái gì, chạy lúc nào, và đụng vào global nào.

## Mục lục

- [1. Chạy thử](#1-chạy-thử)
- [2. Bản đồ file](#2-bản-đồ-file)
  - [Gốc dự án](#gốc-dự-án)
  - [`js/` — nhân của app (nạp theo đúng thứ tự)](#js--nhân-của-app-nạp-theo-đúng-thứ-tự)
  - [`js/labs/` — 15 file, mỗi file một màn hình](#jslabs--15-file-mỗi-file-một-màn-hình)
  - [`js/lang/` — dữ liệu **sinh ra**, không sửa tay](#jslang--dữ-liệu-sinh-ra-không-sửa-tay)
  - [`tools/` — Python dựng từ điển (chạy trên máy, không nạp vào app)](#tools--python-dựng-từ-điển-chạy-trên-máy-không-nạp-vào-app)
  - [`test/` — kiểm thử tự động (không cần trình duyệt, không cần cài gì thêm)](#test--kiểm-thử-tự-động-không-cần-trình-duyệt-không-cần-cài-gì-thêm)
  - [`server/` — tuỳ chọn: cầu nối Google Gemini (Python, không bắt buộc để chạy app)](#server--tuỳ-chọn-cầu-nối-google-gemini-python-không-bắt-buộc-để-chạy-app)
- [3. Lệnh hằng ngày](#3-lệnh-hằng-ngày)
- [4. Kỳ thi tốt nghiệp và dây chuyền cấp bằng (`js/labs/exam.js`)](#4-kỳ-thi-tốt-nghiệp-và-dây-chuyền-cấp-bằng-jslabsexamjs)
  - [4.1 Phòng thi: vào là ở lại, không đi đâu được nữa](#41-phòng-thi-vào-là-ở-lại-không-đi-đâu-được-nữa)
  - [4.2 Thoát toàn màn hình = mất bài (`huyLuot()`)](#42-thoát-toàn-màn-hình--mất-bài-huyluot)
  - [4.3 Hai lượt thi: thử (từ 6 lab) và thật (từ 12 lab)](#43-hai-lượt-thi-thử-từ-6-lab-và-thật-từ-12-lab)
  - [4.4 Đồng hồ 45 phút](#44-đồng-hồ-45-phút)
  - [4.5 Trang Lý thuyết (`#theory`)](#45-trang-lý-thuyết-theory)
  - [4.6 Ô tìm kiếm toàn văn (`js/search.js`, Ctrl+K)](#46-ô-tìm-kiếm-toàn-văn-jssearchjs-ctrlk)
  - [4.7 `tdem()` — vì sao `"1 entrées"` và `"2 suspicious file"` từng hiện trên màn hình](#47-tdem--vì-sao-1-entrées-và-2-suspicious-file-từng-hiện-trên-màn-hình)
  - [4.8 Nạp chậm: chữ lấy từ máy, script lấy theo trang, từ điển lấy theo ngôn ngữ](#48-nạp-chậm-chữ-lấy-từ-máy-script-lấy-theo-trang-từ-điển-lấy-theo-ngôn-ngữ)
  - [4.9 Màn hình nhỏ: bảng dữ liệu biến thành thẻ, log không đẩy trang ngang](#49-màn-hình-nhỏ-bảng-dữ-liệu-biến-thành-thẻ-log-không-đẩy-trang-ngang)
- [5. Khung chat AI: ảnh kèm, phóng to, độ sâu câu trả lời, chạy khi mất mạng và bản web công khai](#5-khung-chat-ai-ảnh-kèm-phóng-to-độ-sâu-câu-trả-lời-chạy-khi-mất-mạng-và-bản-web-công-khai)
  - [5.1 Ảnh kèm theo một lượt hỏi (`js/ai.js`)](#51-ảnh-kèm-theo-một-lượt-hỏi-jsaijs)
  - [5.2 Phóng to và kéo rộng khung chat](#52-phóng-to-và-kéo-rộng-khung-chat)
  - [5.3 Mở app khi mất mạng (`sw.js` + `js/app.js`)](#53-mở-app-khi-mất-mạng-swjs--jsappjs)
  - [5.4 Độ sâu câu trả lời và đồng hồ đo thật (`#aiDepth` + `.ai-time`)](#54-độ-sâu-câu-trả-lời-và-đồng-hồ-đo-thật-aidepth--ai-time)
  - [5.5 Mở app trên Netlify / host tĩnh: AI cần gì, và vì sao key KHÔNG thiếu](#55-mở-app-trên-netlify--host-tĩnh-ai-cần-gì-và-vì-sao-key-không-thiếu)
  - [5.6 Nhịp 30 giây và dấu vết khi proxy đổi model](#56-nhịp-30-giây-và-dấu-vết-khi-proxy-đổi-model)
  - [5.7 Hai lỗi người dùng bấm ra ngày 01-11-2026: mất nút ✕ và dòng "sẵn sàng" giả](#57-hai-lỗi-người-dùng-bấm-ra-ngày-01-11-2026-mất-nút--và-dòng-sẵn-sàng-giả)
- [6. Cài đặt · Quản trị · chế độ khách — phần dành cho người chưa biết gì](#6-cài-đặt--quản-trị--chế-độ-khách--phần-dành-cho-người-chưa-biết-gì)
  - [6.1 Đổi giao diện — `Settings` + khối `ĐỔI GIAO DIỆN` trong `style.css`](#61-đổi-giao-diện--settings--khối-đổi-giao-diện-trong-stylecss)
  - [6.2 Dữ liệu của người dùng — trang Cài đặt làm đăng nhập thành *có ích*](#62-dữ-liệu-của-người-dùng--trang-cài-đặt-làm-đăng-nhập-thành-có-ích)
  - [6.3 Trang Quản trị — công tắc thật, không phải nút biết sáng](#63-trang-quản-trị--công-tắc-thật-không-phải-nút-biết-sáng)
  - [6.4 Chế độ khách — `startGuest()` và `taiDuLieuKhach()`](#64-chế-độ-khách--startguest-và-taidulieukhach)
  - [6.5 Lời dẫn cho người mới — và hai quy tắc kỹ thuật mà nó buộc phải có](#65-lời-dẫn-cho-người-mới--và-hai-quy-tắc-kỹ-thuật-mà-nó-buộc-phải-có)
  - [6.6 Ba câu nói thẳng đặt **giữa** form, không phải trên banner](#66-ba-câu-nói-thẳng-đặt-giữa-form-không-phải-trên-banner)
- [7. Thêm một phòng lab mới (6 bước, không thêm file nào khác)](#7-thêm-một-phòng-lab-mới-6-bước-không-thêm-file-nào-khác)
- [8. Ràng buộc của dự án](#8-ràng-buộc-của-dự-án)
  - [8.1 Vì sao không tách `index.html` — kiểm kê thật và bốn đường không đi](#81-vì-sao-không-tách-indexhtml--kiểm-kê-thật-và-bốn-đường-không-đi)
  - [8.2 Năm đề nghị round 8 phải thêm file — đã đo, chưa tự ý lấy suất](#82-năm-đề-nghị-round-8-phải-thêm-file--đã-đo-chưa-tự-ý-lấy-suất)
  - [8.3 Bấm thử 15 phòng lab bằng trình duyệt điều khiển được — hai lỗi tìm ra và đã sửa](#83-bấm-thử-15-phòng-lab-bằng-trình-duyệt-điều-khiển-được--hai-lỗi-tìm-ra-và-đã-sửa)

## 1. Chạy thử

```bash
python -m http.server 8137 --bind 127.0.0.1    # rồi mở http://127.0.0.1:8137
```

Phải chạy qua `http://`, không mở bằng `file://` — Service Worker và `fetch()` từ
điển `js/lang/*.json` đều bị chặn trên giao thức file. Nếu dùng VS Code, Live Server
đã chốt cổng 5505 trong `.vscode/settings.json`.

**Lần mở đầu tiên của một người chưa biết gì**: màn hình khoá có nút
**"Khám phá không cần tài khoản"** (`startGuest()` trong `js/auth.js`) — bấm vào là
vào thẳng dashboard, mọi thứ ghi dưới hậu tố `:guest`, đóng tab là hết, và khi tạo
tài khoản thật sau đó thì `taiDuLieuKhach()` trong `js/app.js` **dời** nguyên khối
đó sang email mới (không bắt người ta học lại từ đầu chỉ vì ban đầu chưa muốn đăng
ký). Trên dashboard, thẻ **"Bắt đầu ở đây — ba bước"** là chỗ duy nhất giải thích
app này dùng để làm gì bằng chữ thường, và chữ thứ ba trỏ thẳng xuống khung chat
AI. Người dùng không nên phải đọc `README.md` để biết bắt đầu từ đâu.

Muốn tới thẳng một bài mà không nhớ nó nằm ở màn hình nào: **Ctrl+K** (`Cmd+K` trên
macOS, hoặc nút **Tìm kiếm** đầu sidebar) mở một ô tìm; gõ "lừa đảo", "phishing" hay
"xss" là danh sách hiện ra, Enter mở đúng trang — mục 4.6.

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
| `index.html` | 3200 | Toàn bộ markup SPA: 20 `<section class="view">` (hai màn mới nhất là `#settings` — trang **Cài đặt** và `#admin` — trang **Quản trị**, mục 6; trước đó là `#theory` — trang **Lý thuyết**, mục 4.5), màn hình đăng nhập `#authOverlay` (kèm ô **mã quản trị** ở cả hai form `#authLoginAdmin` / `#authRegAdmin`, nút **khám phá không cần tài khoản** `[data-auth-guest]`, và ba đoạn `.auth-note` nói thẳng giới hạn tài khoản nằm xen **giữa** các ô nhập — mục 6.6), khung chat AI `#aiPanel` (`role="dialog"`, bị nhốt Tab — xem dòng `ai.js`) + nút `#aiFab` + ô hồ sơ tự khai `#aiProfileInput` / dòng trạng thái hồ sơ `#aiProfileState` + dòng trạng thái máy chủ `#aiStatus` + nút **phóng to** `#aiExpand` + **khay ảnh** `#aiImageBtn` / `#aiImageInput` (file input ẩn, `accept` bốn định dạng) / `#aiImages` (hàng xem trước, `data-no-i18n`) / `#aiImageState` (`data-no-i18n`) + **ô độ sâu câu trả lời** `#aiDepth` (mục 5.4 — `data-no-i18n`, `<select>` rỗng trong HTML vì `OPTION` nằm trong `SKIP_TAGS` của `i18n.js`: viết chữ Việt sẵn vào `<option>` là kẹt tiếng Việt mãi, nên `js/ai.js` sơn cả nhãn lẫn `<option>` bằng `t()`), symbol `#i-image` và `#i-search` trong sprite, nút `#searchOpen` trên sidebar + palette `#searchPalette` (`role="dialog"`, `hidden`, khối kết quả mang `data-no-i18n` vì `js/search.js` sơn bằng `textContent` — mục 4.6), biển mất mạng `#netFlag` (`role="status"`, câu chữ tĩnh nên engine dịch được — `app.js` chỉ bật/tắt `[hidden]`), toast, khung đề thi `#examBody` + `#examResult` và khung báo khoá `#certLockMsg` / `#certLockText` / `#certProgress` (nằm trong màn hình Chứng chỉ; `#certLockMsg` mang `data-no-i18n` vì `certificate.js` vẽ lại theo từng trạng thái khoá). Trang Lý thuyết là **HTML tĩnh, không có file JS riêng**: 12 thẻ `.card`, mỗi thẻ 4 dòng `h4.theory-k` (Khái niệm / Cơ chế / Dấu hiệu / Phòng thủ) + 4 đoạn + một nút `data-goto="<lab>"` do `app.js` bắt. Hai màn hình mới cũng **HTML tĩnh + JS sơn lên** theo đúng khuôn đó: `#settings` = thẻ "Tài khoản của bạn" (`#setAccountInfo` `data-no-i18n`, `#setLogout`, `#setAdminLink` `hidden` với học viên) + hai hàng nút phân đôi `#setThemeRow` / `#setFsRow` (`data-choice` + `data-value`, `aria-pressed` do `paintSettings()` vẽ) + hai checkbox `#setMotion` / `#setContrast` + `#setLang` + khối dữ liệu `#setExport` / `#setImport` / `#setImportFile` (ẩn) / `#setWipe`; `#admin` = `#adminFlags` (danh sách công tắc do `TINH_NANG` sinh ra), `#adminAiLimit` + `#adminAiUsed`, bảng `#adminUsers`, `#adminNoAdmin` và ô `#adminCodeInput` + `#adminClaim`. Cả hai đoạn đều có **`.auth-notice demo` chữ TĨNH** nói thẳng đây là đồ quản lý một máy, không phải hàng rào bảo mật — viết bằng HTML chứ không bằng `t()` để câu không bị cắt mảnh khi đổi ngôn ngữ. Dashboard mở đầu bằng thẻ `.batdau` "Bắt đầu ở đây — ba bước" (ba `<li>` chữ thường, không icon; bước 3 **chỉ bằng chữ** kể tên khung Trợ lý AI vì khung đó luôn nằm ở góc màn hình, còn dòng cuối `.mute` mới là chỗ có nút: `button.linkbtn[data-goto=settings]` nằm CUỐI vế đầu câu để text node vẫn trọn câu). Cuối `<body>` là **8 thẻ `<script>` THEO THỨ TỰ BẮT BUỘC** (utils → i18n-curated → i18n → app → auth → labs/exam → search → boot); 15 file còn lại (14 phòng lab + `js/ai.js`) **không còn là thẻ ở đây** — `app.js` tạo `<script>` động đúng lúc trang đó được mở (mục 4.8). `exam.js` nằm trong 8 thẻ **nạp tĩnh** vì `showView()` đọc `Labs.exam.dangLam()` để khoá điều hướng khi đang làm bài: chốt đó phải chạy được trước khi bất kỳ phòng lab nào kịp nạp. Mọi chỗ đọc `Labs.<lab>` đều phải dùng `?.` vì lab đó có thể chưa tồn tại — kiểm tra lúc chạy, không lúc khai báo. id của section = tên trong `showView("...")`; đổi id ở đây mà không đổi trong JS là thành màn hình trắng. **Ngoài 8 thẻ cuối `<body>`, `<head>` có đúng MỘT thẻ `<script>` nội tuyến**: nó đọc `cysim-settings` và ghi `data-theme` / `data-fs` / `data-motion` / `data-contrast` lên `<html>` **trước lần vẽ đầu tiên**, nếu không thì người chọn nền sáng thấy nguyên một màn hình tối nhảy lên rồi mới đổi màu (flash không chỉ xấu mà còn làm người đoán app chưa lưu được lựa chọn của mình). Chỉ các giá trị có trong bảng cho phép cứng mới được ghi — không có đường nào để chữ trong localStorage biến thành thuộc tính DOM tuỳ ý; `try/catch` che phần tử bị hỏng để một key rác không làm trắng cả trang. |
| `style.css` | 1106 | Giao diện: **toàn bộ mã màu nằm trong `:root`** (72 màu hardcode đã bị đổi thành biến ngày 30-10-2026 — một "theme sáng" mà còn 72 màu tối viết tay thì chỉ là một màn hình tối vá lỗ chỗ), layout sidebar + lưới card, style riêng từng lab. Khối **`ĐỔI GIAO DIỆN`** (mục 6) đọc đúng bốn thuộc tính do `Settings.apply()` ghi lên `<html>`: `data-theme="dem\|sang"`, `data-fs="vua\|lon\|rong"`, `data-contrast="thuong\|cao"`, `data-motion="bat\|tat"` — `tat` chặn mọi `animation`/`transition` bằng một quy tắc `*` (chữ chạy làm một số người chóng mặt, đây là lý do nó là lựa chọn chứ không phải mặc định định sẵn). **Chỉ đặt `transition-duration:.001s` là KHÔNG đủ** — quy tắc đó để yên `transition-property: all`, nên một thẻ bị ẩn hoặc bị hoãn (tab chạy nền, `visibilityState=hidden`) không bao giờ kết thúc transition và người dùng quay lại sẽ thấy **màu của theme CŨ** nằm chết trên màn hình; khối `tat` vì vậy ghi thêm `transition-property:none!important` (đo được ngày 30-10-2026: `--bg` đã là `#eef2f8` mà `body` vẫn `rgb(7,11,20)` cho tới khi tắt transition). Nền sáng đảo màu qua **ba biến bộ ba RGB** `--panelTone` / `--sunkTone` / `--fillTone` dùng trong `rgba(var(--x),.9)`: các bề mặt trong mờ (khung chat, biển mất mạng, toast) phải đảo theo theme, và chỉ có cách đó mới không phải viết lại từng khối. `html[data-contrast="cao"]` đổi `--mute`/`--text2`/`--line` và nâng viền lên 2px. Các class mới của phần thân thiện: `.batdau` (thẻ "Bắt đầu ở đây" — số bước font mono cyan, chữ dài, không icon), `.check` (danh sách dấu tích trang Cài đặt, `.pass` xanh), `.auth-why` (đoạn "tài khoản để làm gì" in nhỏ trong form đăng ký/đăng nhập), `.auth-note` (viền hổ phách trái, xen giữa ô mật khẩu / checkbox "Ghi nhớ" / ô nhập lại mật khẩu — mục 6.6), `.linkbtn` (nút trông như liên kết, `font:inherit` + màu cyan — ba chỗ dùng: một `data-goto="settings"` trong thẻ `.batdau` và hai nút `data-auth-go` "đăng ký / đăng nhập" trên màn khoá, tất cả đều nằm CUỐI vế câu), `.seg` + `.opt` (hàng nút phân đôi + checkbox trang Cài đặt, `aria-pressed` do JS vẽ), `.table-scroll` (`overflow-x:auto` cho bảng Quản trị trên màn hẹp), `.auth-more` (khối gấp "Tôi là quản trị" ở màn khoá), `.opt`/`.seg` cũng là chỗ `data-theme` hiển thị khác nhau. Giao diện: biến màu trong `:root`, layout sidebar + lưới card, style riêng từng lab, khung chat AI nổi góc trái dưới (`.ai-retry` = nút "Thử lại" nhỏ nằm cuối dòng trạng thái máy chủ, `margin-left:auto` để dồn sang phải; `data-state="no_net"`, `data-state="external"` và `data-state="bad_key"` màu **hổ phách** để phân biệt với `offline` **đỏ** — hai bệnh khác nhau, cách sửa khác nhau; `external` hổ phách chứ không đỏ vì host miễn phí đang thức dậy, không phải đã chết; `.ai-status` là `flex-wrap:wrap` và `.ai-status code{flex:none;max-width:100%}` — hàng flex không tự xuống dòng thì một chip dài bị ép còn đúng bề rộng một ký tự, đo được 20×56 px ở panel 300 px trong ảnh người dùng 01-11), khay ảnh (`#aiImages` qua `.ai-images`, mỗi tấm `.ai-img` + nút `.ai-img-bo`, dòng `.ai-image-state`), ảnh trong bong bóng (`.ai-thumbs` / `.ai-thumb`) và dòng ghi chú cho lượt cũ (`.ai-img-note`), **ô độ sâu + dòng đo thời gian** (mục 5.4): `.ai-depth-row` = hàng label + `<select>` nằm ngay trên nút Gửi, phần `select` chỉ override `padding` / `font-size` / `background-position` — ghi đè `background` là xoá luôn mũi tên SVG mà `select{}` toàn cục đã nhét vào; `.ai-time` = dòng chữ nghiêng 11px dưới bong bóng trả lời, **không có dòng này là không có bằng chứng tốc độ**, nên nó là một phần của tính năng chứ không phải trang trí), `.ai-panel.ai-drop` = viền nét đứt khi kéo ảnh vào, **phóng to**: `.ai-panel{resize:both;overflow:hidden}` (kéo góc dưới-phải, không nhớ) + `.ai-panel.ai-wide` (to mặc định, nhớ trong `cysim-ai-rong`) và `resize:none` dưới 860px vì điện thoại không có chuột để kéo, biển `.net-flag` cố định giữa đỉnh màn hình, khối `.exam-*` cho đề thi (câu hỏi, phương án, ô tự luận, gạch đầu dòng đạt/thiếu, bảng kết quả đỏ-xanh, `.exam-lock` = dòng dashed hổ phách khi kỳ thi còn khoá, `.exam-bar` = thanh amber chứa nhãn "phòng thi đang khoá" + đồng hồ `#examHom` + nút toàn màn hình + nút rời phòng, `.exam-hg` = chữ đồng hồ mono, `.exam-hg-cap` = đồng hồ chuyển đỏ + đậm khi còn dưới 5 phút, `.exam-huy` = dòng đỏ báo lượt trước đã bị huỷ vì thoát phòng / thoát toàn màn hình / hết giờ, `.exam-che` = hai nút chọn lượt thi thật/thử với bản đang chọn viền cyan, `.exam-thu` = dòng có vạch dọc màu cyan bên trái, nói thẳng đây là lượt thi thử không tính điểm), `.theory-k` = nhãn nhỏ viết hoa in đè trên từng đoạn lý thuyết. Breakpoint 860px khớp điều kiện `window.innerWidth <= 860` trong `app.js`. |
| `sw.js` | 211 | Service Worker PWA. **`CORE` liệt kê đủ 35 file runtime** — khung, style, manifest, icon, **cả 15 file `js/labs/*.js`** và **cả 7 file `js/lang/*.json`** — vì app không có bước build nên cách chắc nhất để "mất mạng vẫn mở được" là nhớ hết: bản cũ chỉ liệt kê khung + `index.json`, kết quả là phòng lab nào chưa từng được mở khi còn mạng thì mất mạng là bật ra màn hình trắng. `install` ghi từng file bằng `Promise.allSettled` chứ **không** dùng `addAll` (một file sai tên là `addAll` bỏ trắng cả bundle, và trên màn hình không có dấu hiệu nào); file hỏng chỉ bị `console.warn` nêu tên. **Tên cache `cysim-<hash>` tự sinh từ danh sách `CORE`** (hash djb2 32-bit, cơ số 36): thêm/bớt một file là tên cache đổi và `activate` tự xoá bản cũ — không còn bước "nhớ đổi `cysim-v14` → v15", kiểu đó tồn tại để con người quên. Chiến lược: file của app là **network-first với `cache: "reload"`** — sửa code xong F5 thấy ngay. `reload` là bắt buộc: network-first mà để nguyên request thì lượt fetch vẫn ăn BỘ NHỚ ĐỆM HTTP, và `python -m http.server` (cùng mọi host không gửi `Cache-Control`) chỉ trả `Last-Modified`, nên Chrome tự tính tuổi = 10% thời gian từ lần sửa file; một file sửa hôm trước có thể bị coi là còn tươi hàng giờ, và người dùng thấy app cũ dù code đã đổi (chính cái bẫy này làm người dùng báo "đã sửa mà không ăn" hai lần ngày 30-10-2026). Font Google là cache-first + làm tươi ngầm (`MAY_CACHE` liệt kê tường minh `fonts.googleapis.com` / `fonts.gstatic.com`; response `opaque` vẫn cất được) — **nay không còn request nào khớp vì app dùng chữ hệ thống**, nên hàng rào đó chỉ còn tác dụng nếu tự host font sau này; còn **mọi request khác origin bị bỏ qua tuyệt đối** — EmailJS, API dịch, tra cứu IP, proxy AI cổng 8000 và cả máy chủ AI ở host công khai (Render/Railway, đường 2 mục 5.5) không bao giờ nằm lại trong cache, vì đó là chữ của người dùng. **Cùng quy tắc đó nay áp cho `/api/*` cùng origin** (sửa 29-10-2026, xem mục 5.5): khi AI chạy trên Netlify thì máy chủ AI nằm ngay trên domain của app, nên `GET /api/health` đi qua luồng network-first và bị ghi vào cache — lần mất mạng sau đọc lại bản cũ, màn hình báo "sẵn sàng" trong khi máy chủ AI đã chết; trạng thái của một máy chủ không phải tài nguyên tĩnh. Điều hướng lỗi mạng thì trả `index.html` đã cache. Kiểm chứng: F12 → Application → Service Workers → bật Offline rồi tải lại. |
| `manifest.json` | 21 | Manifest PWA (tên, màu, `start_url`, icon). **JSON không có chú thích được** → file này được mô tả ở dòng này, không có block header. |
| `icons/icon.svg` | 14 | Khiên + dấu tích, SVG thuần. `manifest.json` trỏ tới, `sw.js` cache. |
| `.vscode/settings.json` | 9 | Một thiết lập: cổng 5505 cho Live Server. App không đọc file này. |
| `chay-ai.bat` | 131 | Bật cầu nối Gemini **bằng một cú nháy đúp** (Windows): `cd /d "%~dp0"` → **ba lần kiểm tra trước khi chạy** (Python có trong `PATH` không → `python -c "import google.genai"` có import được không → `.env` có tồn tại không) → `python server\gemini_proxy.py` → giữ cửa sổ, và **vòng `:loop` tự bật lại sau 5 giây** nếu proxy chết bất thường (mọi mã thoát, trừ `0` và `3221225786` = người dùng bấm Ctrl+C / tắt cửa sổ). Lần kiểm tra thứ hai sinh ra vì "Python đã cài" ≠ "SDK đã cài": thiếu `google-genai` thì python chết ở `ImportError` trong vòng lặp, cửa sổ flash rồi tắt, và khung chat chỉ báo "máy chủ offline" — đúng cái triệu chứng mà file này tồn tại để chữa. In ra lệnh sửa (`python -m pip install -r server\requirements.txt`) rồi `pause` để người dùng kịp đọc. Từ 01-11-2026 cửa sổ còn in **ba dòng về cái key** ngay lúc bật (hình dạng `AIza…`/`AQ.…`, kết luận Google nhận hay đuổi, chi tiết Google trả về) vì không có redirect nào che stdout — xem mục 5.7. Không chứa key (proxy tự đọc `.env`). Viết tiếng Anh không dấu vì `cmd.exe` ở codepage 8-bit sẽ hỏi hoá mọi ký tự Unicode. Đây là file duy nhất không phải code app. |
| `netlify.toml` | 58 | Cấu hình host tĩnh cho Netlify — **xem mục 5.5**. Hai việc: `publish = "."` (app không có bước build nên thư mục gốc chính là thư mục web) và ba khối `force` chặn `/.env`, `/server/*`, `/tools/*` bằng 404. `force` là bắt buộc: Netlify ưu tiên file có thật nếu không ép, còn 404 (chứ không 200) để kẻ dò không phân biệt được "file có mà bị chặn" với "không có file". **Không còn khối `[functions]` lẫn hai rewrite `/api/gemini` + `/api/health`** — chúng trỏ vào `netlify/functions/gemini.py`, và file đó đã bị xoá ngày 30-10-2026 vì Netlify không chạy hàm Python (tài liệu 2026 chỉ nhận TypeScript / JavaScript / Go, nhân viên host cũng trả lời đúng như vậy trên diễn đàn của Netlify): rewrite trỏ hàm không tồn tại thì chỉ tổ 404, còn bản web thật gọi thẳng máy chủ Render theo `MAI_CONG_KHAI` (mục 5.5, đường 2). **Không chứa key** — file này ai mở repo cũng đọc được, nên nó chỉ chứa đường dẫn. Bẫy ghi ngay trong header: kéo-thả cả thư mục lên Netlify Drop là upload luôn `.env` của máy bạn; deploy từ Git thì chỉ file đã commit mới đi theo, nhưng **đừng ảo `.gitignore` là tường** — `.env` của dự án này từng bị commit thật (`7ca1e6e`) dù đã nằm trong `.gitignore`, vì `git add -f` thắng `.gitignore`; khối chặn `/.env` dưới đây chỉ là lớp CUỐI, nó chặn người ngoài tải về chứ không xoá key khỏi lịch sử repo. |
| `README.md` | — | File bạn đang đọc: bản đồ toàn dự án. |

### `js/` — nhân của app (nạp theo đúng thứ tự)

| File | Dòng | Vai trò |
| --- | --- | --- |
| `utils.js` | 177 | Nạp **đầu tiên**. Định nghĩa `$()`, `tr()`, `CyUtil` (escape HTML, hex, SHA-256/PBKDF2 qua Web Crypto, đọc-ghi JSON, `humanizeSeconds`, `sleep`, `logLine`, **`trapFocus`**). `trapFocus(vùng, biến kiện)` giữ vòng Tab/Mũi-Tên-Tab **trong** một vùng: lọc `button, input, select, textarea, a[href], [tabindex]`, bỏ `disabled` / `[hidden]` / thứ không có `getClientRects()`, rồi chặn đúng hai đầu — phần tử cuối + Tab và phần tử đầu + Shift+Tab. nằm đây chứ không nằm trong từng file là vì `auth.js` và `ai.js` phải dùng **cùng một** luật: hai bản sao của một quy tắc thể nào cũng lệch nhau về sau. Chỉ định nghĩa, không tự chạy. |
| `i18n-curated.js` | 438 | Nạp trước `i18n.js`. `EN_DICT_CURATED`: ~380 mục "tiếng Việt → tiếng Anh" người thật đã kiểm chứng (tầng 1). |
| `i18n.js` | 1176 | Máy dịch + máy áp dụng. 5 tầng: OVERRIDE → REVIEWED → BUNDLED → CACHE → MACHINE. Định nghĩa `t()`, `tr()`, `tdem()` + bảng `DANG_DEM` (dạng số ít/số nhiều mà từ điển thiếu — mục 4.7), `setText()`, `currentLang`, `I18nAdmin`; `SKIP_TAGS` có cả `KBD` vì nhãn phím ("Enter", "Ctrl") không phải văn bản để dịch; phát sự kiện `cysim:language` **cả khi đổi ngôn ngữ lẫn khi từ điển về lúc khởi động** — thiếu lần thứ hai là mọi vùng `data-no-i18n` vẽ bằng `t()` kẹt ở bản dịch máy cũ. |
| `app.js` | 1187 | Nhân giao diện: `showView`, `complete()`, `renderProgress()`, toast, `API` (lưu tiến độ theo từng tài khoản, `_key(k) = k + ":" + Auth.id()`), `RANKS`/`RANK_MAP`/`TOTAL_MISSIONS`, **`completedMissions`** (Set nhiệm vụ đã hoàn thành — tên đầy đủ, không phải `done` cụt), **`TOTAL_LABS`/`labsDone()`** (bộ đếm 12 nhiệm vụ lab, loại trừ `"cert"` để khỏi deadlock), bảng xếp hạng (dòng của người dùng thật + các hạng mẫu, kèm một dòng nói thẳng "chỉ dòng của bạn là tài khoản thật, phần còn lại là dữ liệu mẫu"), monitor giả lập, `Labs{}`. **Bốn khối nền của mục 6**: `Settings` (`cysim-settings`, `read/save/apply` — `apply()` ghi bốn `data-*` lên `<html>` và đổi cả `meta[name=theme-color]`, `Settings.apply()` chạy ngay lúc nạp vì đây là thứ của **máy**, không của tài khoản: app.js nạp TRƯỚC auth.js nên `Auth.id()` chưa tồn tại ở dòng đó, đọc theo tài khoản thì hoặc nháy tối→sáng hoặc phải đổi thứ tự file), `TINH_NANG` + `VIEW_FLAG` + `Flags` (`cysim-flags`, `read()` coi thiếu = bật, `paint()` ẩn nút sidebar + `#aiFab` và phát `cysim:flags` — `settings`/`account` cố ý KHÔNG nằm dưới công tắc nào, tắt cả hai thì không còn đường nào bật lại), `AiBudget` (trần theo **máy** `cysim-ai-limit`, đã dùng theo **tài khoản** `cysim-ai-use:<id>`, `homNay()` đập ngày theo đồng hồ máy chứ KHÔNG `toISOString()` — UTC cắt một buổi học ở Việt Nam thành hai "ngày" và đếm thiếu một nửa; mặc định 0 = không giới hạn vì app học mà âm thầm chặn câu thứ 21 thì người dùng tưởng app hỏng), và `paintSettings()` / `paintAdminPage()` + `xuatDuLieu()` / `napDuLieu()` / `xoaDuLieu()` / `taiDuLieuKhach()`. **Xuất/nhập dữ liệu chỉ nhận khoá `cysim-*` kết thúc bằng `:` + email đang đăng nhập**, nên một file của người khác (hoặc file cũ) không có đường nào ghi đè `cysim-users` / `cysim-session`; xoá phải bấm **hai lần** (label đổi thành "Bấm lần nữa để xác nhận xoá") vì `confirm()` bị tiện ích chặn và người ta bấm Enter theo phản xạ. `on(id, ev, fn)` bọc `$()` để một id không tồn tại chỉ bị bỏ qua chứ không làm chết mọi `<script>` nạp sau nó. `paintFlagsList()` và `paintAdminUsers()` dựng lại danh sách bằng `replaceChildren()` sau MỖI lần bấm — vì thế cả hai phải nhớ chỉ mục hàng đang được focus và focus lại ô vừa tạo: không có bốn dòng đó thì người dùng bàn phím bật/tắt một công tắc xong bị đá về `<body>` và phải Tab lại từ đầu qua cả trang (lỗi này do bấm chuột thật trong trình duyệt phát hiện ra, không phải do đọc code). `showView()` là **cổng điều hướng duy nhất** và cũng là chỗ khoá phòng thi: nếu `Labs.exam.dangLam()` mà id không phải `certificate` thì chỉ hiện toast rồi trả về — sidebar, nút `data-goto` trong trang Lý thuyết hay lệnh chuyển màn hình nào khác đều đi qua cổng này nên không có đường vòng. Cùng một cổng đó chặn theo **công tắc quản trị**: `VIEW_FLAG[id]` đang tắt, hoặc `id === "admin"` mà tài khoản đang đăng nhập không có role `admin`, thì chỉ hiện toast rồi về — chặn ở điểm vào duy nhất chứ không phải chỉ ẩn nút, vì F5 đúng view hay một nút `[data-goto]` cũng đi qua đây. `showView("certificate")` gọi cả `Labs.certificate.render()` lẫn `Labs.exam.render()`; sự kiện `cysim:language` cũng vẽ lại bài thi. `showView()` còn dừng lab khi rời trang của nó — `Labs.ddos.stop()`, `account.cancel()`, `firewall.cancelScan()`, `antivirus.stop()`, `realip.stop()` — theo quy ước *lab khai báo hàm dừng, `app.js` gọi*, không để mỗi lab tự nghe sự kiện (quy ước này ghi lại ở mục 7 bước 5). Danh sách vẽ lại khi đổi ngôn ngữ kết thúc bằng `Labs.ai?.render()`: thêm một vùng `data-no-i18n` mới mà quên nối vào đây thì vùng đó kẹt chữ Việt trên giao diện tiếng Pháp. Cuối file là `paintNetFlag()` — bật/tắt `#netFlag` theo `navigator.onLine` và hai sự kiện `online`/`offline` — cạnh khối đăng ký Service Worker, vì "mất mạng" là thông tin về **app**, không riêng gì khung chat: câu chữ nằm tĩnh trong HTML để engine dịch, JS chỉ đổi `[hidden]`. `navigator.onLine` chỉ là lời khai của trình duyệt (mạng LAN không ra internet vẫn báo `true`), nên biển này là cảnh báo THÊM, không phải hàng rào: chức năng nào cần mạng thật vẫn tự báo lỗi đúng bệnh của nó. |
| `auth.js` | 783 | Màn hình khoá: đăng ký/đăng nhập, mã 6 số (EmailJS thật hoặc chế độ demo), "Ghi nhớ đăng nhập", dock tài khoản góc phải. Cửa duy nhất: `Auth.gate(callback)`. Phát `cysim:session` mỗi lần phiên đổi — **kể cả khi vào bằng chế độ khách**, vì `boot.js`/`app.js` nối `taiDuLieuKhach()` + `Flags.paint()` + `paintAdminNav()` vào đúng sự kiện đó. Overlay mang banner **CHẾ ĐỘ DEMO** nói thẳng tài khoản chỉ nằm trong `localStorage` của máy này, chưa có đường nào ra internet — không được phép để người đọc tưởng đây là hệ thống đăng nhập thật. `Tab`/`Shift+Tab` bị nhốt trong `#authOverlay` bằng `CyUtil.trapFocus` (một dòng listener, không còn hai chục dòng lọc phần tử chép tay), nên bàn phím không lọt được ra màn hình đứng sau khung khoá — bảng khoá là **màn hình có thật và có mục đích bị modal**, khác khung chat AI bên dưới. **Bản này trả lời câu "đăng nhập để làm gì" bằng ba thứ người dùng chạm được, không bằng một dòng khẩu hiệu**: (1) `.auth-why` in ngay dưới form nói đúng dữ liệu nào gắn theo tên đăng nhập (tiến độ, điểm thi, lịch sử chat, tên trên chứng chỉ); (2) `#authSaved` liệt kê tài khoản đã có trên máy này để bấm một lần là điền xong (kèm `maskEmail()` che chữ cái đầu của email); (3) **[data-auth-guest]** vào học không cần tài khoản — toàn bộ ghi dưới `:guest`, và `taiDuLieuKhach()` dời sang email khi người đó đăng ký thật, nên lần mở đầu không bị chặn bởi một hàng đợi đăng ký. **Khách lưu `name: ""` chứ không lưu chữ đã dịch**: phiên khách được ghi đúng một lần lúc bấm nút, nên nhét `tr("Khách")` vào đó là đóng băng ngôn ngữ của riêng khoảnh khắc đó — đo được ngày 30-10-2026: vào khách bằng tiếng Pháp rồi đổi sang tiếng Việt thì dock và bảng xếp hạng vẫn in "Invité" chết giữa màn hình. `displayName()` vì thế sinh chữ ngay tại chỗ hiển thị, còn `paintUserBox()` được nối vào sự kiện `cysim:language` để dock đổi theo mà không phải tải lại. **Vai trò**: mỗi user mang `role` `learner`/`admin`; phiên đọc `role` nên `Auth.isAdmin()` / `Auth.isGuest()` chỉ một lần đọc `sessionStorage`, không dò `users[]` mỗi lần `showView()`. `claimAdmin(code)` / `adminCodePass()` dùng mã quản trị **tự đặt của máy này**: `cysim-admin-code` chỉ chứa `{salt, iterations, hash}` (PBKDF2-SHA256 150 000 vòng, so sánh bằng `CyUtil.constantEqual`) và **lần khai đầu tiên đặt luôn mã đó** — trong source không có mã chuẩn nào, nên không có mật khẩu mặc định để dò. `setRole()` trả về `reason` cho từng ca bị từ chối: `nous` (email không có trên máy này), `self` (không tự hạ chính mình) và `last-admin` (không hạ admin cuối cùng) — hai ca sau là vì mất cả hai đường đó là mất luôn trang duy nhất còn ô nhập mã. `last-admin` chỉ xét khi người bị hạ **đang là** admin (`u.role === "admin" && moi !== "admin"`); viết thiếu vế đầu thì một học viên được đặt lại đúng vai trò học viên cũng ăn luôn lời báo lỗi "không thể hạ admin cuối cùng", trong khi chẳng có ai bị hạ cả. `allUsers()` **cố ý cắt `salt`/`hash`/`iterations`** khỏi kết quả: trả object gốc là đưa cả kho bản băm vào một hàm public, và một dòng `console.log(Auth.allUsers())` ở đâu đó sẽ lộ hết. Mật khẩu lưu dạng `pbkdf2Hex` theo khuôn đó — kể cả email **không tồn tại** vẫn đi qua đúng một lần băm + một lần so sánh nhờ `DUMMY_SALT` = 16 byte và `DUMMY_HASH` = **32 byte hex, đúng 64 ký tự** như bản thật; DUMMY ngắn hơn thì `constantEqual` chết ở dòng so độ dài trước khi kịp so nội dung và thời gian trả lời sẽ tố "email này chưa đăng ký" (đây chính là điểm reviewer nghi là oracle; số đo thực tế đã kiểm và độ dài đã khớp). Sai 5 lần khoá 30 giây. |
| `ai.js` | 1358 | Khung chat AI: nút `#aiFab` mở `#aiPanel`, hỏi `/api/health` để vẽ `#aiStatus` — bảng phân loại đọc **cả** `keyConfigured` (có chuỗi) lẫn `keyValid` (Google có nhận chuỗi đó không), nên `keyConfigured:true` + `keyValid:false` hiện thành `bad_key` chứ không còn là dòng "Đã nối được máy chủ AI" giả (mục 5.7) — `bad_key` còn in **bằng chứng** cạnh câu lỗi: `<code>.env: AQ.A…(53)</code>` lấy từ `keyShape` của `/api/health` (lưu trong `serverKeyShape`, chỉ hiện khi có, không bao giờ in cả chuỗi), và ba chỗ focus ô hỏi đi qua `vaoO()` = `focus({preventScroll:true})` để cắt tận gốc cái cơ chế cuộn panel làm mất nút ✕ — nơi gọi AI mặc định **đổi theo nơi mở trang** (mục 5.5: máy này → cổng 8000, domain công khai → **thẳng máy chủ ở host khác** vì `MAI_CONG_KHAI` đang trỏ `https://cysim-backend.onrender.com` (đường Render, giữ được SSE và không có trần 60 s); để trống `MAI_CONG_KHAI` thì mới rơi về `/api/gemini` cùng nguồn, và `noiGoi()` phân xử đường dẫn tương đối theo `location.origin`, chỉ `file://` là phải mượn `MAI_CONG_KHAI` vì không có origin nào để mà cùng nguồn), và ở sáu trạng thái `offline`, `no_key`, `bad_key`, `no_net`, `remote`, `external`, chính dòng đó vẽ thêm nút **Thử lại** (`.ai-retry`) gọi `checkServer(true)` (buộc proxy hỏi lại Google thay vì ăn kết quả cache 5 phút) ngay tại chỗ, để bật `chay-ai.bat` (hoặc cắm lại mạng, hoặc dán key mới vào `.env`) xong bấm một cái là biết máy chủ đã sống, không phải đóng/mở panel hay gửi nhầm một câu; ở trạng thái `file` thì KHÔNG vẽ nút vì thử lại vô nghĩa. Hai listener `online`/`offline` ở cuối `bind()` cũng gọi lại `checkServer()` để dòng "mất internet" tự biến mất khi mạng về. Gửi `{prompt, lang, history, stream:true, profile, depth}` tới proxy (kèm `lang` để server ép câu trả lời đúng thứ tiếng, kèm `profile` là **hồ sơ tự khai do chính người dùng gõ** vào ô `#aiProfileInput` trong panel — mặc định **rỗng**, chỉ gửi khi ô có chữ, lưu theo tài khoản ở `cysim-ai-profile:<email>`, và dòng `#aiProfileState` nói thẳng lượt này có gửi kèm bao nhiêu ký tự hay không; không còn chuyện một hồ sơ cá nhân định sẵn bị gửi đi cho mọi tài khoản), **đọc từng mảnh chữ qua SSE và tô dần lên màn hình** — chữ đầu tới máy chủ là tới màn hình, không chờ cả câu. Khi đang chờ, nút `#aiSend` đổi thành **Dừng** (cùng một chỗ, không thêm nút mới) và bấm vào là `AbortController` cắt request; dòng "đang soạn" chuyển sang đếm giây thật (`Máy chủ AI đang chậm… đã chờ 23s`) sau 8 giây để phân biệt "Google đang nghĩ" với "app bị treo", và tới 60 giây thì đổi thành câu chỉ thẳng nguyên nhân (key bị Google xếp hàng) kèm cách sửa. `render()` luôn giữ bong bóng chờ khi vẽ lại (đổi ngôn ngữ giữa lượt cũng không làm nó biến mất — từng có bug này). Chữ đã về trước khi dừng vẫn được giữ, chỉ lượt bị cắt mới bị đánh dấu `transient`. Mở trang bằng `file://` thì báo đúng bệnh "trình duyệt chặn request" kèm lệnh `python -m http.server`, không đổ tại máy chủ chưa chạy; máy chủ không trả lời thì câu báo lỗi hướng dẫn nháy đúp `chay-ai.bat`. Mỗi tài khoản một lịch sử (`cysim-ai:<email>`), nút xoá lịch sử, câu hỏi danh tính vẫn trả lời được khi proxy chết. Lỗi là dòng `system`: không nhãn, không lưu, không gửi lại cho Gemini. Hồ sơ nằm trong `<textarea>`, mà `TEXTAREA` thuộc `SKIP_TAGS` của `i18n.js` (engine cố tình không đụng chữ người dùng gõ) — hệ luỵ là `placeholder` và `aria-label` của ô cũng không bao giờ được dịch, nên `paintProfileState()` tự vẽ lại hai thuộc tính đó bằng `t()` mỗi lần đổi ngôn ngữ. Panel mang `role="dialog"` và bị **nhốt focus** bằng `CyUtil.trapFocus` (Tab ở nút cuối quay về nút đầu, Shift+Tab ở nút đầu ra nút cuối) — nhưng khác bảng khoá, đây là dialog **không modal** nên nó có đường thoát rõ ràng: `Esc` đóng, nút ✕ mang `title="Đóng (Esc)"`, và khi đóng focus **quay về `#aiFab`** thay vì rơi xuống `<body>` (WCAG 2.1.2: vòng lặp bàn phím luôn phải có lối ra, nhốt người dùng trong một khung chat không cho họ đi đâu là lỗi truy cập, không phải tính năng). **ẢNH** (mục 5.1): ba đường vào một khay — nút `#aiImageBtn` mở `#aiImageInput`, kéo-thả vào panel (`.ai-drop`), `Ctrl+V` trong ô gõ — tất cả đi qua `themAnh()` → `thuNhoAnh()` (canvas, cạnh dài tối đa 1568 px, JPEG 0,85, nền trắng vì JPEG không có kênh alpha; GIF và ảnh dưới 300 KB gửi nguyên bản để khỏi mất animation/nét), rồi vào mảng `anh` **chỉ trong RAM**. Trần máy cliente đặt **nghiêm ngặt hơn** máy chủ (3 tấm × 1,5 MB, server cho 4 × 2 MB / tổng 6 MB) để không thao tác nào trên màn hình chạm tới lỗi 413 khô khan. `send()` gỡ khay trước khi hỏi, ảnh gắn vào đúng một lượt, không nằm trong `history`, không xuống localStorage (`save()` chỉ ghi `soAnh`), bị xoá khi đổi tài khoản (`syncAccount()`), và được trả về khay khi lượt hỏi thất bại để bấm Gửi lại là đủ. `#aiImages` / `#aiImageState` mang `data-no-i18n` nên `veAnhKem()` tự sơn lại nhãn bằng `t()` khi đổi ngôn ngữ; dung lượng ghi bằng `CyUtil.formatBytes` (một tấm 72 B mà in "0.00 MB" thì người dùng tưởng hệ thống chưa nhận gì). **PHÓNG TO** (mục 5.2): `#aiExpand` lật class `.ai-wide` và nhớ lựa chọn vào `cysim-ai-rong` (theo máy, không theo tài khoản), nhãn do `veRong()` vẽ bằng `t()` kèm `aria-pressed`; kéo góc khung (CSS `resize`) thì to tuỳ ý, không nhớ. **ĐỘ SÂU + ĐỒNG HỒ** (mục 5.4): `#aiDepth` cho chọn `nhanh` \| `can-bang` \| `ky`, mã gửi xuống máy chủ **đúng bằng** khoá `DEPTH_MAP` trong proxy (slug ASCII không dấu, gạch nối), lựa chọn nhớ ở `cysim-ai-depth` theo máy; `docDoSau()` kiểm giá trị đọc được khỏi localStorage rồi mới gửi, nên một tay nào đó sửa `cysim-ai-depth` thành `"ky "` hay `"CAN_BANG"` vẫn không làm proxy nhận chữ rác. Mỗi câu trả lời được gắn một dòng `.ai-time` **"chữ đầu X,Ys · hoàn tất Z,Ws · <model>"** do `send()` đo bằng `performance`-grade `Date.now()`: chữ đầu = lúc mảnh SSE đầu tiên tới máy khách, hoàn tất = lúc stream đóng, `<model>` = tên máy chủ **tự khai** ở sự kiện SSE chót (đúng vào lúc proxy âm thầm đổi sang model dự phòng thì tên trên màn hình đổi theo — không có đường nào để tốc độ thật bị che). `leSec()` in dấu phẩy kiểu Việt khi UI đang tiếng Việt. Nhãn ba mức chỉ hứa cái **đã đo**: mức Nhanh cắt trần token nên câu *xong* sớm hơn chứ không làm chữ đầu tới sớm hơn, mức Kỹ nói "có thể lâu hơn" chứ không dám chắc. `Labs.ai` mở thêm `themAnh` và `soAnh()` cho kiểm thử tự động. Nạp **trước** `boot.js`. **Hai chốt trước khi nhấc máy**: `send()` hỏi `Flags.on("ai")` — quản trị tắt Trợ lý AI thì nút FAB đã ẩn và câu hỏi bị chặn tại chỗ, không gửi một request vô ích rồi mới báo lỗi — và hỏi `AiBudget.choPhep()`; hết hạn mức thì trả lời ngay bằng câu "hôm nay tài khoản này đã dùng hết lượt hỏi" chứ không để người dùng ngồi nhìn khung chờ, và bộ đếm **chỉ tăng khi máy chủ thực sự trả lời** (`AiBudget.them()` nằm ở nhánh thành công), nên một lần proxy chết không đốt lượt của ai. |
| `search.js` | 336 | Ô tìm kiếm toàn văn Ctrl+K (mục 4.6): palette kiểu trình soạn thảo, **chỉ mục dựng trực tiếp từ DOM đang hiển thị** (19 trang điều hướng cho học viên — 20 khi tài khoản có role admin + 13 thẻ bài học + 12 chủ đề Lý thuyết kèm bốn mục của từng chủ đề) nên nó không bao giờ nói dối về nội dung đã đổi; dựng chậm ở lần mở đầu vì dựng sớm hơn thì nhãn còn tiếng Việt trong khi màn hình đã tiếng Pháp. Mỗi dòng còn mang theo **chuỗi gốc tiếng Việt** của nhãn (`resolveSource`) nên học viên đang dùng giao diện tiếng Pháp gõ "lừa đảo" vẫn ra trang `Courriel frauduleux`. Gõ → `loc()` chấm điểm 100/60/40/20 → vẽ tối đa 12 dòng bằng **`textContent`** (chữ người gõ là dữ liệu, không có đường nào thành code). Enter mở trang qua **`showView()` chứ không tự đổi màn hình**, nên mọi chốt điều hướng (đang làm bài thi, trang bị admin tắt, quyền Quản trị) vẫn chạy nguyên như khi bấm nút — đo được: tắt hết công tắc thì danh sách còn 14 trang thay vì 19, học viên không thấy trang Quản trị, và Ctrl+K **từ chối mở khi màn hình khoá đang phủ** (`body.auth-locked` — palette nằm ngoài `.app` nên lớp khoá chỉ che chứ không xoá nó; `cysim:session` đóng palette và vứt chỉ mục vì role admin đổi danh sách trang được phép). Bỏ dấu thanh khi so ("an toan" tìm ra "An toàn") — cùng khuôn `chuanHoa()` của `exam.js` nhưng không dùng chung, vì exam cần giữ dấu để so đáp án. Khối kết quả mang `data-no-i18n` và dựng lại chỉ mục khi có `cysim:language`; Tab bị nhốt trong palette bằng `CyUtil.trapFocus`. |
| `boot.js` | 62 | Nạp **cuối cùng**, và là điểm đầu tiên vừa **có phiên đăng nhập** vừa **có DOM hoàn chỉnh** — ba dòng áp-dữ-liệu-lên-màn-hình vì vậy phải nằm ở đây chứ không ở `app.js` (lúc `app.js` nạp thì `auth.js` chưa tồn tại, `Auth.id()` chưa đọc được). `Auth.gate(startApp)` → `startApp()`: `taiDuLieuKhach()` (dời công học chế độ khách về tài khoản vừa mở) → `Flags.paint()` (sidebar + nút AI phải hiện đúng công tắc quản trị NGAY lần mở đầu, không chờ tới lúc người dùng bấm vào một trang bị tắt) → `paintAdminNav()` (nút "Quản trị" chỉ hiện với role `admin`) → `paintSettings()` → `await loadSavedMissions()` → `renderProgress()` → `Labs.sqli?.paint()` + `Labs.xss?.paint()` → `Search.init()` (chỉ gắn nút + phím; chỉ mục dựng ở lần mở đầu nên phải chờ DOM đã dịch xong — mục 4.6) → `showView()`; đang ngồi trong phòng thi (`Labs.exam.dangLam()`) thì mở `certificate` thay vì `dashboard`, để F5 giữa bài vẫn trả người làm bài về đúng phòng. `loadSavedMissions()` bắt lỗi khi đọc tiến độ và **tự bắt đầu từ 0** kèm `console.warn`, thay vì để một key hỏng làm chết cả app. |

### `js/labs/` — 15 file, mỗi file một màn hình

| File | Dòng | Nhiệm vụ (`data-k`) | Nội dung |
| --- | --- | --- | --- |
| `account.js` | 230 | `acct` | Tạo tài khoản demo → đăng nhập + MFA → **dò mật khẩu bằng SHA-256 thật**, có nút huỷ. |
| `sqli.js` | 210 | `sqli` | `classify()` đọc cú pháp SQL thật (nháy đơn đóng chưa, gì đứng sau) → union / orderby / auth-bypass / literal / broken. Chế độ safe dùng `?`. |
| `phishing.js` | 64 | `phish` | Hai trang đăng nhập cạnh nhau, tìm 3 điểm bất thường qua `[data-spot]`. |
| `ddos.js` | 212 | `ddos` | Trò chơi phòng thủ: mỗi 800ms sinh IP, tick 1000ms trừ máu, BLOCK/Auto-Block/Cloudflare. Bảng trên màn hình quá 40 thẻ thì gỡ thẻ cũ nhất và **cộng luôn vào dòng "Bị gỡ khỏi danh sách"** — con số lấy từ bộ đếm thật, không phải chữ trang trí; kết luận cuối trận nói đủ cả ba (chặn · lọt · bị gỡ). Đổi ngôn ngữ giữa trận là `repaint()` vẽ lại toàn bộ, không để kẹt chữ Việt. |
| `password.js` | 140 | `pwd` | Thời gian bẻ khóa **tính thật** từ không gian ký tự ÷ 1 THash/giây, 5 tiêu chí. |
| `firewall.js` | 99 | `fw` | Lưới 6 cổng + công tắc tường lửa; quét cổng chỉ là đồng hồ mô phỏng. |
| `realip.js` | 270 | `realip` | **Lab duy nhất gọi ra ngoài**: bốn nhà cung cấp đã đo thật (ipinfo.io → get.geojs.io → ipwho.is → ipapi.co), mỗi nhà trả về một khuôn; nhà nào báo 429 bị "nghỉ" 10 phút nên lần tra sau bỏ qua ngay, nhớ kết quả trong phiên (tối đa 24 IP), và một lần bấm không phát hai request song song. IP riêng/không định tuyến được (`bogon`) báo "không tồn tại" chứ không in bảng toàn N/A. |
| `antivirus.js` | 330 | `av` | Quét **file thật người dùng chọn** (SHA-256, EICAR, đuôi kép, 9 mẫu hành vi). Nút "Demo giao diện" không tính hoàn thành. |
| `csrf.js` | 268 | `csrf` | **Kết quả DO HÀM TÍNH ra, không có kịch bản nào được gõ sẵn**: ba cửa tấn công thật (form POST / `fetch` JSON / link GET) × bốn công tắc cấu hình (SameSite, cờ Secure, CSRF token, kiểm tra Origin). `quyDinhTrinhDuyet()` + `quyetDinhServer()` trả **mã** (`preflight`, `lax_keo_theo_post`, `thieu_token`, 401/403/200…), câu chữ chỉ được dựng lúc in — nên `Labs.csrf.pure` chốt được bảng chân lý ở cả năm ngôn ngữ và không có chuyện một cửa hiện xanh trong khi hàm tính ra nó chết. Gói tin in ra dựng đúng cú pháp sẽ đi: có `OPTIONS` preflight trước hay không, dòng `Cookie` được đính hay gạch. `#csrfLockBtn` chạy CÙNG hàm đó cho cả ba cửa và in bảng, tức phần "phòng thủ" được kiểm bằng liệt kê chứ không bằng lời hứa. Hai con số bắt được khi bấm thật trong trình duyệt: `lanChay` (token lượt chạy) chặn hai lượt dump 140 ms/dòng **chồng lên nhau** khi bấm cửa khác lúc lượt cũ chưa xong, và đổi cấu hình là số dư trả về 10.000.000 VND — bản trước đó kẹt mãi ở 1.000.000. |
| `idor.js` | 202 | `idor` | **Bốn chế độ máy chủ × sáu ID, cùng một luật**: ô `user_id` ngay trên thanh URL giả đổi được giá trị, `#idorScanBtn` quét cả sáu ID, `#idorLockBtn` hỏi "chế độ này kín chưa?" bằng đúng hàm mà từng hàng của bảng đã dùng. Máy chủ giả phân biệt 401 (không có phiên) / 403 (đã đăng nhập nhưng không có quyền) / 404 (ID không tồn tại) — bài học *"đã đăng nhập ≠ đã có quyền"* do hàm quyết định chứ không do chữ; ID rác (`abc`, `''`, `-1`) không có đường nào trả 200. Hai chế độ hở lộ đúng 4 hồ sơ của người khác, hai chế độ kín lộ 0. `secret_note` được dịch vì nó là chữ để người học đọc, kể cả khi nó nằm trong một khối JSON — tên người và email giữ nguyên văn. |
| `xss.js` | 69 | `xss` | Payload chạy thật trong `iframe sandbox="allow-scripts"` → cô lập khỏi trang cha. |
| `siem.js` | 119 | `siem` | 20 dòng log, ẩn 3 cuộc tấn công; đủ 3 loại và 0 dòng sai mới XUẤT SẮC. |
| `certificate.js` | 255 | `cert` | **Nhiệm vụ thứ 13** — tấm bằng do kỳ thi dưới đây cấp. Mở khoá theo `lockState()`: còn thiếu lab → chưa nộp thi → thi chưa đỗ → mở. `#certNameForm` (ô nhập họ tên để in bằng) **ẩn khi kỳ thi còn khoá** — `certificate.js:125` — để không ai gõ tên rồi tưởng mình đã lấy được bằng. Từ `Labs.exam.THI_THU` (6) trở lên thì dòng khoá đổi thành "chưa đủ 12 để thi **thật**, nhưng lượt **thử** đã mở — xem khung thi cuối trang": dưới ngưỡng đó khung thi thử thật sự nằm ngay bên dưới, nên nói "chưa mở được gì cả" là nói sai. Mã = `sha256(tên\|cấp\|ngày)` cắt 8 ký tự; in thêm dòng học lực (chỉ khi đỗ) lên ảnh PNG 1400×900 tải về. |
| `exam.js` | 871 | *(không có `data-k` riêng — khung thi nằm trong màn `certificate`)* | **Kỳ thi tốt nghiệp** (mục 4): 10 câu trắc nghiệm 2đ + 4 câu tự luận 5đ, chấm tại chỗ. **Hai lượt, một máy chấm**: thi **thật** mở ở 12 nhiệm vụ và ghi kết quả vào `cysim-exam:<id>`; thi **thử** (không tính điểm) mở từ 6 nhiệm vụ và ghi vào `cysim-exam-thu:<id>`. `Labs.exam.dat()` / `.ketQua()` chỉ đọc khoá thứ nhất, nên điểm lượt thử **không có đường nào** tới chứng chỉ — không phải do một cờ `if` dễ bị quên, mà do dữ liệu nằm ở chỗ mà cổng chứng chỉ không nhìn thấy. Bảng chuyển lượt chỉ hiện khi cả hai mở; dưới 12 nhiệm vụ thì vẫn có dòng "đây là lượt thi thử…" để không ai làm một lượt vô điểm mà tưởng vừa thi thật. **Trần 45 phút** (`THOI_GIAN_PHUT`) tính bằng mốc `hetLuc` tuyệt đối trong bài đã lưu: F5, ngủ tab hay tắt máy không tặng thêm phút nào, đếm ngược hiện trên `.exam-bar` (`#examHom`, đổi đỏ dưới 5 phút), hết giờ thì `nopBai(true)` nộp hộ phần đã làm và in dòng "bài được nộp tự động vì hết giờ". Nhịp 1 giây chỉ sửa một text node, **không** gọi `render()`, để con trỏ đang gõ trong ô tự luận không bị bay. Có **phòng thi** (cờ `lam` + `fs`): cửa phòng → vào phòng (xin toàn màn hình + thanh `.exam-bar`) → nộp bài hoặc rời phòng; **thoát toàn màn hình khi chưa nộp là mất bài** (mục 4.2). `dangLam()` đọc thẳng localStorage và **tính cả hai lượt** để `app.js` hỏi khoá điều hướng. Không phải nhiệm vụ → không cộng XP, không đụng `TOTAL_MISSIONS`. |
| `guide.js` | 231 | — | Trang Hướng dẫn (không tính XP): bảng cấu hình EmailJS + bảng I18n (coverage, dịch hàng loạt, xuất từ điển, chế độ báo lỗi). |

### `js/lang/` — dữ liệu **sinh ra**, không sửa tay

| File | Nội dung |
| --- | --- |
| `en.json` `zh.json` `fr.json` `es.json` `ja.json` | Mỗi file **1197 mục**, từ điển phẳng `"tiếng Việt": "bản dịch"` — đủ 1197 chuỗi mà `check_i18n.py` tìm thấy, nên không còn chuỗi nào phải dịch trên trình duyệt. Con số tăng từ 975 lên 1112 là do lớp Cài đặt / Quản trị / lời dẫn cho người mới (mục 6), lên 1127 khi thêm ô tìm kiếm toàn văn (mục 4.6), 1132 ở lượt mục 6, 1135 ở bản trước vòng #104, 1192 sau vòng #104 và **1197** hôm nay (vòng 8 thêm 5 chuỗi: `title` của iframe XSS + bốn đoạn nói thẳng về tài khoản và bảng xếp hạng). 57 chuỗi mới của vòng #104 (hai phòng lab CSRF/IDOR viết lại) đi hết vào hai tầng mà người thật kiểm soát: **53 chuỗi có bản dịch do người viết** trong `translation_review.json` (bảng review 1048 → **1101** → **1106**, cũng là số hàng thật sau khi xoá bốn key chết của kịch bản cũ) và 4 chuỗi ASCII thuần đi qua tầng code passthrough — **không chuỗi nào rơi vào hàng đợi dịch máy**. Vì thế `en` lấy 1117 từ `review` + 80 chuỗi code, bốn thứ tiếng còn lại 1106 + 91, và đó là lý do `machine 0` ở cả năm cột. |
| `index.json` | Đếm theo tầng cho từng ngôn ngữ (`review/machine/code/missing`) — giao diện đọc để in `· 100% ✓`. Bản hiện tại: `total` 1197; en `review 1117 + code 80`, zh/fr/es/ja `review 1106 + code 91`; **cả năm thứ tiếng `machine 0` và `missing 0`**. Có `_doc` tự mô tả. |
| `reviewed.json` | Chuỗi nào **không do máy sinh**: `curated` 408 · `review` 1106 · `code` 95, kèm `langs` nói từng thứ tiếng được lấy từ tập nào. Có `_doc` tự mô tả. |

JSON thuần không cho phép comment, nên ba loại file trên được giải thích ở đây và
bằng khóa `_doc` (riêng hai file metadata).

### `tools/` — Python dựng từ điển (chạy trên máy, không nạp vào app)

| File | Dòng | Vai trò |
| --- | --- | --- |
| `i18n_scan.py` | 449 | Thư viện: tìm mọi chuỗi tiếng Việt trong `index.html` + `js/`. **Bỏ qua comment** → viết tài liệu tiếng Việt dài trong code không sinh thêm chuỗi cần dịch. **`decode_escapes()`** biến chuỗi trong source thành ĐÚNG ký tự mà engine JS nhìn thấy lúc chạy: trước đây `_string_literals()` thả nguyên text escape (`\"`, `\n`) vào bộ đếm, nên những key như `"<b>"` bị ghi vào từ điển với `\"` trong tên — không bao giờ khớp lúc chạy, tức là một họ chuỗi im lặng không bao giờ được dịch. **`KEY_ARG` + `key_literals()`** (mới): đọc tham số TRỰC TIẾP của `t()`/`tr()` (ngón 0) và `tdem()` (ngón 1), nên một chuỗi không dấu như `t("Trang")` vẫn được tính là chuỗi nguồn — trước thay đổi này, mọi chuỗi chỉ dùng qua `t()` mà thiếu dấu thanh đứng ngoài báo cáo "thiếu" và có thể bị `purge_cache()` coi là chuỗi chết. **`DROP_TAGS` có `kbd`**: gợi ý phím (`Ctrl`, `K`, `Esc`, `↑`) không được dịch, đúng theo `SKIP_TAGS` của engine. `key_literals()` chỉ nhận **chuỗi trần** nằm ngay ở ô tham số: `t(dangMo ? "Đóng" : "Mở")` không được đọc ở đây, mà đi theo lối cũ — hai nhánh vẫn là chuỗi nguồn vì `_string_literals()` đã thấy chúng. |
| `gen_translations.py` | 543 | Dịch + ghi `js/lang/*.json`. Thứ tự quyền lực: `translation_review.json` → `i18n-curated.js` → chuỗi code giữ nguyên → cache dịch máy. `--offline` **dọn cache dịch máy**: bỏ mọi dòng mà key đã chết, key không phải tiếng Việt, hoặc value là bản sao vô nghĩa của key (kết quả HTM/JS trả về khi API dịch chết) — 3 496 dòng rác đã bị xoá một lần bằng cách này, và rác nằm lại thì vẫn là "technical debt ẩn" vì `check_i18n.py` chỉ phạt dòng được dùng. |
| `check_i18n.py` | 505 | Trọng tài: % theo tầng, chuỗi ngoài `t()` (chỉ là checklist), bản dịch rác, key chết. Cờ `--ci` gộp trọn cửa kiểm tra của dự án trong MỘT lệnh, **bảy khối**: i18n → `node --check` 26 file (`js/` + `test/`) → ba bộ test JS → `gemini_proxy.py --check` → quét trùng tên khai báo cột 0 **cộng tên đẩy ra `window`/`globalThis`** → nối id JS tham chiếu với id có thật trong markup **cộng đếm chỗ gán `.innerHTML =`** → không file nào git theo dõi (cả repo lồng `server/`) là `.env` hay chứa chuỗi hình dạng key Google (`AQ.…`/`AIza…`; chỉ in file:dòng, không in chuỗi), kèm CẢNH BÁO khi lịch sử git còn `.env`. Máy không có `node` trong PATH thì khai `CYSIM_NODE=<binary Node/Electron>` để cả bảy khối chạy thật; không khai gì thì khối thiếu dụng cụ in `BỎ QUA` kèm đúng câu lệnh cần chạy, chứ không im lặng (mục 3). |
| `translation_review.json` | 7755 | **1106 chuỗi × 5 ngôn ngữ do người thật dịch** (`_doc` + `strings`). Không bao giờ bị máy đè — đây là tầng quyền lực cao nhất mà `gen_translations.py` đọc. |
| `.translation_cache.json` | 864 | Cache đáp án dịch máy (`vi:en` 2, `vi:zh-CN` 669, `vi:fr` 56, `vi:es` 62, `vi:ja` 63 = **852 dòng**), còn lại sau lượt dọn rác (từ 4 365 dòng) và sau khi vòng #104 xoá bốn key chết của hai lab viết lại. Dữ liệu dựng, không nạp khi chạy app. `máy 0` trong báo cáo là số dòng **được dùng thật**, không phải số dòng trong file — vì vậy mới cần `--offline` dọn lại định kỳ. `save_cache()` luôn kết file bằng một ký tự xuống hàng: bản cũ không có, nên `wc -l` đếm thiếu một dòng so với số dòng thật và con số ở bảng này lệch mà không ai giải thích được vì sao. |

### `test/` — kiểm thử tự động (không cần trình duyệt, không cần cài gì thêm)

| File | Dòng | Kiểm chứng cái gì |
| --- | --- | --- |
| `exam.test.js` | 237 | **Máy chấm của kỳ thi** (`js/labs/exam.js` → `Labs.exam.tinhDiem`) chạy trên input thật, không phải mô tả: bài bỏ trống ra 0/20 cho **cả hai** phần (không phải 0 trắc nghiệm + điểm thưởng ẩn); 10/10 trắc nghiệm = 20đ; 5/10 = 10đ, đúng ngưỡng đỗ; tự luận chấm theo từng ý, không vượt trần 20đ; một đáp án **một từ khoá** trong bài ngắn thì **không** được tính, nhưng hai từ khoá cùng lượt thì có, và một từ khoá trong bài ≥80 ký tự cũng có — tức là nguyên văn ba nhánh của `chamTungDe()`, kể cả nhánh dễ bị nới tay nhất. Nửa sau chạy trên **`localStorage` giả**: giấy thi ghi vào `cysim-exam-thu:<id>` (lượt thử) với điểm 20/20 **không** làm `Labs.exam.dat()` thành true và không để lộ kết quả qua `.ketQua()`; đúng số điểm đó ghi vào `cysim-exam:<id>` thì đỗ — tức là "thi thử không tính điểm" được đo bằng đúng cái cổng mà chứng chỉ đi qua, chứ không bằng một dòng mô tả. Thêm: chưa vào phòng thì `dangLam()` false, đang làm dở lượt thử thì `dangLam()` true (khoá điều hướng tính cả lượt thử), và bài lưu sai khuôn (thiếu câu, của đề cũ) bị bỏ thay vì làm nổ màn hình. |
| `i18n.test.js` | 405 | **Bản thân máy dịch** (`js/i18n.js`) với năm từ điển thật trong `js/lang/`: thứ tự quyền lực fix > review > machine > code; `normalize` gom khoảng trắng thừa nên lookup không hỏng vì một dấu cách; `sanitizeRuntime` loại rác kiểu `"0"→"0"` ngay khi nạp; chuỗi lạ trả `null` ở cả `layerFor`, `lookup`, `provenance` chứ không âm thầm trả nguyên văn; `provenance` phân biệt review và machine; bất biến **`máy 0`** của `fr.json` được assert, nên một lượt dựng từ điển nào sinh ra bản dịch chưa ai duyệt là test đỏ ngay; tra ngược bản dịch về nguồn; `t()` ở tiếng Việt trả nguyên văn và **không** bỏ hàng đợi dịch máy; **mục 11 chốt `tdem()`/`DANG_DEM`** — mỗi mã ngôn ngữ trong bảng phải là mã hệ thống thật, `fr` số nhiều vẫn do từ điển quyết còn số ít không còn là `"1 entrées"`, `en` phải có dạng số nhiều riêng khi từ điển chỉ chứa số ít (`"2 suspicious file"` từng hiện ra trên màn hình), `zh`/`vi` tự rơi về `t()`; **mục 12 chốt các nhãn mới của ô tìm kiếm** trên cả năm thứ tiếng — `t()` phải khác nguyên văn và **không được tăng hàng đợi dịch máy**, kèm `tdem(1/7, "kết quả tìm được")` ở tiếng Pháp; và **`fetch` giả chỉ cho đọc file `js/…` trên đĩa** — mọi URL khác trả `ok:false`, nên cái assert "test chạy offline hoàn toàn" là thật, không phải tuyên bố. |

| `labs.test.js` | 333 | **Bốn phòng lab mở cửa cho máy chấm** — chạy trên đúng hàm sinh ra chữ mà người học TIN, không trên bản chép lại: `js/labs/password.js` → `Labs.password.pure` (bốn hàm toán + `LABELS`), `js/labs/sqli.js` → `Labs.sqli.pure.classify`, `js/labs/csrf.js` → `Labs.csrf.pure`, `js/labs/idor.js` → `Labs.idor.pure`. Mật khẩu: bảng ký tự 26/52/36/95 đúng từng nhóm, `isRepeating` bắt được `😀😀` (ca mà bản thiếu cờ `/u` bỏ lọt), `estimate("")` trả `null` chứ không bịa điểm cho ô trống, `123456` khớp đúng hạng 1 của danh sách 41 mật khẩu rò rỉ, 16 ký tự giàu entropy hơn 12 ký tự cùng bảng, chuỗi lặp và sequence bị trừ điểm, `LABELS` vẫn 5 mức và mức cuối là "Rất mạnh". SQLi: **ba payload gắn sẵn trên nút bấm** phải phân loại đúng union / orderby / auth, `'UNION SELECT'` trần (chưa thoát dấu nháy) chỉ là `literal` — đúng bài học mà bản "tìm substring" từng dạy sai — và `a' -- UNION SELECT 1` phải là `auth` chứ không phải rò rỉ bảng, vì mọi chữ sau `--` bị DB bỏ qua thật. CSRF: bảng chân lý 3 cửa × 4 công tắc — `None` thiếu cờ Secure thì cookie chưa từng được lưu, `fetch` JSON chết ở preflight CORS, `Strict` chặn cả ba cửa, `Lax` **tha đúng một** navigation GET (nên `link` vẫn ăn), toàn bảng chỉ có đúng 4 cửa ăn, có token thì 403 kể cả khi cookie đi được và token được xét trước Origin. IDOR: 48 phiên quét (4 chế độ × 2 trạng thái đăng nhập × 6 ID) không hàng nào tự mâu thuẫn, hai chế độ hở lộ đúng 4 hồ sơ của người khác (id 1,3,4,5), hai chế độ kín lộ 0, `quet()` trả đúng sáu hàng theo `DANH_SACH_ID`, ID rác (`abc`, `''`, `-1`) trả 404/401 chứ không bao giờ 200. Kèm ba ca `CyUtil.esc` để hai lab XSS/SQLi không tự mở cửa cho mã độc nó demo. **Negative control đã chạy** (31-10-2026): đảo thứ tự checks trong `classify()`, bỏ hình phạt <8 ký tự trong `estimate()`, rồi thêm năm ca cho hai lab mới — cho `Lax` tha mọi request, bỏ qua preflight, bỏ chốt CSRF token, biến chế độ "chỉ cần đăng nhập" thành đúng quyền, bỏ kiểm tra phiên → **cả năm mutation đều bị bắt** (2–4 ca đỏ mỗi lần, exit 1) và file nguồn được khôi phục nguyên từng byte. Nghĩa là các ca này thật sự chặn lỗi, không phải chữ ký huệ chạy trên stub rỗng. |

Khuôn khổ: **không có jest/vitest, cố ý.** App là 23 file JS (8 thẻ `<script>` + 15 file `app.js` nạp chậm) chia **một
phạm vi toàn cục duy nhất**, nên `vm.runInContext` cho phép nạp đúng các file
nguồn thật vào cùng một context và đọc tiếp các binding `const`/`let` cấp cao
nhất mà `import` không lấy được — đó là lý do test không cần (và không được phép)
copy lại logic. Test chỉ nạp những gì nó kiểm chứng: `exam.test.js` đưa vào một bộ
stub tối thiểu có chú thích từng dòng (`$`, `document`, `localStorage`, `t`,
`showToast`, `Auth`, `CyUtil`, `TOTAL_LABS`…), `i18n.test.js` nạp `utils.js` +
`i18n-curated.js` + `i18n.js` thật rồi tự tạo DOM stub, `MutationObserver`,
`CustomEvent`. `labs.test.js` nạp `utils.js` + `password.js` + `sqli.js` + `csrf.js` +
`idor.js` thật và phải
hỏi `CyUtil` bằng `vm.runInContext("CyUtil.esc(…)")` chứ không đọc `ctx.CyUtil` —
`const` cấp cao nhất rơi vào *global lexical scope*, không hiện thành property; đó
chính là cơ chế khiến `window.Labs` là `undefined` trong app và là lý do khối [5/7]
của `--ci` soi được tên đụng độ.

**Giới hạn, nói thẳng:** 15 lab là IIFE nên mặc định Node không với tới được gì bên
trong chúng. Từ 31-10-2026 **bốn** lab chủ động mở một cửa hẹp — `Labs.password.pure`,
`Labs.sqli.pure`, `Labs.csrf.pure`, `Labs.idor.pure`, chỉ gồm các hàm không đụng DOM —
nên phần *quy tắc* của bốn lab đó đã có chốt tự động; phần *dâng DOM / bấm nút /
đồng hồ đếm ngược* của mọi lab vẫn chỉ được kiểm chứng bằng cách mở trình duyệt (mục 1) — kể cả nhịp 1 giây của `#examHom` và luật "F5 không
tặng thêm phút nào". Từ 30-10-2026 giới hạn đó cũng áp cho **hai trang Cài đặt /
Quản trị, chế độ khách và ô tìm kiếm**: `Settings`, `Flags`, `AiBudget`,
`startGuest()`, `Search` sống trong `app.js`/`auth.js`/`search.js` nhưng đọc DOM thật,
nên chúng được đo bằng bấm tay và số đo từ DOM (bảng mục 6.3, mục 4.6), không phải bằng
một test tự động. Những gì *không* cần DOM của `Search` — nhãn và số nhiều — thì có chốt
tự động `[12]` trong `test/i18n.test.js`.
Ba file test này phong toả bốn thứ dễ hỏng nhất mà lỗi của nó
không hiện ra màn hình — **điểm thi**, **cách ly lượt thi thử / lượt thi thật**,
**từ điển ngôn ngữ**, và **các quy tắc in giữa màn hình lab** (độ mạnh mật khẩu, payload
nào thật sự đổi nghĩa câu SQL, cửa CSRF nào sống, ID nào lộ hồ sơ người khác) — chứ
không phải toàn bộ app.

### `server/` — tuỳ chọn: cầu nối Google Gemini (Python, không bắt buộc để chạy app)

| File | Dòng | Vai trò |
| --- | --- | --- |
| `gemini_proxy.py` | 1528 | Flask proxy: `POST /api/gemini {prompt, lang?, history?, profile?, images?, model?, depth?, stream?}` → gọi Gemini (mặc định **`gemini-flash-lite-latest`**, đổi bằng `GEMINI_MODEL`) bằng key **ở máy chủ**. `stream:true` trả `text/event-stream`: nhiều dòng `data: {"delta":"…"}` rồi một dòng chót `{"ok":true,"text":…,"model":…}` hoặc `{"ok":false,"code":…}`; không gửi `stream` thì vẫn nhận JSON `{ok,text,model}` như cũ — `model` là mô hình **thực sự** trả lời (có thể là bản dự phòng), và `js/ai.js` in đúng tên đó ra dưới bong bóng để người dùng thấy lúc nào proxy phải đổi model. Kèm `system_instruction` (AI của CySim, do Nguyễn Trí Đức viết, trả lời mọi chủ đề, **được nhắc phải viết gọn dưới ~150 từ**), `instruction_for(lang, ho_so)` nối thêm khối "BẮT BUỘC VỀ NGÔN NGỮ" → hỏi tiếng nào trả lời tiếng đó (`lang` lạ hoặc thiếu thì giữ khuôn gốc), và nối **hồ sơ người học** mà `js/ai.js` gửi lên: `clean_profile()` bỏ ký tự điều khiển, nén dòng trắng, cắt ở `MAX_PROFILE_CHARS = 2000` rồi mới đưa vào `system_instruction`, nên một body độc hại không phình chỉ thị; hồ sơ chỉ dùng để cá nhân hoá, không đọc lại thành tiếng cho người dùng, và proxy không tự bịa thêm chi tiết đời tư. Lịch sử gửi lên bị cắt còn 16 lượt / 9 000 ký tự. **Ảnh kèm** (mục 5.1): body có thể mang `images:[{mime,data(base64)}]`, và `clean_images()` là chốt kiểm soát độc lập — trình duyệt đã chặn một lần vẫn không được tin, vì payload gửi tới cổng 8000 không phải thứ do trang này tạo ra. Chốt đó giữ `ANH_CHO_PHEP` = PNG/JPEG/WebP/GIF, tối đa `MAX_IMAGES = 4` tấm, `MAX_IMAGE_BYTES = 2 MB` một ảnh, `MAX_IMAGES_BYTES = 6 MB` một lượt, rồi mới ghép `types.Part.from_bytes()` vào **trước** chữ của lượt hỏi trong cùng một `user` content (đảo ngược là mô hình trả lời câu chữ rồi quên tấm ảnh). Base64 rác bị bắt ở đây chứ không để nổ thành `api`. Vượt trần nào thì trả mã đó: `bad_image` cho "không phải ảnh được nhận", `too_large` cho "ảnh quá khổ" — `MAX_BODY_BYTES = 12 MB` đặt cao hơn trần ảnh để Flask không kịp trả 413 khô khan trước khi người dùng nghe thấy một câu hướng dẫn. `--check` có nguyên khối `ẢNH GỬI KÈM` chạy sáu ca sai (không phải danh sách, sai mime, base64 rác, quá trần một ảnh, quá số ảnh, quá tổng) và một ca đúng để chứng minh chốt này thật sự chặn, không chỉ tồn tại. **Chống quá tải của Google:** `mo_stream()` thử mô hình chính `SO_LAN_THU_LAI = 2` lần, nghỉ theo `THANG_NGHI = (0.0, 1.5)` — lần đầu thử **ngay**, lần hai nghỉ 1,5 giây — rồi mới chuyển sang `GEMINI_FALLBACK_MODEL`; 503 không nổ ở `generate_content_stream()` mà ở **mảnh chữ đầu tiên**, nên vòng retry phải bọc luôn `next(gen)` — bọc mỗi lời gọi hàm thì không bao giờ bắt được lỗi. Bản cũ nghỉ 1,5 → 3 → 6 giây trước cả ba lần thử: một lượt bị Google từ chối là người dùng ngồi nhìn khung chat im lặng ~10,5 giây chết rồi mới tới lúc model đỡ đạn bắt đầu, và đó chính là con số "AI hỏng" mà người dùng gọi lên. **Độ sâu câu trả lời** (mục 5.4): trường `depth` = `nhanh` \| `can-bang` \| `ky` tra `DEPTH_MAP` để đổi *cùng lúc* model, `max_output_tokens` và `temperature`; giá trị lạ hoặc thiếu thì rơi về `UU_DAI_MAC_DINH` (= đúng hành vi cũ, không báo lỗi, không âm thầm đổi model người dùng), `chieu_sau()` gấp khoảng trắng/gạch dưới thành gạch nối nên `CAN_BANG` vẫn khớp, và bảng đang chạy luôn xem được ở `GET /api/health` → `depths`. tuning: `max_output_tokens` = `GEMINI_MAX_TOKENS` (**2048**; trần cũ 1024 cắt câu tiếng Việt giữa chừng vì tiếng Việt có dấu ăn token nhanh gấp đôi — đã gặp thật và đã nâng), `thinking_config` chỉ gửi khi `GEMINI_THINKING_BUDGET` không trống. `GET /api/health` (kèm `fallback`; từ 01-11-2026 kèm thêm `keyValid` \| `keyValidDetail` \| `keyValidAge` và cờ **`?probe=1`** buộc hỏi lại Google thay vì ăn kết quả cache 5 phút — mục 5.7, và **`keyShape`**: bản rút gọn của chuỗi trong `.env`, dạng `AQ.A…(53)` — bốn ký tự đầu + độ dài, đủ để biết app đang đọc chuỗi nào mà không lộ credential, để dòng lỗi `bad_key` in bằng chứng tại chỗ thay vì bắt người đọc tin một kết luận), `POST /api/config {lang}` (in ra đúng chỉ thị đang dùng cho từng thứ tiếng), `--selftest`, `--check`. `debug=False` luôn; còn **nơi nghe** thì do môi trường: `GEMINI_PROXY_HOST` thắng nếu khai, chưa khai thì host **tự suy ra từ biến `PORT`** — PaaS nào cũng đặt `PORT` nên Render/Railway bind `0.0.0.0` mà không phải cấu hình gì thêm, còn máy này không có `PORT` nên bind `127.0.0.1` (mở ở quán cà phê không đồng nghĩa với việc cả WiFi cùng chỗ gõ được `/api/gemini` để đốt key); cổng là `GEMINI_PROXY_PORT` → `PORT` → `8000` (chú ý thứ tự: `.env` của máy này khai `GEMINI_PROXY_PORT = 8000` nên nó thắng `PORT` — trên Render không có `.env` nên `PORT` của host dùng được). Dòng `print` lúc bật máy chủ in đúng host thật đang bind, **và in luôn số phận của cái key** (`_dang_key()` phân loại theo hình dạng: `AQ.…` = định dạng key hiện nay của AI Studio, `AIza…` = định dạng cũ — hình dạng **không** nói key sống hay chết, nên khi bị từ chối `_vi_sao_bi_tu_choi()` nói thẳng "key đã bị xoá/thu hồi hoặc bị chặn vì lộ, tạo key mới"; sau đó máy chủ ở máy mình gọi Google thật một lần để in "ĐẠT — chat được" / "BỊ TỪ CHỐI" / "chưa kết luận được"). Trên PaaS (có `PORT`) bước gọi Google đó **được bỏ qua**, vì chưa bind port mà đã đi hỏi mạng là đúng cái bẫy "dịch vụ chết ngay ở bước health check" — kết luận trên Render lấy bằng `/api/health?probe=1`. Ở chế độ công khai có thêm **hai lớp hãm**: `CYSIM_ORIGINS` (THÊM nguồn được phép ngoài `https://cysim.netlify.app` và loopback mặc định; để trống vẫn chặn nguồn lạ, không khóa `chay-ai.bat` và Live Server) và `CYSIM_RPM` (mặc định 20 lượt/phút cho một IP, `0` là tắt hẳn). Nói thẳng như file đã nói: cả hai là **đồ hãm, không phải tường** — `Origin` là chữ do trình duyệt gửi nên curl giả được trong một dòng, và bộ đếm chỉ sống trong một tiến trình. Cái thật sự chặn hoá đơn vẫn là trần nội dung (`MAX_PROMPT_CHARS`, lịch sử 16 lượt / 9 000 ký tự, trần ảnh). CORS: `add_cors()` đóng dấu `Access-Control-Allow-Origin` cho **mọi origin có gửi `Origin`**, kể cả origin đang bị `CYSIM_ORIGINS` từ chối — bản cũ chỉ cấp header khi origin khớp danh sách, và đó là bug thật chứ không phải chuyện trên trời: đo trên Render 30-10-2026, `OPTIONS` preflight trả 200 mà không có header nào, `POST` trả 403 cũng không header, nghĩa là trình duyệt của khách chỉ thấy "không truy cập được máy chủ" trong khi máy chủ trả lời rất rõ. Che lý do từ chối là nói dối người dùng, còn để lộ nó thì không mất gì (danh sách nguồn giả được bằng curl trong một dòng), nên từ nay khách bị chặn vẫn ĐỌC ĐƯỢC câu "máy chủ không nhận lời hỏi từ trang này" — `js/ai.js` đã có sẵn bản dịch cho mã `forbidden`. Cũng vì bài học đó mà `/api/health` in thêm khối `access` (`origins`: danh sách đang khai hoặc `"open"`, `rpm`): một câu `curl https://<host>/api/health` giờ trả lời được câu "máy chủ này có chặn trang của tôi không", thay vì bắt người sửa đoán qua log. KHÔNG dùng `flask-cors` dù nó đã được thử thêm vào ngày 29-10: `add_cors()` đặt tay đủ bốn cái header, hai cùng lúc chỉ sinh rủi ro header trùng giá trị (trình duyệt từ chối) và Render phải cài thêm một gói vô ích. `--check` có khối `hai lớp hãm công khai` đo đủ hai chiều: RPM=3 chặn đúng lượt thứ 4, origin lạ bị 403 khi đã khai danh sách, origin khớp và loopback và client không gửi `Origin` (curl) đều đi qua, và `Access-Control-Allow-Origin` phải có mặt ở CẢ BA loại origin — kể cả origin bị chặn. |
| `requirements.txt` | 5 | `google-genai` + `Flask`. Đã kiểm thử với google-genai 2.33.0 / Flask 3.1.3 / Python 3.13. |
| `.env.example` (gốc) | 90 | Khuôn khai báo `GEMINI_API_KEY` (**để trống trong template — bao giờ cũng vậy, đừng dán key thật vào file này**: chiều 29-10-2026 phát hiện chính key thật đã bị dán vào đây khi đổi key mới, và đã được trả về trống. File này được commit và được phát công khai như mọi file khác — key nằm trong nó là key công khai, phải thu hồi ở Google AI Studio), **và khối chú thích 03-11-2026 nói đúng về định dạng key** (`AQ.…` ≈53 ký tự = định dạng AI Studio cấp hiện nay, `AIza…` = kiểu cũ; đúng định dạng vẫn có thể đã bị Google thu hồi/chặn vì lộ — đúng cái bệnh khiến máy này "không chat được" mà UI từng báo "Đã nối được máy chủ AI"; mục 5.7), `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `GEMINI_DEEP_MODEL` (model cho mức "Kỹ" của ô độ sâu — mục 5.4), cổng, CORS, `GEMINI_SYSTEM_PROMPT`, và hai núm vặn `GEMINI_MAX_TOKENS` / `GEMINI_THINKING_BUDGET` để dạng comment. Mỗi dòng cấu hình đều kèm **số giây đo thật** và ngày đo, kể cả những lần đo ra số xấu (~3 phút ngày 27-10, 173,6 s với key mới chiều 29-10) — template là chỗ duy nhất người đọc có thể biết mặc định này đến từ đâu. Copy thành `.env`. |
| `.env` (gốc, không commit) | 50 | Đã tạo sẵn trên máy này, **đã có một chuỗi credential** (không in ra tài liệu nào) — nói cho đúng thì chuỗi đó (dạng `AQ.…`, đúng định dạng) đã bị Google thu hồi/chặn — nó từng bị commit lên repo công khai — nên Google **không** nhận, và `/api/health` tách thành hai tầng: `keyConfigured:true` (có chuỗi) + `keyValid:false` (chuỗi đó bị đuổi). `load_dotenv()` chạy **trước** khối cấu hình nên `GEMINI_MODEL` trong file này có tác dụng; bản cũ đọc `.env` sau khi `MODEL` đã snapshot — sửa dòng model mà không thấy đổi là vì thế. Từ 01-11-2026, `nap_lai_env_neu_da_sua()` (`server/gemini_proxy.py:607`) so mtime của `.env` mỗi lần cần client và mỗi lần kiểm key: file đổi thật thì nạp lại bằng `override=True` rồi reset client — **dán key mới hay sửa key cũ đều có hiệu lực ngay**, không phải bật lại máy chủ. Bản cũ chỉ đọc lại khi môi trường còn **trống** key, nên "sửa `.env` mà không thấy đổi" vẫn đúng với nó, và câu đó từng nằm ở đây như một lời xin lỗi. Trên máy này nó đang để `GEMINI_MODEL=gemini-flash-lite-latest` + `GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite` và **không có** dòng `GEMINI_DEEP_MODEL` — mức "Kỹ" vì thế rơi về mặc định trong code, cũng là `gemini-3.5-flash-lite` (`/api/health` xác nhận cả ba ô). |
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
máy này → `http://127.0.0.1:8000/api/gemini`, domain công khai → máy chủ đã khai ở
`MAI_CONG_KHAI` (hiện là `https://cysim-backend.onrender.com/api/gemini`; để trống
thì mới là `/api/gemini` cùng nguồn, và host tĩnh kiểu Netlify không chạy Python). Muốn đổi luôn cả lịch sử của một tài khoản: xoá
`cysim-ai:<email>` (hoặc bấm "Xoá lịch sử" ngay trong khung chat).

## 3. Lệnh hằng ngày

```bash
# MỘT LỆNH cho tất cả (mục 6 vòng duyệt đòi CI/pre-commit — xem giải thích bên dưới):
PYTHONIOENCODING=utf-8 python tools/check_i18n.py --ci

# --- hoặc từng khối một ---

# Sau khi thêm/sửa chữ trong code — dựng lại từ điển, không gọi mạng
PYTHONIOENCODING=utf-8 python tools/gen_translations.py --offline

# Kiểm tra trước khi nộp: exit != 0 khi còn lỗi thật
PYTHONIOENCODING=utf-8 python tools/check_i18n.py --strict

# Kiểm thử tự động (2 file, exit != 0 khi máy chấm hoặc máy dịch sai)
node test/exam.test.js
node test/i18n.test.js

# Syntax-check một file JS vừa sửa, không chạy app
node --check js/ai.js

# Kiểm tra proxy mà KHÔNG cần key và KHÔNG cần mạng: sáu khối in "ĐẠT" (ghép lịch
# sử, ảnh kèm, ép ngôn ngữ, độ sâu DEPTH_MAP, hai lớp hãm công khai CYSIM_ORIGINS +
# CYSIM_RPM + header CORS, chỉ dẫn hệ thống) — exit != 0 khi cấu hình lệch, ví dụ ai
# đó đổi khoá DEPTH_MAP thành chữ có dấu cách, hoặc bỏ mất Access-Control-Allow-Origin
# trên một response (chính cái header đó là lý do bản Render chết ngày 30-10-2026).
PYTHONIOENCODING=utf-8 python server/gemini_proxy.py --check
```

**Vì sao `--ci` mà không phải một file CI riêng**: người duyệt nói thiếu "CI/pre-commit tự động kiểm tra i18n".
Ràng buộc của dự án là **không bước build** và **không thêm file** (trần 52, xem mục 8),
nên không có `.github/workflows` hay script riêng — cửa kiểm tra nằm trong
`tools/check_i18n.py --ci`: bảy khối (i18n + từ điển → `node --check` 26 file (`js/` +
`test/`) → ba bộ test JS (exam 21 ca, i18n 64 ca, labs 73 ca) → `gemini_proxy.py --check`
→ quét trùng tên khai báo cấp cao nhất **cộng tên đẩy ra `window`/`globalThis`** → nối
mọi id JS tham chiếu với id có thật trong markup **cộng đếm chỗ gán `.innerHTML =`** →
không có key Google trong file git theo dõi), exit != 0 khi bất kỳ khối nào báo LỖI. Khối [5/7] chỉ cần Python: đọc từng file `js/**`
và `sw.js`, ghi nhận mọi `const/let/var/function/class` nằm ở **cột 0** — đó chính là tên
rơi ra phạm vi toàn cục của `<script>` thường — rồi in ra tên nào xuất hiện ở ≥2 file.
Hôm 31-10-2026 đo được **147 tên trong 24 file, 0 trùng**, và **1** tên ra cửa sổ toàn
cục (`numOf`, chủ ý). Khối [6/7] cũng chỉ cần Python: **232 id** được `$("x")` /
`getElementById("x")` / `querySelector("#x")` tham chiếu thì **232** có node thật
(không cần trình duyệt), và số chỗ gán `.innerHTML =` còn lại trong `js/` + `sw.js` là
**0**. Khối [7/7] (thêm 03-11-2026) cần `git`: nó chặn đúng tai nạn đã làm chết AI —
`git add -f .env` hôm 30-10 đẩy key lên repo công khai, `.gitignore` không cản được `-f`.
Lịch sử thì không tự sửa được, nên khối này chỉ in `CẢNH BÁO: lịch sử git vẫn còn .env ở
2 commit (4d5053d, 7ca1e6e)` — viết lại lịch sử + force-push là quyết định của chủ repo.
Khối nào **không chạy được** vì thiếu dụng cụ thì in `BỎ QUA (thiếu node)` /
`BỎ QUA (thiếu package)` và kèm dòng `CẦN NÓI: N khối CHƯA được kiểm` — một cái "xanh"
giả còn tệ hơn "đỏ", vì người ta sẽ tưởng mọi thứ đã qua cửa. **pre-commit hook thì
không file nào trong repo thay được**: nó nằm trong `.git/hooks/` của máy người dùng,
muốn tự chạy trước mỗi commit thì thêm một dòng `python tools/check_i18n.py --ci` vào
`.git/hooks/pre-commit` — việc đó ở phía người dùng, nói thẳng như vậy.

`node` ở đây là Node 20+ bất kỳ. Trên máy này Node không nằm trong `PATH` — chỉ
có Node nhúng trong Qoder — nên ba bộ test chạy được bằng:
`ELECTRON_RUN_AS_NODE=1 "<đường-dẫn-Qoder.exe>" test/exam.test.js` (và tương tự
cho `--check`). Test không cài dependency, không gọi mạng, không cần trình duyệt.
Cũng vì không có `node` trong `PATH` mà hai khối 2 và 3 TỪNG in `BỎ QUA` — từ
31-10-2026 `--ci` nhận thêm biến **`CYSIM_NODE`**: trỏ nó tới một binary Node/Electron
bất kỳ (máy này dùng `…/Qoder/Qoder.exe`) thì trọng tài tự đặt `ELECTRON_RUN_AS_NODE=1`
và chạy đủ **bảy khối**, không còn chỗ nào bỏ ngỏ. Đo nguyên văn trên máy này:

```bash
CYSIM_NODE="C:/Users/Admin/AppData/Local/Programs/Qoder/Qoder.exe" \
  PYTHONIOENCODING=utf-8 python tools/check_i18n.py --ci
#  === [2/6] node --check 26 file js+test ===                ĐẠT (26 file)
#  === [3/6] test tự động ===                                exam 21 · i18n 64 · labs 73 = 158 ca, 0 lỗi
#  === [4/6] server/gemini_proxy.py --check ===              tất cả ĐẠT, có 5 ca IPv6 mới
#  === [5/6] trùng tên + tên đẩy ra window/globalThis ===     147 tên cột 0 trong 24 file — trùng: 0
#  === [6/6] nối id DOM + 0 innerHTML ===                     232 id tham chiếu, 232 có node, 0 innerHTML
#  === [7/7] không có key Google trong file git theo dõi ===  (03-11) ĐẠT + CẢNH BÁO lịch sử còn .env
#  i18n ĐẠT · node --check ĐẠT · test JS ĐẠT · proxy ĐẠT · trùng tên ĐẠT · id + innerHTML ĐẠT · không lộ key ĐẠT
#  exit 0
```

Không khai `CYSIM_NODE` mà cũng không có `node` trong PATH thì đúng hai khối đó in
`BỎ QUA` KÈM dòng lệnh cần chạy — thà báo "chưa kiểm" còn hơn nộp một chữ "xanh" giả.

Trạng thái hiện tại (đo lại chiều 31-10-2026, **sau** vòng rà soát của mục 4.8, 6.6,
8.1, vòng #104 viết lại hai phòng lab CSRF/IDOR và **vòng 8** — 15 điểm trong ảnh
người duyệt gửi): **1197 chuỗi gốc**, cả 5 ngôn ngữ `máy 0 | thiếu 0`, `en` 1117 chuỗi
người duyệt + 80 chuỗi code, `zh/fr/es/ja` 1106 + 91; bảng review 1106 chuỗi × 5 thứ
tiếng; `check_i18n.py --strict` exit 0; `test/exam.test.js` **21 đạt / 0 lỗi**,
`test/i18n.test.js` **64 đạt / 0 lỗi**, `test/labs.test.js` **73 đạt / 0 lỗi**,
`server/gemini_proxy.py --check` **sáu nhóm ĐẠT** (thêm 5 ca IPv6/localhost HOA/giả
dạng loopback cho chốt CORS mới); `--ci` **sáu khối đều ĐẠT, exit 0, không khối nào
BỎ QUA**. Tổng số file **52 / trần 52 — đã đầy**: vòng 8 không lấy thêm suất nào, markup
`<noscript>` + bốn đoạn nói thẳng vào `index.html`, logic vào `i18n.js`/`app.js`/`sqli.js`,
chốt mới vào `check_i18n.py`, chữ dịch vào `translation_review.json`, và ba chỗ sửa lab
(`ddos.js` +9, `siem.js` +5, `antivirus.js` +1 dòng) đều nằm trong file đã có.

Lớp mới **không có test tự động cho tương tác DOM** (vẫn chỉ xác minh bằng tay trong
trình duyệt — xem "Giới hạn, nói thẳng" trong mục `test/` ở mục 2 và bullet "Trung thực về
kiểm thử" ở mục 8; riêng vòng 8 thì phiên bấm-thật đó được ghi thành số đo ở **mục 8.3**,
và nó tìm ra hai lỗi mà cả sáu khối `--ci` lẫn 158 ca test đều không thấy); riêng nhãn và số nhiều của ô tìm kiếm thì có chốt tự động `[12]`.
Lớp mục 6 được bấm thật trong trình duyệt cùng ngày; bảng số đo nằm ở **mục 6.3**. Ba
lỗi thật tìm ra bằng cách đó, và **không lệnh nào ở trên bắt được**: (1) `transition-duration` đơn độc
để nguyên `transition-property: all`, nên tab bị hoãn giữ lại **màu của theme cũ**;
(2) `replaceChildren()` đá focus về `<body>` sau mỗi nhịp bấm công tắc — bàn phím
mất chỗ đứng; (3) phiên khách nhét chữ đã dịch vào dữ liệu, đổi ngôn ngữ là còn
"Invité" giữa màn hình tiếng Việt. Cả ba đã sửa và đo lại.

Ba lệnh Python (`gen_translations`, `check_i18n`, `gemini_proxy --check`) để lại
`__pycache__/` (bộ nhớ đệm của Python, sinh mỗi lần chạy).
Xoá nó trước khi đếm file hay đóng bài: `rm -rf tools/__pycache__ server/__pycache__`.

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

### 4.5 Trang Lý thuyết (`#theory`)

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

### 4.6 Ô tìm kiếm toàn văn (`js/search.js`, Ctrl+K)

Người duyệt round 3 chỉ đúng một chỗ (mục #11): app có 20 màn hình, 13 bài học và 12
chủ đề lý thuyết, nhưng không có đường nào đi thẳng tới thứ mình nhớ mang máng — chỉ
còn cách đọc lại sidebar. Với người dùng hôm nay, một app không có ô tìm kiếm cảm giác
"cũ" hơn đúng cái nó đang có, nên đây là tính năng được thêm chứ không phải được ưu
tiên hơn.

**Thiết kế: không có cơ sở dữ liệu toàn văn, và đó là điểm chính.** Chỉ mục dựng trực
tiếp từ DOM đang hiển thị — `.nav-btn[data-view]` → nhãn `Trang`,
`#dashboard button.card.mission[data-goto]` → `Nhiệm vụ`, `#theory .card.s6` (tiêu đề
cộng bốn mục Khái niệm/Cơ chế/Dấu hiệu/Phòng thủ nối bằng ` · `) → `Lý thuyết`. Vì nó
đọc đúng nhãn trên màn hình, nó **không thể nói dối** về nội dung đã đổi: viết thêm một
chủ đề vào `index.html` là chủ đề đó tìm được ngay, không phải sửa thêm bảng nào. Cái
giá cũng được nói thẳng: chữ nằm trong log của một phòng lab, trong lịch sử chat hay
trong đáp án câu thi **không** nằm trong chỉ mục — ô này tìm "đi tới đâu có nội dung để
học", không phải tìm mọi ký tự trong app.

Năm quyết định kỹ thuật đáng kể:

1. **Dựng chậm, ở lần mở đầu tiên.** Dựng sớm hơn (ngay lúc `boot.js` chạy) thì từ điển
   chưa kịp áp lên DOM: chỉ mục toàn tiếng Việt trong khi màn hình đã tiếng Pháp, và gõ
   "phishing" trả về kết quả tiếng Việt. Có `cysim:language` thì dựng lại từ đầu.
2. **Bỏ dấu thanh khi so** — "an toan" vẫn tìm ra "An toàn". Cùng khuôn `chuanHoa()` của
   `exam.js` nhưng cố ý không dùng chung: exam cần giữ dấu để so đáp án, ở đây mất dấu
   là mục đích.
3. **Mỗi dòng mang theo chuỗi gốc tiếng Việt của nó.** App viết bằng tiếng Việt, nên
   `them()` gọi `resolveSource()` (tra ngược `reverseSource` trong `js/i18n.js`) trên nhãn,
   mô tả và **từng mảnh** của mô tả (bốn mục của một chủ đề Lý thuyết — chuỗi đã ghép thì
   không tra được, từng mảnh thì có) rồi nối tất cả vào khoá tìm. Học viên chuyển sang
   giao diện tiếng Pháp rồi vẫn gõ "lừa đảo" theo thói quen là chuyện bình thường, và câu
   trả lời "không có gì" trước một trang có thật là cách nhanh nhất làm họ bỏ app. Đo
   trong trình duyệt ngày 30-10-2026, UI tiếng Pháp: `lừa đảo` → 2 kết quả (`Courriel
   frauduleux` + `Piège d'arnaque phishing`), `dấu hiệu` → 12 chủ đề Lý thuyết, `piège`
   → 2 kết quả theo nhãn Pháp; UI tiếng Việt: `lừa đảo` 2, `mã độc` 3, `phishing` 2;
   UI tiếng Anh: `lừa đảo` → 2 (`Fraudulent email` + `Phishing Scam Trap`), `phish` → 2.
   Đây **không** phải tìm kiếm đa ngôn ngữ đầy đủ — chỉ có đúng hai phía được khớp là nhãn
   đang hiển thị và chuỗi gốc tiếng Việt của nó.
4. **Chỉ đi qua `showView()`, và chỉ mở khi màn hình đang mở khoá.** Enter không tự đổi
   màn hình mà gọi đúng hàm mà mọi nút sidebar gọi, nên ba chốt điều hướng vẫn chạy
   nguyên: đang ngồi trong phòng thi thì bị chặn, trang bị quản trị tắt thì bị chặn,
   trang Quản trị không hiện với học viên. Đo thật bằng browser: tắt hết công tắc thì chỉ
   mục còn **14** trang thay vì **19**. Palette nằm ở cuối `<body>`, **ngoài** `.app`, nên
   màn hình khoá (`body.auth-locked`) chỉ che nó bằng z-index chứ không xoá nó — `mo()` vì
   vậy từ chối khi đang khoá, và `cysim:session` vừa bắn là đóng palette + vứt chỉ mục
   (role admin đổi cả danh sách trang được phép). Đo 30-10-2026: đang khoá, Ctrl+K → palette
   vẫn `hidden`; vào khách rồi đăng xuất → palette tự đóng, `Search.chiMuc()` không còn
   dòng `view === "admin"` nào.
5. **Kết quả vẽ bằng `textContent`.** Chữ người gõ là dữ liệu, không được nội suy vào
   `innerHTML` — một app có phòng lab XSS mà tự ghép chuỗi người dùng gõ vào HTML thì
   mâu thuẫn với chính bài dạy của nó.

Phím: `Ctrl+K` / `Cmd+K` mở, `Esc` đóng, `↑ ↓` di chuyển (dòng đang chọn tự cuộn bằng
`scrollIntoView({block:'center'})` nên bàn phím ảo không che nó), `Enter` mở. Tab bị nhốt
trong palette bằng `CyUtil.trapFocus`. Khối kết quả mang `data-no-i18n` vì engine mà đi
dịch lại một danh sách do JS vừa vẽ là biến bản dịch thành chuỗi lạ. Trên cửa sổ hẹp,
palette xếp **cột** và chiếm gần hết chiều ngang: bản đầu để hàng, và kết quả đo được là
một hộp **306px** lọt thỏm trong cửa sổ 514px (đo bằng `getBoundingClientRect` ngày
30-10-2026, đã sửa và đo lại thành 479×201). Gợi ý phím `↑ ↓ Enter Esc` nằm trong `<kbd>`:
mã `KBD` được thêm vào `SKIP_TAGS` của `js/i18n.js` và `kbd` vào `DROP_TAGS` của
`tools/i18n_scan.py`, vì máy dịch biến "Enter" thành "Entrée" là hỏng một gợi ý phím.
Dòng đếm kết quả dùng `tdem()` (mục 4.7) — tiếng Pháp phải là "1 résultat trouvé".

### 4.7 `tdem()` — vì sao `"1 entrées"` và `"2 suspicious file"` từng hiện trên màn hình

Mỗi khoá từ điển chỉ chứa **một** dạng ngữ pháp, mà số nhiều ở tiếng Pháp/Anh/Tây Ban Nha
lại phụ thuộc con số đứng trước. Ghép `1 + t("mục dữ liệu trên máy này")` vì vậy sinh ra
`"1 entrées de données"` (bản tiếng Pháp trong từ điển là số nhiều), và `2 + t("file nghi
vấn…")` sinh ra `"2 suspicious file"` (`js/lang/en.json` chứa dạng số ít). Tiếng Việt không
chia số nhiều, nên người viết code không có cách nào tự thấy hai lỗi này — người học
chuyển sang tiếng Pháp thì thấy ngay bằng mắt thường.

`tdem(n, "chuỗi nguồn")` là 24 lời gọi trong 9 file (`app.js`, `ai.js`, `search.js`,
`certificate.js`, `exam.js`, `antivirus.js`, `account.js`, `siem.js`, `realip.js`). Luật
của nó, và là lý do nó không thành "nguồn sự thật thứ hai":

- Bảng `DANG_DEM` **chỉ chứa dạng mà từ điển đang thiếu** (22 mục). Dạng còn lại vẫn do
  `t()` / `translation_review.json` quyết; ghi cả hai dạng vào bảng là hai nơi cùng trả
  lời cho một chuỗi, và bản dịch người dùng sửa trong bảng review sẽ bị bảng này đè.
- Ngôn ngữ không chia số nhiều (`vi`, `zh`, `ja`) **không có mặt trong bảng** và tự động
  rơi về `t()` — không có chuyện bịa ra một dạng số ít tiếng Trung.
- `n` không phải số (chuỗi ghép nhầm) thì coi như số nhiều và **không ném lỗi**: một dòng
  hiển thị hỏng không được phép làm trắng cả màn hình.
- Bảng nằm giữa `// i18n-skip-begin` / `// i18n-skip-end`: `tools/i18n_scan.py` bỏ **cả
  vùng**, vì khoá là tiếng Việt nhưng giá trị là tiếng Pháp/Tây Ban Nha, và dấu thanh
  Latin-1 (`é`, `í`, `ó`) làm bộ lọc tưởng đó là chuỗi Việt chưa dịch — bộ máy dựng từ
  điển sẽ tự nhân bản chính kết quả của mình thành vô hạn.
- `KEY_ARG` trong scanner nói cho `tdem()` biết đối số **thứ nhất** (số) không phải chuỗi
  nguồn, đối số **thứ hai** mới phải. Quên khai báo `tdem` là mọi chuỗi chỉ đi qua nó bị
  coi là "đứng ngoài `t()`" và `purge_cache()` xoá như chuỗi chết.
- `[11]` trong `test/i18n.test.js` chốt cả bốn chiều: mọi mã ngôn ngữ trong bảng phải là
  mã hệ thống thật, `fr` số nhiều vẫn do từ điển quyết, `en` phải có dạng số nhiều riêng
  khi từ điển chỉ chứa số ít, `zh`/`vi` rơi về `t()`.

### 4.8 Nạp chậm: chữ lấy từ máy, script lấy theo trang, từ điển lấy theo ngôn ngữ

ĐỀ BÀI: mục 2 trong ảnh reviewer ("hiệu năng tải trang, chưa lazy-load lab") và
đề xuất của họ ("dùng font hệ thống thay Google Fonts"). Số đo **trước**, lấy
bằng Performance API trên `127.0.0.1:8137` ngày 30-10-2026:

| Trước | Số đo | Vì sao nó là vấn đề |
| --- | --- | --- |
| JS nạp ở lần mở trang | **433,6 KB trong 23 thẻ `<script>`** | Một phiên học thường chỉ ghé 2–3 phòng; 15 file (14 lab + `ai.js`, 178,7 KB) bị tải để không. |
| Từ điển `js/lang/*.json` | **716,2 KB, cả 5 ngôn ngữ cùng lúc ở boot** | Người học chỉ dùng MỘT ngôn ngữ; bốn file kia chắn băng thông ngay khi mở. |
| Font | **7 request + ~94,6 KB chặn vẽ (render-blocking)** | `<link>` Google Fonts nằm ở `<head>`: trình duyệt dừng vẽ chữ cho tới khi font về, trên mạng chậm là một màn hình trắng thật sự. |

**SAU** (cùng máy, cùng phép đo). Ba con số KB dưới đây được đo lại sáng
31-10-2026 bằng `encodedBodySize` của chính trình duyệt rồi đối chiếu `wc -c` trên
đĩa — khớp từng số; các file `js/` không đổi gì từ tối 30-10, nên đây vẫn là phép đo
của cùng một bản, chỉ là đọc lại cho chắc:

- **Font = chữ hệ thống.** Bỏ hai `<link>`, `--sans`/`--mono` trỏ thẳng bộ font
  có sẵn trong máy. 0 request font, hết 94,6 KB chặn vẽ. Đổi lại không còn kiểm
  soát được hình dáng chữ — chấp nhận, vì app này là nơi người ta ĐỌC hướng dẫn
  và LOG, không phải poster.
- **Script theo trang.** `<head>`/`<body>` chỉ còn **8 thẻ** (utils → i18n-curated
  → i18n → app → auth → labs/exam → search → boot) = **254,9 KB** đo lúc boot.
  15 file còn lại do `LAB_SCRIPT` / `VIEW_SCRIPT` trong `js/app.js` tạo `<script>`
  động đúng lúc trang đó được mở: mở lần lượt cả 20 màn hình → **22 resource JS,
  359,0 KB**; `js/ai.js` (74,6 KB) chỉ tới khi bấm nút trợ lý, tức cả app
  ≈ **433,6 KB** nhưng không ai phải trả hết ngay. Một phiên 2–3 phòng lab chỉ
  tốn thêm ~15–25 KB so với boot.
- **Từ điển theo ngôn ngữ.** Boot chỉ nạp `index.json` (1,0 KB) + từ điển của
  ngôn ngữ ĐANG CHỌN (157,1 KB với tiếng Nhật — file lớn nhất trong năm file:
  ja 157,1 · fr 147,5 · es 144,7 · en 135,3 · zh 131,6 KB) = **158,1 KB**. Bốn
  file còn lại (559,1 KB) dồn vào `requestIdleCallback`, Safari không có thì
  rơi về `setTimeout(…, 1500)`. **Nói thẳng: tổng dung lượng không giảm, chỉ đổi
  THỨ TỰ** — đường critical path ngắn hơn 554 KB, còn người học ngồi chờ đủ
  năm ngôn ngữ thì chưa bao giờ là yêu cầu.
- `sw.js` `CORE` vẫn liệt kê **đủ 35 file** nên lazy-load không phá chế độ mất
  mạng: phòng lab chưa từng mở vẫn vào được, chỉ là đọc từ Cache Storage chứ
  không từ `/`.

VÌ SAO CHUYỂN NẠP CHẬM MÀ KHÔNG VỠ APP: mọi file lab bọc IIFE
(`^(function …)()`), nên không có `const`/`let` cấp cao nhất nào lọt ra phạm vi
toàn cục — kiểm tra bằng cách quét 147 tên khai báo cột 0 trong 24 file (`js/**` +
`sw.js`): **0 trùng**. Con số đó không phải một câu tự tuyên bố: nó là khối [5/7]
của `python tools/check_i18n.py --ci`, chạy mỗi lần kiểm tra, nên một lần đặt tên
đụng độ bị bắt ngay chứ không nằm im tới lúc người dùng gặp hành vi lạ.
Hai chốt còn lại: `exam.js` cố ý nằm trong 8 thẻ vì `showView()` đọc
`Labs.exam.dangLam()` để khoá điều hướng, và mọi chỗ đọc `Labs.<lab>` đều dùng
`?.` (kiểm tra lúc chạy, không lúc khai báo). `paintAdminNav()`/`Flags.paint()` ở
`app.js` nên công tắc quản trị vẫn kịp tắt khung AI trước khi `ai.js` nạp xong.

**SOI KỸ THÊM — hai lỗi tìm ra trong chính lúc đo:**
1. `ensureReviewed()` khoá bằng **dữ liệu** (`if (reviewedFile) return`) chứ
   không khoá bằng promise, mà `reviewedFile` chỉ được gán SAU khi `res.json()`
   xong. Hai lời gọi gần như cùng lúc — `i18n.js` gọi khi chuyển ngôn ngữ,
   `guide.js` gọi trong `Promise.all` — cùng lọt qua chốt và **mỗi lời gọi tải cả
   file**: đo được 102,5 KB × 2 = **205,0 KB cho cùng một nội dung**, ngay trên
   đường mà mục 4.8 vừa hứa là tiết kiệm băng thông. Giờ `reviewedPending` giữ
   đúng promise đang chạy; đo lại: 3 lời gọi đồng thời = **1 request**, lời gọi
   sau = **0**. Thất bại thì xoá khoá để lần sau thử lại, không đóng băng tình
   trạng "không biết bản này ở tầng nào" suốt phiên.
2. **Vòng quét dashboard + cái bẫy cache.** Người dùng báo vòng radar quay quá
   nhanh HAI LẦN, và lần thứ hai là thật: bản sửa 12 s đã nằm trong file nhưng
   không hiển thị trên máy họ. Nguyên nhân không phải CSS mà là `python -m
   http.server` **không gửi `Cache-Control`**, chỉ gửi `Last-Modified` → Chrome
   tự tính độ tươi = 10% thời gian từ lần sửa file, nên một file sửa hôm trước
   bị coi là còn tươi hàng giờ; network-first mà giữ nguyên `request` thì vẫn ăn
   **bộ nhớ đệm HTTP** đó. `sw.js` nay fetch bằng `fetch(request, { cache:
   "reload" })`. Radar hiện **24 s/vòng**, bốn chấm `.blip` chạy cùng 24 s với
   `animation-delay` chia đều (0 / −6 / −12 / −18 s) để mỗi 6 giây có ĐÚNG MỘT
   chấm sáng thay vì nổ bốn cái rồi màn hình đứng im; `@keyframes blip` ramp từ
   opacity 0,22 lên 1 trong 9% đầu thay vì nhảy bật. `prefers-reduced-motion` và
   `data-motion="tat"` vẫn chặn toàn bộ — trên máy đo tự động bật sẵn reduce-motion
   nên `getComputedStyle` trả `0.001s`, vì vậy con số 24 s ở đây được xác minh
   bằng **CSS mà trình duyệt đang phục vụ** (`fetch('style.css')` rồi đọc quy tắc
   `.radar::before` / `.blip`), không bằng mắt nhìn.

### 4.9 Màn hình nhỏ: bảng dữ liệu biến thành thẻ, log không đẩy trang ngang

ĐỀ BÀI (người duyệt, nhược điểm 8): *mobile chưa tối ưu, đặc biệt bảng dữ liệu và
log.* Bốn việc, tất cả nằm trong `style.css` — không tách file CSS riêng cho điện thoại,
vì app không có build step và trần file đã kín (mục 8).

- **Luật chạm 44px** (`style.css:306-322`): `@media (max-width:860px),(pointer:coarse)` đặt
  `--touch:44px` cho nút và ô nhập; checkbox vẫn vẽ 22px nhưng vùng chạm 44px, `.switch`
  nhận một dải `::before` cao 44px, `.url-bar.clickable` và `.spot-target` — hai thứ bấm
  được mà KHÔNG phải `<button>` — cũng 44px. `button.linkbtn{min-height:0}`
  (`style.css:323-327`) là **ngoại lệ inline của WCAG 2.5.5** và có chủ đích: ép cái link
  nằm giữa câu "…bạn mở trang Cài đặt" cao 44px thì cả dòng chữ giãn thành một khoảng
  trắng vô duyên giữa paragraph.
- **Bảng xếp hạng thành thẻ** ở `≤480px` (`style.css:515-540`). Số đo cũ: bảng cần 320px
  trong khi hộp chứa chỉ 311px, bốn cột chen trong 311px nghĩa là mỗi ô rộng ~78px — tên
  học viên vỡ ba dòng, "Chuyên viên phân tích" dựng thành một cột chữ. `#lbTable` chuyển
  `display:block`, ẩn `thead`, mỗi `tr` là lưới `hang | ten | xp` rồi `cap` ở dòng hai.
  Bảng "Tài khoản trên máy này" dùng cùng lớp `.lb-table` nhưng ô cuối là **nút** (đổi
  role, xoá) — xếp thẻ sẽ làm cột lệch theo từng hàng — nên nó giữ nguyên bảng và cuộn
  ngang trong `.table-scroll`.
- **Nút ngắt dòng** ở `≤480px` (`style.css:570-593`): `#xssSafeBtn` cần 313px trong ô
  262px và `#setWipe` tràn 15px, cả trang vì thế cuộn ngang 10px → `.btn{white-space:normal}`.
  Lưới IP của lab DDoS phải dùng `minmax(0,1fr)`: sàn của `1fr` là `min-content`, mà
  "192.168.7.24" là một chuỗi liền 106px không đứt được — đo lại 2 cột 109,6px, hết tràn.
- **Log**: `.siem-line{overflow-wrap:anywhere}` (`style.css:427`) giữ một dòng
  `ts + lvl + msg` dài trong khung thay vì đẩy khung nở ra; `.siem-log` cuộn dọc ở chiều
  cao cố định, `.term-body` co còn 240px cho màn hình thấp.

**ĐO LẠI NGÀY 31-10-2026 — và đây không phải ảnh chụp.** `take_screenshot` báo surface của
browser nhúng không có viewport thật (`visibilityState = hidden`), nên phép đo chạy bằng
**iframe cùng nguồn** rộng 1280 / 768 / 360px: media query bên trong iframe khớp theo bề
ngang chính nó chứ không theo cửa sổ, vì vậy luật CSS được kiểm vẫn là luật đang chạy. Mở
lần lượt 20/20 `.view` ở khung 360 — bảy trang phải đo lại lượt hai vì lượt đầu chưa kịp
vẽ (sáu phòng lab nạp chậm và trang Quản trị, trang này còn bị chặn theo role) — kết quả:
hộp nội dung rộng nhất **313px** trên viewport **345px**, **0 phần tử** vượt biên ở mọi
trang; `#lbTable` có `display:block` (đúng chế độ thẻ);
`scrollWidth == clientWidth` ở cả ba khung nên không trang nào phải kéo ngang. Riêng trang
Tổng quan ở 360px đếm được 38 điều khiển đang hiển thị và duy nhất một `.linkbtn` dưới
44px — chính là ngoại lệ inline đã giải thích ở `style.css:323-327`, không phải sót. Ở
1280px có 23 điều khiển nhỏ hơn 44px và điều đó **đúng**, vì luật 44px chỉ bật từ 860px
hoặc `pointer:coarse`.

## 5. Khung chat AI: ảnh kèm, phóng to, độ sâu câu trả lời, chạy khi mất mạng và bản web công khai

Bốn tính năng này sinh ra từ bốn câu hỏi của người dùng: *"làm thêm phần mà nhận
được cả ảnh nữa, ở trong phần AI ý, phải nhận được ảnh và làm cho cái khung của
chat AI có thể được mở rộng to ra"*; *"làm thêm cả phần mà app vào được mà không
cần internet"*; *"làm thêm phần mà làm cho AI trả lời nhanh hết cỡ có thể, phải
giống y như gemini thật, trả lời trong chưa đầy 10 giây. Phải làm AI thông minh
hơn"*; và *"khi tôi up sản phẩm này lên netlify thì nó bị lỗi phần AI này
(cysim.netlify.app)…"*. Ba câu đầu nằm trọn trong ba file đã có (`js/ai.js`, `sw.js`,
`js/app.js`) cộng markup/style, **không thêm file nào**. Câu thứ tư thì không giữ
được như vậy: host tĩnh không chạy Python nên cần một máy chủ ở nơi khác. Ngày
29-10 thử đường "hàm serverless trên Netlify" và phải thêm hai file
(`netlify.toml`, `netlify/functions/gemini.py`), nâng trần 50 lên **52** để có chỗ;
đến 30-10 đường đó bị bỏ vì Netlify không nhận hàm Python (mục 5.5). `netlify/functions/gemini.py`
và bản cũ `_legacy/auth.legacy.js` bị xoá, `netlify.toml` **ở lại** nhưng gọn từ 78
xuống 58 dòng (mất `[functions]` + hai rewrite) và repo **về lại 50**. Bản web công khai
hôm nay lấy AI từ `server/gemini_proxy.py` chạy trên Render, khai ở `MAI_CONG_KHAI` —
không thêm file nào (mục 5.5 và mục 8).

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
  `max-height:min(920px, 92vh)`, khung log `flex-basis:280px`, vẫn **chừa sidebar
  272 px** nên không che menu. Lựa chọn được nhớ trong `cysim-ai-rong` — theo
  **máy**, không theo tài khoản, vì khổ màn hình là chuyện của cái màn hình.
  `aria-pressed` + nhãn do `veRong()` vẽ lại bằng `t()` (kèm `title`), nên đổi
  ngôn ngữ giữa lúc dùng không kẹt chữ Việt.
- **Kéo góc dưới-phải** của khung (`.ai-panel{resize:both;overflow:hidden}`) — to
  tuỳ ý, **không nhớ**: muốn xem tạm một tấm ảnh thật to thì kéo, không phải bấm.
  Dưới 860 px thì `resize:none`, vì điện thoại không có chuột để kéo; ở đó
  `.ai-wide` bám lề `left/right/bottom:8px` và cao 92 vh.
- **Hai khối đó chỉ an toàn từ 01-11-2026**: `.ai-head` (chứa nút ✕) và `.ai-form`
  (chứa nút Gửi) giờ `position:sticky`, còn `.ai-log` bỏ `min-height` cứng — trước
  đó khung càng to thì nội dung càng tràn, và `overflow:hidden` vẫn là một hộp cuộn
  nên cái ✕ bị kéo ra khỏi khung nhìn mà không có thanh cuộn nào đưa nó về. Toàn bộ
  bệnh án và số đo ở mục 5.7.

### 5.3 Mở app khi mất mạng (`sw.js` + `js/app.js`)

Bốn việc, mỗi việc vá một lỗ có thật:

1. **`CORE` liệt kê đủ 35 file runtime** — khung, style, manifest, icon, **23 file JS** (8 thẻ
   `<script>` + 15 file `app.js` nạp chậm, trong đó có **toàn bộ 15 file `js/labs/*.js`**) và **cả 7 file `js/lang/*.json`**.
   App không có bước build nên cách chắc nhất để "mất mạng vẫn mở được" là nhớ
   hết. Bản cũ chỉ liệt kê khung + `index.json`: phòng lab nào chưa từng được mở
   khi còn mạng thì mất mạng là bật ra màn hình trắng.
2. **`Promise.allSettled`, không `addAll`** — một file sai tên làm `addAll` bỏ
   trắng cả bundle, và trên màn hình không có dấu hiệu nào; ở đây file hỏng bị
   `console.warn` nêu đúng tên.
3. **Tên cache `cysim-<hash>` tự sinh từ `CORE`** (djb2 32-bit, cơ số 36): thêm hay
   bớt một file là tên cache đổi và `activate` tự xoá bản cũ — hết kiểu "nhớ sửa
   v14 → v15", một bước tồn tại chỉ để con người quên.
4. **Chữ lấy từ MÁY, không qua mạng** — từ 30-10-2026 app dùng font hệ thống
   (`--sans` / `--mono` trong `style.css`), `<head>` không còn một thẻ font nào,
   nên `MAY_CACHE` (liệt kê tường minh `fonts.googleapis.com` / `fonts.gstatic.com`)
   hiện là **hàng rào ngủ yên**: không request nào khớp, code vẫn đúng nếu ai đó
   tự host `.woff2` và khai `@font-face` sau này. **Mọi request khác origin còn
   lại bị bỏ qua tuyệt đối**: EmailJS, API dịch, tra
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
| `curl https://cysim.netlify.app/js/ai.js` | hôm đó còn nguyên mặc định trỏ `http://127.0.0.1:8000/api/gemini` (hằng khi đó tên `DEFAULT_ENDPOINT`; nay là `macDinh`, `js/ai.js:158`) | trang của khách bảo trình duyệt của khách gọi… chính máy của khách |
| `curl -o /dev/null -w %{http_code} https://cysim.netlify.app/.env` | **404** | key không nằm trên host — và đó là hành vi ĐÚNG, nhưng **đừng hiểu là do `.gitignore`**: `.env` của dự án này từng bị commit thật (`7ca1e6e`, message "chore: force update environment key") vì `git add -f` thắng `.gitignore`; 404 hôm nay là nhờ khối `force` trong `netlify.toml`, lớp chặn cuối |
| `curl https://cysim.netlify.app/.netlify/functions/gemini` | 404 | host đó không có hàm AI nào cả — và từ 30-10 không còn file hàm nào để mà tìm |

Không có "chỗ nào thiếu key" trong dự án này. Đường đi của key đúng hai chỗ:
`GEMINI_API_KEY` trong `.env` (máy này đã có, 53 ký tự, không in vào tài liệu nào)
và `load_dotenv()` trong `server/gemini_proxy.py`. Netlify không hề thiếu key —
Netlify thiếu **máy chủ**: host tĩnh chỉ phát file, không chạy Flask, không giữ
tiến trình Python, nên không có gì nghe ở cổng 8000. Trang gốc là `https` còn proxy
là `http://127.0.0.1` nên kể cả khi proxy sống, yêu cầu vẫn bị chặn vì khác scheme.

**Năm chỗ đã sửa, tất cả nằm trong `js/ai.js`:**

| chỗ | code | nội dung |
| --- | --- | --- |
| Nơi gọi mặc định | `js/ai.js:147-160` | `MAY_TINH_NAY` test `location.hostname`: máy này (`127.0.0.1` / `localhost` / `[::1]` / `file://` ⇒ hostname rỗng) → `http://127.0.0.1:8000/api/gemini` như trước; **một domain công khai → máy chủ khai ở `MAI_CONG_KHAI`** (`:157`, hiện là `https://cysim-backend.onrender.com`) và chỉ khi để trống mới về `/api/gemini` cùng nguồn. `noiGoi()` (`:202`) phân xử đường dẫn tương đối theo `location.origin` — `file://` không có origin nên mượn `MAI_CONG_KHAI`, không có thì về proxy máy này; `cysim-ai-endpoint` vẫn là ô ghi đè, thắng cả hai. |
| Trạng thái mới `remote` | `js/ai.js:705`, `:754`, `:768`, `checkServer()` ở `:799` | `#aiStatus` nói thẳng "Bản web này không kèm máy chủ AI nên khung chat không chạy được ở đây. Mọi phòng lab, bài thi và chứng chỉ vẫn dùng bình thường." và in **đúng URL đã gọi** (`noiGoi(healthUrl())`) để người deploy thấy app đang gõ cửa đường nào. Nút **Thử lại** vẫn vẽ: deploy xong bấm tại chỗ là biết, không phải tải lại cả trang. |
| Bệnh thật khi Gửi | `js/ai.js:1004`, `:1019` | Host tĩnh trả 404/501 bằng HTML (không có JSON mã lỗi) → trước đây ra "AI không trả lời được. Xem console (F12)", đuổi người dùng đi tìm lỗi của một thứ chưa từng tồn tại; giờ đi cùng mã `offline` và `loiTuCode()` chọn câu theo nơi mở trang (`:921`). |
| Đọc được câu trả lời không SSE | `js/ai.js:1004`, `:1011` | Hàm serverless (AWS Lambda / Netlify Function) bị buffer toàn bộ response, không phát `text/event-stream` được, chúng trả `{"ok":true,"text":…,"model":…}`. Bản cũ coi mọi phản hồi không phải SSE là lỗi nên **câu trả lời nằm sẵn trong tay vẫn bị báo "unknown"**; giờ nhận thẳng, và `.ai-time` in "hoàn tất Xs · `<model>`" (mục 5.4) — không bịa số "chữ đầu" cho một phản hồi chưa từng được phát dần. |
| Trạng thái mới `external` + mã `forbidden` | `js/ai.js:837`, `:921`, `:938`, `mayChuBenNgoai()` ở `:221` | Hai chỗ bản cũ nói dối mà người đọc không thể biết: (1) máy chủ ở host khác (Render/Railway/VPS) đang ngủ mà app báo "bản web này **không kèm** máy chủ AI" là nói sai — có, nó chỉ chưa trả lời; giờ `mayChuBenNgoai()` so origin của URL đã phân giải với origin của trang và vẽ `external`: chấm hổ phách (`style.css`), đúng URL health đã gọi, nút Thử lại, và câu "…máy chủ miễn phí có thể đang ngủ — bấm Thử lại và chờ một phút; nếu vẫn im thì máy chủ chưa chạy, hoặc chưa khai tên trang này vào CYSIM_ORIGINS." (2) 403 `forbidden` do chốt `CYSIM_ORIGINS` của proxy trả về trước đây rơi vào `unknown` ("xem console"); giờ nó chỉ đúng chỗ sửa — cấu hình máy chủ, không đổ lỗi người đang hỏi. `file://` vẫn được `mayChuCuaToi()` chặn lại trước, nên ba nhánh không chồng nhau. |

**Điều cố ý KHÔNG làm.** Không dán key vào `js/*.js`, `index.html`, `manifest.json`
hay `.env.example`. Host tĩnh phát **mọi** file cho **mọi** người: cùng một lệnh
`curl` ở bảng trên lấy được key trong bundle, và key trong bundle là key công khai —
kẻ quét GitHub/AI-URLs sẽ tiêu hết hạn mức, còn hóa đơn và trách nhiệm thuộc về chủ
key. Môi trường của Netlify (`Site settings → Environment variables`) cũng không
phải lối tắt cho file tĩnh: biến đó chỉ tới được code chạy **trên server** — tức
máy chủ Python của đường 2 bên dưới — chứ không rơi vào file gửi cho trình
duyệt. Đây là cùng một bài học mà `js/labs/` dạy người học,
nên app không được phép làm khác để "cho nó chạy".

**Muốn AI chạy thật trên domain công khai** thì cần một máy chủ AI. Ngày 29-10-2026
dự định làm **cả hai đường**, rồi đo và kiểm chứng lại: đường 1 (`netlify.toml` +
`netlify/functions/gemini.py`, hai file, nâng trần 50 của mục 8 lên **52**) **không
chạy được trên Netlify**, đường 2 **không thêm file nào**, chỉ đổi cách cấu hình
`server/gemini_proxy.py` và một dòng trong `js/ai.js`. Đường 2 là đường ĐANG CHẠY
và đã deploy thật: `https://cysim-backend.onrender.com`, đo 30-10-2026 `GET
/api/health` → **200 trong 0,83 s**, `keyConfigured:true`.
`MAI_CONG_KHAI` giờ chỉ còn hai trạng thái thật: **có URL** thì bản web gọi máy chủ
Python ở host khác, **trống** thì bản web không có AI nào cả (khung chat báo `remote`
một cách chính xác), vì host tĩnh không chạy giúp ai tiến trình nào.

1. **Netlify Function — ĐÃ VIẾT, host đó KHÔNG chạy, và file đã BỊ XOÁ (30-10-2026).**
   Kiểm chứng bằng tài liệu của chính Netlify, không bằng suy đoán: trang "Get started
   with functions" bản 2026 liệt kê đúng ba ngôn ngữ làm hàm — **TypeScript,
   JavaScript, Go** — còn trang "Lambda compatibility" (dạng `exports.handler` /
   `def handler(event, context)` mà file này viết theo) đã bị đánh dấu **deprecated,
   hết nhận deploy từ 1-7-2027**. Trên diễn đàn host, nhân viên Netlify trả lời một
   câu gọn cho đúng câu hỏi "vì sao file `.py` của tôi không được phát hiện":
   *"Currently, you can deploy functions built with TypeScript, JavaScript, and Go."*
   Nghĩa là `netlify/functions/gemini.py` được Netlify **bỏ qua**,
   `/.netlify/functions/gemini` trả 404, hai rewrite trong `netlify.toml` chỉ tổ 404
   theo, và khung chat vẽ đúng bệnh mà ảnh chụp hôm trước đã chụp: `remote`.
   Nói thẳng chỗ tôi từng nói sai: khi viết hai file đó tôi đã tin (và ghi vào tài
   liệu) rằng Netlify chạy hàm Python; kiểm chứng lại thì không.
   Kể cả khi đổi sang hàm JavaScript thì cũng **không** cứu được bản web này: trần
   đồng bộ của một lời gọi hàm Netlify là 60 giây và không cấu hình được, còn một câu
   trả lời của key hiện tại đo qua chính `handler()` hôm 29-10 là **202,7 giây** (HTTP
   200, 490 ký tự, model `gemini-flash-lite-latest`) — hàm sẽ chết hoặc tự cắt và báo
   `overloaded` ở mọi lượt. Thêm một file `.js` còn ăn một suất trong trần 52 file của mục 8 (và
   `require("@google/genai")` đòi thêm `package.json`). Bản "thuần `fetch`, không cần
   SDK" cũng không khá hơn: nó bắt health bằng `event.path === "/api/health"` trong khi
   hai đường dẫn được viết lại về cùng một hàm nên phân biệt duy nhất đáng tin là
   `httpMethod` (bản `.py` làm theo đúng cách đó), nó `JSON.parse(event.body)` mà bỏ
   qua `isBase64Encoded`, nó trả `{reply}` thay vì `{ok,text,model}` nên `js/ai.js`
   không đọc được, và `catch → {error: error.message}` in nguyên thông báo của Google
   xuống trình duyệt — tức là đúng cái kiểu rò key qua body mà `--check` của dự án này
   đo và khẳng định `KEY xuat hien trong body loi: False`. Kết luận: **không viết hàm
   Netlify**.
   File `.py` vì thế đã bị `git rm` ngày 30-10-2026 cùng `_legacy/auth.legacy.js`, và
   `netlify.toml` mất theo khối `[functions]` + hai rewrite. Xoá còn cắt luôn một
   **hư cấu có kiểm soát**: `--check` của proxy từng đối chiếu 18 mục giữa hai file
   bằng `ast`, nhưng đối chiếu một bản không bao giờ được deploy là nuôi hai sự thật
   cho một chức năng — bộ so sánh đó nay không còn lý do tồn tại, nên nó cũng bị xoá
   theo (74 dòng). Muốn nhìn lại bản serverless: `git checkout 0bef8a8 --
   netlify/functions/gemini.py`. Ba biến môi trường (`GEMINI_API_KEY`, tuỳ chọn
   `GEMINI_MODEL` / `CYSIM_RPM` / `CYSIM_ORIGINS`) và bài học "đừng kéo-thả cả thư mục
   lên Drop vì `.env` sẽ bị upload cùng" vẫn đúng nguyên văn — chỉ là chúng thuộc về
   **đường 2**, xem bên dưới.

2. **Render Free chạy đúng `server/gemini_proxy.py` — ĐÃ DEPLOY, ĐANG SỐNG; TỪ 03-11
   CHỈ CÒN THIẾU MỘT KEY GOOGLE CÒN SỐNG (đo lại 13-11-2026).** Đường này sinh ra vì một con số: **Netlify
   giới hạn rewrite dạng proxy ở 26 giây**, trong khi một câu trả lời của key này đo
   qua `handler` hôm 29-10 là **176,9 giây**. Để Netlify chuyển tiếp hộ `/api/gemini →
   Render` là cắt đúng 26 giây, chết giữa chừng một cách đều đặn. Nên **trình duyệt
   gọi thẳng** máy chủ Python. Đường này cũng là đường ĐANG DÙNG, vì đường 1 không chạy
   được trên Netlify (xem mục 1 ở trên). **Zero file mới** (repo khi đó vẫn 50):
   `server/requirements.txt` đã có sẵn `google-genai` + `Flask`, và proxy tự bind
   `0.0.0.0` khi thấy `PORT` của Render — không phải khai `GEMINI_PROXY_HOST` nữa.

   | # | Việc | Nơi điền | Điều phải thấy |
   | --- | --- | --- | --- |
   | 1 | Tạo Web Service từ repo GitHub | Render → New → Web Service, Root directory `/` | Runtime tự nhận Python |
   | 2 | Build command | `pip install -r server/requirements.txt` | Mặc định của Render trỏ `requirements.txt` ở gốc repo — file này nằm trong `server/`, nên phải sửa một dòng |
   | 3 | Start command | `python server/gemini_proxy.py` | Không cần gunicorn: trần thời gian của Render đủ lớn cho một lời gọi dài, còn `app.run()` là cách chạy đã đo trên máy này. Gunicorn bản default có `--timeout 30` và sẽ **giết** một lượt 176 s. |
   | 4 | Environment variables | `GEMINI_API_KEY` (key MỚI, không phải key đã lộ). **Còn lại để trống**: `PORT` Render tự cấp và code đã đọc; `GEMINI_PROXY_HOST` không cần khai vì code tự suy ra từ `PORT`; `CYSIM_ORIGINS` **để trống được**: từ 03-11-2026 code luôn cho `https://cysim.netlify.app` + loopback, biến này chỉ THÊM domain khác (dấu `/` cuối tự được cắt), còn nguồn lạ bị 403 kể cả khi biến trống | Đây là chỗ bản công khai chết hôm 30-10: `curl -X POST` kèm `Origin: https://cysim.netlify.app` trả về `{"code":"forbidden","error":"Origin không nằm trong CYSIM_ORIGINS…"}` — tức là Render **đang có** `CYSIM_ORIGINS` với một giá trị không chứa domain thật. Bản 03-11 không còn phụ thuộc vào giá trị đó: Netlify luôn nằm trong danh sách dù biến cũ còn hay đã xoá; đọc lại `access` ở bước 6 |
   | 5 | Dán URL máy chủ vào app | `js/ai.js` — `const MAI_CONG_KHAI = "https://cysim-backend.onrender.com"` (đã dán, `js/ai.js:157`) | Không có `/api/gemini` phía sau, code tự ghép; không có `/` ở cuối, code tự cắt. Commit + deploy lại Netlify. URL máy chủ không phải bí mật — key thì có, và key nằm lại phía Render |
   | 6 | Xác nhận | `curl https://cysim-backend.onrender.com/api/health` | `keyConfigured:true` + danh sách `depths` + khối `access` (`origins` đang chạy — luôn có `https://cysim.netlify.app` — và `rpm`). Đo 30-10: **200 trong 0,83 s**, `keyConfigured:true` — máy chủ sống; bản chạy khi đó **chưa có** khối `access`, nên kết luận "danh sách nguồn không chứa Netlify" là suy từ cú 403 ở bước 4, không phải đọc được từ `health` |

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
   - Origin lạ → `POST /api/gemini` trả **403 `{"code":"forbidden"}`**. Bản code hôm
     29-10 còn kèm một lỗi chồng lên: response 403 (và cả `GET /api/health`) **không
     gắn CORS**, nên trình duyệt chỉ còn thấy "không đọc được máy chủ" thay vì câu
     "máy chủ không nhận lời hỏi từ trang này". Từ 30-10 `add_cors()` gắn header cho
     mọi origin có gửi `Origin`, kể cả origin đang bị chặn — khách bị từ chối phải
     ĐỌC ĐƯỢC lý do, vì danh sách nguồn giả được bằng curl trong một dòng nên che nó
     không bảo vệ gì, chỉ gây nhầm. Kiểm chứng bằng `curl` trên máy này (proxy chạy ở
     cổng 8123): `OPTIONS` preflight → 200 **kèm** `Access-Control-Allow-Origin` +
     `Allow-Methods: POST, GET, OPTIONS` + `Max-Age: 600`; `POST` sai body kèm
     `Origin: https://ke-la.example` → 400 `bad_request` **vẫn kèm** header đó.
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
   - **Đã kiểm chứng trên Render THẬT (30-10-2026)** — không còn là giả lập:
     `GET https://cysim-backend.onrender.com/api/health` → **200 trong 0,83 s**,
     `keyConfigured:true`, `model:gemini-flash-lite-latest`, máy chủ chạy
     `Werkzeug/3.1.9 Python/3.14.8` (header `x-render-origin-server`). `POST` kèm
     `Origin: https://cysim.netlify.app` → **403 `forbidden`** (bước 4: `CYSIM_ORIGINS`
     trên dashboard đang khai một giá trị không chứa domain thật). `POST` không kèm
     `Origin` → **400 `bad_request`** — chứng cứ máy chủ và Flask sống khoẻ, bệnh nằm ở
     cấu hình chứ không ở code. `OPTIONS` preflight → 200 **không** có
     `Access-Control-Allow-Origin`, vì bản đang chạy là `cysim-backend@d4af537`, viết
     trước bản vá CORS hôm nay.
   - **Đo lại sau khi đẩy `cysim@dbb1a17` + `cysim-backend@1afe3f9` (03-11-2026)** — hai
     bệnh của 30-10 đã hết: `/api/health?probe=1` → 200 trong 1,12 s kèm khối `access`
     (`origins: ["https://cysim.netlify.app"]`, `rpm: 20`); `OPTIONS` preflight với
     `Origin` của Netlify → 200 **có** `Access-Control-Allow-Origin`; `POST` từ Netlify →
     **502 `bad_key`** sau 0,91 s (hết 403); `POST` từ `https://ke-la.example` → 403
     `forbidden` **vẫn kèm** header CORS. Thứ còn lại là key: `keyValid:false`, `keyShape:
     AQ.A…(53)`. Gọi Google bằng chính key trong `.env` máy này qua bốn đường (header
     `x-goog-api-key` ở v1beta và v1, `?key=`, Bearer) đều 401 trong 0,15–0,33 s: Google
     từ chối chính chuỗi đó, không phải cách gọi — tài liệu AI Studio 2026 ghi REST gửi
     key bằng `x-goog-api-key`, đúng như proxy, và mọi key mới tạo ở đó đều là dạng `AQ.`.
     Đo lại 13-11-2026: `.env` vẫn là bản sửa lần cuối 30-10, dấu vân tay `sha256[:7] =
     30128b7` — đúng key đã lộ trong lịch sử git — Google vẫn trả 401
     `ACCESS_TOKEN_TYPE_UNSUPPORTED` sau 0,69 s; Render ngủ dậy mất 33,8 s rồi cũng báo
     `keyValid:false`. Nếu một key VỪA TẠO cũng nhận đúng lỗi đó: diễn đàn Gemini API có
     nhiều báo cáo từ 07-2026 về tài khoản mà mọi key `AQ.` đều 401, chưa có cách sửa
     chính thức — kiểm chip có đủ `(53)` ký tự chưa, rồi thử tạo key ở một project mới.
   - **Chưa kiểm chứng:** một câu trả lời trọn vẹn đi qua Render — từ 03-11 chỉ còn
     thiếu một key Google còn sống trong Render → Environment, code và CORS đã đo xong
     ở trên — và trần thời gian request của Render: con số ~100 phút lấy từ tài liệu
     của host, chưa đo ở đây. Mọi con số của riêng dự án này (26 s / 60 s / 176,9 s /
     202,7 s / 0,83 s) là số đo thật.

Không chọn gì cũng không sao: AI là tính năng cần một máy chủ, còn 12 phòng lab,
kỳ thi tốt nghiệp, chứng chỉ, 5 thứ tiếng và chế độ ngoại tuyến (mục 5.3) vẫn chạy
nguyên trên Netlify vì chúng chỉ cần file tĩnh.

**Kiểm chứng (29-10-2026, tab tự động):**
- Loopback `http://127.0.0.1:8137` → `#aiStatus` `data-state="ready"` kèm đúng tên
  model `gemini-flash-lite-latest` (bản `fr`: "Connecté au serveur d'IA."), proxy vừa
  bật lại nên **key mới đã được nạp và `/api/health` báo `keyConfigured:true`**.
- Origin **không** loopback `http://192.168.1.4:8138` (`python -m http.server
  --bind 0.0.0.0`, không có AI — mô phỏng đúng Netlify): hôm 29-10 `MAI_CONG_KHAI` còn
  trống nên vẽ `data-state="remote"`, in kèm `http://192.168.1.4:8138/api/health`.
  **Từ 30-10, khi `MAI_CONG_KHAI` đã trỏ Render, đúng phép thử đó đổi sang `external`**
  — và đó mới là lời nói đúng: máy chủ có thật, chỉ đang ở host khác. Gửi một câu →
  bong bóng `system` nói đúng câu của trạng thái hiện thời, không phải "xem console
  (F12)". Sơn lại ở `ja` / `fr` / `es` / `zh`: cả bốn đều là bản dịch người viết,
  `js/lang/*.json` vẫn `máy 0 | thiếu 0`.
- Máy chủ JSON-not-SSE giả lập (scratch ngoài repo, đã xoá) → câu trả lời vào
  bong bóng, `.ai-time` = "hoàn tất 0,0s · `stub-serverless`".
- **Hai dòng kiểm chứng về hàm serverless đã bị BỎ vì hết thứ để kiểm chứng** (30-10):
  `python netlify/functions/gemini.py` (từng in sáu khối ĐẠT) và harness gọi `handler`
  bằng event giả lập của Netlify (từng `38/38 đạt | hỏi: không`), cùng khối `đối chiếu
  bản Netlify` 18 mục của `--check`. Ghi lại kết quả ĐẠT của những lệnh đã xoá là một
  cách tự dối; số liệu đó thuộc về 29-10 và nằm nguyên trong git history.
- **Chạy lại ngày 30-10 sau khi dọn file** (số liệu của đúng lượt chạy đó — tính trước
  khi thêm mục 6 và mục 4.6; trạng thái hiện tại ở mục 3):
  `tools/gen_translations.py --offline` rồi
  `tools/check_i18n.py --strict` → exit 0, `máy 0 | thiếu 0` cả năm thứ tiếng, 1.004
  chuỗi gốc; `test/exam.test.js` **21 đạt / 0 lỗi**; `test/i18n.test.js` **33 đạt /
  0 lỗi**; `server/gemini_proxy.py --check` **sáu khối ĐẠT** (khối `hai lớp hãm công
  khai` nay đo thêm header CORS); `node --check js/ai.js` sạch; CORS đo bằng `curl`
  trên proxy máy này (cổng 8123) đúng như khối ở mục 5.5.
- **Gọi Google thật qua đúng `handler` (29-10, số liệu của bản hàm đã xoá):** `HTTP
  200 trong 170,5 s` với 650 ký tự tiếng Việt; đặt `GEMINI_FUNCTION_DEADLINE=6` thì cắt
  đúng **6,0 s** và trả `code:"overloaded"` (trước khi chuyển sang sợi chia, cùng
  request đó ngồi chờ tới 49,9 s rồi mới về). Hai con số vẫn đáng giữ vì chúng mua một
  bài học áp dụng cho MỌI máy chủ ở đây: `urlopen(timeout=n)` chỉ giới hạn từng phép
  socket, không phải cả lời gọi — muốn có hạn giờ thật phải tự cắt bằng
  `submit(...).result(timeout=...)`.
- **Chưa kiểm chứng (tính đến 30-10):** trang `cysim.netlify.app` chạy bản code hôm
  nay. Ba việc còn nằm ở phía người dùng, theo đúng thứ tự: (1) đẩy `server/` bản đã
  sửa CORS lên `cysim-backend` để Render deploy lại; (2) xoá/đặt lại `CYSIM_ORIGINS`
  trong Render → Environment (mục 5.5 bước 4), vì không làm thì mỗi lượt hỏi vẫn là
  403; (3) commit + deploy lại Netlify để `js/ai.js` mang `MAI_CONG_KHAI` mới lên host.
  **Cập nhật 03-11:** (1) và (3) đã làm (`cysim-backend@1afe3f9`, `cysim@dbb1a17`); (2)
  không còn cần, vì code luôn nhận `https://cysim.netlify.app`. Việc duy nhất còn lại là
  một key Google còn sống (mục 5.5, đo lại 13-11).
  Service Worker không giữ bản cũ: `sw.js` đi network-first cho file của chính app, nên
  lần mở kế tiếp có mạng là lấy bản mới — và `/api/*` đã được loại khỏi cache, vì lưu
  `GET /api/health` offline là màn hình sẽ nói "sẵn sàng" về một máy chủ đã chết.

### 5.6 Nhịp 30 giây và dấu vết khi proxy đổi model

Người duyệt (nhược điểm 9): *proxy AI phụ thuộc API key và Google, nên một dòng
"sẵn sàng" chỉ hỏi lúc mở panel có thể đã sai từ lâu.* Đúng, và bệnh cụ thể là:
`#aiStatus` trước bản này chỉ được hỏi **một lần** khi mở khung chat — để panel mở
20 phút rồi quay lại thì màn hình vẫn báo "sẵn sàng" trong khi key vừa bị Google xếp
hàng từ phút thứ ba, và người dùng đổ cho "CySim AI hỏng".

- **`NHIP_KHOE_MS = 30000`** (`js/ai.js:881`) — khi panel đang mở, `batNhipKho()` hỏi
  lại `/api/health` mỗi 30 giây. Ba điều kiện tự ngắt, vì mỗi cái là một lần đốt request
  vô ích: panel đóng thì `dungNhipKho()` (`js/ai.js:1274`, trong `setOpen`), tab ẩn thì
  nhịp nhảy bỏ qua (`document.visibilityState !== "visible"`) — không hỏi về một màn hình
  không ai nhìn — và `file://` thì không có nhịp nào vì trình duyệt chặn request từ đó
  ngay từ đầu. Tab hiện lại cũng hỏi một lần qua `visibilitychange` trong `bind()`.
- **Chống chồng request**: `checkServer()` giờ chỉ là cái chốt, `thoMatMay()` mới là lần
  gọi (`js/ai.js:799-815`). Một lượt đang treo (`dangKiemTra`) thì nhịp mới chỉ đặt cờ
  `kiemTraLenKe` rồi về; khi lượt đang chạy kết thúc, đúng **một** lượt nối tiếp được
  phát. Không có chốt đó thì một `/api/health` chậm 40 giây (host free đang dậy) cộng
  nhịp 30 giây sinh ra hai, ba, bốn request xếp hàng sau nhau.
- **Log hai phía khi model thật sự đổi**: máy khách so `model` mà proxy **tự khai** ở sự
  kiện SSE chót với `serverModel` nó đọc được từ `/api/health`; lệch nhau thì
  `console.warn("[ai] proxy dùng model khác với /api/health đã báo: …")`
  (`js/ai.js:1199`). Phía proxy ghi `app.logger.warning("Đã dùng model dự phòng '%s' thay
  model yêu cầu '%s'")` (`server/gemini_proxy.py:986`) ngay khi model dự phòng trả lời,
  tách khỏi dòng `"Gemini quá tải (lỗi %s, model %s) — thử lại sau %.1f giây"` (`:972`)
  chỉ kể những lần thử lại **cùng** model. Phải có hai dòng vì một lượt đi đường dự phòng
  vẫn trả lời đúng và người dùng không thấy gì khác thường — không ghi lại thì người vận
  hành không bao giờ biết mình đã chạy bằng model rẻ suốt một buổi học.
- Điều **không** làm: không tự đổi `GEMINI_MODEL` thường trực khi thấy 503. Model dự
  phòng đo 1,6–1,8 s hôm 29-10 nhưng 18–29 s ở các lần đo trước — nó là đường **chống
  lỗi**, không phải đường tốc độ.
- Phần còn lại vẫn là phụ thuộc thật và app không tự xoá được: key nằm trong `.env`
  (hoặc Render → Environment), Google giới hạn tốc độ theo key, và không có đường nào
  từ trình duyệt để xoay key hộ ai. Việc đó nằm ở phía người dùng (mục 5.5, bước 4).

Đã kiểm trong trình duyệt (30-10-2026, `127.0.0.1:8137`): bọc `setInterval` và
`clearInterval` lại rồi bấm nút "Hỏi AI" — mở khung chat tạo đúng MỘT interval với số đo
**30000 ms**, một nhịp gọi `checkServer()` bắn đúng một `/api/health` (đếm bằng cách bọc
`fetch`), đóng khung là `clearInterval` được gọi với đúng id đó; console không có lỗi.
Máy đo tự động không bao giờ ở trạng thái `visible`, nên nhịp cũng không xin thêm request
nào ngoài ý — đúng rào (1). Phần **không** đo bằng cách bấm được: dòng `console.warn` lệch
model cần Google trả 429 thật mới kích hoạt; nó đã được đối chiếu code (`js/ai.js:1199`)
chưa từng chạy thật trên máy này, và nói vậy để người đọc không tưởng là đã thấy nó chạy.

### 5.7 Hai lỗi người dùng bấm ra ngày 01-11-2026: mất nút ✕ và dòng "sẵn sàng" giả

Người dùng gửi một ảnh chụp `127.0.0.1:5505` và hai câu: *"cái AI này nó bị lỗi không
chat được"* và *"cái cửa sổ đó quá to, khi bị to quá thì sẽ bị mất cái nút tắt, chỉ còn
cách reset web thì mới tắt đi được"*. Cả hai đều là bệnh thật, cả hai đều tìm ra nguyên
nhân trước khi sửa — và cả hai nguyên nhân đều **không** nằm chỗ người dùng đoán.

**(1) Mất nút ✕ không phải do khung "quá to".** `resize:both` bắt buộc `overflow` khác
`visible`, nên `.ai-panel` mang `overflow:hidden` — và chi tiết làm hỏng mọi thứ:
`overflow:hidden` **vẫn là một hộp cuộn**, chỉ khác ở chỗ không có thanh cuộn để kéo lại.
`setOpen(true)` gọi `$("aiInput").focus()`, trình duyệt tự cuộn hộp chứa ô nhập về phía
nó. Đo trên bản lỗi: `scrollTop` **220,8 px**, `.ai-head` bị đẩy lên **−206 px**, nút ✕
nằm ở **−76 px** — tức là ngoài khung nhìn, không có cách nào đưa nó về trừ tải lại trang.
Đúng cái cảm giác "chỉ còn cách reset web".

Sửa bằng ba việc, không bằng cách bỏ `focus()`:

- `.ai-head` thành `position:sticky; top:0; z-index:3` với `margin:-14px -14px 0` để lấp
  đúng phần padding của panel và `background` đặc để chữ cuộn lên không thấu qua;
  `.ai-form` sticky `bottom:0` cùng kiểu — ô nhập và nút Gửi cũng từng biến mất y hệt.
- `.ai-log` đổi `min-height:150px` → `flex:1 1 150px; min-height:0`. Chính cái
  `min-height` đó (một `min-height` cứng trong flex column) là lý do hộp log **không co
  được**, nên tổng nội dung luôn cao hơn panel và panel luôn có gì đó để cuộn.
  `.ai-panel.ai-wide .ai-log` vì thế dùng `flex-basis:280px`, không còn `min-height:280px`.
- Đo lại (01-11-2026, viewport 446×562, `127.0.0.1:5505`): panel 416 px, nội dung 537 px
  — tức là **vẫn tràn**, cố ý; khác biệt là ✕ giờ cách đỉnh panel **89 px**,
  `elementFromPoint` giữa nút trả đúng `aiClose`, và focus ô hỏi để `scrollTop` **0**
  (bản lỗi: 220,8). Ép thêm `height:240px` + 8 bong bóng dài + `scrollTop=99999` + focus
  — trường hợp xấu hơn mọi cái người dùng gặp — ✕ vẫn ở +89 px và bấm vào là
  `body.ai-open` biến mất. Kèm `Esc` (đã có từ trước) nên có hai đường thoát.

**(2) "Đã nối được máy chủ AI" là một lời nói dối có nguồn gốc từ `/api/health`.**
Máy chủ trả `keyConfigured:true`, và `true` đó chỉ có nghĩa "biến môi trường không rỗng".
Chuỗi đang nằm trong `.env` của máy này mở đầu bằng `AQ.` (53 ký tự) và
`generativelanguage.googleapis.com` đuổi nó bằng 401 `ACCESS_TOKEN_TYPE_UNSUPPORTED` — không
có bản vá phía code. (Bản đầu của đoạn này viết "`AQ.` là credential của Gemini CLI, hãy
lấy key `AIza…`" — **sai**, xem đoạn "Ảnh thứ ba" bên dưới.) Kiểm cả máy công khai: `POST https://cysim-backend.onrender.com/api/gemini`
trả `{"ok":false,"code":"bad_key"}` sau **1,8 s** — key trên Render cũng chết. Nghĩa là
"AI không chat được" **không** phải lỗi của app, và app đã báo sai bệnh suốt nhiều ngày.

Sửa thành ba tầng, theo đúng nguyên tắc "thấy bệnh trước khi gõ":

- **Proxy hỏi thật**: `kiem_key_google()` (`server/gemini_proxy.py:703`) gọi một cú
  `models.list()` (không sinh chữ, chỉ kiểm auth) và trả **ba** kết luận — `True` /
  `False` (401, 403) / `None` (mạng đứt, chậm quá 4 s) — cache 5 phút trong `_KHOA_KIEM`.
  Phải có `None`, vì nói "key hỏng" khi đang mất mạng là đổ lỗi cho người đang đọc nó.
  `PHẢI` gán client vào biến (`client_kiem = genai.Client(...)` rồi `.models.list()`): bản
  viết một dòng `genai.Client(...).models.list()` đo hôm 01-11 trả *"Cannot send a request,
  as the client has been closed"* — bộ gom rác đóng kênh HTTP của object không có tên nào giữ.
- `/api/health` thêm `keyValid`, `keyValidDetail`, `keyValidAge`, và cờ **`?probe=1`** để
  buộc hỏi lại chứ không ăn kết quả cache — đó chính là đường nút **Thử lại** đi
  (`checkServer(true)`), nên dán key mới vào `.env` rồi bấm một cái là biết ngay.
  `nap_lai_env_neu_da_sua()` so mtime của `.env` và `load_dotenv(override=True)` khi file
  thật sự đổi, kèm reset client — điều bản cũ không làm (nó chỉ đọc lại khi môi trường còn
  **trống** key), và là lý do README từng phải nói "sửa một key đã nạp thì vẫn phải bật lại".
- **UI nói đúng bệnh**: state mới `bad_key` — chữ hổ phách như `no_net`/`external` (bệnh
  của cấu hình, không phải của mạng), `<code>.env</code>` trỏ thẳng vào nơi phải sửa, có
  nút Thử lại. Chuỗi hiển thị **dùng lại** câu `"GEMINI_API_KEY không hợp lệ hoặc chưa được
  bật cho mô hình này."` đã có sẵn bản dịch ở cả năm thứ tiếng, nên không sinh khoá dịch
  mới — mà key Gemini đã chết thì `gen_translations.py` cũng không dịch được, và bất biến
  `máy 0 | thiếu 0` sẽ vỡ đúng lúc không ai sửa nổi.
- Console của `chay-ai.bat` in **hình dạng key** ngay lúc bật (`_dang_key()`): `AQ.…` =
  định dạng hiện nay của AI Studio, `AIza…` = định dạng cũ; khi Google từ chối thì in thêm
  câu của `_vi_sao_bi_tu_choi()` — việc phải làm, không phải một mã lỗi. Máy chủ chỉ kết luận bằng Google thật khi chạy ở máy mình;
  trên PaaS (có `PORT`) bước khởi động **không** gọi mạng, vì chưa bind port mà đã đi hỏi
  Google là đúng cái bẫy "dịch vụ chết ngay ở bước health check" mà khối HOST/PORT cảnh báo.

**Nói thẳng phần code này không làm được:** không có cách nào từ JavaScript hay Python làm
Google chấp nhận một key đã bị thu hồi. Người dùng phải tạo key **mới** — AI Studio →
*Get API key* → *Create API key* — dán vào `.env` thay chuỗi cũ, bấm **Thử lại** trong
khung chat. Chờ tối đa ~2 s, dòng trạng thái chuyển xanh là chat được; bao nhiêu lần
"Thử lại" đều vô nghĩa nếu `.env` vẫn là chuỗi cũ (chip `.env: AQ.A…(53)` không đổi
không chứng minh được gì — hai key khác nhau có thể cùng hình dạng — nhưng `keyValid`
đổi thành `true` thì có).

**Ảnh thứ hai cùng ngày — "api hợp lệ mà".** Người dùng phản đối kết luận trên và gửi ảnh
dòng lỗi trong khung chat. Câu trả lời không được phép là một lời khẳng định, nên máy chủ
bắt đầu **in bằng chứng ngay cạnh câu lỗi**: `_hinh_key()` (`server/gemini_proxy.py`) rút
chuỗi trong `.env` thành dạng `AQ.A…(53)` — bốn ký tự đầu và độ dài, đủ để phân loại mà
không lộ credential — `/api/health` trả nó trong `keyShape`, và `renderStatus()` của
`bad_key` vẽ `<code>.env: AQ.A…(53)</code>` thay vì `<code>.env</code>` trần. Không cần
thêm chuỗi dịch mới (chỉ đổi nội dung một `<code>`), nên bất biến `máy 0 | thiếu 0` vẫn
nguyên. Phần gọi là "hợp lệ" ở phía người dùng là đúng — key trong AI Studio của họ có thể
vẫn sống — nhưng **chuỗi mà app này đang đọc** thì không đổi kể từ 30-10: gọi thẳng
`generativelanguage.googleapis.com/v1beta/models` với chuỗi đó trả
`401 UNAUTHENTICATED / ACCESS_TOKEN_TYPE_UNSUPPORTED — "API key not valid"`, và proxy
kết luận `bad_key` sau 0,65 s. Key đúng chưa nằm đúng chỗ, đó là toàn bộ bệnh.

**Ảnh thứ ba — "AI vẫn lỗi" (03-11-2026), và một lời tự sửa.** Hai lần trước tài liệu này
(và lời nhắn của máy chủ) bảo `AQ.…` là *credential của Gemini CLI* và khuyên đi lấy key
`AIza…`. Câu đó **sai**: AI Studio hiện cấp key dạng `AQ.…` (gắn tài khoản dịch vụ, gửi
qua header `x-goog-api-key` — đúng đường `google-genai` 2.33 đang gọi), còn `AIza…` là dạng
cũ đang bị thay dần. Người dùng nói "api hợp lệ mà" là đúng **về định dạng**. Cái được đo
lại, không đoán: với chuỗi trong `.env` (sha256 rút gọn `30128b7`, không đổi từ 30-10
05:17), Google trả 401 ở **mọi** đường — header, `?key=`, `v1`, `v1beta`, cả `models.list`
không sinh chữ — trong 0,15 s, trong khi một key `AQ.` còn sống trả 200 ở đúng lệnh đó.
Và đúng chuỗi ấy nằm trong commit `7ca1e6e` ("force update environment key", 30-10 05:18,
một phút sau khi `.env` được ghi) trên nhánh `main` của repo **công khai**. Google mô tả
loại key này có cơ chế chặn nhanh key bị phát hiện lộ. Kết luận chắc chắn được: chính
chuỗi này đã chết (bị xoá ở AI Studio, bị thu hồi, hoặc bị chặn vì lộ); không phân biệt
được ba khả năng đó từ phía ngoài, và cũng không cần — cách chữa giống nhau: **tạo key
mới, chỉ dán vào `.env` (và Environment của Render), không bao giờ `git add -f .env`.**
Lời nhắn `keyValidDetail` / console giờ nói đúng câu đó (`_vi_sao_bi_tu_choi()`).

Hai defect nhìn thấy trong cùng bức ảnh cũng được sửa:

- **Chip `.env: …` bị nén đứng dọc** (".e/n/v" một ký tự một dòng). `display:flex` không
  xuống dòng và `overflow-wrap:anywhere` thì chia chữ ở mọi ký tự, nên một mục dài trong
  hàng flex bị ép tới đúng chiều rộng một cái chip: đo 20×56 px ở panel 300 px. Sửa thành
  `.ai-status{flex-wrap:wrap; align-items:center}` và `.ai-status code{flex:none;
  max-width:100%; overflow-wrap:anywhere}` — chip không còn bị co, hàng tự xuống dòng. Đo
  lại: 106×16 px ở khổ thường và ở 300 px.
- **`focus()` vẫn cuộn panel.** Sticky đã giữ ✕, nhưng cơ chế gốc thì còn nguyên: panel là
  một hộp cuộn `overflow:hidden`, nên mỗi lần focus ô hỏi là một lần cuộn. Ba chỗ gọi
  `$("aiInput").focus()` (`daoRong`, `clearHistory`, `setOpen`) nay đi qua một helper
  `vaoO()` dùng `focus({preventScroll:true})`; sticky ở lại làm lưới an toàn cho trình
  duyệt cũ. Đo: ép `scrollTop=99999` với 10 bong bóng 600 ký tự rồi mở panel → `0`, ✕ ở
  `top:37px`, hit-test trúng.

**Nếu vẫn thấy chữ đè nhau thì là bundle cũ, không phải bản sửa chưa ăn.** `sw.js` là
network-first + fallback cache và trang phục vụ từ `file://` hoặc Live Server chết vẫn chạy
JS/CSS đã cache. Kiểm chứng một bản sửa bằng Ctrl+Shift+R (hoặc tắt cache trong DevTools)
trước khi kết luận "sửa không ăn" — đây là cách hiểu lầm "sản phẩm vẫn lỗi" sinh ra.

Kiểm tra cuối vòng: `--ci` **sáu khối ĐẠT** (i18n `máy 0 | thiếu 0` cho 5 thứ tiếng trên
1197 chuỗi · `node --check` 26 file · 21+64+73 ca test JS · proxy `--check` · 0 tên trùng ·
232/232 id khớp và 0 chỗ `innerHTML`), repo vẫn **52/52** file.

## 6. Cài đặt · Quản trị · chế độ khách — phần dành cho người chưa biết gì

Ba thứ được thêm vào để trả lời một phàn nàn rất cụ thể: *app này hay, nhưng người
thường không biết bắt đầu từ đâu, chỉnh gì cũng không được, và đăng nhập chỉ cho
vui.* Toàn bộ nằm trong **file đã có** (`app.js` + `auth.js` + `index.html` +
`style.css`), không thêm file nào — riêng ô tìm kiếm (mục 4.6) mới dùng tới một suất
trong trần 52 file của mục 8.

### 6.1 Đổi giao diện — `Settings` + khối `ĐỔI GIAO DIỆN` trong `style.css`

Bốn núm vặn, tất cả là **chữ của máy chứ không của tài khoản** (như hệ điều hành):

| núm | giá trị | ghi lên `<html>` | ảnh hưởng |
| --- | --- | --- | --- |
| Màu màn hình | `dem` \| `sang` | `data-theme` | `:root` đổi cả bảng biến; nền sáng còn tắt lớp nhiễu `body::after` và giảm `body::before` |
| Cỡ chữ | `vua` \| `lon` \| `rong` | `data-fs` | 15px → 17px → 19px cho `p` / `li` / `.muted` trong màn hình |
| Đọc dễ hơn | `thuong` \| `cao` | `data-contrast` | `--mute`/`--text2` bị kéo về màu chữ chính, viền card lên 2px |
| Hiệu ứng | `bat` \| `tat` | `data-motion` | `tat` chặn mọi `animation`/`transition` bằng một quy tắc `*` |

Cơ chế chỉ có ba bước, và đó là lý do nó đáng tin hơn một "theme engine":

1. `Settings.save(patch)` ghi `cysim-settings` (JSON) rồi gọi `apply()`;
2. `apply()` ghi bốn `data-*` lên `document.documentElement` và đổi luôn
   `meta[name=theme-color]` để thanh địa chỉ trên điện thoại không còn một mảng
   đen giữa màn hình trắng;
3. CSS chọn bằng `html[data-theme="sang"]{…}` — **không có class nào bị đụng vào,
   không có `innerHTML` nào bị viết lại.**

Hai chi phí phải trả, ghi lại vì cả hai từng làm sai:

- **`Settings` là cấp máy, không cấp tài khoản**, và điều đó bị kiến trúc ép:
  `app.js` nạp **trước** `auth.js`, nên tại dòng `Settings.apply()` thì
  `Auth.id()` chưa tồn tại. Muốn đổi theo tài khoản thì phải hoặc chịu màn hình
  nháy tối→sáng, hoặc phá thứ tự nạp của 8 thẻ `<script>`.
- **Bề mặt trong mờ phải đảo theo theme.** `rgba(13,20,36,.9)` viết tay thì nền
  sáng vẫn còn những mảng tối nằm giữa (khung chat, toast, biển mất mạng). Vì vậy
  ba biến `--panelTone` / `--sunkTone` / `--fillTone` được khai bằng **bộ ba số
  RGB không có hàm**, và mọi chỗ trong mờ viết `rgba(var(--panelTone),.9)` — đổi
  theme là đổi cả độ tối của lớp phủ. 72 mã màu hardcode đã bị thay bằng biến ngày
  30-10-2026.
- **Chống nháy màu lúc tải** (`index.html`, `<head>`): một thẻ `<script>` nội tuyến
  duy nhất đọc `cysim-settings` và ghi `data-*` **trước lần vẽ đầu tiên**. Nó chỉ
  nhận giá trị có trong bảng cho phép cứng (`{theme:{dem,sang}, fs:{vua,lon,rong},
  …}`), bọc `try/catch`, nên đây không phải một kênh để dữ liệu trong
  localStorage bơm chữ tuỳ ý vào DOM.

### 6.2 Dữ liệu của người dùng — trang Cài đặt làm đăng nhập thành *có ích*

Bốn nút, và mỗi nút đều có một dòng chữ nói trước hệ quả:

- **Tải một bản sao dữ liệu** (`xuatDuLieu`) → `cysim-<email>.json` gồm
  `app`/`exportedAt`/`account`/`data`, chỉ chứa khoá có hậu tố `:<id>` đang đăng
  nhập. `URL.revokeObjectURL(url)` sau 4 s — giữ URL là giữ cả bản sao dữ liệu của
  người dùng nằm lại trong bộ nhớ.
- **Nạp lại từ file** (`napDuLieu`) → `JSON.parse` trong `try/catch`; **lọc**
  `k.startsWith("cysim-") && k.endsWith(":" + Auth.id())`. Hai điều kiện này là lý
  do một file của người khác — hay file do ai đó tự viết — không có đường ghi đè
  `cysim-users` / `cysim-session` / khoá của tài khoản khác. Không mục nào hợp lệ
  thì báo đúng câu đó chứ không im lặng nạp 0 mục.
- **Xoá toàn bộ dữ liệu của tài khoản này** (`xoaDuLieu`) → chỉ xoá hậu tố của
  mình, và **phải bấm hai lần**: label đổi thành "Bấm lần nữa để xác nhận xoá" rồi
  mới chạy. `confirm()` bị nhiều tiện ích chặn, còn người dùng thì bấm Enter theo
  phản xạ.
- **Dòng đếm thật** (`DATA_INFO_TEXT()`) — "Tài khoản x đang có N mục dữ liệu trên
  máy này (M hội thoại AI)." N và M do `taiKhoanKeys()` đếm từ `localStorage` thật,
  không phải chữ trang trí. Đây cũng là nơi dùng **khuôn ghép chuỗi mới** của mục
  6.5: số nằm ngoài `t()`, từng mảnh là một key tĩnh.

Vì sao đây là câu trả lời cho "đăng nhập để làm gì": tiến độ (`cysim-done:<id>`),
điểm thi (`cysim-exam:<id>` / `cysim-exam-thu:<id>`), hạn mức AI
(`cysim-ai-use:<id>`), hồ sơ (`cysim-ai-profile:<id>`), lịch sử chat
(`cysim-ai:<id>`) — **tất cả đều có hậu tố email** (`API._key()`), nên đăng nhập
là thứ duy nhất gom được chúng lại; đồng thời trang Cài đặt in cho người dùng thấy
đúng những gì đang nằm dưới tên mình và cách mang nó sang máy khác.

### 6.3 Trang Quản trị — công tắc thật, không phải nút biết sáng

`#admin` chỉ mở được khi `Auth.isAdmin()`, và `showView()` (mục 2, `app.js`) chặn
ở điểm vào duy nhất — F5 đúng view hay một nút `[data-goto]` cũng đi qua cổng đó,
nên ẩn nút thôi không đủ.

- `TINH_NANG` là **danh sách duy nhất** của các công tắc (`ai`, `leaderboard`,
  `exam`, `monitor`, `theory`, `guide`). `paintFlagsList()` sinh checkbox từ đúng
  object đó, nên thêm một tính năng vào `TINH_NANG` là nó tự xuất hiện ở trang
  Quản trị — không có cảnh "sửa hai chỗ rồi quên một chỗ".
- `VIEW_FLAG` nối view ↔ công tắc. **`settings` và `account` cố ý không nằm dưới
  công tắc nào**: tắt hai trang đó thì người dùng không còn đường nào để bật lại.
- `Flags.paint()` ẩn nút sidebar + `#aiFab` và phát `cysim:flags`; `showView()`
  chặn; `js/ai.js` từ chối gửi. Ba chỗ đọc cùng một kho `cysim-flags`, `read()` coi
  khoá thiếu = **bật** (mặc định mở, và không phá dữ liệu cũ).
- `AiBudget` — ô "Số lượt hỏi tối đa một ngày cho mỗi tài khoản (0 = không giới
  hạn)". Trần là **của máy** (`cysim-ai-limit`), số đã dùng là **của tài khoản**
  (`cysim-ai-use:<id>`) — hai học viên ngồi cùng máy không đốt hạn mức của nhau.
  `homNay()` dùng `getFullYear()/getMonth()/getDate()` của đồng hồ máy, **không**
  `toISOString()`: UTC sẽ cắt một buổi học ở Việt Nam thành hai "ngày" và đếm thiếu
  một nửa. `them()` chỉ chạy khi máy chủ thực sự trả lời, nên proxy chết không đốt
  lượt. Mặc định là 0 = không giới hạn, vì app học mà âm thầm chặn câu thứ 21 thì
  người dùng tưởng app hỏng chứ không nghĩ tới hạn mức.
- **Đổi vai trò**: `Auth.allUsers()` (đã cắt `salt`/`hash`) vẽ bảng tên/email/vai
  trò/số lab đã hoàn thành, mỗi dòng có một nút thăng — hạ. `setRole()` từ chối
  `nous`, `self` và `last-admin` — trong đó `last-admin` chỉ xét khi người bị hạ
  **đang là** admin, nên một học viên được đặt lại đúng vai trò học viên không bị
  từ chối oan; `syncSessionRole()` cập nhật cả phiên đang mở, nếu không
  người vừa được đặt làm quản trị vẫn ngồi ở cửa trang Quản trị tới khi đăng xuất.
- **Vẽ lại mà không giữ focus thì bàn phím bị đá về đầu trang.** `paintFlagsList()`
  và `paintAdminUsers()` đổi `replaceChildren()` sau mỗi nhịp bấm (đó là cách duy
  nhất để nhãn checkbox và bảng người dùng đổi theo ngôn ngữ đang chọn), nên cả hai
  phải nhớ chỉ mục hàng đang focus và focus lại ô vừa tạo. Không có bốn dòng đó thì
  người dùng Tab tới một công tắc, bấm Space, và rơi về `<body>` — phải Tab lại toàn
  bộ sidebar để tới công tắc kế tiếp. Lỗi này **không đọc ra trong code**, nó xuất hiện
  khi bấm thật trong trình duyệt.
- **Lên quản trị**: `claimAdmin(code)` — không có mã chuẩn trong source. Lần khai
  đầu **đặt luôn** mã (độ dài tối thiểu 8), về sau phải khớp bản băm
  PBKDF2-SHA256/150 000 vòng trong `cysim-admin-code` (chỉ `{salt, iterations,
  hash, setAt}`), so bằng `CyUtil.constantEqual`. Khách bị từ chối `guest` ngay từ
  đầu: không có email thật thì không có chỗ nào để ghi role.

**Đoạn thành thật trên đỉnh trang** (`.auth-notice demo`, chữ **tĩnh** trong HTML):
*"Một app chạy hoàn toàn trong trình duyệt không thể giữ bí mật với chính người
ngồi trước màn hình: mở DevTools là xem và sửa được tất cả. Đây là công cụ để một
người lớn trông một lớp trên chung một máy, không phải cơ chế phân quyền thật."*
Viết nó bằng HTML chứ không bằng `t()` vì một text node trọn câu dịch được nguyên
vẹn, còn một câu do JS ghép từ bốn mảnh thì từ điển chứa mảnh còn lúc chạy lại hỏi
cả câu (đây chính là nguyên nhân của hai cảnh báo `[4e]` đã bị xoá).

**Đã đo thật trong trình duyệt ngày 30-10-2026** (mở `http://127.0.0.1:8137`, F12 →
chạy lệnh, đọc kết quả — không có ảnh chụp màn hình vì mặt nạ trình duyệt nhúng trong
ứng dụng ở chế độ ẩn nên `take_screenshot` báo `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`;
mọi kết luận dưới đây là số đọc từ DOM và computed style):

| thứ đã bấm | số đọc được |
|---|---|
| Tắt `ai` rồi mở trang Quản trị lại | `#aiFab[hidden]=true`, bật lại thành `false`; `cysim-flags` đổi đúng một khoá |
| Tắt `leaderboard` / `exam` / `monitor` / `theory` / `guide` | nút sidebar `hidden=true` + `display:none`; `showView("<view>")` bị chặn, view đang mở **không đổi**, toast "Tính năng này đang bị tắt. Mở trang Quản trị để bật lại." |
| `AiBudget.setLimit(2)` + `them()` ×2 | `conLai()=0`, `choPhep()=false`; bấm **Gửi** thật → `#aiLog` không thêm dòng nào, ô nhập **giữ nguyên chữ đang gõ**, toast "…đã dùng hết số lượt hỏi AI hôm nay…" |
| Giới hạn 0 | dòng trạng thái nói thẳng "chưa đặt giới hạn nên không lượt nào bị chặn" (không giả vờ còn ∞ lượt) |
| `Auth.setRole()` 5 ca | `promote→ok`, `demote→ok`, `learner→learner→ok` (sau khi siết điều kiện), `self→{ok:false,reason:"self"}`, admin cuối cùng bị hạ →`last-admin`, email lạ →`nous` |
| Bấm nút "Đặt làm quản trị" trong bảng | bảng vẽ lại, **focus nằm lại đúng nút vừa bấm** và nhãn đổi thành "Hạ xuống học viên" |
| `napDuLieu()` 3 loại file | rác tekst → "File không đọc được…"; file của `nguoi.khac@example.com` (kèm cả khoá `cysim-users` và `cysim-session` giả) → "File này không chứa dữ liệu của tài khoản đang đăng nhập." và **không ghi gì**; file của chính mình → nạp đúng 2 khoá `cysim-*:<email>`, `cysim-users`/`cysim-admin-code` còn nguyên, khoá `khong-phai-cysim:<email>` bị bỏ |
| `#setWipe` | một bấm → nhãn đổi "Bấm lần nữa để xác nhận xoá", **không xoá**; bấm thứ hai → chỉ mất các khoá `:<email>`, tài khoản + mã quản trị + công tắc + cài đặt còn lại |
| Switch sang tiếng Pháp | sáu nhãn công tắc, bảng người dùng, dòng hạn mức, dòng "Tài khoản của bạn", thẻ "Commencer ici — trois étapes" đều là chữ Pháp; `t("Quản trị")` → "Admin" |

**Giới hạn thật của cách ghép mảnh đã được đóng bằng `tdem()` (mục 4.7)**: mảnh câu kiểu
`#setDataInfo` từng in "1 entrées de données" ở tiếng Pháp và "2 suspicious file" ở tiếng
Anh, vì từ điển chỉ giữ một dạng ngữ pháp. Không đổi khuôn "mảnh câu" — con số vẫn ghép
bên ngoài `t()` — mà thêm một hàm `tdem(n, chuỗi)` đọc bảng `DANG_DEM` chỉ chứa **dạng mà
từ điển thiếu**, nên `[4e]` vẫn kiểm chứng y như cũ và không có nguồn sự thật thứ hai cho
cùng một chuỗi. Hai ca đó hiện là chốt tự động trong `test/i18n.test.js` `[11]`, không còn
là một ghi chú "chưa hoàn chỉnh".

### 6.4 Chế độ khách — `startGuest()` và `taiDuLieuKhach()`

Nút **"Khám phá không cần tài khoản"** trên cả form đăng nhập lẫn đăng ký. Phiên
khách nằm trong **`sessionStorage`** (đóng tab là hết, `exp` 8 giờ cho một buổi học
không bị cắt giữa chừng), `email = "guest"`, `role = "guest"`. Vì mọi ghi đều đi
qua `API._key()` nên khách tự động nằm dưới hậu tố `:guest` mà không file lab nào
phải biết gì thêm.

`taiDuLieuKhach()` chạy ở `boot.js` và mỗi lần phát `cysim:session`: **dời** (không
sao chép) mọi `cysim-*:guest` sang `cysim-*:<email>`. Ba ràng buộc đáng giá đủ để
viết ra:

- Chỉ khoá có hậu tố `:guest` mới bị đụng tới.
- Khoá đã có giá trị ở tài khoản đích thì **không bị ghi đè** — trừ `cysim-done`,
  là tiến độ, mất một bên là mất công học thật: hai mảng được **hợp nhất qua `Set`**.
- Dữ liệu đích hỏng JSON thì `continue`, bỏ một khoá chứ không tự ý ghi đè.

Toast báo số mục vừa chuyển trễ 1,2 giây, vì `finish()` trong `auth.js` vừa
`showToast("Đăng nhập thành công")` ngay trước đó và màn hình chỉ có **một** chỗ
toast: tin "công học của bạn đã về đây" không được để tin vặt đè mất.

**Chế độ khách là chỗ duy nhất một *giá trị dữ liệu* từng là chữ đã dịch.** Bản
hôm trước ghi `name: tr("Khách")` vào phiên lúc bấm nút — tức là đóng băng ngôn ngữ
của đúng khoảnh khắc ấy. Đo trong trình duyệt ngày 30-10-2026: vào khách khi đang
tiếng Pháp, đổi sang tiếng Việt, thì dock góc phải và bảng xếp hạng **vẫn in
"Invité"** trên một màn hình toàn chữ Việt. Bây giờ phiên khách lưu `name: ""`
(trung tính về ngôn ngữ; đã soát cả `js/` — không còn chỗ nào ghi kết quả của
`t()`/`tr()` xuống bộ nhớ), `displayName()` dịch tại chỗ hiển thị, và
`paintUserBox()` nghe `cysim:language` để đổi theo ngay. Kiểm chứng lại bằng cách
bắt tay vào làm: khách mới → `{"email":"guest","name":"",...}`, dock "Khách"/avatar
"K", đổi Pháp → "Invité"/"I" **không cần tải lại**, đổi về Việt → "Khách"/"K".

### 6.5 Lời dẫn cho người mới — và hai quy tắc kỹ thuật mà nó buộc phải có

- **Thẻ "Bắt đầu ở đây — ba bước"** trên dashboard (`.batdau`): ba `<li>` chữ thường,
  **không icon**, số bước do `::marker` sơn cyan + font mono đậm (15px — cùng cỡ chữ
  body, không to hơn như mô tả ban đầu từng viết); **bước 3 chỉ nói bằng chữ** ("Gặp
  chữ gì lạ? Gõ câu hỏi vào khung Trợ lý AI ở góc dưới trái…") chứ không có nút, vì
  khung chat luôn thường trực ở góc màn hình. Nút `.linkbtn` duy nhất của thẻ nằm ở
  **dòng cuối** `.mute` và `data-goto="settings"` — "Đọc chữ nhỏ thấy mệt? Chọn nền
  sáng và cỡ chữ to ở trang **Cài đặt** — không mất bài học nào cả."
- **Màn hình khoá** in `.auth-why` dưới mỗi form, nói đúng dữ liệu nào gắn theo tên
  đăng nhập thay vì hứa chung.
- **Hai quy tắc rút ra ngay trong lúc làm**, vì cả hai từng sinh lỗi thật:
  1. **Không bao giờ ghép chuỗi rồi mới `t()`** — key lúc chạy chứa số thì không
     bao giờ khớp từ điển. Viết `t("Đã nạp") + " " + n + " " + t("mục. …")`: mỗi
     mảnh là một key tĩnh, số do code chèn vào. Chọn bộ mảnh sao cho **cả năm thứ
     tiếng đều vẫn đúng ngữ pháp** (động từ/nhãn ở mảnh đầu, đơn vị/thời hạn ở mảnh
     cuối).
  2. **Phần tử inline (`<b>`, `<code>`, `button.linkbtn`) phải nằm CUỐI vế**, không
     chặn giữa câu — một element nằm giữa sẽ cắt text node thành hai mảnh vô nghĩa
     và engine dịch chỉ còn cách dịch từng nửa.

### 6.6 Ba câu nói thẳng đặt **giữa** form, không phải trên banner

Người duyệt (nhược điểm 3 và 4): *toàn bộ phụ thuộc localStorage; bảo mật tài khoản chỉ
mô phỏng.* Cả hai đúng về phần lớn, và app **đã** nói điều đó — nhưng chỉ nói ở
`#authModeNotice`, một banner nằm **phía trên**, trong khi người ta nhìn xuống ô mật khẩu
chứ không đọc tiêu đề. Bản này vì vậy đặt ba câu `.auth-note` (`style.css:666`, viền hổ
phách cùng họ màu với `.auth-notice.demo`) ngay tại chỗ gõ:

1. **Dưới ô mật khẩu đăng nhập** — mật khẩu *chỉ mở giao diện*, nó không mã hoá dữ liệu:
   tiến độ và lịch sử chat nằm trong trình duyệt dưới dạng đọc được. Đây là sự thật kỹ
   thuật chứ không phải câu khiêm tốn: `API._key()` của `app.js` ghép `"<lab>:<email>"`
   rồi ghi JSON thẳng xuống `localStorage`, PBKDF2 chỉ bảo vệ đúng bản thân mật khẩu,
   không có key nào bọc dữ liệu.
2. **Dưới checkbox "Ghi nhớ đăng nhập"** — tích vào nghĩa là ai mở trình duyệt này trong
   30 ngày tới vào thẳng tài khoản của bạn. CODE: `js/auth.js:129` ghi nguyên session vào
   `localStorage` (`REMEMBER_KEY`) thay vì `sessionStorage`, nên đóng tab không xoá gì;
   `readSession(localStorage, REMEMBER_KEY)` ở `:118` là cửa sau đó. Trên máy dùng chung
   thì đây là lựa chọn sai, và người dùng phải biết mình đang chọn gì.
3. **Dưới "Nhập lại mật khẩu" ở form đăng ký** — **không có cách lấy lại mật khẩu**: không
   có máy chủ thì không có email đặt lại, quên là phải tạo tài khoản khác, và bản sao dữ
   liệu ở trang Cài đặt là thứ duy nhất mang theo được. (Đã kiểm: `js/auth.js` không có
   bất kỳ đường nào kiểu `forgot` / `reset` — nói "không có" là nói từ code, không phải
   từ cảm giác.)

Phần **không** phải đồ mô phỏng, ghi lại để người đọc đừng tin cả câu phàn nàn lẫn câu
khen: mật khẩu đi qua `CyUtil.pbkdf2Hex(pass, salt, 150000)` với muối ngẫu nhiên 16 byte
per-user, so sánh bằng `CyUtil.constantEqual`, sai 5 lần khoá 30 giây, và email chưa đăng
ký vẫn đi qua đúng một lần băm nhờ `DUMMY_SALT`/`DUMMY_HASH` để thời gian trả lời không tố
tài khoản. Cái "mô phỏng" là **không có máy chủ đứng sau**: "đăng nhập đúng" ở đây chỉ có
nghĩa "trùng với bản băm nằm trong chính trình duyệt này".

Ba chuỗi mới = ba key mới trong `tools/translation_review.json` (1045 → **1048 chuỗi**)
kèm bản dịch cho đủ năm thứ tiếng, rồi `python tools/gen_translations.py --offline`:
**1135 chuỗi gốc** (số liệu hiện tại: **1197** — xem `js/lang/` ở mục 2), `máy 0 | thiếu 0`
cả năm cột, `check_i18n.py --strict` exit 0,
`key chết 0`. Quy trình đó là lý do mục 3 tồn tại — sửa chữ trong UI mà không thêm key là
tự đẩy chuỗi đó vào hàng đợi dịch máy.

Đã kiểm bằng mắt ở 1280 px: cả ba `.auth-note` render đúng chỗ (362 × 70 / 70 / 88 px,
viền trái hổ phách `rgb(138, 82, 0)`), không cắt chữ. Một lưu ý đo: khi máy đã có phiên thì
`body.auth-locked` không bật nên toàn bộ lớp phủ `display: none` — phải tạm thêm lớp đó để
đo, rồi trả lại nguyên trạng. Đổi ngôn ngữ bằng `applyLanguage("fr")`: **cả ba** câu hiện bản
dịch Pháp đã duyệt, không câu nào rơi lại tiếng Việt; đổi về `vi` trở lại nguyên văn.

## 7. Thêm một phòng lab mới (6 bước, không thêm file nào khác)

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

## 8. Ràng buộc của dự án

- **Trần 52 file, hiện 52 — đã đầy** (49 file được git theo dõi + `.env` không theo
  dõi, machine-local + `js/search.js` và `test/labs.test.js` vừa thêm, chưa `git add`). Trần gốc là 50 và từng
  bị nâng lên 52 ngày 29-10-2026 để
  lấy máy chủ AI trên Netlify (`netlify.toml` + `netlify/functions/gemini.py`); vì
  Netlify không chạy hàm Python (mục 5.5) và file hàm đó không bao giờ deploy được,
  bạn Đức đồng ý ngày 30-10-2026 là **xoá** nó cùng `_legacy/auth.legacy.js`, và
  `netlify.toml` gọn theo (bỏ `[functions]` + hai rewrite + khối `/_legacy/*`). Repo
  về lại **50** — `netlify.toml` vẫn ở lại vì `publish = "."` và ba khối chặn vẫn đang
  làm việc thật. Ngày 30-10-2026 bạn Đức chọn **giữ trần 52** (thay vì rút về 50) khi
  duyệt roadmap round 3, `js/search.js` (mục 4.6) là suất đầu tiên được dùng, và
  `test/labs.test.js` (mục 8.1, 31-10-2026) là suất thứ hai — cũng là suất cuối. Vòng #104
  (viết lại hai phòng lab CSRF/IDOR) không lấy thêm suất nào: code chảy vào `csrf.js` và
  `idor.js` đã có, markup vào `index.html`, 57 chuỗi mới vào `translation_review.json` và
  năm file từ điển đã có.
  Đã tính README, launcher `chay-ai.bat`, `server/gemini_proxy.py` +
  `server/requirements.txt`, `js/ai.js`, `js/labs/exam.js`, `.env.example` +
  `.gitignore`, `.vscode/settings.json`; chưa tính `__pycache__` và file tạm.
  **Trần đã chạm: không còn suất nào.** Muốn thêm file nữa phải đổi hoặc xoá một file
  khác trước — và vẫn phải hỏi trước khi làm.
  Bốn tính năng của mục 6 (đổi giao diện, trang Cài đặt, trang Quản trị, chế độ
  khách) là ví dụ của cách làm đúng trần: **toàn bộ đi vào file đã có** — markup
  thêm vào `index.html`, kiểu vào `style.css`, logic vào `app.js`/`auth.js`.
  Đếm lại trước khi nộp — và chú ý `server/` là một repo lồng trong repo, nên phải trừ
  cả `.git` của nó (lệnh cũ không trừ, đếm thành 79 rồi báo cáo sai):
  `find . -type f -not -path "./.git/*" -not -path "./server/.git/*" -not -path "*__pycache__*" | wc -l`
  hoặc `git ls-files | wc -l` rồi cộng thêm `.env`.
- **Không ghép chuỗi rồi mới dịch.** `t("Đã nạp " + n + " mục")` tạo một key lúc
  chạy chứa số — không bao giờ khớp từ điển, và âm thầm đẩy chuỗi vào hàng đợi dịch
  máy. Khuôn đúng: `t("Đã nạp") + " " + n + " " + t("mục. …")`, chọn bộ mảnh sao cho
  cả năm thứ tiếng vẫn đúng ngữ pháp. Lỗi này **tự sinh ra khi viết tính năng mới**
  (bốn lần trong mục 6), nên kiểm bằng `check_i18n.py --strict` ngay sau khi thêm
  chữ, đừng đợi cuối kỳ.
- **Công tắc phải đổi được hành vi.** Một checkbox trang Quản trị chỉ ẩn/hiện mà
  không chặn thì còn hại hơn không có: người lớn tưởng lớp đã bị khoá. Vì vậy mọi
  `Flags`/`AiBudget` đều được đọc ở **điểm vào** (`showView()`, `ai.js send()`), và
  hai trang `settings`/`account` cố ý nằm ngoài danh sách công tắc.
- **Danh sách do JS vẽ lại phải giữ nguyên vị trí focus.** `replaceChildren()` là
  cách duy nhất để nhãn của danh sách đổi theo ngôn ngữ, nhưng nó quăng
  `activeElement` về `<body>` ngay trong nhịp bấm — người dùng bàn phím mất chỗ đứng
  giữa một trang toàn công tắc. `paintFlagsList()` / `paintAdminUsers()` vì thế nhớ
  chỉ mục hàng đang focus rồi focus lại ô vừa tạo. Lỗi này chỉ hiện ra khi bấm
  thật, không đọc ra trong code.
- **Chữ đã dịch KHÔNG được nằm trong dữ liệu.** Một bản dịch là *cách hiển thị*,
  không phải *giá trị*: ghi `tr("Khách")` vào phiên (hoặc vào bất cứ khoá nào trong
  `localStorage`) là đóng băng ngôn ngữ của đúng lúc bấm nút, và người đổi tiếng sau
  đó sẽ đọc chữ của một màn hình khác nằm giữa giao diện hiện tại. Khuôn đúng: lưu
  giá trị trung tính (`""`, `"guest"`, một key) rồi dịch tại chỗ vẽ — và mọi chỗ vẽ
  bằng JS phải nghe `cysim:language`.
- **Không xoá code**, chỉ dời thứ không cần thiết — nhưng ngày 30-10-2026 bạn Đức cho
  phép bước xa hơn: **thứ thật sự không cần thì xoá để lấy chỗ**, vì `git history` vẫn
  giữ nguyên bản. Áp dụng cho code chết KHÔNG BAO GIỜ chạy được trên nền tảng nó nhắm
  tới (`netlify/functions/gemini.py`) và bản cũ đã được thay thế hoàn toàn
  (`_legacy/auth.legacy.js`); muốn xem lại: `git checkout 0bef8a8 -- <đường-dẫn>`.
  Code còn sống mà chưa chắc đã dùng thì vẫn dời, không xoá. File tạm do chính tôi tạo
  vẫn xoá bình thường (`tools/_add_headers.py`, `__pycache__`).
- **Không hardcode secret.** Key Gemini chỉ sống trong `.env` (đã `.gitignore`) hoặc
  trong dashboard của host (Render → Environment variables); `.env.example` là template
  nên `GEMINI_API_KEY=` luôn để trống — `.gitignore` có `!.env.example` nên dán key vào
  đó là commit luôn key. **Và `.gitignore` không phải bức tường:** chính repo này từng
  commit `.env` thật (`7ca1e6e`, "chore: force update environment key") vì `git add -f`
  thắng `.gitignore`, rồi commit đó được đẩy lên `github.com/andanh191001-web/cysim` —
  một repo **công khai**. Bài học đo được 30-10-2026: `.env` đã được `git rm --cached`
  (HEAD sạch), nhưng key trong blob cũ **vẫn còn nguyên trong lịch sử và vẫn còn sống**,
  vì xoá khỏi HEAD không xoá khỏi history. Nên: một key đã từng bị dán vào khung chat,
  paste lên nơi công khai, hay **nằm trong một commit của repo công khai** coi như **đã
  rò rỉ** — thu hồi và đổi key trên Google AI Studio, rồi cập nhật `.env` + Render,
  không chỉ xoá khỏi file. Kiểm tra trước khi push: `git ls-files | grep -c "^\.env$"`.
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
  một lượt vô điểm mà tưởng mình vừa lấy bằng. Trang **Quản trị** cũng chịu cùng
  một luật: nó là công tắc **thật** (chặn `showView()` và lời gọi AI) nhưng là hàng
  rào **giả** — ai mở được DevTools thì sửa được `localStorage`, nên đầu trang có
  một đoạn tĩnh nói đúng điều đó thay vì để một người lớn tưởng mình đã khoá được
  lớp học.
- **Không nhét dữ liệu cá nhân định sẵn vào luồng đi của mọi người dùng.** Trước
  đây `ai.js` gửi kèm một hồ sơ tự khai cứng (tên, năm sinh, trường, cân nặng) cho
  **mọi** tài khoản. Giờ hồ sơ là ô nhập `#aiProfileInput` mặc định rỗng, chỉ gửi
  khi người dùng tự gõ, lưu riêng theo tài khoản (`cysim-ai-profile:<email>`), và
  `#aiProfileState` nói cho người dùng biết lượt này có gửi kèm bao nhiêu ký tự.
- **Trung thực về số liệu**: tỉ lệ `%` trên lá cờ là `(chuỗi người duyệt + chuỗi code)/tổng`,
  dấu `~` nghĩa là còn chữ máy dịch. Không được khoe 100% khi chưa phải 100%.
- **Trung thực về kiểm thử**: `test/` phong toả máy chấm điểm và máy dịch; phần
  tương tác DOM của 15 lab **và của hai trang Cài đặt / Quản trị cùng chế độ khách**
  vẫn chỉ được xác minh bằng tay trong trình duyệt, và điều đó ghi ngay trong mục
  `test/` chứ không ẩn đi. Đây không phải chuyện lười: repo không có dependency, nên
  muốn test DOM phải tự viết một bộ DOM giả — thứ sẽ dài hơn cả bốn tính năng nó đo
  và chiếm một trong năm mươi chỗ của mục 8. Đổi lại, mỗi lần bấm đều để lại **số đo
  đọc từ DOM** (bảng trong mục 6.3) chứ không phải một dòng "đã test" không kiểm chứng.

### 8.1 Vì sao không tách `index.html` — kiểm kê thật và bốn đường không đi

Người duyệt round 7 viết: `index.html` "3040 dòng, khó đọc, dễ đụng khi thêm lab"
và "23 script dùng chung một scope toàn cục". Round 8 nâng con số lên "3158 dòng" và
đề xuất `tools/split_html.py` cắt `sections/*.html` rồi `fetch()`. Cả hai câu đều đúng,
nên ở đây trả lời bằng số đo lại chiều 31-10-2026 (đếm theo độ sâu thẻ, không đoán bằng
cách lấy dòng kế tiếp trừ dòng hiện tại), kèm đánh đổi của từng đường tách — chứ không
phải một lời biện hộ.

- **21 thẻ `<section>` chiếm 2438 dòng = 76,2% của file 3200 dòng** — 20 màn
  `class="view"` hết 2351 dòng (73,5%), 87 dòng còn lại là `#aiPanel`. 762 dòng nằm
  **ngoài** mọi `<section>`, chia thành các dải đo được, cộng lại khớp từng dòng: dải
  lớn nhất **1-406** (`<head>` 3-89 với 40 dòng chú thích liệt kê đủ 21 id và hậu quả
  nếu đổi id mà quên sửa JS, script nội tuyến chống nháy màu ở dòng 74; `<body>` mở ở
  90; `<noscript>` 97-108; biển mất mạng `#netFlag` dòng 140; sidebar XP
  `<aside id="sidebar">` dòng 238); dải **2813-3044** (232 dòng, form đăng nhập
  `#authOverlay` từ 2822 đến nút `#aiFab` 3040); dải **3132-3200** (69 dòng cuối —
  palette Ctrl+K, toast 3163, 8 thẻ `<script>` 3168-3188 cùng chú thích); sáu dải còn
  lại mỗi dải ≤9 dòng, nằm giữa chỗ một `<section>` khép và `<section>` kế mở.
- **Bốn khối to nhất:** `#theory` 432 dòng (13,5%), `#guide` 296 (9,3%), `#dashboard`
  189 (5,9%), `#account` 166 (5,2%). Mười khối lớn nhất = 1763 dòng = 55% cả file.
  Chỗ phình đúng như người duyệt đoán, và nó phình vì **chữ** — hai trang Lý thuyết +
  Hướng dẫn một mình đã 728 dòng — chứ không phải markup rỗng.
- **File đã lớn thêm 160 dòng kể từ tấm ảnh round 7** (3040 → 3158 → 3200): ba vòng sửa
  sau đó (Cài đặt, Quản trị, palette Ctrl+K), vòng #104 (markup hai phòng lab CSRF/IDOR
  viết lại) và vòng 8 này (`<noscript>` 12 dòng, ba đoạn nói thẳng về tài khoản, hai đoạn
  về bảng xếp hạng, `title` cho iframe XSS) đều đi vào file đã có theo đúng ràng buộc 52
  chỗ của mục 8. Nói thẳng: nếu mỗi nhược điểm được trả lời bằng "tách ra một file cho
  gọn" thì repo đã vượt trần từ vòng thứ hai. Trần đó giờ đã chạm thật — `test/labs.test.js`
  (mục `test/` ở mục 2) lấy đúng suất 52, và suất ấy **phải hỏi rồi mới được dùng**, không
  file nào trong repo tự ý lấy.

**Bốn đường tách, và vì sao chưa đi.**
1. **`fetch()` partial rồi ráp lúc chạy** — round 8 đề xuất `tools/split_html.py` cắt
   21 `<section>` ra `sections/*.html`. Đã **đo thật** trên `python -m http.server` chạy
   ở cổng 8010 chứ không đoán, và kết quả bắt tôi phải bỏ chính lý do mà bản trước của
   mục này ghi: 21 request **tuần tự** cho 21 file ~10 KB = **65,6 ms** (3,1 ms/request),
   MỘT request cho nguyên trang 154.547 bytes = ~3 ms khi server đã ấm (lượt đầu tiên
   sau khi server nghỉ lâu đo thành 437 ms — đó là giá khởi động kết nối, không phải giá
   của việc chia file). Vậy **tốc độ không phải lý do**, và viết ngược lại là nói dối
   con số. Hai lý do còn lại kiểm được:
   - **Ngoại tuyến (mục 5.3):** `sw.js` đang cache `CORE` = **35 đường dẫn**, và tên
     cache `cysim-<hash>` tự sinh từ đúng danh sách đó. Tách 21 partial biến `CORE`
     thành 56 đường và mỗi màn hình thành một **dependency lúc vẽ**: một file sai tên thì
     màn hình đó trống giữa trang, mà `install` đã bỏ nó (allSettled, chỉ `console.warn`)
     thì trên màn hình không có dấu hiệu nào. Cái chắc của bản hiện tại nằm ở đúng chỗ
     `index.html` là MỘT file — cache một lần là đủ 21 màn.
   - **Đường nháy đúp (`file://`):** phải nói cho đúng **cái nào đo, cái nào suy**.
     Trình duyệt mà môi trường này điều khiển được là **Electron** (`UA:
     Qoder/0.4.8 Chrome/150.0.7871.114 Electron/43.1.1`), và nó đọc `file://` tuỳ ý — đo:
     `fetch("file:///C:/Windows/win.ini")` trả **200 sau 25 ms**, `fetch("sw.js")` cùng
     thư mục trả **200 sau 5 ms**. Nên nó **không đại diện** cho Chrome/Edge thật của
     người dùng, và con số "request treo vô hạn" ghi trong `js/ai.js` (chốt `code:"file"`,
     đếm tới 13 s rồi đếm mãi) là số đo trên máy người dùng, tôi **không tái hiện được**
     ở đây. Điều tái hiện được: partial **thiếu tên** chết rất im —
     `fetch("sections/dashboard.html")` reject `TypeError: Failed to fetch` sau **4 ms**,
     không mã 404, không một chữ nào hiện lên.
   Tóm lại đường này đổi 2438 dòng lấy 21 dependency mới cộng một lớp lỗi im lặng, mà số
   đo không bênh nó; `check_i18n.py --ci` lại còn phải học quét thêm `sections/*.html`
   để khối [6/6] không báo nhầm 232 id thành "không có node thật".
2. **Web Components** — không giảm tổng số dòng, chỉ dời markup vào template trong
   JS; và mọi chuỗi trong template buộc phải đi qua `t()`, nghĩa là bảng
   `translation_review.json` (1106 chuỗi đã người duyệt) dựng lại từ đầu, trong khi
   engine i18n đang soi DOM bằng một MutationObserver toàn cục — nội dung trong shadow
   DOM đứng ngoài vùng soi đó. Rủi ro rơi đúng vào bất biến `máy 0 | thiếu 0` của mục
   4, tức là đổi một cái đẹp lấy một cái sai.
3. **Một bước build** sinh ra các partial — dự án không có dependency và không có bước
   build; người chấm phải chạy được bằng `python -m http.server 8137`. Ràng buộc này
   ăn trước mọi lựa chọn kiến trúc, nên phương án "viết script chia file" tự nó loại.
4. **ES Modules** — đường này **khả thi về kỹ thuật** và cắt đúng gốc rễ nỗi lo "chung
   một scope": mỗi module có phạm vi riêng, hết luôn cảnh file nạp sau đè file nạp
   trước. Nhưng nó đụng cả 24 file JS: `Labs` hiện là `const` toàn cục (không phải
   `window.Labs`), `napFile()` nạp chậm bằng cách gắn thêm `<script>` thường trong khi
   module thì `defer` và cô lập nên cơ chế nạp theo trang + `sw.js` phải viết lại, và
   8 thẻ bắt buộc thành một đồ thị import. Đó là thay đổi kiến trúc, không phải sửa
   một gạch đầu dòng trong ảnh — nên **cần bạn Đức quyết trước khi làm**; tự ý đổi 24
   file trong một vòng biên tập là việc tôi không làm.

**Thứ đã thay việc tách file, không tốn một chỗ nào.** `python tools/check_i18n.py --ci`
giờ chạy **sáu khối**, và hai khối cuối viết ra để trả lời đúng hai nỗi lo của round
7-8 (đo chiều 31-10-2026, cả sáu ĐẠT, exit 0):
- **[5/6]** quét tên khai báo ở **cột 0** của 24 file, in tên nào xuất hiện ở ≥2 file,
  **cộng thêm** tên bị đẩy thẳng ra `window` / `globalThis` / `self` bằng regex
  `GLOBAL_ASSIGN` — số thật: **147 tên cột 0, 0 trùng; 1 tên ra cửa sổ toàn cục**
  (`numOf`, quyết định có chủ ý ở `js/utils.js`). Đây chính là chỗ round 8 đoán sai:
  người duyệt lo "`window.X =` trong IIFE lọt lưới", thực đo cả repo chỉ có MỘT chỗ như
  vậy và nó là chủ ý, không phải tai nạn.
- **[6/6]** nối mọi id mà JS tham chiếu (`$("x")`, `getElementById("x")`,
  `querySelector("#x")`, kể cả id do JS gán `.id = "x"`) với id có thật trong markup:
  **232 id được tham chiếu, 232 có node, 0 thiếu** — và đếm chỗ gán `.innerHTML =` còn
  lại trong `js/` + `sw.js`: **0**. Nỗi lo "dễ đụng khi thêm lab" giờ có cửa chặn tự
  động: đổi id trong HTML mà quên sửa JS là CI đỏ ngay, chứ không phải một phòng lab
  câm đi một nửa.

Cả hai khối đều đã được **negative control** — chèn thật `window.numOf = 1;` vào file
thứ hai, chèn `$("idKhongTonTai91827")`, chèn một `document.body.innerHTML = x` vào
`js/app.js`: CI trả **ĐỎ đúng cả ba ca** (exit 1, in đúng tên file phạm lỗi), sau đó
`app.js` được khôi phục **byte-for-byte** (sha256 `ff2c5f1d…` khớp bản gốc) và CI xanh
lại. Không có hai dòng đó thì lời "khối mới bắt được hồi quy" chỉ là lời nói suông. Kèm
theo đó, mọi file lab bọc IIFE nên không lọt tên ra toàn cục, `Labs` chỉ có một chủ,
`showView()` đọc `Labs.<lab>` bằng `?.` (thứ tự nạp sai không nổ lúc khai báo), và quy
ước thứ tự 8 thẻ được ghi ngay trong chú thích đầu `index.html` để người thêm lab không
phải suy ra từ `boot.js`.

**Nếu một ngày bắt buộc phải gọn:** chỗ cắt đầu tiên là `#theory` (432) rồi `#guide`
(296), vì hai khối đó là chữ thuần, không có state, và ô tìm kiếm Ctrl+K (mục 4.6) vốn
đọc chỉ mục thẳng từ DOM nên chỉ cần vẽ xong trước khi người dùng bấm. Nhưng phải nói
cho đúng cái giá: cắt hai khối đó **không làm dự án ít dòng đi** — nó chuyển ~728 dòng từ
HTML sang JS và đẩy toàn bộ chuỗi của hai trang trở lại hàng đợi duyệt, trong lúc
`check_i18n.py` hiện đang bắt đủ chúng mà không cần làm gì thêm. Ghi thẳng đánh đổi để
quyết định sau không phải đoán lại.

### 8.2 Năm đề nghị round 8 phải thêm file — đã đo, chưa tự ý lấy suất

Bản ảnh round 8 có 15 điểm. Mười điểm sửa được trong file đã có (mục 8.1 vừa kể, cộng
`<noscript>`, `title` cho iframe, `manifest.json.version`, trần restart trong
`chay-ai.bat`, `urlparse` cho CORS IPv6, bỏ `innerHTML`, `saveData` cho hàng đợi dịch).
**Năm điểm còn lại đòi THÊM file**, mà mục 8 đã ghi trần **52/52 — đã đầy**, đo lại
bằng `find . -type f -not -path "./.git/*" -not -path "./server/.git/*" -not -path
"*__pycache__*" | wc -l` = **52**. Nên ở đây ghi lại **số đo của từng đề nghị** và
đường đã đi thay, để người quyết định không phải đoán lại; không một dòng code nào dưới
đây bị bỏ vì "làm không kịp".

| # | Đề nghị trong ảnh | Số đo thật (31-10-2026) | Vì sao vòng này chưa làm | Đường đã đi thay |
|---|---|---|---|---|
| 1 | `tools/split_html.py` cắt `sections/*.html`, `fetch()` lúc chạy | 21 request tuần tự = **65,6 ms**; một request nguyên trang = **~3 ms**; `sw.js` `CORE` **35 → 56** đường; partial thiếu tên reject `Failed to fetch` sau **4 ms** không một chữ nào hiện lên | Đổi 2438 dòng lấy 21 dependency lúc vẽ + một lớp lỗi im lặng, mà **số đo tốc độ không bênh**; và `--ci` sẽ phải học quét thêm `sections/*.html` | Hai khối [5/6] + [6/6] của `--ci` chặn đúng hai tai nạn mà cách tách file định phòng (mục 8.1) |
| 3 | Playwright/Puppeteer `test/e2e.js` cho 15 lab | Repo hiện **không có `package.json`, không có `node_modules`** (kiểm: `ls package.json node_modules` → cả hai không tồn tại); 3 bộ test đang chạy = **158 ca** (`exam` 21, `i18n` 64, `labs` 73) bằng `vm.runInContext` trên **nguồn thật**, zero dependency | Playwright không phải "một file": nó là một file **+ `npm install` + binary Chromium (~200 MB)**, tức phá đúng điều khiến người chấm mở được app trong một phút; môi trường tự động ở đây lại là **Electron 43**, không phải Chrome người dùng | `--ci` [2/6] `node --check` 26 file, [3/6] 158 ca test, [6/6] 232 id **nối thật** giữa JS và markup, **0** chỗ `innerHTML` — **và** một phiên bấm-thật qua CDP không thêm file nào, kết quả ở **mục 8.3** (2 lỗi thật, đã sửa) |
| 11 | Tách `README.md` 1946 dòng thành `docs/` | Đo lại ngày 01-11-2026, sau mục 8.3: `README.md` **2069 dòng**, **114** tham chiếu nội bộ dạng `mục 4.6` / `mục 5.5` (15 trỏ 5.5, 12 trỏ 8, 11 trỏ 6, 11 trỏ 4.6), **196** dòng bảng, **39** dòng mục lục có anchor — cả bốn con số đều **tăng** so với bản 1946 dòng mà ảnh chụp | Cắt sang `docs/` là cắt **114 mũi tên** thành chuỗi chết, hoặc phải viết lại cả 114 để chúng trỏ sang file khác — và nó vẫn **không giảm tổng số dòng phải đọc**, chỉ chia thành nhiều lần mở file | Mục lục anchor ở dòng 31 (mục 8.1 từng ghi đây là đường rẻ nhất), mỗi file source mang **chú thích đầu file** nói nó là gì và trỏ về đúng mục README |
| 12 | Checker báo **key chết** trong `translation_review.json` | Đã **có sẵn**, không cần file mới: `check_i18n.py --strict` in `c) bảng review 1106 chuỗi: thiếu ngôn ngữ 0, key chết 0` (dòng 188), chính là con số mà bảng review **1101 → 1106** vừa vượt qua | Không có gì phải xin suất | [tools/check_i18n.py:188](file:///c/Users/Admin/Desktop/tinhoctre2026/tools/check_i18n.py#L188) — vòng này thêm 5 key mới và khối đó xác nhận **0 key chết** |
| 15 | `SECURITY.md` + `CONTRIBUTING.md` + `CODE_OF_CONDUCT.md` | Ba file nữa = **55/52**, vượt trần ngay khi vừa đặt bút; phần `manifest.json` của cùng điểm này **đã làm** (`"version": "1.0.0"`) | Đây là quyết định **sở hữu repo**, không phải quyết định biên tập: ba file chỉ có giá trị khi nơi chứa repo đọc chúng (GitHub), và đổi lại là 3/52 suất của một sản phẩm tự dạy bằng cách mở một file | Nội dung `SECURITY.md` **đã nằm trong repo**, chỉ khác chỗ: mục 8 "Không hardcode secret" + "Cái gì giả phải được nói là giả"; nội dung `CONTRIBUTING.md` = mục 7 "Thêm một phòng lab mới (6 bước, không thêm file nào khác)" |

**Câu hỏi còn để ngỏ cho bạn Đức (tôi không tự trả lời):** có lấy suất 53-55 để đặt ba
file chuẩn GitHub và/hoặc một `test/e2e.js` chạy Playwright hay không. Cái được là repo
trông "đúng chuẩn" trên GitHub và 15 lab có test bấm-thật; cái mất là điều duy nhất khiến
bản này dùng được trong lớp — `git clone`, nháy đúp `index.html`, chạy được ngay, **0
dependency**, và 52 file đọc hết trong một buổi. Chọn một trong hai, không có cách giữ cả
hai, nên đây là lựa chọn của người chủ trì chứ không phải việc biên tập tôi làm một mình.

### 8.3 Bấm thử 15 phòng lab bằng trình duyệt điều khiển được — hai lỗi tìm ra và đã sửa

Mục 8.2 nói "không" với Playwright vì suất file và 200 MB Chromium. Nhưng "không có test
tự động" không được phép biến thành "không ai bấm thử". Nên vòng 8 vẫn chạy một phiên
bấm-thật qua CDP trên `http://127.0.0.1:8010/index.html`: mở lab, gõ payload, bấm nút,
đọc DOM. Không thêm file nào vào repo — script điều khiển nằm ngoài `./`, nên con số
**52/52** không đổi. Phiên này tìm ra **hai lỗi thật**, và cả hai đều nằm ngoài khả năng
phát hiện của sáu khối `--ci` lẫn 158 ca test: chúng không sai id, không sai tên, không sai
chuỗi dịch — chúng sai ở **trạng thái DOM giữa hai lần chuyển trang**, đúng chỗ mà test
chạy `vm.runInContext` (không có DOM để mà chuyển trang) với checker tĩnh (không chạy gì
hết) đều không nhìn thấy.

**Lỗi 1 — phòng lab DDoS chết sau một lần rời trang.** `app.js` gọi `Labs.ddos.stop()`
khi rời view; `stop()` xoá timer nhưng **không bật lại** `#btnStartDdos` (đang bị
`start()` tắt đi) và **không tắt** `#btnCloudflare` (đang bị `start()` bật lên). Kết quả
đo được trước khi sửa: quay lại trang DDoS → `start: true` (nút Start vẫn disabled), bấm
không ăn, `run: false`, và chiều ngược lại còn tệ hơn — `#btnCloudflare` vẫn bấm được nhưng
`toggleCloudflare()` `return` ngay vì `!active`, thành một nút chết. Cách duy nhất để chơi
lại là F5. Sửa ở [js/labs/ddos.js:59](file:///c/Users/Admin/Desktop/tinhoctre2026/js/labs/ddos.js#L59):
`stop()` đặt hai nút về đúng trạng thái khởi động của `index.html` (Start bật, Cloudflare +
Auto-Block tắt), kèm một chốt `if (!active) return;` trong `blockCard()` để thẻ của ván đã
dừng không trừ băng thông vô nghĩa. Đo lại từng bước: `start → 4 thẻ, hp 99% → rời trang
(run: false, start: false, cf: true) → quay lại → bấm Start → chạy tiếp (4 thẻ mới, hp về
100%)`. Hai đường kết luận cũng in đúng và tự giải thích được:
`SERVER CRASHED — Máy chủ đã sập do quá tải Băng thông! · Đã chặn: 0 · Bị gỡ khỏi danh sách: 20`
và `THẮNG LỢI — Bạn đã bảo vệ máy chủ an toàn khỏi DDoS! · Đã chặn: 0`.

**Lỗi 2 — hai lab để lại chữ của lần chơi trước trong DOM.** Round trước đã sửa cho
`phishing.js` với lý do ghi thẳng trong chú thích: *ẩn bằng class thì text vẫn nằm trong
DOM, người đọc bằng màn hình ảo hoặc xem lại source sẽ thấy kết luận của lần chơi trước*.
Hai file còn giữ đúng kiểu đó: `siem.js::resetVerdict()` và `antivirus.js::resetPanel()`
chỉ đổi `className = "verdict"` (CSS `.verdict{display:none}`), chữ cũ vẫn nguyên. Nay cả
hai xoá cả `textContent`. Đo: vào SIEM →Submit ra `XUẤT SẮC` → rời trang → quay lại →
`cls: "verdict", textEmpty: true`; dán chữ giả `SENTINEL-CU` vào `#avVerdict` rồi bấm EICAR
→ đọc ngay cùng tick: `cls: "verdict", txt: ""`.

Số đo bấm thử từng lab (31-10 → 01-11-2026, trình duyệt tự động, tiếng Việt):

| Lab | Đã bấm / đã gõ | Thấy |
|---|---|---|
| `sqli` | `admin' --` và `' UNION SELECT 1,2,3,4 --`, hai chế độ | unsafe + comment → `ACCESS GRANTED`; unsafe + union → `DATA LEAKED` + `#dbTableBody` **3 dòng × 4 ô** (dựng bằng `createElement`, không còn `innerHTML`); safe → `ATTACK BLOCKED` |
| `xss` | payload `<script>parent.postMessage(...)` và chip `<img onerror>` | unsafe: **script chạy thật**, trang cha nhận `XSS-RAN` — mà vẫn không đọc nổi gì của trang cha vì `sandbox="allow-scripts"` không kèm `allow-same-origin`; An toàn: `srcdoc` chỉ còn `&lt;script&gt;…`, **0** message → không chạy |
| `csrf` | ba cửa tấn công + bảng 3 hàng, rồi đủ Strict + Secure + token + Origin | cấu hình hở → `Vẫn còn cửa sống: link`; cấu hình kín → `PHÒNG THỦ ĐỨNG — với cấu hình này cả ba cửa đều chết` |
| `idor` | `#idorInput = 2` (đúng hồ sơ mình), quét 6 id | `ĐÚNG QUYỀN` + `#idorLog` 6 hàng; hồ sơ người khác (phiên trước) → `LỖI PHÂN QUYỀN — máy chủ không hề hỏi ai đang xem` |
| `phishing` | bấm hết `[data-spot]` | `3/3`, banner `#phishCaught` hiện, kết luận nói luôn "lần bấm nút vừa rồi chính là cách mật khẩu bị đánh cắp" thay vì tự mâu thuẫn |
| `ddos` | xem Lỗi 1 ở trên | spawn/tick/block/auto-block/Cloudflare đều nhúc nhích; hai đường thắng-thua in đúng |
| `password` | `Tr0ngBinh@2026!` | `98,5 bit` · "Rất mạnh" · "hàng chục nghìn tỷ năm" |
| `firewall` | `#runScan` | 6 cổng: `21 Đã chặn \| 22 Đã chặn \| 80 Mở \| 443 Mở \| 3306 Đã chặn \| 3389 Đã chặn` + legend `✅ Tường lửa đã chặn các cổng nguy hiểm.` |
| `antivirus` | nút EICAR, bấm hai lần | `Đã quét: 1 · Mã độc: 1` + `PHÁT HIỆN 1 MÃ ĐỘC`; lượt thứ hai xoá sạch kết luận cũ (Lỗi 2) |
| `siem` | tick 8 dòng có `data-threat` bằng click thật, rồi Submit | `#siemCount` = 5 (paintCount chạy theo click, không phải theo Submit) và `XUẤT SẮC — đúng 3 cuộc tấn công` |
| `account` | form đăng ký → form đăng nhập → MFA → OTP | sai mật khẩu bị chặn kèm lý do; OTP 6 số sinh bằng `crypto.getRandomValues` (`189187`); nhập mã → `Bước 3`, nhãn user đúng `tester` |
| `realip` | `8.8.8.8` | `[✓] TRUY VẤN THÀNH CÔNG DỮ LIỆU THỰC TẾ`, nhà cung cấp `ipinfo.io` — đây là số thật từ mạng, không phải mô phỏng |
| `certificate` | `btnSetCertName` khi còn khoá | `11 / 12` nhiệm vụ → `#certNameForm` `hidden`, `#certPreview` `display:none`: không gõ được tên cho một tấm bằng chưa tồn tại. Mã bằng tất định: cùng `(name, rank, stamp)` → `CS-324D-11F7` hai lần; đổi tên → `CS-3E80-28F1`; đổi stamp 1 ms → `CS-C37A-B3AD` |
| `exam` | vào phòng thi lượt thử, trả lời 10 câu + 4 ô tự luận, nộp | 40 radio + 4 textarea, bar `Thời gian còn lại: 44:57`; `showView('dashboard')` giữa lúc thi **bị giữ lại** `certificate` + toast "Đang làm bài thi…"; nộp → `Trắc nghiệm 4 / 20`, `Tự luận 0 / 20`. Con 0 là **đúng**: bài mẫu của harness trả lời chuyện lưu mật khẩu trong khi đề 1 hỏi defense-in-depth. Kiểm lại bằng `Labs.exam.chamTungDe`: đáp án khớp từ khoá → **5/5 ý**, câu dưới 30 ký tự → 0 |
| `guide` | — | **chưa bấm được**: `#cfgSendTest` cần EmailJS cấu hình thật; mục này chỉ kiểm được ô đọc/ghi cấu hình, nói thẳng là chưa test đường gửi mail |

Ngoài 15 lab: `showView()` đổi **20 view** — 0 lỗi, **0 console message** trong cả phiên.

**Cái mà harness này không đo được, ghi thẳng để không ai đọc bảng trên như đã đo hết:**

- **Tab bị ẩn → Chrome kẹp timer.** `setInterval(800)` bị kẹp thành ~1000 ms, và sau vài
  phút vào "intensive throttling" thì gần như đóng băng. Hai lần đầu đọc DDoS vì thế báo
  "không chạy" — thủ phạm là harness, không phải app; bằng chứng: cùng code, trang vừa tải
  thì tick chạy bình thường (hp 100 → 53 %, 13 thẻ). Vì vậy `WIN_AFTER_MS = 20000` **không
  đo được end-to-end** ở đây; hai đường thắng/thua kiểm bằng cách ép callback chạy đồng bộ.
- **Đừng patch `window.setTimeout` toàn cục để test.** Đã thử một lần và chính nó làm
  `#ports` trống không (cú patch ăn cả engine i18n và `startMonitor`), phải tải lại trang
  mới sạch. Bài học ghi lại: số đo firewall trong bảng trên lấy bằng timer thật trên trang
  tải mới, không phải bằng tắt máy.
- **`<noscript>`**: mới kiểm được sự tồn tại và vị trí markup (dòng 97-108 của
  `index.html`); **chưa** kiểm được đường "tắt JavaScript" vì không thể tắt JS của trang
  đang chạy trong trình duyệt tự động này.
- **`admin`**: `showView('admin')` rơi về `settings` khi chưa đăng nhập quản trị — guard
  chủ ý ở [js/app.js:1064](file:///c/Users/Admin/Desktop/tinhoctre2026/js/app.js#L1064), không phải lỗi.
- **Màn khoá đăng nhập chỉ là CSS.** `.auth-locked .app{display:none}`
  (style.css:635) chặn tầm nhìn chứ không chặn API: gọi thẳng `showView()` khi chưa vào
  chế độ khách thì UI hiện ra với `completedMissions` **chưa nạp** — đọc "1 / 13 nhiệm vụ"
  trong khi `cysim-done:guest` đang lưu 11 mục. Bấm đúng đường của người dùng
  (`[data-auth-guest]` → `onReady()`) thì số hydrate thành **11 / 13 nhiệm vụ · 1100 XP**.
  Đây là giới hạn đã được nói công khai từ trước ("chưa có máy chủ, tài khoản chỉ sống
  trên máy này"), nhưng ghi thêm một dòng để không ai tưởng màn khoá là rào dữ liệu.


