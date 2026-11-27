import { aadhaarForBill, allMobiles, dayName, dmy, inr, n, projMoney, qtyLabel, setupLines, withUnit } from './utils';
import { qrSvg, showUpi, upiLink } from './upi';

const esc = (v) =>
  String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Colours of the printed receipt. It is a paper document, so it does not change with dark mode.
// The on-screen preview (src/screens/BillScreen.js) uses the same values.
export const DOC = {
  paper: '#ffffff',
  ink: '#14113a',
  muted: '#6d698d',
  line: '#ece8f8',
  tint: '#f6f3ff',
  accent: '#5a2ee6',
  accentDeep: '#3a1fb8',
  accentSoft: '#d9cffd',
  good: '#109a63',
  goodBg: '#dcf5ea',
};

// ---------- Receipt colour ----------
// Ready-made colours. "deep" is the header band (white text sits on it), "accent" the highlights.
export const BILL_COLORS = [
  { key: 'purple', label: 'Purple', deep: '#3a1fb8', accent: '#5a2ee6' },
  { key: 'blue', label: 'Royal blue', deep: '#1d3fa8', accent: '#2f63e0' },
  { key: 'teal', label: 'Teal', deep: '#0b6466', accent: '#0f8f8a' },
  { key: 'green', label: 'Green', deep: '#17643a', accent: '#1f8f4c' },
  { key: 'maroon', label: 'Maroon', deep: '#8e1a2b', accent: '#c8344a' },
  { key: 'orange', label: 'Orange', deep: '#a64a0a', accent: '#d9641a' },
  { key: 'pink', label: 'Pink', deep: '#9c1758', accent: '#d63a83' },
  { key: 'black', label: 'Black', deep: '#1c1b24', accent: '#45434f' },
];

const hexRe = /^#?([0-9a-f]{6})$/i;
const toRgb = (h) => { const x = parseInt(h.replace('#', ''), 16); return [(x >> 16) & 255, (x >> 8) & 255, x & 255]; };
const toHex = (r) => '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (h, withHex, t) => { const a = toRgb(h), b = toRgb(withHex); return toHex(a.map((v, i) => v + (b[i] - v) * t)); };
const lum = (h) => {
  const c = toRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrastWithWhite = (h) => 1.05 / (lum(h) + 0.05);
// Darken until white text reads clearly on it (contrast 4.5 or more).
const darkEnough = (h, target = 4.5) => { let x = h; for (let i = 0; i < 20 && contrastWithWhite(x) < target; i++) x = mix(x, '#000000', 0.12); return x; };

export const isHexColor = (v) => hexRe.test(String(v || '').trim());
export const normHex = (v) => '#' + String(v).trim().replace('#', '').toLowerCase();

// The receipt palette for the chosen colour (a preset key or a "#rrggbb" code).
export function billPalette(settings) {
  const choice = String((settings && settings.billColor) || 'purple').trim();
  const preset = BILL_COLORS.find((c) => c.key === choice);
  let deep, accent;
  if (preset) ({ deep, accent } = preset);
  else if (isHexColor(choice)) { accent = darkEnough(normHex(choice), 3.2); deep = darkEnough(mix(accent, '#000000', 0.25)); }
  else ({ deep, accent } = BILL_COLORS[0]);
  return { ...DOC, deep, accentDeep: deep, accent, accentSoft: mix(accent, '#ffffff', 0.78), tint: mix(accent, '#ffffff', 0.94), line: mix(accent, '#ffffff', 0.9) };
}

const svg = (path, size = 13) =>
  `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const ICON = {
  phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
  pin: svg('<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>', 12),
  checkCircle: svg('<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>', 14),
  crossCircle: svg('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>', 14),
  cross: svg('<path d="M18 6 6 18M6 6l12 12"/>', 12),
};

// Built from the receipt palette, so the chosen colour reaches every part of the bill.
const css = (DOC) => `
@page{size:A4;margin:6mm}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:#fff;font-family:"Noto Sans","Noto Sans Oriya","Helvetica",sans-serif;color:${DOC.ink};-webkit-print-color-adjust:exact;print-color-adjust:exact}
.bill{width:100%;margin:0;border:1px solid ${DOC.line};border-radius:22px;overflow:hidden;font-size:13px;break-inside:avoid;page-break-inside:avoid}
.band{position:relative;overflow:hidden;background:${DOC.accentDeep};color:#fff;padding:20px 22px}
.band:after{content:"";position:absolute;width:220px;height:220px;border-radius:50%;right:-70px;top:-100px;background:${DOC.accent};opacity:.55}
.band .top{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.brand{font-size:28px;font-weight:900;letter-spacing:-.01em;line-height:1.1}
.tagline{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.75;margin-top:2px}
.doc{background:#fff;color:${DOC.accentDeep};border-radius:8px;padding:4px 9px;font-size:10.5px;font-weight:900;letter-spacing:.08em;white-space:nowrap}
.contact{position:relative;z-index:1;display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;opacity:.9;margin-top:6px}
.ic{flex:none;vertical-align:-2px}
.meta{display:flex;justify-content:space-between;background:${DOC.tint};border-bottom:1px solid ${DOC.line};padding:10px 22px}
.meta small{display:block;color:${DOC.muted};font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.meta b{font-size:16px;font-weight:800}
.meta .r{text-align:right}
.body{padding:18px 22px 22px}
h3{color:${DOC.accent};font-size:11px;font-weight:900;letter-spacing:.12em;margin:16px 0 8px}
h3:first-child{margin-top:0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px}
.grid .wide{grid-column:1/-1}
.grid small{display:block;color:${DOC.muted};font-size:11px;font-weight:600}
.grid b{font-size:14px;font-weight:700}
.amts{border:1px solid ${DOC.line};border-radius:14px;padding:2px 14px}
.amts div{display:flex;justify-content:space-between;gap:12px;padding:8px 0}
.amts span{color:${DOC.muted};font-weight:600}
.amts b{font-variant-numeric:tabular-nums;font-weight:700}
.amts .minus b{color:${DOC.good}}
.amts .strong{border-top:1px solid ${DOC.line}}
.amts .strong span,.amts .strong b{color:${DOC.ink};font-weight:800}
.bal{margin-top:10px;border-radius:14px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;background:${DOC.accent};color:#fff}
.bal span{font-size:12px;font-weight:900;letter-spacing:.1em;opacity:.85}
.bal b{font-size:22px;font-weight:900;font-variant-numeric:tabular-nums}
.bal.paid{background:${DOC.goodBg};color:${DOC.good}}
.reg{position:relative;z-index:1;font-size:11.5px;font-weight:700;opacity:.75;margin-top:3px}
.desc{border:1px solid ${DOC.line};border-radius:14px;padding:12px 14px}
.desc h5{margin:0 0 6px;color:${DOC.muted};font-size:11px;font-weight:800;letter-spacing:.04em}
.desc .g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 18px;margin-bottom:10px}
.desc .g:last-child{margin-bottom:0}
.desc .c{display:flex;align-items:center;gap:6px;color:${DOC.ink};font-weight:700;font-size:13px}
.desc .c span{flex:1}
.desc .c b{color:${DOC.accent};font-weight:900;font-variant-numeric:tabular-nums}
.desc .c.off{color:${DOC.muted}}
.desc .c.off b,.desc .c.off .ic{color:#b9b6cc}
.desc .c .ic{color:${DOC.accent}}
.upi{display:flex;align-items:center;gap:16px;margin-top:10px;border:1px solid ${DOC.line};background:${DOC.tint};border-radius:14px;padding:10px 14px}
.upi svg{flex:none;border-radius:6px}
.upi h4{margin:0;color:${DOC.deep};font-size:15px;font-weight:900}
.upi p{margin:2px 0 0;color:${DOC.muted};font-size:12px;font-weight:600}
.upi b{display:block;margin-top:4px;color:${DOC.ink};font-size:13.5px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-flex;align-items:center;gap:4px;border-radius:99px;padding:4px 11px;font-size:12px;font-weight:800;border:1px solid #f4f4f7;background:#f4f4f7;color:${DOC.muted}}
.chip.on{background:${DOC.tint};border-color:${DOC.accentSoft};color:${DOC.accent}}
.rules{background:${DOC.tint};border-radius:14px;padding:10px 14px;margin-top:14px;font-size:11px;line-height:1.5}
.rules h4{margin:0 0 4px;color:${DOC.accentDeep};font-size:13px}
.rules ol{margin:0;padding-left:18px}
.rules li::marker{color:${DOC.accent};font-weight:800}
.sig{display:flex;justify-content:space-between;align-items:flex-start;gap:30px;margin-top:18px}
.sig>div{flex:1;text-align:center}
.sig .top{height:60px;display:flex;align-items:flex-end;justify-content:center}
.sig img{display:block;height:56px;max-width:100%;margin-bottom:2px;object-fit:contain}
.sig em{display:block;font-style:normal;color:${DOC.ink};font-size:11.5px;font-weight:700;margin-top:3px}
/* Compact spacing: this HTML is only used for printing and the PDF, so it is tuned for A4. */
.band{padding:16px 20px}
.meta{padding:8px 20px}
.body{padding:14px 20px 16px}
h3{margin:12px 0 6px}
.amts div{padding:6px 0}
.bal{padding:10px 16px;margin-top:8px}
.sig i{display:block;width:100%;color:${DOC.accentDeep};font-weight:700;margin-bottom:4px;min-height:18px}
.sig span{display:block;border-top:1px solid ${DOC.ink};padding-top:4px;color:${DOC.muted};font-size:11px;font-weight:700}
`;

// Sound setup and effects with how many of each, in a 3-column grid.
function descHTML(p, s) {
  const { sound, fx } = setupLines(p, s);
  const soundOn = sound.filter((l) => l.qty);
  if (!soundOn.length && !fx.length) return '';
  const cell = ({ name, qty, unit }) => `<div class="c${qty ? '' : ' off'}">${qty ? ICON.checkCircle : ICON.crossCircle}<span>${esc(withUnit(name, unit))}</span><b>${qty ? esc(qtyLabel(qty)) : '—'}</b></div>`;
  const group = (title, list) => (list.length ? `<h5>${title}</h5><div class="g">${list.map(cell).join('')}</div>` : '');
  return `<h3>DESCRIPTION</h3><div class="desc">${group('Sound setup', soundOn)}${group('Effects', fx)}</div>`;
}

// Keeps the receipt on a single A4 page. If it is taller than the page (long rules, many
// extras), text and spacing are scaled down as a whole. The receipt's width is 100%, which
// zoom does not shrink, so it still fills the page from side to side.
// Runs before printing and once when loaded.
const FIT_SCRIPT = `(function(){
  var PAGE_H = 1065; // A4 height inside 6 mm margins, in CSS px, with a little room to spare
  function fit(){
    var b = document.querySelector('.bill'); if(!b) return;
    b.style.zoom = '';
    var h = b.getBoundingClientRect().height;
    if (h > PAGE_H) b.style.zoom = String(Math.floor(PAGE_H / h * 1000) / 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit); else fit();
  window.addEventListener('load', fit);
  window.addEventListener('beforeprint', fit);
})();`;

export function billHTML(p, settings, ledger) {
  const s = settings, m = projMoney(p, ledger), fin = p.status === 'final';
  const received = m.paid - n(p.advance);
  const paid = m.balance <= 0;
  const time = ([p.startTime, p.endTime].filter(Boolean).join(' – ') + (p.shift ? ` (${p.shift})` : '')).trim();
  // Only an uploaded image (data URL) is allowed as the signature.
  const sigImg = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(String(s.signature || '')) ? s.signature : '';
  const field = (label, value, wide) => (value ? `<div${wide ? ' class="wide"' : ''}><small>${label}</small><b>${esc(value)}</b></div>` : '');
  const row = (label, value, cls) => `<div${cls ? ` class="${cls}"` : ''}><span>${esc(label)}</span><b>${cls === 'minus' ? '− ' : ''}${inr(value)}</b></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css(billPalette(s))}</style></head><body>
<div class="bill">
<div class="band">
  <div class="top">
    <div><div class="brand">${esc(s.name || 'Your business')}</div>${s.tagline ? `<div class="tagline">${esc(s.tagline)}</div>` : ''}${s.regNo ? `<div class="reg">Regd. No. ${esc(s.regNo)}</div>` : ''}</div>
    <span class="doc">${fin ? 'FINAL BILL' : 'ORDER RECEIPT'}</span>
  </div>
  ${s.phones ? `<div class="contact">${ICON.phone}<span>${esc(s.phones)}</span></div>` : ''}
  ${s.address ? `<div class="contact">${ICON.pin}<span>${esc(s.address)}</span></div>` : ''}
</div>
<div class="meta">
  <div><small>${fin ? 'Bill No.' : 'Sl. No.'}</small><b>${esc(fin ? p.billNo || p.serial : p.serial)}</b></div>
  <div class="r"><small>Date</small><b>${esc(dmy(fin ? p.billDate : p.receiptDate) || '—')}</b></div>
</div>
<div class="body">
  <h3>BOOKING DETAILS</h3>
  <div class="grid">
    ${field('Name', p.customerName)}${field('Age', p.age ? String(p.age) : '')}
    ${field('Father’s name', p.fatherName)}${field('Mobile', allMobiles(p).join(', '))}
    ${field('Address', p.address, true)}
    ${field('Programme date', [dmy(p.bookingDate), dayName(p.bookingDate)].filter(Boolean).join(', '))}${field('Time', time)}
    ${field('Programme', [p.segment, p.eventType].filter(Boolean).join(' · '))}${field('Type', p.programmeType)}
    ${field('From → To', [p.from, p.to].filter(Boolean).join(' → '), true)}
    ${field('Aadhaar No.', aadhaarForBill(p.aadhaar, s))}${field('PAN', p.pan)}
  </div>
  <h3>PAYMENT</h3>
  <div class="amts">
    ${row('Package amount', m.total)}
    ${(p.extras || []).map((x) => row(x.label, x.amount)).join('')}
    ${m.disc ? row('Discount', m.disc, 'minus') : ''}
    ${(p.extras || []).length || m.disc ? row('Net amount', m.net, 'strong') : ''}
    ${row('Advance', p.advance, 'minus')}
    ${received > 0 ? row('Received', received, 'minus') : ''}
  </div>
  <div class="bal${paid ? ' paid' : ''}"><span>${paid ? 'PAID IN FULL' : 'BALANCE DUE'}</span><b>${inr(Math.max(0, m.balance))}</b></div>
  ${showUpi(s, m.balance) ? `<div class="upi">${qrSvg(upiLink(s, m.balance, 'Sl ' + p.serial + ' ' + (p.customerName || '')), 112)}<div><h4>Scan to pay ${inr(m.balance)}</h4><p>Any UPI app: GPay, PhonePe, Paytm, BHIM</p><b>${esc(s.upiId)}</b>${s.upiName ? `<p>${esc(s.upiName)}</p>` : ''}</div></div>` : ''}
  ${descHTML(p, s)}
  ${s.rulesTitle || (s.rules || []).length ? `<div class="rules">${s.rulesTitle ? `<h4>${esc(s.rulesTitle)}</h4>` : ''}<ol>${(s.rules || []).map((r) => `<li>${esc(r)}</li>`).join('')}</ol></div>` : ''}
  <div class="sig"><div><div class="top"><i>${esc(p.customerName || '')}</i></div><span>Customer signature</span></div><div><div class="top">${sigImg ? `<img src="${esc(sigImg)}" alt="Authorised signature">` : ''}</div><span>${esc(s.signTitle || 'Authorised signature')}</span>${s.signName ? `<em>${esc(s.signName)}</em>` : ''}</div></div>
</div>
</div>
<script>${FIT_SCRIPT}</script>
</body></html>`;
}

export function billText(p, s, ledger) {
  const m = projMoney(p, ledger), fin = p.status === 'final';
  const L = [
    [String(s.name || '').toUpperCase(), s.tagline].filter(Boolean).join(' – ') || null,
    fin ? `FINAL BILL No. ${p.billNo || p.serial} | ${dmy(p.billDate)}` : `ORDER RECEIPT Sl. No. ${p.serial} | ${dmy(p.receiptDate)}`,
    '',
    `Name: ${p.customerName || ''}`,
    p.age ? `Age: ${p.age}` : null,
    p.fatherName ? `Father: ${p.fatherName}` : null,
    p.address ? `Address: ${p.address}` : null,
    `Mobile: ${allMobiles(p).join(', ')}`,
    `Programme: ${dmy(p.bookingDate)}${dayName(p.bookingDate) ? ' ' + dayName(p.bookingDate) : ''} ${[p.startTime, p.endTime].filter(Boolean).join('–')}${p.shift ? ' (' + p.shift + ')' : ''}`,
    p.programmeType ? `Type: ${p.programmeType}` : null,
    `Place: ${[p.from, p.to].filter(Boolean).join(' to ')}`,
    (() => { const { sound, fx } = setupLines(p, s); const on = [...sound, ...fx].filter((l) => l.qty); return `Setup: ${on.map((l) => (l.unit || l.qty > 1 ? withUnit(l.name, l.unit) + ' ×' + qtyLabel(l.qty) : l.name)).join(', ') || '–'}`; })(),
    '',
    `Total: ${inr(m.total)}`,
  ];
  (p.extras || []).forEach((x) => L.push(`${x.label}: ${inr(x.amount)}`));
  if (m.disc) L.push(`Discount: −${inr(m.disc)}`);
  if ((p.extras || []).length || m.disc) L.push(`Net amount: ${inr(m.net)}`);
  L.push(`Advance: ${inr(p.advance)}`);
  (p.payments || []).forEach((x) => L.push(`Received ${dmy(x.date)}: ${inr(x.amount)}`));
  L.push(`*Balance: ${inr(m.balance)}*`);
  if (s.phones) L.push('', `Mob: ${s.phones}`);
  return L.filter((x) => x !== null).join('\n');
}

// ---------- Payment receipt (one payment, not the whole bill) ----------
// pay = { amount, mode, date, note }, no = receipt number like "30-2".
export function paymentList(p) {
  const list = [];
  if (n(p.advance) > 0) list.push({ amount: n(p.advance), mode: p.advanceMode || 'Cash', date: p.receiptDate, note: 'Advance', no: String(p.serial) + '-1' });
  (p.payments || []).forEach((x, i) => list.push({ ...x, no: String(p.serial) + '-' + (list.length + 1) }));
  return list;
}

export function paymentHTML(p, settings, ledger, pay) {
  const s = settings, m = projMoney(p, ledger), D = billPalette(s);
  const all = paymentList(p);
  const upto = all.slice(0, all.findIndex((x) => x.no === pay.no) + 1).reduce((a, x) => a + n(x.amount), 0);
  const sigImg = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(String(s.signature || '')) ? s.signature : '';
  const row = (l, v) => (v ? `<div><span>${esc(l)}</span><b>${esc(v)}</b></div>` : '');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css(D)}
.pr{max-width:520px;margin:0 auto}
.big{margin:14px 0 6px;border-radius:14px;background:${D.tint};border:1px solid ${D.line};padding:14px 16px;display:flex;justify-content:space-between;align-items:center}
.big span{color:${D.muted};font-weight:800;font-size:12px;letter-spacing:.08em}
.big b{color:${D.deep};font-size:28px;font-weight:900}
</style></head><body>
<div class="bill pr">
<div class="band">
  <div class="top">
    <div><div class="brand">${esc(s.name || 'Your business')}</div>${s.regNo ? `<div class="reg">Regd. No. ${esc(s.regNo)}</div>` : ''}</div>
    <span class="doc">PAYMENT RECEIPT</span>
  </div>
  ${s.phones ? `<div class="contact">${ICON.phone}<span>${esc(s.phones)}</span></div>` : ''}
</div>
<div class="meta">
  <div><small>Receipt No.</small><b>${esc(pay.no)}</b></div>
  <div class="r"><small>Date</small><b>${esc(dmy(pay.date) || '—')}</b></div>
</div>
<div class="body">
  <div class="big"><span>AMOUNT RECEIVED</span><b>${inr(pay.amount)}</b></div>
  <div class="amts">
    ${row('Received from', p.customerName)}
    ${row('Mobile', p.mobile)}
    ${row('Paid by', pay.mode || 'Cash')}
    ${row('Note', pay.note)}
    ${row('For booking', 'Sl. No. ' + p.serial + ' · ' + dmy(p.bookingDate))}
  </div>
  <h3>ACCOUNT</h3>
  <div class="amts">
    <div><span>Bill total</span><b>${inr(m.net)}</b></div>
    <div class="minus"><span>Paid till this receipt</span><b>${inr(upto)}</b></div>
    <div class="strong"><span>Balance after this payment</span><b>${inr(Math.max(0, m.net - upto))}</b></div>
  </div>
  <div class="sig"><div><div class="top"><i></i></div><span>Customer signature</span></div><div><div class="top">${sigImg ? `<img src="${esc(sigImg)}" alt="Authorised signature">` : ''}</div><span>${esc(s.signTitle || 'Authorised signature')}</span>${s.signName ? `<em>${esc(s.signName)}</em>` : ''}</div></div>
</div>
</div>
</body></html>`;
}

export function paymentText(p, s, ledger, pay) {
  const m = projMoney(p, ledger);
  const all = paymentList(p);
  const upto = all.slice(0, all.findIndex((x) => x.no === pay.no) + 1).reduce((a, x) => a + n(x.amount), 0);
  return [
    `${s.name || ''} – PAYMENT RECEIPT No. ${pay.no}`,
    `Date: ${dmy(pay.date)}`,
    '',
    `Received from: ${p.customerName || ''}`,
    `Amount: ${inr(pay.amount)} (${pay.mode || 'Cash'})`,
    `For booking Sl. No. ${p.serial}, programme ${dmy(p.bookingDate)}`,
    '',
    `Bill total: ${inr(m.net)}`,
    `Paid till now: ${inr(upto)}`,
    `*Balance: ${inr(Math.max(0, m.net - upto))}*`,
    s.phones ? `\nMob: ${s.phones}` : null,
  ].filter((x) => x !== null).join('\n');
}
