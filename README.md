# Regal Music Manager — React Native (Expo) app

A phone app for Regal Music to manage:

- **Staff / labour**: name, role, mobile, pay type (per event / day / month / hour), rate, UPI or bank, Aadhaar, address.
- **Pay ledger**: wages earned per programme and every payment made, with the balance owed to each person.
- **Bookings (projects)**: the same details as the paper order receipt (Sl. No., father's name, Aadhaar, PAN, from/to, start/end time, Day/Night, effects, total, advance).
- **Customer payments**: extra charges, discount, payments received, balance, and margin after staff wages.
- **Stock / inventory**: equipment (speakers, lights, mixers, effect machines) and consumables (CO₂, paper spray, cold fire refills) with quantity, unit, category, cost and a low-stock alert. Record stock in, used / out, sent for repair, back from repair, and count corrections; every change is kept in the item's history.
- **Equipment on bookings**: reserve equipment for a programme and see if you are short that day; consumables used on a programme come out of stock.
- **Final bill**: "Finalise & create bill" makes a bill in the Regal Music receipt layout, which you can share as a PDF (WhatsApp, email), print, or send as text.
- **Settings**: business name, phones, address, effects list, segments, staff roles and the Odia rules printed on the bill, plus backup and restore.

All data is saved on the phone (AsyncStorage). Use **Settings → Send backup** now and then.

---

## 1. Run it on your phone (quickest)

You need a computer with **Node.js 20 or newer** (https://nodejs.org).

```bash
cd regal-music-app
npm install
npx expo install --fix      # aligns package versions with your Expo SDK
npx expo start
```

Install **Expo Go** from the Play Store or App Store, then scan the QR code shown in the terminal. The phone and computer must be on the same Wi-Fi.

## 2. Build an installable Android APK

```bash
npm install -g eas-cli
eas login                   # free Expo account
eas build -p android --profile preview
```

When the build finishes, EAS gives you a link to download the `.apk`. Open it on any Android phone to install. For the Play Store, use `eas build -p android --profile production` (this makes an `.aab`).

## 3. Project layout

```
App.js                      navigation (floating tab bar + stack screens)
src/defaults.js             business details, effects, Odia rules, starting data
src/store.js                data storage, backup/restore
src/utils.js                money, dates (D.M.YYYY), totals
src/theme.js                colours for light and dark mode
src/bill.js                 bill HTML for PDF / print, and WhatsApp text
src/components/ui.js        buttons, cards, fields, chips, bottom sheets, toast
src/components/rows.js      list rows for bookings, staff, ledger, bills
src/screens/*               Home, Bookings, Booking detail/form, Staff, Staff detail/form,
                            Payments, Pay/Work form, Stock, Stock item detail/form, Bills, Bill, Settings
```

## Notes

- Dates are typed like the receipt: `15.2.2027`.
- Change the app icon or splash by adding `assets/icon.png` and pointing to it from `app.json`.
- To add bill layouts for other segments (Sound, Lighting, Tent…), edit `src/bill.js`.
