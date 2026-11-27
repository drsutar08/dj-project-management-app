import React, { useLayoutEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Screen, T, H2, List, Empty, Row, Tile, Icon, WhatsAppBtn } from '../components/ui';
import { dueList } from '../reminders';
import { openWhatsApp, reminderText } from '../share';
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
        <Icon name={icon} size={34} color={c.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T size={16} weight="800" numberOfLines={1}>{title}</T>
        {sub ? <T size={13} muted style={{ marginTop: 2 }} numberOfLines={2}>{sub}</T> : null}
        {children}
        {note ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Icon name="flash" size={13} color={c.warn} />
            <T size={12} weight="700" color={c.plum}>{note}</T>
          </View>
        ) : null}
      </View>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevron-forward" size={20} color={c.accentInk} />
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
      <Icon name={icon} size={92} color="#ffffff" style={{ position: 'absolute', right: -12, bottom: -14, opacity: 0.16 }} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={21} color="#ffffff" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {badge ? (
            <View style={{ backgroundColor: '#e8243f', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 }}>
              <T size={10} weight="800" color="#ffffff" style={{ letterSpacing: 0.4 }}>{badge}</T>
            </View>
          ) : null}
          <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="mci:arrow-top-right" size={17} color="#ffffff" />
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
          <Icon name="menu" size={26} />
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
  const due = dueList(projects, ledger, td);
  const billed = projects.filter((p) => p.status === 'final').length;
  const [yy, mm] = td.split('-').map(Number);
  const monthPL = periodPL({ projects, ledger, expenses, moves, items }, ym + '-01', ym + '-' + daysInMonth(yy, mm));

  return (
    <Screen>
      {!settings.name ? (
        <HeroCard
          icon="musical-notes"
          title="Set up your business"
          sub="Add your name, phone numbers, address and bill rules"
          note="Takes about 2 minutes"
          onPress={() => navigation.navigate('Settings')}
        />
      ) : null}

      <HeroCard icon="wallet" title="Customers owe you" onPress={() => navigation.navigate('Payments')}>
        <T size={28} weight="800" style={{ letterSpacing: -0.8, marginTop: 2 }}>{inr(custDue)}</T>
        <T size={12.5} muted numberOfLines={1}>
          Staff to pay {inr(staffDue)} · {MON[new Date().getMonth()]} {inr(monthRev)}
        </T>
      </HeroCard>

      <View style={{ gap: 12 }}>
        <T size={17} weight="800" style={{ letterSpacing: -0.3 }}>What do you want to do?</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <ActionTile color={c.tiles.purple} icon="add" title="New booking" sub="Customer, date & advance" onPress={() => navigation.navigate('BookingForm')} />
          <ActionTile
            color={c.tiles.green}
            icon="calendar"
            title="Bookings"
            sub={up.length ? `${up.length} upcoming · next ${dmy(up[0].bookingDate)}` : 'No upcoming programmes'}
            onPress={() => navigation.navigate('Bookings')}
          />
          <ActionTile
            color={c.tiles.blue}
            icon="people"
            title="Staff & pay"
            sub={staffDue ? inr(staffDue) + ' to pay' : employees.length + ' staff · all settled'}
            onPress={() => navigation.navigate('Staff')}
          />
          <ActionTile
            color={c.tiles.orange}
            icon="cube"
            title="Stock"
            sub={items.length ? `${items.length} item${items.length === 1 ? '' : 's'}${low.length ? ` · ${low.length} low` : ''}` : 'Bass, line array, cords…'}
            badge={low.length ? 'LOW' : ''}
            onPress={() => navigation.navigate('Stock')}
          />
          <ActionTile
            color={c.tiles.pink}
            icon="receipt"
            title="Bills"
            sub={toBill.length ? `${toBill.length} ready to bill` : `${billed} billed`}
            badge={toBill.length ? 'DUE' : ''}
            onPress={() => navigation.navigate('Bills')}
          />
          <ActionTile
            color={c.tiles.violet}
            icon="trending-up"
            title="Profit & loss"
            sub={MON[mm - 1] + ': ' + (monthPL.profit < 0 ? 'loss ' : 'profit ') + signed(monthPL.profit).replace(/^[+−]/, '')}
            onPress={() => navigation.navigate('Reports')}
          />
        </View>
      </View>

      {due.soon.length ? (
        <View style={{ gap: 12 }}>
          <H2>Today & tomorrow</H2>
          <List>
            {due.soon.map((p) => (
              <Row
                key={p.id}
                onPress={() => open(p)}
                left={<Tile icon={p.shift === 'Day' ? 'sunny' : 'moon'} t={p.bookingDate === td ? 'warn' : 'plum'} />}
                title={p.customerName || 'Programme'}
                sub={[p.bookingDate === td ? 'Today' : 'Tomorrow', [p.startTime, p.endTime].filter(Boolean).join(' – '), p.from].filter(Boolean).join(' · ')}
                right={p.shift || ''}
                rightSub={p.segment || ''}
              />
            ))}
          </List>
        </View>
      ) : null}

      {due.collect.length ? (
        <View style={{ gap: 12 }}>
          <H2>Collect balance</H2>
          <List>
            {due.collect.slice(0, 5).map((p) => (
              <Row
                key={p.id}
                onPress={() => open(p)}
                left={<Tile icon="cash-outline" t="bad" />}
                title={p.customerName || 'Customer'}
                sub={'Programme ' + dmy(p.bookingDate)}
                right={inr(projMoney(p, ledger).balance)}
                rightColor={c.bad}
                rightSub="due"
                extra={p.mobile ? <View style={{ marginLeft: 6 }}><WhatsAppBtn compact title={'Send reminder to ' + (p.customerName || 'customer')} onPress={() => openWhatsApp(p.mobile, reminderText(p, settings, ledger))} /></View> : null}
              />
            ))}
          </List>
        </View>
      ) : null}

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
