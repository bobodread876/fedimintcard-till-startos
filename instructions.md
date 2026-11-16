# Fedimint Card Till

Phones running the Fedimint Card POS app connect to this till to charge cards. The till needs a
wallet in your federation, and it needs to be connected to the fedimintcard registry, which you
approve from the provisioner app you already use.

## Documentation

- [Till API](https://github.com/fedimintcard/fedimintcard/blob/main/docs/TILL-API.md) — what the till does on each request, and its error codes.
- [POS link](https://github.com/fedimintcard/fedimintcard/blob/main/docs/POS-LINK.md) — how a POS phone pairs with the till and carries the card.

## What you get on StartOS

- A till with its own Fedimint wallet. Every sale is paid into it.
- One interface, **Till API**, that the POS phones call.
- Card payments the POS phones take on their own when they cannot reach the till, sent to the
  till when they reach it again.
- Card top-ups at the POS: the holder pays a Lightning invoice the phone shows, and the till
  loads the money onto the card. Your federation needs a Lightning gateway for this.
- Actions to join a federation, connect to the registry, and pair phones by QR code.

## Getting set up

1. **Run Join federation.** Paste your federation's invite code (`fed11…`). A guardian's
   **Connect a Client** screen shows it. Then start the service.
2. **Run Connect to registry.** Give the till a name you will recognise, and leave the registry
   URL as it is unless you run your own registry. The result shows a QR code and a short code.
3. **Approve it in the provisioner app.** Open **Settings**, then **Tills**, then **Add a till**,
   scan the QR code (or type the code), check the name, and tap **Approve**. Do this within 10
   minutes, with the service running. Within a few seconds the **Registry** check shows
   **Connected** and your federation's name.
4. **Give the till a public address.** On the **Till API** interface, add a public domain on your
   StartTunnel gateway (for example `till.example.com`) and choose **Let's Encrypt**, so phones
   trust its certificate. Point the domain's DNS at the StartTunnel server as StartOS asks.
5. **Pair each phone.** Run **Pair a POS**, choose the public domain, and in the POS app open
   **Settings**, then **Pair with till**, and scan the code.

A LAN address works only on a phone that trusts your server's root certificate (StartOS shows
how to download it), and only while the phone is on the same network. The public domain needs
neither.

## Using Fedimint Card Till

### Till API

The POS app does all the talking. A phone that is not paired, or that was unpaired, gets
"unauthorized" from every request.

### Offline payments

Cards set up with the current Fedimint Card Setup app (applet 3.0) can pay when the till cannot
reach the internet. The POS shows **Paid offline**; the till keeps the signed payment and
sends it to the registry and the federation once it is online again, on its own, within about
30 seconds. Let the till run online for a minute after installing, so it can fetch what it
needs to check cards offline. Older cards keep working online only.

Online taps also prepare spare slots on each card, so it has room for change when offline.

**POS phones offline.** A phone with the current Fedimint Card POS app takes the card payment
itself when it cannot reach the till, shows **Paid offline**, and sends the payment to the till
as soon as it reaches it again; from then on it is sent on like the till's own. For that, open
the app on each phone once while it can reach the till: it fetches an offline kit, good for a
week and renewed on its own, and refuses offline payments without one ("No offline kit yet"). A
phone's offline payments count toward the till's offline limits.

**A lost or wiped phone.** Payments a phone took offline and never sent to the till are lost
with the phone, and so is the money for those sales, up to the till's offline limits. Before you
wipe a phone or reinstall the app, open the app while it can reach the till and wait until its
**Settings** show "0 waiting to sync". The cards the phone charged keep working: at a card's
next online tap the till sets aside the money those payments used, and the POS shows what the
card can still pay. 37 days later, once the federation confirms that money was never spent, it
goes back to the card over its next two online taps.

### Actions

- **Pair a POS** — shows the pairing code again, for a new phone or one that was reset. Every
  phone shares the same code, so show it only to phones you trust.
- **Rotate POS token** — unpairs every phone, for a lost phone or a code that was seen by someone
  else. Start the service and pair your phones again afterwards.
- **Connect to registry** — run it again if the request expired before you approved it, or if
  you revoked this till in the provisioner app (charges fail until it is connected again). A
  connected till keeps working on its old token until the new request is approved.
- **Join federation** — only once. A till stays with the federation it joined; for another
  federation, install another till.

The till also connects to your federation's guardians, to the registry, to your federation's
Lightning gateways when a card is topped up, and to mempool.space for the newest Bitcoin block
header (the clock for the cards' daily offline limit). If you publish the till through
StartTunnel to keep your home IP private, send its outbound traffic through the tunnel too, or
all of them see your home IP.

## Limitations

The money from sales stays in the till's wallet. There is no action yet to move it out.

A payment taken offline is the merchant's risk until the till sends it: a card copied by an
attacker could spend the same money elsewhere first. Genuine cards cannot: each note on the card
signs one payment, ever.
