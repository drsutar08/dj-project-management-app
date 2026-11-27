import React, { useLayoutEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Screen, List, Empty, Card, MoneyRow, LinkBtn, HeaderBtn } from '../components/ui';
import { EmpRow } from '../components/rows';
import { useStore, useSorted } from '../store';
import { useTheme, shadow } from '../theme';
import { empMoney, inr } from '../utils';

export default function StaffScreen({ navigation }) {
  const c = useTheme();
  const { ledger } = useStore();
  const { employees } = useSorted();
  const [q, setQ] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HeaderBtn title="+ Add" onPress={() => navigation.navigate('StaffForm')} /> });
  }, [navigation]);

  const qq = q.trim().toLowerCase();
  const list = qq ? employees.filter((e) => [e.name, e.phone, e.role].join(' ').toLowerCase().includes(qq)) : employees;
  const due = employees.reduce((a, e) => a + Math.max(0, empMoney(e.id, ledger).due), 0);

  if (!employees.length)
    return (
      <Screen>
        <Empty title="No staff yet" text="Add your DJ operators, light boys, helpers and drivers with their pay rate." action="+ Add staff" onAction={() => navigation.navigate('StaffForm')} />
      </Screen>
    );

  return (
    <Screen>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search staff"
        placeholderTextColor={c.muted}
        style={[{ backgroundColor: c.surface2, color: c.fg, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 }, shadow]}
      />
      <Card><MoneyRow label="Total wages to pay" value={inr(due)} color={due > 0 ? c.bad : undefined} /></Card>
      {list.length ? (
        <List>{list.map((e) => <EmpRow key={e.id} e={e} onPress={() => navigation.navigate('StaffMember', { id: e.id })} />)}</List>
      ) : (
        <Empty title="No match" text="Try another name." />
      )}
    </Screen>
  );
}
