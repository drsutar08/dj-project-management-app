import React, { useLayoutEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Screen, List, Empty, Card, MoneyRow, LinkBtn, Chips, opts, H2 } from '../components/ui';
import { ItemRow, MoveRow } from '../components/rows';
import { useSorted } from '../store';
import { useTheme, shadow } from '../theme';
import { inr, isLow, n } from '../utils';

export default function InventoryScreen({ navigation }) {
  const c = useTheme();
  const { items, moves } = useSorted();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <View style={{ marginRight: 16 }}><LinkBtn onPress={() => navigation.navigate('ItemForm')}>+ Add</LinkBtn></View> });
  }, [navigation]);

  if (!items.length)
    return (
      <Screen>
        <Empty
          title="No stock items yet"
          text="Add your bass, line array, tops, amplifiers, mixers, cords, lights and effect machines, and consumables like CO₂, paper spray and cold fire powder."
          action="+ Add item"
          onAction={() => navigation.navigate('ItemForm')}
        />
      </Screen>
    );

  const cats = [...new Set(items.map((it) => it.category).filter(Boolean))];
  const low = items.filter(isLow);
  const inRepair = items.reduce((a, it) => a + n(it.repair), 0);
  const value = items.reduce((a, it) => a + n(it.qty) * n(it.cost), 0);

  const qq = q.trim().toLowerCase();
  const list = items.filter(
    (it) =>
      (!cat || (cat === '__low' ? isLow(it) : it.category === cat)) &&
      (!qq || [it.name, it.category, it.brand, it.notes, ...Object.values(it.specs || {})].join(' ').toLowerCase().includes(qq))
  );

  return (
    <Screen>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search stock"
        placeholderTextColor={c.muted}
        style={[{ backgroundColor: c.surface2, color: c.fg, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 }, shadow]}
      />
      <Card style={{ gap: 8 }}>
        <MoneyRow label="Items" value={String(items.length)} />
        <MoneyRow label="Low stock" value={String(low.length)} color={low.length ? c.bad : undefined} />
        <MoneyRow label="Pieces in repair" value={String(inRepair)} color={inRepair ? c.warn : undefined} />
        {value ? <MoneyRow total label="Stock value" value={inr(value)} /> : null}
      </Card>
      <Chips
        scroll
        options={opts([['', 'All'], ...(low.length ? [['__low', 'Low stock']] : []), ...cats])}
        value={cat}
        onChange={setCat}
      />
      {list.length ? (
        <List>{list.map((it) => <ItemRow key={it.id} it={it} onPress={() => navigation.navigate('Item', { id: it.id })} />)}</List>
      ) : (
        <Empty title="No match" text="Try another name or category." />
      )}
      {moves.length ? (
        <View style={{ gap: 12 }}>
          <H2>Recent stock changes</H2>
          <List>{moves.slice(0, 8).map((m) => <MoveRow key={m.id} m={m} showItem />)}</List>
        </View>
      ) : null}
    </Screen>
  );
}
