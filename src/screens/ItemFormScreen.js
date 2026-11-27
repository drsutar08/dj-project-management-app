import React, { useLayoutEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Screen, Field, FRow, FSec, Chips, opts, Btn, ConfirmBtn, T, toast } from '../components/ui';
import { useStore } from '../store';
import { ITEM_KINDS, ITEM_PRESETS, SPEC_FIELDS, UNITS, specKeysFor } from '../defaults';
import { n, today } from '../utils';

// Text fields side by side in pairs, choice fields on their own row.
function SpecFields({ keys, specs, onChange }) {
  const text = keys.filter((k) => !SPEC_FIELDS[k].choices);
  const choice = keys.filter((k) => SPEC_FIELDS[k].choices);
  const pairs = [];
  for (let i = 0; i < text.length; i += 2) pairs.push(text.slice(i, i + 2));
  return (
    <>
      {pairs.map((pair) => (
        <FRow key={pair.join()}>
          {pair.map((k) => (
            <Field
              key={k}
              label={SPEC_FIELDS[k].label}
              value={specs[k]}
              onChangeText={(v) => onChange(k, v)}
              keyboardType={SPEC_FIELDS[k].keyboard}
              placeholder={SPEC_FIELDS[k].placeholder}
            />
          ))}
        </FRow>
      ))}
      {choice.map((k) => (
        <View key={k} style={{ gap: 8 }}>
          <T muted size={12.5} weight="700">{SPEC_FIELDS[k].label}</T>
          <Chips scroll options={opts(SPEC_FIELDS[k].choices)} value={specs[k]} onChange={(v) => onChange(k, specs[k] === v ? '' : v)} />
        </View>
      ))}
    </>
  );
}

export default function ItemFormScreen({ navigation, route }) {
  const { items, settings, saveItem, deleteItem, addMove } = useStore();
  const existing = route.params?.id ? items.find((x) => x.id === route.params.id) : null;
  const cats0 = settings.invCategories || [];
  const [f, setF] = useState(
    existing
      ? { ...existing, specs: { ...(existing.specs || {}) }, minQty: existing.minQty ? String(existing.minQty) : '', cost: existing.cost ? String(existing.cost) : '' }
      : { name: '', kind: 'equipment', category: cats0[0] || '', unit: 'pcs', specs: {}, qty: '', minQty: '', cost: '', brand: '', serialNo: '', notes: '' }
  );
  const [preset, setPreset] = useState('');
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const setSpec = (k, v) => setF((s) => ({ ...s, specs: { ...s.specs, [k]: v } }));
  const cats = f.category && !cats0.includes(f.category) ? [...cats0, f.category] : cats0;
  const unitOpts = UNITS.includes(f.unit) || !f.unit ? UNITS : [f.unit, ...UNITS];
  const specKeys = specKeysFor(f.category);

  useLayoutEffect(() => navigation.setOptions({ title: existing ? 'Edit item' : 'Add stock item' }), [navigation, existing]);

  const pickPreset = (name) => {
    setPreset(name);
    const p = ITEM_PRESETS.find((x) => x.name === name);
    if (!p) return;
    setF((s) => ({ ...s, name: p.name, category: p.category, unit: p.unit, kind: p.kind || 'equipment', specs: { ...p.specs } }));
  };

  const onSave = () => {
    if (!String(f.name).trim()) return Alert.alert('Name needed', 'Enter the item name, e.g. “Bass 18" double” or “Speakon cord”.');
    // Keep only the details that apply to the chosen category.
    const specs = {};
    specKeys.forEach((k) => {
      const v = String(f.specs[k] == null ? '' : f.specs[k]).trim();
      if (v) specs[k] = v;
    });
    const base = {
      name: f.name.trim(), kind: f.kind, category: f.category, unit: f.unit, specs,
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
      {existing ? null : (
        <View style={{ gap: 8 }}>
          <T muted size={12.5} weight="700">Quick pick (fills the form, change anything after)</T>
          <Chips scroll options={opts(ITEM_PRESETS.map((p) => p.name))} value={preset} onChange={pickPreset} />
        </View>
      )}
      <Field label="Item name" required value={f.name} onChangeText={set('name')} autoCapitalize="words" placeholder='Bass 18" double, Speakon cord, Amplifier…' />
      <Chips options={opts(ITEM_KINDS)} value={f.kind} onChange={set('kind')} />
      <T muted size={12.5}>
        {f.kind === 'consumable'
          ? 'Consumables get used up on programmes (CO₂, paper, cold fire powder, batteries). Stock goes down when you use it.'
          : 'Equipment goes out to programmes and comes back (bass, line array, amplifiers, cords). You can reserve it on a booking.'}
      </T>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Category</T>
        <Chips scroll options={opts(cats)} value={f.category} onChange={set('category')} />
      </View>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Unit</T>
        <Chips scroll options={opts(unitOpts)} value={f.unit} onChange={set('unit')} />
      </View>

      {specKeys.length ? (
        <>
          <FSec>{f.category} details</FSec>
          <SpecFields keys={specKeys} specs={f.specs} onChange={setSpec} />
        </>
      ) : null}

      <FSec>Stock</FSec>
      <FRow>
        {existing ? null : <Field label="Quantity you have now" value={f.qty} onChangeText={set('qty')} keyboardType="decimal-pad" />}
        <Field label="Warn me when at or below" value={f.minQty} onChangeText={set('minQty')} keyboardType="decimal-pad" placeholder="e.g. 2" />
      </FRow>
      {existing ? <T muted size={12.5}>To change the quantity, use Stock in, Used / out or Correct count on the item page, so the history stays right.</T> : null}
      <Field label="Cost per unit (₹)" value={f.cost} onChangeText={set('cost')} keyboardType="decimal-pad" />

      <FSec>Other details</FSec>
      <FRow>
        <Field label="Brand / model" value={f.brand} onChangeText={set('brand')} placeholder="JBL, RCF, Crown…" />
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
