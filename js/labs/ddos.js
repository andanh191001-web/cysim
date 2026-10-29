/* =========================================================
   CySim — labs/ddos.js  ·  phòng lab "Đánh chặn DDoS"

   LÀ GÌ   : Trò chơi phòng thủ mô phỏng một đợt tấn công làm nghẽn băng
             thông. Không có mạng thật, chỉ là mô hình số.
   CHẠY     : Bấm "Start" -> mỗi 800ms sinh thêm một IP tấn công (cộng 18
             Mbps) -> mỗi 1000ms tick() xả băng thông và trừ máu nếu vượt
             50 Mbps -> người chơi bấm BLOCK trên từng thẻ (hoặc Auto-Block
             chặn IP cũ nhất) để giảm 15 Mbps -> sống sót 20s là THẮNG,
             máu về 0 là SERVER CRASHED. Nút Cloudflare xả băng thông nhanh
             gấp đôi và giảm một nửa sát thương. Danh sách thẻ có trần
             MAX_CARDS: thẻ cũ nhất bị gỡ KÈM phần băng thông nó đang gây ra,
             nên con số Mbps luôn khớp với số cuộc tấn công nhìn thấy trên
             màn hình (gỡ thẻ mà không trừ thì người chơi hết cách chặn).
             Đổi ngôn ngữ giữa ván: repaint() vẽ lại nhãn BLOCK, nhãn
             Cloudflare và dòng kết luận — ba chỗ này do JS viết, engine dịch
             bỏ qua vì #ddosVerdict mang data-no-i18n.
   CHẠM TỚI : #btnStartDdos, #btnCloudflare, #btnAutoBlock, #ipGrid, #hpVal,
             #hpBar, #hpBarBox, #bwVal, #ddosVerdict; global t(), $(),
             complete(); đăng ký Labs.ddos = { stop, isRunning } để app.js
             dừng vòng lặp khi rời view.
   ========================================================= */

(function () {
  const SPAWN_MS = 800;
  const TICK_MS = 1000;
  const WIN_AFTER_MS = 20000;
  const BANDWIDTH_PER_IP = 18;
  const BANDWIDTH_PER_BLOCK = 15;
  const MAX_CARDS = 40; // trần số thẻ trên màn hình, xem spawnIp() để biết vì sao phải trừ băng thông khi gỡ

  let active = false;
  let health = 100;
  let bandwidth = 12;
  let cloudflareOn = false;
  let gameTimer = null;
  let spawnTimer = null;
  let winTimer = null;
  /* Hai bộ đếm hiện trong dòng kết luận: chặn được bao nhiêu và bao nhiêu cuộc
     tấn công bị gỡ khỏi danh sách vì vượt trần hiển thị. Không có chúng thì mọi
     thứ chỉ còn là một con số bandwidth không giải thích được. */
  let blocked = 0;
  let dropped = 0;
  /* "win" | "lose" | null — kết luận hiện trên #ddosVerdict, để repaint() vẽ lại
     được bằng ngôn ngữ mới thay vì để kẹt dòng chữ của ngôn ngữ cũ. */
  let verdictKey = null;
  let cfPainted = false; // nút Cloudflare do JS viết chữ chưa (sau lần bấm Start)?

  const autoBtn = () => $("btnAutoBlock");

  function paintStats() {
    $("hpVal").textContent = health + "%";
    $("hpBar").style.width = health + "%";
    $("bwVal").textContent = bandwidth + " Mbps";
    $("hpBarBox").className = health < 30 ? "metric-bar danger" : "metric-bar";
  }

  function stop() {
    active = false;
    clearInterval(gameTimer);
    clearInterval(spawnTimer);
    clearTimeout(winTimer);
    gameTimer = spawnTimer = winTimer = null;
    autoBtn().disabled = true;
  }

  /* Một lần chặn: xả băng thông của một IP đang tấn công. Dùng chung cho
     nút BLOCK trên thẻ và nút Auto-Block để hai đường không lệch nhau. */
  function blockCard(card) {
    card.remove();
    blocked++;
    bandwidth = Math.max(10, bandwidth - BANDWIDTH_PER_BLOCK);
    $("bwVal").textContent = bandwidth + " Mbps";
    autoBtn().disabled = !active || !$("ipGrid").children.length;
  }

  function spawnIp() {
    if (!active) return;
    const ip = `192.168.${Math.floor(Math.random() * 10)}.${1 + Math.floor(Math.random() * 254)}`;
    const card = document.createElement("div");
    card.className = "ip-card";
    const label = document.createElement("span");
    label.textContent = ip;
    const blockBtn = document.createElement("button");
    blockBtn.type = "button";
    blockBtn.textContent = t("BLOCK");
    blockBtn.addEventListener("click", () => blockCard(card));
    card.append(label, blockBtn);
    const grid = $("ipGrid");
    grid.appendChild(card);
    /* Không để danh sách lớn vô hạn. Mỗi thẻ bị gỡ ở đây tương ứng một IP đang
       xả băng thông, nên PHẢI trừ nốt phần băng thông của nó: gỡ thẻ mà số Mbps
       vẫn giữ thì trên màn hình còn những cuộc tấn công không có thật, người
       chơi bấm hết nút BLOCK vẫn không về 0, và bằng chứng "chặn được bao nhiêu"
       mất tích theo cái thẻ bị xoá. */
    while (grid.children.length > MAX_CARDS) {
      grid.removeChild(grid.firstChild);
      bandwidth = Math.max(10, bandwidth - BANDWIDTH_PER_IP);
      dropped++;
    }
    grid.scrollTop = grid.scrollHeight;
    if (active) autoBtn().disabled = false;

    bandwidth += BANDWIDTH_PER_IP;
  }

  function tick() {
    if (!active) return;
    // Cloudflare xả băng thông nhanh hơn hẳn khi tắt
    bandwidth = Math.max(10, bandwidth - (cloudflareOn ? 12 : 5));
    if (bandwidth > 50) {
      let damage = Math.floor((bandwidth - 50) / 10);
      if (cloudflareOn) damage = Math.floor(damage / 2);
      health -= damage;
    }
    if (health <= 0) {
      health = 0;
      paintStats();
      return finish(false);
    }
    paintStats();
  }

  function start() {
    if (active) return;
    active = true;
    health = 100;
    bandwidth = 12;
    cloudflareOn = false;
    blocked = 0;
    dropped = 0;
    $("btnStartDdos").disabled = true;
    const cf = $("btnCloudflare");
    cf.disabled = false;
    cf.textContent = t("Bật Cloudflare / Anti-DDoS");
    cfPainted = true;
    verdictKey = null;
    paintVerdict();
    $("ipGrid").replaceChildren();
    autoBtn().disabled = true;
    paintStats();

    spawnTimer = setInterval(spawnIp, SPAWN_MS);
    gameTimer = setInterval(tick, TICK_MS);
    winTimer = setTimeout(() => active && finish(true), WIN_AFTER_MS);
  }

  function toggleCloudflare() {
    if (!active || cloudflareOn) return;
    cloudflareOn = true;
    const cf = $("btnCloudflare");
    cf.disabled = true;
    cf.textContent = t("Cloudflare đang BẬT 🛡️");
  }

  function finish(win) {
    stop();
    $("btnStartDdos").disabled = false;
    const cf = $("btnCloudflare");
    cf.disabled = true;
    cf.textContent = t("Bật Cloudflare / Anti-DDoS");
    cfPainted = true;
    verdictKey = win ? "win" : "lose";
    paintVerdict();
    if (win) complete("ddos", "Phòng thủ thành công đợt tấn công DDoS");
  }

  /* #ddosVerdict mang data-no-i18n nên JS phải tự vẽ lại khi đổi ngôn ngữ —
     kể cả dòng thống kê "đã chặn / bị gỡ" ghép bằng t(). */
  function paintVerdict() {
    const verdict = $("ddosVerdict");
    if (!verdictKey) {
      verdict.className = "verdict";
      verdict.textContent = "";
      return;
    }
    const tongKet = `${t("Đã chặn")}: ${blocked}` + (dropped ? ` · ${t("Bị gỡ khỏi danh sách")}: ${dropped}` : "");
    verdict.className = "verdict show " + (verdictKey === "win" ? "good" : "bad");
    verdict.textContent =
      (verdictKey === "win"
        ? t("THẮNG LỢI — Bạn đã bảo vệ máy chủ an toàn khỏi DDoS!")
        : t("SERVER CRASHED — Máy chủ đã sập do quá tải Băng thông!")) + " · " + tongKet;
  }

  /* Đổi ngôn ngữ GIỮA ván: mấy chữ này do JS viết (không nằm trong HTML tĩnh)
     nên engine dịch không đụng tới. Bỏ sót là cả bàn IP vẫn hiện "BLOCK"/
     "Bật Cloudflare" tiếng Việt ngay trên giao diện tiếng Nhật. */
  function repaint() {
    document.querySelectorAll("#ipGrid .ip-card button").forEach((b) => {
      b.textContent = t("BLOCK");
    });
    if (cfPainted) {
      $("btnCloudflare").textContent = active && cloudflareOn
        ? t("Cloudflare đang BẬT 🛡️")
        : t("Bật Cloudflare / Anti-DDoS");
    }
    paintVerdict();
  }
  document.addEventListener("cysim:language", repaint);

  $("btnStartDdos").addEventListener("click", start);
  $("btnCloudflare").addEventListener("click", toggleCloudflare);
  // Auto-Block: chặn IP cũ nhất trong hàng đợi, đúng một lần mỗi lần bấm
  $("btnAutoBlock").addEventListener("click", () => {
    if (!active) return;
    const oldest = $("ipGrid").firstElementChild;
    if (oldest) blockCard(oldest);
    else autoBtn().disabled = true;
  });

  Labs.ddos = { stop, isRunning: () => active };
})();
