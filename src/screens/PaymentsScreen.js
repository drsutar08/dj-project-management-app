import React, { useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen, Card, MoneyRow, List, Empty, Chips, opts, Btn, BtnRow } from '../components/ui';
import { LedRow } from '../components/rows';
import { useSorted } from '../store';
import { useTheme } from '../theme';
import { inr, n } from '../utils';

export default function PaymentsScreen({ navigation }) {
  const c = useTheme();
  const { ledger, employees } = useSorted();
  const [f, setF] = useState('');
  const list = f ? ledger.filter((l) => l.empId === f) : ledger;
  const earned = list.filter((l) => l.kind === 'earn').reduce((a, l) => a + n(l.amount), 0);
  const paid = list.filter((l) => l.kind !== 'earn').reduce((a, l) => a + n(l.amount), 0);

  useLayoutEffect(() => navigation.setOptions({ title: 'Payments' }), [navigation]);

  return (
    <Screen>
      {employees.length ? <Chips scroll options={opts([['', 'All staff'], ...employees.map((e) => [e.id, e.name])])} value={f} onChange={setF} /> : null}
      <Card style={{ gap: 8 }}>
        <MoneyRow label="Wages earned" value={inr(earned)} />
        <MoneyRow label="Paid out" value={inr(paid)} color={c.good} />
        <MoneyRow total label="Still to pay" value={inr(earned - paid)} color={earned - paid > 0 ? c.bad : undefined} />
      </Card>
      <BtnRow>
        <Btn title="Record payment" onPress={() => navigation.navigate('LedgerForm', { kind: 'pay', empId: f || undefined })} />
        <Btn variant="secondary" title="+ Add work" onPress={() => navigation.navigate('LedgerForm', { kind: 'earn', empId: f || undefined })} />
      </BtnRow>
      {list.length ? <List>{list.map((l) => <LedRow key={l.id} l={l} />)}</List> : (
        <Empty title="No payments yet" text={employees.length ? 'Record wages earned and money paid to each staff member.' : 'Add staff first, then record their work and payments.'} />
      )}
    </Screen>
  );
}
