import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { Screen, List, Row, Tile, Empty, Card, MoneyRow } from '../components/ui';
import { useStore, useSorted } from '../store';
import { useTheme, shadow } from '../theme';
import { customersOf, dmy, initials, inr } from '../utils';

// Everyone who has booked, worked out from the bookings (matched by mobile number).
export default function CustomersScreen({ navigation }) {
  const c = useTheme();
  const { ledger } = useStore();
  const { projects } = useSorted();
  const [q, setQ] = useState('');
  const all = customersOf(projects, ledger);
  const qq = q.trim().toLowerCase();
  const list = qq ? all.filter((x) => [x.customerName, x.mobile, x.fatherName, x.address].join(' ').toLowerCase().includes(qq)) : all;
  const due = all.reduce((a, x) => a + x.due, 0);
  const repeat = all.filter((x) => x.bookings.length > 1).length;

  if (!all.length)
    return (
      <Screen>
        <Empty title="No customers yet" text="Customers appear here from your bookings, matched by mobile number." action="+ New booking" onAction={() => navigation.navigate('BookingForm')} />
      </Screen>
    );

  return (
    <Screen>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search name, mobile, village"
        placeholderTextColor={c.muted}
        style={[{ backgroundColor: c.surface2, color: c.fg, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 }, shadow]}
      />
      <Card style={{ gap: 8 }}>
        <MoneyRow label="Customers" value={String(all.length)} />
        <MoneyRow label="Booked more than once" value={String(repeat)} />
        <MoneyRow label="Balance due from customers" value={inr(due)} color={due > 0 ? c.bad : undefined} />
      </Card>
      {list.length ? (
        <List>
          {list.map((x) => (
            <Row
              key={x.key}
              onPress={() => navigation.navigate('Customer', { key: x.key })}
              left={<Tile top={initials(x.customerName)} t={x.due > 0 ? 'warn' : 'plum'} />}
              title={x.customerName || x.mobile}
              sub={[x.mobile, `${x.bookings.length} booking${x.bookings.length === 1 ? '' : 's'}`, 'last ' + dmy(x.last)].filter(Boolean).join(' · ')}
              right={inr(x.spent)}
              rightColor={x.due > 0 ? c.bad : undefined}
              rightSub={x.due > 0 ? inr(x.due) + ' due' : 'total'}
            />
          ))}
        </List>
      ) : (
        <Empty title="No match" text="Try another name or number." />
      )}
    </Screen>
  );
}
