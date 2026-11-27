import React, { useLayoutEffect, useState } from 'react';
import { View, Text, Share, StyleSheet } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Screen, Btn, BtnRow, Empty, T, toast } from '../components/ui';
import { useStore } from '../store';
import { billHTML, billText } from '../bill';
import { dmy, group, n, projMoney } from '../utils';

const B = { blue: '#1a72b8', red: '#d2452b', orange: '#e2672a', purple: '#6a3d9a', yellow: '#fdf08a', hand: '#1b2b8a' };
const rs = (v) => 'Rs. ' + group(n(v)) + '/-';

function Line({ a, b, c, d }) {
  return (
    <View style={s.ln}>
      <Text style={s.lnB}>{a} </Text>
      <Text style={[s.hand, { flex: 1 }]} numberOfLines={1}>{b || ''}</Text>
      {c ? <><Text style={s.lnB}> {c} </Text><Text style={s.hand}>{d || ''}</Text></> : null}
    </View>
  );
}

function Cell({ l, v, center }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <Text style={[s.td, { flex: 1, color: B.red, fontSize: 11 }]}>{l}</Text>
      <Text style={[s.td, { color: B.hand, textAlign: center ? 'center' : 'left', width: center ? 34 : undefined }]}>{v}</Text>
    </View>
  );
}

// On-screen copy of the paper receipt layout.
function BillPreview({ p, settings, ledger }) {
  const m = projMoney(p, ledger);
  const fin = p.status === 'final';
  const svcs = settings.services.concat((p.services || []).filter((x) => !settings.services.includes(x)));
  const cols = [B.orange, B.red, B.blue, B.orange, B.blue, B.purple, B.red, B.blue, B.purple, B.orange];
  let ci = 0;
  return (
    <View style={s.bill}>
      <Text style={s.tag}>{fin ? 'FINAL BILL' : 'ORDER RECEIPT'}</Text>
      <Text style={s.brand}>
        {[...String(settings.name).toUpperCase()].map((ch, i) => (
          <Text key={i} style={{ color: ch === ' ' ? B.blue : cols[ci++ % cols.length] }}>{ch}</Text>
        ))}
      </Text>
      <Text style={s.tagline}>{String(settings.tagline).toUpperCase()}</Text>
      <Text style={s.contact}>Mob: {settings.phones}</Text>
      <Text style={s.addr}>{String(settings.address).toUpperCase()}</Text>
      <View style={s.meta}>
        <Text style={s.metaT}>{fin ? 'Bill No. ' : 'Sl. No. '}<Text style={s.hand}>{fin ? p.billNo || p.serial : p.serial}</Text></Text>
        <Text style={s.metaT}>Date <Text style={s.hand}>{dmy(fin ? p.billDate : p.receiptDate)}</Text></Text>
      </View>
      <View style={s.box}>
        <Text style={s.lbl}>BOOKING DETAILS</Text>
        <Line a="Name" b={p.customerName} />
        <Line a="Father’s Name" b={p.fatherName} />
        <Line a="Mob No." b={p.mobile} c="Booking Dt." d={dmy(p.bookingDate)} />
        <Line a="Address" b={p.from} c="To" d={p.to} />
        <Line a="Aadhaar No." b={p.aadhaar} c="Pan" d={p.pan} />
        <Line a="Start Time" b={p.startTime} c="End Time" d={(p.endTime || '') + (p.shift ? ' (' + p.shift + ')' : '')} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <View style={[s.table, { flex: 1.3 }]}>
          <Cell l="TOTAL AMOUNT" v={rs(m.total)} />
          {(p.extras || []).map((x, i) => <Cell key={i} l={String(x.label).toUpperCase()} v={rs(x.amount)} />)}
          {m.disc ? <Cell l="DISCOUNT" v={'− ' + rs(m.disc)} /> : null}
          {(p.extras || []).length || m.disc ? <Cell l="NET AMOUNT" v={rs(m.net)} /> : null}
          <Cell l="ADVANCE" v={rs(p.advance)} />
          {m.paid - n(p.advance) > 0 ? <Cell l="RECEIVED" v={rs(m.paid - n(p.advance))} /> : null}
          <Cell l="BALANCE" v={rs(m.balance)} />
        </View>
        <View style={[s.table, { flex: 1 }]}>
          {svcs.map((x) => <Cell key={x} l={x} v={(p.services || []).includes(x) ? '✓' : '✗'} center />)}
        </View>
      </View>
      {fin && m.balance <= 0 ? <Text style={s.stamp}>— PAID IN FULL —</Text> : null}
      <Text style={s.rulesH}>{settings.rulesTitle}</Text>
      {(settings.rules || []).map((r, i) => <Text key={i} style={s.rule}>{i + 1}. {r}</Text>)}
      <View style={s.sig}>
        <View style={s.sigBox}><Text style={s.hand}>{p.customerName}</Text><Text style={s.sigT}>Party Signature</Text></View>
        <View style={s.sigBox}><Text style={s.hand}> </Text><Text style={s.sigT}>Auth. Signature</Text></View>
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

  const sharePdf = async () => {
    setBusy(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: billHTML(p, settings, ledger) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share bill', UTI: 'com.adobe.pdf' });
      } else toast('Sharing isn’t available on this phone.');
    } catch (e) {
      toast('Couldn’t make the PDF. Try again.');
    }
    setBusy(false);
  };
  const print = async () => {
    try { await Print.printAsync({ html: billHTML(p, settings, ledger) }); } catch (e) {}
  };
  const shareText = () => Share.share({ message: billText(p, settings, ledger) }).catch(() => {});

  return (
    <Screen>
      <BillPreview p={p} settings={settings} ledger={ledger} />
      <Btn title={busy ? 'Making PDF…' : 'Share bill as PDF'} onPress={sharePdf} disabled={busy} />
      <BtnRow>
        <Btn variant="secondary" title="Print" onPress={print} />
        <Btn variant="secondary" title="Send as text" onPress={shareText} />
      </BtnRow>
      <T muted size={12.5}>The PDF can be sent on WhatsApp or saved to your phone.</T>
    </Screen>
  );
}

const s = StyleSheet.create({
  bill: { backgroundColor: '#fff', borderColor: B.blue, borderWidth: 3, borderRadius: 18, padding: 14 },
  tag: { alignSelf: 'center', borderWidth: 2, borderColor: B.red, color: B.red, borderRadius: 99, paddingHorizontal: 12, fontWeight: '800', fontSize: 11, letterSpacing: 1, textDecorationLine: 'underline' },
  brand: { textAlign: 'center', fontWeight: '900', fontSize: 32, marginTop: 6, letterSpacing: 0.5 },
  tagline: { textAlign: 'center', color: B.orange, fontWeight: '800', letterSpacing: 1, fontSize: 14 },
  contact: { textAlign: 'center', color: B.red, fontWeight: '700', fontSize: 12, marginTop: 4 },
  addr: { textAlign: 'center', color: B.blue, fontWeight: '700', fontSize: 12 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: '#222', marginTop: 8, paddingTop: 6 },
  metaT: { fontWeight: '600', color: '#111' },
  hand: { color: B.hand, fontWeight: '600', fontStyle: 'italic' },
  box: { borderWidth: 2, borderColor: B.red, borderRadius: 12, padding: 10, paddingTop: 14, marginTop: 16 },
  lbl: { position: 'absolute', top: -11, alignSelf: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: B.red, color: B.red, borderRadius: 99, paddingHorizontal: 10, fontWeight: '800', fontSize: 11 },
  ln: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderStyle: 'dotted', borderBottomColor: '#999' },
  lnB: { fontWeight: '600', color: '#333', fontSize: 12.5 },
  table: { backgroundColor: B.yellow, borderWidth: 1, borderColor: '#222', alignSelf: 'flex-start' },
  td: { borderWidth: 0.75, borderColor: '#222', paddingHorizontal: 6, paddingVertical: 5, fontWeight: '700', fontSize: 12 },
  stamp: { textAlign: 'center', marginTop: 8, fontWeight: '800', color: B.blue, letterSpacing: 2 },
  rulesH: { alignSelf: 'center', backgroundColor: B.red, color: '#fff', borderRadius: 99, paddingHorizontal: 14, marginTop: 12, marginBottom: 4, fontWeight: '700', overflow: 'hidden' },
  rule: { fontSize: 11.5, lineHeight: 18, color: '#111' },
  sig: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  sigBox: { minWidth: 120, alignItems: 'center' },
  sigT: { borderTopWidth: 1, borderTopColor: '#444', paddingTop: 3, color: B.red, fontWeight: '700', fontSize: 12, alignSelf: 'stretch', textAlign: 'center' },
});
