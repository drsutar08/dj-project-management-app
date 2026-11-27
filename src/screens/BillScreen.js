import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Screen, Btn, BtnRow, Empty, T, Icon } from '../components/ui';
import QrCode from '../components/QrCode';
import { printHtml, sharePdf, shareText } from '../share';
import { showUpi, upiLink } from '../upi';
import { useStore } from '../store';
import { billHTML, billText, billPalette, DOC } from '../bill';
import { aadhaarForBill, allMobiles, dayName, dmy, inr, n, projMoney, qtyLabel, setupLines, withUnit } from '../utils';

// The receipt is a paper document: it keeps the same white look in light and dark mode,
// and matches the PDF made by billHTML() in src/bill.js.

function Field({ label, value, wide }) {
  if (!value) return null;
  return (
    <View style={[s.field, wide && { flexBasis: '100%' }]}>
      <Text style={s.fieldL}>{label}</Text>
      <Text style={s.fieldV}>{value}</Text>
    </View>
  );
}

function AmountRow({ label, value, minus, strong }) {
  return (
    <View style={[s.amt, strong && s.amtStrong]}>
      <Text style={[s.amtL, strong && { fontWeight: '800', color: DOC.ink }]}>{label}</Text>
      <Text style={[s.amtV, strong && { fontWeight: '800' }, minus && { color: DOC.good }]}>{(minus ? '− ' : '') + inr(value)}</Text>
    </View>
  );
}

function BillPreview({ p, settings, ledger, onAddUpi }) {
  const m = projMoney(p, ledger);
  const fin = p.status === 'final';
  const setup = setupLines(p, settings);
  const sound = setup.sound.filter((l) => l.qty);
  const fx = setup.fx;
  const day = dayName(p.bookingDate);
  const received = m.paid - n(p.advance);
  const time = ([p.startTime, p.endTime].filter(Boolean).join(' – ') + (p.shift ? ` (${p.shift})` : '')).trim();
  const route = [p.from, p.to].filter(Boolean).join(' → ');
  const paid = m.balance <= 0;
  const D = billPalette(settings); // the receipt colour chosen in Settings
  const sec = [s.section, { color: D.accent }];

  return (
    <View style={[s.bill, { borderColor: D.line }]}>
      {/* Business band */}
      <View style={[s.band, { backgroundColor: D.deep }]}>
        <View style={[s.bandCircle, { backgroundColor: D.accent }]} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.brand}>{settings.name || 'Your business'}</Text>
            {settings.tagline ? <Text style={s.tagline}>{settings.tagline}</Text> : null}
            {settings.regNo ? <Text style={s.regNo}>Regd. No. {settings.regNo}</Text> : null}
          </View>
          <Text style={[s.docType, { color: D.deep }]}>{fin ? 'FINAL BILL' : 'ORDER RECEIPT'}</Text>
        </View>
        {settings.phones ? (
          <View style={s.contactRow}><Icon name="call" size={13} color="rgba(255,255,255,0.88)" /><Text style={s.contact}>{settings.phones}</Text></View>
        ) : null}
        {settings.address ? (
          <View style={s.contactRow}><Icon name="location" size={13} color="rgba(255,255,255,0.88)" /><Text style={s.contact}>{settings.address}</Text></View>
        ) : null}
      </View>

      {/* Number and date */}
      <View style={[s.metaRow, { backgroundColor: D.tint, borderBottomColor: D.line }]}>
        <View>
          <Text style={s.metaL}>{fin ? 'Bill No.' : 'Sl. No.'}</Text>
          <Text style={s.metaV}>{fin ? p.billNo || p.serial : p.serial}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.metaL}>Date</Text>
          <Text style={s.metaV}>{dmy(fin ? p.billDate : p.receiptDate) || '—'}</Text>
        </View>
      </View>

      <View style={s.body}>
        {/* Customer & programme */}
        <Text style={sec}>BOOKING DETAILS</Text>
        <View style={s.grid}>
          <Field label="Name" value={p.customerName} />
          <Field label="Age" value={p.age ? String(p.age) : ''} />
          <Field label="Father’s name" value={p.fatherName} />
          <Field label="Mobile" value={allMobiles(p).join(', ')} />
          <Field label="Address" value={p.address} wide />
          <Field label="Programme date" value={[dmy(p.bookingDate), day].filter(Boolean).join(', ')} />
          <Field label="Time" value={time} />
          <Field label="Programme" value={[p.segment, p.eventType].filter(Boolean).join(' · ')} />
          <Field label="Type" value={p.programmeType} />
          <Field label="From → To" value={route} wide />
          <Field label="Aadhaar No." value={aadhaarForBill(p.aadhaar, settings)} />
          <Field label="PAN" value={p.pan} />
        </View>

        {/* Amounts */}
        <Text style={sec}>PAYMENT</Text>
        <View style={[s.amtBox, { borderColor: D.line }]}>
          <AmountRow label="Package amount" value={m.total} />
          {(p.extras || []).map((x, i) => <AmountRow key={i} label={x.label} value={x.amount} />)}
          {m.disc ? <AmountRow label="Discount" value={m.disc} minus /> : null}
          {(p.extras || []).length || m.disc ? <AmountRow label="Net amount" value={m.net} strong /> : null}
          <AmountRow label="Advance" value={p.advance} minus />
          {received > 0 ? <AmountRow label="Received" value={received} minus /> : null}
        </View>
        <View style={[s.balance, { backgroundColor: paid ? DOC.goodBg : D.accent }]}>
          <Text style={[s.balanceL, paid && { color: DOC.good }]}>{paid ? 'PAID IN FULL' : 'BALANCE DUE'}</Text>
          <Text style={[s.balanceV, paid && { color: DOC.good }]}>{inr(Math.max(0, m.balance))}</Text>
        </View>

        {/* Scan to pay the balance by UPI */}
        {showUpi(settings, m.balance) ? (
          <View style={[s.upi, { borderColor: D.line, backgroundColor: D.tint }]}>
            <QrCode value={upiLink(settings, m.balance, 'Sl ' + p.serial + ' ' + (p.customerName || ''))} size={116} />
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={[s.upiH, { color: D.deep }]}>Scan to pay {inr(m.balance)}</Text>
              <Text style={s.upiT}>Any UPI app: GPay, PhonePe, Paytm, BHIM</Text>
              <Text style={s.upiId} selectable>{settings.upiId}</Text>
              {settings.upiName ? <Text style={s.upiT}>{settings.upiName}</Text> : null}
            </View>
          </View>
        ) : m.balance > 0 && onAddUpi ? (
          // Only on screen (never in the PDF): explain why there is no QR code yet.
          <Pressable onPress={onAddUpi} accessibilityRole="button" style={({ pressed }) => [s.upiHint, { borderColor: D.accent, opacity: pressed ? 0.75 : 1 }]}>
            <Icon name="qr-code-outline" size={30} color={D.accent} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={[s.upiH, { color: D.deep, fontSize: 14 }]}>Add a UPI QR code to this bill</Text>
              <Text style={s.upiT}>
                {settings.upiId ? '“' + settings.upiId + '” doesn’t look like a UPI ID. Fix it in Settings.' : 'Save your UPI ID in Settings → Business details. Customers can then scan and pay ' + inr(m.balance) + '.'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={D.accent} />
          </Pressable>
        ) : null}

        {/* Description: sound setup and effects, with how many of each */}
        {sound.length || fx.length ? (
          <>
            <Text style={sec}>DESCRIPTION</Text>
            <View style={[s.desc, { borderColor: D.line }]}>
              {[['Sound setup', sound], ['Effects', fx]].map(([title, list]) =>
                list.length ? (
                  <View key={title} style={{ gap: 6 }}>
                    <Text style={s.descH}>{title}</Text>
                    <View style={s.descGrid}>
                      {list.map(({ name, qty, unit }) => (
                        <View key={name} style={s.descCell}>
                          <Icon name={qty ? 'checkmark-circle' : 'close-circle-outline'} size={15} color={qty ? D.accent : '#b9b6cc'} />
                          <Text style={[s.descName, !qty && { color: DOC.muted }]} numberOfLines={2}>{withUnit(name, unit)}</Text>
                          <Text style={[s.descQty, { color: D.accent }, !qty && { color: '#b9b6cc' }]}>{qty ? qtyLabel(qty) : '—'}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null
              )}
            </View>
          </>
        ) : null}

        {/* Rules */}
        {settings.rulesTitle || (settings.rules || []).length ? (
          <View style={[s.rules, { backgroundColor: D.tint }]}>
            {settings.rulesTitle ? <Text style={[s.rulesH, { color: D.deep }]}>{settings.rulesTitle}</Text> : null}
            {(settings.rules || []).map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={[s.ruleN, { color: D.accent }]}>{i + 1}.</Text>
                <Text style={s.rule}>{r}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Signatures */}
        <View style={s.sig}>
          <View style={s.sigBox}>
            <View style={s.sigTop}><Text style={[s.sigName, { color: D.deep }]} numberOfLines={1}>{p.customerName || ' '}</Text></View>
            <Text style={s.sigT}>Customer signature</Text>
          </View>
          <View style={s.sigBox}>
            <View style={s.sigTop}>
              {settings.signature ? (
                <Image source={{ uri: settings.signature }} style={s.sigImg} resizeMode="contain" accessibilityLabel="Authorised signature" />
              ) : null}
            </View>
            <Text style={s.sigT}>{settings.signTitle || 'Authorised signature'}</Text>
            {settings.signName ? <Text style={s.sigWho}>{settings.signName}</Text> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function BillScreen({ navigation, route }) {
  const { projects, settings, ledger } = useStore();
  const p = projects.find((x) => x.id === route.params.id);
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    if (p) navigation.setOptions({ title: p.status === 'final' ? 'Bill No. ' + (p.billNo || p.serial) : 'Receipt preview' });
  }, [navigation, p]);

  if (!p) return <Screen><Empty title="Bill not found" /></Screen>;

  const html = () => billHTML(p, settings, ledger);
  const onPdf = async () => { setBusy(true); await sharePdf(html()); setBusy(false); };

  return (
    <Screen>
      <BillPreview p={p} settings={settings} ledger={ledger} onAddUpi={() => navigation.navigate('Settings')} />
      <Btn title={busy ? 'Making PDF…' : 'Share bill as PDF'} onPress={onPdf} disabled={busy} />
      <BtnRow>
        <Btn variant="secondary" title="Print" onPress={() => printHtml(html())} />
        <Btn variant="secondary" title="Send as text" onPress={() => shareText(billText(p, settings, ledger))} />
      </BtnRow>
      <T muted size={12.5}>The PDF looks the same as this preview. Send it on WhatsApp or save it to your phone.</T>
    </Screen>
  );
}

const s = StyleSheet.create({
  bill: { backgroundColor: DOC.paper, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: DOC.line, shadowColor: '#2a1d7a', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  band: { backgroundColor: DOC.accentDeep, padding: 18, gap: 4, overflow: 'hidden' },
  bandCircle: { position: 'absolute', width: 180, height: 180, borderRadius: 90, right: -60, top: -80, backgroundColor: DOC.accent, opacity: 0.55 },
  brand: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
  tagline: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 1 },
  docType: { color: DOC.accentDeep, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, overflow: 'hidden' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  contact: { flex: 1, color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: DOC.tint, paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: DOC.line },
  metaL: { color: DOC.muted, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  metaV: { color: DOC.ink, fontSize: 16, fontWeight: '800', marginTop: 1 },
  body: { padding: 18, gap: 10 },
  regNo: { color: 'rgba(255,255,255,0.75)', fontSize: 11.5, fontWeight: '700', marginTop: 3 },
  desc: { borderWidth: 1, borderColor: DOC.line, borderRadius: 14, padding: 12, gap: 12 },
  upi: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, padding: 12 },
  upiHint: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, padding: 12, backgroundColor: '#ffffff' },
  upiH: { fontSize: 15, fontWeight: '900' },
  upiT: { color: DOC.muted, fontSize: 12, fontWeight: '600' },
  upiId: { color: DOC.ink, fontSize: 13.5, fontWeight: '800', marginTop: 2 },
  descH: { color: DOC.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  descGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 14 },
  // Fixed half-width cells, so an odd last item stays in its column instead of stretching.
  descCell: { width: '46%', flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  descName: { flex: 1, color: DOC.ink, fontSize: 13, fontWeight: '700' },
  descQty: { color: DOC.accent, fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] },
  section: { color: DOC.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: 12 },
  field: { flexBasis: '46%', flexGrow: 1, minWidth: 0 },
  fieldL: { color: DOC.muted, fontSize: 11, fontWeight: '600' },
  fieldV: { color: DOC.ink, fontSize: 14, fontWeight: '700', marginTop: 1 },
  amtBox: { borderWidth: 1, borderColor: DOC.line, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  amt: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 10 },
  amtStrong: { borderTopWidth: 1, borderTopColor: DOC.line },
  amtL: { color: DOC.muted, fontSize: 13.5, fontWeight: '600', flexShrink: 1 },
  amtV: { color: DOC.ink, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  balance: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceL: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  balanceV: { color: '#fff', fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  chipOn: { backgroundColor: DOC.tint, borderWidth: 1, borderColor: DOC.accentSoft },
  chipOff: { backgroundColor: '#f4f4f7', borderWidth: 1, borderColor: '#f4f4f7' },
  chipT: { fontSize: 12, fontWeight: '800' },
  rules: { backgroundColor: DOC.tint, borderRadius: 14, padding: 12, gap: 4, marginTop: 6 },
  rulesH: { color: DOC.accentDeep, fontSize: 13, fontWeight: '800', marginBottom: 2 },
  ruleN: { color: DOC.accent, fontSize: 11.5, fontWeight: '800', lineHeight: 18 },
  rule: { flex: 1, color: DOC.ink, fontSize: 11.5, lineHeight: 18 },
  // Both columns get the same space above the line, so the two signature lines stay level.
  sig: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginTop: 18 },
  sigBox: { flex: 1, alignItems: 'center' },
  sigTop: { height: 58, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  sigImg: { width: '100%', height: 54, marginBottom: 2 },
  sigWho: { color: DOC.ink, fontSize: 11.5, fontWeight: '700', marginTop: 2 },
  sigName: { color: DOC.accentDeep, fontSize: 13, fontWeight: '700', fontStyle: 'italic', marginBottom: 4 },
  sigT: { alignSelf: 'stretch', textAlign: 'center', borderTopWidth: 1, borderTopColor: DOC.ink, paddingTop: 4, color: DOC.muted, fontSize: 11, fontWeight: '700' },
});
