import React, { useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen, Field, DateField, FRow, Chips, opts, Btn, T, Empty, toast } from '../components/ui';
import { useStore, useSorted } from '../store';
import { MODES } from '../defaults';
import { dmy, empMoney, n, today } from '../utils';

export default function LedgerFormScreen({ navigation, route }) {
  const { saveEntry, ledger } = useStore();
  const { employees, projects } = useSorted();
  const kind = route.params?.kind || 'pay';
  const earn = kind === 'earn';
  const first = route.params?.empId || (employees[0] && employees[0].id);
  const emp0 = employees.find((x) => x.id === first) || {};

  const [f, setF] = useState({
    empId: first,
    projectId: route.params?.projectId || '',
    qty: '1',
    rate: emp0.rate ? String(emp0.rate) : '',
    amount: earn ? (emp0.rate ? String(emp0.rate) : '') : String(Math.max(0, empMoney(first, ledger).due) || ''),
    mode: 'Cash',
    date: today(),
    note: '',
  });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  useLayoutEffect(() => navigation.setOptions({ title: earn ? 'Add work / wage' : 'Pay staff' }), [navigation, earn]);

  if (!employees.length)
    return (
      <Screen>
        <Empty title="Add staff first" text="Add a staff member, then record their work and payments." action="+ Add staff" onAction={() => navigation.replace('StaffForm')} />
      </Screen>
    );

  const pickEmp = (id) => {
    const e = employees.find((x) => x.id === id) || {};
    setF((s) => {
      const rate = e.rate ? String(e.rate) : '';
      return earn
        ? { ...s, empId: id, rate, amount: String(n(s.qty) * n(rate) || '') }
        : { ...s, empId: id, amount: String(Math.max(0, empMoney(id, ledger).due) || '') };
    });
  };
  const calc = (k) => (v) =>
    setF((s) => {
      const next = { ...s, [k]: v };
      next.amount = String(n(next.qty) * n(next.rate) || '');
      return next;
    });

  const projOpts = [['', 'None']].concat(
    projects.filter((p) => p.status !== 'cancel').slice().reverse().slice(0, 30).map((p) => [p.id, dmy(p.bookingDate) + ' · ' + p.customerName])
  );

  const onSave = () => {
    if (!(n(f.amount) > 0)) return toast('Enter an amount above zero.');
    const entry = { kind, empId: f.empId, projectId: f.projectId || '', amount: n(f.amount), date: f.date || today(), note: f.note.trim() };
    if (earn) { entry.qty = n(f.qty) || 1; entry.rate = n(f.rate); } else entry.mode = f.mode;
    saveEntry(entry);
    toast(earn ? 'Work added' : 'Payment recorded');
    navigation.goBack();
  };

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Staff member</T>
        <Chips options={opts(employees.map((e) => [e.id, e.name]))} value={f.empId} onChange={pickEmp} />
      </View>
      {earn ? (
        <>
          <FRow>
            <Field label="Days / events / hours" value={f.qty} onChangeText={calc('qty')} keyboardType="decimal-pad" />
            <Field label="Rate (₹)" value={f.rate} onChangeText={calc('rate')} keyboardType="decimal-pad" />
          </FRow>
          <Field label="Wage amount (₹)" required value={f.amount} onChangeText={set('amount')} keyboardType="decimal-pad" />
        </>
      ) : (
        <>
          <Field label="Amount paid (₹)" required value={f.amount} onChangeText={set('amount')} keyboardType="decimal-pad" />
          <Chips options={opts(MODES)} value={f.mode} onChange={set('mode')} />
        </>
      )}
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">{earn ? 'Programme' : 'For programme (optional)'}</T>
        <Chips options={opts(projOpts)} value={f.projectId} onChange={set('projectId')} />
      </View>
      <DateField label="Date" required value={f.date} onChange={set('date')} />
      <Field label="Note" value={f.note} onChangeText={set('note')} placeholder={earn ? 'e.g. Night shift, loading' : 'e.g. Advance, full settlement'} />
      <Btn title={earn ? 'Add work' : 'Record payment'} onPress={onSave} />
    </Screen>
  );
}
