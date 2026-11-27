import React, { useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Screen, Card, T, H2, KV, MoneyRow, Btn, BtnRow, ConfirmBtn, List, Empty, Pill, LinkBtn,
  Sheet, Field, DateField, FRow, Chips, opts, toast, Row, Tile, RemoveBtn,
} from '../components/ui';
import { LedRow, MoveRow } from '../components/rows';
import { useStore, useSorted } from '../store';
import { useTheme } from '../theme';
import { MODES, STATUSES } from '../defaults';
import { dmy, initials, inr, itemAvail, maskId, n, projMoney, qtyTxt, today } from '../utils';

export default function BookingDetailScreen({ navigation, route }) {
  const c = useTheme();
  const { projects, settings, patchProject, items, addMove } = useStore();
  const { ledger, moves } = useSorted();
  const p = projects.find((x) => x.id === route.params.id);
  const [sheet, setSheet] = useState(null); // 'pay' | 'extra' | 'disc' | 'final' | 'gear'
  const [form, setForm] = useState({});
  const setF = (k) => (v) => setForm((s) => ({ ...s, [k]: v }));

  useLayoutEffect(() => {
    if (!p) return;
    navigation.setOptions({
      title: p.customerName,
      headerRight: () => <LinkBtn onPress={() => navigation.navigate('BookingForm', { id: p.id })}>Edit</LinkBtn>,
    });
  }, [navigation, p]);

  if (!p) return <Screen><Empty title="Booking not found" text="It may have been deleted." /></Screen>;

  const m = projMoney(p, ledger);
  const st = STATUSES[p.status || 'booked'] || STATUSES.booked;
  const svc = settings.services.concat((p.services || []).filter((s) => !settings.services.includes(s)));
  const work = ledger.filter((l) => l.projectId === p.id);
  const patch = (ch, msg) => { patchProject(p.id, ch); if (msg) toast(msg); };

  const open = (k, init) => { setForm(init || {}); setSheet(k); };
  const close = () => setSheet(null);

  const saveSheet = () => {
    if (sheet === 'pay') {
      if (!(n(form.amount) > 0)) return toast('Enter an amount above zero.');
      patch({ payments: [...(p.payments || []), { amount: n(form.amount), mode: form.mode || 'Cash', date: form.date || today(), note: form.note || '' }] }, 'Payment recorded');
    } else if (sheet === 'extra') {
      if (!String(form.label || '').trim() || !(n(form.amount) > 0)) return toast('Enter what it is for and the amount.');
      patch({ extras: [...(p.extras || []), { label: form.label.trim(), amount: n(form.amount) }] }, 'Charge added');
    } else if (sheet === 'disc') {
      patch({ discount: n(form.discount) }, 'Discount saved');
    } else if (sheet === 'gear') {
      const it = items.find((x) => x.id === form.itemId);
      const q = n(form.qty);
      if (!it) return toast('Pick an item.');
      if (!(q > 0)) return toast('Enter a quantity above zero.');
      if (it.kind === 'consumable') {
        if (q > n(it.qty)) return toast('Only ' + qtyTxt(it.qty, it.unit) + ' in stock.');
        addMove({ itemId: it.id, type: 'out', qty: q, date: p.bookingDate || today(), projectId: p.id, note: '' });
        toast('Stock used on this programme');
      } else {
        const gear = (p.gear || []).filter((g) => g.itemId !== it.id);
        patch({ gear: [...gear, { itemId: it.id, qty: q }] }, 'Equipment reserved');
      }
    } else if (sheet === 'final') {
      const ch = { status: 'final', billNo: String(form.billNo || p.serial), billDate: form.billDate || today() };
      if (form.collect) ch.payments = [...(p.payments || []), { amount: m.balance, mode: form.collect, date: ch.billDate, note: 'Final settlement' }];
      patch(ch, 'Bill created');
      close();
      return navigation.navigate('Bill', { id: p.id });
    }
    close();
  };

  const gearRows = (p.gear || [])
    .map((g) => {
      const it = items.find((x) => x.id === g.itemId);
      if (!it) return null;
      const av = itemAvail(it, projects, p.bookingDate, p.id);
      return { g, it, av: { ...av, free: av.free - n(g.qty) } };
    })
    .filter(Boolean);
  const used = moves.filter((mv) => mv.projectId === p.id);
  const pickIt = sheet === 'gear' ? items.find((x) => x.id === form.itemId) : null;
  let pickNote = '';
  if (pickIt && pickIt.kind === 'consumable') pickNote = qtyTxt(pickIt.qty, pickIt.unit) + ' in stock. This takes it out of stock now.';
  else if (pickIt) {
    const av = itemAvail(pickIt, projects, p.bookingDate, p.id);
    const why = [av.booked ? av.booked + ' on other bookings' : '', av.repair ? av.repair + ' in repair' : ''].filter(Boolean).join(', ');
    pickNote = qtyTxt(av.free, pickIt.unit) + ' free on ' + (dmy(p.bookingDate) || 'this date') + (why ? ' (' + why + ')' : '') + '.';
  }

  const maxBill = projects.reduce((mx, x) => Math.max(mx, parseInt(x.billNo, 10) || 0), 0);

  return (
    <Screen>
      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pill label={st.label} t={st.tone} />
          <T muted size={12.5} weight="600">Sl. No. {p.serial}</T>
        </View>
        <KV
          rows={[
            ['Programme date', dmy(p.bookingDate)],
            ['Time', [p.startTime, p.endTime].filter(Boolean).join(' – ') + (p.shift ? ' · ' + p.shift : '')],
            ['Segment / event', [p.segment, p.eventType].filter(Boolean).join(' · ')],
            ['Route', [p.from, p.to].filter(Boolean).join(' → ')],
            ['Father’s name', p.fatherName],
            ['Mobile', p.mobile],
            ['Aadhaar', maskId(p.aadhaar)],
            ['PAN', p.pan],
            ['Receipt date', dmy(p.receiptDate)],
            ['Notes', p.notes],
          ]}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {svc.map((s) => {
            const on = (p.services || []).includes(s);
            return (
              <View key={s} style={{ backgroundColor: on ? c.goodBg : c.surface2, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 5 }}>
                <T size={12.5} weight="700" color={on ? c.good : c.muted} style={!on && { textDecorationLine: 'line-through' }}>{s}</T>
              </View>
            );
          })}
        </View>
      </Card>

      <View style={{ gap: 12 }}>
        <H2>Customer payment</H2>
        <Card style={{ gap: 8 }}>
          <MoneyRow label="Package amount" value={inr(m.total)} />
          {(p.extras || []).map((x, i) => (
            <MoneyRow key={'e' + i} label={'+ ' + x.label} value={inr(x.amount)} onRemove={() => patch({ extras: p.extras.filter((_, j) => j !== i) }, 'Charge removed')} />
          ))}
          {m.disc ? <MoneyRow label="− Discount" value={inr(m.disc)} /> : null}
          <MoneyRow total label="Bill total" value={inr(m.net)} />
          <MoneyRow label={'Advance (' + (dmy(p.receiptDate) || 'at booking') + ')'} value={'−' + inr(p.advance)} color={c.good} />
          {(p.payments || []).map((x, i) => (
            <MoneyRow key={'p' + i} label={'Received ' + dmy(x.date) + ' · ' + (x.mode || 'Cash')} value={'−' + inr(x.amount)} color={c.good}
              onRemove={() => patch({ payments: p.payments.filter((_, j) => j !== i) }, 'Payment removed')} />
          ))}
          <MoneyRow total label="Balance" value={inr(m.balance)} color={m.balance > 0 ? c.bad : c.good} />
        </Card>
        <BtnRow>
          <Btn variant="secondary" title="+ Payment received" onPress={() => open('pay', { amount: String(Math.max(0, m.balance) || ''), mode: 'Cash', date: today() })} />
          <Btn variant="secondary" title="+ Extra charge" onPress={() => open('extra')} />
          <Btn variant="secondary" title="Discount" onPress={() => open('disc', { discount: String(p.discount || '') })} />
        </BtnRow>
      </View>

      <View style={{ gap: 12 }}>
        <H2 right="+ Add staff work" onRight={() => navigation.navigate('LedgerForm', { kind: 'earn', projectId: p.id })}>Staff on this programme</H2>
        {work.length ? <List>{work.map((l) => <LedRow key={l.id} l={l} />)}</List> : (
          <Empty title="No staff added yet" text="Add who worked this programme and their wage. It goes into each person’s pay ledger." />
        )}
        <Card style={{ gap: 8 }}>
          <MoneyRow label="Bill total" value={inr(m.net)} />
          <MoneyRow label="Staff wages" value={'−' + inr(m.labour)} />
          <MoneyRow total label="Margin" value={inr(m.profit)} color={m.profit >= 0 ? c.good : c.bad} />
        </Card>
      </View>

      <View style={{ gap: 12 }}>
        <H2 right={items.length ? '+ Add' : '+ Add stock items'} onRight={() => (items.length ? open('gear', { itemId: '', qty: '1' }) : navigation.navigate('ItemForm'))}>Equipment & stock</H2>
        {gearRows.length || used.length ? (
          <List>
            {gearRows.map(({ g, it, av }) => (
              <Row
                key={g.itemId}
                left={<Tile top={initials(it.name)} t={av.free < 0 ? 'bad' : 'plum'} />}
                title={it.name}
                sub={av.free < 0 ? 'Short by ' + qtyTxt(-av.free, it.unit) + ' on ' + dmy(p.bookingDate) : 'Reserved · ' + qtyTxt(av.free, it.unit) + ' still free that day'}
                right={qtyTxt(g.qty, it.unit)}
                rightColor={av.free < 0 ? c.bad : undefined}
                onPress={() => navigation.navigate('Item', { id: it.id })}
                extra={<RemoveBtn onPress={() => patch({ gear: (p.gear || []).filter((x) => x.itemId !== g.itemId) }, 'Equipment removed')} />}
              />
            ))}
            {used.map((mv) => <MoveRow key={mv.id} m={mv} showItem />)}
          </List>
        ) : (
          <Empty title="No equipment added" text="Reserve the speakers, lights and machines going to this programme, and record CO₂, paper and other stock used." />
        )}
      </View>

      <View style={{ gap: 10 }}>
        {p.status === 'final' ? (
          <Btn title={'View bill No. ' + (p.billNo || p.serial)} onPress={() => navigation.navigate('Bill', { id: p.id })} />
        ) : (
          <Btn title="Finalise & create bill" onPress={() => open('final', { billNo: String(p.billNo || p.serial || maxBill + 1), billDate: today(), collect: '' })} />
        )}
        <BtnRow>
          {p.status === 'final'
            ? <Btn variant="secondary" title="Reopen booking" onPress={() => patch({ status: 'done' }, 'Booking reopened')} />
            : <Btn variant="secondary" title="Preview receipt" onPress={() => navigation.navigate('Bill', { id: p.id })} />}
          {p.status === 'booked' ? <Btn variant="secondary" title="Mark programme done" onPress={() => patch({ status: 'done' }, 'Marked as done')} /> : null}
          {p.status !== 'cancel'
            ? <ConfirmBtn title="Cancel booking" confirmTitle="Tap again to cancel" onConfirm={() => patch({ status: 'cancel' }, 'Booking cancelled')} />
            : <Btn variant="secondary" title="Restore booking" onPress={() => patch({ status: 'booked' }, 'Booking restored')} />}
        </BtnRow>
      </View>

      <Sheet visible={sheet === 'pay'} title="Payment received" onClose={close} onOk={saveSheet} okTitle="Add payment">
        <Field label="Amount (₹)" required value={form.amount} onChangeText={setF('amount')} keyboardType="decimal-pad" />
        <Chips options={opts(MODES)} value={form.mode} onChange={setF('mode')} />
        <DateField label="Date" value={form.date} onChange={setF('date')} />
        <Field label="Note" value={form.note} onChangeText={setF('note')} />
      </Sheet>

      <Sheet visible={sheet === 'extra'} title="Extra charge" onClose={close} onOk={saveSheet} okTitle="Add charge">
        <Field label="For" required value={form.label} onChangeText={setF('label')} placeholder="Extra hour, extra light, transport…" />
        <Field label="Amount (₹)" required value={form.amount} onChangeText={setF('amount')} keyboardType="decimal-pad" />
      </Sheet>

      <Sheet visible={sheet === 'gear'} title="Add equipment or stock" onClose={close} onOk={saveSheet} okTitle={pickIt && pickIt.kind === 'consumable' ? 'Use from stock' : 'Reserve'}>
        <View style={{ gap: 8 }}>
          <T muted size={12.5} weight="700">Item</T>
          <Chips options={opts(items.slice().sort((a, b) => String(a.name).localeCompare(String(b.name))).map((it) => [it.id, it.name]))} value={form.itemId} onChange={setF('itemId')} />
        </View>
        {pickIt ? <T muted size={13}>{pickNote}</T> : null}
        <Field label="Quantity" required value={form.qty} onChangeText={setF('qty')} keyboardType="decimal-pad" />
      </Sheet>

      <Sheet visible={sheet === 'disc'} title="Discount" onClose={close} onOk={saveSheet}>
        <Field label="Discount (₹)" value={form.discount} onChangeText={setF('discount')} keyboardType="decimal-pad" />
      </Sheet>

      <Sheet visible={sheet === 'final'} title="Finalise & create bill" onClose={close} onOk={saveSheet} okTitle="Create bill">
        <Card style={{ gap: 8 }}>
          <MoneyRow label="Bill total" value={inr(m.net)} />
          <MoneyRow label="Received so far" value={inr(m.paid)} color={c.good} />
          <MoneyRow total label="Balance" value={inr(m.balance)} color={m.balance > 0 ? c.bad : c.good} />
        </Card>
        <T muted size={13}>Add any extra charges or payments on the booking first. You can reopen the booking later.</T>
        <FRow>
          <Field label="Bill No." value={form.billNo} onChangeText={setF('billNo')} keyboardType="number-pad" />
          <DateField label="Bill date" value={form.billDate} onChange={setF('billDate')} />
        </FRow>
        {m.balance > 0 ? (
          <View style={{ gap: 8 }}>
            <T muted size={12.5} weight="700">Balance received now?</T>
            <Chips options={opts([['', 'Not yet'], ['Cash', 'Full in cash'], ['UPI', 'Full by UPI']])} value={form.collect} onChange={setF('collect')} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
