const motifs={
  star:'<path d="m100 40 13 37 39 1-31 24 10 38-31-22-31 22 10-38-31-24 39-1Z"/><path d="M100 19v10m0 125v10M27 91H17m166 0h-10"/>',
  sun:'<circle cx="100" cy="91" r="30"/><path d="M100 31v16m0 88v16M40 91h16m88 0h16M57 48l11 11m64 64 11 11M57 134l11-11m64-64 11-11"/>',
  moon:'<path d="M115 39a53 53 0 1 0 32 83 44 44 0 0 1-32-83Z"/><path d="m145 43 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"/>',
  flower:'<circle cx="100" cy="91" r="13"/><ellipse cx="100" cy="63" rx="13" ry="25"/><ellipse cx="100" cy="119" rx="13" ry="25"/><ellipse cx="72" cy="91" rx="25" ry="13"/><ellipse cx="128" cy="91" rx="25" ry="13"/>',
  cup:'<path d="M66 54h68v30a34 34 0 0 1-68 0Zm34 64v27m-25 0h50M66 64H49v16a23 23 0 0 0 22 23m63-39h17v16a23 23 0 0 1-22 23"/><path d="m100 30 5 9-5 9-5-9Z"/>',
  wand:'<path d="m77 147 47-111m-40 90-21-9m32-13 26 1M105 79l-18-19m30-8 24-4"/><path d="m115 27 6-15 6 15 15 6-15 6-6 15-6-15-15-6Z"/>',
  sword:'<path d="m100 27 13 32-13 65-13-65Zm0 97v31m-29-33h58m-34 33h10"/>',
  pentacle:'<circle cx="100" cy="91" r="53"/><path d="m100 44 28 84-73-52h90l-73 52Z"/>',
  crown:'<path d="m53 64 12 62h70l12-62-27 24-20-42-20 42Zm12 75h70"/><circle cx="100" cy="38" r="5"/>',
  key:'<circle cx="100" cy="60" r="23"/><path d="M100 83v69m0-18h23m-23-15h16"/><circle cx="100" cy="60" r="7"/>',
  heart:'<path d="M100 136 54 88C22 45 84 22 100 62c16-40 78-17 46 26Z"/><path d="M100 139v18"/>',
  arrow:'<path d="M100 147V40m-32 34 32-34 32 34M64 147h72"/><circle cx="100" cy="105" r="20"/>',
  lantern:'<path d="M80 50v-9a20 20 0 0 1 40 0v9m-50 0h60l-8 88H78Zm-2 102h64M100 65l-12 35 12 22 12-22Z"/>',
  wheel:'<circle cx="100" cy="91" r="53"/><circle cx="100" cy="91" r="34"/><path d="M100 38v106M47 91h106M63 54l74 74m0-74-74 74"/><circle cx="100" cy="91" r="9"/>',
  scales:'<path d="M100 37v109m-28 0h56M53 61h94M100 30l9 12-9 12-9-12ZM60 61l-20 44h40Zm80 0-20 44h40Z"/><path d="M40 105a20 20 0 0 0 40 0m40 0a20 20 0 0 0 40 0"/>',
  eye:'<path d="M35 91q65-78 130 0-65 78-130 0Z"/><circle cx="100" cy="91" r="23"/><circle cx="100" cy="91" r="7"/><path d="M100 36V23m0 136v-13"/>',
  chain:'<ellipse cx="82" cy="74" rx="21" ry="32" transform="rotate(-35 82 74)"/><ellipse cx="118" cy="111" rx="21" ry="32" transform="rotate(-35 118 111)"/><path d="m58 132-14 15m98-97 14-15"/>',
  tower:'<path d="M71 145V62h58v83M63 62V45h16v10h14V45h14v10h14V45h16v17M90 145v-25h20v25M87 80h6v13h-6Zm20 0h6v13h-6Z"/><path d="m119 17-12 20h17l-13 20M51 90l-9 17m107 3 9 17"/>',
};

export function tarotArtwork(card) {
  return `<svg class="tarot-art" viewBox="0 0 200 184" aria-hidden="true"><circle class="tarot-art-orbit" cx="100" cy="91" r="77"/><circle class="tarot-art-orbit" cx="100" cy="91" r="69"/><g>${motifs[card.motif]||motifs.star}</g><circle cx="22" cy="22" r="1.5"/><circle cx="177" cy="160" r="1.5"/></svg>`;
}
