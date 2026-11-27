import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Screen, Card, T, List, Row, Tile, Empty, MoneyRow, Icon } from '../components/ui';
import { useStore, useSorted } from '../store';
import { useTheme } from '../theme';
import { attendance, dmy, initials, inr, today } from '../utils';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Who worked how many programmes in a month, with wages earned, paid and advances.
export default function AttendanceScreen({ navigation }) {
  const c = useTheme();
  const { ledger, projects } = useStore();
  const { employees } = useSorted();
  const [ym, setYm] = useState(today().slice(0, 7));
  const [openId, setOpenId] = useState(null);
  const [y, m] = ym.split('-').map(Number);
  const move = (k) => { const t = y * 12 + (m - 1) + k; setYm(Math.floor(t / 12) + '-' + String((t % 12) + 1).padStart(2, '0')); };

  const rows = attendance(employees, ledger, projects, ym)
    .filter((r) => r.e.active !== false || r.programmes.length || r.paid)
    .sort((a, b) => b.programmes.length - a.programmes.length || String(a.e.name).localeCompare(String(b.e.name)));
  const tot = rows.reduce((a, r) => ({ prog: a.prog + r.programmes.length, earned: a.earned + r.earned, paid: a.paid + r.paid, adv: a.adv + r.advances }), { prog: 0, earned: 0, paid: 0, adv: 0 });

  if (!employees.length) return <Screen><Empty title="No staff yet" text="Add staff first, then assign them to programmes." /></Screen>;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={() => move(-1)} hitSlop={8} accessibilityLabel="Previous month" style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-back" size={22} />
        </Pressable>
        <T size={17} weight="800" style={{ flex: 1, textAlign: 'center' }}>{MONTHS[m - 1]} {y}</T>
        <Pressable onPress={() => move(1)} hitSlop={8} accessibilityLabel="Next month" style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-forward" size={22} />
        </Pressable>
      </View>

      <Card style={{ gap: 8 }}>
        <MoneyRow label="Staff programmes this month" value={String(tot.prog)} />
        <MoneyRow label="Wages earned" value={inr(tot.earned)} />
        <MoneyRow label="Paid this month" value={inr(tot.paid)} />
        {tot.adv ? <MoneyRow label="of which advances" value={inr(tot.adv)} color={c.warn} /> : null}
      </Card>

      <List>
        {rows.map((r) => (
          <View key={r.e.id}>
            <Row
              onPress={() => setOpenId(openId === r.e.id ? null : r.e.id)}
              left={<Tile top={initials(r.e.name)} t={r.programmes.length ? 'plum' : 'warn'} />}
              title={r.e.name}
              sub={[r.e.role, r.days ? r.days + ' day' + (r.days === 1 ? '' : 's') : 'No work', r.advances ? inr(r.advances) + ' advance' : ''].filter(Boolean).join(' · ')}
              right={r.programmes.length + ' prog.'}
              rightSub={inr(r.earned)}
              extra={<Icon name={openId === r.e.id ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />}
            />
            {openId === r.e.id ? (
              <View style={{ paddingHorizontal: 14, paddingBottom: 12, gap: 6 }}>
                {r.programmes.length ? r.programmes.map((p) => (
                  <Pressable key={p.id} onPress={() => navigation.navigate('Booking', { id: p.id })} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: c.surface2, borderRadius: 10, padding: 10 }}>
                    <Icon name={p.shift === 'Day' ? 'sunny-outline' : 'moon-outline'} size={15} color={c.accent} />
                    <T size={13} weight="700" style={{ flex: 1 }} numberOfLines={1}>{dmy(p.bookingDate)} · {p.customerName}</T>
                    <Icon name="chevron-forward" size={15} color={c.muted} />
                  </Pressable>
                )) : <T muted size={13}>No programmes this month.</T>}
                <Pressable onPress={() => navigation.navigate('StaffMember', { id: r.e.id })}>
                  <T size={13} weight="800" color={c.plum}>Open {r.e.name}’s page</T>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </List>
    </Screen>
  );
}
