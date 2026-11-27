// App language. English text in the screens is looked up here when Odia is chosen
// (Settings → Appearance → Language). Text that is not in the list stays in English.
// Bills, receipts and the PDF stay in English, except the Odia rules you write yourself.

const OR = {
  // Tabs, headers
  Home: 'ମୂଳପୃଷ୍ଠା', Bookings: 'ବୁକିଂ', Staff: 'କର୍ମଚାରୀ', Payments: 'ପେମେଣ୍ଟ', Bills: 'ବିଲ୍',
  Booking: 'ବୁକିଂ', 'New booking': 'ନୂଆ ବୁକିଂ', 'Edit booking': 'ବୁକିଂ ସମ୍ପାଦନା', 'Business details': 'ବ୍ୟବସାୟ ବିବରଣୀ',
  'Receipt preview': 'ରସିଦ ପ୍ରିଭ୍ୟୁ', 'Payment receipt': 'ପେମେଣ୍ଟ ରସିଦ', Calendar: 'କ୍ୟାଲେଣ୍ଡର', Customers: 'ଗ୍ରାହକ',
  Customer: 'ଗ୍ରାହକ', Stock: 'ଷ୍ଟକ୍', 'Stock item': 'ଷ୍ଟକ୍ ସାମଗ୍ରୀ', 'Add stock item': 'ଷ୍ଟକ୍ ସାମଗ୍ରୀ ଯୋଡନ୍ତୁ', 'Edit item': 'ସାମଗ୍ରୀ ସମ୍ପାଦନା',
  'Profit & loss': 'ଲାଭ ଓ କ୍ଷତି', Expense: 'ଖର୍ଚ୍ଚ', 'Add expense': 'ଖର୍ଚ୍ଚ ଯୋଡନ୍ତୁ', 'Edit expense': 'ଖର୍ଚ୍ଚ ସମ୍ପାଦନା',
  'Add staff': 'କର୍ମଚାରୀ ଯୋଡନ୍ତୁ', 'Edit staff': 'କର୍ମଚାରୀ ସମ୍ପାଦନା', Payment: 'ପେମେଣ୍ଟ', 'Pay staff': 'ମଜୁରି ଦିଅନ୍ତୁ', 'Add work / wage': 'କାମ / ମଜୁରି ଯୋଡନ୍ତୁ',

  // Home
  'What do you want to do?': 'ଆପଣ କ’ଣ କରିବାକୁ ଚାହାଁନ୍ତି?', 'Customers owe you': 'ଗ୍ରାହକଙ୍କଠାରୁ ବାକି',
  'Customer, date & advance': 'ଗ୍ରାହକ, ତାରିଖ ଓ ଅଗ୍ରିମ', 'Staff & pay': 'କର୍ମଚାରୀ ଓ ମଜୁରି', 'No upcoming programmes': 'ଆଗାମୀ ପ୍ରୋଗ୍ରାମ ନାହିଁ',
  'Bass, line array, cords…': 'ବାସ୍, ଲାଇନ୍ ଆରେ, କର୍ଡ…', Upcoming: 'ଆଗାମୀ', 'All bookings': 'ସମସ୍ତ ବୁକିଂ', 'Ready to bill': 'ବିଲ୍ ପାଇଁ ପ୍ରସ୍ତୁତ',
  'Low stock': 'ଷ୍ଟକ୍ କମ୍', 'All stock': 'ସମସ୍ତ ଷ୍ଟକ୍', 'Set up your business': 'ଆପଣଙ୍କ ବ୍ୟବସାୟ ସେଟ୍ କରନ୍ତୁ',
  'Add your name, phone numbers, address and bill rules': 'ନାମ, ଫୋନ୍ ନମ୍ବର, ଠିକଣା ଓ ବିଲ୍ ନିୟମ ଯୋଡନ୍ତୁ', 'Takes about 2 minutes': 'ପ୍ରାୟ ୨ ମିନିଟ୍ ଲାଗେ',
  'No upcoming bookings': 'ଆଗାମୀ ବୁକିଂ ନାହିଁ', '+ New booking': '+ ନୂଆ ବୁକିଂ',
  'Add your next programme with the customer’s details, timing and advance.': 'ଗ୍ରାହକଙ୍କ ବିବରଣୀ, ସମୟ ଓ ଅଗ୍ରିମ ସହ ପରବର୍ତ୍ତୀ ପ୍ରୋଗ୍ରାମ ଯୋଡନ୍ତୁ।',

  // Bookings list, calendar, customers
  'Balance due': 'ବାକି ଟଙ୍କା', Done: 'ସମାପ୍ତ', Billed: 'ବିଲ୍ ହୋଇଛି', Cancelled: 'ବାତିଲ୍', All: 'ସମସ୍ତ',
  'No bookings here': 'ଏଠାରେ ବୁକିଂ ନାହିଁ', 'Try another filter.': 'ଅନ୍ୟ ଫିଲ୍ଟର୍ ଚେଷ୍ଟା କରନ୍ତୁ।', 'Add your first programme.': 'ଆପଣଙ୍କ ପ୍ରଥମ ପ୍ରୋଗ୍ରାମ ଯୋଡନ୍ତୁ।',
  'See free dates': 'ଖାଲି ତାରିଖ ଦେଖନ୍ତୁ', 'Repeat customers': 'ପୁରୁଣା ଗ୍ରାହକ', '+ New': '+ ନୂଆ',
  'No programmes': 'ପ୍ରୋଗ୍ରାମ ନାହିଁ', 'Free day': 'ଖାଲି ଦିନ', 'No programme booked on this date.': 'ଏହି ତାରିଖରେ କୌଣସି ପ୍ରୋଗ୍ରାମ ବୁକ୍ ହୋଇନାହିଁ।',
  '+ New booking on this day': '+ ଏହି ଦିନ ପାଇଁ ନୂଆ ବୁକିଂ', 'Double booked': 'ଦୁଇଥର ବୁକିଂ', Today: 'ଆଜି',
  'Two bookings on the same shift this day. Check you have enough equipment and staff.': 'ଏହି ଦିନ ସମାନ ସିଫ୍ଟରେ ଦୁଇଟି ବୁକିଂ ଅଛି। ଯଥେଷ୍ଟ ଉପକରଣ ଓ କର୍ମଚାରୀ ଅଛନ୍ତି କି ଦେଖନ୍ତୁ।',
  'Booked more than once': 'ଏକାଧିକ ଥର ବୁକ୍ କରିଛନ୍ତି', 'Balance due from customers': 'ଗ୍ରାହକଙ୍କଠାରୁ ବାକି ଟଙ୍କା', 'No customers yet': 'ଏପର୍ଯ୍ୟନ୍ତ ଗ୍ରାହକ ନାହାନ୍ତି',
  'Total business': 'ମୋଟ ବ୍ୟବସାୟ', WhatsApp: 'ହ୍ୱାଟସଆପ୍', 'No match': 'ମେଳ ଖାଉନାହିଁ', total: 'ମୋଟ',

  // Booking page
  'Fully paid': 'ସମ୍ପୂର୍ଣ୍ଣ ପୈଠ', 'Paid extra': 'ଅଧିକ ପୈଠ', 'Customer payment': 'ଗ୍ରାହକ ପେମେଣ୍ଟ', 'Package amount': 'ପ୍ୟାକେଜ୍ ରାଶି',
  'Bill total': 'ବିଲ୍ ମୋଟ', Balance: 'ବାକି', '+ Payment received': '+ ପେମେଣ୍ଟ ମିଳିଲା', '+ Extra charge': '+ ଅତିରିକ୍ତ ଚାର୍ଜ',
  Discount: 'ରିହାତି', 'Staff on this programme': 'ଏହି ପ୍ରୋଗ୍ରାମର କର୍ମଚାରୀ', '+ Assign staff': '+ କର୍ମଚାରୀ ଦିଅନ୍ତୁ', '+ Add staff': '+ କର୍ମଚାରୀ ଯୋଡନ୍ତୁ',
  'No staff assigned': 'କୌଣସି କର୍ମଚାରୀ ଦିଆଯାଇନାହିଁ', 'Assign staff': 'କର୍ମଚାରୀ ଦିଅନ୍ତୁ', Assign: 'ଦିଅନ୍ତୁ', wage: 'ମଜୁରି',
  '+ Add work with a different wage': '+ ଭିନ୍ନ ମଜୁରି ସହ କାମ ଯୋଡନ୍ତୁ', 'Equipment & stock': 'ଉପକରଣ ଓ ଷ୍ଟକ୍', '+ Add': '+ ଯୋଡନ୍ତୁ',
  'No equipment added': 'କୌଣସି ଉପକରଣ ଯୋଡାଯାଇନାହିଁ', 'Tap for checklist': 'ଚେକ୍‌ଲିଷ୍ଟ ପାଇଁ ଟ୍ୟାପ୍ କରନ୍ତୁ', 'To load': 'ଲୋଡ୍ କରିବାକୁ', Sent: 'ପଠାଗଲା',
  'Not loaded yet': 'ଏପର୍ଯ୍ୟନ୍ତ ଲୋଡ୍ ହୋଇନାହିଁ', 'Sent to programme': 'ପ୍ରୋଗ୍ରାମକୁ ପଠାଗଲା', 'Came back OK': 'ଠିକ୍ ଫେରିଲା', Damaged: 'କ୍ଷତିଗ୍ରସ୍ତ',
  'Save checklist': 'ଚେକ୍‌ଲିଷ୍ଟ ସେଭ୍ କରନ୍ତୁ', 'Open stock item': 'ଷ୍ଟକ୍ ସାମଗ୍ରୀ ଖୋଲନ୍ତୁ', Expenses: 'ଖର୍ଚ୍ଚ', '+ Add expense': '+ ଖର୍ଚ୍ଚ ଯୋଡନ୍ତୁ',
  'No expenses yet': 'ଏପର୍ଯ୍ୟନ୍ତ ଖର୍ଚ୍ଚ ନାହିଁ', Profit: 'ଲାଭ', Loss: 'କ୍ଷତି', '− Staff wages': '− କର୍ମଚାରୀ ମଜୁରି', '− Expenses': '− ଖର୍ଚ୍ଚ',
  '− Stock used': '− ବ୍ୟବହୃତ ଷ୍ଟକ୍', 'Kept from customer': 'ଗ୍ରାହକଠାରୁ ରଖାଗଲା', 'Finalise & create bill': 'ଚୂଡାନ୍ତ କରି ବିଲ୍ ତିଆରି କରନ୍ତୁ',
  'Preview receipt': 'ରସିଦ ଦେଖନ୍ତୁ', 'Mark programme done': 'ପ୍ରୋଗ୍ରାମ ସମାପ୍ତ କରନ୍ତୁ', 'Cancel booking': 'ବୁକିଂ ବାତିଲ୍ କରନ୍ତୁ',
  'Restore booking': 'ବୁକିଂ ଫେରାଇ ଆଣନ୍ତୁ', 'Reopen booking': 'ବୁକିଂ ପୁଣି ଖୋଲନ୍ତୁ', 'Send confirmation': 'ନିଶ୍ଚିତକରଣ ପଠାନ୍ତୁ',
  'Balance reminder': 'ବାକି ଟଙ୍କା ମନେପକାନ୍ତୁ', Edit: 'ସମ୍ପାଦନା', 'Sound setup': 'ସାଉଣ୍ଡ ସେଟଅପ୍', Effects: 'ଇଫେକ୍ଟ',
  Mobile: 'ମୋବାଇଲ୍', Aadhaar: 'ଆଧାର', Notes: 'ଟିପ୍ପଣୀ', Note: 'ଟିପ୍ପଣୀ', Age: 'ବୟସ', Address: 'ଠିକଣା',
  'Payment received': 'ପେମେଣ୍ଟ ମିଳିଲା', 'Add payment': 'ପେମେଣ୍ଟ ଯୋଡନ୍ତୁ', 'Extra charge': 'ଅତିରିକ୍ତ ଚାର୍ଜ', 'Add charge': 'ଚାର୍ଜ ଯୋଡନ୍ତୁ',
  'Create bill': 'ବିଲ୍ ତିଆରି କରନ୍ତୁ', 'Received so far': 'ଏପର୍ଯ୍ୟନ୍ତ ମିଳିଛି', 'Balance received now?': 'ବାକି ଟଙ୍କା ଏବେ ମିଳିଲା କି?',
  'Not yet': 'ଏପର୍ଯ୍ୟନ୍ତ ନୁହେଁ', 'Full in cash': 'ସମ୍ପୂର୍ଣ୍ଣ ନଗଦ', 'Full by UPI': 'ସମ୍ପୂର୍ଣ୍ଣ UPI ରେ', Reserve: 'ସଂରକ୍ଷଣ', 'Use from stock': 'ଷ୍ଟକ୍‌ରୁ ବ୍ୟବହାର',
  'Add equipment or stock': 'ଉପକରଣ ବା ଷ୍ଟକ୍ ଯୋଡନ୍ତୁ', Item: 'ସାମଗ୍ରୀ', Quantity: 'ପରିମାଣ', Booked: 'ବୁକ୍ ହୋଇଛି', 'Programme done': 'ପ୍ରୋଗ୍ରାମ ସମାପ୍ତ',

  // Booking form
  'Sl. No.': 'କ୍ରମିକ ନଂ', Segment: 'ବିଭାଗ', Event: 'ଅନୁଷ୍ଠାନ', Name: 'ନାମ', 'Father’s name': 'ପିତାଙ୍କ ନାମ', 'Mobile No.': 'ମୋବାଇଲ୍ ନଂ',
  'Aadhaar No.': 'ଆଧାର ନଂ', 'PAN (optional)': 'PAN (ଇଚ୍ଛାଧୀନ)', Programme: 'ପ୍ରୋଗ୍ରାମ', 'Programme date': 'ପ୍ରୋଗ୍ରାମ ତାରିଖ',
  'Booking date': 'ବୁକିଂ ତାରିଖ', 'Day / Night': 'ଦିନ / ରାତି', Night: 'ରାତି', Day: 'ଦିନ', From: 'କେଉଁଠାରୁ', To: 'କେଉଁଠାକୁ',
  'Start time': 'ଆରମ୍ଭ ସମୟ', 'End time': 'ଶେଷ ସମୟ', 'Programme type': 'ପ୍ରୋଗ୍ରାମ ପ୍ରକାର', Competition: 'ପ୍ରତିଯୋଗିତା',
  'Non-competition': 'ଅଣ-ପ୍ରତିଯୋଗିତା', Amount: 'ରାଶି', 'Total amount (₹)': 'ମୋଟ ରାଶି (₹)', 'Advance (₹)': 'ଅଗ୍ରିମ (₹)',
  'Save booking': 'ବୁକିଂ ସେଭ୍ କରନ୍ତୁ', 'Save changes': 'ପରିବର୍ତ୍ତନ ସେଭ୍ କରନ୍ତୁ', 'Delete booking': 'ବୁକିଂ ଡିଲିଟ୍ କରନ୍ତୁ',
  'Fill in their details': 'ତାଙ୍କ ବିବରଣୀ ଭରନ୍ତୁ', Date: 'ତାରିଖ', 'Amount (₹)': 'ରାଶି (₹)', Wedding: 'ବିବାହ', 'Barat procession': 'ବରଯାତ୍ରୀ',
  'Puja / Bhasani': 'ପୂଜା / ଭସାଣି', Birthday: 'ଜନ୍ମଦିନ', Party: 'ପାର୍ଟି', Other: 'ଅନ୍ୟ',
  'You can still save. Make sure you have enough equipment and staff for both.': 'ତଥାପି ସେଭ୍ କରିପାରିବେ। ଉଭୟ ପାଇଁ ଯଥେଷ୍ଟ ଉପକରଣ ଓ କର୍ମଚାରୀ ଅଛନ୍ତି ବୋଲି ନିଶ୍ଚିତ କରନ୍ତୁ।',
  'Set how many of each go to the programme. 0 means not included. Both lists print on the bill.': 'ପ୍ରତ୍ୟେକ କେତୋଟି ଯିବ ସେଟ୍ କରନ୍ତୁ। 0 ମାନେ ନାହିଁ। ଉଭୟ ତାଲିକା ବିଲ୍‌ରେ ଛପାଯିବ।',

  // Expenses, reports
  'Expense type': 'ଖର୍ଚ୍ଚ ପ୍ରକାର', 'For booking': 'ବୁକିଂ ପାଇଁ', 'Change booking': 'ବୁକିଂ ବଦଳାନ୍ତୁ', 'Expense for booking': 'ବୁକିଂ ପାଇଁ ଖର୍ଚ୍ଚ',
  'Not for a booking': 'ବୁକିଂ ପାଇଁ ନୁହେଁ', 'Delete expense': 'ଖର୍ଚ୍ଚ ଡିଲିଟ୍ କରନ୍ତୁ', Cash: 'ନଗଦ', 'Bank transfer': 'ବ୍ୟାଙ୍କ ଟ୍ରାନ୍ସଫର୍',
  Month: 'ମାସ', Year: 'ବର୍ଷ', 'Profit this month': 'ଏହି ମାସର ଲାଭ', 'Loss this month': 'ଏହି ମାସର କ୍ଷତି', 'Profit this year': 'ଏହି ବର୍ଷର ଲାଭ',
  'Loss this year': 'ଏହି ବର୍ଷର କ୍ଷତି', 'Profit this day': 'ଏହି ଦିନର ଲାଭ', 'Loss this day': 'ଏହି ଦିନର କ୍ଷତି', Income: 'ଆୟ',
  'Profit by month': 'ମାସ ଅନୁସାରେ ଲାଭ', 'Profit by day': 'ଦିନ ଅନୁସାରେ ଲାଭ', 'Where the money went': 'ଟଙ୍କା କେଉଁଠି ଗଲା',
  'Total expenses': 'ମୋଟ ଖର୍ଚ୍ଚ', 'Expenses entered': 'ଲେଖାଯାଇଥିବା ଖର୍ଚ୍ଚ', 'Back to today': 'ଆଜିକୁ ଫେରନ୍ତୁ', 'Staff wages': 'କର୍ମଚାରୀ ମଜୁରି',
  'Stock used': 'ବ୍ୟବହୃତ ଷ୍ଟକ୍', Repairs: 'ମରାମତି', 'No bookings': 'ବୁକିଂ ନାହିଁ', 'No expenses entered': 'କୌଣସି ଖର୍ଚ୍ଚ ଲେଖାଯାଇନାହିଁ', profit: 'ଲାଭ', loss: 'କ୍ଷତି',

  // Staff
  'Total wages to pay': 'ଦେବାକୁ ଥିବା ମୋଟ ମଜୁରି', 'To pay': 'ଦେବାକୁ', 'Advance given': 'ଅଗ୍ରିମ ଦିଆଯାଇଛି', Earned: 'ଅର୍ଜିତ', Ledger: 'ହିସାବ',
  '+ Add work': '+ କାମ ଯୋଡନ୍ତୁ', 'to pay': 'ଦେବାକୁ', settled: 'ସମାଧାନ', 'advance given': 'ଅଗ୍ରିମ ଦିଆଯାଇଛି', earned: 'ଅର୍ଜିତ', paid: 'ପୈଠ',
  Role: 'ଭୂମିକା', 'Full name': 'ପୂରା ନାମ', 'Pay details': 'ମଜୁରି ବିବରଣୀ', 'Rate (₹)': 'ଦର (₹)', Working: 'କାମରେ', Inactive: 'ନିଷ୍କ୍ରିୟ',
  'Staff member': 'କର୍ମଚାରୀ', 'No staff yet': 'ଏପର୍ଯ୍ୟନ୍ତ କର୍ମଚାରୀ ନାହାନ୍ତି', '+ Add staff work': '+ କର୍ମଚାରୀ କାମ ଯୋଡନ୍ତୁ',

  // Stock
  Items: 'ସାମଗ୍ରୀ', 'Pieces in repair': 'ମରାମତିରେ ଥିବା ଖଣ୍ଡ', 'Stock value': 'ଷ୍ଟକ୍ ମୂଲ୍ୟ', 'Recent stock changes': 'ସାମ୍ପ୍ରତିକ ଷ୍ଟକ୍ ପରିବର୍ତ୍ତନ',
  'No stock items yet': 'ଏପର୍ଯ୍ୟନ୍ତ ଷ୍ଟକ୍ ସାମଗ୍ରୀ ନାହିଁ', '+ Add item': '+ ସାମଗ୍ରୀ ଯୋଡନ୍ତୁ', usable: 'ବ୍ୟବହାରଯୋଗ୍ୟ', 'in stock': 'ଷ୍ଟକ୍‌ରେ',
  '+ Stock in': '+ ଷ୍ଟକ୍ ଆସିଲା', 'Send for repair': 'ମରାମତିକୁ ପଠାନ୍ତୁ', 'Back from repair': 'ମରାମତିରୁ ଫେରିଲା', 'Correct count': 'ସଂଖ୍ୟା ଠିକ୍ କରନ୍ତୁ',
  'Total owned': 'ମୋଟ ଅଛି', History: 'ଇତିହାସ', Equipment: 'ଉପକରଣ', Consumable: 'ବ୍ୟବହାର ସାମଗ୍ରୀ', Category: 'ବର୍ଗ', Unit: 'ୟୁନିଟ୍',
  'Item name': 'ସାମଗ୍ରୀ ନାମ', 'Add item': 'ସାମଗ୍ରୀ ଯୋଡନ୍ତୁ', 'Delete item': 'ସାମଗ୍ରୀ ଡିଲିଟ୍ କରନ୍ତୁ',

  // Bill screen, receipts
  'Share bill as PDF': 'ବିଲ୍ PDF ଭାବେ ପଠାନ୍ତୁ', Print: 'ପ୍ରିଣ୍ଟ୍', 'Send as text': 'ଲେଖା ଭାବେ ପଠାନ୍ତୁ', 'Share receipt as PDF': 'ରସିଦ PDF ଭାବେ ପଠାନ୍ତୁ',
  'Making PDF…': 'PDF ତିଆରି ହେଉଛି…',

  // Settings
  Appearance: 'ଦେଖାଣ', Light: 'ହାଲୁକା', Dark: 'ଗାଢ଼', 'Follow phone': 'ଫୋନ୍ ଅନୁସାରେ', Language: 'ଭାଷା',
  'Business name': 'ବ୍ୟବସାୟ ନାମ', Tagline: 'ଟ୍ୟାଗଲାଇନ୍', 'Regd. No. (optional)': 'ପଞ୍ଜୀକରଣ ନଂ (ଇଚ୍ଛାଧୀନ)', 'Mobile numbers': 'ମୋବାଇଲ୍ ନମ୍ବର',
  'UPI ID': 'UPI ID', 'Save business details': 'ବ୍ୟବସାୟ ବିବରଣୀ ସେଭ୍ କରନ୍ତୁ', 'Bill rules': 'ବିଲ୍ ନିୟମ', 'Rules heading': 'ନିୟମ ଶୀର୍ଷକ',
  'Privacy & app lock': 'ଗୋପନୀୟତା ଓ ଆପ୍ ଲକ୍', 'Set a PIN': 'PIN ସେଟ୍ କରନ୍ତୁ', 'Change PIN': 'PIN ବଦଳାନ୍ତୁ', 'Turn off': 'ବନ୍ଦ କରନ୍ତୁ',
  'Turn on app lock': 'ଆପ୍ ଲକ୍ ଚାଲୁ କରନ୍ତୁ', 'Turn off app lock': 'ଆପ୍ ଲକ୍ ବନ୍ଦ କରନ୍ତୁ', 'Save new PIN': 'ନୂଆ PIN ସେଭ୍ କରନ୍ତୁ', Cancel: 'ବାତିଲ୍',
  'Current PIN': 'ବର୍ତ୍ତମାନର PIN', 'Repeat PIN': 'PIN ପୁଣି ଦିଅନ୍ତୁ', 'Full number': 'ପୂରା ନମ୍ବର', 'Last 4 digits only': 'କେବଳ ଶେଷ ୪ ଅଙ୍କ',
  'Aadhaar number on bills and receipts': 'ବିଲ୍ ଓ ରସିଦରେ ଆଧାର ନମ୍ବର', 'PIN only': 'କେବଳ PIN', 'Allow fingerprint': 'ଫିଙ୍ଗରପ୍ରିଣ୍ଟ ଅନୁମତି',
  'Receipt colour': 'ରସିଦ ରଙ୍ଗ', 'Authorised signature': 'ଅଧିକୃତ ଦସ୍ତଖତ', 'Upload signature': 'ଦସ୍ତଖତ ଅପଲୋଡ୍ କରନ୍ତୁ',
  'Change signature': 'ଦସ୍ତଖତ ବଦଳାନ୍ତୁ', Remove: 'ହଟାନ୍ତୁ', Backup: 'ବ୍ୟାକଅପ୍', 'Send backup': 'ବ୍ୟାକଅପ୍ ପଠାନ୍ତୁ',
  'Restore from pasted backup': 'ପେଷ୍ଟ କରାଯାଇଥିବା ବ୍ୟାକଅପ୍‌ରୁ ଫେରାନ୍ତୁ', 'Title printed under the line': 'ରେଖା ତଳେ ଛପା ଶୀର୍ଷକ',
  Proprietor: 'ମାଲିକ', Manager: 'ମ୍ୟାନେଜର୍',

  // Lock screen
  Locked: 'ଲକ୍ ହୋଇଛି', 'Enter your 4-digit PIN': 'ଆପଣଙ୍କ ୪-ଅଙ୍କ PIN ଦିଅନ୍ତୁ', 'Wrong PIN. Try again.': 'ଭୁଲ୍ PIN। ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।',

  // Documents, numbers, slots
  Documents: 'ଡକ୍ୟୁମେଣ୍ଟ', 'Add document': 'ଡକ୍ୟୁମେଣ୍ଟ ଯୋଡନ୍ତୁ', 'No documents': 'କୌଣସି ଡକ୍ୟୁମେଣ୍ଟ ନାହିଁ', 'What is it?': 'ଏହା କ’ଣ?',
  'Aadhaar copy': 'ଆଧାର କପି', Agreement: 'ଚୁକ୍ତିନାମା', 'Payment proof': 'ପେମେଣ୍ଟ ପ୍ରମାଣ', 'Programme photo': 'ପ୍ରୋଗ୍ରାମ ଫଟୋ',
  'Take photo': 'ଫଟୋ ଉଠାନ୍ତୁ', 'Choose from photos': 'ଫଟୋରୁ ବାଛନ୍ତୁ', 'Delete document': 'ଡକ୍ୟୁମେଣ୍ଟ ଡିଲିଟ୍ କରନ୍ତୁ', Share: 'ସେୟାର୍',
  'Note (optional)': 'ଟିପ୍ପଣୀ (ଇଚ୍ଛାଧୀନ)', 'Document added': 'ଡକ୍ୟୁମେଣ୍ଟ ଯୋଡାଗଲା', 'Document removed': 'ଡକ୍ୟୁମେଣ୍ଟ ହଟାଗଲା',
  'Other numbers': 'ଅନ୍ୟ ନମ୍ବର', '+ Add another number': '+ ଆଉ ଏକ ନମ୍ବର ଯୋଡନ୍ତୁ', 'Main number (WhatsApp)': 'ମୁଖ୍ୟ ନମ୍ବର (ହ୍ୱାଟସଆପ୍)',
  'One programme in the day and one at night on the same date is fine.': 'ଏକା ତାରିଖରେ ଦିନରେ ଗୋଟିଏ ଓ ରାତିରେ ଗୋଟିଏ ପ୍ରୋଗ୍ରାମ ଠିକ୍ ଅଛି।',

  // Reminders, attendance, advances, bill photos
  Reminders: 'ସ୍ମାରକ', 'Today & tomorrow': 'ଆଜି ଓ କାଲି', 'Collect balance': 'ବାକି ଟଙ୍କା ଆଦାୟ', Tomorrow: 'କାଲି', due: 'ବାକି',
  'Remind me the evening before at': 'ପୂର୍ବ ସନ୍ଧ୍ୟାରେ ମନେପକାନ୍ତୁ', 'Balance reminder the morning after': 'ପରଦିନ ସକାଳେ ବାକି ଟଙ୍କା ମନେପକାନ୍ତୁ', On: 'ଚାଲୁ', Off: 'ବନ୍ଦ',
  Attendance: 'ଉପସ୍ଥାନ', 'Monthly attendance': 'ମାସିକ ଉପସ୍ଥାନ', 'All staff': 'ସମସ୍ତ କର୍ମଚାରୀ', 'Give advance': 'ଅଗ୍ରିମ ଦିଅନ୍ତୁ',
  'Wage payment': 'ମଜୁରି ପେମେଣ୍ଟ', Advance: 'ଅଗ୍ରିମ', 'Record advance': 'ଅଗ୍ରିମ ଲେଖନ୍ତୁ', 'Record payment': 'ପେମେଣ୍ଟ ଲେଖନ୍ତୁ',
  'Earned so far': 'ଏପର୍ଯ୍ୟନ୍ତ ଅର୍ଜିତ', '− Wages paid': '− ପୈଠ ମଜୁରି', '− Advances given': '− ଦିଆଯାଇଥିବା ଅଗ୍ରିମ', 'To pay now': 'ଏବେ ଦେବାକୁ',
  'Advance still to recover': 'ଫେରସ୍ତ ବାକି ଅଗ୍ରିମ', 'Taken from next wages': 'ପରବର୍ତ୍ତୀ ମଜୁରିରୁ କଟାଯିବ', 'Wages earned': 'ଅର୍ଜିତ ମଜୁରି', 'Paid this month': 'ଏହି ମାସ ପୈଠ',
  'Staff programmes this month': 'ଏହି ମାସର କର୍ମଚାରୀ ପ୍ରୋଗ୍ରାମ', 'of which advances': 'ସେଥିରୁ ଅଗ୍ରିମ', advance: 'ଅଗ୍ରିମ',
  'Bill photo (optional)': 'ବିଲ୍ ଫଟୋ (ଇଚ୍ଛାଧୀନ)', 'Bill photo': 'ବିଲ୍ ଫଟୋ', 'Remove photo': 'ଫଟୋ ହଟାନ୍ତୁ',

  // Common messages
  'Booking saved': 'ବୁକିଂ ସେଭ୍ ହେଲା', 'Booking updated': 'ବୁକିଂ ଅପଡେଟ୍ ହେଲା', 'Payment recorded': 'ପେମେଣ୍ଟ ଲେଖାଗଲା', 'Expense added': 'ଖର୍ଚ୍ଚ ଯୋଡାଗଲା',
  'Expense removed': 'ଖର୍ଚ୍ଚ ହଟାଗଲା', 'Staff assigned': 'କର୍ମଚାରୀ ଦିଆଗଲା', 'Checklist saved': 'ଚେକ୍‌ଲିଷ୍ଟ ସେଭ୍ ହେଲା', 'Business details saved': 'ବ୍ୟବସାୟ ବିବରଣୀ ସେଭ୍ ହେଲା',
  Delete: 'ଡିଲିଟ୍', 'Tap again to delete': 'ଡିଲିଟ୍ ପାଇଁ ପୁଣି ଟ୍ୟାପ୍ କରନ୍ତୁ', 'Tap again to cancel': 'ବାତିଲ୍ ପାଇଁ ପୁଣି ଟ୍ୟାପ୍ କରନ୍ତୁ', Close: 'ବନ୍ଦ', Save: 'ସେଭ୍',
};

let current = 'en';
export const setLang = (l) => { current = l === 'or' ? 'or' : 'en'; };
export const getLang = () => current;

// Translate one piece of text. Keeps a trailing " *" (required) and " (D.M.YYYY)" hint.
export function tr(s, lang = current) {
  if (lang !== 'or' || typeof s !== 'string' || !s.trim()) return s;
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
  const core = s.trim();
  if (OR[core]) return lead + OR[core] + trail;
  const m = core.match(/^(.*?)( \(D\.M\.YYYY\))?( \*)?$/);
  if (m && (m[2] || m[3]) && OR[m[1]]) return lead + OR[m[1]] + (m[2] || '') + (m[3] || '') + trail;
  return s;
}

// Translate React children: strings (and arrays of strings) only; anything else passes through.
export function trChildren(children, lang = current) {
  if (lang !== 'or') return children;
  if (typeof children === 'string') return tr(children, lang);
  if (Array.isArray(children)) return children.map((c) => (typeof c === 'string' ? tr(c, lang) : c));
  return children;
}

export const LANGS = [['en', 'English'], ['or', 'ଓଡ଼ିଆ']];
