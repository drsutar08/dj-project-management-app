export const n = (v) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : 0;
};

// Indian grouping (1,23,456) without relying on Intl support on the device.
export const group = (v) => {
  const neg = v < 0;
  const s = String(Math.round(Math.abs(v)));
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (neg ? '-' : '') + (rest ? rest + ',' + last3 : last3);
};
export const inr = (v) => '₹' + group(n(v));

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Stored as YYYY-MM-DD, shown as D.M.YYYY like the paper receipt.
export const dmy = (iso) => {
  if (!iso) return '';
  const p = String(iso).split('-');
  return p.length === 3 ? `${+p[2]}.${+p[1]}.${p[0]}` : String(iso);
};

// Accepts 15.2.2027, 15/02/2027, 15-2-2027 or 2027-02-15. Returns ISO or ''.
export const parseDate = (txt) => {
  const s = String(txt || '').trim();
  if (!s) return '';
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!m) return null;
  let y = m[3];
  if (y.length === 2) y = '20' + y;
  const d = +m[1], mo = +m[2];
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const dparts = (iso) => {
  const p = String(iso || '').split('-');
  return p.length === 3 ? { d: String(+p[2]), m: MON[+p[1] - 1] || '', y: p[0] } : { d: '–', m: '', y: '' };
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const initials = (s) =>
  String(s || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export const maskId = (s) => {
  s = String(s || '').replace(/\s/g, '');
  return s.length > 4 ? '•••• ' + s.slice(-4) : s;
};

export function projMoney(p, ledger) {
  const total = n(p.total);
  const extras = (p.extras || []).reduce((a, x) => a + n(x.amount), 0);
  const disc = n(p.discount);
  const net = total + extras - disc;
  const paid = n(p.advance) + (p.payments || []).reduce((a, x) => a + n(x.amount), 0);
  const labour = (ledger || [])
    .filter((l) => l.kind === 'earn' && l.projectId === p.id)
    .reduce((a, l) => a + n(l.amount), 0);
  return { total, extras, disc, net, paid, balance: net - paid, labour, profit: net - labour };
}

export function empMoney(id, ledger) {
  let earned = 0, paid = 0;
  (ledger || []).forEach((l) => {
    if (l.empId !== id) return;
    if (l.kind === 'earn') earned += n(l.amount);
    else paid += n(l.amount);
  });
  return { earned, paid, due: earned - paid };
}

export const isReadyToBill = (p) =>
  p.status === 'done' || (p.status === 'booked' && String(p.bookingDate) < today());

// Inventory: how many of an item are free on a date, after repairs and other bookings that day.
export function itemAvail(it, projects, date, exceptProjectId) {
  const qty = n(it.qty), repair = n(it.repair);
  const booked = it.kind === 'consumable' ? 0 : (projects || [])
    .filter((p) => p.id !== exceptProjectId && p.status !== 'cancel' && p.status !== 'final' && date && p.bookingDate === date)
    .reduce((a, p) => a + (p.gear || []).filter((g) => g.itemId === it.id).reduce((b, g) => b + n(g.qty), 0), 0);
  return { qty, repair, booked, free: qty - repair - booked };
}
export const isLow = (it) => n(it.minQty) > 0 && n(it.qty) - n(it.repair) <= n(it.minQty);
export const qtyTxt = (q, unit) => (n(q) < 0 ? '-' : '') + group(Math.abs(n(q))) + (unit ? ' ' + unit : '');
