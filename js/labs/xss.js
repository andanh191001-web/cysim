/* =========================================================
   CySim — labs/xss.js  ·  phòng lab "XSS: mã độc chạy trong bình luận"

   LÀ GÌ   : Khung "bình luận" render payload HTML của học viên. Script
             trong đó chạy THẬT, nhưng trong srcdoc của một iframe
             sandbox="allow-scripts" — không allow-same-origin nên mã độc
             không đọc nổi cookie hay chạm tới trang cha.
   CHẠY     : Chọn chế độ (#xssUnsafeBtn / #xssSafeBtn) -> bấm payload mẫu
             [data-xss-payload] hoặc tự gõ -> #runXss. unsafe nhét thẳng vào
             srcdoc nên script chạy; safe thì CyUtil.esc() đổi thành HTML
             entity nên chỉ hiện ra chữ thường. Payload có <script, onerror=,
             onload=, <svg, <iframe mới tính là khai thác thành công; cũng
             payload đó ở chế độ safe = chặn thành công (nhiệm vụ xss).
   CHẠM TỚI : #xssUnsafeBtn, #xssSafeBtn, #xssInput, #runXss, #xssPreview,
             #xssVerdict, [data-xss-payload]; global t(), $(), CyUtil.esc,
             complete(); đăng ký Labs.xss.paint để boot.js vẽ lại nhãn hai
             nút chế độ.
   ========================================================= */

(function () {
  let mode = "unsafe";

  function paint() {
    const unsafe = mode === "unsafe";
    $("xssUnsafeBtn").style.cssText = unsafe ? "background:var(--red);border-color:var(--red);color:#fff" : "background:none;color:var(--cyan)";
    $("xssSafeBtn").style.cssText = unsafe ? "" : "background:var(--ok);border-color:var(--ok);color:#04121a";
    $("xssSafeBtn").classList.toggle("ghost", unsafe);
  }

  $("xssUnsafeBtn").addEventListener("click", () => { mode = "unsafe"; paint(); });
  $("xssSafeBtn").addEventListener("click", () => { mode = "safe"; paint(); });

  document.querySelectorAll("[data-xss-payload]").forEach((b) =>
    b.addEventListener("click", () => { $("xssInput").value = b.dataset.xssPayload; })
  );

  function wrap(inner) {
    return `<!doctype html><meta charset="utf-8">
<body style="font-family:sans-serif;background:#0b1326;color:#e4ebf7;padding:16px;margin:0">
<div style="border-bottom:1px solid #222f4d;padding-bottom:8px;margin-bottom:10px;color:#8593b0;font-size:12px">${t("📝 Bình luận của bạn:")}</div>
<div>${inner}</div>
</body>`;
  }

  $("runXss").addEventListener("click", () => {
    const payload = $("xssInput").value;
    const verdict = $("xssVerdict");
    verdict.className = "verdict";
    const dangerous = /<script|onerror=|onload=|<svg|<iframe/i.test(payload);

    if (mode === "unsafe") {
      $("xssPreview").srcdoc = wrap(payload);
      verdict.className = "verdict show bad";
      if (dangerous) {
        verdict.textContent = t("XSS THÀNH CÔNG — Mã JavaScript độc hại đã chạy trong trình duyệt nạn nhân!");
        complete("xss", "Đã khai thác lỗ hổng XSS qua innerHTML");
      } else {
        verdict.textContent = t("Payload đã render — Nhưng không chứa script nguy hiểm, hãy thử payload khác!");
      }
    } else {
      $("xssPreview").srcdoc = wrap(CyUtil.esc(payload));
      verdict.className = "verdict show good";
      verdict.textContent = t("AN TOÀN — Payload đã bị encode thành HTML entity, JavaScript không thể thực thi.");
      if (dangerous) complete("xss", "Đã thử XSS ở chế độ An toàn (bị chặn)");
    }
  });

  Labs.xss = { paint };
})();
