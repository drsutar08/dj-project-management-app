import React, { useState } from 'react';
import { Share, View, Image, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Screen, Card, Field, FSec, Btn, BtnRow, ConfirmBtn, T, Icon, Chips, opts, toast } from '../components/ui';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { textToUnits, unitsToText } from '../utils';
import { BILL_COLORS, billPalette, isHexColor, normHex } from '../bill';
import { bioAvailable, hashPin, PIN_LENGTH } from '../lock';
import { isUpiId } from '../upi';
import { LANGS } from '../i18n';
import { askPermission, DEFAULT_REMIND_AT, notificationsSupported } from '../reminders';

const REMIND_TIMES = [['17:00', '5 PM'], ['18:00', '6 PM'], ['19:00', '7 PM'], ['20:00', '8 PM'], ['21:00', '9 PM']];

// Phone notifications for programmes and balances.
function RemindersCard() {
  const c = useTheme();
  const { settings, saveSettings } = useStore();
  const on = !!settings.remindersOn;
  const toggle = async (v) => {
    if (v && !(await askPermission())) return toast('Allow notifications for this app in your phone settings.');
    saveSettings({ remindersOn: v });
    toast(v ? 'Reminders on' : 'Reminders off');
  };
  return (
    <Card style={{ gap: 12 }}>
      <T weight="800" size={17}>Reminders</T>
      <T muted size={13}>The evening before each programme, the phone reminds you who, when and where. The morning after, it reminds you if the customer still owes money.</T>
      {notificationsSupported ? (
        <>
          <Chips options={opts([[false, 'Off'], [true, 'On']])} value={on} onChange={toggle} />
          {on ? (
            <>
              <T muted size={12.5} weight="700">Remind me the evening before at</T>
              <Chips options={opts(REMIND_TIMES)} value={settings.remindAt || DEFAULT_REMIND_AT} onChange={(v) => saveSettings({ remindAt: v })} />
              <T muted size={12.5} weight="700">Balance reminder the morning after</T>
              <Chips options={opts([[true, 'On'], [false, 'Off']])} value={settings.remindBalance !== false} onChange={(v) => saveSettings({ remindBalance: v })} />
            </>
          ) : null}
        </>
      ) : (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: c.surface2, borderRadius: 12, padding: 12 }}>
          <Icon name="phone-portrait-outline" size={18} color={c.muted} />
          <T muted size={12.5} style={{ flex: 1 }}>Phone notifications work in the phone app. Here, today’s and tomorrow’s programmes and balances due are shown on the Home screen.</T>
        </View>
      )}
    </Card>
  );
}

// App lock (PIN, fingerprint) and how much of the Aadhaar number prints on bills.
function PrivacyCard() {
  const c = useTheme();
  const { settings, saveSettings } = useStore();
  const on = !!settings.lockPin;
  const [mode, setMode] = useState(''); // '' | 'set' | 'off'
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [cur, setCur] = useState('');
  const [bio, setBio] = useState(false);
  React.useEffect(() => { bioAvailable().then(setBio); }, []);
  const reset = () => { setMode(''); setA(''); setB(''); setCur(''); };
  const okPin = (v) => new RegExp('^\\d{' + PIN_LENGTH + '}$').test(v);

  const savePin = async () => {
    if (on && (await hashPin(cur)) !== settings.lockPin) return toast('Current PIN is wrong.');
    if (!okPin(a)) return toast('Enter ' + PIN_LENGTH + ' digits.');
    if (a !== b) return toast('The two PINs don’t match.');
    saveSettings({ lockPin: await hashPin(a) });
    reset();
    toast(on ? 'PIN changed' : 'App lock is on');
  };
  const turnOff = async () => {
    if ((await hashPin(cur)) !== settings.lockPin) return toast('Current PIN is wrong.');
    saveSettings({ lockPin: '', lockBio: false });
    reset();
    toast('App lock is off');
  };

  return (
    <Card style={{ gap: 12 }}>
      <T weight="800" size={17}>Privacy & app lock</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: on ? c.goodBg : c.surface2, borderRadius: 14, padding: 12 }}>
        <Icon name={on ? 'lock-closed' : 'lock-open-outline'} size={20} color={on ? c.good : c.muted} />
        <T weight="700" color={on ? c.good : c.muted} style={{ flex: 1 }}>
          {on ? 'App lock is on. The app asks for the PIN when it opens, and after a minute away.' : 'App lock is off. Anyone with this phone can open the app.'}
        </T>
      </View>
      {mode ? (
        <View style={{ gap: 10 }}>
          {on ? <Field label="Current PIN" value={cur} onChangeText={setCur} keyboardType="number-pad" secureTextEntry maxLength={PIN_LENGTH} /> : null}
          {mode === 'set' ? (
            <FRowLike>
              <Field label={'New ' + PIN_LENGTH + '-digit PIN'} value={a} onChangeText={setA} keyboardType="number-pad" secureTextEntry maxLength={PIN_LENGTH} />
              <Field label="Repeat PIN" value={b} onChangeText={setB} keyboardType="number-pad" secureTextEntry maxLength={PIN_LENGTH} />
            </FRowLike>
          ) : null}
          <BtnRow>
            {mode === 'set' ? <Btn title={on ? 'Save new PIN' : 'Turn on app lock'} onPress={savePin} /> : <Btn variant="danger" title="Turn off app lock" onPress={turnOff} />}
            <Btn variant="secondary" title="Cancel" onPress={reset} />
          </BtnRow>
          {mode === 'set' ? <T muted size={12.5}>If you forget the PIN, the app can’t be opened without clearing its data. Keep a backup (below) and remember the PIN.</T> : null}
        </View>
      ) : (
        <BtnRow>
          <Btn variant={on ? 'secondary' : 'primary'} title={on ? 'Change PIN' : 'Set a PIN'} onPress={() => setMode('set')} />
          {on ? <Btn variant="danger" title="Turn off" onPress={() => setMode('off')} /> : null}
        </BtnRow>
      )}
      {on && bio ? (
        <View style={{ gap: 8 }}>
          <T muted size={12.5} weight="700">Fingerprint / face unlock</T>
          <Chips options={opts([[false, 'PIN only'], [true, 'Allow fingerprint']])} value={!!settings.lockBio} onChange={(v) => saveSettings({ lockBio: v })} />
        </View>
      ) : null}
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Aadhaar number on bills and receipts</T>
        <Chips options={opts([[false, 'Full number'], [true, 'Last 4 digits only']])} value={!!settings.maskAadhaar} onChange={(v) => saveSettings({ maskAadhaar: v })} />
      </View>
    </Card>
  );
}
const FRowLike = ({ children }) => <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>;

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
    if (String(f.upiId || '').trim() && !isUpiId(f.upiId)) return toast('UPI ID should look like name@bank, for example regalmusic@okaxis.');
    saveSettings({
      name: f.name.trim(), tagline: f.tagline.trim(), regNo: String(f.regNo || '').trim(), phones: f.phones.trim(), address: f.address.trim(),
      upiId: String(f.upiId || '').trim(), upiName: String(f.upiName || '').trim(),
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
        <T muted size={12.5} weight="700">Language</T>
        <Chips options={opts(LANGS)} value={settings.lang || 'en'} onChange={(v) => saveSettings({ lang: v })} />
        <T muted size={12}>Screens, buttons and messages change language. Bills and receipts stay in English, with your own rules as written.</T>
      </Card>

      <Card style={{ gap: 14 }}>
        <Field label="Business name" value={f.name} onChangeText={set('name')} />
        <Field label="Tagline" value={f.tagline} onChangeText={set('tagline')} />
        <Field label="Regd. No. (optional)" value={f.regNo} onChangeText={set('regNo')} placeholder="Registration number printed on the bill" />
        <Field label="Mobile numbers" value={f.phones} onChangeText={set('phones')} />
        <Field label="Address" value={f.address} onChangeText={set('address')} multiline />
        <FSec>UPI payment (QR on the bill)</FSec>
        <Field label="UPI ID" value={f.upiId} onChangeText={set('upiId')} placeholder="yourname@okaxis" autoCapitalize="none" />
        <Field label="Name shown in the UPI app (optional)" value={f.upiName} onChangeText={set('upiName')} placeholder="Same as business name" />
        <T muted size={12.5}>When set, every bill with a balance due shows a QR code. The customer scans it with any UPI app and the amount is filled in.</T>
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

      <RemindersCard />

      <PrivacyCard />

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
