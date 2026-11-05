export const DEFAULT_LANG = 'en_US'

const dict = {
  // interfaces.ts
  'Till API': 0,
  'The API the Fedimint Card POS apps call, card link included. Pair a phone with the Pair a POS action; every request needs the POS token.': 1,

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
  'Show the pairing QR code to scan in the POS app (Settings, Pair with till). Every phone paired with this till shares one token.': 31,
  "That address is no longer one of this till's addresses. Open the action again.": 32,
  "In the POS app open Settings, then Pair with till, and scan this code. It carries the till's POS token: show it only to phones you trust. To unpair every phone, run Rotate POS token.": 33,

  // actions/rotatePosToken.ts
  'Rotate POS token': 34,
  'Replace the POS token. Every paired phone stops working until it is paired again.': 35,
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
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
