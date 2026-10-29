/* =========================================================
   CySim — boot.js  ·  điểm khởi động

   LÀ GÌ   : File cuối cùng trong <body>, chỉ có nhiệm vụ "bật công tắc".
   CHẠY     : Auth.gate(startApp) -> nếu chưa đăng nhập thì dựng màn hình
             đăng nhập rồi dừng ở đó; hợp lệ mới chạy startApp(): đọc tiến độ
             đã lưu (API.getMissions) -> renderProgress() vẽ thanh XP/cấp ->
             Labs.sqli.paint() + Labs.xss.paint() vẽ lại nhãn hai nút
             "An toàn / Không an toàn" -> showView("dashboard") — trừ khi bài
             thi tốt nghiệp đang làm dở thì về "certificate".
   TOÀN CẦU : đọc Labs.*, Auth, API, showView, renderProgress; không định nghĩa
             gì thêm, nên đổi tên hàm ở app.js sẽ làm file này vỡ theo.
   ========================================================= */

async function startApp() {
  renderProgress();
  await loadSavedMissions();
  Labs.sqli?.paint();
  Labs.xss?.paint();
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
