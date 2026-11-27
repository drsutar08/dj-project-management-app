import React, { useLayoutEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Screen, List, Empty, Chips, LinkBtn, HeaderBtn } from '../components/ui';
import { ProjRow } from '../components/rows';
import { useStore, useSorted } from '../store';
import { useTheme, shadow } from '../theme';
import { projMoney, today } from '../utils';

const FILTERS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'due', label: 'Balance due' },
  { value: 'done', label: 'Done' },
  { value: 'final', label: 'Billed' },
  { value: 'cancel', label: 'Cancelled' },
  { value: 'all', label: 'All' },
];

export default function BookingsScreen({ navigation }) {
  const c = useTheme();
  const { ledger } = useStore();
  const { projects } = useSorted();
  const [f, setF] = useState('upcoming');
  const [q, setQ] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HeaderBtn title="+ New" onPress={() => navigation.navigate('BookingForm')} /> });
  }, [navigation]);

  const td = today();
  let list = projects.filter((p) =>
    f === 'all' ? true
      : f === 'upcoming' ? p.status === 'booked' && String(p.bookingDate) >= td
      : f === 'due' ? p.status !== 'cancel' && projMoney(p, ledger).balance > 0
      : p.status === f
  );
  if (f === 'all' || f === 'final') list = [...list].reverse();
  const qq = q.trim().toLowerCase();
  if (qq) list = list.filter((p) => [p.customerName, p.mobile, p.from, p.to, p.serial, p.fatherName].join(' ').toLowerCase().includes(qq));

  return (
    <Screen>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search name, mobile, village, Sl. No."
        placeholderTextColor={c.muted}
        style={[{ backgroundColor: c.surface2, color: c.fg, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 }, shadow]}
      />
      <Chips scroll options={FILTERS} value={f} onChange={setF} />
      {list.length ? (
        <List>{list.map((p) => <ProjRow key={p.id} p={p} onPress={() => navigation.navigate('Booking', { id: p.id })} />)}</List>
      ) : (
        <Empty
          title="No bookings here"
          text={projects.length ? 'Try another filter.' : 'Add your first programme.'}
          action={projects.length ? null : '+ New booking'}
          onAction={() => navigation.navigate('BookingForm')}
        />
      )}
    </Screen>
  );
}
