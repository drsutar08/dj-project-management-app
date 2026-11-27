import React, { useLayoutEffect } from 'react';
import { View } from 'react-native';
import { Screen, Card, T, H2, KV, Btn, BtnRow, List, Empty, LinkBtn } from '../components/ui';
import { LedRow } from '../components/rows';
import { useStore, useSorted } from '../store';
import { useTheme, shadow } from '../theme';
import { dmy, empMoney, inr, maskId } from '../utils';

export default function StaffDetailScreen({ navigation, route }) {
  const c = useTheme();
  const { employees } = useStore();
  const { ledger } = useSorted();
  const e = employees.find((x) => x.id === route.params.id);

  useLayoutEffect(() => {
    if (!e) return;
    navigation.setOptions({ title: e.name, headerRight: () => <LinkBtn onPress={() => navigation.navigate('StaffForm', { id: e.id })}>Edit</LinkBtn> });
  }, [navigation, e]);

  if (!e) return <Screen><Empty title="Staff member not found" /></Screen>;
  const m = empMoney(e.id, ledger);
  const led = ledger.filter((l) => l.empId === e.id);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[{ flex: 1, backgroundColor: c.ink2, borderRadius: 20, padding: 16 }, shadow]}>
          <T color={c.inkMuted} size={12} weight="600">{m.due >= 0 ? 'To pay' : 'Advance given'}</T>
          <T color={c.inkFg} size={24} weight="800">{inr(Math.abs(m.due))}</T>
          <T color={c.inkMuted} size={12}>Earned minus paid</T>
        </View>
        <View style={[{ flex: 1, backgroundColor: c.surface, borderRadius: 20, padding: 16 }, shadow]}>
          <T muted size={12} weight="600">Earned</T>
          <T size={20} weight="800">{inr(m.earned)}</T>
          <T muted size={12}>Paid {inr(m.paid)}</T>
        </View>
      </View>
      <BtnRow>
        <Btn title={'Pay ' + String(e.name).split(' ')[0]} onPress={() => navigation.navigate('LedgerForm', { kind: 'pay', empId: e.id })} />
        <Btn variant="secondary" title="+ Add work" onPress={() => navigation.navigate('LedgerForm', { kind: 'earn', empId: e.id })} />
      </BtnRow>
      <Card>
        <KV
          rows={[
            ['Role', e.role],
            ['Pay', e.rate ? inr(e.rate) + ' ' + String(e.payType || '').toLowerCase() : ''],
            ['Phone', e.phone],
            ['Aadhaar', maskId(e.aadhaar)],
            ['Bank / UPI', e.bank],
            ['Address', e.address],
            ['Joined', dmy(e.joined)],
            ['Notes', e.notes],
          ]}
        />
      </Card>
      <View style={{ gap: 12 }}>
        <H2>Ledger</H2>
        {led.length ? <List>{led.map((l) => <LedRow key={l.id} l={l} />)}</List> : (
          <Empty title="No entries yet" text="Add work done on a programme, then record each payment you make." />
        )}
      </View>
    </Screen>
  );
}
