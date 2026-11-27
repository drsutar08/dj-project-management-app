// Printing, PDF sharing, text sharing and WhatsApp messages, shared by the bill,
// payment receipts, bookings and staff duty.
import { Linking, Platform, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { toast } from './components/ui';
import { dayName, dmy, inr, projMoney } from './utils';

// Web: print only the document. expo-print's web version prints the whole app window,
// so the HTML goes into an off-screen frame at the A4 printable width and that frame is printed.
export function printOnWeb(html) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, { position: 'fixed', left: '-10000px', top: '0', width: '748px', height: '1123px', border: '0' });
  document.body.appendChild(frame);
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 1000);
  }, 400);
}

export async function sharePdf(html, title = 'Share bill') {
  if (Platform.OS === 'web') {
    toast('Choose “Save as PDF” in the print window');
    return printOnWeb(html);
  }
  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: title, UTI: 'com.adobe.pdf' });
    } else toast('Sharing isn’t available on this phone.');
  } catch (e) {
    toast('Couldn’t make the PDF. Try again.');
  }
}

export async function printHtml(html) {
  if (Platform.OS === 'web') return printOnWeb(html);
  try {
    await Print.printAsync({ html });
  } catch (e) {
    if (!/cancel/i.test(String(e && e.message))) toast('Couldn’t open printing. Check that a printer or print service is set up.');
  }
}

// Share text; in a browser without a share menu, copy it instead.
export async function shareText(message) {
  if (Platform.OS === 'web' && !(typeof navigator !== 'undefined' && navigator.share)) {
    try {
      await navigator.clipboard.writeText(message);
      toast('Text copied. Paste it in WhatsApp.');
    } catch (e) {
      toast('Couldn’t copy the text on this browser.');
    }
    return;
  }
  Share.share({ message }).catch(() => {});
}

// ---------- WhatsApp ----------
// Indian mobile numbers: keep digits, drop a leading 0, add 91 to a 10-digit number.
export function waNumber(mobile) {
  let d = String(mobile || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = '91' + d;
  return d.length >= 11 ? d : '';
}

export async function openWhatsApp(mobile, text) {
  const num = waNumber(mobile);
  if (!num) return toast('Add a 10-digit mobile number first.');
  const url = `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  try {
    await Linking.openURL(url);
  } catch (e) {
    toast('Couldn’t open WhatsApp on this phone.');
  }
}

const when = (p) =>
  [dmy(p.bookingDate) + (dayName(p.bookingDate) ? ' (' + dayName(p.bookingDate) + ')' : ''), [p.startTime, p.endTime].filter(Boolean).join(' – '), p.shift]
    .filter(Boolean)
    .join(', ');
const place = (p) => [p.from, p.to].filter(Boolean).join(' → ');
const sign = (s) => [s.name, s.phones].filter(Boolean).join('\n');

export function confirmationText(p, s, ledger) {
  const m = projMoney(p, ledger);
  return [
    `Namaskar ${p.customerName || ''},`,
    `Your booking with ${s.name || 'us'} is confirmed.`,
    '',
    `Sl. No.: ${p.serial}`,
    `Programme: ${[p.segment, p.eventType].filter(Boolean).join(' · ') || '—'}`,
    `Date: ${when(p)}`,
    place(p) ? `Place: ${place(p)}` : null,
    `Total: ${inr(m.net)}`,
    `Advance received: ${inr(m.paid)}`,
    `Balance: ${inr(Math.max(0, m.balance))}`,
    '',
    'Thank you.',
    sign(s),
  ].filter((x) => x !== null).join('\n');
}

export function reminderText(p, s, ledger) {
  const m = projMoney(p, ledger);
  return [
    `Namaskar ${p.customerName || ''},`,
    `This is a reminder from ${s.name || 'us'} for the programme on ${dmy(p.bookingDate)}.`,
    '',
    `Total: ${inr(m.net)}`,
    `Paid: ${inr(m.paid)}`,
    `Balance due: ${inr(Math.max(0, m.balance))}`,
    s.upiId ? `\nPay by UPI to ${s.upiId}` : null,
    '',
    'Please clear the balance at the earliest. Thank you.',
    sign(s),
  ].filter((x) => x !== null).join('\n');
}

export function dutyText(p, emp, s) {
  return [
    `Namaskar ${emp.name || ''},`,
    `Duty for ${s.name || 'the programme'}:`,
    '',
    `Date: ${when(p)}`,
    place(p) ? `Place: ${place(p)}` : null,
    `Customer: ${p.customerName || ''}${p.mobile ? ' (' + p.mobile + ')' : ''}`,
    `Programme: ${[p.segment, p.eventType].filter(Boolean).join(' · ') || '—'}`,
    emp.role ? `Your role: ${emp.role}` : null,
    p.notes ? `Note: ${p.notes}` : null,
    '',
    'Please reach on time.',
  ].filter((x) => x !== null).join('\n');
}
