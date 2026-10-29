/* =========================================================
   CySim — labs/guide.js  ·  trang "Hướng dẫn" (nằm trong labs/ vì đi
   theo quy ước: mỗi màn hình .view một file)

   LÀ GÌ   : Nơi người dùng tự cài app — không phải bài lab tính XP.
             Hai bảng: 1) EmailJS để gửi mã xác minh về Gmail thật;
             2) I18n để xem % đã kiểm chứng, dịch nốt phần thiếu, xuất từ điển.
   CHẠY     : Bảng EmailJS lưu 3 mã qua Auth.saveEmailConfig (vào
             localStorage, không phải sửa code) + nút "Gửi email thử" gọi
             Auth.sendTestEmail. Bảng I18n: chọn ngôn ngữ đích ->
             I18nAdmin.ensureBundled/ensureReviewed nạp js/lang/*.json để hiện
             coverage thật -> "Dịch phần còn thiếu" gọi translateAll ->
             "Xuất JSON" tải từ điển về. Bật chế độ báo lỗi rồi bấm vào dòng chữ
             sai: i18n.js mở ô sửa ngay trong trang (không phải hộp prompt), bản
             sửa hiện lập tức và được ghi vào danh sách; xuất file để tác giả đưa
             vào tools/translation_review.json.
   CHẠM TỚI : #cfgPublicKey #cfgServiceId #cfgTemplateId #cfgTestEmail
             #cfgSave #cfgClear #cfgSendTest #cfgStatus; #i18nTargetLang
             #i18nCoverage #i18nBar #i18nStatus #i18nReportMode
             #i18nTranslateAll #i18nExport #i18nClearCache #i18nReportCount
             #i18nExportReports #i18nClearReports; global t(), setText(), $(),
             Auth, I18nAdmin (coverage/reportCount/setReportMode/reportsJson),
             currentLang, showToast; đăng ký Labs.guide.refresh() để app.js vẽ
             lại hai bảng khi mở trang VÀ khi người dùng đổi ngôn ngữ (mấy dòng
             trạng thái nằm trong data-no-i18n nên renderDocument không đụng tới).
   ========================================================= */

(function () {
  const tr = (s) => (typeof t === "function" ? t(s) : s);

  /* ---------- 1. Cấu hình EmailJS ---------- */
  function paintEmailForm() {
    const c = Auth.emailConfig();
    $("cfgPublicKey").value = c.publicKey;
    $("cfgServiceId").value = c.serviceId;
    $("cfgTemplateId").value = c.templateId;
    setStatus(
      c.complete
        ? tr("Đã cấu hình EmailJS — mã sẽ gửi tới email thật.")
        : tr("Chưa cấu hình đủ 3 giá trị, hệ thống đang ở chế độ demo."),
      c.complete ? "ok" : "warn"
    );
  }

  function setStatus(text, kind) {
    const el = $("cfgStatus");
    el.textContent = text;
    el.className = "cfg-status" + (kind ? " " + kind : "");
  }
  function setI18nStatus(text, kind) {
    const el = $("i18nStatus");
    el.textContent = text;
    el.className = "cfg-status" + (kind ? " " + kind : "");
  }

  $("cfgSave").addEventListener("click", () => {
    const saved = Auth.saveEmailConfig({
      publicKey: $("cfgPublicKey").value.trim(),
      serviceId: $("cfgServiceId").value.trim(),
      templateId: $("cfgTemplateId").value.trim(),
    });
    paintEmailForm();
    setStatus(
      saved.complete ? tr("Đã lưu. Hãy bấm 'Gửi email thử' để kiểm tra.") : tr("Đã lưu. Cần nhập đủ cả 3 giá trị."),
      saved.complete ? "ok" : "warn"
    );
  });

  $("cfgClear").addEventListener("click", () => {
    Auth.saveEmailConfig({ publicKey: "", serviceId: "", templateId: "" });
    paintEmailForm();
    setStatus(tr("Đã xoá cấu hình — quay lại chế độ demo."), "warn");
  });

  $("cfgSendTest").addEventListener("click", async () => {
    const address = $("cfgTestEmail").value.trim();
    if (!Auth.emailConfig().complete) {
      setStatus(tr("Chưa cấu hình EmailJS nên không thể gửi."), "err");
      return;
    }
    setStatus(tr("Đang gửi..."), "");
    $("cfgSendTest").disabled = true;
    try {
      const code = await Auth.sendTestEmail(address);
      setStatus(tr("Đã gửi tới") + " " + address + " — " + tr("mã thử") + ": " + code, "ok");
    } catch (e) {
      setStatus(tr("Gửi thất bại:") + " " + e.message, "err");
    } finally {
      $("cfgSendTest").disabled = false;
    }
  });

  /* ---------- 2. Bảng ngôn ngữ ---------- */
  const langSelect = $("i18nTargetLang");
  langSelect.replaceChildren(...I18nAdmin.langs.map((code) => new Option(I18nAdmin.label(code), code)));

  let busy = false;

  /* Hai con số phải tách bạch: "có bản dịch" khác "người thật đã duyệt".
     Gộp lại một dòng % là lý do tiếng Trung bị khoe 100% trong khi toàn bộ
     là máy dịch sai ngữ cảnh. */
  function paintCoverage() {
    const lang = langSelect.value;
    const show = () => {
      const c = I18nAdmin.coverage(lang);
      $("i18nCoverage").textContent =
        tr("Đã dịch") + ` ${c.translated}/${c.total}` +
        ` (${c.pct}%) — ` + tr("người đã duyệt") + ` ${c.reviewed}/${c.total} (${c.reviewPct}%)`;
      $("i18nBar").style.width = c.reviewPct + "%";
      paintReports();
    };
    show();
    /* Phải nạp CẢ HAI rồi mới vẽ lại: nếu chỉ chờ từ điển sinh sẵn thì
       ensureReviewed() còn đang tải dở, % "người đã duyệt" tính non — con số
       hiển thị kẹt ở 81% dù thực tế là 100%. */
    Promise.all([I18nAdmin.ensureBundled(lang), I18nAdmin.ensureReviewed()]).then(show);
  }

  const REPORT_ON_LABEL = "Tắt chế độ báo lỗi";
  const REPORT_OFF_LABEL = "Bật chế độ báo lỗi";

  function paintReports() {
    const n = I18nAdmin.reportCount();
    const on = I18nAdmin.isReportMode();
    /* setText() chứ không gán textContent: gán chữ tiếng Việt rồi chờ máy quét
       DOM dịch lại làm nút hiện tiếng Việt ~100ms giữa lúc giao diện đang tiếng
       Anh; gán thẳng bản dịch thì phải ghi kèm nguồn, nếu không bản dịch bị coi
       là chuỗi mới và dịch đè. */
    setText($("i18nReportMode"), on ? REPORT_ON_LABEL : REPORT_OFF_LABEL);
    $("i18nReportMode").classList.toggle("active", on);
    $("i18nReportMode").setAttribute("aria-pressed", String(on));
    $("i18nExportReports").disabled = n === 0;
    $("i18nReportCount").textContent =
      tr("Báo lỗi đã ghi") + ": " + n + (n ? " — " + tr("bản sửa đang hiển thị trên giao diện") : "");
  }

  langSelect.addEventListener("change", paintCoverage);

  $("i18nTranslateAll").addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    $("i18nTranslateAll").disabled = true;
    const lang = langSelect.value;
    try {
      const res = await I18nAdmin.translateAll(lang, (i, total, text) => {
        $("i18nCoverage").textContent = `${i}/${total} — ${text.slice(0, 40)}`;
        $("i18nBar").style.width = Math.round((i / total) * 100) + "%";
      });
      paintCoverage();
      if (res.remaining > 0) {
        setI18nStatus(tr("Dịch bị gián đoạn (nhà cung cấp tạm chặn). Hãy chờ vài phút rồi bấm lại."), "warn");
      }
    } finally {
      busy = false;
      $("i18nTranslateAll").disabled = false;
    }
  });

  /* Tải một đoạn text ra máy. Hai nút dưới đây đều cần, giữ một chỗ dùng
     chung để sau này thêm xuất (report, từ điển) không phải copy 6 dòng.
     mime là tham số vì file tải về không phải lúc nào cũng JSON. */
  function download(name, text, mime = "application/json") {
    const blob = new Blob([text], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* Tải bản dịch hiện tại ra file để đặt vào js/lang/<lang>.json */
  $("i18nExport").addEventListener("click", () => {
    const lang = langSelect.value;
    const dict = {};
    for (const source of I18nAdmin.collectSources()) {
      const value = I18nAdmin.translate(lang, source);
      if (value) dict[source] = value;
    }
    download(lang + ".json", JSON.stringify(dict, null, 2));
    // Phải là setI18nStatus: setStatus() viết vào #cfgStatus của bảng EmailJS,
    // nên message "Đã tải js/lang/..." hiện ngược lên hẳn form cấu hình kia.
    setI18nStatus(tr("Đã tải") + ` js/lang/${lang}.json`, "ok");
  });

  $("i18nClearCache").addEventListener("click", () => {
    I18nAdmin.clearCache(langSelect.value);
    paintCoverage();
    setI18nStatus(tr("Đã xoá bộ nhớ dịch của ngôn ngữ này."), "warn");
  });

  /* Chế độ báo lỗi: bật lên rồi bấm vào chữ sai trên màn hình. */
  $("i18nReportMode").addEventListener("click", async () => {
    if (currentLang === "vi") {
      setI18nStatus(tr("Bạn đang ở tiếng Việt — ngôn ngữ nguồn. Hãy chọn một thứ tiếng khác rồi bật lại nút này."), "warn");
      return;
    }
    const langAtStart = currentLang;
    const on = I18nAdmin.setReportMode(!I18nAdmin.isReportMode());
    if (on) await I18nAdmin.ensureReviewed();
    /* await ở giữa là chỗ duy nhất ngôn ngữ có thể đổi mà phần code phía trên
       không biết: nếu người dùng chuyển ngôn ngữ lúc đang nạp reviewed.json thì
       app.js đã gọi Labs.guide.refresh() vẽ lại cả bảng theo ngôn ngữ mới, ghi
       tiếp ở đây chỉ đè thêm một dòng tính theo trạng thái cũ. */
    if (currentLang !== langAtStart) return;
    paintReports();
    setI18nStatus(on
      ? tr("Đang bật chế độ báo lỗi: bấm vào dòng chữ sai trên màn hình, gõ bản dịch đúng. Bản sửa hiện ngay và được lưu để tải ra.")
      : tr("Đã tắt chế độ báo lỗi."), on ? "ok" : "");
  });

  $("i18nExportReports").addEventListener("click", () => {
    download("cysim-translation-reports.json", I18nAdmin.reportsJson());
    setI18nStatus(tr("Đã tải danh sách báo lỗi — đưa vào tools/translation_review.json rồi chạy python tools/gen_translations.py."), "ok");
  });

  $("i18nClearReports").addEventListener("click", () => {
    I18nAdmin.clearReports();
    I18nAdmin.clearOverrides();
    paintReports();
    setI18nStatus(tr("Đã xoá báo lỗi và bản sửa tạm. Giao diện quay về đúng từ điển."), "warn");
  });

  Labs.guide = {
    refresh() {
      paintEmailForm();
      paintCoverage();
    },
  };

  paintCoverage();
})();
