import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from './store';
import { useTheme } from './theme';
import { Icon, T } from './components/ui';

// App lock. The PIN itself is never stored, only a SHA-256 hash of it.
export const hashPin = (pin) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 'regal-music-lock:' + String(pin));
export const PIN_LENGTH = 4;
const RELOCK_AFTER_MS = 60 * 1000; // lock again when the app was in the background for over a minute

export async function bioAvailable() {
  if (Platform.OS === 'web') return false;
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch (e) {
    return false;
  }
}

function PinPad({ onDigit, onBack, onBio }) {
  const c = useTheme();
  const key = (label, onPress, a11y) => (
    <Pressable
      key={a11y || label}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y || String(label)}
      style={({ pressed }) => ({ width: 76, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.plumBg : c.surface2 })}
    >
      {typeof label === 'string' ? <T size={26} weight="800">{label}</T> : label}
    </Pressable>
  );
  const rows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']];
  return (
    <View style={{ gap: 12, alignItems: 'center' }}>
      {rows.map((r) => <View key={r.join()} style={{ flexDirection: 'row', gap: 14 }}>{r.map((d) => key(d, () => onDigit(d)))}</View>)}
      <View style={{ flexDirection: 'row', gap: 14 }}>
        {onBio ? key(<Icon name="finger-print" size={28} color={c.accent} />, onBio, 'Use fingerprint') : <View style={{ width: 76 }} />}
        {key('0', () => onDigit('0'))}
        {key(<Icon name="backspace-outline" size={26} color={c.muted} />, onBack, 'Delete')}
      </View>
    </View>
  );
}

function LockScreen({ onUnlock }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { settings } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [bio, setBio] = useState(false);

  const tryBio = async () => {
    try {
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock ' + (settings.name || 'the app'), cancelLabel: 'Use PIN' });
      if (r.success) onUnlock();
    } catch (e) {}
  };
  useEffect(() => {
    (async () => {
      const ok = settings.lockBio && (await bioAvailable());
      setBio(ok);
      if (ok) tryBio();
    })();
  }, []);

  const digit = async (d) => {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === PIN_LENGTH) {
      if ((await hashPin(next)) === settings.lockPin) onUnlock();
      else { setError('Wrong PIN. Try again.'); setTimeout(() => setPin(''), 350); }
    }
  };

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: 22, paddingTop: insets.top, paddingBottom: insets.bottom, zIndex: 1000 }}>
      <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: c.plumBg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="lock-closed" size={30} color={c.accent} />
      </View>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <T size={20} weight="800">{settings.name || 'Locked'}</T>
        <T muted>{'Enter your ' + PIN_LENGTH + '-digit PIN'}</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 14 }} accessibilityLabel={pin.length + ' of ' + PIN_LENGTH + ' digits entered'}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View key={i} style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: i < pin.length ? (error ? c.bad : c.accent) : 'transparent', borderWidth: 2, borderColor: error ? c.bad : c.accent }} />
        ))}
      </View>
      <T size={13} weight="700" color={c.bad} style={{ minHeight: 18 }}>{error}</T>
      <PinPad onDigit={digit} onBack={() => setPin((s) => s.slice(0, -1))} onBio={bio ? tryBio : null} />
    </View>
  );
}

// Wraps the app: shows the lock screen on start and after a minute in the background.
export function LockGate({ children }) {
  const { settings } = useStore();
  const enabled = !!settings.lockPin;
  const [locked, setLocked] = useState(enabled);
  const away = useRef(0);

  useEffect(() => { if (!enabled) setLocked(false); }, [enabled]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'background' || st === 'inactive') away.current = Date.now();
      else if (st === 'active' && enabled && away.current && Date.now() - away.current > RELOCK_AFTER_MS) setLocked(true);
    });
    return () => sub.remove();
  }, [enabled]);

  return (
    <View style={{ flex: 1 }}>
      {/* Hide the app content while locked so nothing shows behind the PIN pad. */}
      <View style={{ flex: 1, opacity: locked ? 0 : 1 }} pointerEvents={locked ? 'none' : 'auto'} importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}>
        {children}
      </View>
      {locked ? <LockScreen onUnlock={() => setLocked(false)} /> : null}
    </View>
  );
}

export { PinPad };
