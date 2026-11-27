import React from 'react';
import { View } from 'react-native';
import { Screen, H2, List, Empty } from '../components/ui';
import { BillRow, ProjRow } from '../components/rows';
import { useSorted } from '../store';
import { isReadyToBill } from '../utils';

export default function BillsScreen({ navigation }) {
  const { projects } = useSorted();
  const bills = projects.filter((p) => p.status === 'final').sort((a, b) => String(b.billDate).localeCompare(String(a.billDate)));
  const pending = projects.filter(isReadyToBill);
  return (
    <Screen>
      {pending.length ? (
        <View style={{ gap: 12 }}>
          <H2>Waiting for final bill</H2>
          <List>{pending.map((p) => <ProjRow key={p.id} p={p} onPress={() => navigation.navigate('Booking', { id: p.id })} />)}</List>
        </View>
      ) : null}
      <View style={{ gap: 12 }}>
        <H2>Final bills</H2>
        {bills.length ? (
          <List>{bills.map((p) => <BillRow key={p.id} p={p} onPress={() => navigation.navigate('Bill', { id: p.id })} />)}</List>
        ) : (
          <Empty title="No final bills yet" text="When a programme is over, open the booking and tap “Finalise & create bill”." />
        )}
      </View>
    </Screen>
  );
}
