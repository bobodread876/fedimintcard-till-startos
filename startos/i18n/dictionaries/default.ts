export const DEFAULT_LANG = 'en_US'

const dict = {
  // interfaces.ts
  'Till API': 0,
  'The API the Fedimint Card POS apps call, card link included, and, with pay by card on, apps that pay with a card. Pair a POS phone with Pair a POS and a paying app with Pair a paying app; every request needs one of their tokens.': 1,

  // main.ts
  Till: 2,
  'Waiting for the till to start': 3,
  'The till answered HTTP ${status}': 4,
  'Ready for federation ${name}': 5,
  'The till is not answering': 6,

  // actions/joinFederation.ts
  'Invite code': 7,
  "The federation's invite code (fed11…), from a guardian's Connect a Client screen.": 8,
  'An invite code starts with fed11 or fedimint': 9,
  'Join federation': 10,
  "Make the till's wallet and join it to a Fedimint federation. Runs once: a till stays with the federation it joined.": 11,
  'This till has already joined a federation. A till cannot change federations; install a new one instead.': 12,
  'Joining the federation failed: ${detail}': 13,
  'Federation joined': 14,
  "The till's wallet is in the federation. Its secret is in the service's data, so keep StartOS backups of this service.": 15,

  // actions/connectRegistry.ts
  'Registry URL': 16,
  'The fedimintcard registry that holds your cards.': 17,
  'An https:// address with no path, like https://registry.fedimintcard.org': 18,

  // actions/pairPos.ts
  '${url} (public domain)': 24,
  '${url} (this network only)': 25,
  'Till address': 26,
  'The address the phone will use. Choose the public domain for phones away from this network.': 27,
  'No address yet': 28,
  'This till has no address a phone can reach yet. Add a domain to the Till API interface.': 29,
  'Pair a POS': 30,
  'Show the pairing code for the POS phones that take payments at this till, to scan in the POS app (Settings, Pair with till). Every POS phone shares one token. For an app that pays with a card, use Pair a paying app.': 31,
  "That address is no longer one of this till's addresses. Open the action again.": 32,
  "In the POS app open Settings, then Pair with till, and scan this code. It is for POS phones only. It carries the till's POS token: show it only to phones you trust. To unpair every POS phone, run Rotate POS token.": 33,

  // actions/rotatePosToken.ts
  'Rotate POS token': 34,
  'Replace the POS token. Every paired POS phone stops working until it is paired again. Paying apps are not affected.': 35,
  'Every POS phone paired with this till is unpaired. Pair each one again with Pair a POS.': 36,
  'POS token removed': 37,
  'The till makes a new token when it starts. Start the service, then pair each phone again with Pair a POS.': 38,

  // init/watchSetup.ts
  "Join a federation: the till's wallet lives there": 39,
  'Connect the till to the registry and approve it in the provisioner app': 41,

  // actions/connectRegistry.ts
  'Till name': 42,
  'What the operator sees in the provisioner app before approving, and how the till is listed there.': 43,
  'Connect to registry': 44,
  'Ask the fedimintcard registry for a till token. Shows a QR code and a code for the operator to approve in the provisioner app (Settings, Tills, Add a till).': 45,
  'This till is already connected. Once the new request is approved the till uses the new token; the old one keeps working until then.': 46,
  'Join a federation first': 47,
  'The registry did not take the request: ${detail}': 48,
  'The till printed no request code': 49,
  'Approve this till': 50,
  'In the provisioner app open Settings, then Tills, then Add a till, and scan the QR code or type the code. The request expires in 10 minutes. Keep the service running: the till picks up its token within seconds of the approval, and the Registry check turns green.': 51,
  'QR code': 52,
  Code: 53,

  // main.ts (the Registry check)
  Registry: 54,
  'Connected (federation ${name})': 55,
  'Waiting for approval in the provisioner app (code ${code})': 56,
  'The request expired before it was approved. Run Connect to registry again.': 57,
  'Not connected to a registry. Run Connect to registry.': 58,
  // main.ts (the Pay by card check)
  'Pay by card': 59,
  'There is no pay token. Turn pay by card off, then on again.': 60,
  'The till does not take the current pay token. Restart the service.': 61,
  'On: paired apps can pay with a card': 62,
  'The till started with pay by card off. Restart the service.': 63,
  "The till cannot pay Lightning invoices: its federation has no Lightning module the till's wallet can use.": 64,

  // actions/payByCard.ts
  'Turn off pay by card': 65,
  'Turn on pay by card': 66,
  'Let an app that pays with a card, such as the Forge app, ask this till to charge a card and pay a Lightning invoice with what the card paid. Off unless you turn it on.': 67,
  'Paying apps can no longer pay with a card at this till. They stay paired, so they can still look up a payment and get back one that failed. The till restarts if it is running.': 68,
  "Anyone you give the paying-app code to can ask this till to charge a card they hold, with that card's PIN, and pay a Lightning invoice from the till's wallet with what the card paid. The till's limits apply: at most 100,000 sats an invoice, 1,000,000 sats a day in all, and a fee reserve of at most 1,000 sats a payment, of which what Lightning does not use stays in the till's wallet. The till restarts if it is running.": 69,
  'Pay by card is off': 70,
  'To unpair the paying apps as well, run Rotate pay token.': 71,
  'Pay by card is on': 72,
  'Run Pair a paying app to show the code an app scans. The Pay by card check shows whether the till is ready to pay.': 73,

  // actions/pairPayApp.ts
  'The public https address the paying app will use. A paying app takes no plain http address.': 74,
  'This till has no public https address yet. Add a public domain to the Till API interface.': 75,
  'Pair a paying app': 76,
  'Show the code that an app that pays with a card scans, such as the Forge app. Not for POS phones: they pair with Pair a POS. Every paying app shares one token.': 77,
  'Turn on pay by card first': 78,
  'Pay by card is off. Run Turn on pay by card first.': 79,
  'The running till does not have this pay token yet. Restart the service, then run this action again.': 80,
  "In the app that pays with a card, scan this code or paste its text: in the Forge app on Android, Tap a Fedimint card. This code is for paying apps only; a POS phone refuses it. It carries the till's pay token: with it, an app can ask the till to charge a card it holds, with that card's PIN. To unpair every paying app, run Rotate pay token.": 81,

  // actions/rotatePayToken.ts
  'Rotate pay token': 82,
  'Replace the pay token. Every paired paying app stops working until it is paired again. POS phones are not affected.': 83,
  'Every paying app paired with this till is unpaired. Pair each one again with Pair a paying app. POS phones stay paired.': 84,
  'There is no pay token yet': 85,
  'Pay token replaced': 86,
  'The till takes the new token when it starts. Start the service, then pair each paying app again with Pair a paying app.': 87,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
