/* Filipino: Documents list, Request a document, Printing, Check a document, Ask Kap. */

const KAP_OFFLINE_EN =
  "**I can't connect right now. Here are the basics:**\n\n" +
  '• **Barangay Clearance:** ₱50.00. Free for first-time job seekers. Bring a valid ID.\n' +
  '• **Certificate of Residency:** Bring proof that you live in the barangay.\n' +
  '• **Certificate of Indigency:** Free. For medical or money help.\n' +
  '• **Pick up documents:** Weekdays, 1:00 PM to 4:00 PM at the barangay hall.\n' +
  '• **Hall hours:** Weekdays, 8:00 AM to 5:00 PM.';

const KAP_OFFLINE_FIL =
  '**Hindi ako makakonekta ngayon. Narito ang mga pangunahing kailangan mo:**\n\n' +
  '• **Barangay Clearance:** ₱50.00. Libre para sa first-time job seeker. Magdala ng valid ID.\n' +
  '• **Certificate of Residency:** Magdala ng patunay na nakatira ka sa barangay.\n' +
  '• **Certificate of Indigency:** Libre. Para sa tulong medikal o pinansyal.\n' +
  '• **Pagkuha ng dokumento:** Lunes hanggang Biyernes, 1:00 PM hanggang 4:00 PM sa barangay hall.\n' +
  '• **Oras ng hall:** Lunes hanggang Biyernes, 8:00 AM hanggang 5:00 PM.';

export default {
  /* Shared bits */
  Free: 'Libre',
  'Ready same day': 'Handa sa araw ding iyon',
  'Ready in {time}': 'Handa sa loob ng {time}',
  Document: 'Dokumento',
  Name: 'Pangalan',
  Purok: 'Purok',
  For: 'Para sa',
  Back: 'Bumalik',
  Continue: 'Tuloy',
  Done: 'Tapos na',
  'Tracking number': 'Tracking number',

  /* Documents list */
  Documents: 'Mga dokumento',
  'Request online. Pick up at the hall.': 'Mag-request online. Kunin sa hall.',
  'Search documents': 'Maghanap ng dokumento',
  '1 document': '1 dokumento',
  '{count} documents': '{count} dokumento',
  'No documents found': 'Walang nakitang dokumento',
  'Try another word.': 'Subukan ang ibang salita.',
  'Clear search': 'Burahin ang hinanap',

  /* Request a document: steps */
  'About you': 'Tungkol sa iyo',
  'Pick-up day': 'Araw ng pagkuha',
  'Your ID': 'Ang ID mo',
  'Check and send': 'Suriin at ipadala',

  /* Purposes */
  Employment: 'Trabaho',
  'Scholarship or school requirement': 'Scholarship o requirement sa paaralan',
  'Bank or loan requirement': 'Requirement sa bangko o loan',
  'Government ID application': 'Pag-apply ng government ID',
  'Medical or financial assistance': 'Tulong medikal o pinansyal',
  Other: 'Iba pa',

  /* Free-of-charge reasons */
  'First-time jobseeker': 'First-time jobseeker',
  'Senior citizen': 'Senior citizen',
  'Low-income (indigent) family': 'Mahirap na pamilya (indigent)',
  'Person with disability (PWD)': 'May kapansanan (PWD)',

  /* Request a document: fields */
  'Full name': 'Buong pangalan',
  'Mobile number': 'Mobile number',
  "We text you when it's ready.": 'Ite-text ka namin kapag handa na.',
  'What is it for?': 'Para saan ito?',
  'Tell us what it is for': 'Sabihin kung para saan ito',
  'Weekdays, 1:00 PM to 4:00 PM.': 'Lunes hanggang Biyernes, 1:00 PM hanggang 4:00 PM.',
  'I may get it free': 'Baka libre ito para sa akin',
  'Staff check at the hall.': 'Titingnan ito ng staff sa hall.',
  'Which one are you?': 'Alin ka rito?',
  'Photo of a valid ID': 'Litrato ng valid ID',
  'JPG, PNG or PDF, up to 5 MB. Bring the same ID.': 'JPG, PNG o PDF, hanggang 5 MB. Dalhin ang parehong ID.',
  'Take a photo or choose a file': 'Kumuha ng litrato o pumili ng file',
  'Please fix the fields marked below.': 'Pakiayos ang mga may marka sa ibaba.',

  /* Request a document: summary */
  Mobile: 'Mobile',
  'Pick up on': 'Kukunin sa',
  ID: 'ID',
  Cost: 'Bayad',
  'Free ({reason})': 'Libre ({reason})',
  '{fee}, pay at the hall': '{fee}, bayaran sa hall',
  'What to bring': 'Mga dadalhin',
  'I agree to share these details with the hall': 'Pumapayag akong ibigay ang mga detalyeng ito sa hall',
  'Only hall staff can see them.': 'Staff lang ng hall ang makakakita nito.',
  'Send request': 'Ipadala ang request',

  /* Request a document: errors */
  'Enter your full name.': 'Ilagay ang buong pangalan mo.',
  'Enter your mobile number.': 'Ilagay ang mobile number mo.',
  'Enter an 11-digit number that starts with 09.': 'Maglagay ng 11-digit na numero na nagsisimula sa 09.',
  'Tell us what the document is for.': 'Sabihin kung para saan ang dokumento.',
  'Choose the day you want to pick it up.': 'Piliin ang araw na kukunin mo ito.',
  'Choose today or a later date.': 'Pumili ng petsa ngayon o sa susunod na araw.',
  'Choose a weekday (Monday to Friday).': 'Pumili ng araw mula Lunes hanggang Biyernes.',
  'Upload a photo or scan of a valid ID.': 'Mag-upload ng litrato o scan ng valid ID.',
  'Upload a JPG, PNG or PDF file.': 'Mag-upload ng JPG, PNG o PDF na file.',
  'Upload a file that is 5 MB or smaller.': 'Mag-upload ng file na 5 MB o mas maliit.',
  'Tick the box to agree before you send.': 'I-tsek muna ang kahon bago ipadala.',

  /* Request a document: sent */
  'Sent!': 'Naipadala na!',
  "We'll text you when it's ready.": 'Ite-text ka namin kapag handa na.',
  '{date}, 1:00 PM to 4:00 PM': '{date}, 1:00 PM hanggang 4:00 PM',
  Bring: 'Dalhin',
  'Your ID and {fee}': 'Ang ID mo at {fee}',
  'See my requests': 'Tingnan ang mga request ko',

  /* Printing */
  Printing: 'Pag-print',
  'Free. Pick up at the hall.': 'Libre. Kunin sa hall.',
  "Sent! We'll let you know when it's ready.": 'Naipadala na! Sasabihan ka namin kapag handa na.',
  'Tracking number {ref}': 'Tracking number {ref}',
  'Your file': 'Ang file mo',
  File: 'File',
  'PDF or Word, up to 10 MB.': 'PDF o Word, hanggang 10 MB.',
  Pages: 'Pahina',
  'We counted {n}.': '{n} ang nabilang namin.',
  Copies: 'Kopya',
  'Print options': 'Paano ipi-print',
  'Paper size': 'Laki ng papel',
  'Most common': 'Pinakakaraniwan',
  'Short bond': 'Short bond',
  'Long bond': 'Long bond',
  Color: 'Kulay',
  'Black and white': 'Black and white',
  'Print on': 'I-print sa',
  'One side': 'Isang side',
  'Both sides': 'Magkabilang side',
  '{n} page': '{n} pahina',
  '{n} pages': '{n} pahina',
  '{n} copies': '{n} kopya',
  '{pages}, free.': '{pages}, libre.',
  'Pick up weekdays, 1:00 PM to 4:00 PM.': 'Kunin Lunes hanggang Biyernes, 1:00 PM hanggang 4:00 PM.',
  'Add your file and the number of pages.': 'Ilagay ang file mo at ang bilang ng pahina.',
  'Please fix the fields marked above.': 'Pakiayos ang mga may marka sa itaas.',
  'Send to print': 'Ipadala para i-print',
  'My prints': 'Mga pina-print ko',
  'Choose the file you want printed.': 'Piliin ang file na gusto mong ipa-print.',
  'Upload a PDF or Word file.': 'Mag-upload ng PDF o Word na file.',
  'Upload a file that is 10 MB or smaller.': 'Mag-upload ng file na 10 MB o mas maliit.',
  'Enter the number of pages, from 1 to 500.': 'Ilagay ang bilang ng pahina, mula 1 hanggang 500.',
  'Enter how many copies, from 1 to 50.': 'Ilagay kung ilang kopya, mula 1 hanggang 50.',

  /* Check a document */
  'Check a document': 'Suriin ang dokumento',
  'See if a paper from the hall is real.': 'Alamin kung totoo ang papel mula sa hall.',
  'Code on the document': 'Code sa dokumento',
  'It starts with VER, below the QR code.': 'Nagsisimula ito sa VER, sa ilalim ng QR code.',
  'Try a sample': 'Subukan ang halimbawa',
  Check: 'Suriin',
  'Type the code from the document.': 'I-type ang code na nasa dokumento.',
  'Real document': 'Totoong dokumento',
  'Make sure these details match the paper.': 'Tiyaking tugma ang mga detalyeng ito sa papel.',
  'Not stated': 'Hindi nakasaad',
  Date: 'Petsa',
  'Signed by': 'Pinirmahan ni',
  Code: 'Code',
  'Not ready yet': 'Hindi pa handa',
  'This request is still being worked on. The paper is not valid yet.': 'Inaasikaso pa ang request na ito. Hindi pa valid ang papel.',
  'Not found': 'Hindi nakita',
  'That is a tracking number. Use the code that starts with VER.': 'Tracking number iyan. Gamitin ang code na nagsisimula sa VER.',
  "We couldn't find {code}. Check the code and try again, or ask at the hall.":
    'Hindi namin nakita ang {code}. Suriin ang code at subukan ulit, o magtanong sa hall.',

  /* Ask Kap */
  'Ask Kap': 'Tanungin si Kap',
  'Quick answers about papers, fees and hours.': 'Mabilis na sagot tungkol sa papeles, bayad at oras.',
  "Hi! I'm **Kap**. Ask me about papers, fees or office hours. English or Tagalog is fine.":
    'Hi! Ako si **Kap**. Magtanong tungkol sa papeles, bayad o oras ng opisina. Puwede ang English o Tagalog.',
  [KAP_OFFLINE_EN]: KAP_OFFLINE_FIL,
  'What do I bring for a clearance?': 'Ano ang dadalhin ko para sa clearance?',
  'Is the indigency certificate free?': 'Libre ba ang certificate of indigency?',
  'When is the hall open?': 'Kailan bukas ang hall?',
  'How do I report noise?': 'Paano mag-report ng ingay?',
  Conversation: 'Usapan',
  'You said:': 'Sabi mo:',
  'Kap said:': 'Sabi ni Kap:',
  'Check with the hall to be sure.': 'Magtanong sa hall para sigurado.',
  'Suggested questions': 'Mga puwedeng itanong',
  'Kap is typing…': 'Nagta-type si Kap…',
  'Your question': 'Ang tanong mo',
  'Type your question': 'I-type ang tanong mo',
  Send: 'Ipadala',
} as Record<string, string>;
