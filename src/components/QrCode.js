import React, { useMemo } from 'react';
import { View } from 'react-native';
import { qrMatrix } from '../upi';

// QR code drawn with plain views (no SVG library needed). Always black on white so any
// phone camera can scan it, in light and dark mode.
export default function QrCode({ value, size = 132 }) {
  const m = useMemo(() => qrMatrix(value), [value]);
  const n = m.length + 8; // quiet zone
  const cell = size / n;
  return (
    <View style={{ width: size, height: size, backgroundColor: '#ffffff', padding: cell * 4 }} accessibilityRole="image" accessibilityLabel="UPI QR code">
      {m.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', height: cell }}>
          {row.map((on, c) => <View key={c} style={{ width: cell, height: cell, backgroundColor: on ? '#000000' : '#ffffff' }} />)}
        </View>
      ))}
    </View>
  );
}
