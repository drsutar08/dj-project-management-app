import React, { useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen, Card, T, H2, KV, Btn, BtnRow, List, Empty, LinkBtn, Pill, Sheet, Field, DateField, Chips, opts, toast } from '../components/ui';
import { MoveRow, ProjRow } from '../components/rows';
import { useStore, useSorted } from '../store';
import { useTheme, shadow } from '../theme';
import { dmy, inr, isLow, n, qtyTxt, today } from '../utils';
import { SPEC_FIELDS, specKeysFor } from '../defaults';

const TITLES = {
  in: 'Stock in (bought / added)',
  out: 'Used / out of stock',
  repair: 'Send for repair',
  fixed: 'Back from repair',
  adjust: 'Correct the count',
};

export default function ItemDetailScreen({ navigation, route }) {
  const c = useTheme();
  const { items, addMove } = useStore();
  const { moves, projects } = useSorted();
  const it = items.find((x) => x.id === route.params.id);
  const [sheet, setSheet] = useState(null);
  const [f, setF] = useState({});
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  useLayoutEffect(() => {
    if (!it) return;
    navigation.setOptions({ title: it.name, headerRight: () => <LinkBtn onPress={() => navigation.navigate('ItemForm', { id: it.id })}>Edit</LinkBtn> });
  }, [navigation, it]);

  if (!it) return <Screen><Empty title="Item not found" text="It may have been deleted." /></Screen>;

  const consumable = it.kind === 'consumable';
  const qty = n(it.qty), repair = n(it.repair), usable = qty - repair;
  const hist = moves.filter((m) => m.itemId === it.id);
  const td = today();
  const upcoming = consumable ? [] : projects.filter((p) => p.status === 'booked' && String(p.bookingDate) >= td && (p.gear || []).some((g) => g.itemId === it.id));
  const recentProj = projects.filter((p) => p.status !== 'cancel').slice().reverse().slice(0, 20);

  const open = (type) => {
    setF({ type, qty: type === 'adjust' ? String(qty) : type === 'fixed' ? String(repair || '') : '', date: today(), note: '', cost: it.cost ? String(it.cost) : '', projectId: '' });
    setSheet(type);
  };
  const close = () => setSheet(null);

  const save = () => {
    const q = n(f.qty);
    if (sheet === 'adjust') {
      if (String(f.qty).trim() === '' || q < 0) return toast('Enter how many you counted.');
      const diff = q - qty;
      if (!diff) { close(); return toast('Count is already correct'); }
      addMove({ itemId: it.id, type: 'adjust', qty: diff, date: f.date || today(), note: f.note.trim() || `Counted ${q}, was ${qty}` });
      close();
      return toast('Count corrected');
    }
    if (!(q > 0)) return toast('Enter a quantity above zero.');
    if (sheet === 'out' && q > qty) return toast(`Only ${qtyTxt(qty, it.unit)} in stock.`);
    if (sheet === 'repair' && q > usable) return toast(`Only ${qtyTxt(usable, it.unit)} working.`);
    if (sheet === 'fixed' && q > repair) return toast(`Only ${qtyTxt(repair, it.unit)} in repair.`);
    const mv = { itemId: it.id, type: sheet, qty: q, date: f.date || today(), note: f.note.trim() };
    if (sheet === 'in' && n(f.cost)) mv.cost = n(f.cost) * q;
    if (sheet === 'repair' && n(f.cost)) mv.cost = n(f.cost);
    if (sheet === 'out' && f.projectId) mv.projectId = f.projectId;
    addMove(mv);
    close();
    toast(TITLES[sheet].split(' (')[0] + ' saved');
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[{ flex: 1, backgroundColor: c.ink2, borderRadius: 20, padding: 16 }, shadow]}>
          <T color={c.inkMuted} size={12} weight="600">{consumable ? 'In stock' : 'Working'}</T>
          <T color={c.inkFg} size={24} weight="800">{qtyTxt(usable, it.unit)}</T>
          <T color={c.inkMuted} size={12}>{it.minQty ? 'Warn at ' + qtyTxt(it.minQty, it.unit) : 'No low-stock alert'}</T>
        </View>
        <View style={[{ flex: 1, backgroundColor: c.surface, borderRadius: 20, padding: 16 }, shadow]}>
          <T muted size={12} weight="600">Total owned</T>
          <T size={20} weight="800">{qtyTxt(qty, it.unit)}</T>
          <T muted size={12} color={repair ? c.warn : undefined}>{repair ? repair + ' in repair' : 'None in repair'}</T>
        </View>
      </View>
      {isLow(it) ? <Pill label={consumable ? 'Low stock — time to buy more' : 'Running low'} t="bad" /> : null}

      <BtnRow>
        <Btn title="+ Stock in" onPress={() => open('in')} />
        <Btn variant="secondary" title={consumable ? '− Used' : '− Out / lost / sold'} onPress={() => open('out')} />
      </BtnRow>
      <BtnRow>
        {!consumable ? <Btn variant="secondary" title="Send for repair" onPress={() => open('repair')} /> : null}
        {!consumable && repair ? <Btn variant="secondary" title="Back from repair" onPress={() => open('fixed')} /> : null}
        <Btn variant="secondary" title="Correct count" onPress={() => open('adjust')} />
      </BtnRow>

      <Card>
        <KV
          rows={[
            ['Type', consumable ? 'Consumable' : 'Equipment'],
            ['Category', it.category],
            ...specKeysFor(it.category).map((k) => [
              SPEC_FIELDS[k].label.replace(/ \(.*\)$/, ''),
              it.specs && String(it.specs[k] || '').trim() ? String(it.specs[k]).trim() + (SPEC_FIELDS[k].suffix || '') : '',
            ]),
            ['Brand / model', it.brand],
            ['Serial No.', it.serialNo],
            ['Cost per unit', it.cost ? inr(it.cost) : ''],
            ['Stock value', it.cost ? inr(qty * n(it.cost)) : ''],
            ['Notes', it.notes],
          ]}
        />
      </Card>

      {upcoming.length ? (
        <View style={{ gap: 12 }}>
          <H2>Reserved on upcoming bookings</H2>
          <List>{upcoming.map((p) => <ProjRow key={p.id} p={p} onPress={() => navigation.navigate('Booking', { id: p.id })} />)}</List>
        </View>
      ) : null}

      <View style={{ gap: 12 }}>
        <H2>History</H2>
        {hist.length ? <List>{hist.map((m) => <MoveRow key={m.id} m={m} />)}</List> : (
          <Empty title="No stock changes yet" text="Every stock in, use, repair and count correction shows here." />
        )}
      </View>

      <Sheet visible={!!sheet} title={TITLES[sheet] || ''} onClose={close} onOk={save}>
        <Field
          label={sheet === 'adjust' ? `How many do you have? (now ${qtyTxt(qty, it.unit)})` : 'Quantity' + (it.unit ? ` (${it.unit})` : '')}
          required
          value={f.qty}
          onChangeText={set('qty')}
          keyboardType="decimal-pad"
        />
        {sheet === 'in' ? <Field label="Cost per unit (₹)" value={f.cost} onChangeText={set('cost')} keyboardType="decimal-pad" /> : null}
        {sheet === 'repair' ? <Field label="Repair cost (₹), if known" value={f.cost} onChangeText={set('cost')} keyboardType="decimal-pad" /> : null}
        {sheet === 'out' && recentProj.length ? (
          <View style={{ gap: 8 }}>
            <T muted size={12.5} weight="700">Used on programme</T>
            <Chips scroll options={opts([['', 'None'], ...recentProj.map((p) => [p.id, dmy(p.bookingDate) + ' · ' + p.customerName])])} value={f.projectId} onChange={set('projectId')} />
          </View>
        ) : null}
        <DateField label="Date" value={f.date} onChange={set('date')} />
        <Field
          label="Note"
          value={f.note}
          onChangeText={set('note')}
          placeholder={{ in: 'Shop / supplier', out: 'Used, broken, sold, lost…', repair: 'Repair shop, problem', fixed: '', adjust: 'Why the count changed' }[sheet]}
        />
      </Sheet>
    </Screen>
  );
}
