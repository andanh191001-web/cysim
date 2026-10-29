/* =========================================================
   CySim — labs/antivirus.js  ·  phòng lab "Phần mềm diệt mã độc"

   LÀ GÌ   : Quét THẬT các file người dùng tự chọn ngay trên máy mình:
             băm SHA-256, so khớp mẫu EICAR, soi đuôi file và mẫu hành vi.
             Không có gì rời khỏi máy — không có mạng, không tải lên.
   CHẠY     : Bấm "Chọn file/thư mục" (File System Access API) -> đọc tối đa
             10MB để băm SHA-256 đối chiếu KNOWN_HASHES, soi đuôi nguy hiểm,
             đuôi kép và 9 mẫu hành vi (PowerShell encoded, eval(atob(...)),
             mã đánh cắp cookie...) -> in kết quả và đếm 4 chỉ số. Nút EICAR
             tạo file chuẩn để chứng minh máy phát hiện thật; nút
             "Demo giao diện" (#avDeepScan) chỉ minh hoạ cách hiển thị,
             KHÔNG đọc gì trên máy và KHÔNG được tính là hoàn thành nhiệm vụ.
   CHẠM TỚI : #avPickFiles, #avPickFolder, #avDeepScan, #avTestEicar,
             #avProgress, #avStats, #avVerdict, #avResults, #avScanned,
             #avClean, #avSus, #avMal; global t(), $(), complete(), CyUtil,
             Labs. Đăng ký Labs.antivirus = { stop } để app.js cắt vòng quét
             (chạy bằng await, không có timer nên không ai dừng được nếu file
             này không tự khai cờ) và hàng setTimeout của bản demo.
   ========================================================= */

(function () {
  const KNOWN_HASHES = new Map([
    ["275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f", "EICAR Standard Antivirus Test File"],
  ]);
  const EICAR = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
  const DANGEROUS_EXT = new Set([
    "exe", "scr", "pif", "com", "bat", "cmd", "vbs", "vbe", "wsf", "wsh",
    "ps1", "psm1", "hta", "jar", "msi", "reg", "lnk", "dll", "sys", "cpl",
    "docm", "xlsm", "pptm", "dotm", "xlam",
  ]);
  const DOUBLE_EXT = ["exe", "scr", "bat", "cmd", "js", "vbs", "ps1", "jar", "com", "pif", "hta"];
  const TEXT_EXT = new Set(["js", "ps1", "html", "htm", "vbs", "txt", "php", "cmd", "bat", "sh", "py", "json", ""]);

  const PATTERNS = [
    { re: /powershell(\.exe)?\s+(-\w+\s+)*-e(ncodedcommand)?\s/i, label: "PowerShell encoded command" },
    { re: /\bInvoke-Expression\b|\biex\s*\(/i, label: "PowerShell IEX dropper" },
    { re: /eval\s*\(\s*atob\s*\(/i, label: "JavaScript eval(atob(...))" },
    { re: /fromCharCode\s*\([0-9,\s]{40,}/i, label: "JS obfuscated payload (fromCharCode)" },
    { re: /WScript\.Shell|CreateObject\(\s*["']WScript/i, label: "Windows Script Host dropper" },
    { re: /http:\/\/[^\s"']+\.(exe|dll|scr|bat|ps1)\b/i, label: "URL tải file thực thi qua HTTP" },
    { re: /cmd\.exe\s*\/c\s+start/i, label: "cmd.exe spawn" },
    { re: /base64_decode\s*\(/i, label: "PHP base64 decode" },
    { re: /document\.cookie\s*\+\s*["']?\s*<img/i, label: "Mẫu đánh cắp cookie" },
  ];
  // Dấu vết header PE. Chỉ áp cho file NHỊ PHÂN — bắt "MZ" trong file văn
  // bản thuần tuý chỉ tổ báo nhầm hàng loạt.
  const PE_HEADER = /^MZ[\s\S]{40,}/;

  const LIMIT_FILES = 300;
  const MAX_HASH_SIZE = 10 * 1024 * 1024;
  const MAX_TEXT_SCAN = 500 * 1024;
  const MAX_FOLDER_FILE = 50 * 1024 * 1024;

  let counts = { scanned: 0, clean: 0, sus: 0, mal: 0 };
  let verdictKind = "";  // "" | "counts" | "demo" | "cancelled": để vẽ lại đúng loại chữ
  /* Vòng quét chạy bằng await chứ không phải timer, nên app.js không thể "tắt
     nó" từ ngoài nếu file này không tự khai cờ. stop() bật cancelled khi người
     dùng rời trang; mỗi lần bấm chọn file mới thì cờ về 0. demoTimers giữ các
     setTimeout của bản mô phỏng giao diện để huỷ luôn, không để hàng đợi in
     dòng vào khung đã ẩn. */
  let cancelled = false;
  const demoTimers = [];

  const getExt = (name) => {
    const i = name.lastIndexOf(".");
    return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
  };
  const hasDoubleExt = (name) => {
    const parts = name.toLowerCase().split(".");
    return parts.length >= 3 && parts.slice(1, -1).some((p) => DOUBLE_EXT.includes(p));
  };

  function paintStats() {
    $("avScanned").textContent = counts.scanned;
    $("avClean").textContent = counts.clean;
    $("avSus").textContent = counts.sus;
    $("avMal").textContent = counts.mal;
  }

  /* #avVerdict do JS ghép chữ với số nên được đánh dấu data-no-i18n và vẽ lại
     bằng t() khi đổi ngôn ngữ. Con số bắt buộc nằm NGOÀI chuỗi gửi đi dịch:
     nhúng vào trong thì mỗi số tạo một khóa mới, từ điển không bao giờ khớp
     và hàng đợi dịch máy bị spam. */
  function paintVerdict() {
    const verdict = $("avVerdict");
    verdictKind = "counts";
    if (counts.mal > 0) {
      verdict.className = "verdict show bad";
      verdict.textContent = `${t("PHÁT HIỆN")} ${counts.mal} ${t("MÃ ĐỘC — Hãy xóa ngay và không mở các file này!")}`;
    } else if (counts.sus > 0) {
      verdict.className = "verdict show bad";
      verdict.textContent = `${counts.sus} ${t("file nghi vấn — Kiểm tra kỹ trước khi mở.")}`;
    } else {
      verdict.className = "verdict show good";
      verdict.textContent = `${t("Hoàn tất! Đã quét")} ${counts.scanned} ${t("file — không phát hiện mã độc.")}`;
    }
  }

  function resetPanel(placeholder) {
    counts = { scanned: 0, clean: 0, sus: 0, mal: 0 };
    $("avStats").style.display = "flex";
    $("avProgress").style.width = "0%";
    $("avVerdict").className = "verdict";
    verdictKind = "";
    const results = $("avResults");
    results.replaceChildren();
    if (placeholder) CyUtil.logLine(results, "av-busy", placeholder);
    paintStats();
  }

  function renderRow({ name, size, status, reasons }) {
    const row = document.createElement("div");
    row.className = "av-row " + (status === "mal" ? "av-mal" : status === "sus" ? "av-sus" : "av-clean");

    const icon = document.createElement("span");
    icon.className = "av-icon";
    icon.textContent = status === "mal" ? "⛔" : status === "sus" ? "⚠️" : "✅";

    const nameEl = document.createElement("span");
    nameEl.className = "av-name";
    nameEl.title = name;
    nameEl.textContent = name;

    const sizeEl = document.createElement("span");
    sizeEl.className = "av-size";
    sizeEl.textContent = CyUtil.formatBytes(size || 0);

    const reasonEl = document.createElement("span");
    reasonEl.className = "av-reason";
    reasonEl.textContent = reasons.length ? reasons.join(" · ") : t("Không phát hiện dấu hiệu");

    row.append(icon, nameEl, sizeEl, reasonEl);
    const results = $("avResults");
    results.appendChild(row);
    results.scrollTop = results.scrollHeight;
  }

  async function scanOne(file) {
    const result = { name: file.name, size: file.size, status: "clean", reasons: [] };
    const mark = (status, reason) => {
      if (status === "mal" || result.status === "clean") result.status = status;
      result.reasons.push(reason);
    };

    let buffer;
    try {
      buffer = await file.arrayBuffer();
    } catch (e) {
      mark("sus", t("Không đọc được file") + ": " + e.message);
      return result;
    }

    if (file.size <= MAX_HASH_SIZE) {
      const hash = await CyUtil.sha256HexBuffer(buffer);
      if (KNOWN_HASHES.has(hash)) mark("mal", t("Trùng hash với mã độc đã biết") + ": " + KNOWN_HASHES.get(hash));
    } else {
      result.reasons.push(t("File trên 10MB — bỏ qua bước băm hash"));
    }

    const head = new TextDecoder("utf-8").decode(buffer.slice(0, Math.min(buffer.byteLength, MAX_TEXT_SCAN)));
    if (head.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) {
      mark("mal", t("Chuỗi EICAR — mẫu test chuẩn công nghiệp"));
    }

    const ext = getExt(file.name);
    if (DANGEROUS_EXT.has(ext)) mark("sus", t("Đuôi file nguy hiểm") + ": ." + ext);
    if (hasDoubleExt(file.name)) mark("sus", t("Nghi vấn double extension (giả đuôi file)"));

    if (file.size < MAX_TEXT_SCAN) {
      if (TEXT_EXT.has(ext)) {
        for (const pattern of PATTERNS) {
          if (pattern.re.test(head)) mark("sus", t("Mẫu hành vi") + ": " + t(pattern.label));
        }
      } else if (PE_HEADER.test(head)) {
        mark("sus", t("Đầu file PE (MZ) nhưng không có đuôi .exe"));
      }
    }
    return result;
  }

  async function scanFiles(files) {
    resetPanel();
    const list = Array.from(files).slice(0, LIMIT_FILES);
    for (let i = 0; i < list.length; i++) {
      /* Người dùng rời trang giữa lượt quét: stop() bật cancelled, vòng lặp
         dừng ở đây thay vì đọc nốt 300 file cho một khung đã ẩn. Đã quét bao
         nhiêu thì giữ lại bấy nhiêu — số liệu trên màn hình đúng với số file
         thực sự đã đọc, không phải một con số "đang chạy" vô chủ. */
      if (cancelled) break;
      const result = await scanOne(list[i]);
      renderRow(result);
      counts.scanned++;
      counts[result.status === "mal" ? "mal" : result.status === "sus" ? "sus" : "clean"]++;
      paintStats();
      $("avProgress").style.width = ((i + 1) / list.length) * 100 + "%";
      if (i % 5 === 4) await CyUtil.sleep(0); // nhường luồng để giao diện không đứng hình
    }
    if (cancelled) {
      paintCancelled();
      return;
    }

    paintVerdict();
    if (counts.scanned > 0) complete("av", "Đã quét virus thật trên máy tính");
  }

  async function collectFromDirectory(dir, out) {
    for await (const entry of dir.values()) {
      if (cancelled || out.length >= LIMIT_FILES) return;
      if (entry.kind === "file") {
        try {
          const file = await entry.getFile();
          if (file.size <= MAX_FOLDER_FILE) out.push(file);
        } catch { /* file bị khoá hoặc quyền truy cập vừa bị thu hồi */ }
      } else if (entry.kind === "directory") {
        await collectFromDirectory(entry, out);
      }
    }
  }

  async function pickFiles() {
    cancelled = false; // một lượt bấm mới = quên lần rời trang trước
    if (window.showOpenFilePicker) {
      try {
        const handles = await window.showOpenFilePicker({ multiple: true });
        scanFiles(await Promise.all(handles.map((h) => h.getFile())));
      } catch (e) {
        if (e.name !== "AbortError") console.error("[av]", e);
      }
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.addEventListener("change", () => input.files && scanFiles(input.files));
    input.click();
  }

  async function pickFolder() {
    cancelled = false;
    if (!window.showDirectoryPicker) {
      showToast("Trình duyệt này không hỗ trợ chọn thư mục. Hãy dùng Chrome / Edge / Opera trên desktop.");
      return;
    }
    try {
      const dir = await window.showDirectoryPicker();
      resetPanel(t("Đang duyệt thư mục..."));
      const collected = [];
      await collectFromDirectory(dir, collected);
      /* Rời trang lúc đang đi hết thư mục thì đừng quét nữa: danh sách file đã
         lấy nằm trong bộ nhớ, không có ai xem kết quả. */
      if (cancelled) {
        paintCancelled();
        return;
      }
      if (!collected.length) {
        $("avResults").replaceChildren();
        const verdict = $("avVerdict");
        verdict.className = "verdict show bad";
        verdict.textContent = t("Không tìm thấy file nào trong thư mục đã chọn.");
        return;
      }
      await scanFiles(collected);
    } catch (e) {
      if (e.name !== "AbortError") console.error("[av]", e);
    }
  }

  function runEicarTest() {
    cancelled = false;
    scanFiles([new File([EICAR], "eicar-test-file.txt", { type: "text/plain" })]);
  }

  function showUiDemo() {
    resetPanel();
    CyUtil.logLine(
      $("avResults"),
      "av-demo-note",
      t("BẢN MÔ PHỎNG GIAO DIỆN — các dòng dưới là dữ liệu minh hoạ, không phải kết quả quét máy bạn.")
    );
    const rows = [
      { name: "C:\\Windows\\System32\\svchost.exe", size: 0, status: "clean", reasons: [t("Ví dụ minh hoạ")] },
      { name: "C:\\Users\\Ban\\AppData\\Local\\Temp\\x8f2a.tmp", size: 0, status: "sus", reasons: [t("Ví dụ minh hoạ")] },
      { name: "C:\\Users\\Ban\\Downloads\\invoice.pdf.exe", size: 0, status: "mal", reasons: [t("Ví dụ minh hoạ")] },
    ];
    demoTimers.forEach(clearTimeout);
    demoTimers.length = 0;
    rows.forEach((row, i) => demoTimers.push(setTimeout(() => renderRow(row), (i + 1) * 350)));
    $("avProgress").style.width = "100%";
    paintDemoVerdict();
  }

  function paintDemoVerdict() {
    verdictKind = "demo";
    const verdict = $("avVerdict");
    verdict.className = "verdict";
    verdict.textContent = t("Đây là demo giao diện. Muốn quét thật, hãy bấm 'Chọn file để quét'.");
  }

  function paintCancelled() {
    verdictKind = "cancelled";
    const verdict = $("avVerdict");
    verdict.className = "verdict show";
    verdict.textContent = t("Đã dừng quét vì bạn rời khỏi trang này.");
  }

  /* Dừng mọi thứ file này còn đang chạy: vòng quét await (qua cờ cancelled)
     và hàng setTimeout của bản demo. app.js gọi khi rời view "antivirus". */
  function stop() {
    cancelled = true;
    demoTimers.forEach(clearTimeout);
    demoTimers.length = 0;
  }

  $("avPickFiles").addEventListener("click", pickFiles);
  $("avPickFolder").addEventListener("click", pickFolder);
  $("avTestEicar").addEventListener("click", runEicarTest);
  $("avDeepScan").addEventListener("click", showUiDemo);

  /* Đổi ngôn ngữ giữa chừng: dòng kết luận do JS tự ghép nên nằm ngoài bộ máy
     dịch DOM, phải vẽ lại bằng t() ở đây. */
  document.addEventListener("cysim:language", () => {
    if (verdictKind === "counts") paintVerdict();
    else if (verdictKind === "demo") paintDemoVerdict();
    else if (verdictKind === "cancelled") paintCancelled();
  });

  Labs.antivirus = { stop };
})();
