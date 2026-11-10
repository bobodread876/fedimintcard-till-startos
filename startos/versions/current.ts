import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.0:4',
  releaseNotes: {
    en_US:
      'POS phones take card payments on their own when they cannot reach the till: the phone shows "Paid offline" and sends the payment to the till as soon as it reaches it again. This needs the Fedimint Card POS app from the same release on each phone. After updating, let the till run online for a minute, then open the POS app on each phone while it can reach the till: the phone fetches what it needs to take payments offline, good for a week and renewed on its own.',
    es_ES:
      'Los teléfonos POS cobran con tarjeta por su cuenta cuando no pueden conectar con la caja: el teléfono muestra "Pagado sin conexión" y envía el pago a la caja en cuanto vuelve a conectar con ella. Hace falta la app Fedimint Card POS de la misma versión en cada teléfono. Después de actualizar, deje la caja en línea un minuto y abra la app POS en cada teléfono mientras pueda conectar con la caja: el teléfono descarga lo que necesita para cobrar sin conexión, válido una semana y renovado por sí solo.',
    de_DE:
      'POS-Telefone nehmen Kartenzahlungen selbst an, wenn sie die Kasse nicht erreichen: Das Telefon zeigt „Offline bezahlt“ und sendet die Zahlung an die Kasse, sobald es sie wieder erreicht. Dafür braucht jedes Telefon die Fedimint Card POS-App derselben Version. Lassen Sie die Kasse nach dem Update eine Minute online laufen und öffnen Sie dann die POS-App auf jedem Telefon, solange es die Kasse erreicht: Das Telefon holt sich, was es für Zahlungen offline braucht, eine Woche gültig und von selbst erneuert.',
    pl_PL:
      'Telefony POS same przyjmują płatności kartą, gdy nie mogą połączyć się z kasą: telefon pokazuje „Opłacono offline” i wysyła płatność do kasy, gdy tylko znów się z nią połączy. Wymaga to aplikacji Fedimint Card POS z tej samej wersji na każdym telefonie. Po aktualizacji zostaw kasę online na minutę, a potem otwórz aplikację POS na każdym telefonie, gdy ma połączenie z kasą: telefon pobiera to, czego potrzebuje do przyjmowania płatności offline, ważne tydzień i odnawiane samoczynnie.',
    fr_FR:
      "Les téléphones POS encaissent eux-mêmes les paiements par carte quand ils ne joignent pas la caisse : le téléphone affiche « Payé hors ligne » et envoie le paiement à la caisse dès qu'il la joint de nouveau. Il faut l'application Fedimint Card POS de la même version sur chaque téléphone. Après la mise à jour, laissez la caisse en ligne une minute, puis ouvrez l'application POS sur chaque téléphone tant qu'il joint la caisse : le téléphone récupère ce qu'il lui faut pour encaisser hors ligne, valable une semaine et renouvelé de lui-même.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
