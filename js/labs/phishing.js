/* =========================================================
   CySim — labs/phishing.js  ·  phòng lab "Bẫy lừa đảo Phishing"

   LÀ GÌ   : Hai trang đăng nhập đặt cạnh nhau (thật và giả mạo). Người học
             phải chỉ ra 3 điểm bất thường.
   CHẠY     : Mọi phần tử có data-spot đều nghe click -> đánh dấu .found và
             tăng bộ đếm -> bấm đúng nút "Đăng nhập" của trang giả (spot
             "btn") nghĩa là đã nộp mật khẩu cho hacker, bật banner
             #phishCaught. Đủ 3 điểm thì in kết luận; nếu đã bấm nút giả thì
             lời khen nói luôn đó là bài học, không để banner "bị hack" đối
             nghịch với chữ "XUẤT SẮC".
   CHẠM TỚI : [data-spot], #phishScore, #phishCaught, #phishVerdict; global
              t(), complete(); đăng ký Labs.phishing.reset() để app.js gọi
              khi rời view — reset xoá cả chữ kết luận cũ, không chỉ ẩn bằng
              class, để không còn vết của lần chơi trước.
   ========================================================= */

(function () {
  const TOTAL_SPOTS = 3;
  const found = new Set();
  let caught = false;

  document.querySelectorAll("[data-spot]").forEach((el) => {
    el.addEventListener("click", () => {
      const type = el.dataset.spot;
      if (found.has(type)) return;
      el.classList.add("found");
      found.add(type);
      $("phishScore").textContent = `${found.size}/${TOTAL_SPOTS}`;

      // Nhấn đúng nút "Đăng nhập" của trang giả mạo = đã gửi mật khẩu cho hacker
      if (type === "btn") {
        caught = true;
        $("phishCaught").hidden = false;
      }

      if (found.size === TOTAL_SPOTS) {
        const verdict = $("phishVerdict");
        verdict.className = "verdict show good";
        /* Hai trạng thái phải nói cùng một chuyện: nếu người dùng đã bấm nút
           giả mạo thì lời khen phải gọi thẳng đó là bài học, đừng để banner
           "bị hack" đứng đối nghịch với kết luận "XUẤT SẮC". */
        verdict.textContent = caught
          ? t("XUẤT SẮC — Bạn đã nhận diện đủ 3 điểm lừa đảo. Lần bấm nút vừa rồi chính là cách mật khẩu bị đánh cắp.")
          : t("XUẤT SẮC — Bạn đã nhận diện chính xác 3 điểm lừa đảo!");
        complete("phish", "Vạch mặt thành công Bẫy lừa đảo Phishing");
      }
    });
  });

  Labs.phishing = {
    reset: () => {
      found.clear();
      caught = false;
      document.querySelectorAll("[data-spot]").forEach((el) => el.classList.remove("found"));
      $("phishScore").textContent = "0/" + TOTAL_SPOTS;
      $("phishCaught").hidden = true;
      // Xóa luôn chữ cũ: ẩn bằng class thì text vẫn nằm trong DOM, người đọc
      // bằng màn hình ảo hoặc xem lại source sẽ thấy kết luận của lần chơi trước.
      $("phishVerdict").className = "verdict";
      $("phishVerdict").textContent = "";
    },
  };
})();
