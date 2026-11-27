import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Screen, Card, T, H2, List, Empty, Btn, Icon, LinkBtn } from '../components/ui';
import { ProjRow } from '../components/rows';
import { useSorted } from '../store';
import { useTheme } from '../theme';
import { clashesFor, daysInMonth, dayName, dmy, slotsOn, today } from '../utils';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const pad = (x) => String(x).padStart(2, '0');

// Month calendar of programmes. Night bookings show a purple dot, Day bookings an orange one;
// a red ring marks a day with two bookings on the same shift.
export default function CalendarScreen({ navigation, route }) {
  const c = useTheme();
  const { projects } = useSorted();
  const td = today();
  const start = route.params?.date || td;
  const [ym, setYm] = useState(start.slice(0, 7));
  const [sel, setSel] = useState(start);
  const [y, m] = ym.split('-').map(Number);
  const active = projects.filter((p) => p.status !== 'cancel' && p.bookingDate);

  const byDay = {};
  active.forEach((p) => { if (p.bookingDate.startsWith(ym)) (byDay[p.bookingDate] = byDay[p.bookingDate] || []).push(p); });
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const nDays = daysInMonth(y, m);
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: nDays }, (_, i) => `${ym}-${pad(i + 1)}`)];
  while (cells.length % 7) cells.push(null);

  const move = (k) => {
    const t = y * 12 + (m - 1) + k;
    setYm(`${Math.floor(t / 12)}-${pad((t % 12) + 1)}`);
  };
  const monthCount = Object.values(byDay).reduce((a, l) => a + l.length, 0);
  const dayList = active.filter((p) => p.bookingDate === sel);
  const clashDay = dayList.some((p) => clashesFor(active, p).length);
  const slots = slotsOn(active, sel);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={() => move(-1)} hitSlop={8} accessibilityLabel="Previous month" style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-back" size={22} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T size={17} weight="800">{MONTHS[m - 1]} {y}</T>
          <T muted size={12}>{monthCount ? `${monthCount} programme${monthCount === 1 ? '' : 's'}` : 'No programmes'}</T>
        </View>
        <Pressable onPress={() => move(1)} hitSlop={8} accessibilityLabel="Next month" style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-forward" size={22} />
        </Pressable>
      </View>

      <Card style={{ paddingHorizontal: 8, paddingVertical: 10 }}>
        <View style={{ flexDirection: 'row' }}>
          {WEEK.map((w, i) => <T key={i} muted size={11.5} weight="800" style={{ flex: 1, textAlign: 'center', marginBottom: 6 }}>{w}</T>)}
        </View>
        {Array.from({ length: cells.length / 7 }, (_, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
              if (!d) return <View key={i} style={{ flex: 1, height: 52 }} />;
              const list = byDay[d] || [];
              const night = list.filter((p) => p.shift !== 'Day').length;
              const dayN = list.filter((p) => p.shift === 'Day').length;
              const clash = list.some((p) => clashesFor(list, p).length);
              const isSel = d === sel, isToday = d === td;
              return (
                <Pressable
                  key={d}
                  onPress={() => setSel(d)}
                  accessibilityRole="button"
                  accessibilityLabel={`${dmy(d)}${list.length ? ', ' + list.length + ' booking' + (list.length === 1 ? '' : 's') : ''}${clash ? ', double booked' : ''}`}
                  style={{ flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', padding: 2 }}
                >
                  <View style={{ width: 40, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: isSel ? c.accent : list.length ? c.plumBg : 'transparent', borderWidth: clash ? 2 : isToday && !isSel ? 1.5 : 0, borderColor: clash ? c.bad : c.accent }}>
                    <T size={14} weight={list.length || isToday ? '800' : '600'} color={isSel ? c.accentInk : list.length ? c.plum : c.fg}>{Number(d.slice(8))}</T>
                    <View style={{ flexDirection: 'row', gap: 3, height: 6 }}>
                      {night ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isSel ? '#fff' : c.accent }} /> : null}
                      {dayN ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isSel ? '#fff' : c.warn }} /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 }}>
          {[[c.accent, 'Night'], [c.warn, 'Day']].map(([col, l]) => (
            <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} />
              <T muted size={12} weight="600">{l}</T>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 12, height: 12, borderRadius: 4, borderWidth: 2, borderColor: c.bad }} />
            <T muted size={12} weight="600">Double booked</T>
          </View>
        </View>
      </Card>

      <View style={{ gap: 12 }}>
        <H2 right={sel !== td ? 'Today' : null} onRight={() => { setSel(td); setYm(td.slice(0, 7)); }}>{dmy(sel)} · {dayName(sel)}</H2>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['Day', 'Night'].map((k) => (
            <View key={k} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: slots[k].length ? c.warnBg : c.goodBg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9 }}>
              <Icon name={k === 'Day' ? 'sunny-outline' : 'moon-outline'} size={16} color={slots[k].length ? c.warn : c.good} />
              <T size={12.5} weight="800" color={slots[k].length ? c.warn : c.good} numberOfLines={1} style={{ flex: 1 }}>
                {k}: {slots[k].length ? slots[k].map((x) => x.customerName || 'Sl. ' + x.serial).join(', ') : 'free'}
              </T>
            </View>
          ))}
        </View>
        {clashDay ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: c.badBg, borderRadius: 14, padding: 12 }}>
            <Icon name="warning" size={18} color={c.bad} />
            <T size={13} weight="700" color={c.bad} style={{ flex: 1 }}>Two bookings on the same shift this day. Check you have enough equipment and staff.</T>
          </View>
        ) : null}
        {dayList.length ? (
          <List>{dayList.map((p) => <ProjRow key={p.id} p={p} onPress={() => navigation.navigate('Booking', { id: p.id })} />)}</List>
        ) : (
          <Empty title="Free day" text="No programme booked on this date." />
        )}
        <Btn title="+ New booking on this day" onPress={() => navigation.navigate('BookingForm', { date: sel })} />
      </View>
    </Screen>
  );
}
