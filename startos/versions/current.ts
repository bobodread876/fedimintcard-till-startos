import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.0:7',
  releaseNotes: {
    en_US:
      "Fixes sales that failed with \"has already signed another transaction\" on a card taken away in the middle of a payment the till took while offline: the card's next online sale settles that payment first, then goes through. A sale the POS sends again after it lost the answer is now answered from the till's own records, so the sale is never charged twice. When a payment would need too many of the card's notes at once, the till now says so plainly: spend a smaller amount, or pay another way. Now built on Fedimint v0.13.0, the final release (it was v0.13.0-beta.1). Full changes: https://github.com/fedimintcard/fedimintcard/compare/76f7b1e...b9f1f6f",
    es_ES:
      'Corrige las ventas que fallaban con "has already signed another transaction" en una tarjeta retirada en medio de un pago que la caja tomó sin conexión: la siguiente venta en línea de esa tarjeta liquida primero ese pago y después se cobra. Una venta que el POS reenvía porque perdió la respuesta se responde ahora con los registros de la propia caja, así que la venta nunca se cobra dos veces. Cuando un pago necesitaría demasiados billetes eCash de la tarjeta a la vez, la caja ahora lo dice claramente: gasta un importe menor o paga de otra forma. Ahora usa Fedimint v0.13.0, la versión final (antes v0.13.0-beta.1). Cambios completos: https://github.com/fedimintcard/fedimintcard/compare/76f7b1e...b9f1f6f',
    de_DE:
      'Behebt Verkäufe, die mit „has already signed another transaction“ scheiterten, bei einer Karte, die mitten in einer Zahlung weggenommen wurde, die die Kasse offline angenommen hatte: Der nächste Online-Verkauf dieser Karte rechnet diese Zahlung zuerst ab und läuft dann durch. Ein Verkauf, den das POS erneut sendet, weil die Antwort verloren ging, wird jetzt aus den eigenen Aufzeichnungen der Kasse beantwortet, sodass er nie zweimal belastet wird. Bräuchte eine Zahlung zu viele eCash-Noten der Karte auf einmal, sagt die Kasse das jetzt klar: einen kleineren Betrag ausgeben oder anders bezahlen. Jetzt auf Fedimint v0.13.0, der finalen Version (vorher v0.13.0-beta.1). Alle Änderungen: https://github.com/fedimintcard/fedimintcard/compare/76f7b1e...b9f1f6f',
    pl_PL:
      'Naprawia sprzedaże, które kończyły się błędem „has already signed another transaction” na karcie odsuniętej w trakcie płatności przyjętej przez kasę offline: następna sprzedaż online tej karty najpierw rozlicza tę płatność, a potem przechodzi. Na sprzedaż, którą POS wysyła ponownie, bo nie dostał odpowiedzi, kasa odpowiada teraz na podstawie własnych zapisów, więc sprzedaż nigdy nie zostanie obciążona dwa razy. Gdy płatność wymagałaby naraz zbyt wielu banknotów eCash z karty, kasa mówi to teraz wprost: wydaj mniejszą kwotę albo zapłać inaczej. Teraz na Fedimint v0.13.0, wersji finalnej (wcześniej v0.13.0-beta.1). Pełna lista zmian: https://github.com/fedimintcard/fedimintcard/compare/76f7b1e...b9f1f6f',
    fr_FR:
      "Corrige les ventes qui échouaient avec « has already signed another transaction » sur une carte retirée au milieu d'un paiement que la caisse a pris hors ligne : la prochaine vente en ligne de cette carte règle d'abord ce paiement, puis passe. Une vente que le POS renvoie parce qu'il a perdu la réponse reçoit maintenant sa réponse des enregistrements de la caisse, donc la vente n'est jamais débitée deux fois. Quand un paiement demanderait trop de billets eCash de la carte à la fois, la caisse le dit maintenant clairement : dépensez un montant plus petit, ou payez autrement. Repose maintenant sur Fedimint v0.13.0, la version finale (auparavant v0.13.0-beta.1). Tous les changements : https://github.com/fedimintcard/fedimintcard/compare/76f7b1e...b9f1f6f",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
