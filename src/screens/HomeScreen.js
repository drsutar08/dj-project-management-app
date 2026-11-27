import React, { useLayoutEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Screen, T, H2, List, Empty, Row, Tile } from '../components/ui';
import { ProjRow } from '../components/rows';
import { useStore, useSorted } from '../store';
import { useTheme, shadow } from '../theme';
import { MON, dmy, empMoney, initials, inr, isLow, isReadyToBill, n, projMoney, qtyTxt, today } from '../utils';

function Quick({ icon, label, onPress, bg, fg }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flex: 1, backgroundColor: c.surface, borderRadius: 18, paddingVertical: 14, alignItems: 'center', gap: 8, transform: [{ scale: pressed ? 0.97 : 1 }] }, shadow]}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <T size={20} weight="800" color={fg}>{icon}</T>
      </View>
      <T weight="700" size={12.5}>{label}</T>
    </Pressable>
  );
}

function Kpi({ label, value, sub, bg, fg, icon }) {
  const c = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: c.surface, borderRadius: 20, padding: 14 }, shadow]}>
      <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <T weight="800" color={fg}>{icon}</T>
      </View>
      <T muted size={12} weight="600">{label}</T>
      <T size={21} weight="800" style={{ letterSpacing: -0.5 }}>{value}</T>
      <T muted size={12}>{sub}</T>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const c = useTheme();
  const { settings, ledger, employees, items } = useStore();
  const { projects } = useSorted();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: settings.name,
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={10} style={{ marginRight: 16, backgroundColor: c.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
          <T weight="700" size={13}>Settings</T>
        </Pressable>
      ),
    });
  }, [navigation, settings.name, c]);

  const td = today();
  const up = projects.filter((p) => p.status === 'booked' && String(p.bookingDate) >= td);
  const custDue = projects.filter((p) => p.status !== 'cancel').reduce((a, p) => a + Math.max(0, projMoney(p, ledger).balance), 0);
  const staffDue = employees.reduce((a, e) => a + Math.max(0, empMoney(e.id, ledger).due), 0);
  const ym = td.slice(0, 7);
  const monthRev = projects.filter((p) => p.status !== 'cancel' && String(p.bookingDate).slice(0, 7) === ym).reduce((a, p) => a + projMoney(p, ledger).net, 0);
  const toBill = projects.filter(isReadyToBill);
  const open = (p) => navigation.navigate('Booking', { id: p.id });
  const low = items.filter(isLow);

  return (
    <Screen>
      <View style={{ backgroundColor: c.ink2, borderRadius: 26, padding: 20, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, right: -90, top: -120, backgroundColor: c.accent, opacity: 0.35 }} />
        <View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, right: -40, bottom: -130, backgroundColor: '#b27cff', opacity: 0.22 }} />
        <T color={c.inkMuted} weight="600" size={13}>Customers owe you</T>
        <T color={c.inkFg} weight="800" size={38} style={{ letterSpacing: -1.2, marginTop: 4 }}>{inr(custDue)}</T>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          {[['Staff to be paid', inr(staffDue)], [MON[new Date().getMonth()] + ' bookings', inr(monthRev)]].map(([l, v]) => (
            <View key={l} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderRadius: 16, padding: 12 }}>
              <T color={c.inkMuted} size={11.5} weight="600">{l}</T>
              <T color={c.inkFg} size={17} weight="800">{v}</T>
            </View>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Quick icon="+" label="New booking" bg={c.accent} fg={c.accentInk} onPress={() => navigation.navigate('BookingForm')} />
        <Quick icon="₹" label="Pay staff" bg={c.goodBg} fg={c.good} onPress={() => navigation.navigate('LedgerForm', { kind: 'pay' })} />
        <Quick icon="☺" label="Add staff" bg={c.plumBg} fg={c.plum} onPress={() => navigation.navigate('StaffForm')} />
        <Quick icon="▤" label="Stock" bg={low.length ? c.badBg : c.warnBg} fg={low.length ? c.bad : c.warn} onPress={() => navigation.navigate('Stock')} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Kpi icon="▦" bg={c.plumBg} fg={c.plum} label="Upcoming" value={String(up.length)} sub={up[0] ? 'Next ' + dmy(up[0].bookingDate) : 'None scheduled'} />
        <Kpi icon="≣" bg={c.warnBg} fg={c.warn} label="Ready to bill" value={String(toBill.length)} sub="Programmes done" />
      </View>

      {toBill.length ? (
        <View style={{ gap: 12 }}>
          <H2>Ready to bill</H2>
          <List>{toBill.map((p) => <ProjRow key={p.id} p={p} onPress={() => open(p)} />)}</List>
        </View>
      ) : null}

      {low.length ? (
        <View style={{ gap: 12 }}>
          <H2 right="All stock" onRight={() => navigation.navigate('Stock')}>Low stock</H2>
          <List>
            {low.map((it) => (
              <Row
                key={it.id}
                left={<Tile top={initials(it.name)} t="bad" />}
                title={it.name}
                sub={'Warn at ' + qtyTxt(it.minQty, it.unit)}
                right={qtyTxt(n(it.qty) - n(it.repair), it.unit)}
                rightColor={c.bad}
                onPress={() => navigation.navigate('Item', { id: it.id })}
              />
            ))}
          </List>
        </View>
      ) : null}

      <View style={{ gap: 12 }}>
        <H2 right="All bookings" onRight={() => navigation.navigate('Bookings')}>Upcoming</H2>
        {up.length ? (
          <List>{up.slice(0, 6).map((p) => <ProjRow key={p.id} p={p} onPress={() => open(p)} />)}</List>
        ) : (
          <Empty title="No upcoming bookings" text="Add your next programme with the customer’s details, timing and advance." action="+ New booking" onAction={() => navigation.navigate('BookingForm')} />
        )}
      </View>
    </Screen>
  );
}
