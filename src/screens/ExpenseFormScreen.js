import React, { useLayoutEffect, useState } from 'react';
import { View, Pressable, Image, Modal, Platform } from 'react-native';
import { Screen, Field, DateField, Chips, opts, Btn, BtnRow, ConfirmBtn, T, Icon, toast } from '../components/ui';
import { pickDocument, removeDocumentFile } from '../docs';
import { useStore, useSorted } from '../store';
import { MODES } from '../defaults';
import { useTheme } from '../theme';
import { dmy, n, today } from '../utils';

export default function ExpenseFormScreen({ navigation, route }) {
  const c = useTheme();
  const { expenses, settings, saveExpense, deleteExpense } = useStore();
  const { projects } = useSorted();
  const existing = route.params?.id ? expenses.find((x) => x.id === route.params.id) : null;
  const cats = settings.expenseCategories || [];
  const pre = route.params?.projectId ? projects.find((p) => p.id === route.params.projectId) : null;
  const [f, setF] = useState(
    existing
      ? { ...existing, amount: String(existing.amount || ''), photos: [...(existing.photos || [])] }
      : { amount: '', category: route.params?.category || cats[0] || 'Other', date: pre?.bookingDate || route.params?.date || today(), projectId: pre?.id || '', mode: 'Cash', note: '', photos: [] }
  );
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const [removed, setRemoved] = useState([]); // photo files to delete when saved
  const [view, setView] = useState(null);
  const [busy, setBusy] = useState(false);
  const addPhoto = async (fromCamera) => {
    setBusy(true);
    try {
      const d = await pickDocument(fromCamera);
      if (d) setF((s) => ({ ...s, photos: [...(s.photos || []), { id: d.id, uri: d.uri, date: today() }] }));
    } catch (e) {
      toast(e && e.message === 'camera-permission' ? 'Allow camera access in phone settings to take a photo.' : 'Couldn’t add that picture. Try another one.');
    } finally {
      setBusy(false);
    }
  };
  const removePhoto = (ph) => { setRemoved((r) => [...r, ph]); setF((s) => ({ ...s, photos: s.photos.filter((x) => x.id !== ph.id) })); setView(null); };
  const catOpts = f.category && !cats.includes(f.category) ? [...cats, f.category] : cats;

  useLayoutEffect(() => navigation.setOptions({ title: existing ? 'Edit expense' : 'Add expense' }), [navigation, existing]);

  // Recent bookings to pick from; the chosen one always stays in the list.
  const recent = projects.filter((p) => p.status !== 'cancel').slice().reverse().slice(0, 30);
  const chosen = f.projectId ? projects.find((p) => p.id === f.projectId) : null;
  if (chosen && !recent.includes(chosen)) recent.unshift(chosen);
  const projOpts = [['', 'Not for a booking'], ...recent.map((p) => [p.id, dmy(p.bookingDate) + ' · ' + p.customerName])];

  const onSave = () => {
    if (!(n(f.amount) > 0)) return toast('Enter an amount above zero.');
    saveExpense({
      ...(existing || {}),
      amount: n(f.amount), category: f.category || 'Other', date: f.date || today(),
      projectId: f.projectId || '', mode: f.mode || 'Cash', note: String(f.note || '').trim(),
      photos: f.photos || [],
    });
    removed.forEach((ph) => removeDocumentFile(ph));
    toast(existing ? 'Expense updated' : 'Expense added');
    navigation.goBack();
  };

  return (
    <Screen>
      {chosen ? (
        <View style={{ backgroundColor: c.heroBg, borderWidth: 1, borderColor: c.heroLine, borderRadius: 18, padding: 14, gap: 2 }}>
          <T muted size={12} weight="700">Expense for booking</T>
          <T size={16} weight="800" numberOfLines={1}>{chosen.customerName || 'Unnamed'}</T>
          <T muted size={12.5}>{[dmy(chosen.bookingDate), chosen.segment, chosen.eventType, 'Sl. No. ' + chosen.serial].filter(Boolean).join(' · ')}</T>
        </View>
      ) : null}
      <Field label="Amount (₹)" required value={f.amount} onChangeText={set('amount')} keyboardType="decimal-pad" />
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Expense type</T>
        <Chips options={opts(catOpts)} value={f.category} onChange={set('category')} />
      </View>
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">{chosen ? 'Change booking' : 'For booking'}</T>
        <Chips scroll options={opts(projOpts)} value={f.projectId} onChange={set('projectId')} />
        <T muted size={12.5}>
          {f.projectId
            ? 'Counted in this booking’s profit, on its programme date.'
            : 'A general business cost, counted on the date below.'}
        </T>
      </View>
      <DateField label="Date" value={f.date} onChange={set('date')} />
      <Chips options={opts(MODES)} value={f.mode} onChange={set('mode')} />
      <Field label="Note" value={f.note} onChangeText={set('note')} placeholder="Diesel for generator, pickup rent, lunch for team…" />

      {/* Photo of the bill / receipt for this expense */}
      <View style={{ gap: 8 }}>
        <T muted size={12.5} weight="700">Bill photo (optional)</T>
        {(f.photos || []).length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {f.photos.map((ph) => (
              <Pressable key={ph.id} onPress={() => setView(ph)} accessibilityRole="button" accessibilityLabel="Open bill photo">
                <Image source={{ uri: ph.uri }} style={{ width: 88, height: 88, borderRadius: 12, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line }} resizeMode="cover" />
              </Pressable>
            ))}
          </View>
        ) : null}
        <BtnRow>
          {Platform.OS !== 'web' ? <Btn variant="secondary" title={busy ? 'Opening…' : 'Take photo'} onPress={() => addPhoto(true)} disabled={busy} /> : null}
          <Btn variant="secondary" title={busy ? 'Opening…' : 'Choose from photos'} onPress={() => addPhoto(false)} disabled={busy} />
        </BtnRow>
      </View>

      <Modal visible={!!view} transparent animationType="fade" onRequestClose={() => setView(null)}>
        <View style={{ flex: 1, backgroundColor: '#0b0918', padding: 16, paddingTop: 48, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <T color="#ffffff" weight="800" size={17} style={{ flex: 1 }}>Bill photo</T>
            <Pressable onPress={() => setView(null)} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={22} color="#ffffff" />
            </Pressable>
          </View>
          {view ? <Image source={{ uri: view.uri }} style={{ flex: 1, width: '100%' }} resizeMode="contain" accessibilityLabel="Bill photo" /> : null}
          <ConfirmBtn title="Remove photo" confirmTitle="Tap again to remove" onConfirm={() => removePhoto(view)} />
        </View>
      </Modal>

      <Btn title={existing ? 'Save changes' : 'Add expense'} onPress={onSave} />
      {existing ? (
        <ConfirmBtn
          title="Delete expense"
          confirmTitle="Tap again to delete"
          onConfirm={() => {
            (existing.photos || []).forEach((ph) => removeDocumentFile(ph));
            deleteExpense(existing.id);
            toast('Expense deleted');
            navigation.goBack();
          }}
        />
      ) : null}
    </Screen>
  );
}
