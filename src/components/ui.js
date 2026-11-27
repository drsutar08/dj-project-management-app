import React, { useState } from 'react';
import {
  View, Text, Pressable, TextInput, ScrollView, StyleSheet, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, tone, shadow } from '../theme';
import { dmy, parseDate } from '../utils';
import { useStore } from '../store';
import { tr, trChildren } from '../i18n';

// Current app language ('en' or 'or'), from Settings.
export const useLang = () => (useStore() || {}).settings?.lang || 'en';

// One icon component for the whole app, so every icon is centred and sized the same way.
// Names are Ionicons (https://icons.expo.fyi); prefix with "mci:" for a MaterialCommunityIcons name.
export function Icon({ name, size = 20, color, style }) {
  const c = useTheme();
  if (String(name).startsWith('mci:')) return <MaterialCommunityIcons name={name.slice(4)} size={size} color={color || c.fg} style={style} />;
  return <Ionicons name={name} size={size} color={color || c.fg} style={style} />;
}

export function Screen({ children, scroll = true, pad = true }) {
  const c = useTheme();
  const Body = scroll ? ScrollView : View;
  return (
    <Body
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={scroll ? { padding: pad ? 16 : 0, paddingBottom: 120, gap: 18 } : undefined}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </Body>
  );
}

export function T({ style, muted, weight, size, color, children, ...rest }) {
  const c = useTheme();
  const lang = useLang();
  children = trChildren(children, lang);
  return (
    <Text
      style={[
        { color: color || (muted ? c.muted : c.fg), fontSize: size || 15, fontWeight: weight || '400' },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function H2({ children, right, onRight }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <T size={17} weight="800" style={{ letterSpacing: -0.3 }}>{children}</T>
      {right ? <LinkBtn onPress={onRight}>{right}</LinkBtn> : null}
    </View>
  );
}

export function LinkBtn({ children, onPress }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <T color={c.plum} weight="700" size={13}>{children}</T>
    </Pressable>
  );
}

// Small pill button for the top-right of a screen header (Edit, + Add…), kept clear of the edge.
export function HeaderBtn({ title, onPress }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      style={({ pressed }) => ({ marginRight: 16, backgroundColor: c.plumBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}
    >
      <T color={c.plum} weight="800" size={13}>{title}</T>
    </Pressable>
  );
}

export function Card({ children, style }) {
  const c = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: c.line }, shadow, style]}>{children}</View>;
}

export function Btn({ title, onPress, variant = 'primary', style, disabled }) {
  const c = useTheme();
  const v = {
    primary: { bg: c.accent, fg: c.accentInk },
    secondary: { bg: c.plumBg, fg: c.plum },
    danger: { bg: c.badBg, fg: c.bad },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: v.bg, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
          alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        variant === 'primary' && shadow,
        variant === 'primary' && { shadowColor: c.accent, shadowOpacity: 0.25 },
        style,
      ]}
    >
      <T color={v.fg} weight="800" style={{ textAlign: 'center' }}>{title}</T>
    </Pressable>
  );
}

// Danger button that needs a second tap.
export function ConfirmBtn({ title, confirmTitle, onConfirm, style }) {
  const [armed, setArmed] = useState(false);
  return (
    <Btn
      variant="danger"
      style={style}
      title={armed ? confirmTitle || 'Tap again to confirm' : title}
      onPress={() => {
        if (armed) onConfirm();
        else {
          setArmed(true);
          setTimeout(() => setArmed(false), 3500);
        }
      }}
    />
  );
}

export function BtnRow({ children }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{React.Children.map(children, (ch) => ch && <View style={{ flexGrow: 1, flexBasis: 140 }}>{ch}</View>)}</View>;
}

export function List({ children }) {
  const c = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ backgroundColor: c.surface, borderRadius: 20, paddingVertical: 4, overflow: 'hidden', borderWidth: 1, borderColor: c.line }, shadow]}>
      {items.map((ch, i) => (
        <View key={i}>
          {i > 0 && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginLeft: 72, marginRight: 14 }} />}
          {ch}
        </View>
      ))}
    </View>
  );
}

export function Row({ left, title, sub, right, rightSub, rightColor, onPress, extra }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14,
        backgroundColor: pressed ? c.surface2 : 'transparent',
      })}
    >
      {left}
      <View style={{ flex: 1, minWidth: 0 }}>
        <T weight="700" numberOfLines={1}>{title}</T>
        {sub ? <T muted size={12.5} numberOfLines={1} style={{ marginTop: 1 }}>{sub}</T> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <T weight="800" color={rightColor} style={{ fontVariant: ['tabular-nums'] }}>{right}</T>
        {typeof rightSub === 'string' ? <T muted size={11.5} weight="600" style={{ marginTop: 3 }}>{rightSub}</T> : rightSub}
      </View>
      {extra}
    </Pressable>
  );
}

// Square badge at the start of a list row: an icon, a short text (initials), or a date (top + bottom).
export function Tile({ top, bottom, icon, t = 'plum' }) {
  const c = useTheme();
  const k = tone(c, t);
  return (
    <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: k.bg, alignItems: 'center', justifyContent: 'center' }}>
      {icon ? <Icon name={icon} size={21} color={k.fg} /> : <T color={k.fg} weight="800" size={bottom ? 18 : 15}>{top}</T>}
      {bottom ? <T color={k.fg} weight="800" size={10} style={{ letterSpacing: 0.6 }}>{bottom.toUpperCase()}</T> : null}
    </View>
  );
}

export function Pill({ label, t = 'plum' }) {
  const c = useTheme();
  const k = tone(c, t);
  return (
    <View style={{ backgroundColor: k.bg, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-end' }}>
      <T color={k.fg} size={11} weight="700">{label}</T>
    </View>
  );
}

export function Empty({ title, text, action, onAction }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
      <T weight="800" size={16} style={{ marginBottom: 4, textAlign: 'center' }}>{title}</T>
      {text ? <T muted style={{ textAlign: 'center' }}>{text}</T> : null}
      {action ? <Btn title={action} onPress={onAction} style={{ marginTop: 14, alignSelf: 'stretch' }} /> : null}
    </Card>
  );
}

export function MoneyRow({ label, value, color, total, onRemove }) {
  const c = useTheme();
  return (
    <View
      style={[
        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
        total && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line, paddingTop: 10 },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        <T weight={total ? '800' : '500'} size={total ? 17 : 15} style={{ flexShrink: 1 }}>{label}</T>
        {onRemove ? <RemoveBtn onPress={onRemove} /> : null}
      </View>
      <T weight="800" size={total ? 17 : 15} color={color} style={{ fontVariant: ['tabular-nums'] }}>{value}</T>
    </View>
  );
}

export function RemoveBtn({ onPress }) {
  const c = useTheme();
  const [armed, setArmed] = useState(false);
  return (
    <Pressable
      hitSlop={8}
      onPress={() => {
        if (armed) onPress();
        else {
          setArmed(true);
          setTimeout(() => setArmed(false), 3000);
        }
      }}
      style={{ backgroundColor: armed ? c.badBg : c.surface2, borderRadius: 9, height: 28, minWidth: 28, paddingHorizontal: armed ? 8 : 0, alignItems: 'center', justifyContent: 'center' }}
    >
      {armed ? <T color={c.bad} weight="800" size={12}>Delete</T> : <Icon name="close" size={16} color={c.muted} />}
    </Pressable>
  );
}

// One line with a name and a − count + control. 0 means "not included".
export function QtyRow({ label, value, onChange, unit, step = 1 }) {
  const c = useTheme();
  const v = Number(value) || 0;
  const btn = (icon, d, a11y, disabled) => (
    <Pressable
      onPress={() => onChange(Math.max(0, Math.round((v + d * step) * 100) / 100))}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={a11y + ' ' + label}
      style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: v ? c.plumBg : c.surface2, opacity: disabled ? 0.35 : pressed ? 0.7 : 1 })}
    >
      <Icon name={icon} size={18} color={v ? c.accent : c.muted} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
      <T weight={v ? '800' : '600'} color={v ? c.fg : c.muted} style={{ flex: 1 }}>{label}</T>
      {btn('remove', -1, 'Less', !v)}
      <View style={{ minWidth: unit ? 56 : 26, alignItems: 'center' }}>
        <T weight="800" size={16} style={{ textAlign: 'center', fontVariant: ['tabular-nums'] }} color={v ? c.accent : c.muted}>
          {v}{unit ? <T size={12} weight="700" color={v ? c.accent : c.muted}> {unit}</T> : null}
        </T>
      </View>
      {btn('add', 1, 'More', false)}
    </View>
  );
}

export function KV({ rows }) {
  return (
    <View style={{ gap: 10 }}>
      {rows.filter((r) => r[1]).map(([k, v]) => (
        <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14 }}>
          <T muted>{k}</T>
          <T weight="700" style={{ flexShrink: 1, textAlign: 'right' }}>{v}</T>
        </View>
      ))}
    </View>
  );
}

export function Chips({ options, value, onChange, multi, scroll }) {
  const c = useTheme();
  const isOn = (o) => (multi ? (value || []).includes(o.value) : value === o.value);
  const content = options.map((o) => {
    const on = isOn(o);
    return (
      <Pressable
        key={o.value}
        onPress={() => {
          if (!multi) return onChange(o.value);
          const set = new Set(value || []);
          on ? set.delete(o.value) : set.add(o.value);
          onChange(options.map((x) => x.value).filter((x) => set.has(x)));
        }}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          borderRadius: multi ? 12 : 99, paddingHorizontal: 14, paddingVertical: 9,
          backgroundColor: on ? (multi ? c.plumBg : c.fg) : c.surface2,
          borderWidth: 1.5, borderColor: on && multi ? c.accent : 'transparent',
        }}
      >
        {multi && on ? <Icon name="checkmark" size={15} color={c.accent} /> : null}
        <T weight="700" size={13} color={on ? (multi ? c.fg : c.bg) : c.muted}>{o.label}</T>
      </Pressable>
    );
  });
  if (scroll)
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
        {content}
      </ScrollView>
    );
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{content}</View>;
}
export const opts = (arr) => arr.map((x) => (Array.isArray(x) ? { value: x[0], label: x[1] } : { value: x, label: x }));

export function Field({ label, value, onChangeText, required, multiline, keyboardType, placeholder, style, autoCapitalize, secureTextEntry, maxLength }) {
  const c = useTheme();
  const lang = useLang();
  const [focus, setFocus] = useState(false);
  return (
    <View style={[{ gap: 6, flex: 1, minWidth: 0 }, style]}>
      {label ? <T muted size={12.5} weight="700">{label + (required ? ' *' : '')}</T> : null}
      <TextInput
        value={value == null ? '' : String(value)}
        onChangeText={onChangeText}
        placeholder={tr(placeholder, lang)}
        placeholderTextColor={c.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        accessibilityLabel={label || placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          backgroundColor: focus ? c.surface : c.surface2, color: c.fg, borderRadius: 14,
          paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
          borderWidth: 1.5, borderColor: focus ? c.accent : 'transparent',
          minHeight: multiline ? 84 : undefined, textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

function DateHint() {
  const c = useTheme();
  return <T size={12} color={c.bad}>Write the date like 15.2.2027</T>;
}

// Date field: type 15.2.2027, stored as 2027-02-15.
export function DateField({ label, value, onChange, required }) {
  const [txt, setTxt] = useState(dmy(value));
  const parsed = parseDate(txt);
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Field
        label={label + ' (D.M.YYYY)'}
        required={required}
        value={txt}
        keyboardType="numbers-and-punctuation"
        placeholder="15.2.2027"
        onChangeText={(t) => {
          setTxt(t);
          const p = parseDate(t);
          if (p !== null) onChange(p);
        }}
      />
      {parsed === null ? <DateHint /> : null}
    </View>
  );
}

export function FRow({ children }) {
  return <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>;
}

export function FSec({ children }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <T weight="800" size={13}>{children}</T>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.line }} />
    </View>
  );
}

export function Sheet({ visible, title, onClose, children, okTitle = 'Save', onOk }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(14,8,20,0.5)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', paddingBottom: insets.bottom }}>
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View style={{ width: 40, height: 5, borderRadius: 9, backgroundColor: c.line }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6 }}>
            <T size={20} weight="800" style={{ flex: 1, letterSpacing: -0.4 }}>{title}</T>
            <Pressable onPress={onClose} hitSlop={10} style={{ backgroundColor: c.surface2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
              <T weight="700" size={13}>Close</T>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {onOk ? (
            <View style={{ padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }}>
              <Btn title={okTitle} onPress={onOk} />
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Lightweight toast shown at the bottom of the screen.
let toastSetter = null;
export function ToastHost() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState('');
  toastSetter = setMsg;
  if (!msg) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 96, alignItems: 'center' }}>
      <View style={{ backgroundColor: c.fg, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12, maxWidth: '90%' }}>
        <T color={c.bg} weight="700">{msg}</T>
      </View>
    </View>
  );
}
let toastTimer;
export function toast(m) {
  if (!toastSetter) return;
  toastSetter(m);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastSetter && toastSetter(''), 2600);
}

// Green WhatsApp button (full) or icon-only (compact, for list rows).
export function WhatsAppBtn({ title, onPress, compact }) {
  const c = useTheme();
  const bg = c.dark ? '#103a24' : '#e3f8ec';
  const fg = c.dark ? '#5fe39a' : '#0b8a44';
  if (compact)
    return (
      <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={title || 'Send on WhatsApp'}
        style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 11, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
        <Icon name="logo-whatsapp" size={19} color={fg} />
      </Pressable>
    );
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: bg, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14, opacity: pressed ? 0.8 : 1 })}>
      <Icon name="logo-whatsapp" size={20} color={fg} />
      <T weight="800" color={fg} style={{ textAlign: 'center' }}>{title}</T>
    </Pressable>
  );
}
