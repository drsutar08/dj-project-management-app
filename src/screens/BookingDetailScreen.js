import React, { useLayoutEffect, useState } from 'react';
import { View, ScrollView, Pressable, Image, Modal, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { DOC_TYPES, pickDocument, removeDocumentFile } from '../docs';
import {
  Screen, Card, T, H2, KV, MoneyRow, Btn, BtnRow, ConfirmBtn, List, Empty, Pill, LinkBtn,
  Sheet, Field, DateField, FRow, Chips, opts, toast, Row, Tile, RemoveBtn, HeaderBtn, Icon, QtyRow, WhatsAppBtn,
} from '../components/ui';
import { confirmationText, dutyText, openWhatsApp, reminderText } from '../share';
import { paymentList } from '../bill';
import { LedRow, MoveRow } from '../components/rows';
import { useStore, useSorted } from '../store';
import { useTheme, shadow } from '../theme';
import { MODES, STATUSES } from '../defaults';
import { allMobiles, bookingPL, dayName, setupLines, qtyLabel, withUnit, dmy, dparts, initials, inr, itemAvail, maskId, n, projMoney, qtyTxt, signed, today } from '../utils';

export default function BookingDetailScreen({ navigation, route }) {
  const c = useTheme();
  const { projects, settings, patchProject, items, addMove, expenses, deleteExpense, employees, saveEntry, deleteEntry } = useStore();
  const { ledger, moves } = useSorted();
  const p = projects.find((x) => x.id === route.params.id);
  const [sheet, setSheet] = useState(null); // 'pay' | 'extra' | 'disc' | 'final' | 'gear' | 'check' | 'staff' | 'doc'
  const [viewDoc, setViewDoc] = useState(null);
  const [docBusy, setDocBusy] = useState(false);
  const [form, setForm] = useState({});
  const setF = (k) => (v) => setForm((s) => ({ ...s, [k]: v }));

  useLayoutEffect(() => {
    if (!p) return;
    navigation.setOptions({
      title: p.customerName,
      headerRight: () => <HeaderBtn title="Edit" onPress={() => navigation.navigate('BookingForm', { id: p.id })} />,
    });
  }, [navigation, p]);

  if (!p) return <Screen><Empty title="Booking not found" text="It may have been deleted." /></Screen>;

  const m = projMoney(p, ledger);
  const st = STATUSES[p.status || 'booked'] || STATUSES.booked;
  const dp = dparts(p.bookingDate);
  const paidPct = m.net > 0 ? Math.max(0, Math.min(100, (m.paid / m.net) * 100)) : m.paid > 0 ? 100 : 0;
  const setup = setupLines(p, settings);
  const sound = setup.sound.filter((l) => l.qty);
  const fx = setup.fx;
  const day = dayName(p.bookingDate);
  const work = ledger.filter((l) => l.projectId === p.id);
  const patch = (ch, msg) => { patchProject(p.id, ch); if (msg) toast(msg); };

  const open = (k, init) => { setForm(init || {}); setSheet(k); };
  const close = () => setSheet(null);

  const saveSheet = () => {
    if (sheet === 'pay') {
      if (!(n(form.amount) > 0)) return toast('Enter an amount above zero.');
      patch({ payments: [...(p.payments || []), { amount: n(form.amount), mode: form.mode || 'Cash', date: form.date || today(), note: form.note || '' }] }, 'Payment recorded');
    } else if (sheet === 'extra') {
      if (!String(form.label || '').trim() || !(n(form.amount) > 0)) return toast('Enter what it is for and the amount.');
      patch({ extras: [...(p.extras || []), { label: form.label.trim(), amount: n(form.amount) }] }, 'Charge added');
    } else if (sheet === 'disc') {
      patch({ discount: n(form.discount) }, 'Discount saved');
    } else if (sheet === 'gear') {
      const it = items.find((x) => x.id === form.itemId);
      const q = n(form.qty);
      if (!it) return toast('Pick an item.');
      if (!(q > 0)) return toast('Enter a quantity above zero.');
      if (it.kind === 'consumable') {
        if (q > n(it.qty)) return toast('Only ' + qtyTxt(it.qty, it.unit) + ' in stock.');
        addMove({ itemId: it.id, type: 'out', qty: q, date: p.bookingDate || today(), projectId: p.id, note: '' });
        toast('Stock used on this programme');
      } else {
        const gear = (p.gear || []).filter((g) => g.itemId !== it.id);
        patch({ gear: [...gear, { itemId: it.id, qty: q }] }, 'Equipment reserved');
      }
    } else if (sheet === 'check') {
      // Equipment checklist for one reserved item: sent, how many came back, how many damaged.
      const g0 = (p.gear || []).find((g) => g.itemId === form.itemId);
      if (!g0) return close();
      const it = items.find((x) => x.id === g0.itemId);
      const damaged = n(form.damaged), before = n(g0.damaged);
      if (n(form.back) + damaged > n(g0.qty)) return toast('Back + damaged can’t be more than ' + qtyTxt(g0.qty, it && it.unit) + '.');
      patch({ gear: (p.gear || []).map((g) => (g.itemId === g0.itemId ? { ...g, sent: !!form.sent, back: n(form.back), damaged, note: String(form.note || '').trim() } : g)) }, 'Checklist saved');
      // New damage goes to repair in stock, so it isn't booked again until fixed.
      if (it && damaged > before) addMove({ itemId: it.id, type: 'repair', qty: damaged - before, date: today(), projectId: p.id, note: 'Damaged at programme Sl. No. ' + p.serial + (form.note ? ' · ' + String(form.note).trim() : '') });
    } else if (sheet === 'staff') {
      // Assign staff: one wage entry each, at their usual rate. It goes into their pay ledger.
      const already = new Set(work.map((l) => l.empId));
      const pick = (form.emps || []).filter((id) => !already.has(id));
      if (!pick.length) return toast('Pick at least one person.');
      pick.forEach((id) => {
        const e = employees.find((x) => x.id === id) || {};
        saveEntry({ kind: 'earn', empId: id, projectId: p.id, qty: 1, rate: n(e.rate), amount: n(e.rate), date: p.bookingDate || today(), note: 'Duty' });
      });
      toast(pick.length === 1 ? 'Staff assigned' : pick.length + ' staff assigned');
    } else if (sheet === 'final') {
      const ch = { status: 'final', billNo: String(form.billNo || p.serial), billDate: form.billDate || today() };
      if (form.collect) ch.payments = [...(p.payments || []), { amount: m.balance, mode: form.collect, date: ch.billDate, note: 'Final settlement' }];
      patch(ch, 'Bill created');
      close();
      return navigation.navigate('Bill', { id: p.id });
    }
    close();
  };

  const gearRows = (p.gear || [])
    .map((g) => {
      const it = items.find((x) => x.id === g.itemId);
      if (!it) return null;
      const av = itemAvail(it, projects, p.bookingDate, p.id);
      return { g, it, av: { ...av, free: av.free - n(g.qty) } };
    })
    .filter(Boolean);
  const used = moves.filter((mv) => mv.projectId === p.id);
  const pl = bookingPL(p, { ledger, expenses, moves, items });
  const addExpense = (category) => navigation.navigate('ExpenseForm', { projectId: p.id, category });
  // Per-booking costs first; shop rent, electricity, phone and EMI are business-wide, so they are left out here.
  const quickTypes = (settings.expenseCategories || []).filter((x) => !/shop rent|electricity|phone|internet|loan|emi/i.test(x));
  const pickIt = sheet === 'gear' ? items.find((x) => x.id === form.itemId) : null;
  let pickNote = '';
  if (pickIt && pickIt.kind === 'consumable') pickNote = qtyTxt(pickIt.qty, pickIt.unit) + ' in stock. This takes it out of stock now.';
  else if (pickIt) {
    const av = itemAvail(pickIt, projects, p.bookingDate, p.id);
    const why = [av.booked ? av.booked + ' on other bookings' : '', av.repair ? av.repair + ' in repair' : ''].filter(Boolean).join(', ');
    pickNote = qtyTxt(av.free, pickIt.unit) + ' free on ' + (dmy(p.bookingDate) || 'this date') + (why ? ' (' + why + ')' : '') + '.';
  }

  const payList = paymentList(p);
  const docs = p.docs || [];
  const addDoc = async (fromCamera) => {
    setDocBusy(true);
    try {
      const d = await pickDocument(fromCamera);
      if (!d) return;
      patch({ docs: [...docs, { ...d, type: form.docType || 'Other', note: String(form.docNote || '').trim(), date: today() }] }, 'Document added');
      close();
    } catch (e) {
      toast(e && e.message === 'camera-permission' ? 'Allow camera access in phone settings to take a photo.' : 'Couldn’t add that picture. Try another one.');
    } finally {
      setDocBusy(false);
    }
  };
  const deleteDoc = async (d) => {
    await removeDocumentFile(d);
    patch({ docs: docs.filter((x) => x.id !== d.id) }, 'Document removed');
    setViewDoc(null);
  };
  const shareDoc = async (d) => {
    try {
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) await Sharing.shareAsync(d.uri, { mimeType: 'image/jpeg', dialogTitle: d.type });
      else toast('Long-press the picture to save or share it.');
    } catch (e) {
      toast('Couldn’t share the picture.');
    }
  };
  const checkLabel = (g) => (n(g.damaged) ? n(g.damaged) + ' damaged' : g.sent ? (n(g.back) ? 'Back ' + n(g.back) + '/' + n(g.qty) : 'Sent') : 'To load');
  const checkSub = (g, it, av) => {
    if (av.free < 0) return 'Short by ' + qtyTxt(-av.free, it.unit) + ' on ' + dmy(p.bookingDate);
    if (g.sent && n(g.back) + n(g.damaged) < n(g.qty)) return (n(g.qty) - n(g.back) - n(g.damaged)) + ' not back yet · tap to update';
    if (g.note) return g.note;
    return 'Tap for checklist';
  };
  const checkItem = sheet === 'check' ? items.find((x) => x.id === form.itemId) : null;
  const checkGear = sheet === 'check' ? (p.gear || []).find((g) => g.itemId === form.itemId) : null;
  const activeStaff = employees.filter((e) => e.active !== false).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const assigned = new Set(work.map((l) => l.empId));

  const maxBill = projects.reduce((mx, x) => Math.max(mx, parseInt(x.billNo, 10) || 0), 0);

  return (
    <Screen>
      {/* Header: date tile, name, status, then time and route */}
      <View style={[{ backgroundColor: c.heroBg, borderWidth: 1, borderColor: c.heroLine, borderRadius: 24, padding: 16, gap: 14 }, shadow]}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={[{ width: 64, height: 68, borderRadius: 18, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }, shadow]}>
            <T size={24} weight="800" color={c.accent} style={{ lineHeight: 26 }}>{dp.d}</T>
            <T size={11} weight="800" color={c.accent} style={{ letterSpacing: 0.8 }}>{String(dp.m).toUpperCase()}</T>
            <T size={10} muted weight="600">{dp.y}</T>
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <T size={20} weight="800" numberOfLines={2} style={{ letterSpacing: -0.4 }}>{p.customerName || 'Unnamed'}</T>
            {[p.segment, p.eventType, p.programmeType].filter(Boolean).length ? <T muted size={13} weight="600">{[p.segment, p.eventType, p.programmeType].filter(Boolean).join(' · ')}</T> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <Pill label={st.label} t={st.tone} />
              <T muted size={12} weight="700">Sl. No. {p.serial}</T>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            ['today-outline', day],
            ['time-outline', [p.startTime, p.endTime].filter(Boolean).join(' – ') + (p.shift ? ' · ' + p.shift : '')],
            ['location-outline', [p.from, p.to].filter(Boolean).join(' → ')],
          ]
            .filter(([, v]) => v)
            .map(([icon, v]) => (
              <View key={icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.surface, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, maxWidth: '100%' }}>
                <Icon name={icon} size={15} color={c.accent} />
                <T size={13} weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>{v}</T>
              </View>
            ))}
        </View>
      </View>

      {/* Payment summary: what is still due, and how much is paid */}
      <View style={[{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 22, padding: 16, gap: 10 }, shadow]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
          <View>
            <T muted size={12.5} weight="700">{m.balance > 0 ? 'Balance due' : m.balance < 0 ? 'Paid extra' : 'Fully paid'}</T>
            <T size={28} weight="800" color={m.balance > 0 ? c.bad : c.good} style={{ letterSpacing: -0.8 }}>{inr(Math.abs(m.balance))}</T>
          </View>
          <T muted size={12.5} weight="600" style={{ textAlign: 'right' }}>{inr(m.paid)} paid{'\n'}of {inr(m.net)}</T>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: c.surface2, overflow: 'hidden' }}>
          <View style={{ width: `${paidPct}%`, height: 8, borderRadius: 4, backgroundColor: c.good }} />
        </View>
      </View>

      {p.mobile ? (
        <BtnRow>
          <WhatsAppBtn title="Send confirmation" onPress={() => openWhatsApp(p.mobile, confirmationText(p, settings, ledger))} />
          {m.balance > 0 ? <WhatsAppBtn title="Balance reminder" onPress={() => openWhatsApp(p.mobile, reminderText(p, settings, ledger))} /> : null}
        </BtnRow>
      ) : null}

      {/* Customer details and effects */}
      <Card style={{ gap: 14 }}>
        <KV
          rows={[
            ['Age', p.age ? String(p.age) : ''],
            ['Father’s name', p.fatherName],
            ['Address', p.address],
            ['Mobile', p.mobile],
            ['Other numbers', (p.altMobiles || []).filter(Boolean).join(', ')],
            ['Aadhaar', maskId(p.aadhaar)],
            ['PAN', p.pan],
            ['Booking date', dmy(p.receiptDate)],
            ['Notes', p.notes],
          ]}
        />
        {[['Sound setup', sound], ['Effects', fx]].map(([title, list]) =>
          list.length ? (
            <View key={title} style={{ gap: 8 }}>
              <T muted size={12.5} weight="700">{title}</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {list.map(({ name, qty, unit }) => (
                  <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: qty ? c.plumBg : c.surface2, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6 }}>
                    <Icon name={qty ? 'checkmark' : 'close'} size={14} color={qty ? c.accent : c.muted} />
                    <T size={12.5} weight="700" color={qty ? c.plum : c.muted}>{withUnit(name, unit)}</T>
                    {qty && (qty !== 1 || unit) ? <T size={12.5} weight="800" color={c.accent}>× {qtyLabel(qty)}</T> : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null
        )}
      </Card>

      <View style={{ gap: 12 }}>
        <H2>Customer payment</H2>
        <Card style={{ gap: 8 }}>
          <MoneyRow label="Package amount" value={inr(m.total)} />
          {(p.extras || []).map((x, i) => (
            <MoneyRow key={'e' + i} label={'+ ' + x.label} value={inr(x.amount)} onRemove={() => patch({ extras: p.extras.filter((_, j) => j !== i) }, 'Charge removed')} />
          ))}
          {m.disc ? <MoneyRow label="− Discount" value={inr(m.disc)} /> : null}
          <MoneyRow total label="Bill total" value={inr(m.net)} />
          <MoneyRow label={'Advance (' + (dmy(p.receiptDate) || 'at booking') + ')'} value={'−' + inr(p.advance)} color={c.good} />
          {(p.payments || []).map((x, i) => (
            <MoneyRow key={'p' + i} label={'Received ' + dmy(x.date) + ' · ' + (x.mode || 'Cash')} value={'−' + inr(x.amount)} color={c.good}
              onRemove={() => patch({ payments: p.payments.filter((_, j) => j !== i) }, 'Payment removed')} />
          ))}
          <MoneyRow total label="Balance" value={inr(m.balance)} color={m.balance > 0 ? c.bad : c.good} />
        </Card>
        {payList.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
            {payList.map((x) => (
              <Pressable
                key={x.no}
                onPress={() => navigation.navigate('PaymentReceipt', { id: p.id, no: x.no })}
                accessibilityRole="button"
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.goodBg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, opacity: pressed ? 0.7 : 1 })}
              >
                <Icon name="document-text-outline" size={16} color={c.good} />
                <T size={13} weight="800" color={c.good}>Receipt {x.no} · {inr(x.amount)}</T>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <BtnRow>
          <Btn variant="secondary" title="+ Payment received" onPress={() => open('pay', { amount: String(Math.max(0, m.balance) || ''), mode: 'Cash', date: today() })} />
          <Btn variant="secondary" title="+ Extra charge" onPress={() => open('extra')} />
          <Btn variant="secondary" title="Discount" onPress={() => open('disc', { discount: String(p.discount || '') })} />
        </BtnRow>
      </View>

      <View style={{ gap: 12 }}>
        <H2 right={employees.length ? '+ Assign staff' : '+ Add staff'} onRight={() => (employees.length ? open('staff', { emps: [] }) : navigation.navigate('StaffForm'))}>Staff on this programme</H2>
        {work.length ? (
          <List>
            {work.map((l) => {
              const e = employees.find((x) => x.id === l.empId);
              return (
                <Row
                  key={l.id}
                  onPress={e ? () => navigation.navigate('StaffMember', { id: e.id }) : undefined}
                  left={<Tile top={initials(e ? e.name : '?')} t="warn" />}
                  title={e ? e.name : 'Removed staff'}
                  sub={[e && e.role, e && e.phone].filter(Boolean).join(' · ') || 'Wage ' + inr(l.amount)}
                  right={inr(l.amount)}
                  rightSub="wage"
                  extra={
                    <View style={{ flexDirection: 'row', gap: 6, marginLeft: 4 }}>
                      {e && e.phone ? <WhatsAppBtn compact title={'Send duty to ' + e.name} onPress={() => openWhatsApp(e.phone, dutyText(p, e, settings))} /> : null}
                      <RemoveBtn onPress={() => { deleteEntry(l.id); toast('Removed from programme'); }} />
                    </View>
                  }
                />
              );
            })}
          </List>
        ) : (
          <Empty title="No staff assigned" text="Assign who is working this programme. Their wage is filled in from their rate and goes into their pay ledger." />
        )}
        {work.length ? <LinkBtn onPress={() => navigation.navigate('LedgerForm', { kind: 'earn', projectId: p.id })}>+ Add work with a different wage</LinkBtn> : null}
      </View>

      <View style={{ gap: 12 }}>
        <H2 right={items.length ? '+ Add' : '+ Add stock items'} onRight={() => (items.length ? open('gear', { itemId: '', qty: '1' }) : navigation.navigate('ItemForm'))}>Equipment & stock</H2>
        {gearRows.length || used.length ? (
          <List>
            {gearRows.map(({ g, it, av }) => (
              <Row
                key={g.itemId}
                left={<Tile top={initials(it.name)} t={av.free < 0 ? 'bad' : 'plum'} />}
                title={it.name}
                sub={checkSub(g, it, av)}
                right={qtyTxt(g.qty, it.unit)}
                rightColor={av.free < 0 ? c.bad : undefined}
                rightSub={<View style={{ marginTop: 3 }}><Pill label={checkLabel(g)} t={n(g.damaged) ? 'bad' : g.sent && n(g.back) >= n(g.qty) - n(g.damaged) && n(g.back) > 0 ? 'good' : g.sent ? 'warn' : 'plum'} /></View>}
                onPress={() => open('check', { itemId: g.itemId, sent: !!g.sent, back: n(g.back), damaged: n(g.damaged), note: g.note || '' })}
                extra={<RemoveBtn onPress={() => patch({ gear: (p.gear || []).filter((x) => x.itemId !== g.itemId) }, 'Equipment removed')} />}
              />
            ))}
            {used.map((mv) => <MoveRow key={mv.id} m={mv} showItem />)}
          </List>
        ) : (
          <Empty title="No equipment added" text="Reserve the speakers, lights and machines going to this programme, and record CO₂, paper and other stock used." />
        )}
      </View>

      {/* Documents: photos of Aadhaar, agreement, payment proof… */}
      <View style={{ gap: 12 }}>
        <H2 right="+ Add" onRight={() => open('doc', { docType: DOC_TYPES[0], docNote: '' })}>Documents</H2>
        {docs.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {docs.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => setViewDoc(d)}
                accessibilityRole="button"
                accessibilityLabel={'Open ' + d.type}
                style={({ pressed }) => ({ width: 100, gap: 4, opacity: pressed ? 0.8 : 1 })}
              >
                <Image source={{ uri: d.uri }} style={{ width: 100, height: 100, borderRadius: 14, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line }} resizeMode="cover" />
                <T size={12} weight="700" numberOfLines={1}>{d.type}</T>
                <T muted size={11} numberOfLines={1}>{dmy(d.date)}</T>
              </Pressable>
            ))}
          </View>
        ) : (
          <Empty title="No documents" text="Add photos of the customer’s Aadhaar, the signed agreement, payment proof or the programme." />
        )}
      </View>

      {/* Expenses for this booking: one-tap types, then the list (tap to edit) */}
      <View style={{ gap: 12 }}>
        <H2 right="+ Add expense" onRight={() => addExpense()}>Expenses</H2>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
          {quickTypes.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => addExpense(cat)}
              style={({ pressed }) => ({ backgroundColor: c.plumBg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, opacity: pressed ? 0.7 : 1 })}
            >
              <T size={13} weight="800" color={c.plum}>+ {cat.split(' / ')[0]}</T>
            </Pressable>
          ))}
        </ScrollView>
        {pl.expenseList.length ? (
          <List>
            {pl.expenseList
              .slice()
              .sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.ts || 0) - (b.ts || 0))
              .map((e) => (
                <Row
                  key={e.id}
                  onPress={() => navigation.navigate('ExpenseForm', { id: e.id })}
                  left={<Tile icon={(e.photos || []).length ? 'image-outline' : 'receipt-outline'} t="warn" />}
                  title={e.category || 'Expense'}
                  sub={[dmy(e.date), e.mode, e.note].filter(Boolean).join(' · ')}
                  right={inr(e.amount)}
                  extra={<RemoveBtn onPress={() => { deleteExpense(e.id); toast('Expense removed'); }} />}
                />
              ))}
          </List>
        ) : (
          <Empty title="No expenses yet" text="Tap a type above to add diesel, transport, food, gear rent and other costs for this programme." />
        )}
        {pl.expenseList.length ? (
          <Card style={{ gap: 8 }}>
            <MoneyRow total label={`Total expenses (${pl.expenseList.length})`} value={inr(pl.expenses)} />
          </Card>
        ) : null}
      </View>

      <View style={{ gap: 12 }}>
        <H2>Profit & loss</H2>
        <Card style={{ gap: 8 }}>
          <MoneyRow label={pl.cancelled ? 'Kept from customer' : 'Bill total'} value={inr(pl.income)} />
          {pl.wages ? <MoneyRow label="− Staff wages" value={inr(pl.wages)} /> : null}
          {pl.expenses ? <MoneyRow label="− Expenses" value={inr(pl.expenses)} /> : null}
          {pl.stockUsed ? <MoneyRow label="− Stock used" value={inr(pl.stockUsed)} /> : null}
          <MoneyRow total label={pl.profit < 0 ? 'Loss' : 'Profit'} value={signed(pl.profit)} color={pl.profit < 0 ? c.bad : c.good} />
          {!pl.cost ? <T muted size={12.5}>Add staff wages and expenses like diesel, transport and food to see the real profit.</T> : null}
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        {p.status === 'final' ? (
          <Btn title={'View bill No. ' + (p.billNo || p.serial)} onPress={() => navigation.navigate('Bill', { id: p.id })} />
        ) : (
          <Btn title="Finalise & create bill" onPress={() => open('final', { billNo: String(p.billNo || p.serial || maxBill + 1), billDate: today(), collect: '' })} />
        )}
        <BtnRow>
          {p.status === 'final'
            ? <Btn variant="secondary" title="Reopen booking" onPress={() => patch({ status: 'done' }, 'Booking reopened')} />
            : <Btn variant="secondary" title="Preview receipt" onPress={() => navigation.navigate('Bill', { id: p.id })} />}
          {p.status === 'booked' ? <Btn variant="secondary" title="Mark programme done" onPress={() => patch({ status: 'done' }, 'Marked as done')} /> : null}
          {p.status !== 'cancel'
            ? <ConfirmBtn title="Cancel booking" confirmTitle="Tap again to cancel" onConfirm={() => patch({ status: 'cancel' }, 'Booking cancelled')} />
            : <Btn variant="secondary" title="Restore booking" onPress={() => patch({ status: 'booked' }, 'Booking restored')} />}
        </BtnRow>
      </View>

      <Sheet visible={sheet === 'pay'} title="Payment received" onClose={close} onOk={saveSheet} okTitle="Add payment">
        <Field label="Amount (₹)" required value={form.amount} onChangeText={setF('amount')} keyboardType="decimal-pad" />
        <Chips options={opts(MODES)} value={form.mode} onChange={setF('mode')} />
        <DateField label="Date" value={form.date} onChange={setF('date')} />
        <Field label="Note" value={form.note} onChangeText={setF('note')} />
      </Sheet>

      <Sheet visible={sheet === 'extra'} title="Extra charge" onClose={close} onOk={saveSheet} okTitle="Add charge">
        <Field label="For" required value={form.label} onChangeText={setF('label')} placeholder="Extra hour, extra light, transport…" />
        <Field label="Amount (₹)" required value={form.amount} onChangeText={setF('amount')} keyboardType="decimal-pad" />
      </Sheet>

      <Sheet visible={sheet === 'gear'} title="Add equipment or stock" onClose={close} onOk={saveSheet} okTitle={pickIt && pickIt.kind === 'consumable' ? 'Use from stock' : 'Reserve'}>
        <View style={{ gap: 8 }}>
          <T muted size={12.5} weight="700">Item</T>
          <Chips options={opts(items.slice().sort((a, b) => String(a.name).localeCompare(String(b.name))).map((it) => [it.id, it.name]))} value={form.itemId} onChange={setF('itemId')} />
        </View>
        {pickIt ? <T muted size={13}>{pickNote}</T> : null}
        <Field label="Quantity" required value={form.qty} onChangeText={setF('qty')} keyboardType="decimal-pad" />
      </Sheet>

      <Sheet visible={sheet === 'check'} title={checkItem ? checkItem.name : 'Checklist'} onClose={close} onOk={saveSheet} okTitle="Save checklist">
        {checkGear ? (
          <>
            <T muted size={13}>{qtyTxt(checkGear.qty, checkItem && checkItem.unit)} reserved for this programme.</T>
            <Chips options={opts([[false, 'Not loaded yet'], [true, 'Sent to programme']])} value={!!form.sent} onChange={setF('sent')} />
            <Card style={{ paddingVertical: 6 }}>
              <QtyRow label="Came back OK" value={form.back} onChange={setF('back')} />
              <QtyRow label="Damaged" value={form.damaged} onChange={setF('damaged')} />
            </Card>
            <T muted size={12.5}>New damage is sent to repair in Stock, so it isn’t booked again until it’s fixed.</T>
            <Field label="Note" value={form.note} onChangeText={setF('note')} placeholder="What happened, who has it, repair shop…" />
            <Btn variant="secondary" title="Open stock item" onPress={() => { close(); navigation.navigate('Item', { id: checkGear.itemId }); }} />
          </>
        ) : null}
      </Sheet>

      <Sheet visible={sheet === 'staff'} title="Assign staff" onClose={close} onOk={saveSheet} okTitle="Assign">
        <T muted size={13}>Each person gets this programme in their pay ledger at their usual rate. You can change a wage later from their page.</T>
        <Chips
          multi
          options={opts(activeStaff.filter((e) => !assigned.has(e.id)).map((e) => [e.id, e.name + (e.rate ? ' · ' + inr(e.rate) : '')]))}
          value={form.emps}
          onChange={setF('emps')}
        />
        {activeStaff.every((e) => assigned.has(e.id)) ? <T muted size={13}>Everyone is already assigned.</T> : null}
      </Sheet>

      <Sheet visible={sheet === 'doc'} title="Add document" onClose={close}>
        <View style={{ gap: 8 }}>
          <T muted size={12.5} weight="700">What is it?</T>
          <Chips options={opts(DOC_TYPES)} value={form.docType} onChange={setF('docType')} />
        </View>
        <Field label="Note (optional)" value={form.docNote} onChangeText={setF('docNote')} placeholder="Front side, signed copy, UPI screenshot…" />
        <BtnRow>
          {Platform.OS !== 'web' ? <Btn title={docBusy ? 'Opening…' : 'Take photo'} onPress={() => addDoc(true)} disabled={docBusy} /> : null}
          <Btn variant={Platform.OS !== 'web' ? 'secondary' : 'primary'} title={docBusy ? 'Opening…' : 'Choose from photos'} onPress={() => addDoc(false)} disabled={docBusy} />
        </BtnRow>
        <T muted size={12.5}>Pictures are made smaller before saving. They stay on this phone with the booking.</T>
      </Sheet>

      <Modal visible={!!viewDoc} transparent animationType="fade" onRequestClose={() => setViewDoc(null)}>
        <View style={{ flex: 1, backgroundColor: '#0b0918', padding: 16, paddingTop: 48, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <T color="#ffffff" weight="800" size={17}>{viewDoc ? viewDoc.type : ''}</T>
              {viewDoc ? <T color="rgba(255,255,255,0.7)" size={12.5}>{[dmy(viewDoc.date), viewDoc.note].filter(Boolean).join(' · ')}</T> : null}
            </View>
            <Pressable onPress={() => setViewDoc(null)} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={22} color="#ffffff" />
            </Pressable>
          </View>
          {viewDoc ? <Image source={{ uri: viewDoc.uri }} style={{ flex: 1, width: '100%' }} resizeMode="contain" accessibilityLabel={viewDoc.type} /> : null}
          <BtnRow>
            {Platform.OS !== 'web' ? <Btn variant="secondary" title="Share" onPress={() => shareDoc(viewDoc)} /> : null}
            <ConfirmBtn title="Delete document" confirmTitle="Tap again to delete" onConfirm={() => deleteDoc(viewDoc)} />
          </BtnRow>
        </View>
      </Modal>

      <Sheet visible={sheet === 'disc'} title="Discount" onClose={close} onOk={saveSheet}>
        <Field label="Discount (₹)" value={form.discount} onChangeText={setF('discount')} keyboardType="decimal-pad" />
      </Sheet>

      <Sheet visible={sheet === 'final'} title="Finalise & create bill" onClose={close} onOk={saveSheet} okTitle="Create bill">
        <Card style={{ gap: 8 }}>
          <MoneyRow label="Bill total" value={inr(m.net)} />
          <MoneyRow label="Received so far" value={inr(m.paid)} color={c.good} />
          <MoneyRow total label="Balance" value={inr(m.balance)} color={m.balance > 0 ? c.bad : c.good} />
        </Card>
        <T muted size={13}>Add any extra charges or payments on the booking first. You can reopen the booking later.</T>
        <FRow>
          <Field label="Bill No." value={form.billNo} onChangeText={setF('billNo')} keyboardType="number-pad" />
          <DateField label="Bill date" value={form.billDate} onChange={setF('billDate')} />
        </FRow>
        {m.balance > 0 ? (
          <View style={{ gap: 8 }}>
            <T muted size={12.5} weight="700">Balance received now?</T>
            <Chips options={opts([['', 'Not yet'], ['Cash', 'Full in cash'], ['UPI', 'Full by UPI']])} value={form.collect} onChange={setF('collect')} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
