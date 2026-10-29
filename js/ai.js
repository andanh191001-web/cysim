/* =========================================================
   CySim — js/ai.js  ·  khung chat với trợ lý AI

   LÀ GÌ   : Nút nổi "Hỏi AI" mở khung chat #aiPanel. Câu hỏi được gửi tới
             server/gemini_proxy.py (khởi động bằng cách nháy đúp chay-ai.bat,
             mặc định gemini-flash-lite-latest, đổi ở .env) kèm lịch sử của tài
             khoản đang dùng, nên AI nhớ những gì vừa nói.
             MÁY CHỦ AI NẰM Ở ĐÂU phụ thuộc chỗ mở trang: trên chính máy này thì
             gọi http://127.0.0.1:8000; trên một domain công khai thì gọi
             /api/gemini CÙNG NGUỒN (host đó phải tự chạy máy chủ AI), hoặc gọi THẲNG
             MAI_CONG_KHAI khi máy chủ Python chạy ở một host khác (Render / Railway
             / VPS). Host tĩnh không chạy Python, nên bản web công khai chỉ có AI
             khi ai đó deploy thêm một máy chủ. Không có chuyện "thiếu API key" trên
             Netlify: .env không được tải lên (đã chặn trong .gitignore) và cũng
             KHÔNG bao giờ được dán vào file tĩnh, vì mọi file trên host tĩnh là mọi
             người đều tải được. URL một máy chủ công khai thì KHÔNG phải bí mật
             (key mới là bí mật, và key nằm lại phía máy chủ) — nhưng nó là nơi câu
             hỏi và ảnh của người dùng đi tới, nên chỉ dán URL máy chủ do chính mình
             chạy, không phải một URL nhặt trên mạng.
             Câu hỏi có thể KÈM ẢNH (nút "Đính ảnh", kéo-thả, hoặc Ctrl+V) và
             khung chat có thể PHÓNG TO (nút "Phóng to" hoặc kéo góc dưới-phải).
             Chữ về từng mảnh một qua SSE và được tô dần lên bong bóng.
             AI trả lời được MỌI thứ — bài toán, bài văn, code, kiến thức
             chung — và luôn tự nhận là AI của CySim, do Nguyễn Trí Đức viết
             (những câu đó do server/gemini_proxy.py áp SystemInstruction,
             không phải JS tự bịa).
   CHẠY     : Bấm #aiFab -> hiện #aiPanel, nạp lịch sử của Auth.id() và hỏi
              /api/health để vẽ #aiStatus (sẵn sàng / chưa có key / chưa chạy
              máy chủ / mở bằng file:// / mất internet / bản web không kèm máy chủ
              AI / máy chủ công khai đang không trả lời) — người dùng thấy bệnh
              trước khi gõ, không phải gõ xong mới nhận một bong bóng lỗi. Ở năm
              trạng thái "offline", "no_key", "no_net", "remote" và "external" dòng
              đó vẽ thêm nút
              "Thử lại" (`.ai-retry`) gọi thẳng checkServer(): bật chay-ai.bat
              xong bấm tại chỗ là biết máy chủ đã sống, không phải đóng/mở panel
              hay gửi nhầm một câu. Máy mất mạng cũng tự vẽ lại dòng đó nhờ hai
              listener "online"/"offline" — không phải mở lại khung chat.
              Gõ + Enter (hoặc "Gửi") ->
              addMessage(user) -> ask(): POST {prompt, lang, stream, history, profile,
              depth, images?} tới endpoint — "lang" là ngôn ngữ đang hiển thị, server dùng nó để
              ép AI trả lời đúng thứ tiếng đó; "stream":true xin chữ về TỪNG MẢNH
              (text/event-stream) để câu trả lời hiện dần, không bắt người dùng
              nhìn màn hình đứng im cả phút. Google quá tải là chuyện thật mỗi
              ngày và proxy đã tự thử lại + đổi mô hình dự phòng, nhưng một lượt
              vẫn có thể mất hàng chục giây (đo 28-29-10-2026: một đợt 11 lượt có
              một lượt 22,9 giây; đợt 8 lượt ngày 29-10 thì 8/8 dưới 3 giây): trong lúc chờ, chính nút "Gửi" đổi nhãn
              thành "Dừng" (bấm vào là abort() request, chữ đã về vẫn được giữ),
              và sau 8 giây chưa có mảnh chữ nào thì dòng chờ đổi thành "... đã
              chờ NS" để phân biệt "đang nghĩ" với "treo". Mở trang bằng file://
              thì ask() trả lỗi "file" ngay thay vì gọi fetch — fetch trên file://
              không chết mà treo vô hạn. Thành công -> addMessage(model).
              Thất bại -> nếu câu hỏi là "bạn
              là ai / ai viết ra bạn" thì trả lời cục bộ tại máy (proxy chết
              vẫn đúng danh tính), còn lại hiện câu dịch theo mã lỗi server gửi
              về dưới dạng dòng "hệ thống", KHÔNG đội lốt CySim AI. #aiClear
              xoá lịch sử của đúng tài khoản. auth.js phát "cysim:session" mỗi
              lần phiên đổi, và syncAccount() cũng được gọi ở mọi thao tác (mở
              panel, gửi, xoá): id đổi là nạp lại, hội thoại của người này
              không hiện trên màn hình của người kia.
              ẢNH: chọn/dán/thả -> thuNhoAnh() vẽ lại bằng canvas (cạnh dài tối
              đa 1568 px, JPEG 0,85, nền trắng vì JPEG không có kênh alpha; GIF
              và ảnh đã nhỏ hơn 300 KB gửi nguyên bản để không mất animation) ->
              nằm trong mảng `anh` ở RAM -> send() gỡ khỏi khay, đính vào đúng
              lượt hỏi, gọi ask() với trường "images". Trần máy đặt NGHIÊM HƠN
              máy chủ (3 tấm × 1,5 MB, server cho 4 × 2 MB) nên không thao tác
              nào trên màn hình chạm tới lỗi 413. Trượt cả lượt thì ảnh được
              trả về khay để bấm Gửi lại.
              PHÓNG TO: #aiExpand lật class .ai-wide và nhớ lựa chọn vào
              cysim-ai-rong; kéo góc khung (CSS resize) thì to tuỳ ý, không nhớ.
              ĐỘ SÂU: #aiDepth gửi trường "depth" = nhanh | can-bang | ky xuống
              máy chủ, DEPTH_MAP trong server/gemini_proxy.py đổi theo trần token
              (512 cho mức Nhanh) và model (mức Kỹ dùng GEMINI_DEEP_MODEL). Mức
              Cân bằng = đúng hành vi cũ, nên đây là lựa chọn thêm chứ không phải
              đổi mặc định. <option> do JS sơn bằng t(): engine i18n bỏ qua thẻ
              OPTION nên viết chữ Việt sẵn trong index.html là kẹt tiếng Việt mãi.
              ĐO THẬT: mỗi câu trả lời gắn "chữ đầu Xs · hoàn tất Ys · <model>",
              tính từ lúc bấm Gửi tới mảnh SSE đầu tiên và tới lúc stream đóng, kèm
              tên mô hình CHÍNH MÁY CHỦ KHAI đã trả lời — khác tên người dùng chọn
              đúng vào lúc proxy phải đổi sang model dự phòng vì Google quá tải. Số
              để người dùng tự kiểm chứng tốc độ, không phải lời quảng cáo. Đo ngày
              29-10-2026 với key của máy này qua chính proxy: 8/8 lượt XONG trong
              1,3–2,6 giây, chữ đầu sau 0,64–1,71 giây; một đợt đo khác cùng ngày có
              một lượt 22,9 giây (Google xếp hàng, app không làm gì thêm được).
   CHẠM TỚI : DOM #aiFab #aiPanel #aiLog #aiStatus #aiClear #aiClose #aiForm
              #aiInput #aiSend #aiProfileInput #aiProfileState #aiExpand
              #aiImageBtn #aiImageInput #aiImages #aiImageState #aiDepth; localStorage
              cysim-ai:<email> (mỗi tài khoản một ngăn, "guest" khi chưa đăng
              nhập), cysim-ai-profile:<email> (ô hồ sơ tự điền, MẶC ĐỊNH TRỐNG),
              cysim-ai-depth (độ sâu câu trả lời) và cysim-ai-endpoint (ghi đè nơi
              gọi AI — mặc định đã tự đổi theo chỗ mở trang, xem khối LÀ GÌ); global
              $, CyUtil, t, showToast,
              Auth, Labs. Đăng ký
              Labs.ai để app.js vẽ lại khi đổi ngôn ngữ.
   AN TOÀN  : Mọi chữ (của người dùng lẫn của AI) vào DOM bằng textContent,
              không có innerHTML -> câu trả lời chứa thẻ <script> cũng chỉ là
              chữ. #aiLog mang data-no-i18n để engine dịch không đem nội dung
              hội thoại đi dịch lại.
   RIÊNG TƯ : trường "profile" trong payload CHỈ có chữ do chính người dùng gõ
              vào #aiProfileInput — mã nguồn không chứa sẵn hồ sơ của ai. Mặc
              định rỗng, chỉ gửi khi có nội dung, lưu theo từng tài khoản, và
              dòng #aiProfileState nói rõ lượt hỏi này đang mang theo bao nhiêu
              ký tự riêng tư. Muốn xoá: xoá ô đó là xong.
              ẢNH còn đi xa hơn chữ: một tấm ảnh có thể là tờ giấy riêng của ai
              đó. Vì vậy ảnh CHỈ sống trong RAM của đúng một lượt hỏi — không
              xuống localStorage (bản lưu chỉ ghi số lượng `soAnh`), không vào
              lịch sử gửi lại cho các lượt sau, bị xoá khi đổi tài khoản, và
              hàng xem trước nói thẳng "chỉ đi kèm lượt hỏi này". Muốn gỡ: bấm
              ✕ trên tấm ảnh.
   ========================================================= */

(function () {
  /* Nơi gọi AI mặc định PHỤ THUỘC VÀO CHỖ TRANG ĐANG ĐƯỢC MỞ — đây chính là chỗ
     bản Netlify vỡ ra. Máy chủ AI là một tiến trình Python (server/gemini_proxy.py)
     chạy trên máy có nháy đúp chay-ai.bat; nó không đi theo file tĩnh, và trình
     duyệt của người lạ cũng không có đường gọi về máy của tác giả. Nên:
       - mở trên chính máy này (127.0.0.1 / localhost / [::1] / file://) -> proxy cục bộ;
       - mở từ một domain công khai -> "/api/gemini" CÙNG NGUỒN, tức là bản web đó
         phải tự kèm máy chủ AI; Netlify chỉ nhận hàm JS/TS/Go nên .py không chạy ở đó;
       - cũng từ domain công khai, nếu MAI_CONG_KHAI có giá trị -> gọi THẲNG máy chủ
         Python ở host khác, và đây là đường giữ được chữ về dần (SSE) vì một tiến
         trình thật không bị trần 60 giây của serverless cắt ngang.
     KHÔNG có lối tắt "dán đại API key vào file cho nó chạy trên Netlify": host tĩnh
     phát MỌI file cho MỌI người tải, key nằm trong bundle là key công khai — và một
     sản phẩm dạy bảo mật thì không được tự tay làm cái điều nó dạy đừng làm. */
  const MAY_TINH_NAY = /^(127\.0\.0\.1|localhost|\[::1\])$/;
  /* Máy chủ AI ở NƠI CÔNG KHAI, không cùng nguồn với trang (đường Render/Railway/
     VPS chạy chính server/gemini_proxy.py). Dán URL gốc vào đây MỘT lần, ví dụ
     "https://cysim-ai.onrender.com" — để trống nghĩa là gọi "/api/gemini" cùng
     nguồn như cũ (chỉ sống nếu chính host đó chạy được máy chủ AI).
     Vì sao phải gọi THẲNG mà không để Netlify chuyển tiếp hộ: rewrite làm proxy
     của Netlify cắt ở 26 giây (docs), trong khi một câu trả lời đo thật hôm
     29-10-2026 mất 176,9 giây — đi đường vòng là chắc chắn chết giữa chừng, dù
     máy chủ chậm đó vẫn sống tốt. URL máy chủ không phải bí mật (key thì có, và
     key nằm lại phía máy chủ). */
  const MAI_CONG_KHAI = "";
  const macDinh = MAY_TINH_NAY.test(location.hostname) || location.hostname === ""
    ? "http://127.0.0.1:8000/api/gemini"
    : (MAI_CONG_KHAI ? MAI_CONG_KHAI.replace(/\/+$/, "") + "/api/gemini" : "/api/gemini");
  const ENDPOINT_KEY = "cysim-ai-endpoint";
  const HISTORY_KEY = (id) => "cysim-ai:" + id;
  const MAX_MESSAGES = 60; // 30 cặp hỏi/đáp, cũ nhất bị bỏ
  const MAX_PROMPT_CHARS = 2000; // khớp maxlength của #aiInput
  const RONG_KEY = "cysim-ai-rong"; // khung đang phóng to hay thu gọn (theo máy, không theo tài khoản)
  const DEPTH_KEY = "cysim-ai-depth"; // mức độ sâu câu trả lời (cũng theo máy, như cysim-ai-rong)

  /* Ba mã ĐÚNG bằng khoá DEPTH_MAP trong server/gemini_proxy.py: slug ASCII không
     dấu, gửi nguyên văn xuống máy chủ để chieu_sau() tra được; phần chữ Việt chỉ
     dùng để vẽ. "can-bang" là mặc định và bằng đúng hành vi trước khi có ô chọn
     này, nên ai không đụng vào gì thì mọi thứ chạy y như cũ.
     Nhãn chỉ nói cái THAY ĐỔI THẬT: mức Nhanh cắt trần token xuống 512 nên câu ngắn
     và XONG sớm hơn, chứ không làm chữ đầu tới sớm hơn (đã đo 29-10-2026: 0,64–1,71
     giây ở mọi mức — chữ đầu đến trước khi mô hình kịp viết hết). Mức Kỹ đổi sang
     GEMINI_DEEP_MODEL, câu sâu hơn; còn lâu hay nhanh thì do Google ngày đó, không
     ai được hứa hộ, nên nhãn dùng "có thể". */
  const DO_SAU = [
    ["nhanh", () => t("Nhanh — câu ngắn, xong sớm")],
    ["can-bang", () => t("Cân bằng — như mặc định")],
    ["ky", () => t("Kỹ — sâu hơn, có thể lâu hơn")],
  ];

  /* ---------- ảnh gửi kèm câu hỏi ----------
     Trần bên máy chủ (server/gemini_proxy.py) cố ý đặt CAO HƠN: máy chủ
     cho 4 ảnh × 2 MB / tổng 6 MB, giao diện chỉ nhận 3 ảnh × 1,5 MB. Vì thế
     không đường nào để một thao tác trên màn hình chạm tới lỗi 413 khô khan —
     thứ người dùng gặp là câu "ảnh quá lớn, chọn tấm khác" bằng đúng thứ tiếng
     đang bật. */
  const MAX_IMAGES = 3;
  const MAX_IMAGE_BYTES = 1_500_000; // 1,5 MB sau khi đã thu nhỏ
  const ANH_MAX_CANH = 1568; // cạnh dài nhất gửi lên Google — đủ cho chữ trong ảnh đọc được
  let anh = []; // [{ten, mime, data (base64 THUẦN), bytes}] — CHỈ trong RAM, không bao giờ xuống localStorage


  const endpoint = () => localStorage.getItem(ENDPOINT_KEY) || macDinh;

  /* Nơi THẬT SỰ sẽ được gọi, đã tính cả ô ghi đè cysim-ai-endpoint. Hai câu hỏi
     mà màn hình trạng thái cần trả lời khác nhau: "có phải máy này không" (để còn
     bảo người ta bật chay-ai.bat) và "đang thử URL nào" (để in ra khi sai). Dùng
     cho bản deploy: tác giả trỏ endpoint sang một proxy ở nơi khác thì không được
     còn nhắc file .bat của máy mình nữa. */
 const noiGoi = (duongDan) => {
    const e = duongDan || endpoint();
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(e) || e.startsWith("//")) return e;
    return "https://cysim-backend.onrender.com" + (e.startsWith("/") ? e : "/" + e);
};

  const mayChuCuaToi = () =>
    /^https?:\/\/((127\.0\.0\.1|localhost|\[::1\])(:|$))/i.test(noiGoi());
  /* Máy chủ ở MỘT HOST KHÁC trang đang chạy (đường Render/Railway/VPS, hoặc ô
     cysim-ai-endpoint trỏ đi nơi khác). Khác với "remote": ở remote thì trang
     không hề có máy chủ, còn đây là có — chỉ đang không trả lời. */
  const mayChuBenNgoai = () => {
    if (mayChuCuaToi()) return false;
    try {
      return new URL(noiGoi(), location.href).origin !== location.origin;
    } catch (e) {
      return false;
    }
  };

  /* ---------- hồ sơ người học: ô TỰ ĐIỀN, mặc định RỖNG ----------
     Người dùng muốn AI bám theo trình độ/mục tiêu của mình thì gõ vào
     #aiProfileInput; không gõ thì không có chữ nào rời khỏi máy ngoài câu hỏi.
     Mã nguồn KHÔNG chứa sẵn tên tuổi, trường học hay sức khoẻ của ai — trước
     đây khối đó nằm hardcoded ở file này và được gửi đi dưới mọi tài khoản,
     tức là mọi người dùng vô tình upload hồ sơ của một người.
     Chữ chỉ đi tới MÁY CHỦ AI mà app đang gọi — proxy trên chính máy này khi bật
     chay-ai.bat, còn bản web công khai thì là host khai ở MAI_CONG_KHAI /
     cysim-ai-endpoint — chứ không đi thẳng lên Google từ trình duyệt; và nó nằm
     trong localStorage theo đúng tài khoản. Gắn một host ở nơi khác thì khối chữ
     đó RỜI khỏi máy người dùng, đúng bằng câu hỏi: đây là lý do ô này mặc định
     trống và không ai được điền hộ ai. */
  const PROFILE_KEY = (id) => "cysim-ai-profile:" + id;
  let hoSo = "";

  function readProfile() {
    try {
      return localStorage.getItem(PROFILE_KEY(Auth.id())) || "";
    } catch {
      return ""; // chế độ riêng tư / storage bị khoá: coi như chưa có hồ sơ
    }
  }

  function saveProfile(text) {
    hoSo = text;
    const input = $("aiProfileInput");
    if (input && input.value !== text) input.value = text;
    try {
      if (text) localStorage.setItem(PROFILE_KEY(Auth.id()), text);
      else localStorage.removeItem(PROFILE_KEY(Auth.id()));
    } catch {
      showToast("Không lưu được hồ sơ (bộ nhớ trình duyệt đã đầy); chữ này chỉ dùng cho lượt hỏi hiện tại.");
    }
    paintProfileState();
  }

  /* Dòng trạng thái dưới ô hồ sơ: nói thẳng lượt này AI nhận được chữ riêng của
     bạn hay không, để "tuỳ chọn" không biến thành "không biết đang gửi gì".
     Chỉ dùng vài mẩu chuỗi cố định — ghép số vào giữa một câu rồi mới dịch sẽ
     tạo ra một khoá không bao giờ có trong từ điển. */
  function paintProfileState() {
    const line = $("aiProfileState");
    if (!line) return;
    const n = hoSo.trim().length;
    line.textContent = n
      ? `${t("Đang gửi kèm hồ sơ của bạn")}: ${n} ${t("ký tự")} · ${t("chỉ lưu trên máy này")}`
      : t("Chưa có hồ sơ nào được gửi — AI trả lời chung, không biết gì về bạn.");
    /* SKIP_TAGS của i18n.js có TEXTAREA: nội dung ô là chữ người dùng gõ nên
       engine cố tình không đụng tới — hệ luỵ là placeholder và aria-label của
       chính ô này cũng không bao giờ được dịch. ai.js là chủ vùng dữ liệu đó,
       phải tự vẽ lại bằng t() mỗi lần đổi ngôn ngữ, nếu không ô hồ sơ vẫn nguyên
       tiếng Việt trên giao diện tiếng Pháp. */
    const input = $("aiProfileInput");
    if (input) {
      input.placeholder = t("VD: tôi học lớp 8, mạnh nhất môn Toán, thích ví dụ ngắn và chạy được ngay…");
      input.setAttribute("aria-label", t("Hồ sơ gửi kèm câu hỏi cho AI"));
    }
  }

  /* ---------- ảnh đính kèm: chọn / kéo-thả / dán -> thu nhỏ -> giữ trong RAM ----------
     Vì sao phải thu nhỏ: một tấm ảnh điện thoại 4 000x3 000 nặng 6 MB, gửi nguyên
     khối đó là chạm trần dung lượng của máy chủ, mà Google cũng chỉ "nhìn" ảnh ở
     cỡ hữu hạn. Canvas vẽ lại với cạnh dài tối đa ANH_MAX_CANH rồi nén JPEG 0,85:
     chữ trong ảnh vẫn đọc được mà body giảm đi hàng chục lần. Ảnh đã nhỏ và GIF
     được gửi nguyên bản — vẽ lại GIF bằng canvas là mất tích animation. */
  const docBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const s = String(reader.result || "");
        const gach = s.indexOf(","); // bỏ "data:image/png;base64,"
        resolve(gach >= 0 ? s.slice(gach + 1) : s);
      };
      reader.onerror = () => reject(new Error("không đọc được file"));
      reader.readAsDataURL(file);
    });

  /* base64 phình 4/3, nên suy ra số byte thật mà chưa cần giải mã. */
  const soByteTuBase64 = (len) => Math.round((len * 3) / 4);

  async function thuNhoAnh(file) {
    const data = await docBase64(file);
    const nbytes = soByteTuBase64(data.length);
    if (!data) throw new Error("rong");
    if (nbytes > MAX_IMAGE_BYTES) throw new Error("qua_tran");
    // Dưới ~300 KB thì gửi nguyên bản: vẽ lại bằng canvas chỉ làm mờ thêm, và GIF
    // vẽ lại là mất tích animation.
    if (file.type === "image/gif" || nbytes <= 300_000) {
      return { ten: file.name || "anh", mime: file.type, data, bytes: nbytes };
    }
    const h = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("vo_du"));
      img.src = "data:" + file.type + ";base64," + data;
    });
    const rong = h.naturalWidth || 1;
    const cao = h.naturalHeight || 1;
    const tiLe = Math.min(1, ANH_MAX_CANH / Math.max(rong, cao));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(rong * tiLe));
    canvas.height = Math.max(1, Math.round(cao * tiLe));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; // JPEG không có kênh alpha: nền trắng, không phải đen sì
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(h, 0, 0, canvas.width, canvas.height);
    const nen = canvas.toDataURL("image/jpeg", 0.85);
    const sau = nen.slice(nen.indexOf(",") + 1);
    const soSau = soByteTuBase64(sau.length);
    if (soSau > MAX_IMAGE_BYTES) throw new Error("qua_tran");
    return { ten: file.name || "anh", mime: "image/jpeg", data: sau, bytes: soSau };
  }

  /* Nhận một danh sách File: lọc định dạng, chặn vượt số ảnh, và báo bằng câu
     riêng cho từng lý do hỏng — "file này không phải ảnh" khác hẳn "bức kia quá
     lớn", gộp thành một lỗi chung thì người dùng không biết sửa gì. */
  async function themAnh(cacFile) {
    let thua = 0;
    for (const file of Array.from(cacFile || [])) {
      if (anh.length >= MAX_IMAGES) {
        thua++;
        continue;
      }
      if (!file.type || !file.type.startsWith("image/")) {
        showToast("Chỉ nhận file ảnh (PNG, JPEG, WebP, GIF).");
        continue;
      }
      try {
        anh.push(await thuNhoAnh(file));
      } catch (err) {
        const lyDo = String(err && err.message);
        showToast(
          lyDo === "qua_tran"
            ? "Ảnh lớn quá trần 1,5 MB — chọn tấm nhẹ hơn hoặc ảnh chụp màn hình."
            : "Không đọc được ảnh này — thử một tấm khác."
        );
      }
    }
    if (thua) showToast("Đã đính kèm đủ số ảnh cho một lượt.");
    veAnhKem();
  }

  /* Hàng xem trước + dòng trạng thái. ảnh.length/MB là SỐ, để NGOÀI t(); mẩu chữ
     dịch được nằm trong t() — đúng quy ước để không sinh khoá dịch máy. */
  function veAnhKem() {
    const box = $("aiImages");
    const dong = $("aiImageState");
    if (!box || !dong) return;
    box.textContent = "";
    box.hidden = anh.length === 0;
    for (const [i, a] of anh.entries()) {
      const o = document.createElement("div");
      o.className = "ai-img";
      const h = document.createElement("img");
      h.src = "data:" + a.mime + ";base64," + a.data;
      h.alt = t("Ảnh bạn đính kèm");
      h.title = a.ten; // tên file là chữ người dùng đặt, không phải chuỗi dịch
      const ten = document.createElement("span");
      ten.textContent = a.ten;
      const bo = document.createElement("button");
      bo.type = "button";
      bo.className = "ai-img-bo";
      bo.textContent = "✕";
      bo.setAttribute("aria-label", t("Bỏ ảnh này"));
      bo.title = t("Bỏ ảnh này");
      bo.addEventListener("click", () => {
        anh.splice(i, 1);
        veAnhKem();
      });
      o.append(h, ten, bo);
      box.append(o);
    }
    const tong = anh.reduce((s, a) => s + a.bytes, 0);
    /* CyUtil.formatBytes tự chọn B / KB / MB: một tấm ảnh 68 byte mà ghi
       "0.00 MB" thì người dùng nghĩ hệ thống chưa nhận gì cả. */
    dong.textContent = anh.length
      ? `${anh.length}/${MAX_IMAGES} ${t("ảnh")} · ${CyUtil.formatBytes(tong)} · ${t("chỉ đi kèm lượt hỏi này, không lưu lại")}`
      : t("Chưa đính kèm ảnh — câu hỏi chỉ có chữ.");
    const nut = $("aiImageBtn");
    if (nut) nut.disabled = anh.length >= MAX_IMAGES;
  }

  /* Ảnh dán (Ctrl+V) hoặc kéo-thả vào khung chat. Không có file nào kèm theo thì
     để trình duyệt xử lý như mọi lần dán chữ — chặn mặc định ở đây sẽ làm mất
     cả tính năng paste văn bản. */
  function anhTuSuKien(e) {
    const nguon = e.clipboardData || e.dataTransfer;
    const items = Array.from((nguon && nguon.items) || []);
    const cacFile = items
      .filter((it) => it.kind === "file" && (it.type || "").startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter(Boolean);
    if (!cacFile.length) return false;
    e.preventDefault();
    themAnh(cacFile);
    return true;
  }

  /* ---------- phóng to khung chat ----------
     Hai tầng, vì hai nhu cầu khác nhau:
       - nút "Phóng to" đổi sang cỡ rộng sẵn (class .ai-wide), lựa chọn được nhớ
         lại nên lần sau mở lên vẫn đúng khung người dùng đã quen;
       - kéo góc dưới-phải khung (CSS resize) thì to tuỳ ý, không nhớ — muốn tạm
         thời xem một ảnh thật to thì kéo, không phải bấm.
     Cỡ rộng vẫn chừa sidebar 272px bên trái, không che menu. */
  function veRong() {
    const nut = $("aiExpand");
    const panel = $("aiPanel");
    if (!nut || !panel) return;
    const rong = localStorage.getItem(RONG_KEY) === "1";
    panel.classList.toggle("ai-wide", rong);
    nut.setAttribute("aria-pressed", String(rong));
    const nhan = rong ? t("Thu nhỏ khung chat") : t("Phóng to khung chat");
    nut.textContent = nhan;
    nut.title = nhan;
  }

  function daoRong() {
    localStorage.setItem(RONG_KEY, localStorage.getItem(RONG_KEY) === "1" ? "0" : "1");
    veRong();
    $("aiInput").focus();
  }

  /* ---------- độ sâu câu trả lời ----------
     Người dùng chọn đổi gì lấy gì: "Nhanh" cắt trần token xuống 512 nên câu gọn và
     XONG sớm hơn (chữ đầu KHÔNG sớm hơn — đã đo), "Cân bằng" giữ nguyên hành vi cũ,
     "Kỹ" đổi sang GEMINI_DEEP_MODEL và vì đổi model nên câu có thể dài/sâu hơn, còn
     có CHẬM hơn không thì không ai hứa được (đo 29-10-2026: hai lượt Kỹ 1,6 và 1,8
     giây, nhanh hơn vài lượt Cân bằng).
     Hai mức đầu dùng CÙNG một model, chỉ khác trần token + nhiệt độ, nên tuyệt đối
     không được quảng cáo chúng là "thông minh hơn"; mức Kỹ khác model nhưng không có
     số đo nào ở đây cho phép nói model đó trả lời ĐÚNG hơn. Máy chủ chặn giá trị lạ
     bằng cách rơi về mặc định, nên ở đây cũng chỉ cần đúng ba mã đã khai. */
  function docDoSau() {
    let luu = "";
    try {
      luu = localStorage.getItem(DEPTH_KEY) || "";
    } catch {
      return "can-bang"; // storage bị khoá (chế độ riêng tư): dùng mặc định, không hỏi gì thêm
    }
    return DO_SAU.some(([ma]) => ma === luu) ? luu : "can-bang";
  }

  /* Thẻ OPTION nằm trong SKIP_TAGS của js/i18n.js — engine bỏ qua, nên nhãn
     viết thẳng trong index.html sẽ kẹt tiếng Việt vĩnh viễn trên giao diện
     tiếng Nhật. Vì vậy dựng <option> bằng t() tại đây và vẽ lại mỗi lần
     render() chạy: mở panel, đổi ngôn ngữ, đổi phiên. */
  function veDoSau() {
    const sel = $("aiDepth");
    if (!sel) return;
    const dangChon = docDoSau();
    sel.textContent = "";
    for (const [ma, nhan] of DO_SAU) {
      const o = document.createElement("option");
      o.value = ma;
      o.textContent = nhan();
      sel.append(o);
    }
    sel.value = dangChon;
  }

  /* Giây lẻ hiển thị một chữ số. Con số nằm NGOÀI t() theo quy ước của dự án,
     chỉ dấu thập phân đổi theo tiếng: tiếng Việt dùng phẩy, phần còn lại dùng
     chấm — "1.8s" trên màn hình tiếng Việt là chữ do máy tính Anh quốc viết. */
  function leSec(x) {
    const s = Math.max(0, Number(x) || 0).toFixed(1);
    return currentLang === "vi" ? s.replace(".", ",") : s;
  }

  /* ---------- lưu trữ theo tài khoản ---------- */
  let messages = [];
  let loadedFor = null;

  /* Lịch sử luôn nối với đúng tài khoản đang đăng nhập: đối chiếu Auth.id()
     trước mỗi thao tác (và khi auth.js báo "cysim:session"), id đổi là nạp lại,
     nên hội thoại của người này không hiện trên màn hình của người kia. */
  function syncAccount() {
    if (loadedFor === Auth.id()) return false;
    loadedFor = Auth.id();
    hoSo = readProfile(); // hồ sơ cũng theo tài khoản: người khác dùng chung máy không thấy chữ của nhau
    /* Ảnh đang chờ đính kèm cũng là chữ của người TRƯỚC — một tấm ảnh chụp màn
       hình bài tập hay tờ giấy riêng rơi vào lượt hỏi của người khác là đúng cái
       kiểu tai nạn mà một app dạy bảo mật không được phép có. đổi phiên là xoá. */
    if (anh.length) anh = [];
    veAnhKem();
    const input = $("aiProfileInput");
    if (input) input.value = hoSo;
    load();
    return true;
  }

  function load() {
    const saved = CyUtil.readJson(localStorage, HISTORY_KEY(Auth.id()), []);
    messages = (Array.isArray(saved) ? saved : []).filter(
      (m) => m && (m.role === "user" || m.role === "model") && typeof m.text === "string" && m.text
    );
    render();
  }

  /* transient = bong bóng chỉ để nhìn lần này (toàn văn câu báo lỗi), không
     phải nội dung hội thoại: không lưu vào localStorage, không gửi lại cho
     Gemini như một lượt "model" — nếu không AI sẽ nhớ mãi câu "chưa có key".
     Một lượt hỏi đáp lỗi thì đánh dấu cả hai, để lịch sử không còn một câu
     hỏi treo lửng không câu trả lời.

     Ảnh thì KHÔNG BAO GIỜ xuống bộ nhớ: localStorage chỉ ~5 MB cho cả trình
     duyệt, một tấm ảnh 1,5 MB base64 là ăn hết; và giữ ảnh của học sinh trong
     máy là thêm một nơi phải xin lỗi khi người khác ngồi vào máy. Vì vậy bản
     lưu chỉ ghi `soAnh` — đủ để bong bóng nói "lượt này có 2 ảnh, muốn hỏi tiếp
     thì đính lại", và người dùng biết rõ ảnh đã đi khỏi đây. */
  function save() {
    const keep = messages
      .filter((m) => !m.transient)
      .map((m) =>
        m.anh && m.anh.length
          ? { role: m.role, text: m.text, soAnh: m.anh.length, ...(m.thoiGian ? { thoiGian: m.thoiGian } : {}) }
          : m
      );
    if (!CyUtil.writeJson(localStorage, HISTORY_KEY(Auth.id()), keep)) {
      showToast("Không lưu được lịch sử chat (bộ nhớ trình duyệt đã đầy).");
    }
  }

  function addMessage(role, text, transient, anhKem, thoiGian) {
    const msg = { role, text, transient: !!transient };
    if (anhKem && anhKem.length) msg.anh = anhKem;
    if (thoiGian) msg.thoiGian = thoiGian;
    messages = messages.concat([msg]).slice(-MAX_MESSAGES);
    save();
    render();
    return msg;
  }

  function clearHistory() {
    syncAccount();
    messages = [];
    CyUtil.removeKey(localStorage, HISTORY_KEY(Auth.id()));
    render();
    $("aiInput").focus();
    showToast("Đã xoá lịch sử chat của tài khoản này.");
  }

  /* ---------- vẽ khung chat ---------- */
  /* role "system" = lời của chính app (lỗi mạng, đang chờ), không phải câu AI
     nói: không có nhãn "CySim AI" và không bao giờ được lưu hay gửi lại cho
     Gemini. */
  /* `anhKem`: mảng ảnh đang có trong RAM (lượt vừa hỏi, xem được ngay) hoặc một
     con số (lượt cũ nạp từ localStorage — chỉ còn số lượng, không còn dữ liệu).
     Ảnh chèn TRƯỚC chữ, đúng thứ tự người dùng vừa nhìn thấy. */
  function bubble(role, text, extraClass, anhKem, thoiGian) {
    const wrap = document.createElement("div");
    wrap.className = "ai-msg " + role + (extraClass ? " " + extraClass : "");
    if (role !== "system") {
      const who = document.createElement("b");
      who.textContent = role === "user" ? t("Bạn") : t("CySim AI");
      wrap.append(who);
    }
    if (Array.isArray(anhKem) && anhKem.length) {
      const dai = document.createElement("span");
      dai.className = "ai-thumbs";
      for (const a of anhKem) {
        const h = document.createElement("img");
        h.className = "ai-thumb";
        h.src = "data:" + a.mime + ";base64," + a.data;
        h.alt = t("Ảnh bạn đính kèm");
        h.title = a.ten;
        dai.append(h);
      }
      wrap.append(dai);
    } else if (typeof anhKem === "number" && anhKem > 0) {
      const ghi = document.createElement("i");
      ghi.className = "ai-img-note";
      ghi.textContent = `${anhKem} ${t("ảnh đã gửi kèm lượt này · không còn trong bộ nhớ, hỏi tiếp phải đính lại ảnh")}`;
      wrap.append(ghi);
    }
    const body = document.createElement("p");
    body.textContent = text;
    wrap.append(body);
    /* Đồng hồ ĐO THẬT, không phải trang trí: "chữ đầu" tính từ lúc bấm Gửi tới
       mảnh SSE đầu tiên, "hoàn tất" tới lúc stream đóng — cả hai đo ở máy này nên
       đã bao gồm proxy và mạng, đúng cái người dùng đang cảm nhận. Câu nào không
       đi qua mạng (hai câu danh tính trả lời tại máy) thì không có số, và vẽ
       "0,0s" cho một câu chưa từng gọi Google là nói dối. */
    if (thoiGian && role === "model") {
      const dong = document.createElement("i");
      dong.className = "ai-time";
      const so = [
        thoiGian.chieuDau > 0 ? `${t("chữ đầu")} ${leSec(thoiGian.chieuDau)}s` : "",
        thoiGian.tong > 0 ? `${t("hoàn tất")} ${leSec(thoiGian.tong)}s` : "",
      ].filter(Boolean).join(" · ");
      /* Máy chủ trả một cục JSON thay vì từng mảnh SSE (hàm serverless bị buffer)
         thì "chữ đầu" không tồn tại, nhưng tổng thời gian thì có — bỏ cả hai số
         chỉ vì thiếu một cái là để người dùng tưởng câu này chưa từng được đo. */
      /* Tên mô hình là định danh kỹ thuật (như trong #aiStatus): để ngoài t(), và
         lấy nguyên chữ máy chủ khai — không dùng tên model mà người dùng đã CHỌN,
         vì đúng lúc quá tải hai cái tên đó khác nhau. */
      const ten = String(thoiGian.model || "");
      dong.textContent = so && ten ? `${so} · ${ten}` : so || ten;
      wrap.append(dong);
    }
    return wrap;
  }

  function render() {
    const log = $("aiLog");
    if (!log) return;
    renderStatus();
    drawSendButton();
    paintProfileState();
    veRong();
    veDoSau();
    /* Ảnh và dòng "mấy ảnh / bao nhiêu MB" do JS vẽ, mà #aiImages mang
       data-no-i18n (nội dung là chữ của người dùng) nên phải tự sơn lại nhãn
       bằng t() — cùng nghĩa vụ với ô hồ sơ bên trên. */
    veAnhKem();
    /* data-no-i18n chặn engine dịch cả vùng, tính luôn thuộc tính aria-label
       của chính phần tử đó — nên nhãn này phải tự vẽ lại bằng t() mỗi lần
       đổi ngôn ngữ, nếu không nó kẹt tiếng Việt vĩnh viễn. */
    log.setAttribute("aria-label", t("Lịch sử chat"));
    log.textContent = "";
    if (messages.length) {
      for (const m of messages) log.append(bubble(m.role, m.text, "", m.anh || m.soAnh, m.thoiGian));
    } else if (!(busy && bongCho)) {
      const hint = document.createElement("p");
      hint.className = "ai-empty";
      hint.textContent = t("Chưa có hội thoại. Hãy thử hỏi: Bạn là ai? Ai đã viết ra bạn?");
      log.append(hint);
    }
    /* Đang chờ mà render() chạy giữa chừng (đổi ngôn ngữ, đổi phiên, nạp lại
       lịch sử) thì bong bóng chờ PHẢI được gắn lại — kể cả khi messages còn
       rỗng. Bản cũ đặt dòng này sau nhánh "hint" nên đúng trường hợp hay gặp
       nhất — hỏi câu đầu tiên của một tài khoản mới — lời chờ biến mất, người
       dùng thấy khung chat trống trong khi máy chủ vẫn đang trả lời, và tưởng
       app treo. */
    if (busy && bongCho) log.append(bongCho);
    log.scrollTop = log.scrollHeight;
  }

  /* ---------- trạng thái máy chủ AI ---------- */
  /* /api/health của proxy trả {ok, model, keyConfigured}. Hỏi ngay khi mở panel
     để người dùng nhìn thấy bệnh trước khi gõ (máy chủ chưa chạy, .env chưa có
     key) thay vì gõ xong mới nhận một dòng lỗi. */
  const healthUrl = () => endpoint().replace(/\/api\/gemini\/?$/, "/api/health");
  let serverState = "checking";
  let serverModel = "";

  const LOI_TRANG_THAI = {
    checking: () => t("Đang kiểm tra máy chủ AI…"),
    ready: () => t("Đã nối được máy chủ AI."),
    no_key: () => t("Máy chủ đã chạy nhưng file .env chưa có GEMINI_API_KEY."),
    offline: () => t("Máy chủ AI chưa chạy. Nháy đúp file chay-ai.bat ở thư mục dự án, hoặc mở terminal rồi chạy:"),
    file: () => t("Trang này đang mở bằng file:// nên trình duyệt chặn mọi request tới máy chủ AI. Chạy app qua http rồi mở lại:"),
    /* Bệnh KHÁC hẳn "offline": trang được mở từ một domain công khai (Netlify,
       VPS…) thì người xem không có thư mục dự án, không có chay-ai.bat và cũng
       không có Python — bảo họ đi bật là nói dối. Ở đây máy chủ AI đơn giản là
       KHÔNG TỒN TẠI ở nơi trang được phục vụ; phần còn lại của app vẫn dùng
       được vì nó chỉ cần file tĩnh. */
    remote: () => t("Bản web này không kèm máy chủ AI nên khung chat không chạy được ở đây. Mọi phòng lab, bài thi và chứng chỉ vẫn dùng bình thường."),
    /* Bệnh thứ ba, chỉ có khi MAI_CONG_KHAI trỏ sang một máy chủ ở host khác:
       trình duyệt CÓ một địa chỉ để gọi, nên nói "bản web này không kèm máy chủ
       AI" là sai sự thật. Host miễn phí (Render…) ngủ sau ~15 phút không ai hỏi
       nên lần gọi đầu thường trượt; cũng có thể URL sai hoặc máy chủ chưa chạy.
       Câu chữ phải chỉ được cả ba đường, và đừng đổ lỗi cho người đang đọc nó. */
    external: () => t("Không gọi được máy chủ AI ở địa chỉ đã khai. Máy chủ miễn phí có thể đang ngủ — bấm Thử lại và chờ một phút; nếu vẫn im thì máy chủ chưa chạy, hoặc chưa khai tên trang này vào CYSIM_ORIGINS."),
    /* Mất internet KHÔNG giống chưa bật máy chủ: proxy nằm trên chính máy này nên
       vẫn sống, chỉ có Google là không gọi được. Gộp hai bệnh thành một là bảo
       người ta đi bật lại một thứ đang chạy — và làm hỏng luôn lời hứa "app học
       được cả khi mất mạng", vì phần còn lại vẫn dùng tốt. */
    no_net: () => t("Máy này đang mất internet. App và mọi phòng lab vẫn học được — riêng AI và tra cứu IP cần mạng."),
  };

  function renderStatus() {
    const box = $("aiStatus");
    if (!box) return;
    box.hidden = false;
    box.setAttribute("data-state", serverState);
    /* Cùng lý do với #aiLog: data-no-i18n chặn luôn thuộc tính, nên aria-label
       phải tự vẽ lại ở đây. */
    box.setAttribute("aria-label", t("Trạng thái máy chủ AI"));
    box.textContent = "";
    box.append(document.createElement("i"), document.createTextNode(LOI_TRANG_THAI[serverState]()));
    /* Tên lệnh và tên mô hình là định danh kỹ thuật, giữ nguyên ở mọi thứ tiếng
       nên mới nằm ngoài t() và nằm trong <code>. */
    const tech = document.createElement("code");
    if (serverState === "offline") tech.textContent = "python server/gemini_proxy.py";
    else if (serverState === "file") tech.textContent = "python -m http.server 8137 --bind 127.0.0.1";
    /* Bản công khai phải IN RA đúng URL đã gọi: người deploy cần biết là app đang
       gõ cửa "/api/gemini" cùng nguồn hay một host khai ở MAI_CONG_KHAI — hai bệnh
       khác nhau, sửa ở hai chỗ khác nhau. Định danh kỹ thuật nên nằm ngoài t(),
       giống hai dòng lệnh ở trên. */
    else if (serverState === "remote" || serverState === "external") tech.textContent = noiGoi(healthUrl());
    else if (serverState === "ready" && serverModel) tech.textContent = serverModel;
    if (tech.textContent) box.append(document.createTextNode(" "), tech);
    /* Nút "Thử lại": người dùng vừa nháy đúp chay-ai.bat thì phải có cách hỏi lại
       NGAY TẠI CHỖ. checkServer() chỉ chạy lúc mở panel và lúc bấm Gửi, nên không
       có nút này thì cách duy nhất để biết máy chủ đã sống là đóng/mở panel hoặc gửi
       nhầm một câu — đúng cái vòng lặp khiến "AI không chạy" trông như lỗi app.
       Ở trạng thái "file" thì thử lại vô nghĩa (trình duyệt chặn tận nơi), nên
       không vẽ nút. "no_net" thì CÓ nút: cắm lại cáp rồi bấm tại chỗ nhanh hơn là
       đóng/mở cả khung. "remote" cũng có: người deploy vừa gắn máy chủ AI vào
       domain thì bấm một cái là biết nó sống, không cần tải lại cả trang.
       "external" càng phải có: host miễn phí thức dậy sau cú gọi đầu, nên bấm
       Thử lại lần hai khoảng một phút sau là đường thoát duy nhất tại chỗ. */
    if (serverState === "offline" || serverState === "no_key" || serverState === "no_net" || serverState === "remote" || serverState === "external") {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "ai-retry";
      retry.textContent = t("Thử lại");
      retry.addEventListener("click", () => {
        serverState = "checking";
        renderStatus();
        checkServer();
      });
      box.append(retry);
    }
  }

  async function checkServer() {
    renderStatus();
    /* file:// thì không fetch nào đi được, kể cả khi proxy đang chạy tốt. Phải
       nói thẳng bệnh ở đây: để lọt xuống nhánh offline là bảo người ta đi bật
       máy chủ vốn đã bật, còn lỗi thật (mở trang bằng nháy đúp) thì không ai
       nhắc tới. */
    if (location.protocol === "file:") {
      serverState = "file";
      serverModel = "";
      renderStatus();
      return;
    }
    /* navigator.onLine chỉ nói trình duyệt có biết mạng hay không — một mạng LAN
       không có lối ra internet vẫn báo "true". Vì vậy đây là CHẨN ĐOÁN SỚM để nói
       đúng bệnh, không phải hàng rào: bệnh thật vẫn đi qua các mã lỗi của máy chủ
       (api / unknown / overloaded) ở dưới. */
    if (navigator.onLine === false) {
      serverState = "no_net";
      serverModel = "";
      renderStatus();
      return;
    }
    let next = mayChuCuaToi() ? "offline" : mayChuBenNgoai() ? "external" : "remote";
    let model = "";
    try {
      const res = await fetch(healthUrl());
      const data = await res.json().catch(() => null);
      if (data && data.ok === true) {
        model = String(data.model || "");
        next = data.keyConfigured ? "ready" : "no_key";
      }
    } catch (err) {
      /* Trên máy này: fetch bị từ chối nghĩa là chưa bật proxy, "offline" là kết
         luận đúng. Trên một domain công khai: Netlify trả về trang 404 (HTML, không
         phải JSON) nên data null và đi xuống cùng nhánh — lúc đó nói "chưa chạy
         chay-ai.bat" là bịa, vì máy chủ AI chưa hề được trang đó phục vụ. */
    }
    serverState = next;
    serverModel = model;
    renderStatus();
  }

  /* ---------- trả lời ngay tại máy khi proxy không gọi được ---------- */
  /* Danh tính là điều người dùng hay thử đầu tiên, và nó phải đúng kể cả khi
     chưa bật proxy — nên hai câu này nằm ở JS chứ không chờ Google. */
  function traLoiDanhHieu(prompt) {
    const s = prompt.toLowerCase();
    const veTacGia =
      /(ai (đã )?(viết|tạo ra|làm ra|code|lập trình)|người (viết|tạo|lập trình)|tác giả|creator|author|who (wrote|made|created)|qui (a écrit|a créé)|autor|creador|作者|開発者|作成者|誰が)/i;
    const veDanhTinh = /(bạn là ai|bạn tên gì|tên của bạn|cậu là ai|who are you|your name|qui es-tu|quién eres|あなたはだれ|何者)/i;
    if (veTacGia.test(s)) return t("Tôi do Nguyễn Trí Đức viết ra. Còn tôi là AI của CySim.");
    if (veDanhTinh.test(s)) return t("Tôi là AI của CySim.");
    return "";
  }

  /* ---------- gọi proxy ---------- */
  /* Mapped từ "code" trong server/gemini_proxy.py sang câu đã dịch. Không bao
     giờ hiện nguyên văn chữ Việt của máy chủ: màn hình đang bật tiếng Nhật mà
     nhận câu "Chưa có GEMINI_API_KEY..." thì coi như vỡ i18n. */
  function loiTuCode(code) {
    /* "offline" do chính máy này dựng khi fetch không đi được. Chỉ khi máy chủ ở
       đúng máy người dùng thì lời "bật chay-ai.bat" mới là thật; còn trên bản web
       công khai thì mượn luôn câu của trạng thái "remote" — một bệnh một lời nói,
       và không sinh thêm chuỗi thứ hai phải dịch. */
    if (code === "offline")
      return mayChuCuaToi() ? t("Không nối được máy chủ AI. Nháy đúp chay-ai.bat rồi bấm Gửi lại.") : LOI_TRANG_THAI[mayChuBenNgoai() ? "external" : "remote"]();
    /* Cùng một bệnh với dòng trạng thái ở trên, gọi lại đúng câu đó để không
       sinh thêm chuỗi thứ hai phải dịch. */
    if (code === "file") return LOI_TRANG_THAI.file();
    if (code === "no_key") return t("Máy chủ AI chưa có GEMINI_API_KEY. Điền key vào file .env rồi bấm Gửi lại, không cần bật lại máy chủ.");
    if (code === "bad_key") return t("GEMINI_API_KEY không hợp lệ hoặc chưa được bật cho mô hình này.");
    if (code === "quota") return t("Google đã hết hạn mức cho lượt này, chờ một lát rồi thử lại.");
    if (code === "overloaded") return t("Máy chủ Google đang quá tải, chưa trả lời được. Chờ một lát rồi bấm Gửi lại.");
    /* 403 do máy chủ trả khi người chạy máy chủ đã khai CYSIM_ORIGINS mà trang này
       không nằm trong danh sách — bệnh ở cấu hình máy chủ, không phải ở người dùng,
       nên câu chữ phải chỉ đúng chỗ sửa (và không đổ lỗi cho họ). */
    if (code === "forbidden") return t("Máy chủ AI không nhận lời hỏi từ trang này. Người chạy máy chủ cần khai tên trang vào CYSIM_ORIGINS.");
    if (code === "api") return t("Google Gemini báo lỗi. Chi tiết nằm ở console (F12).");
    if (code === "empty") return t("Gemini trả về nội dung rỗng. Hãy hỏi lại theo cách khác.");
    if (code === "too_long") return t("Câu hỏi dài quá, hãy rút ngắn lại.");
    /* Mất mạng: cùng một câu với dòng trạng thái, không sinh chuỗi thứ hai phải dịch. */
    if (code === "no_net") return LOI_TRANG_THAI.no_net();
    /* Hai mã ảnh do server/gemini_proxy.py trả về. Máy đã chặn trước ở 3 ảnh ×
       1,5 MB nên đường thường gặp nhất là payload được dựng bằng tay (F12) hoặc
       một proxy cũ hơn; câu dịch vẫn phải đúng để màn hình không hiện tiếng Việt
       khô khan trên giao diện tiếng Nhật. */
    if (code === "bad_image")
      return t("Máy chủ không nhận ảnh kèm theo (sai định dạng hoặc quá số ảnh cho phép). Thử lại với 1-2 tấm PNG/JPEG/WebP/GIF.");
    if (code === "too_large")
      return t("Ảnh gửi lên vượt trần dung lượng của máy chủ. Bỏ bớt ảnh hoặc chọn tấm nhẹ hơn.");
    return t("AI không trả lời được. Xem console (F12) để biết chi tiết.");
  }

  /* ask(prompt, onDelta, hieu, anhKem) -> {text, code, model}. onDelta được gọi cho
     từng MẢNH chữ lúc stream chạy, nên màn hình có chữ dần thay vì chờ nguyên phút
     rồi mới thấy cả câu. `hieu` là AbortController cho nút Dừng. `anhKem` là mảng ảnh
     ĐÃ thu nhỏ của riêng lượt này. `model` = tên mô hình máy chủ báo đã thật sự trả
     lời (rỗng khi không gọi tới Google). Giao diện luôn xin stream ("stream":true); nếu
     máy chủ trả JSON thường — proxy cũ chưa biết stream, hoặc một hàm serverless bị
     buffer như Netlify Function — thì đọc nguyên văn {ok, text, model} của nó, chỉ
     những gì thật sự thiếu mới đi đường lỗi. */
  async function ask(prompt, onDelta, hieu, anhKem) {
    /* file:// thì request không "chết ngay" mà treo vô hạn: đo thực tế là khung
       chờ đếm tới 13s rồi đếm mãi. Chặn ở đây để người dùng nhận câu hướng dẫn
       sau một nhịp, thay vì ngồi đợi một thứ không bao giờ về. */
    if (location.protocol === "file:") return { text: "", code: "file" };
    /* Mất mạng thì cũng đừng mở một request không bao giờ có câu trả lời: proxy
       trên máy vẫn trả lời được, nhưng tới Google là đứt. */
    if (navigator.onLine === false) return { text: "", code: "no_net" };
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: hieu ? hieu.signal : undefined,
      body: JSON.stringify({
        prompt,
        // Ngôn ngữ đang hiển thị: server dùng nó để ép câu trả lời đúng thứ
        // tiếng. Không có trường này thì mô hình hay trả lời tiếng Anh chỉ vì
        // lịch sử gửi kèm toàn tiếng Anh.
        lang: currentLang,
        stream: true,
        /* Ô #aiDepth: "nhanh" | "can-bang" | "ky". Máy chủ tra DEPTH_MAP rồi đổi
           trần token (và model với mức "ky"). Luôn gửi dù là mặc định để một lần
           chỉnh trong ngày áp cho mọi lượt, không phải lựa chọn vô hình. */
        depth: docDoSau(),
        // Hồ sơ người dùng TỰ ĐIỀN trong #aiProfileInput (mặc định rỗng).
        // Rỗng thì proxy bỏ hẳn khối "HỒ SƠ NGƯỜI HỌC" khỏi system_instruction:
        // không có gì riêng tư rời khỏi máy nếu người dùng không chủ ý gõ.
        profile: hoSo.trim(),
        /* Ảnh đính kèm: chỉ lượt này, không nằm trong history. Không gửi trường
           này khi rỗng để payload của một câu hỏi thường y hệt như trước. */
        ...(anhKem && anhKem.length
          ? { images: anhKem.map((a) => ({ mime: a.mime, data: a.data })) }
          : {}),
        // messages đã gồm câu vừa gõ; gửi lên thì bỏ câu cuối, proxy tự nối.
        history: messages
          .filter((m) => !m.transient)
          .slice(0, -1)
          .slice(-16)
          .map((m) => ({ role: m.role, text: m.text })),
      }),
    });
    const kieu = (res.headers.get("content-type") || "").toLowerCase();
    if (!res.ok || !kieu.includes("text/event-stream")) {
      const data = await res.json().catch(() => null);
      /* Một máy chủ KHÔNG mở được SSE vẫn có thể trả lời đầy đủ: Netlify Function
         (và mọi AWS Lambda) bị buffer toàn bộ response nên không phát từng mảnh
         được, chúng trả {ok:true, text, model} kiểu JSON. Bỏ lọt nhánh này thì câu
         trả lời nằm ngay trong tay vẫn bị báo "AI không trả lời được" — lỗi hiển
         thị, không phải lỗi máy chủ. */
      if (res.ok && data && data.ok === true && typeof data.text === "string" && data.text.trim())
        return { text: data.text.trim(), code: "", model: String(data.model || "") };
      if (data) console.warn("[ai] server trả lỗi:", data.code, data.error);
      /* Host tĩnh (Netlify, GitHub Pages…) không có đường /api/gemini: nó trả về
         trang 404/501 bằng HTML, không có JSON chứa mã lỗi. Trên một domain công
         khai thì đó chỉ có một nghĩa: nơi này không kèm máy chủ AI. Nói thẳng như
         thế bằng đúng câu của trạng thái "remote" thay vì đuổi người dùng đi mở
         console (F12) tìm lỗi của một thứ chưa từng tồn tại. */
      if (!data && !mayChuCuaToi()) return { text: "", code: "offline" };
      return { text: "", code: (data && data.code) || "unknown" };
    }

    const reader = res.body.getReader();
    const giaiMa = new TextDecoder();
    let dem = ""; // phần byte chưa trọn một event
    let text = "";
    let code = "";
    let daDung = ""; // tên model máy chủ khai ở event chót — để hiển thị đúng cái đã trả lời
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      dem += giaiMa.decode(value, { stream: true });
      const events = dem.split("\n\n");
      dem = events.pop(); // event cuối còn dở, để lại lượt đọc sau
      for (const e of events) {
        const line = e.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;
        let obj = null;
        try {
          obj = JSON.parse(line.slice(6));
        } catch {
          continue; // dòng rác không làm hỏng cả câu trả lời đã về
        }
        if (typeof obj.delta === "string") {
          text += obj.delta;
          onDelta(obj.delta);
        } else if (obj.ok === true) {
          text = String(obj.text || text);
          /* Máy chủ KHAI cái tên đã thật sự trả lời — khi Google quá tải thì đó
             là GEMINI_FALLBACK_MODEL chứ không phải model chính. Bỏ qua trường
             này là để màn hình báo tên một mô hình chưa từng chạy. */
          if (obj.model) daDung = String(obj.model);
        } else if (obj.ok === false) {
          code = String(obj.code || "unknown");
          console.warn("[ai] stream báo lỗi:", code, obj.error);
        }
      }
    }
    text = text.trim();
    return { text, code: code || (text ? "" : "empty"), model: daDung };
  }

  /* ---------- vòng hỏi/đáp ---------- */
  let busy = false;
  let hieu = null; // AbortController của lượt đang chờ, nút Dừng dùng nó
  let bongCho = null; // node đang chờ ("Đang soạn…" hoặc chữ đang stream) để render() gắn lại

  /* Google báo quá tải là chuyện xảy ra THẬT hàng ngày và một lượt có thể kéo
     30-60 giây. Để người dùng ngồi nhìn một khung "Đang soạn…" không có lối thoát
     thì giống treo app hơn là chậm. Nút Gửi biến thành DỪNG khi đang chờ, và
     dòng chờ đếm giây để biết máy chủ thật sự đang làm gì.
     Mốc 60s là có lý: key bị Google xếp hàng (đo 27-10-2026: 170-192 s cho MỌI
     cấu hình, kể cả câu trả lời 8 token) thì không có gì trong app cứu được,
     nên nói to nguyên nhân ngay lúc người dùng đang khó chịu nhất. */
  function dangCho(tongGiay) {
    if (tongGiay < 8) return t("Đang soạn câu trả lời…");
    if (tongGiay < 60) return t("Máy chủ AI đang chậm… đã chờ") + " " + tongGiay + "s";
    return (
      t("Vẫn chưa có chữ nào sau") +
      " " + tongGiay + "s — " +
      t("key Gemini này đang bị Google xếp hàng. Cách duy nhất hết chậm: thay key mới trong .env rồi bật lại chay-ai.bat.")
    );
  }

  /* Nhãn nút do app vẽ lại từ t() chứ không để engine i18n dịch một lần: lúc đang
     chờ thì trên nút PHẢI là "Dừng", và đổi ngôn ngữ giữa lúc chờ không được
     phép vẽ lại thành "Gửi" rồi mất luôn lối thoát. */
  function drawSendButton() {
    const nut = $("aiSend");
    if (nut) nut.textContent = busy ? t("Dừng") : t("Gửi");
  }

  function setBusy(on) {
    busy = on;
    drawSendButton();
  }

  async function send(rawText) {
    syncAccount();
    if (busy) {
      /* Nút Gửi lúc này là nút Dừng, và Enter cũng đi tới đây. Chữ người dùng
         đang gõ KHÔNG bị xoá trên đường này: dừng một lượt chờ 60 giây rồi mất
         luôn câu hỏi là hai lần bực mình thay vì một. */
      if (hieu) hieu.abort();
      return;
    }
    const prompt = (rawText || "").trim().slice(0, MAX_PROMPT_CHARS);
    if (!prompt) {
      /* Ảnh mà không có chữ thì không biết hỏi gì: "xem ảnh này đi" là một câu
         hỏi, im lặng gửi ảnh lên thì Google trả về một đoạn mô tả chung chung.
         Giữ ảnh lại trên màn hình và nói to lý do, không âm thầm xoá. */
      if (anh.length) showToast("Đã có ảnh, nhưng chưa có câu hỏi — gõ vài chữ rồi bấm Gửi.");
      return;
    }
    $("aiInput").value = "";
    /* Ảnh chỉ sống cho đúng một lượt: gỡ khỏi khay đính kèm NGAY TRƯỚC khi gửi
       để không ai tưởng nhầm tấm ảnh này sẽ đi kèm mọi câu hỏi về sau. */
    const anhHoi = anh;
    anh = [];
    veAnhKem();
    const hoi = addMessage("user", prompt, false, anhHoi);

    setBusy(true);
    hieu = new AbortController();
    const log = $("aiLog");
    const pending = bubble("system", dangCho(0), "ai-pending");
    bongCho = pending;
    log.append(pending);
    log.scrollTop = log.scrollHeight;

    const giayBatDau = Date.now();
    const dongHo = setInterval(() => {
      if (live) return; // đã có chữ thì để bong bóng thật nói
      pending.lastChild.textContent = dangCho(Math.round((Date.now() - giayBatDau) / 1000));
    }, 1000);

    /* Chữ về tới đâu vẽ tới đó. pending đứng thay chỗ cho tới mảnh đầu tiên,
       sau đó một bong bóng "model" lớn dần chiếm chỗ — người dùng thấy máy
       đang viết chứ không phải màn hình đứng im cả phút. */
    let live = null;
    let liveBody = null;
    let mochDau = 0; // Date.now() của mảnh SSE đầu tiên — mốc "chữ đầu" trong đồng hồ
    let daVe = ""; // mọi mảnh chữ đã về, dùng lại nếu người dùng bấm Dừng giữa stream
    const onDelta = (doan) => {
      if (!mochDau) mochDau = Date.now();
      daVe += doan;
      if (!live) {
        pending.remove();
        live = bubble("model", "");
        bongCho = live;
        liveBody = live.lastChild;
        log.append(live);
      }
      liveBody.textContent += doan;
      log.scrollTop = log.scrollHeight;
    };

    let answer = "";
    let code = "";
    let tuMay = false;
    let doDung = false;
    let tenModel = ""; // máy chủ tự khai đã dùng model nào cho lượt này
    try {
      const ketQua = await ask(prompt, onDelta, hieu, anhHoi);
      answer = ketQua.text;
      code = ketQua.code;
      tenModel = ketQua.model || "";
    } catch (err) {
      if (err && err.name === "AbortError") {
        doDung = true;
      } else {
        // fetch từ chối khi máy chủ chưa chạy, DNS lỗi hoặc mạng đứt
        console.warn("[ai] không gọi được máy chủ:", err);
        code = "offline";
      }
    }
    clearInterval(dongHo);
    hieu = null;
    /* Đồng hồ cho bong bóng: "chữ đầu" là lúc mảnh SSE đầu tiên tới màn hình,
       "hoàn tất" là lúc stream đóng. Bấm Dừng giữa chừng thì mốc "hoàn tất" là lúc bấm —
       vẫn là thời gian thật người dùng đã ngồi chờ, không phải con số bịa. */
    const thoiGian = mochDau || tenModel
      ? { chieuDau: (mochDau - giayBatDau) / 1000, tong: (Date.now() - giayBatDau) / 1000, model: tenModel }
      : null;
    bongCho = null; // từ đây render() vẽ bằng messages, không bằng node tạm nữa
    pending.remove();
    if (live) live.remove(); // bản vẽ tạm bỏ đi, addMessage bên dưới vẽ lại một lần
    /* Bấm Dừng không xoá được chữ mà máy chủ đã viết xong: bỏ nó đi là làm mất
       bài, giữ lại rồi nói rõ là dang dở mới đúng chuyện đã xảy ra. */
    if (!answer && doDung) answer = daVe.trim();
    if (!answer) {
      answer = traLoiDanhHieu(prompt);
      if (answer) tuMay = true; // câu danh tính vẫn là nội dung hội thoại thật
    }

    /* Stream đứt giữa chừng: mảnh chữ đã về vẫn là câu trả lời thật thì lưu
       lại, và nói THÊM nguyên nhân bằng một dòng hệ thống — ẩn cả hai là mất
       bài, mà im luôn thì người dùng tưởng app tự ý cắt. */
    if (answer) addMessage("model", answer, false, null, thoiGian);
    if (doDung) {
      if (!answer) hoi.transient = true;
      addMessage(
        "system",
        answer
          ? t("Đã dừng. Phần máy chủ kịp viết nằm ở trên, hỏi lại bất cứ lúc nào.")
          : t("Đã dừng, chưa có chữ nào từ máy chủ."),
        true
      );
    } else if (code && !tuMay) {
      if (!answer) {
        /* Đánh dấu câu hỏi là transient: lịch sử không được lưu một lượt hỏi
           treo lửng không có trả lời. */
        hoi.transient = true;
        /* Lượt hỏi thất bại thì ảnh chưa đi tới đâu cả — trả nó về khay đính kèm
           để người dùng sửa bệnh (bật máy chủ, cắm lại mạng) rồi bấm Gửi lại
           là đủ, không phải chọn lại tấm ảnh. */
        if (anhHoi.length && !anh.length) {
          anh = anhHoi;
          veAnhKem();
        }
      }
      addMessage("system", loiTuCode(code), true);
      checkServer(); // hỏi lại /api/health: chưa chạy máy chủ hay chưa có key?
    }
    setBusy(false);
  }

  /* ---------- mở / đóng ---------- */
  function setOpen(open) {
    const panel = $("aiPanel");
    if (panel.hidden === !open) return;
    panel.hidden = !open;
    $("aiFab").setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("ai-open", open);
    if (open) {
      $("aiInput").focus();
      checkServer(); // biết máy chủ sống/chết ngay lúc mở, không phải sau khi gửi
    } else {
      /* Đóng bằng Esc/✕ mà để focus rơi về <body> thì người dùng bàn phím phải
         Tab lại từ đầu trang. Trả nó về đúng nút đã mở panel. */
      $("aiFab").focus();
    }
    syncAccount();
  }

  const toggle = () => setOpen($("aiPanel").hidden);

  function bind() {
    $("aiFab").addEventListener("click", toggle);
    $("aiClose").addEventListener("click", () => setOpen(false));
    $("aiClear").addEventListener("click", clearHistory);
    $("aiForm").addEventListener("submit", (e) => {
      e.preventDefault();
      send($("aiInput").value);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("aiPanel").hidden) setOpen(false);
    });
    /* Panel đang mở là vùng làm việc của người dùng bàn phím: Tab quay vòng
       trong khung, không lọt sang trang đứng sau. Đây không phải bẫy phím vì
       lối ra luôn có và được nói ngay trên nút — Esc hoặc ✕ (title="Esc").
       Cùng một CyUtil.trapFocus mà auth.js dùng cho bảng đăng nhập. */
    $("aiPanel").addEventListener("keydown", (e) => CyUtil.trapFocus($("aiPanel"), e));
    /* Ô hồ sơ: gõ tới đâu lưu tới đó (đúng tài khoản đang dùng) và vẽ lại dòng
       "đang gửi / không gửi" để người dùng luôn biết lượt hỏi sau sẽ mang theo
       chữ gì. Không có giá trị nào được điền sẵn — muốn cá nhân hoá là phải tự
       gõ, đây là lựa chọn có ý thức chứ không phải mặc định âm thầm. */
    $("aiProfileInput").addEventListener("input", (e) => saveProfile(e.target.value.slice(0, 2000)));
    /* ---------- ảnh ----------
       Ba đường vào: nút "Đính ảnh" (m hộp chọn file của trình duyệt), kéo-thả
       vào khung chat, và Ctrl+V ngay trong ô gõ. Cả ba cùng đi qua themAnh()
       nên một tấm ảnh to đều được thu nhỏ y hệt nhau. */
    $("aiImageBtn").addEventListener("click", () => $("aiImageInput").click());
    $("aiImageInput").addEventListener("change", (e) => {
      themAnh(e.target.files);
      e.target.value = ""; // cho phép chọn lại ĐÚNG file vừa bỏ: không reset thì change không cháy
    });
    $("aiInput").addEventListener("paste", anhTuSuKien);
    const panel = $("aiPanel");
    panel.addEventListener("dragover", (e) => {
      if (!(e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files"))) return;
      e.preventDefault(); // trình duyệt mặc định mở toang file ảnh ra tab mới khi thả
      e.dataTransfer.dropEffect = "copy";
      panel.classList.add("ai-drop");
    });
    panel.addEventListener("dragleave", (e) => {
      if (!e.relatedTarget || !panel.contains(e.relatedTarget)) panel.classList.remove("ai-drop");
    });
    panel.addEventListener("drop", (e) => {
      panel.classList.remove("ai-drop");
      anhTuSuKien(e);
    });
    /* ---------- phóng to ---------- */
    $("aiExpand").addEventListener("click", daoRong);
    /* ---------- độ sâu ---------- */
    /* Chỉ ghi lựa chọn, không hỏi lại máy chủ: /api/health đã trả bảng DEPTH_MAP
       nhưng đổi mức độ không cần biết bảng — đổi xong bấm Gửi là đủ. */
    $("aiDepth").addEventListener("change", (e) => {
      const ma = e.target.value;
      if (DO_SAU.some(([m]) => m === ma)) localStorage.setItem(DEPTH_KEY, ma);
      veDoSau();
    });
    /* auth.js phát khi phiên đổi (đăng nhập / đăng xuất): hội thoại cũ phải
       biến mất khỏi DOM ngay, không chờ người dùng bấm vào panel. */
    document.addEventListener("cysim:session", syncAccount);
    /* Cắm/bật lại mạng thì dòng trạng thái phải tự hết báo "mất internet" ngay,
       không chờ người dùng đóng/mở khung chat. */
    window.addEventListener("online", checkServer);
    window.addEventListener("offline", checkServer);
  }

  bind();
  syncAccount();

  Labs.ai = { render, open: setOpen, toggle, themAnh, soAnh: () => anh.length };
})();
