// ==UserScript==
// @name         Haxball Oda Eklentisi (gol müziği + özel vuruşlar)
// @version      2
// @description  "GOL!" duyurusunda müzik çalar; Q / E / Shift tuşlarını odaya bildirir (falso, powershot)
// @match        https://*.haxball.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  // ---------- Gol müziği ----------
  // Script.txt içindeki CONFIG.golMuzikleri ile aynı sırada olmalı.
  const MUZIKLER = [
    "https://raw.githubusercontent.com/baranyel/gol-muzikleri/main/mikmik-umidi-gol.mp3",
    "https://raw.githubusercontent.com/baranyel/gol-muzikleri/main/umidi-gol-atma.mp3",
    "https://raw.githubusercontent.com/baranyel/gol-muzikleri/main/umidi-gol-yeme.mp3",
  ];
  const VARSAYILAN_SES = 0.5; // duyuruda ses bilgisi gelmezse kullanılır

  let audio = null;
  let sonCalma = 0;

  // Odanın gol duyurusuna eklediği görünmez veri: müzik no (4 bit) + ses yüzdesi (7 bit)
  function veriOku(metin) {
    const m = metin.match(/⁠([​‌]{11})/);
    if (!m) return null;
    const n = parseInt(m[1].replace(/​/g, "0").replace(/‌/g, "1"), 2);
    return { parca: n >> 7, ses: Math.min((n & 127) / 100, 1) };
  }

  function cal(metin) {
    const veri = veriOku(metin);
    const parca = veri && veri.parca < MUZIKLER.length ? veri.parca : Math.floor(Math.random() * MUZIKLER.length);
    const ses = veri ? veri.ses : VARSAYILAN_SES;
    try {
      if (audio) audio.pause();
      audio = new Audio(MUZIKLER[parca]);
      audio.volume = ses;
      const p = audio.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }

  function kontrol(node) {
    // Oyuncu mesajları "isim: ..." diye başlar, bu yüzden "GOL!" ile başlayan satır sadece odanın duyurusudur.
    const metin = node.textContent || "";
    if (!metin.trimStart().startsWith("GOL!")) return;
    const simdi = Date.now();
    if (simdi - sonCalma < 1500) return; // aynı satır için p ve metin düğümü iki kez tetikleyebilir
    sonCalma = simdi;
    cal(metin);
  }

  new MutationObserver((kayitlar) => {
    for (const k of kayitlar) k.addedNodes.forEach(kontrol);
  }).observe(document.body, { childList: true, subtree: true });

  // ---------- Özel vuruş tuşları ----------
  // Q = falso yukarı, E = falso aşağı, Shift = powershot.
  // Tuşa basılınca odaya TEK mesaj gider ("!tus q"); oda bir sonraki vuruşu özel yapar.
  // Haxball istemcisi sohbeti saniyede ~1 mesajla sınırladığı için basma/bırakma mesajı yok.
  // Vuruşun kendisini Haxball yapar. Shift zaten vuruş tuşu; Q/E'yi de vuruş tuşu yapmak istersen
  // Ayarlar > Kontroller'den ekle, yoksa Q/E'ye bas, sonra Space/X ile vur.
  const TUSLAR = { KeyQ: "q", KeyE: "e", ShiftLeft: "s", ShiftRight: "s" };

  // Haxball'ın sohbet kutusuna "Enter'a basılmış gibi" mesaj yazar. Oda bu "!tus ..." mesajlarını gizler.
  function sohbeteGonder(metin) {
    const input = document.querySelector('.chatbox-view input[data-hook="input"]');
    if (!input) return false;
    const eski = input.value;
    input.value = metin;
    const ev = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: false, cancelable: true });
    Object.defineProperty(ev, "keyCode", { get: () => 13 });
    Object.defineProperty(ev, "which", { get: () => 13 });
    input.dispatchEvent(ev); // Haxball mesajı gönderir, kutuyu temizler ve odağı bırakır
    input.value = eski;
    return true;
  }

  window.addEventListener("keydown", (e) => {
    const harf = TUSLAR[e.code];
    if (!harf || e.repeat) return;
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return; // sohbet yazarken sayma
    sohbeteGonder("!tus " + harf);
  }, true);

  // ---------- Çalıştığını göster ----------
  // Oyun ekranının sohbetine bir kere "eklenti aktif" yazar. Görmüyorsan script bu sayfada çalışmıyordur.
  const bildirim = setInterval(() => {
    const log = document.querySelector('[data-hook="log-contents"]');
    if (!log) return;
    clearInterval(bildirim);
    const p = document.createElement("p");
    p.className = "notice";
    p.textContent = "[Eklenti aktif] Gol müziği ve Q / E / Shift özel vuruşları hazır.";
    log.appendChild(p);
  }, 500);
})();
