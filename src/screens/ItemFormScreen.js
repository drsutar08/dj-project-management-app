import React, { useLayoutEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Screen, Field, FRow, FSec, Chips, opts, Btn, ConfirmBtn, T, toast } from '../components/ui';
import { useStore } from '../store';
import { ITEM_KINDS, UNITS } from '../defaults';
import { n, today } from '../utils';

export default function ItemFormScreen({ navigation, route }) {
  const { items, settings, saveItem, deleteItem, addMove } = useStore();
  const existing = route.params?.id ? items.find((x) => x.id === route.params.id) : null;
  const cats = settings.invCategories || [];
  const [f, setF] = useState(
    existing
      ? { ...existing, minQty: existing.minQty ? String(existing.minQty) : '', cost: existing.cost ? String(existing.cost) : '' }
      : { name: '', kind: 'equipment', category: cats[0] || '', unit: 'pcs', qty: '', minQty: '', cost: '', brand: '', serialNo: '', notes: '' }
  );
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const unitOpts = UNITS.includes(f.unit) || !f.unit ? UNITS : [f.unit, ...UNITS];

  useLayoutEffect(() => navigation.setOptions({ title: existing ? 'Edit item' : 'Add stock item' }), [navigation, existing]);

  const onSave = () => {
    if (!String(f.name).trim()) return Alert.alert('Name needed', 'Enter the item name, e.g. “JBL 15-inch top” or “CO₂ cylinder”.');
    const base = {
      name: f.name.trim(), kind: f.kind, category: f.category, unit: f.unit,
      minQty: n(f.minQty), cost: n(f.cost), brand: String(f.brand || '').trim(), serialNo: String(f.serialNo || '').trim(), notes: f.notes,
    };
    if (existing) {
      saveItem({ ...existing, ...base });
      toast('Item updated');
      return navigation.goBack();
    }
    const opening = n(f.qty);
    const id = saveItem({ ...base, qty: 0, repair: 0 });
    if (opening) addMove({ itemId: id, type: 'in', qty: opening, date: today(), note: 'Opening stock' });
    toast('Item added');
    navigation.replace('Item', { id });
  };

  return (
    <Screen>
      <Field label="Item name" required value={f.name} onChangeText={set('name')} autoCapitalize="words" placeholder="JBL 15-inch top, Sharpy 230, CO₂ cylinder…" />
      <Chips options={opts(ITEM_KINDS)} value={f.kind} onChange={set('kind')} />
      <T muted size={12.5}>
        {f.kind === 'consumable'
          ? 'Consumables get used up on programmes (CO₂, paper, cold fire powder, batteries). Stock goes down when you use it.'
          : 'Equipment goes out to programmes and comes back (speakers, lights, mixers). You can reserve it on a booking.'}
      </T>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Category</T>
        <Chips scroll options={opts(cats)} value={f.category} onChange={set('category')} />
      </View>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Unit</T>
        <Chips scroll options={opts(unitOpts)} value={f.unit} onChange={set('unit')} />
      </View>

      <FSec>Stock</FSec>
      <FRow>
        {existing ? null : <Field label="Quantity you have now" value={f.qty} onChangeText={set('qty')} keyboardType="decimal-pad" />}
        <Field label="Warn me when at or below" value={f.minQty} onChangeText={set('minQty')} keyboardType="decimal-pad" placeholder="e.g. 2" />
      </FRow>
      {existing ? <T muted size={12.5}>To change the quantity, use Stock in, Used / out or Correct count on the item page, so the history stays right.</T> : null}
      <Field label="Cost per unit (₹)" value={f.cost} onChangeText={set('cost')} keyboardType="decimal-pad" />

      <FSec>Other details</FSec>
      <FRow>
        <Field label="Brand / model" value={f.brand} onChangeText={set('brand')} />
        <Field label="Serial No." value={f.serialNo} onChangeText={set('serialNo')} autoCapitalize="characters" />
      </FRow>
      <Field label="Notes" value={f.notes} onChangeText={set('notes')} multiline placeholder="Where it is kept, supplier, warranty…" />

      <Btn title={existing ? 'Save changes' : 'Add item'} onPress={onSave} />
      {existing ? (
        <ConfirmBtn
          title="Delete item"
          confirmTitle="Tap again — history is deleted too"
          onConfirm={() => {
            deleteItem(existing.id);
            toast('Item deleted');
            navigation.popToTop();
          }}
        />
      ) : null}
    </Screen>
  );
}
