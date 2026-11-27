import React, { useLayoutEffect } from 'react';
import { View } from 'react-native';
import { Screen, Card, KV, H2, List, Empty, Btn, BtnRow, T } from '../components/ui';
import { ProjRow } from '../components/rows';
import { useStore, useSorted } from '../store';
import { useTheme, shadow } from '../theme';
import { customersOf, inr, maskId } from '../utils';
import { openWhatsApp } from '../share';

export default function CustomerScreen({ navigation, route }) {
  const c = useTheme();
  const { ledger, settings } = useStore();
  const { projects } = useSorted();
  const x = customersOf(projects, ledger).find((k) => k.key === route.params.key);

  useLayoutEffect(() => {
    if (x) navigation.setOptions({ title: x.customerName || 'Customer' });
  }, [navigation, x && x.customerName]);

  if (!x) return <Screen><Empty title="Customer not found" /></Screen>;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[{ flex: 1, backgroundColor: c.ink2, borderRadius: 20, padding: 16 }, shadow]}>
          <T color={c.inkMuted} size={12} weight="600">Total business</T>
          <T color={c.inkFg} size={22} weight="800">{inr(x.spent)}</T>
          <T color={c.inkMuted} size={12}>{x.bookings.length} booking{x.bookings.length === 1 ? '' : 's'}</T>
        </View>
        <View style={[{ flex: 1, backgroundColor: c.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: c.line }, shadow]}>
          <T muted size={12} weight="600">Balance due</T>
          <T size={20} weight="800" color={x.due > 0 ? c.bad : c.good}>{inr(x.due)}</T>
          <T muted size={12}>Paid {inr(x.paid)}</T>
        </View>
      </View>
      <BtnRow>
        <Btn title="+ New booking" onPress={() => navigation.navigate('BookingForm', { customer: x.key })} />
        {x.mobile ? <Btn variant="secondary" title="WhatsApp" onPress={() => openWhatsApp(x.mobile, `Namaskar ${x.customerName || ''},\n`)} /> : null}
      </BtnRow>
      <Card>
        <KV
          rows={[
            ['Mobile', x.mobile],
            ['Age', x.age ? String(x.age) : ''],
            ['Father’s name', x.fatherName],
            ['Address', x.address],
            ['Aadhaar', maskId(x.aadhaar)],
            ['PAN', x.pan],
          ]}
        />
      </Card>
      <View style={{ gap: 12 }}>
        <H2>Bookings</H2>
        <List>{[...x.bookings].reverse().map((p) => <ProjRow key={p.id} p={p} onPress={() => navigation.navigate('Booking', { id: p.id })} />)}</List>
      </View>
    </Screen>
  );
}
