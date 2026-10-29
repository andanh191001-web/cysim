/* =========================================================
   CySim — labs/certificate.js  ·  màn hình "Chứng chỉ"

   LÀ GÌ   : Tấm chứng chỉ mô phỏng tải/In ra PNG-A4. Mã chứng chỉ là hàm
             băm của (tên | cấp bậc | ngày cấp). Vì vậy bộ ba đó phải đi
             cùng nhau: mốc thời gian được lưu RIÊNG cho từng cặp tên + cấp
             bậc, nên đổi tên hay lên cấp đều ra ngày cấp mới khớp với code
             mới, còn cặp đã cấp thì không bao giờ đổi.
   CHẠY     : Bằng tốt nghiệp là MỘT chuỗi khoá liền nhau, không còn "làm 6
             nhiệm vụ là có bằng":
               12 nhiệm vụ lab  ->  mở kỳ thi (exam.js)
               đỗ cả hai phần   ->  mở chứng chỉ (>= 10/20 mỗi phần)
               chứng chỉ         ->  complete("cert") = nhiệm vụ thứ 13
             lockState() trả về đúng một trong bốn trạng thái (labs / exam /
             fail / open); ba trạng thái đầu vẽ vào #certLockMsg kèm con số
             thật, trạng thái open mới hiện #certPreview. issuedAt() lấy mốc
             riêng cho từng cặp (tên, cấp bậc), sha256(tên|cấp|mốc) cắt 8 ký
             tự ra mã CS-XXXX-XXXX. Dòng học lực do exam.js ghi vào #certGrade
             khi đỗ và được in lên PNG. Nút tải vẽ canvas 1400x900 rồi
             toDataURL.
   CHẠM TỚI : #certNameInput, #btnSetCertName, #certLockMsg, #certLockText,
             #certProgress, #certStats, #certName, #certRank, #certGrade (do
             exam.js ghi xếp loại tốt nghiệp, chỉ vẽ lên PNG khi đã có điểm
             thi), #certDate, #certCode, #certPreview, #certDownload,
             #certPrint; khóa localStorage cysim-name:<id> và
             cysim-cert-issued:<id>:<tên>|<cấp>; global t(), $(),
             completedMissions,
             rankFor(), Auth, labsDone(), TOTAL_LABS, Labs.exam; đăng ký
             Labs.certificate.render để app.js vẽ lại khi đổi ngôn ngữ và để
             exam.js vẽ lại ngay sau khi chấm bài.
   ========================================================= */

(function () {
  const nameKey = () => "cysim-name:" + Auth.id();
  /* Bản cũ chỉ lưu MỘT mốc toàn cục cho mọi tên — đó chính là lỗi "đổi tên
     thì mã đổi mà 'Cấp ngày' vẫn đứng nguyên". Giữ hằng số này để đọc lại
     ngày cũ khi người dùng nâng cấp, rồi xoá đi. */
  const LEGACY_STAMP_KEY = () => "cysim-cert-issued:" + Auth.id();
  const stampKey = (name, rank) => LEGACY_STAMP_KEY() + ":" + name + "|" + rank;

  function guestName() {
    return Auth.displayName() || t("Học viên CySim");
  }
  function getCertName() {
    return localStorage.getItem(nameKey()) || guestName();
  }

  /* exam.js được nạp SAU file này nên Labs.exam chỉ tồn tại lúc render(), không
     phải lúc khai báo. */
  function lockState() {
    const labs = labsDone();
    if (labs < TOTAL_LABS) return { key: "labs", labs };
    const kq = Labs.exam ? Labs.exam.ketQua() : null;
    if (!kq) return { key: "exam", labs };
    if (!Labs.exam.dat()) return { key: "fail", labs, kq };
    return { key: "open", labs, kq };
  }

  /* Trả về mốc cấp của đúng cặp (tên, cấp bậc) đang hiển thị. Lần đầu đủ điều
     kiện (thi đỗ) thì ghi lại và không đổi nữa. */
  function issuedAt(name, rank, open) {
    const key = stampKey(name, rank);
    const saved = Number(localStorage.getItem(key));
    if (Number.isFinite(saved) && saved > 0) return saved;
    if (!open) return null;
    const legacy = Number(localStorage.getItem(LEGACY_STAMP_KEY()));
    const stamp = Number.isFinite(legacy) && legacy > 0 ? legacy : Date.now();
    localStorage.setItem(key, String(stamp));
    localStorage.removeItem(LEGACY_STAMP_KEY());
    return stamp;
  }

  async function getCertCode(name, rank, stamp) {
    const digest = await CyUtil.sha256Hex(name + "|" + rank + "|" + stamp);
    return "CS-" + digest.slice(0, 4).toUpperCase() + "-" + digest.slice(4, 8).toUpperCase();
  }

  const certNameInput = $("certNameInput");
  $("btnSetCertName").addEventListener("click", () => {
    const name = certNameInput.value.trim();
    if (name) localStorage.setItem(nameKey(), name);
    else localStorage.removeItem(nameKey());
    render();
  });

  /* Dòng "x / 13 nhiệm vụ · y XP" do JS ghép lại, nên nó là chuỗi không có
     trong từ điển. #certStats được đánh dấu data-no-i18n và tự vẽ bằng t()
     mỗi lần đổi ngôn ngữ — vừa không gọi dịch máy, vừa luôn đúng thứ tiếng. */
  function paintStats(count) {
    $("certStats").textContent = `${count} / ${TOTAL_MISSIONS} ${t("nhiệm vụ")} · ${count * 100} XP`;
  }

  /* #certLockMsg mang data-no-i18n: engine dịch không được đụng vào, còn JS thì
     vẽ lại từ t() mỗi lần đổi ngôn ngữ — kể cả khi đổi ngay giữa lúc thi. */
  function paintLock(st) {
    const msg = $("certLockMsg");
    const text = $("certLockText");
    const prog = $("certProgress");
    msg.style.display = "block";
    if (st.key === "labs") {
      /* Từ ngưỡng thi THỬ (hằng số của exam.js, đọc qua Labs.exam để không nhân
         bản con số 6 ở hai file) thì khung thi thử đã nằm ngay cuối trang này,
         nên dòng khoá không được nói "chưa mở được gì cả" — nói vậy là sai sự
         thật và đánh mất lý do duy nhất để người học cuộn xuống. */
      text.textContent = st.labs >= Labs.exam.THI_THU
        ? t("Chưa đủ 12 nhiệm vụ để thi thật — nhưng bạn đã làm được lượt thi thử (không tính điểm). Xem khung thi ở cuối trang.")
        : t("Bạn cần hoàn thành đủ 12 nhiệm vụ phòng lab để mở kỳ thi tốt nghiệp. Hiện tại:");
      prog.textContent = `${st.labs} / ${TOTAL_LABS}`;
    } else if (st.key === "exam") {
      text.textContent = t("Kỳ thi đã mở. Đạt từ 10/20 cả hai phần thì chứng chỉ xuất hiện ngay bên dưới.");
      prog.textContent = t("Chưa nộp bài thi");
    } else {
      text.textContent = t("Bạn chưa đỗ kỳ thi tốt nghiệp — mỗi phần phải đạt từ 10/20. Điểm của bạn:");
      prog.textContent = `${t("Điểm trắc nghiệm")} ${st.kq.diemTN} / 20 · ${t("Điểm tự luận")} ${st.kq.diemTL} / 20`;
    }
  }

  async function render() {
    const count = completedMissions.size;
    const preview = $("certPreview");
    const st = lockState();
    /* Ô đổi tên chứng chỉ chỉ có nghĩa khi tấm bằng ĐÃ mở. Để nó hiện dưới ba
       trạng thái khoá thì người dùng gõ tên cho một thứ không tồn tại — và
       form nằm ngoài vùng data-no-i18n nên placeholder vẫn dịch bình thường. */
    $("certNameForm").hidden = st.key !== "open";

    if (document.activeElement !== certNameInput) {
      certNameInput.value = localStorage.getItem(nameKey()) || Auth.displayName() || "";
    }
    paintStats(count);

    if (st.key !== "open") {
      paintLock(st);
      preview.style.display = "none";
      return;
    }
    $("certLockMsg").style.display = "none";
    preview.style.display = "block";

    const userName = getCertName();
    const rankName = RANKS[RANK_MAP[Math.min(count, TOTAL_MISSIONS)]];
    const stamp = issuedAt(userName, rankName, true);

    $("certName").textContent = userName;
    $("certRank").textContent = t(rankName);
    $("certDate").textContent = new Date(stamp).toLocaleDateString(LABEL_LOCALE[currentLang] || "vi-VN");
    $("certCode").textContent = await getCertCode(userName, rankName, stamp);

    if (!completedMissions.has("cert")) {
      /* "cert" là nhiệm vụ thứ 13: cấp bằng xong thì bộ đếm phải nhảy lên
         13/13 ngay, nếu không khung bằng vừa hiện ra đã ghi "12 / 13 · 1200 XP"
         và ảnh PNG tải về lập tức cũng mang số sai. */
      await complete("cert", "Đã nhận chứng chỉ Cyber Security Analyst");
      paintStats(completedMissions.size);
    }
  }

  $("certDownload").addEventListener("click", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 900;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, 1400, 900);
    grad.addColorStop(0, "#0d1424");
    grad.addColorStop(0.5, "#0a1929");
    grad.addColorStop(1, "#0d1424");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1400, 900);

    ctx.strokeStyle = "#4de1ff";
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1340, 840);
    ctx.strokeStyle = "rgba(77,225,255,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, 1304, 804);

    ctx.textAlign = "center";
    ctx.fillStyle = "#4de1ff";
    ctx.font = "bold 28px 'Space Grotesk', sans-serif";
    ctx.fillText("◈ CySim", 700, 130);

    ctx.fillStyle = "#e4ebf7";
    ctx.font = "bold 52px 'Space Grotesk', sans-serif";
    ctx.fillText("CERTIFICATE OF TRAINING", 700, 220);

    ctx.fillStyle = "#8593b0";
    ctx.font = "18px 'Space Grotesk', sans-serif";
    ctx.fillText("CYBER SECURITY ANALYST PROGRAM", 700, 258);

    ctx.fillStyle = "#6ee7a8";
    ctx.font = "bold 60px 'Space Grotesk', sans-serif";
    ctx.fillText($("certName").textContent, 700, 400);

    ctx.fillStyle = "#4de1ff";
    ctx.font = "italic 22px 'Space Grotesk', sans-serif";
    ctx.fillText($("certRank").textContent, 700, 450);

    ctx.fillStyle = "#8593b0";
    ctx.font = "18px 'JetBrains Mono', monospace";
    ctx.fillText($("certStats").textContent, 700, 500);

    /* Xếp loại tốt nghiệp do js/labs/exam.js ghi vào #certGrade sau khi chấm.
       Dòng trống nghĩa là chưa thi -> không in gì lên ảnh, đừng bịa số 0/20. */
    const grade = $("certGrade").textContent;
    if (grade) {
      ctx.fillStyle = "#6ee7a8";
      ctx.font = "bold 24px 'Space Grotesk', sans-serif";
      ctx.fillText(grade, 700, 560);
    }

    ctx.strokeStyle = "rgba(34,47,77,1)";
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(120, 680);
    ctx.lineTo(1280, 680);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#8593b0";
    ctx.font = "16px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(t("Cấp ngày: ") + $("certDate").textContent, 120, 740);
    ctx.fillText(t("Mã chứng chỉ: ") + $("certCode").textContent, 120, 766);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff5c7a";
    ctx.font = "italic 14px 'Space Grotesk', sans-serif";
    ctx.fillText(
      "* This certificate is for training simulation purposes only and does not substitute industry-recognized certifications.",
      700, 806
    );

    const link = document.createElement("a");
    link.download = `CySim-Certificate-${$("certCode").textContent}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    showToast("Đã tải chứng chỉ PNG thành công!");
  });

  $("certPrint").addEventListener("click", () => window.print());

  Labs.certificate = { render };
})();
