import React, { useLayoutEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Screen, Btn, BtnRow, Empty, T, WhatsAppBtn } from '../components/ui';
import { useStore } from '../store';
import { billPalette, DOC, paymentHTML, paymentList, paymentText } from '../bill';
import { printHtml, sharePdf, shareText, openWhatsApp } from '../share';
import { dmy, inr, n, projMoney } from '../utils';

// A small receipt for one payment (the advance, or any later payment).
export default function PaymentReceiptScreen({ navigation, route }) {
  const { projects, settings, ledger } = useStore();
  const p = projects.find((x) => x.id === route.params.id);
  const [busy, setBusy] = useState(false);
  const pay = p ? paymentList(p).find((x) => x.no === route.params.no) : null;

  useLayoutEffect(() => { if (pay) navigation.setOptions({ title: 'Receipt No. ' + pay.no }); }, [navigation, pay && pay.no]);
  if (!p || !pay) return <Screen><Empty title="Payment not found" text="It may have been removed from the booking." /></Screen>;

  const D = billPalette(settings);
  const m = projMoney(p, ledger);
  const all = paymentList(p);
  const upto = all.slice(0, all.findIndex((x) => x.no === pay.no) + 1).reduce((a, x) => a + n(x.amount), 0);
  const html = () => paymentHTML(p, settings, ledger, pay);
  const text = () => paymentText(p, settings, ledger, pay);
  const line = (l, v) => (v ? (
    <View key={l} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 6 }}>
      <Text style={{ color: DOC.muted, fontWeight: '600' }}>{l}</Text>
      <Text style={{ color: DOC.ink, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{v}</Text>
    </View>
  ) : null);

  return (
    <Screen>
      <View style={{ backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: D.line }}>
        <View style={{ backgroundColor: D.deep, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', flex: 1 }} numberOfLines={1}>{settings.name || 'Your business'}</Text>
          <Text style={{ color: D.deep, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: '900', overflow: 'hidden' }}>PAYMENT RECEIPT</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: D.tint, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text style={{ color: DOC.ink, fontWeight: '800' }}>No. {pay.no}</Text>
          <Text style={{ color: DOC.ink, fontWeight: '800' }}>{dmy(pay.date)}</Text>
        </View>
        <View style={{ padding: 16, gap: 6 }}>
          <View style={{ backgroundColor: D.tint, borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: DOC.muted, fontWeight: '800', fontSize: 12, letterSpacing: 0.8 }}>AMOUNT RECEIVED</Text>
            <Text style={{ color: D.deep, fontWeight: '900', fontSize: 26 }}>{inr(pay.amount)}</Text>
          </View>
          {line('Received from', p.customerName)}
          {line('Paid by', pay.mode || 'Cash')}
          {line('Note', pay.note)}
          {line('For booking', 'Sl. No. ' + p.serial + ' · ' + dmy(p.bookingDate))}
          {line('Bill total', inr(m.net))}
          {line('Paid till this receipt', inr(upto))}
          {line('Balance after this payment', inr(Math.max(0, m.net - upto)))}
        </View>
      </View>
      <Btn title={busy ? 'Making PDF…' : 'Share receipt as PDF'} disabled={busy} onPress={async () => { setBusy(true); await sharePdf(html(), 'Share receipt'); setBusy(false); }} />
      {p.mobile ? <WhatsAppBtn title={'Send to ' + (p.customerName || 'customer')} onPress={() => openWhatsApp(p.mobile, text())} /> : null}
      <BtnRow>
        <Btn variant="secondary" title="Print" onPress={() => printHtml(html())} />
        <Btn variant="secondary" title="Send as text" onPress={() => shareText(text())} />
      </BtnRow>
      <T muted size={12.5}>Receipt numbers start with the booking’s Sl. No. ({p.serial}-1, {p.serial}-2, …), one for each payment.</T>
    </Screen>
  );
}
