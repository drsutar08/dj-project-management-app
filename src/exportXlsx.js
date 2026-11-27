// Excel export of a period (day, month or year) for the accountant.
// Sheets: Summary, Bookings, Expenses, Staff wages, Payments received.
import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { toast } from './components/ui';
import { paymentList } from './bill';
import { bookingPL, dmy, n, periodPL, projMoney } from './utils';

const inRange = (d, from, to) => !!d && d >= from && d <= to;
const money = (v) => Math.round(n(v) * 100) / 100;

export function buildWorkbook(d, settings, from, to, label) {
  const pl = periodPL(d, from, to);
  const emp = (id) => (d.employees || []).find((e) => e.id === id) || {};
  const proj = (id) => (d.projects || []).find((p) => p.id === id);

  const summary = [
    [settings.name || 'Business', ''],
    ['Period', label],
    ['From', dmy(from)],
    ['To', dmy(to)],
    [],
    ['Income', money(pl.income)],
    ...pl.lines.map(([k, v]) => ['Expense: ' + k, money(v)]),
    ['Total expenses', money(pl.cost)],
    [pl.profit < 0 ? 'Loss' : 'Profit', money(pl.profit)],
    [],
    ['Stock bought (not counted as expense)', money(pl.stockBought)],
    ['Programmes', pl.bookings.length],
  ];

  const bookings = [['Programme date', 'Sl. No.', 'Customer', 'Mobile', 'Programme', 'Status', 'Bill total', 'Paid', 'Balance', 'Staff wages', 'Expenses', 'Stock used', 'Profit']];
  pl.bookings.forEach(({ p, pl: b }) => {
    const m = projMoney(p, d.ledger);
    bookings.push([dmy(p.bookingDate), p.serial, p.customerName || '', p.mobile || '', [p.segment, p.eventType].filter(Boolean).join(' · '), p.status || 'booked',
      money(b.income), money(m.paid), money(Math.max(0, m.balance)), money(b.wages), money(b.expenses), money(b.stockUsed), money(b.profit)]);
  });

  const expenses = [['Date', 'Type', 'Amount', 'Paid by', 'For booking', 'Note']];
  (d.expenses || []).forEach((e) => {
    const p = e.projectId ? proj(e.projectId) : null;
    const when = p ? p.bookingDate : e.date;
    if (!inRange(when, from, to)) return;
    expenses.push([dmy(e.date), e.category || '', money(e.amount), e.mode || '', p ? 'Sl. No. ' + p.serial + ' · ' + (p.customerName || '') : 'General', e.note || '']);
  });

  const wages = [['Date', 'Staff', 'Role', 'Earned', 'Paid', 'For booking', 'Note']];
  (d.ledger || []).forEach((l) => {
    if (!inRange(l.date, from, to)) return;
    const e = emp(l.empId), p = l.projectId ? proj(l.projectId) : null;
    wages.push([dmy(l.date), e.name || 'Removed staff', e.role || '', l.kind === 'earn' ? money(l.amount) : '', l.kind === 'earn' ? '' : money(l.amount), p ? 'Sl. No. ' + p.serial : '', l.note || '']);
  });

  const payments = [['Date', 'Receipt No.', 'Customer', 'Amount', 'Paid by', 'For programme']];
  (d.projects || []).forEach((p) => {
    paymentList(p).forEach((x) => {
      if (!inRange(x.date, from, to)) return;
      payments.push([dmy(x.date), x.no, p.customerName || '', money(x.amount), x.mode || 'Cash', dmy(p.bookingDate)]);
    });
  });

  const wb = XLSX.utils.book_new();
  const add = (name, rows, widths) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = widths.map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
  add('Summary', summary, [38, 16]);
  add('Bookings', bookings, [14, 8, 24, 14, 18, 10, 12, 12, 12, 12, 12, 12, 12]);
  add('Expenses', expenses, [12, 20, 12, 12, 30, 30]);
  add('Staff wages', wages, [12, 22, 16, 12, 12, 14, 24]);
  add('Payments received', payments, [12, 12, 24, 12, 12, 14]);
  return wb;
}

export async function exportPeriod(d, settings, from, to, label) {
  const wb = buildWorkbook(d, settings, from, to, label);
  const file = ((settings.name || 'Business').replace(/[^A-Za-z0-9]+/g, '-') + '-' + label.replace(/[^A-Za-z0-9]+/g, '-') + '.xlsx').replace(/-+/g, '-');
  try {
    if (Platform.OS === 'web') {
      XLSX.writeFile(wb, file);
      toast('Excel file downloaded');
      return;
    }
    const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.cacheDirectory + file;
    await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Share Excel file', UTI: 'org.openxmlformats.spreadsheetml.sheet' });
    } else toast('Saved to ' + uri);
  } catch (e) {
    toast('Couldn’t make the Excel file. Try again.');
  }
}
