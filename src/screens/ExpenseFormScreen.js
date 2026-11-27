import React, { useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen, Field, DateField, Chips, opts, Btn, ConfirmBtn, T, toast } from '../components/ui';
import { useStore, useSorted } from '../store';
import { MODES } from '../defaults';
import { useTheme } from '../theme';
import { dmy, n, today } from '../utils';

export default function ExpenseFormScreen({ navigation, route }) {
  const c = useTheme();
  const { expenses, settings, saveExpense, deleteExpense } = useStore();
  const { projects } = useSorted();
  const existing = route.params?.id ? expenses.find((x) => x.id === route.params.id) : null;
  const cats = settings.expenseCategories || [];
  const pre = route.params?.projectId ? projects.find((p) => p.id === route.params.projectId) : null;
  const [f, setF] = useState(
    existing
      ? { ...existing, amount: String(existing.amount || '') }
      : { amount: '', category: route.params?.category || cats[0] || 'Other', date: pre?.bookingDate || route.params?.date || today(), projectId: pre?.id || '', mode: 'Cash', note: '' }
  );
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const catOpts = f.category && !cats.includes(f.category) ? [...cats, f.category] : cats;

  useLayoutEffect(() => navigation.setOptions({ title: existing ? 'Edit expense' : 'Add expense' }), [navigation, existing]);

  // Recent bookings to pick from; the chosen one always stays in the list.
  const recent = projects.filter((p) => p.status !== 'cancel').slice().reverse().slice(0, 30);
  const chosen = f.projectId ? projects.find((p) => p.id === f.projectId) : null;
  if (chosen && !recent.includes(chosen)) recent.unshift(chosen);
  const projOpts = [['', 'Not for a booking'], ...recent.map((p) => [p.id, dmy(p.bookingDate) + ' · ' + p.customerName])];

  const onSave = () => {
    if (!(n(f.amount) > 0)) return toast('Enter an amount above zero.');
    saveExpense({
      ...(existing || {}),
      amount: n(f.amount), category: f.category || 'Other', date: f.date || today(),
      projectId: f.projectId || '', mode: f.mode || 'Cash', note: String(f.note || '').trim(),
    });
    toast(existing ? 'Expense updated' : 'Expense added');
    navigation.goBack();
  };

  return (
    <Screen>
      {chosen ? (
        <View style={{ backgroundColor: c.heroBg, borderWidth: 1, borderColor: c.heroLine, borderRadius: 18, padding: 14, gap: 2 }}>
          <T muted size={12} weight="700">Expense for booking</T>
          <T size={16} weight="800" numberOfLines={1}>{chosen.customerName || 'Unnamed'}</T>
          <T muted size={12.5}>{[dmy(chosen.bookingDate), chosen.segment, chosen.eventType, 'Sl. No. ' + chosen.serial].filter(Boolean).join(' · ')}</T>
        </View>
      ) : null}
      <Field label="Amount (₹)" required value={f.amount} onChangeText={set('amount')} keyboardType="decimal-pad" />
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Expense type</T>
        <Chips options={opts(catOpts)} value={f.category} onChange={set('category')} />
      </View>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">{chosen ? 'Change booking' : 'For booking'}</T>
        <Chips scroll options={opts(projOpts)} value={f.projectId} onChange={set('projectId')} />
        <T muted size={12.5}>
          {f.projectId
            ? 'Counted in this booking’s profit, on its programme date.'
            : 'A general business cost, counted on the date below.'}
        </T>
      </View>
      <DateField label="Date" value={f.date} onChange={set('date')} />
      <Chips options={opts(MODES)} value={f.mode} onChange={set('mode')} />
      <Field label="Note" value={f.note} onChangeText={set('note')} placeholder="Diesel for generator, pickup rent, lunch for team…" />

      <Btn title={existing ? 'Save changes' : 'Add expense'} onPress={onSave} />
      {existing ? (
        <ConfirmBtn
          title="Delete expense"
          confirmTitle="Tap again to delete"
          onConfirm={() => {
            deleteExpense(existing.id);
            toast('Expense deleted');
            navigation.goBack();
          }}
        />
      ) : null}
    </Screen>
  );
}
