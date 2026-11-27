// Programme reminders.
// - On a phone: notifications the evening before each programme, and the morning after a
//   programme if the customer still owes money.
// - Everywhere: the same list is shown on the Home screen ("Today & tomorrow", "Collect balance").
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useStore } from './store';
import { addDays, dmy, inr, projMoney, today } from './utils';

export const DEFAULT_REMIND_AT = '19:00'; // evening before
const BALANCE_AT = '10:00'; // morning after the programme
const MAX_SCHEDULED = 60; // iOS keeps at most 64 scheduled notifications
export const notificationsSupported = Platform.OS !== 'web';

const place = (p) => [p.from, p.to].filter(Boolean).join(' → ');
const timeTxt = (p) => [[p.startTime, p.endTime].filter(Boolean).join(' – '), p.shift].filter(Boolean).join(' · ');

// What needs attention now: programmes today/tomorrow, and balances due after a programme.
export function dueList(projects, ledger, td = today()) {
  const tm = addDays(td, 1);
  const soon = projects
    .filter((p) => p.status === 'booked' && (p.bookingDate === td || p.bookingDate === tm))
    .sort((a, b) => String(a.bookingDate).localeCompare(String(b.bookingDate)) || (a.shift === 'Day' ? -1 : 1));
  const collect = projects
    .filter((p) => p.status !== 'cancel' && p.bookingDate && p.bookingDate < td && projMoney(p, ledger).balance > 0)
    .sort((a, b) => String(b.bookingDate).localeCompare(String(a.bookingDate)));
  return { soon, collect, tomorrow: tm };
}

const at = (iso, hhmm) => {
  const [y, m, d] = iso.split('-').map(Number);
  const [h, mi] = String(hhmm || DEFAULT_REMIND_AT).split(':').map(Number);
  return new Date(y, m - 1, d, h || 0, mi || 0, 0);
};

// The notifications to schedule from now on.
export function plannedReminders(projects, ledger, settings, now = new Date()) {
  const list = [];
  projects.forEach((p) => {
    if (!p.bookingDate || p.status === 'cancel') return;
    if (p.status === 'booked') {
      const when = at(addDays(p.bookingDate, -1), settings.remindAt || DEFAULT_REMIND_AT);
      if (when > now) list.push({
        when, id: 'prog-' + p.id,
        title: 'Tomorrow: ' + (p.customerName || 'Programme'),
        body: [timeTxt(p), place(p), [p.segment, p.eventType].filter(Boolean).join(' · ')].filter(Boolean).join(' · ') || dmy(p.bookingDate),
        data: { bookingId: p.id },
      });
    }
    if (settings.remindBalance !== false) {
      const bal = projMoney(p, ledger).balance;
      const when = at(addDays(p.bookingDate, 1), BALANCE_AT);
      if (bal > 0 && when > now) list.push({
        when, id: 'bal-' + p.id,
        title: 'Collect balance: ' + (p.customerName || 'customer'),
        body: inr(bal) + ' still due for the programme on ' + dmy(p.bookingDate) + '.',
        data: { bookingId: p.id },
      });
    }
  });
  return list.sort((a, b) => a.when - b.when).slice(0, MAX_SCHEDULED);
}

export async function askPermission() {
  if (!notificationsSupported) return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const res = await Notifications.requestPermissionsAsync();
  return !!res.granted;
}

async function reschedule(projects, ledger, settings) {
  if (!notificationsSupported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.remindersOn) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('programmes', { name: 'Programme reminders', importance: Notifications.AndroidImportance.HIGH });
  }
  for (const r of plannedReminders(projects, ledger, settings)) {
    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: { title: r.title, body: r.body, data: r.data },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.when, channelId: 'programmes' },
    });
  }
}

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

// Keeps the phone's scheduled notifications in step with the bookings. Renders nothing.
export function ReminderScheduler() {
  const { projects, ledger, settings } = useStore();
  const timer = useRef(null);
  // Only what affects reminders, so typing elsewhere doesn't reschedule.
  const key = JSON.stringify([
    settings.remindersOn, settings.remindAt, settings.remindBalance,
    projects.map((p) => [p.id, p.bookingDate, p.status, p.customerName, p.startTime, p.endTime, p.shift, p.from, p.to, projMoney(p, ledger).balance]),
  ]);
  useEffect(() => {
    if (!notificationsSupported) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { reschedule(projects, ledger, settings).catch(() => {}); }, 1500);
    return () => clearTimeout(timer.current);
  }, [key]);
  return null;
}
