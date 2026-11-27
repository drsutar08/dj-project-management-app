// UPI payment link and QR code, used on the bill (screen and PDF).
import qrcode from 'qrcode-generator';

const UPI_ID = /^[a-z0-9._-]{1,256}@[a-z][a-z0-9.-]{1,64}$/i;
export const isUpiId = (v) => UPI_ID.test(String(v || '').trim());

// upi://pay link with the amount filled in. Any UPI app (GPay, PhonePe, Paytm, BHIM) opens it.
export function upiLink(settings, amount, note) {
  const params = [
    ['pa', String(settings.upiId || '').trim()],
    ['pn', String(settings.upiName || settings.name || '').trim()],
    ['am', amount > 0 ? (Math.round(amount * 100) / 100).toFixed(2) : ''],
    ['cu', 'INR'],
    ['tn', String(note || '').slice(0, 50)],
  ].filter(([, v]) => v);
  return 'upi://pay?' + params.map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
}

// QR modules as rows of booleans (true = dark).
export function qrMatrix(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}

// QR code as an SVG string for the PDF (one path, crisp at any size).
export function qrSvg(text, size = 132) {
  const m = qrMatrix(text);
  const n = m.length + 8; // 4-module quiet zone on each side
  let d = '';
  m.forEach((row, r) => row.forEach((on, c) => { if (on) d += `M${c + 4} ${r + 4}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="UPI QR code"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

// Whether the bill should show "Scan to pay": a valid UPI ID and something still due.
export const showUpi = (settings, balance) => isUpiId(settings.upiId) && balance > 0;
