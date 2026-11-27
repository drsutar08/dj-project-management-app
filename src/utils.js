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

// Staff money. Advances are payments marked as advance; they come off what the person has
// earned, the same way wage payments do. advanceLeft is advance not yet covered by wages earned.
export function empMoney(id, ledger) {
  let earned = 0, paid = 0, advances = 0;
  (ledger || []).forEach((l) => {
    if (l.empId !== id) return;
    if (l.kind === 'earn') earned += n(l.amount);
    else { paid += n(l.amount); if (l.advance) advances += n(l.amount); }
  });
  const wagesPaid = paid - advances;
  const advanceLeft = Math.max(0, advances - Math.max(0, earned - wagesPaid));
  return { earned, paid, advances, wagesPaid, advanceLeft, due: earned - paid };
}

// Attendance for a month (ym = "YYYY-MM"): per person, programmes worked, days, earned and paid.
export function attendance(employees, ledger, projects, ym) {
  return (employees || []).map((e) => {
    const rows = (ledger || []).filter((l) => l.empId === e.id && String(l.date || '').startsWith(ym));
    const work = rows.filter((l) => l.kind === 'earn');
    const progIds = [...new Set(work.map((l) => l.projectId).filter(Boolean))];
    return {
      e,
      programmes: progIds.map((id) => (projects || []).find((p) => p.id === id)).filter(Boolean)
        .sort((a, b) => String(a.bookingDate).localeCompare(String(b.bookingDate))),
      days: new Set(work.map((l) => l.date)).size,
      earned: work.reduce((a, l) => a + n(l.amount), 0),
      paid: rows.filter((l) => l.kind !== 'earn').reduce((a, l) => a + n(l.amount), 0),
      advances: rows.filter((l) => l.kind !== 'earn' && l.advance).reduce((a, l) => a + n(l.amount), 0),
    };
  });
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

// ---------- Profit & loss ----------
// Each booking's income and costs count on its programme date, so a booking's own
// profit and the period totals always agree. Costs not tied to a booking count on their own date.

const itemCost = (items, id) => n(((items || []).find((i) => i.id === id) || {}).cost);

// d = { ledger, expenses, moves, items }
export function bookingPL(p, d) {
  const m = projMoney(p, d.ledger);
  const cancelled = p.status === 'cancel';
  const income = cancelled ? m.paid : m.net; // a cancelled booking keeps only what was paid
  const expenseList = (d.expenses || []).filter((e) => e.projectId === p.id);
  const expenses = expenseList.reduce((a, e) => a + n(e.amount), 0);
  const stockUsed = (d.moves || [])
    .filter((mv) => mv.projectId === p.id && mv.type === 'out')
    .reduce((a, mv) => a + n(mv.qty) * itemCost(d.items, mv.itemId), 0);
  const cost = m.labour + expenses + stockUsed;
  return { income, wages: m.labour, expenses, expenseList, stockUsed, cost, profit: income - cost, cancelled };
}

// d = { projects, ledger, expenses, moves, items }; from/to are YYYY-MM-DD, inclusive.
export function periodPL(d, from, to) {
  const inR = (x) => !!x && x >= from && x <= to;
  const ids = new Set((d.projects || []).map((p) => p.id));
  const lines = {};
  const add = (k, v) => { if (v) lines[k] = (lines[k] || 0) + v; };
  let income = 0;
  const bookings = [];
  (d.projects || []).forEach((p) => {
    if (!inR(p.bookingDate)) return;
    const pl = bookingPL(p, d);
    if (!pl.income && !pl.cost) return;
    income += pl.income;
    add('Staff wages', pl.wages);
    pl.expenseList.forEach((e) => add(e.category || 'Other', n(e.amount)));
    add('Stock used', pl.stockUsed);
    bookings.push({ p, pl });
  });
  (d.ledger || []).forEach((l) => {
    if (l.kind === 'earn' && !(l.projectId && ids.has(l.projectId)) && inR(l.date)) add('Staff wages', n(l.amount));
  });
  (d.expenses || []).forEach((e) => {
    if (!(e.projectId && ids.has(e.projectId)) && inR(e.date)) add(e.category || 'Other', n(e.amount));
  });
  let stockBought = 0;
  (d.moves || []).forEach((mv) => {
    if (!inR(mv.date)) return;
    if (mv.type === 'out' && !(mv.projectId && ids.has(mv.projectId))) add('Stock used', n(mv.qty) * itemCost(d.items, mv.itemId));
    if (mv.type === 'repair') add('Repairs', n(mv.cost));
    if (mv.type === 'in') stockBought += n(mv.cost);
  });
  const list = Object.entries(lines).sort((a, b) => b[1] - a[1]);
  const cost = list.reduce((a, [, v]) => a + v, 0);
  bookings.sort((a, b) => String(a.p.bookingDate).localeCompare(String(b.p.bookingDate)));
  return { income, cost, profit: income - cost, lines: list, bookings, stockBought };
}

// Date helpers for the reports (all YYYY-MM-DD strings).
const pad2 = (x) => String(x).padStart(2, '0');
export const isoOf = (dt) => dt.getUTCFullYear() + '-' + pad2(dt.getUTCMonth() + 1) + '-' + pad2(dt.getUTCDate());
export const addDays = (iso, k) => {
  const [y, m, dd] = iso.split('-').map(Number);
  return isoOf(new Date(Date.UTC(y, m - 1, dd + k)));
};
export const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-12
export const signed = (v) => (v < 0 ? '−' : v > 0 ? '+' : '') + inr(Math.abs(v));

// Day of the week for a YYYY-MM-DD date, e.g. "Monday".
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const dayName = (iso) => {
  const p = String(iso || '').split('-').map(Number);
  if (p.length !== 3 || !p[0]) return '';
  return DAYS[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()];
};

// Quantity of a setup item or effect on a booking. Older bookings only had a list of
// included effects (no counts), so an included effect without a count counts as 1.
export const qtyOf = (p, name) => {
  const q = p && p.qty ? n(p.qty[name]) : 0;
  if (q) return q;
  return (p && p.services || []).includes(name) ? 1 : 0;
};

// Sound setup and effects lines for a booking: [{ name, qty, kind }], in settings order.
export function setupLines(p, settings) {
  const units = settings.itemUnits || {};
  const sound = (settings.soundSetup || []).map((name) => ({ name, qty: qtyOf(p, name), kind: 'sound', unit: units[name] || '' }));
  const fx = (settings.services || []).concat((p.services || []).filter((x) => !(settings.services || []).includes(x) && !(settings.soundSetup || []).includes(x)))
    .map((name) => ({ name, qty: qtyOf(p, name), kind: 'effect', unit: units[name] || '' }));
  return { sound, fx };
}

// Item name with its unit, e.g. "Paper Spray (Kg)". Items without a unit are counted in pieces.
export const withUnit = (name, unit) => (unit ? name + ' (' + unit + ')' : name);
// The count as shown: "5", "2.5".
export const qtyLabel = (qty) => String(Math.round(n(qty) * 100) / 100);

// Settings text "Paper Spray = kg" (one per line) <-> { 'Paper Spray': 'kg' }
export const unitsToText = (m) => Object.entries(m || {}).map(([k, v]) => k + ' = ' + v).join('\n');
export const textToUnits = (t) => {
  const out = {};
  String(t || '').split('\n').forEach((line) => {
    const i = line.indexOf('=');
    if (i < 0) return;
    const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim();
    if (k && v) out[k] = v;
  });
  return out;
};

// Aadhaar as printed on bills and receipts: full, or only the last 4 digits when masking is on.
export const aadhaarForBill = (v, settings) => {
  const d = String(v || '').replace(/\s/g, '');
  if (!d) return '';
  if (!(settings && settings.maskAadhaar)) return String(v);
  return 'XXXX XXXX ' + d.slice(-4);
};

// ---------- Calendar & clashes ----------
// Other active bookings on the same date and shift (Day/Night). A booking with no shift
// set clashes with either shift, to be safe.
export function clashesFor(projects, p) {
  if (!p || !p.bookingDate) return [];
  return (projects || []).filter(
    (x) => x.id !== p.id && x.status !== 'cancel' && x.bookingDate === p.bookingDate && (!x.shift || !p.shift || x.shift === p.shift)
  );
}

// ---------- Customers (worked out from bookings) ----------
const digits = (v) => String(v || '').replace(/\D/g, '');
// Customers are matched by the last 10 digits of their mobile, or by name when there is no mobile.
export const customerKey = (p) => {
  const d = digits(p.mobile);
  return d.length >= 10 ? 'm' + d.slice(-10) : 'n' + String(p.customerName || '').trim().toLowerCase();
};

export function customersOf(projects, ledger) {
  const map = {};
  [...(projects || [])]
    .sort((a, b) => String(a.bookingDate).localeCompare(String(b.bookingDate)))
    .forEach((p) => {
      if (!String(p.customerName || '').trim() && !digits(p.mobile)) return;
      const k = customerKey(p);
      const c = map[k] || (map[k] = { key: k, bookings: [], spent: 0, paid: 0, due: 0 });
      // Latest booking wins for the details, but never blanks out something known.
      ['customerName', 'fatherName', 'mobile', 'address', 'aadhaar', 'pan', 'age'].forEach((f) => { if (p[f]) c[f] = p[f]; });
      c.bookings.push(p);
      if (p.status !== 'cancel') {
        const m = projMoney(p, ledger);
        c.spent += m.net;
        c.paid += m.paid;
        c.due += Math.max(0, m.balance);
      }
      c.last = p.bookingDate;
    });
  return Object.values(map).sort((a, b) => String(b.last).localeCompare(String(a.last)));
}

// Day and Night slots on a date: who has each one. A booking without a shift holds both.
export function slotsOn(projects, date, exceptId) {
  const s = { Day: [], Night: [] };
  if (!date) return s;
  (projects || []).forEach((x) => {
    if (x.id === exceptId || x.status === 'cancel' || x.bookingDate !== date) return;
    if (x.shift === 'Day' || !x.shift) s.Day.push(x);
    if (x.shift === 'Night' || !x.shift) s.Night.push(x);
  });
  return s;
}

// All contact numbers on a booking: the main mobile first, then any others.
export const allMobiles = (p) => [p && p.mobile, ...((p && p.altMobiles) || [])].map((x) => String(x || '').trim()).filter(Boolean);
