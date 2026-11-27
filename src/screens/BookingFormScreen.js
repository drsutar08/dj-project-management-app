import React, { useLayoutEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Screen, Field, DateField, FRow, FSec, Chips, opts, Btn, ConfirmBtn, T } from '../components/ui';
import { toast } from '../components/ui';
import { useStore } from '../store';
import { EVENTS } from '../defaults';
import { inr, n, today } from '../utils';

export default function BookingFormScreen({ navigation, route }) {
  const { projects, settings, saveProject, deleteProject } = useStore();
  const existing = route.params?.id ? projects.find((p) => p.id === route.params.id) : null;
  const nextSerial = projects.reduce((m, x) => Math.max(m, parseInt(x.serial, 10) || 0), 0) + 1;

  const [p, setP] = useState(
    existing || {
      serial: String(nextSerial), receiptDate: today(), segment: settings.segments[0] || 'DJ', eventType: '',
      customerName: '', fatherName: '', mobile: '', aadhaar: '', pan: '', bookingDate: '', from: '', to: '',
      startTime: '', endTime: '', shift: 'Night', services: [], total: '', advance: '', notes: '',
      status: 'booked', extras: [], payments: [], discount: 0,
    }
  );
  const set = (k) => (v) => setP((s) => ({ ...s, [k]: v }));

  useLayoutEffect(() => navigation.setOptions({ title: existing ? 'Edit booking' : 'New booking' }), [navigation, existing]);

  const svcOpts = settings.services.concat((p.services || []).filter((x) => !settings.services.includes(x)));

  const onSave = () => {
    if (!p.customerName.trim()) return Alert.alert('Customer name needed', 'Enter the customer’s name.');
    if (!p.bookingDate) return Alert.alert('Programme date needed', 'Enter the booking date, like 15.2.2027.');
    if (!(n(p.total) > 0)) return Alert.alert('Amount needed', 'Enter the total amount.');
    const id = saveProject({
      ...p,
      customerName: p.customerName.trim(),
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
        <DateField label="Receipt date" value={p.receiptDate} onChange={set('receiptDate')} />
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
      <Field label="Name" required value={p.customerName} onChangeText={set('customerName')} autoCapitalize="words" />
      <Field label="Father’s name" value={p.fatherName} onChangeText={set('fatherName')} autoCapitalize="words" />
      <FRow>
        <Field label="Mobile No." value={p.mobile} onChangeText={set('mobile')} keyboardType="phone-pad" />
        <Field label="Aadhaar No." value={p.aadhaar} onChangeText={set('aadhaar')} keyboardType="number-pad" />
      </FRow>
      <Field label="PAN (optional)" value={p.pan} onChangeText={set('pan')} autoCapitalize="characters" />

      <FSec>Programme</FSec>
      <DateField label="Booking date" required value={p.bookingDate} onChange={set('bookingDate')} />
      <FRow>
        <Field label="Address / from" value={p.from} onChangeText={set('from')} placeholder="Village" />
        <Field label="To" value={p.to} onChangeText={set('to')} />
      </FRow>
      <FRow>
        <Field label="Start time" value={p.startTime} onChangeText={set('startTime')} placeholder="6 PM" />
        <Field label="End time" value={p.endTime} onChangeText={set('endTime')} placeholder="10 PM" />
      </FRow>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Day / Night</T>
        <Chips options={opts(['Night', 'Day'])} value={p.shift} onChange={set('shift')} />
      </View>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Effects included</T>
        <Chips multi options={opts(svcOpts)} value={p.services} onChange={set('services')} />
      </View>

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
