// ==UserScript==
// @name         Haxball Gol Müziği
// @description  Odadaki "GOL!" duyurusunu görünce gol müziğini çalar
// @match        https://*.haxball.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
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
})();
