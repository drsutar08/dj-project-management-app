import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Screen, Card, T, H2, List, Row, Tile, Empty, MoneyRow, Chips, opts, LinkBtn, Icon, HeaderBtn } from '../components/ui';
import { useStore, useSorted } from '../store';
import { useTheme, shadow } from '../theme';
import { MON, addDays, daysInMonth, dmy, dparts, inr, periodPL, signed, today } from '../utils';
import { exportPeriod } from '../exportXlsx';
import { Btn } from '../components/ui';

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function rangeOf(mode, anchor) {
  const [y, m] = anchor.split('-').map(Number);
  if (mode === 'day') return { from: anchor, to: anchor, label: dmy(anchor) };
  if (mode === 'month') return { from: `${y}-${String(m).padStart(2, '0')}-01`, to: `${y}-${String(m).padStart(2, '0')}-${daysInMonth(y, m)}`, label: `${MONTHS_FULL[m - 1]} ${y}` };
  return { from: `${y}-01-01`, to: `${y}-12-31`, label: String(y) };
}

function shift(mode, anchor, k) {
  const [y, m] = anchor.split('-').map(Number);
  if (mode === 'day') return addDays(anchor, k);
  if (mode === 'month') {
    const t = y * 12 + (m - 1) + k;
    return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}-01`;
  }
  return `${y + k}-01-01`;
}

// Profit per bar, drawn from a zero line: profit rises above it, loss hangs below.
// Tap a bar to open that month (year view) or day (month view).
function ProfitBars({ data, onPick, axisEvery }) {
  const c = useTheme();
  const H = 132;
  const maxPos = Math.max(0, ...data.map((x) => x.value));
  const maxNeg = Math.max(0, ...data.map((x) => -x.value));
  const span = maxPos + maxNeg || 1;
  const up = (maxPos / span) * H;
  const best = data.reduce((b, x) => (x.value > (b ? b.value : 0) ? x : b), null);
  return (
    <View accessibilityRole="image" accessibilityLabel={'Profit chart. ' + data.filter((x) => x.value).map((x) => `${x.label} ${signed(x.value)}`).join(', ')}>
      <View style={{ height: H, flexDirection: 'row' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: up, height: 1, backgroundColor: c.line }} />
        {data.map((x) => {
          const h = (Math.abs(x.value) / span) * H;
          const pos = x.value >= 0;
          return (
            <Pressable key={x.key} onPress={() => onPick(x)} style={{ flex: 1, height: H, paddingHorizontal: 1 }} hitSlop={{ top: 8, bottom: 8 }}>
              {x.value ? (
                <View
                  style={{
                    position: 'absolute', left: 1, right: 1,
                    top: pos ? up - h : up + 1, height: Math.max(2, h),
                    backgroundColor: pos ? c.good : c.bad,
                    borderTopLeftRadius: pos ? 4 : 0, borderTopRightRadius: pos ? 4 : 0,
                    borderBottomLeftRadius: pos ? 0 : 4, borderBottomRightRadius: pos ? 0 : 4,
                  }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {data.map((x, i) => (
          <View key={x.key} style={{ flex: 1, alignItems: 'center' }}>
            {i % axisEvery === 0 ? <T muted size={10} weight="600">{x.short}</T> : null}
          </View>
        ))}
      </View>
      {best ? <T muted size={12} style={{ marginTop: 8 }}>Best: {best.label}, {signed(best.value)}. Tap a bar to open it.</T> : null}
    </View>
  );
}

export default function ReportsScreen({ navigation }) {
  const c = useTheme();
  const store = useStore();
  const { expenses } = useSorted();
  const [mode, setMode] = useState('month');
  const [anchor, setAnchor] = useState(today());

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HeaderBtn title="+ Expense" onPress={() => navigation.navigate('ExpenseForm')} /> });
  }, [navigation]);

  const d = { projects: store.projects, ledger: store.ledger, expenses: store.expenses, moves: store.moves, items: store.items };
  const r = rangeOf(mode, anchor);
  const pl = useMemo(() => periodPL(d, r.from, r.to), [store.projects, store.ledger, store.expenses, store.moves, store.items, r.from, r.to]);

  // Chart data: months of the year, or days of the month.
  const bars = useMemo(() => {
    const [y, m] = anchor.split('-').map(Number);
    if (mode === 'year')
      return MON.map((mm, i) => {
        const a = `${y}-${String(i + 1).padStart(2, '0')}-01`;
        const rr = rangeOf('month', a);
        return { key: a, short: mm[0], label: `${mm} ${y}`, value: periodPL(d, rr.from, rr.to).profit };
      });
    if (mode === 'month')
      return Array.from({ length: daysInMonth(y, m) }, (_, i) => {
        const a = `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
        return { key: a, short: String(i + 1), label: dmy(a), value: periodPL(d, a, a).profit };
      });
    return [];
  }, [mode, anchor, store.projects, store.ledger, store.expenses, store.moves, store.items]);

  const periodExp = expenses.filter((e) => {
    const p = e.projectId ? store.projects.find((x) => x.id === e.projectId) : null;
    const when = p ? p.bookingDate : e.date;
    return when >= r.from && when <= r.to;
  });
  const isLoss = pl.profit < 0;
  const word = mode === 'day' ? 'this day' : mode === 'month' ? 'this month' : 'this year';

  return (
    <Screen>
      <Chips options={opts([['day', 'Day'], ['month', 'Month'], ['year', 'Year']])} value={mode} onChange={setMode} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={() => setAnchor(shift(mode, anchor, -1))} hitSlop={8} accessibilityLabel="Previous" style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-back" size={22} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T size={17} weight="800">{r.label}</T>
          {anchor.slice(0, mode === 'day' ? 10 : mode === 'month' ? 7 : 4) !== today().slice(0, mode === 'day' ? 10 : mode === 'month' ? 7 : 4) ? (
            <LinkBtn onPress={() => setAnchor(today())}>Back to today</LinkBtn>
          ) : null}
        </View>
        <Pressable onPress={() => setAnchor(shift(mode, anchor, 1))} hitSlop={8} accessibilityLabel="Next" style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-forward" size={22} />
        </Pressable>
      </View>

      <View style={[{ backgroundColor: c.heroBg, borderWidth: 1, borderColor: c.heroLine, borderRadius: 24, padding: 18, gap: 12 }, shadow]}>
        <View>
          <T muted size={13} weight="700">{isLoss ? 'Loss ' + word : 'Profit ' + word}</T>
          <T size={34} weight="800" color={isLoss ? c.bad : pl.profit > 0 ? c.good : c.fg} style={{ letterSpacing: -1 }}>{signed(pl.profit)}</T>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[['Income', pl.income, c.fg], ['Expenses', pl.cost, c.fg]].map(([l, v, col]) => (
            <View key={l} style={{ flex: 1, backgroundColor: c.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: c.line }}>
              <T muted size={12} weight="600">{l}</T>
              <T size={17} weight="800" color={col}>{inr(v)}</T>
            </View>
          ))}
        </View>
      </View>

      {bars.length ? (
        <Card style={{ gap: 10 }}>
          <T weight="800">{mode === 'year' ? 'Profit by month' : 'Profit by day'}</T>
          <ProfitBars
            data={bars}
            axisEvery={mode === 'year' ? 1 : 5}
            onPick={(x) => {
              setAnchor(x.key);
              setMode(mode === 'year' ? 'month' : 'day');
            }}
          />
        </Card>
      ) : null}

      <Btn variant="secondary" title={'Export ' + r.label + ' to Excel'} onPress={() => exportPeriod({ ...d, employees: store.employees }, store.settings, r.from, r.to, r.label)} />

      <View style={{ gap: 12 }}>
        <H2>Where the money went</H2>
        <Card style={{ gap: 8 }}>
          {pl.lines.length ? pl.lines.map(([k, v]) => <MoneyRow key={k} label={k} value={inr(v)} />) : <T muted>No expenses {word}.</T>}
          <MoneyRow total label="Total expenses" value={inr(pl.cost)} />
          {pl.stockBought ? (
            <T muted size={12.5}>Stock bought {word}: {inr(pl.stockBought)}. Not counted as an expense, because it is equipment you keep.</T>
          ) : null}
        </Card>
      </View>

      <View style={{ gap: 12 }}>
        <H2>Bookings</H2>
        {pl.bookings.length ? (
          <List>
            {pl.bookings.map(({ p, pl: b }) => {
              const dp = dparts(p.bookingDate);
              return (
                <Row
                  key={p.id}
                  onPress={() => navigation.navigate('Booking', { id: p.id })}
                  left={<Tile top={dp.d} bottom={dp.m} t={b.profit < 0 ? 'bad' : 'good'} />}
                  title={p.customerName || 'Unnamed'}
                  sub={`Income ${inr(b.income)} · Cost ${inr(b.cost)}${b.cancelled ? ' · Cancelled' : ''}`}
                  right={signed(b.profit)}
                  rightColor={b.profit < 0 ? c.bad : c.good}
                  rightSub={b.profit < 0 ? 'loss' : 'profit'}
                />
              );
            })}
          </List>
        ) : (
          <Empty title="No bookings" text={`No programmes ${word}.`} />
        )}
      </View>

      <View style={{ gap: 12 }}>
        <H2 right="+ Add expense" onRight={() => navigation.navigate('ExpenseForm', mode === 'day' ? { date: anchor } : undefined)}>Expenses entered</H2>
        {periodExp.length ? (
          <List>
            {periodExp.map((e) => {
              const p = e.projectId ? store.projects.find((x) => x.id === e.projectId) : null;
              return (
                <Row
                  key={e.id}
                  onPress={() => navigation.navigate('ExpenseForm', { id: e.id })}
                  left={<Tile icon="receipt-outline" t="warn" />}
                  title={e.category || 'Expense'}
                  sub={[dmy(e.date), p ? p.customerName : 'General', e.note].filter(Boolean).join(' · ')}
                  right={inr(e.amount)}
                />
              );
            })}
          </List>
        ) : (
          <Empty title="No expenses entered" text="Add diesel, transport, food, gear rent and other costs, for a booking or for the business." />
        )}
      </View>
    </Screen>
  );
}
