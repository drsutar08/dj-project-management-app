import React, { useState } from 'react';
import { Share, View, Image, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Screen, Card, Field, FSec, Btn, BtnRow, ConfirmBtn, T, Icon, Chips, opts, toast } from '../components/ui';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { textToUnits, unitsToText } from '../utils';
import { BILL_COLORS, billPalette, isHexColor, normHex } from '../bill';

const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

// Signatures are stored inside the app data (and backups) as an image data URL, so keep them small.
const MAX_SIGNATURE_CHARS = 600000; // about 450 KB of image
const SIGNATURE_WIDTH = 900; // pixels: sharp on print, small to store

// Pick the colour of the receipt / bill (header band, titles, balance bar). Applies straight away.
function ReceiptColorCard() {
  const c = useTheme();
  const { settings, saveSettings } = useStore();
  const current = settings.billColor || 'purple';
  const isCustom = !BILL_COLORS.some((x) => x.key === current);
  const [code, setCode] = useState(isCustom ? current : '');
  const D = billPalette(settings);

  const choose = (v) => saveSettings({ billColor: v });
  const onCode = (v) => {
    setCode(v);
    if (isHexColor(v)) choose(normHex(v));
  };

  return (
    <Card style={{ gap: 12 }}>
      <T weight="800" size={17}>Receipt colour</T>
      <T muted size={13}>The colour of the bill’s header, titles and balance bar, on screen and in the PDF.</T>

      {/* Live preview of the header */}
      <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: D.line }}>
        <View style={{ backgroundColor: D.deep, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, right: -34, top: -50, backgroundColor: D.accent, opacity: 0.55 }} />
          <T color="#ffffff" weight="900" size={17} numberOfLines={1} style={{ flex: 1 }}>{settings.name || 'Your business'}</T>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 }}>
            <T color={D.deep} weight="900" size={9}>ORDER RECEIPT</T>
          </View>
        </View>
        <View style={{ backgroundColor: '#ffffff', padding: 12, gap: 8 }}>
          <T color={D.accent} weight="900" size={10} style={{ letterSpacing: 1 }}>BOOKING DETAILS</T>
          <View style={{ backgroundColor: D.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <T color="#ffffff" weight="900" size={11}>BALANCE DUE</T>
            <T color="#ffffff" weight="900" size={14}>₹9,000</T>
          </View>
        </View>
      </View>

      {/* Ready-made colours */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {BILL_COLORS.map((x) => {
          const on = current === x.key;
          return (
            <Pressable
              key={x.key}
              onPress={() => { setCode(''); choose(x.key); }}
              accessibilityRole="button"
              accessibilityLabel={x.label + ' receipt colour'}
              accessibilityState={{ selected: on }}
              style={{ alignItems: 'center', gap: 4, width: 62 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: x.deep, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: on ? c.fg : 'transparent' }}>
                <View style={{ position: 'absolute', width: 22, height: 22, borderRadius: 11, right: 2, top: 2, backgroundColor: x.accent, opacity: 0.9 }} />
                {on ? <Icon name="checkmark" size={20} color="#ffffff" /> : null}
              </View>
              <T size={11} weight={on ? '800' : '600'} color={on ? c.fg : c.muted} numberOfLines={1}>{x.label}</T>
            </Pressable>
          );
        })}
      </View>

      <Field
        label="Or your own colour code (like #0a7d3c)"
        value={code}
        onChangeText={onCode}
        placeholder="#0a7d3c"
        autoCapitalize="none"
      />
      {code && !isHexColor(code) ? <T size={12} color={c.bad}>Write 6 letters or numbers after #, like #0a7d3c.</T> : null}
      {isCustom && isHexColor(code) ? <T muted size={12}>Very light colours are made darker so the white text on the bill stays easy to read.</T> : null}
    </Card>
  );
}

// Upload, preview and remove the authorised signature printed on every receipt and bill.
function SignatureCard() {
  const c = useTheme();
  const { settings, saveSettings } = useStore();
  const [name, setName] = useState(settings.signName || '');
  const [title, setTitle] = useState(settings.signTitle || '');
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    setBusy(true);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 1 });
      if (res.canceled || !res.assets || !res.assets[0]) return;
      const a = res.assets[0];
      // Phone photos are several MB. Shrink to signature size and compress, so any normal photo works.
      // (In a browser the picker ignores crop and quality, so this step does the work there too.)
      const resize = a.width && a.width > SIGNATURE_WIDTH ? [{ resize: { width: SIGNATURE_WIDTH } }] : [];
      const out = await manipulateAsync(a.uri, resize, { compress: 0.7, format: SaveFormat.JPEG, base64: true });
      const uri = out.base64 ? `data:image/jpeg;base64,${out.base64}` : out.uri;
      if (!String(uri).startsWith('data:image/')) return toast('That file could not be read as a picture. Try a PNG or JPG.');
      if (uri.length > MAX_SIGNATURE_CHARS) return toast('That picture is still too large. Crop it closer to the signature.');
      saveSettings({ signature: uri });
      toast('Signature saved. It will appear on every receipt.');
    } catch (e) {
      toast('Couldn’t read that picture. Try another photo, or a PNG or JPG file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ gap: 12 }}>
      <T weight="800" size={17}>Authorised signature</T>
      <T muted size={13}>Sign on white paper with a dark pen, take a photo, and crop it close to the signature. It prints above “Authorised signature” on every receipt and bill.</T>
      <Pressable
        onPress={pick}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={settings.signature ? 'Change signature' : 'Upload signature'}
        style={({ pressed }) => ({ height: 120, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.accent2, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', padding: 10, opacity: pressed ? 0.75 : 1 })}
      >
        {settings.signature ? (
          <Image source={{ uri: settings.signature }} style={{ width: '100%', height: '100%' }} resizeMode="contain" accessibilityLabel="Your signature" />
        ) : (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Icon name="cloud-upload-outline" size={30} color={c.accent} />
            <T size={13} weight="700" color="#6d698d">Tap to upload your signature</T>
            <T size={11.5} color="#8b88a6">Any photo or PNG / JPG. It is resized for you.</T>
          </View>
        )}
      </Pressable>
      <BtnRow>
        <Btn title={busy ? 'Opening photos…' : settings.signature ? 'Change signature' : 'Upload signature'} onPress={pick} disabled={busy} />
        {settings.signature ? (
          <ConfirmBtn title="Remove" confirmTitle="Tap again to remove" onConfirm={() => { saveSettings({ signature: '' }); toast('Signature removed'); }} />
        ) : null}
      </BtnRow>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Title printed under the line</T>
        <Chips
          options={opts([['', 'Authorised signature'], ['Proprietor', 'Proprietor'], ['Manager', 'Manager']])}
          value={title}
          onChange={(v) => { setTitle(v); saveSettings({ signTitle: v }); }}
        />
      </View>
      <Field
        label="Name under the signature (optional)"
        value={name}
        onChangeText={(v) => { setName(v); saveSettings({ signName: v.trim() }); }}
        placeholder="Owner or manager name"
        autoCapitalize="words"
      />
    </Card>
  );
}

export default function SettingsScreen({ navigation }) {
  const { settings, saveSettings, exportData, importData } = useStore();
  const [f, setF] = useState({
    ...settings,
    services: settings.services.join('\n'),
    soundSetup: (settings.soundSetup || []).join('\n'),
    itemUnits: unitsToText(settings.itemUnits),
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
      name: f.name.trim(), tagline: f.tagline.trim(), regNo: String(f.regNo || '').trim(), phones: f.phones.trim(), address: f.address.trim(),
      soundSetup: lines(f.soundSetup),
      itemUnits: textToUnits(f.itemUnits),
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
        <Field label="Regd. No. (optional)" value={f.regNo} onChangeText={set('regNo')} placeholder="Registration number printed on the bill" />
        <Field label="Mobile numbers" value={f.phones} onChangeText={set('phones')} />
        <Field label="Address" value={f.address} onChangeText={set('address')} multiline />
        <FSec>Lists (one per line)</FSec>
        <Field label="Sound setup items" value={f.soundSetup} onChangeText={set('soundSetup')} multiline />
        <Field label="Effects on the bill" value={f.services} onChangeText={set('services')} multiline />
        <Field label="Units (one per line, like Paper Spray = Kg)" value={f.itemUnits} onChangeText={set('itemUnits')} multiline placeholder={'Paper Spray = Kg\nCO₂ = Cylinder'} />
        <Field label="Business segments" value={f.segments} onChangeText={set('segments')} multiline />
        <Field label="Staff roles" value={f.roles} onChangeText={set('roles')} multiline />
        <Field label="Stock categories" value={f.invCategories} onChangeText={set('invCategories')} multiline />
        <Field label="Expense types" value={f.expenseCategories} onChangeText={set('expenseCategories')} multiline />
        <FSec>Bill rules</FSec>
        <Field label="Rules heading" value={f.rulesTitle} onChangeText={set('rulesTitle')} />
        <Field label="Rules printed on the bill (one per line)" value={f.rules} onChangeText={set('rules')} multiline />
        <Btn title="Save business details" onPress={onSave} />
      </Card>

      <ReceiptColorCard />

      <SignatureCard />

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
