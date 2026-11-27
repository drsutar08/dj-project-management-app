import React from 'react';
import { View } from 'react-native';
import { Row, Tile, Pill, RemoveBtn } from './ui';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { MOVE_TYPES, STATUSES } from '../defaults';
import { dmy, dparts, empMoney, initials, inr, isLow, n, projMoney, qtyTxt } from '../utils';

export function ProjRow({ p, onPress }) {
  const { ledger } = useStore();
  const dp = dparts(p.bookingDate);
  const st = STATUSES[p.status || 'booked'] || STATUSES.booked;
  return (
    <Row
      onPress={onPress}
      left={<Tile top={dp.d} bottom={dp.m} />}
      title={p.customerName || 'Unnamed'}
      sub={[p.segment, p.eventType, p.from].filter(Boolean).join(' · ')}
      right={inr(projMoney(p, ledger).net)}
      rightSub={<View style={{ marginTop: 3 }}><Pill label={st.label} t={st.tone} /></View>}
    />
  );
}

export function BillRow({ p, onPress }) {
  const c = useTheme();
  const { ledger } = useStore();
  const m = projMoney(p, ledger);
  return (
    <Row
      onPress={onPress}
      left={<Tile top={String(p.billNo || p.serial || '–')} bottom="No." t="good" />}
      title={p.customerName}
      sub={`Billed ${dmy(p.billDate)} · Programme ${dmy(p.bookingDate)}`}
      right={inr(m.net)}
      rightColor={m.balance > 0 ? c.bad : c.good}
      rightSub={m.balance > 0 ? inr(m.balance) + ' due' : 'Paid in full'}
    />
  );
}

export function EmpRow({ e, onPress }) {
  const c = useTheme();
  const { ledger } = useStore();
  const m = empMoney(e.id, ledger);
  return (
    <Row
      onPress={onPress}
      left={<Tile top={initials(e.name)} t={e.active === false ? 'bad' : 'plum'} />}
      title={e.name + (e.active === false ? ' (inactive)' : '')}
      sub={[e.role, e.rate ? inr(e.rate) + ' ' + String(e.payType || '').toLowerCase() : ''].filter(Boolean).join(' · ')}
      right={inr(m.due)}
      rightColor={m.due > 0 ? c.bad : undefined}
      rightSub={m.due > 0 ? 'to pay' : m.due < 0 ? 'advance given' : 'settled'}
    />
  );
}

export function LedRow({ l }) {
  const c = useTheme();
  const { employees, projects, deleteEntry } = useStore();
  const e = employees.find((x) => x.id === l.empId);
  const p = l.projectId ? projects.find((x) => x.id === l.projectId) : null;
  const earn = l.kind === 'earn';
  return (
    <Row
      left={<Tile top={earn ? 'W' : '₹'} t={earn ? 'warn' : 'good'} />}
      title={e ? e.name : 'Removed staff'}
      sub={[dmy(l.date), earn ? 'Work' + (l.qty ? ' ×' + l.qty : '') : 'Paid · ' + (l.mode || 'Cash'), p && p.customerName, l.note].filter(Boolean).join(' · ')}
      right={(earn ? '+' : '−') + inr(l.amount)}
      rightColor={earn ? undefined : c.good}
      rightSub={earn ? 'earned' : 'paid'}
      extra={<RemoveBtn onPress={() => deleteEntry(l.id)} />}
    />
  );
}

export function ItemRow({ it, onPress }) {
  const c = useTheme();
  const usable = n(it.qty) - n(it.repair);
  const low = isLow(it);
  const consumable = it.kind === 'consumable';
  return (
    <Row
      onPress={onPress}
      left={<Tile top={initials(it.name)} t={low ? 'bad' : consumable ? 'warn' : 'plum'} />}
      title={it.name}
      sub={[it.category, consumable ? 'Consumable' : '', n(it.repair) ? n(it.repair) + ' in repair' : ''].filter(Boolean).join(' · ')}
      right={qtyTxt(usable, it.unit)}
      rightColor={low ? c.bad : undefined}
      rightSub={low ? <View style={{ marginTop: 3 }}><Pill label="Low stock" t="bad" /></View> : consumable ? 'in stock' : 'usable'}
    />
  );
}

export function MoveRow({ m, showItem }) {
  const c = useTheme();
  const { items, projects, deleteMove } = useStore();
  const it = items.find((x) => x.id === m.itemId) || {};
  const p = m.projectId ? projects.find((x) => x.id === m.projectId) : null;
  const t = MOVE_TYPES[m.type] || MOVE_TYPES.adjust;
  const sign = m.type === 'in' ? '+' : m.type === 'out' ? '−' : m.type === 'adjust' && n(m.qty) > 0 ? '+' : '';
  return (
    <Row
      left={<Tile top={{ in: '+', out: '−', repair: '⚒', fixed: '✓', adjust: '±' }[m.type] || '±'} t={t.tone} />}
      title={showItem ? it.name || 'Removed item' : t.label}
      sub={[dmy(m.date), showItem ? t.label : '', p && p.customerName, m.cost ? inr(m.cost) : '', m.note].filter(Boolean).join(' · ')}
      right={sign + qtyTxt(m.type === 'adjust' ? Math.abs(n(m.qty)) : m.qty, it.unit)}
      rightColor={m.type === 'in' ? c.good : undefined}
      extra={<RemoveBtn onPress={() => deleteMove(m.id)} />}
    />
  );
}
