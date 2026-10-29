/* =========================================================
   CySim — labs/firewall.js  ·  phòng lab "Phòng thủ mạng bằng Tường lửa"

   LÀ GÌ   : Bảng 6 cổng (FTP/SSH/HTTP/HTTPS/MySQL/RDP) và một công tắc
             tường lửa; quét cổng chỉ là đồng hồ mô phỏng, không mở kết nối
             mạng nào cả.
   CHẠY     : buildPorts() dựng lưới cổng -> bấm "Run Scan" thì từng ô
             chuyển "Đang quét..." theo nhịp 300ms -> 80/443 luôn "Mở",
             còn lại "Đã chặn" nếu tường lửa bật, "Lộ ra ngoài" nếu tắt ->
             ô cuối cùng in dòng kết luận và hoàn thành nhiệm vụ "fw" khi
             chặn thành công.
   CHẠM TỚI : #ports, #firewallSwitch, #firewallState, #runScan, #legend;
             global t(), $(), complete(); đăng ký Labs.firewall.cancelScan
             và nghe sự kiện "cysim:language" để dựng lại lưới cổng bằng
             đúng thứ tiếng đang chọn (lưới cổng mang data-no-i18n).
   ========================================================= */

(function () {
  const PORTS = [
    { port: 21, name: "FTP" },
    { port: 22, name: "SSH" },
    { port: 80, name: "HTTP" },
    { port: 443, name: "HTTPS" },
    { port: 3306, name: "MySQL" },
    { port: 3389, name: "RDP" },
  ];
  const PUBLIC_PORTS = new Set([80, 443]);
  const SCAN_STEP_MS = 300;

  const pBox = $("ports");
  /* Bảng cổng do JS dựng một lần nên nhãn "Chờ..." không nằm trong HTML tĩnh.
     Hàm dựng lại được gọi mỗi lần đổi ngôn ngữ (lưới cổng đã đánh dấu
     data-no-i18n, nghĩa là bộ dịch tự động không tự quét tới nó). */
  function buildPorts() {
    pBox.replaceChildren(
      ...PORTS.map((p) => {
        const tile = document.createElement("div");
        tile.className = "port";
        const num = document.createElement("b");
        num.textContent = p.port;
        const label = document.createElement("span");
        label.textContent = p.name;
        const state = document.createElement("em");
        state.textContent = t("Chờ...");
        tile.append(num, label, state);
        return tile;
      })
    );
  }
  buildPorts();

  $("firewallSwitch").addEventListener("change", (e) => {
    const on = e.target.checked;
    const state = $("firewallState");
    state.textContent = t(on ? "Tường lửa đang bật" : "Tường lửa đang tắt");
    state.style.color = on ? "var(--ok)" : "var(--red)";
  });

  let scanTimers = [];
  $("runScan").addEventListener("click", () => {
    scanTimers.forEach(clearTimeout);
    scanTimers = [];

    const on = $("firewallSwitch").checked;
    const tiles = pBox.querySelectorAll(".port");
    $("legend").textContent = t("Đang quét...");

    tiles.forEach((tile, i) => {
      tile.className = "port scan";
      tile.querySelector("em").textContent = t("Đang quét...");

      scanTimers.push(setTimeout(() => {
        const state = tile.querySelector("em");
        if (PUBLIC_PORTS.has(PORTS[i].port)) {
          tile.className = "port open";
          state.textContent = t("Mở (HTTP/S)");
        } else {
          tile.className = on ? "port blocked" : "port exposed";
          state.textContent = t(on ? "Đã chặn" : "Lộ ra ngoài");
        }
        if (i === PORTS.length - 1) {
          $("legend").textContent = t(on
            ? "✅ Tường lửa đã chặn các cổng nguy hiểm."
            : "⚠️ Nhiều cổng nguy hiểm đang lộ ra!");
          if (on) complete("fw", "Đã khóa cổng nguy hiểm bằng Tường lửa");
        }
      }, (i + 1) * SCAN_STEP_MS));
    });
  });

  Labs.firewall = { cancelScan: () => { scanTimers.forEach(clearTimeout); scanTimers = []; } };

  document.addEventListener("cysim:language", () => {
    Labs.firewall.cancelScan();
    buildPorts();
    const on = $("firewallSwitch").checked;
    $("firewallState").textContent = t(on ? "Tường lửa đang bật" : "Tường lửa đang tắt");
  });
})();
