import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.0:3',
  releaseNotes: {
    en_US:
      'Offline payments: cards set up from this version on can pay when the till has no internet. The payment shows as "Paid offline" and is sent once the till is online again. Online taps keep spare room on each card for change. Older cards keep working online.',
    es_ES:
      'Pagos sin conexión: las tarjetas configuradas desde esta versión pueden pagar cuando la caja no tiene internet. El pago aparece como "Pagado sin conexión" y se envía cuando la caja vuelve a estar en línea. Los toques en línea dejan espacio en cada tarjeta para el cambio. Las tarjetas anteriores siguen funcionando en línea.',
    de_DE:
      'Offline-Zahlungen: Karten, die ab dieser Version eingerichtet werden, können zahlen, wenn die Kasse kein Internet hat. Die Zahlung erscheint als „Offline bezahlt“ und wird gesendet, sobald die Kasse wieder online ist. Online-Tippen hält auf jeder Karte Platz für Wechselgeld frei. Ältere Karten funktionieren weiter online.',
    pl_PL:
      'Płatności offline: karty skonfigurowane od tej wersji mogą płacić, gdy kasa nie ma internetu. Płatność pojawia się jako „Opłacono offline” i jest wysyłana, gdy kasa znów jest online. Dotknięcia online zostawiają na każdej karcie miejsce na resztę. Starsze karty nadal działają online.',
    fr_FR:
      "Paiements hors ligne : les cartes configurées à partir de cette version peuvent payer quand la caisse n'a pas internet. Le paiement apparaît comme « Payé hors ligne » et est envoyé dès que la caisse est de nouveau en ligne. Les contacts en ligne gardent de la place sur chaque carte pour la monnaie. Les cartes plus anciennes continuent de fonctionner en ligne.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
