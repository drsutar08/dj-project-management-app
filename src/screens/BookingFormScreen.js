import React, { useLayoutEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Screen, Card, Field, DateField, FRow, FSec, Chips, opts, Btn, ConfirmBtn, T, QtyRow, Icon, LinkBtn, RemoveBtn } from '../components/ui';
import { toast } from '../components/ui';
import { useStore } from '../store';
import { EVENTS, PROGRAMME_TYPES } from '../defaults';
import { clashesFor, customerKey, customersOf, dayName, dmy, inr, n, setupLines, slotsOn, today, withUnit } from '../utils';
import { useTheme } from '../theme';

const CUSTOMER_FIELDS = ['customerName', 'age', 'fatherName', 'address', 'mobile', 'aadhaar', 'pan'];

// Night first (most programmes), then Day; keep the current one if both are taken or both free.
function freeShift(projects, date, exceptId, current) {
  const s = slotsOn(projects, date, exceptId);
  if (!s[current || 'Night'].length) return current || 'Night';
  if (!s.Night.length) return 'Night';
  if (!s.Day.length) return 'Day';
  return current || 'Night';
}

export default function BookingFormScreen({ navigation, route }) {
  const c = useTheme();
  const { projects, settings, saveProject, deleteProject, ledger } = useStore();
  const customers = customersOf(projects, ledger);
  const existing = route.params?.id ? projects.find((p) => p.id === route.params.id) : null;
  const nextSerial = projects.reduce((m, x) => Math.max(m, parseInt(x.serial, 10) || 0), 0) + 1;

  const [p, setP] = useState(() => {
    const base = existing || {
      serial: String(nextSerial), receiptDate: today(), segment: settings.segments[0] || 'DJ', eventType: '', programmeType: '',
      customerName: '', age: '', fatherName: '', address: '', mobile: '', aadhaar: '', pan: '', bookingDate: route.params?.date || '', from: '', to: '',
      startTime: '', endTime: '', shift: 'Night', services: [], qty: {}, total: '', advance: '', notes: '', altMobiles: [],
      status: 'booked', extras: [], payments: [], discount: 0,
    };
    // "New booking" from a customer's page: start with their details.
    const cust = !existing && route.params?.customer ? customers.find((x) => x.key === route.params.customer) : null;
    if (cust) CUSTOMER_FIELDS.forEach((f) => { if (cust[f]) base[f] = String(cust[f]); });
    // Fill counts for older bookings that only had a list of included effects.
    const { sound, fx } = setupLines(base, settings);
    const qty = {};
    [...sound, ...fx].forEach((l) => { if (l.qty) qty[l.name] = l.qty; });
    // A new booking for a date: take whichever of Night / Day is still free.
    if (!existing && base.bookingDate) base.shift = freeShift(projects, base.bookingDate, '__new', base.shift);
    return { ...base, qty, age: base.age ? String(base.age) : '', altMobiles: [...(base.altMobiles || [])] };
  });
  const set = (k) => (v) => setP((s) => ({ ...s, [k]: v }));
  // Repeat customer: a known mobile number on a new booking offers to fill in their details.
  const known = !existing && String(p.mobile || '').replace(/\D/g, '').length >= 10
    ? customers.find((x) => x.key === customerKey(p) && x.key.startsWith('m'))
    : null;
  const canFill = known && CUSTOMER_FIELDS.some((f) => known[f] && !String(p[f] || '').trim());
  const fillFromKnown = () => setP((s) => {
    const next = { ...s };
    CUSTOMER_FIELDS.forEach((f) => { if (known[f] && !String(s[f] || '').trim()) next[f] = String(known[f]); });
    return next;
  });
  const clashes = clashesFor(projects, { ...p, id: existing ? existing.id : '__new' });
  const slots = slotsOn(projects, p.bookingDate, existing ? existing.id : '__new');
  const slotText = (k) => (slots[k].length ? slots[k].map((x) => x.customerName || 'Sl. ' + x.serial).join(', ') : 'free');
  // New booking: when the date changes, move to the free slot if the current one is taken.
  const onDate = (d) => setP((s) => ({ ...s, bookingDate: d, shift: existing ? s.shift : freeShift(projects, d, '__new', s.shift) }));
  const setAlt = (i) => (v) => setP((s) => ({ ...s, altMobiles: s.altMobiles.map((x, j) => (j === i ? v : x)) }));
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
      altMobiles: (p.altMobiles || []).map((x) => String(x).trim()).filter(Boolean),
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
      <Field label="Mobile No." value={p.mobile} onChangeText={set('mobile')} keyboardType="phone-pad" placeholder="Main number (WhatsApp)" />
      {(p.altMobiles || []).map((v, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <Field label={'Other number ' + (i + 1)} value={v} onChangeText={setAlt(i)} keyboardType="phone-pad" placeholder="Family member, relative…" />
          <RemoveBtn onPress={() => setP((s) => ({ ...s, altMobiles: s.altMobiles.filter((_, j) => j !== i) }))} />
        </View>
      ))}
      {(p.altMobiles || []).length < 4 ? (
        <LinkBtn onPress={() => setP((s) => ({ ...s, altMobiles: [...(s.altMobiles || []), ''] }))}>+ Add another number</LinkBtn>
      ) : null}
      <Field label="Aadhaar No." value={p.aadhaar} onChangeText={set('aadhaar')} keyboardType="number-pad" />
      {known ? (
        <View style={{ backgroundColor: c.plumBg, borderRadius: 14, padding: 12, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="person-circle-outline" size={20} color={c.accent} />
            <T size={13.5} weight="800" color={c.plum} style={{ flex: 1 }}>
              Repeat customer: {known.customerName} · {known.bookings.length} booking{known.bookings.length === 1 ? '' : 's'}, last {dmy(known.last)}
            </T>
          </View>
          {canFill ? <Btn variant="secondary" title="Fill in their details" onPress={fillFromKnown} /> : null}
        </View>
      ) : null}
      <Field label="PAN (optional)" value={p.pan} onChangeText={set('pan')} autoCapitalize="characters" />

      <FSec>Programme</FSec>
      <DateField label="Programme date" required value={p.bookingDate} onChange={onDate} />
      {day ? <T size={13} weight="700" color={c.accent} style={{ marginTop: -8 }}>{day}</T> : null}
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Day / Night</T>
        <Chips options={opts([['Night', 'Night' + (slots.Night.length ? ' · booked' : '')], ['Day', 'Day' + (slots.Day.length ? ' · booked' : '')]])} value={p.shift} onChange={set('shift')} />
        {p.bookingDate ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['Day', 'Night'].map((k) => (
              <View key={k} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: slots[k].length ? c.warnBg : c.goodBg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 }}>
                <Icon name={k === 'Day' ? 'sunny-outline' : 'moon-outline'} size={15} color={slots[k].length ? c.warn : c.good} />
                <T size={12.5} weight="700" color={slots[k].length ? c.warn : c.good} numberOfLines={1} style={{ flex: 1 }}>{k}: {slotText(k)}</T>
              </View>
            ))}
          </View>
        ) : null}
        {p.bookingDate && !slots.Day.length !== !slots.Night.length ? (
          <T muted size={12.5}>One programme in the day and one at night on the same date is fine.</T>
        ) : null}
      </View>
      {clashes.length ? (
        <View style={{ backgroundColor: c.badBg, borderRadius: 14, padding: 12, gap: 6 }} accessibilityRole="alert">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="warning" size={18} color={c.bad} />
            <T size={13.5} weight="800" color={c.bad} style={{ flex: 1 }}>
              Already booked on {dmy(p.bookingDate)}{p.shift ? ' (' + p.shift + ')' : ''}
            </T>
          </View>
          {clashes.map((x) => (
            <T key={x.id} size={13} color={c.bad}>• Sl. No. {x.serial}: {x.customerName}{x.from ? ', ' + x.from : ''}{x.shift ? ' · ' + x.shift : ''}</T>
          ))}
          <T size={12.5} color={c.bad}>You can still save. Make sure you have enough equipment and staff for both.</T>
        </View>
      ) : null}
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
