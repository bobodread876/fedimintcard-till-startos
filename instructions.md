# Fedimint Card 4.0 Till

This till requires a Card 4.0 registry. It accepts Card 4.0 and compatible later 4.x cards only. Keep a 3.0 till for 3.0 cards or a 3.0 registry. The till supports Bitcoin mint v1 and mint v2. Card operations require a registry that supports the federation’s mint.

Phones running the Fedimint Card POS app connect to this till to charge cards. The till needs a
wallet in your federation, and it needs to be connected to the fedimintcard registry, which you
approve from the provisioner app you already use.

## Documentation

- [Till API](https://github.com/fedimintcard/fedimintcard/blob/main/docs/TILL-API.md) - what the till does on each request, and its error codes.
- [POS link](https://github.com/fedimintcard/fedimintcard/blob/main/docs/POS-LINK.md) - how a POS phone pairs with the till and carries the card.
- [Paying with a card](https://github.com/fedimintcard/fedimintcard/blob/main/docs/PAY.md) - how an app has the till pay a Lightning invoice with a card.

## What you get on StartOS

- A till with its own Fedimint wallet. Every sale is paid into it.
- **Till admin** for browser setup, sales and payouts, and **Till API** for paired phones.
- Card payments the POS phones take on their own when they cannot reach the till, sent to the
  till when they reach it again.
- Card top-ups at the POS: the holder pays a Lightning invoice the phone shows, and the till
  loads the money onto the card. Your federation needs a Lightning gateway for this.
- Pay by card, off until you turn it on: an app that pays with a card, such as the Forge app,
  can have the till charge a card and pay a Lightning invoice with what the card paid.
- Actions to join a federation, connect to the registry, and pair phones and paying apps by QR
  code.

## Getting set up

1. Start the service. In StartOS Actions open **Show admin password** and copy the password. Open **Till admin** over HTTPS and sign in.
2. Join your federation using the invite code from a guardian. Connect the till to the registry and enter a name you recognise.
3. In the provisioner app, open **Settings**, **Tills**, then **Add a till**. Scan the registry QR code, check the name and approve the claim within ten minutes.
4. In StartOS give **Till API** an address the phone trusts. For remote phones, use an HTTPS domain on your StartTunnel gateway.
5. In **Till admin**, open phone pairing. The QR code uses the **Till API** public HTTPS domain when available. On the LAN it prefers the published local network name. To pair over a VPN, use **Actions → Pair a POS** and choose its address. On the POS phone, open **Settings** and **Pair with till** and scan it.

A local HTTPS address requires the phone to trust your server's root certificate (StartOS shows
how to download it) and to be on the same network. The public domain needs
neither.

## Updating an existing till

Back up the service in StartOS, then install the updated package over **Fedimint Card 4.0 Till**. Start the service and open **Till admin**. An existing wallet opens with its saved federation, including a wallet whose first join already saved the invite. A new installation asks for a federation invite.

## Using Fedimint Card Till

### Till admin

Review sales and your balance. To receive proceeds over Lightning, choose and confirm a destination and payout settings. For a manual eCash withdrawal, open a receiving wallet in the same federation and claim the exported notes. Keep a current service backup.

### Till API

The POS app does all the talking. A phone that is not paired, or that was unpaired, gets
"unauthorized" from every request.

### Offline payments

Certified Card 4.0 cards set up with Fedimint Card Setup can pay when the till cannot
reach the internet. The POS shows **Paid offline**; the till keeps the signed payment and
sends it to the registry and the federation once it is online again, on its own, within about
30 seconds. Let the till run online for a minute after installing, so it can fetch what it
needs to check cards offline. For offline phone payments on a mint v2 federation, use a Card 4.0 POS app with mint v2 support.

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

### Pay by card

Off until you turn it on. With it on, someone using an app that pays with a card, such as the
Forge app on Android, holds a Fedimint card to their phone, and this till charges the card, with
its PIN, and pays a Lightning invoice from its wallet with what the card paid. The card pays the
till first; then the till pays the invoice.

1. Give the till a public address (step 4 above). A paying app takes only a public https
   address.
2. Run **Turn on pay by card**. The till restarts, and a **Pay by card** check appears. It
   should say **On**. If it says the federation has no Lightning module, this till cannot pay
   invoices.
3. Run **Pair a paying app**, choose the public domain, and give the code to the people who will
   pay this way. In the Forge app it goes under **Tap a Fedimint card**.

This code is not the POS code. It cannot take sales, read your sales or load cards, and a POS
phone refuses it. But anyone who has it can ask your till to charge a card they hold, with that
card's PIN, so give it only to people you want to let pay this way.

The till's limits apply: invoices up to 100,000 sats, 1,000,000 sats a day across all paying
apps, and a fee reserve of at most 1,000 sats a payment. What Lightning does not use of the
reserve stays in your till's wallet. If the till cannot pay an invoice after the card paid, what
the card paid stays in the till's wallet until the app puts it back on the same card.

**Turn off pay by card** stops new payments. Paying apps stay paired, so they can still check a
payment and get back one that failed. To unpair every paying app, run **Rotate pay token**, then
pair again the apps you still want.

### Actions

- **Pair a POS**: shows the pairing code for your POS phones again, for a new phone or one that
  was reset. Every POS phone shares the same code, so show it only to phones you trust.
- **Rotate POS token**: unpairs every POS phone, for a lost phone or a code that was seen by
  someone else. Start the service and pair your phones again afterwards. Paying apps stay paired.
- **Turn on pay by card** and **Turn off pay by card**: see Pay by card above.
- **Pair a paying app**: shows the code for apps that pay with a card. Offered while pay by card
  is on.
- **Rotate pay token**: unpairs every paying app, for a code that reached someone you did not
  mean to give it to. POS phones stay paired.
- **Connect to registry**: run it again if the request expired before you approved it, or if
  you revoked this till in the provisioner app (charges fail until it is connected again). A
  connected till keeps working on its old token until the new request is approved.
- **Join federation**: only once. A till stays with the federation it joined; for another
  federation, install another till.

The till also connects to your federation's guardians, to the registry, to your federation's
Lightning gateways when a card is topped up or pays an invoice, and to mempool.space for the newest Bitcoin block
header (the clock for the cards' daily offline limit). If you publish the till through
StartTunnel to keep your home IP private, send its outbound traffic through the tunnel too, or
all of them see your home IP.

## Limitations

A payment taken offline is the merchant's risk until the till sends it: a card copied by an
attacker could spend the same money elsewhere first. Genuine cards cannot: each note on the card
signs one payment, ever.

## Card top-ups

Use the updated Fedimint Card POS. When a customer chooses a top-up, POS shows the amount going onto the card, a fixed fee and the total for one Lightning payment. After payment, tap the card to load the quoted amount. The till can start with an empty wallet. Older paid top-ups keep the terms of their original invoice.
