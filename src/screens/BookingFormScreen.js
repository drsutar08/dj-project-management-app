import React, { useLayoutEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Screen, Card, Field, DateField, FRow, FSec, Chips, opts, Btn, ConfirmBtn, T, QtyRow } from '../components/ui';
import { toast } from '../components/ui';
import { useStore } from '../store';
import { EVENTS, PROGRAMME_TYPES } from '../defaults';
import { dayName, inr, n, setupLines, today, withUnit } from '../utils';
import { useTheme } from '../theme';

export default function BookingFormScreen({ navigation, route }) {
  const c = useTheme();
  const { projects, settings, saveProject, deleteProject } = useStore();
  const existing = route.params?.id ? projects.find((p) => p.id === route.params.id) : null;
  const nextSerial = projects.reduce((m, x) => Math.max(m, parseInt(x.serial, 10) || 0), 0) + 1;

  const [p, setP] = useState(() => {
    const base = existing || {
      serial: String(nextSerial), receiptDate: today(), segment: settings.segments[0] || 'DJ', eventType: '', programmeType: '',
      customerName: '', age: '', fatherName: '', address: '', mobile: '', aadhaar: '', pan: '', bookingDate: '', from: '', to: '',
      startTime: '', endTime: '', shift: 'Night', services: [], qty: {}, total: '', advance: '', notes: '',
      status: 'booked', extras: [], payments: [], discount: 0,
    };
    // Fill counts for older bookings that only had a list of included effects.
    const { sound, fx } = setupLines(base, settings);
    const qty = {};
    [...sound, ...fx].forEach((l) => { if (l.qty) qty[l.name] = l.qty; });
    return { ...base, qty, age: base.age ? String(base.age) : '' };
  });
  const set = (k) => (v) => setP((s) => ({ ...s, [k]: v }));
  const setQty = (name) => (v) => setP((s) => ({ ...s, qty: { ...s.qty, [name]: v } }));

  useLayoutEffect(() => navigation.setOptions({ title: existing ? 'Edit booking' : 'New booking' }), [navigation, existing]);

  const { sound, fx } = setupLines(p, settings);
  const day = dayName(p.bookingDate);

  const onSave = () => {
    if (!p.customerName.trim()) return Alert.alert('Customer name needed', 'Enter the customer’s name.');
    if (!p.bookingDate) return Alert.alert('Programme date needed', 'Enter the programme date, like 15.2.2027.');
    if (!(n(p.total) > 0)) return Alert.alert('Amount needed', 'Enter the total amount.');
    // Keep only counts above zero; "services" stays the list of included items for older screens.
    const qty = {};
    Object.entries(p.qty || {}).forEach(([k, v]) => { if (n(v) > 0) qty[k] = n(v); });
    const id = saveProject({
      ...p,
      qty,
      services: Object.keys(qty),
      customerName: p.customerName.trim(),
      age: p.age ? n(p.age) : '',
      address: String(p.address || '').trim(),
      pan: String(p.pan || '').toUpperCase(),
      total: n(p.total),
      advance: n(p.advance),
    });
    toast(existing ? 'Booking updated' : 'Booking saved');
    if (existing) navigation.goBack();
    else navigation.replace('Booking', { id });
  };

  return (
    <Screen>
      <FRow>
        <Field label="Sl. No." value={p.serial} onChangeText={set('serial')} keyboardType="number-pad" />
        <DateField label="Booking date" value={p.receiptDate} onChange={set('receiptDate')} />
      </FRow>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Segment</T>
        <Chips scroll options={opts(settings.segments)} value={p.segment} onChange={set('segment')} />
      </View>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Event</T>
        <Chips scroll options={opts(EVENTS)} value={p.eventType} onChange={(v) => set('eventType')(p.eventType === v ? '' : v)} />
      </View>

      <FSec>Customer</FSec>
      <FRow>
        <Field label="Name" required value={p.customerName} onChangeText={set('customerName')} autoCapitalize="words" style={{ flex: 3 }} />
        <Field label="Age" value={p.age} onChangeText={set('age')} keyboardType="number-pad" style={{ flex: 1 }} />
      </FRow>
      <Field label="Father’s name" value={p.fatherName} onChangeText={set('fatherName')} autoCapitalize="words" />
      <Field label="Address" value={p.address} onChangeText={set('address')} placeholder="Village, PO, PS, district" autoCapitalize="words" />
      <FRow>
        <Field label="Mobile No." value={p.mobile} onChangeText={set('mobile')} keyboardType="phone-pad" />
        <Field label="Aadhaar No." value={p.aadhaar} onChangeText={set('aadhaar')} keyboardType="number-pad" />
      </FRow>
      <Field label="PAN (optional)" value={p.pan} onChangeText={set('pan')} autoCapitalize="characters" />

      <FSec>Programme</FSec>
      <DateField label="Programme date" required value={p.bookingDate} onChange={set('bookingDate')} />
      {day ? <T size={13} weight="700" color={c.accent} style={{ marginTop: -8 }}>{day}</T> : null}
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Day / Night</T>
        <Chips options={opts(['Night', 'Day'])} value={p.shift} onChange={set('shift')} />
      </View>
      <FRow>
        <Field label="From" value={p.from} onChangeText={set('from')} placeholder="Village" />
        <Field label="To" value={p.to} onChangeText={set('to')} placeholder="Village" />
      </FRow>
      <FRow>
        <Field label="Start time" value={p.startTime} onChangeText={set('startTime')} placeholder="6 PM" />
        <Field label="End time" value={p.endTime} onChangeText={set('endTime')} placeholder="10 PM" />
      </FRow>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Programme type</T>
        <Chips options={opts(PROGRAMME_TYPES)} value={p.programmeType} onChange={(v) => set('programmeType')(p.programmeType === v ? '' : v)} />
      </View>

      <FSec>Sound setup</FSec>
      <Card style={{ paddingVertical: 8 }}>
        {sound.length ? sound.map((l) => <QtyRow key={l.name} label={withUnit(l.name, l.unit)} value={p.qty[l.name] || 0} onChange={setQty(l.name)} />) : (
          <T muted size={13}>Add sound items like Sound Bass and Sound Top in Settings.</T>
        )}
      </Card>

      <FSec>Effects</FSec>
      <Card style={{ paddingVertical: 8 }}>
        {fx.map((l) => <QtyRow key={l.name} label={withUnit(l.name, l.unit)} value={p.qty[l.name] || 0} onChange={setQty(l.name)} />)}
      </Card>
      <T muted size={12.5} style={{ marginTop: -8 }}>Set how many of each go to the programme. 0 means not included. Both lists print on the bill.</T>

      <FSec>Amount</FSec>
      <FRow>
        <Field label="Total amount (₹)" required value={p.total} onChangeText={set('total')} keyboardType="decimal-pad" />
        <Field label="Advance (₹)" value={p.advance} onChangeText={set('advance')} keyboardType="decimal-pad" />
      </FRow>
      <T muted size={13}>Balance: {inr(n(p.total) - n(p.advance))}</T>
      <Field label="Notes" value={p.notes} onChangeText={set('notes')} multiline />

      <Btn title={existing ? 'Save changes' : 'Save booking'} onPress={onSave} />
      {existing ? (
        <ConfirmBtn
          title="Delete booking"
          confirmTitle="Tap again to delete"
          onConfirm={() => {
            deleteProject(existing.id);
            toast('Booking deleted');
            navigation.popToTop();
          }}
        />
      ) : null}
    </Screen>
  );
}
