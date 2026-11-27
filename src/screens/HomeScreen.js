import React, { useLayoutEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Screen, T, H2, List, Empty, Row, Tile } from '../components/ui';
import { ProjRow } from '../components/rows';
import { useStore, useSorted } from '../store';
import { useTheme, shadow } from '../theme';
import { MON, daysInMonth, dmy, empMoney, initials, inr, isLow, isReadyToBill, n, periodPL, projMoney, qtyTxt, signed, today } from '../utils';

// White card with an illustration on the left and a round arrow button on the right.
function HeroCard({ icon, title, sub, note, onPress, children }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { backgroundColor: c.heroBg, borderWidth: 1, borderColor: c.heroLine, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, transform: [{ scale: pressed ? 0.99 : 1 }] },
        shadow,
      ]}
    >
      <View style={{ width: 76, height: 76, borderRadius: 20, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: c.accent2, opacity: 0.25, right: -18, bottom: -18 }} />
        <T size={34} weight="800" color={c.accent}>{icon}</T>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T size={16} weight="800" numberOfLines={1}>{title}</T>
        {sub ? <T size={13} muted style={{ marginTop: 2 }} numberOfLines={2}>{sub}</T> : null}
        {children}
        {note ? <T size={12} weight="700" color={c.plum} style={{ marginTop: 6 }}>{note}</T> : null}
      </View>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
        <T size={18} weight="800" color={c.accentInk}>›</T>
      </View>
    </Pressable>
  );
}

// Coloured tile: icon box top-left, arrow top-right, title + subtitle, big faded symbol in the corner.
function ActionTile({ color, icon, title, sub, badge, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { flexGrow: 1, flexBasis: '46%', minHeight: 150, backgroundColor: color, borderRadius: 22, padding: 14, overflow: 'hidden', transform: [{ scale: pressed ? 0.97 : 1 }] },
        shadow,
        { shadowColor: color, shadowOpacity: 0.3 },
      ]}
    >
      <T size={86} weight="800" color="#ffffff" style={{ position: 'absolute', right: -6, bottom: -22, opacity: 0.16 }}>{icon}</T>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' }}>
          <T size={19} weight="800" color="#ffffff">{icon}</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {badge ? (
            <View style={{ backgroundColor: '#e8243f', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 }}>
              <T size={10} weight="800" color="#ffffff" style={{ letterSpacing: 0.4 }}>{badge}</T>
            </View>
          ) : null}
          <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' }}>
            <T size={14} weight="800" color="#ffffff">↗</T>
          </View>
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <T size={16.5} weight="800" color="#ffffff" style={{ marginTop: 18 }}>{title}</T>
      {sub ? <T size={12.5} weight="600" color="rgba(255,255,255,0.85)" numberOfLines={1} style={{ marginTop: 2 }}>{sub}</T> : null}
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const c = useTheme();
  const { settings, ledger, employees, items, expenses, moves } = useStore();
  const { projects } = useSorted();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: settings.name || 'Home',
      headerTitleStyle: { fontWeight: '800', fontSize: 24, color: c.fg },
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          hitSlop={10}
          accessibilityLabel="Business details and settings"
          style={{ marginRight: 16, width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
        >
          <T size={24} weight="700">☰</T>
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
  const billed = projects.filter((p) => p.status === 'final').length;
  const [yy, mm] = td.split('-').map(Number);
  const monthPL = periodPL({ projects, ledger, expenses, moves, items }, ym + '-01', ym + '-' + daysInMonth(yy, mm));

  return (
    <Screen>
      {!settings.name ? (
        <HeroCard
          icon="♫"
          title="Set up your business"
          sub="Add your name, phone numbers, address and bill rules"
          note="⚡ Takes about 2 minutes"
          onPress={() => navigation.navigate('Settings')}
        />
      ) : null}

      <HeroCard icon="₹" title="Customers owe you" onPress={() => navigation.navigate('Payments')}>
        <T size={28} weight="800" style={{ letterSpacing: -0.8, marginTop: 2 }}>{inr(custDue)}</T>
        <T size={12.5} muted numberOfLines={1}>
          Staff to pay {inr(staffDue)} · {MON[new Date().getMonth()]} {inr(monthRev)}
        </T>
      </HeroCard>

      <View style={{ gap: 12 }}>
        <T size={17} weight="800" style={{ letterSpacing: -0.3 }}>What do you want to do?</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <ActionTile color={c.tiles.purple} icon="+" title="New booking" sub="Customer, date & advance" onPress={() => navigation.navigate('BookingForm')} />
          <ActionTile
            color={c.tiles.green}
            icon="▦"
            title="Bookings"
            sub={up.length ? `${up.length} upcoming · next ${dmy(up[0].bookingDate)}` : 'No upcoming programmes'}
            onPress={() => navigation.navigate('Bookings')}
          />
          <ActionTile
            color={c.tiles.blue}
            icon="☺"
            title="Staff & pay"
            sub={staffDue ? inr(staffDue) + ' to pay' : employees.length + ' staff · all settled'}
            onPress={() => navigation.navigate('Staff')}
          />
          <ActionTile
            color={c.tiles.orange}
            icon="▤"
            title="Stock"
            sub={items.length ? `${items.length} items${low.length ? ` · ${low.length} low` : ''}` : 'Bass, line array, cords…'}
            badge={low.length ? 'LOW' : ''}
            onPress={() => navigation.navigate('Stock')}
          />
          <ActionTile
            color={c.tiles.pink}
            icon="≣"
            title="Bills"
            sub={toBill.length ? `${toBill.length} ready to bill` : `${billed} billed`}
            badge={toBill.length ? 'DUE' : ''}
            onPress={() => navigation.navigate('Bills')}
          />
          <ActionTile
            color={c.tiles.violet}
            icon="↗"
            title="Profit & loss"
            sub={MON[mm - 1] + ': ' + (monthPL.profit < 0 ? 'loss ' : 'profit ') + signed(monthPL.profit).replace(/^[+−]/, '')}
            onPress={() => navigation.navigate('Reports')}
          />
        </View>
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
