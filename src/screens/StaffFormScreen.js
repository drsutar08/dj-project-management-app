import React, { useLayoutEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Screen, Field, DateField, FRow, FSec, Chips, opts, Btn, ConfirmBtn, T, toast } from '../components/ui';
import { useStore } from '../store';
import { PAYTYPES } from '../defaults';
import { n, today } from '../utils';

export default function StaffFormScreen({ navigation, route }) {
  const { employees, settings, saveEmployee, deleteEmployee } = useStore();
  const existing = route.params?.id ? employees.find((e) => e.id === route.params.id) : null;
  const [e, setE] = useState(
    existing
      ? { ...existing, rate: existing.rate ? String(existing.rate) : '' }
      : { name: '', role: '', phone: '', payType: 'Per event', rate: '', bank: '', aadhaar: '', joined: today(), address: '', active: true, notes: '' }
  );
  const set = (k) => (v) => setE((s) => ({ ...s, [k]: v }));

  useLayoutEffect(() => navigation.setOptions({ title: existing ? 'Edit staff' : 'Add staff' }), [navigation, existing]);

  const onSave = () => {
    if (!e.name.trim()) return Alert.alert('Name needed', 'Enter the staff member’s name.');
    const id = saveEmployee({ ...e, name: e.name.trim(), rate: n(e.rate) });
    toast(existing ? 'Staff updated' : 'Staff added');
    if (existing) navigation.goBack();
    else navigation.replace('StaffMember', { id });
  };

  return (
    <Screen>
      <Field label="Full name" required value={e.name} onChangeText={set('name')} autoCapitalize="words" />
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Role</T>
        <Chips scroll options={opts(settings.roles)} value={e.role} onChange={set('role')} />
      </View>
      <Field label="Mobile" value={e.phone} onChangeText={set('phone')} keyboardType="phone-pad" />

      <FSec>Pay details</FSec>
      <Chips options={opts(PAYTYPES)} value={e.payType} onChange={set('payType')} />
      <Field label="Rate (₹)" value={e.rate} onChangeText={set('rate')} keyboardType="decimal-pad" />
      <Field label="UPI ID or bank account" value={e.bank} onChangeText={set('bank')} placeholder="name@upi / A/c & IFSC" autoCapitalize="none" />

      <FSec>Other details</FSec>
      <FRow>
        <Field label="Aadhaar No." value={e.aadhaar} onChangeText={set('aadhaar')} keyboardType="number-pad" />
        <DateField label="Joined" value={e.joined} onChange={set('joined')} />
      </FRow>
      <Field label="Address" value={e.address} onChangeText={set('address')} />
      <Chips options={opts([[true, 'Working'], [false, 'Inactive']])} value={e.active !== false} onChange={set('active')} />
      <Field label="Notes" value={e.notes} onChangeText={set('notes')} multiline />

      <Btn title={existing ? 'Save changes' : 'Add staff'} onPress={onSave} />
      {existing ? (
        <ConfirmBtn
          title="Remove staff member"
          confirmTitle="Tap again to remove"
          onConfirm={() => {
            deleteEmployee(existing.id);
            toast('Staff removed');
            navigation.popToTop();
          }}
        />
      ) : null}
    </Screen>
  );
}
