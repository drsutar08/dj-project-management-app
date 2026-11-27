import { dmy, group, inr, n, projMoney } from './utils';

const esc = (v) =>
  String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const rs = (v) => 'Rs. ' + group(n(v)) + '/-';

const CSS = `
@page{margin:12mm}
body{margin:0;padding:0;background:#fff;font-family:"Noto Sans","Helvetica",sans-serif}
.bill{--blue:#1a72b8;--red:#d2452b;--orange:#e2672a;--purple:#6a3d9a;--yellow:#fdf08a;color:#111;border:3px solid var(--blue);border-radius:18px;padding:18px;max-width:640px;margin:0 auto;font-size:13px}
.tag{display:block;width:max-content;margin:0 auto;border:2px solid var(--red);color:var(--red);border-radius:99px;padding:1px 14px;font-weight:800;font-size:11px;letter-spacing:.08em;text-decoration:underline}
.brand{text-align:center;font-weight:900;font-size:40px;line-height:1.05;margin:6px 0 0;letter-spacing:.02em}
.tagline{text-align:center;color:var(--orange);font-weight:800;letter-spacing:.06em;font-size:16px}
.contact{text-align:center;color:var(--red);font-weight:700;font-size:13px;margin-top:4px}
.addr{text-align:center;color:var(--blue);font-weight:700;font-size:13px;text-transform:uppercase}
.meta{display:flex;justify-content:space-between;border-top:2px solid #222;margin-top:8px;padding-top:6px;font-weight:600}
.hand{color:#1b2b8a;font-weight:600;font-style:italic}
.box{border:2px solid var(--red);border-radius:12px;padding:12px;margin-top:18px;position:relative}
.lbl{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:#fff;border:2px solid var(--red);color:var(--red);border-radius:99px;padding:0 10px;font-weight:800;font-size:11px;white-space:nowrap}
.ln{display:flex;gap:6px;padding:5px 0;border-bottom:1px dotted #999}
.ln b{font-weight:600;color:#333}.ln .gap{flex:1}
.two{display:flex;gap:10px;margin-top:12px}
.two table:first-child{flex:1.3}.two table:last-child{flex:1}
table{border-collapse:collapse;background:var(--yellow)}
td{border:1.5px solid #222;padding:6px 8px;font-weight:700}
td:first-child{color:var(--red);font-size:11.5px}
td.v{white-space:nowrap;color:#1b2b8a}
.svc td.c{text-align:center;color:#1b2b8a;width:34px;font-size:15px}
.rules{margin-top:12px;font-size:11.5px;line-height:1.6}
.rules h4{display:block;width:max-content;margin:0 auto 4px;background:var(--red);color:#fff;border-radius:99px;padding:1px 14px;font-size:13px}
.rules ol{margin:0;padding-left:20px}
.sig{display:flex;justify-content:space-between;margin-top:30px;font-weight:700;color:var(--red);font-size:12px}
.sig div{border-top:1px solid #444;padding-top:3px;min-width:130px;text-align:center}
.stamp{text-align:center;margin-top:8px;font-weight:800;color:var(--blue);letter-spacing:.1em}
`;

function brand(name) {
  const cols = ['#e2672a', '#d2452b', '#1a72b8', '#e2672a', '#1a72b8', '#6a3d9a', '#d2452b', '#1a72b8', '#6a3d9a', '#e2672a'];
  let i = 0;
  return [...String(name).toUpperCase()]
    .map((ch) => (ch === ' ' ? '&nbsp;' : `<span style="color:${cols[i++ % cols.length]}">${esc(ch)}</span>`))
    .join('');
}

export function billHTML(p, settings, ledger) {
  const s = settings, m = projMoney(p, ledger), fin = p.status === 'final';
  const svcs = s.services.concat((p.services || []).filter((x) => !s.services.includes(x)));
  const ln = (a, b, c, d) =>
    `<div class="ln"><b>${a}</b><span class="hand">${esc(b || '')}</span><span class="gap"></span>${c ? `<b>${c}</b><span class="hand">${esc(d || '')}</span>` : ''}</div>`;
  const extraRows = (p.extras || []).map((x) => `<tr><td>${esc(String(x.label).toUpperCase())}</td><td class="v">${rs(x.amount)}</td></tr>`).join('');
  const received = m.paid - n(p.advance);
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head><body>
<div class="bill">
<span class="tag">${fin ? 'FINAL BILL' : 'ORDER RECEIPT'}</span>
${s.name ? `<div class="brand">${brand(s.name)}</div>` : ''}
${s.tagline ? `<div class="tagline">${esc(String(s.tagline).toUpperCase())}</div>` : ''}
${s.phones ? `<div class="contact">Mob: ${esc(s.phones)}</div>` : ''}
${s.address ? `<div class="addr">${esc(s.address)}</div>` : ''}
<div class="meta"><span>${fin ? 'Bill No.' : 'Sl. No.'} <span class="hand">${esc(fin ? p.billNo || p.serial : p.serial)}</span></span><span>Date <span class="hand">${esc(dmy(fin ? p.billDate : p.receiptDate))}</span></span></div>
<div class="box"><span class="lbl">BOOKING DETAILS</span>
${ln('Name', p.customerName)}${ln('Father’s Name', p.fatherName)}${ln('Mob No.', p.mobile, 'Booking Dt.', dmy(p.bookingDate))}
${ln('Address', p.from, 'To', p.to)}${ln('Aadhaar No.', p.aadhaar, 'Pan', p.pan)}
${ln('Start Time', p.startTime, 'End Time', (p.endTime || '') + (p.shift ? '  (' + p.shift + ')' : ''))}
${p.segment || p.eventType ? ln('Programme', [p.segment, p.eventType].filter(Boolean).join(' · ')) : ''}
</div>
<div class="two">
<table><tbody>
<tr><td>TOTAL AMOUNT</td><td class="v">${rs(m.total)}</td></tr>
${extraRows}
${m.disc ? `<tr><td>DISCOUNT</td><td class="v">− ${rs(m.disc)}</td></tr>` : ''}
${(p.extras || []).length || m.disc ? `<tr><td>NET AMOUNT</td><td class="v">${rs(m.net)}</td></tr>` : ''}
<tr><td>ADVANCE</td><td class="v">${rs(p.advance)}</td></tr>
${received > 0 ? `<tr><td>RECEIVED</td><td class="v">${rs(received)}</td></tr>` : ''}
<tr><td>BALANCE</td><td class="v">${rs(m.balance)}</td></tr>
</tbody></table>
<table class="svc"><tbody>${svcs.map((x) => `<tr><td>${esc(x)}</td><td class="c">${(p.services || []).includes(x) ? '✓' : '✗'}</td></tr>`).join('')}</tbody></table>
</div>
${fin && m.balance <= 0 ? '<div class="stamp">— PAID IN FULL —</div>' : ''}
${s.rulesTitle || (s.rules || []).length ? `<div class="rules">${s.rulesTitle ? `<h4>${esc(s.rulesTitle)}</h4>` : ''}<ol>${(s.rules || []).map((r) => `<li>${esc(r)}</li>`).join('')}</ol></div>` : ''}
<div class="sig"><div><span class="hand">${esc(p.customerName)}</span><br>Party Signature</div><div>Auth. Signature</div></div>
</div></body></html>`;
}

export function billText(p, s, ledger) {
  const m = projMoney(p, ledger), fin = p.status === 'final';
  const L = [
    [String(s.name || '').toUpperCase(), s.tagline].filter(Boolean).join(' – ') || null,
    fin ? `FINAL BILL No. ${p.billNo || p.serial} | ${dmy(p.billDate)}` : `ORDER RECEIPT Sl. No. ${p.serial} | ${dmy(p.receiptDate)}`,
    '',
    `Name: ${p.customerName || ''}`,
    p.fatherName ? `Father: ${p.fatherName}` : null,
    `Mobile: ${p.mobile || ''}`,
    `Programme: ${dmy(p.bookingDate)} ${[p.startTime, p.endTime].filter(Boolean).join('–')}${p.shift ? ' (' + p.shift + ')' : ''}`,
    `Place: ${[p.from, p.to].filter(Boolean).join(' to ')}`,
    `Effects: ${(p.services || []).join(', ') || '–'}`,
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
