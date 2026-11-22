/* 가상 창에 쓰는 작은 아이콘 — 모두 이 프로그램에서 직접 그린 단순한 SVG입니다. */
(function (g) {
  'use strict';
  const s = (body, vb = 16) => `<svg viewBox="0 0 ${vb} ${vb}" width="100%" height="100%" aria-hidden="true">${body}</svg>`;
  const I = {
    folder: s('<path d="M1 3.5h5l1.5 1.5H15v8.5H1z" fill="#f4cf62" stroke="#c49a2c"/><path d="M1 6h14v7.5H1z" fill="#f9dd84" stroke="#c49a2c"/>'),
    folderShare: s('<path d="M1 3.5h5l1.5 1.5H15v8.5H1z" fill="#f4cf62" stroke="#c49a2c"/><path d="M1 6h14v7.5H1z" fill="#f9dd84" stroke="#c49a2c"/><circle cx="5" cy="11" r="2" fill="#4a7fd0"/><circle cx="9" cy="11" r="2" fill="#56a64b"/>'),
    server: s('<rect x="4" y="1" width="8" height="14" rx="1" fill="#dfe3e8" stroke="#6b7480"/><path d="M5.5 4h5M5.5 6h5M5.5 8h5" stroke="#6b7480"/><circle cx="8" cy="12" r="1" fill="#3a9b3a"/>'),
    serverOk: s('<rect x="3" y="1" width="8" height="13" rx="1" fill="#dfe3e8" stroke="#6b7480"/><path d="M4.5 4h5M4.5 6h5" stroke="#6b7480"/><circle cx="12" cy="12" r="3.5" fill="#2e9d3c"/><path d="M10.4 12l1.2 1.2 2-2.3" stroke="#fff" fill="none" stroke-width="1.3"/>'),
    computer: s('<rect x="1" y="2" width="14" height="9" rx="1" fill="#3f78c8" stroke="#2a4e86"/><rect x="2.3" y="3.2" width="11.4" height="6.6" fill="#8fc2f2"/><path d="M6 11h4l1 3H5z" fill="#9aa3ad"/>'),
    gear: s('<circle cx="8" cy="8" r="5" fill="#9bb3cf" stroke="#4b6584" stroke-dasharray="2 1.2" stroke-width="2.4"/><circle cx="8" cy="8" r="2" fill="#fff" stroke="#4b6584"/>'),
    user: s('<circle cx="8" cy="5" r="3" fill="#f0c9a2" stroke="#8c6a4a"/><path d="M2 15c0-4 3-6 6-6s6 2 6 6z" fill="#4f7fc7" stroke="#2c4f87"/>'),
    users: s('<circle cx="5.5" cy="5" r="2.5" fill="#f0c9a2" stroke="#8c6a4a"/><path d="M1 14c0-3 2-5 4.5-5S10 11 10 14z" fill="#4f7fc7" stroke="#2c4f87"/><circle cx="11" cy="6" r="2.3" fill="#f0c9a2" stroke="#8c6a4a"/><path d="M8 15c0-3 1.4-4.8 3-4.8s4 1.8 4 4.8z" fill="#53a050" stroke="#2f6a2c"/>'),
    globe: s('<circle cx="8" cy="8" r="6.5" fill="#5aa0e6" stroke="#245b9b"/><path d="M3 6c2 1 3-1 5 0s1 3 3 3 2-2 3-1M4 12c1-1 2 0 3-1" stroke="#2f8a2f" stroke-width="1.6" fill="none"/>'),
    key: s('<circle cx="5" cy="8" r="3.5" fill="#f2c94c" stroke="#9a7a1c"/><circle cx="4.2" cy="8" r="1" fill="#fff"/><path d="M8 8h7M12 8v2.5M14 8v2" stroke="#9a7a1c" stroke-width="1.6"/>'),
    lock: s('<rect x="3" y="7" width="10" height="8" rx="1" fill="#f2c94c" stroke="#9a7a1c"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="#7a7a7a" stroke-width="1.6"/>'),
    policy: s('<rect x="2" y="1" width="10" height="13" fill="#fff" stroke="#8a8a8a"/><path d="M4 4h6M4 6h6M4 8h4" stroke="#7a8aa8"/><rect x="8" y="9" width="7" height="6" rx="1" fill="#f2c94c" stroke="#9a7a1c"/>'),
    folderPolicy: s('<path d="M1 3.5h5l1.5 1.5H15v8.5H1z" fill="#f4cf62" stroke="#c49a2c"/><rect x="8" y="8" width="7" height="7" rx="1" fill="#e6b93b" stroke="#8a6a1c"/><path d="M10 8V6.8a1.5 1.5 0 0 1 3 0V8" stroke="#666" fill="none"/>'),
    doc: s('<path d="M3 1h7l3 3v11H3z" fill="#fff" stroke="#8a8a8a"/><path d="M10 1v3h3" fill="#ddd" stroke="#8a8a8a"/>'),
    dns: s('<rect x="2" y="9" width="12" height="5" fill="#dfe3e8" stroke="#6b7480"/><path d="M8 9V6M4 6h8M4 6v-3M12 6V3" stroke="#3a6ab0"/><circle cx="4" cy="3" r="1.6" fill="#3a6ab0"/><circle cx="12" cy="3" r="1.6" fill="#3a6ab0"/>'),
    dhcp: s('<path d="M4 2h8v3a4 4 0 0 1-8 0z" fill="#f0c03a" stroke="#93701a"/><path d="M8 9v3M5 14h6" stroke="#93701a" stroke-width="1.6"/><path d="M4 3H2v1a2 2 0 0 0 2 2M12 3h2v1a2 2 0 0 1-2 2" stroke="#93701a" fill="none"/>'),
    filter: s('<path d="M2 2h12l-5 6v6l-2-1V8z" fill="#f4cf62" stroke="#9a7a1c"/>'),
    options: s('<rect x="2" y="2" width="12" height="12" fill="#fff" stroke="#8a8a8a"/><path d="M4 5h3M4 8h3M4 11h3" stroke="#555"/><path d="M9 5h3M9 8h3M9 11h3" stroke="#3a6ab0"/>'),
    lease: s('<rect x="2" y="2" width="12" height="12" fill="#fff" stroke="#8a8a8a"/><path d="M4 5h8M4 8h8M4 11h5" stroke="#3a6ab0"/>'),
    reserve: s('<rect x="2" y="3" width="10" height="11" fill="#fff" stroke="#8a8a8a"/><path d="M4 6h6M4 9h4" stroke="#555"/><circle cx="12" cy="11" r="3" fill="#e05050"/><path d="M12 9.6v2.2" stroke="#fff"/>'),
    zone: s('<path d="M1 3.5h5l1.5 1.5H15v8.5H1z" fill="#f4cf62" stroke="#c49a2c"/><rect x="6" y="7" width="8" height="6" fill="#fff" stroke="#6b7480"/><path d="M7.5 9h5M7.5 11h5" stroke="#3a6ab0"/>'),
    record: s('<rect x="2" y="2" width="12" height="12" fill="#fff" stroke="#8a8a8a"/><path d="M4 6h8M4 10h8" stroke="#3a6ab0" stroke-width="2"/>'),
    pool: s('<path d="M1 7l4-4h6l4 4-7 7z" fill="#bcd3ef" stroke="#3a6ab0"/>'),
    site: s('<circle cx="8" cy="8" r="6.5" fill="#5aa0e6" stroke="#245b9b"/><path d="M1.5 8h13M8 1.5c-3 3-3 10 0 13M8 1.5c3 3 3 10 0 13" stroke="#fff" fill="none"/>'),
    ftp: s('<rect x="1" y="3" width="14" height="10" rx="1" fill="#e9eef5" stroke="#5b6b80"/><text x="8" y="11" font-size="6.5" text-anchor="middle" font-family="Arial" font-weight="700" fill="#2b5ea8">FTP</text>'),
    reg: s('<path d="M8 1l6 3v8l-6 3-6-3V4z" fill="#5f8fd8" stroke="#2b4e86"/><path d="M2 4l6 3 6-3M8 7v8" stroke="#bcd6fb" fill="none"/>'),
    regKey: s('<path d="M1 3.5h5l1.5 1.5H15v8.5H1z" fill="#f4cf62" stroke="#c49a2c"/><path d="M1 6h14v7.5H1z" fill="#f9dd84" stroke="#c49a2c"/>'),
    regSz: s('<rect x="1" y="2" width="14" height="12" rx="1" fill="#fff" stroke="#c0392b"/><text x="8" y="11.5" font-size="8" text-anchor="middle" font-family="Arial" font-weight="700" fill="#c0392b">ab</text>'),
    regBin: s('<rect x="1" y="2" width="14" height="12" rx="1" fill="#fff" stroke="#2b5ea8"/><text x="8" y="11" font-size="6" text-anchor="middle" font-family="Arial" font-weight="700" fill="#2b5ea8">011</text>'),
    cmd: s('<rect x="1" y="2" width="14" height="12" fill="#000" stroke="#555"/><path d="M3 6l2 1.5L3 9M6 10h4" stroke="#ddd" fill="none"/>'),
    disk: s('<rect x="1" y="5" width="14" height="7" rx="1" fill="#d6dbe1" stroke="#6b7480"/><circle cx="12.5" cy="8.5" r="1" fill="#3a9b3a"/>'),
    storage: s('<rect x="1" y="6" width="14" height="7" rx="1" fill="#d6dbe1" stroke="#6b7480"/><rect x="3" y="2" width="10" height="4" fill="#9bb3cf" stroke="#4b6584"/>'),
    tools: s('<path d="M3 13l6-6M10 2a3 3 0 0 0 4 4l-2 0-2-2z" stroke="#555" stroke-width="2" fill="#bbb"/><path d="M12 13L6 7" stroke="#c49a2c" stroke-width="2"/>'),
    mmc: s('<rect x="1" y="2" width="14" height="12" fill="#fff" stroke="#6b7480"/><rect x="1" y="2" width="14" height="3" fill="#3f78c8"/><path d="M3 7h3M3 9h3M3 11h3M8 7h5M8 9h5" stroke="#555"/>'),
    printer: s('<rect x="4" y="1" width="8" height="5" fill="#fff" stroke="#777"/><rect x="1" y="5" width="14" height="6" rx="1" fill="#6a7686" stroke="#3b4350"/><rect x="4" y="9" width="8" height="6" fill="#fff" stroke="#777"/>'),
    monitor: s('<rect x="1" y="2" width="14" height="9" rx="1" fill="#2b2b2b"/><rect x="2" y="3" width="12" height="7" fill="#5aa0e6"/><path d="M6 11h4v2H6zM4 14h8" stroke="#666" fill="#888"/>'),
    net: s('<rect x="2" y="5" width="12" height="7" rx="1" fill="#3a8a3a" stroke="#215421"/><path d="M4 12v2M6 12v2M8 12v2M10 12v2M12 12v2" stroke="#c9a227"/><rect x="5" y="2" width="6" height="3" fill="#9aa3ad"/>'),
    cd: s('<circle cx="8" cy="8" r="6.5" fill="#d9dde3" stroke="#6b7480"/><circle cx="8" cy="8" r="1.8" fill="#fff" stroke="#6b7480"/>'),
    chip: s('<rect x="3" y="3" width="10" height="10" fill="#4a4f57" stroke="#222"/><path d="M5 1v2M8 1v2M11 1v2M5 13v2M8 13v2M11 13v2M1 5h2M1 8h2M1 11h2M13 5h2M13 8h2M13 11h2" stroke="#999"/>'),
    kbd: s('<rect x="1" y="4" width="14" height="8" rx="1" fill="#e2e5e9" stroke="#6b7480"/><path d="M3 7h1M5 7h1M7 7h1M9 7h1M11 7h1M4 9.5h8" stroke="#555"/>'),
    mouse: s('<rect x="4" y="1.5" width="8" height="13" rx="4" fill="#e2e5e9" stroke="#6b7480"/><path d="M8 1.5v5M4 6.5h8" stroke="#6b7480"/>'),
    sound: s('<path d="M2 6h3l4-3v10l-4-3H2z" fill="#9aa3ad" stroke="#555"/><path d="M11 5c1.5 1.5 1.5 4.5 0 6" stroke="#555" fill="none"/>'),
    usb: s('<path d="M8 1v12M8 4L5 7v2M8 6l3 2v2" stroke="#444" stroke-width="1.4" fill="none"/><circle cx="8" cy="13.5" r="1.6" fill="#444"/>'),
    port: s('<path d="M2 5h12l-2 6H4z" fill="#bfc6cf" stroke="#555"/><circle cx="5.5" cy="7.5" r=".7"/><circle cx="8" cy="7.5" r=".7"/><circle cx="10.5" cy="7.5" r=".7"/>'),
    battery: s('<rect x="1" y="5" width="13" height="7" rx="1" fill="#e2e5e9" stroke="#555"/><rect x="14" y="7" width="1.5" height="3" fill="#555"/><rect x="2.5" y="6.5" width="8" height="4" fill="#3a9b3a"/>'),
    info: s('<circle cx="8" cy="8" r="7" fill="#2f6fd0" stroke="#1b4b9a"/><path d="M8 7v5" stroke="#fff" stroke-width="2"/><circle cx="8" cy="4.6" r="1.1" fill="#fff"/>'),
    warn: s('<path d="M8 1l7 13H1z" fill="#f2c94c" stroke="#9a7a1c"/><path d="M8 5.5v4.5" stroke="#000" stroke-width="1.6"/><circle cx="8" cy="12" r=".9"/>'),
    error: s('<circle cx="8" cy="8" r="7" fill="#d9372b" stroke="#8a1c13"/><path d="M5 5l6 6M11 5l-6 6" stroke="#fff" stroke-width="1.8"/>'),
    question: s('<circle cx="8" cy="8" r="7" fill="#2f6fd0" stroke="#1b4b9a"/><text x="8" y="12" font-size="10" text-anchor="middle" font-family="Arial" font-weight="700" fill="#fff">?</text>'),
    wizard: s('<path d="M3 13l8-8" stroke="#7a4b1c" stroke-width="2"/><path d="M11 1l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#f2c94c" stroke="#9a7a1c"/>'),
    rdp: s('<rect x="1" y="2" width="14" height="9" rx="1" fill="#3f78c8" stroke="#2a4e86"/><rect x="2.3" y="3.2" width="11.4" height="6.6" fill="#8fc2f2"/><path d="M5 13h6" stroke="#666" stroke-width="2"/><path d="M6 6.5h4M8.5 5l1.5 1.5L8.5 8" stroke="#1d7a2b" stroke-width="1.3" fill="none"/>'),
    service: s('<circle cx="6" cy="6" r="3.8" fill="#b9c8da" stroke="#4b6584" stroke-dasharray="1.6 1" stroke-width="2"/><circle cx="11" cy="11" r="3.2" fill="#c9d6e6" stroke="#4b6584" stroke-dasharray="1.4 .9" stroke-width="1.8"/>'),
    group: s('<circle cx="5" cy="5" r="2.4" fill="#f0c9a2" stroke="#8c6a4a"/><circle cx="11" cy="5" r="2.4" fill="#f0c9a2" stroke="#8c6a4a"/><path d="M1 14c0-3 2-5 4-5s4 2 4 5zM7 14c0-3 2-5 4-5s4 2 4 5z" fill="#4f7fc7" stroke="#2c4f87"/>'),
    perm: s('<path d="M8 1l6 2.5v4C14 11 11 14 8 15 5 14 2 11 2 7.5v-4z" fill="#3f78c8" stroke="#1b4b9a"/><path d="M5 8l2 2 4-4" stroke="#fff" stroke-width="1.6" fill="none"/>'),
    taskbar: s('<rect x="1" y="3" width="14" height="10" fill="#fff" stroke="#6b7480"/><rect x="1" y="11" width="14" height="2" fill="#2a4e86"/>'),
    devOff: s('<rect x="1" y="3" width="12" height="9" rx="1" fill="#d6dbe1" stroke="#6b7480"/><circle cx="11.5" cy="11.5" r="4" fill="#fff" stroke="#333"/><path d="M11.5 9v4.2M9.8 11.6l1.7 1.8 1.7-1.8" stroke="#111" stroke-width="1.4" fill="none"/>'),
    feature: s('<rect x="2" y="2" width="12" height="12" rx="2" fill="#e7eef8" stroke="#5b7ba8"/><path d="M5 6h6M5 9h6M5 12h4" stroke="#2b5ea8"/>'),
  };
  // IIS 기능 아이콘: 모양은 다르게, 색만 바꿔 구분합니다.
  const feat = (col, mark) => s(`<rect x="1" y="2" width="14" height="12" rx="1.5" fill="#f4f7fb" stroke="${col}"/><rect x="1" y="2" width="14" height="3" fill="${col}"/><text x="8" y="12.3" font-size="6.5" text-anchor="middle" font-family="Arial" font-weight="700" fill="${col}">${mark}</text>`);
  I.f_ip = feat('#c0392b', 'IP'); I.f_doc = feat('#2b5ea8', 'DOC'); I.f_dir = feat('#1e8449', 'DIR'); I.f_auth = feat('#7d3c98', 'AU');
  I.f_ftp = feat('#b9770e', 'FTP'); I.f_msg = feat('#117a65', 'MSG'); I.f_ssl = feat('#6c3483', 'SSL'); I.f_log = feat('#566573', 'LOG');
  I.f_gen = feat('#5d6d7e', '…');
  g.ICONS = I;
  g.icon = (name) => `<span class="ic">${I[name] || I.feature}</span>`;
})(typeof window !== 'undefined' ? window : globalThis);
