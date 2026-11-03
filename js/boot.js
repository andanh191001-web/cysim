/* =========================================================
   CySim — boot.js  ·  điểm khởi động

   LÀ GÌ   : File cuối cùng trong <body>, chỉ có nhiệm vụ "bật công tắc".
   CHẠY     : Auth.gate(startApp) -> nếu chưa đăng nhập (kể cả chưa bấm "Vào
             học ngay") thì dựng màn hình đăng nhập rồi dừng ở đó; hợp lệ mới
             chạy startApp() theo đúng thứ tự: taiDuLieuKhach() dời công học của
             chế độ khách về tài khoản vừa mở -> Flags.paint() vẽ sidebar + nút
             AI theo công tắc quản trị -> paintAdminNav()/paintSettings() hiện
             nút "Quản trị" và tick đúng ô Cài đặt -> đọc tiến độ đã lưu
             (API.getMissions) -> renderProgress() vẽ thanh XP/cấp ->
             Search.init() nối Ctrl+K và nút tìm kiếm -> showView("dashboard") —
             trừ khi bài thi tốt nghiệp đang làm dở thì về "certificate".
             Nhãn "An toàn / Không an toàn" của lab SQLi/XSS KHÔNG vẽ ở đây nữa:
             từ 30-10-2026 hai file lab đó nạp chậm theo trang, và app.js vẽ lại
             đúng lúc trang mở (VE_SAUKHI_NAP trong js/app.js).
             Ba bước đầu bắt buộc phải ở đây chứ không ở app.js: lúc app.js nạp
             thì auth.js chưa tồn tại nên Auth.id() chưa đọc được.
   TOÀN CẦU : đọc Labs.*, Auth, API, showView, renderProgress, Flags,
             paintAdminNav, paintSettings, taiDuLieuKhach; không định nghĩa gì
             thêm, nên đổi tên hàm ở app.js sẽ làm file này vỡ theo.
   ========================================================= */

async function startApp() {
  /* Ba dòng đầu là "áp dụng những gì đã lưu lên màn hình thật", và bắt buộc
     phải chạy ở đây chứ không ở ngay trong app.js: lúc app.js nạp thì auth.js
     chưa tồn tại nên Auth.id() chưa đọc được, còn đây là điểm đầu tiên vừa có
     phiên đăng nhập vừa có DOM hoàn chỉnh.
       - taiDuLieuKhach(): công học làm ở chế độ khách dời về tài khoản vừa mở;
       - Flags.paint(): sidebar và nút AI phải hiện đúng công tắc quản trị NGAY
         lần mở đầu, không chờ tới khi người dùng bấm vào một trang bị tắt;
       - paintAdminNav()/paintSettings(): nút "Quản trị" chỉ hiện với tài khoản
         có role admin, trang Cài đặt phải tick đúng ô người dùng đang chọn. */
  taiDuLieuKhach();
  Flags.paint();
  paintAdminNav();
  paintSettings();
  await loadSavedMissions();
  /* Hai nhãn "An toàn / Không an toàn" của lab SQLi và XSS không còn vẽ ở đây:
     từ 30-10-2026 script của hai phòng lab đó chỉ được nạp khi người dùng mở
     trang tương ứng (xem napTrang/VE_SAUKHI_NAP trong app.js), nên tại thời điểm
     này Labs.sqli và Labs.xss chưa tồn tại — gọi tiếp ở đây thành hai dòng vô
     nghĩa, và vẽ thật thì đã có VE_SAUKHI_NAP lo đúng lúc file về tới. */
  /* Ô tìm kiếm chỉ gắn nghe nút + phím, còn chỉ mục dựng chậm ở lần mở đầu,
     nên đặt ở đây là vừa: DOM đã dịch xong, chưa có gì phải dọn khi đóng. */
  Search.init();
  /* Đang dở phòng thi mà F5: đưa về thẳng trang Chứng chỉ, nơi bài thi nằm,
     chứ không thả ra dashboard rồi chặn mọi nút điều hướng ở đó. */
  showView(Labs.exam?.dangLam() ? "certificate" : "dashboard");
}

async function loadSavedMissions() {
  try {
    completedMissions = new Set(await API.getMissions());
  } catch (e) {
    console.warn("[boot] Không tải được tiến độ đã lưu, bắt đầu từ 0:", e);
    completedMissions = new Set();
  }
  await renderProgress();
}

Auth.gate(startApp);
