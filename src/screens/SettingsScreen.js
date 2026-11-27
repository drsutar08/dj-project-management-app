import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { Screen, Card, Field, FSec, Btn, T, Chips, opts, toast } from '../components/ui';
import { useStore } from '../store';

const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

export default function SettingsScreen({ navigation }) {
  const { settings, saveSettings, exportData, importData } = useStore();
  const [f, setF] = useState({
    ...settings,
    services: settings.services.join('\n'),
    segments: settings.segments.join('\n'),
    roles: settings.roles.join('\n'),
    invCategories: (settings.invCategories || []).join('\n'),
    expenseCategories: (settings.expenseCategories || []).join('\n'),
    rules: (settings.rules || []).join('\n'),
  });
  const [backup, setBackup] = useState('');
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const onSave = () => {
    saveSettings({
      name: f.name.trim(), tagline: f.tagline.trim(), phones: f.phones.trim(), address: f.address.trim(),
      services: lines(f.services), segments: lines(f.segments), roles: lines(f.roles), invCategories: lines(f.invCategories), expenseCategories: lines(f.expenseCategories),
      rulesTitle: f.rulesTitle.trim(), rules: lines(f.rules),
    });
    toast('Business details saved');
    navigation.goBack();
  };

  return (
    <Screen>
      <Card style={{ gap: 10 }}>
        <T weight="800" size={17}>Appearance</T>
        <Chips
          options={opts([['light', 'Light'], ['dark', 'Dark'], ['system', 'Follow phone']])}
          value={settings.theme || 'light'}
          onChange={(v) => saveSettings({ theme: v })}
        />
      </Card>

      <Card style={{ gap: 14 }}>
        <Field label="Business name" value={f.name} onChangeText={set('name')} />
        <Field label="Tagline" value={f.tagline} onChangeText={set('tagline')} />
        <Field label="Mobile numbers" value={f.phones} onChangeText={set('phones')} />
        <Field label="Address" value={f.address} onChangeText={set('address')} multiline />
        <FSec>Lists (one per line)</FSec>
        <Field label="Effects / services on the bill" value={f.services} onChangeText={set('services')} multiline />
        <Field label="Business segments" value={f.segments} onChangeText={set('segments')} multiline />
        <Field label="Staff roles" value={f.roles} onChangeText={set('roles')} multiline />
        <Field label="Stock categories" value={f.invCategories} onChangeText={set('invCategories')} multiline />
        <Field label="Expense types" value={f.expenseCategories} onChangeText={set('expenseCategories')} multiline />
        <FSec>Bill rules</FSec>
        <Field label="Rules heading" value={f.rulesTitle} onChangeText={set('rulesTitle')} />
        <Field label="Rules printed on the bill (one per line)" value={f.rules} onChangeText={set('rules')} multiline />
        <Btn title="Save business details" onPress={onSave} />
      </Card>

      <Card style={{ gap: 12 }}>
        <T weight="800" size={17}>Backup</T>
        <T muted size={13}>Your records are saved only on this phone. Send a backup to yourself on WhatsApp or email now and then, so nothing is lost if the phone is changed.</T>
        <Btn variant="secondary" title="Send backup" onPress={() => Share.share({ message: exportData() }).catch(() => {})} />
        <Field label="Restore: paste a backup here" value={backup} onChangeText={setBackup} multiline />
        <Btn
          variant="danger"
          title="Restore from pasted backup"
          onPress={() => {
            try {
              importData(backup);
              setBackup('');
              toast('Backup restored');
            } catch (e) {
              toast(e.message || 'That backup couldn’t be read.');
            }
          }}
        />
      </Card>
    </Screen>
  );
}
