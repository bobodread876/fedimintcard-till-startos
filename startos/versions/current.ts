import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.0:6',
  releaseNotes: {
    en_US:
      "Adds pay by card, off unless you turn it on. With Turn on pay by card, an app that pays with a card, such as the Forge app, can ask the till to charge a card, with the card's PIN, and pay a Lightning invoice with what the card paid. Pair such an app with the new Pair a paying app action; Rotate pay token unpairs them all. While it is on, a Pay by card check shows whether the till is ready to pay. A till that leaves it off works as before, and POS phones stay paired either way. This release needs StartOS 0.4.2 or newer.",
    es_ES:
      'Añade el pago con tarjeta, desactivado salvo que lo actives. Con Activar el pago con tarjeta, una app que paga con una tarjeta, como la app Forge, puede pedir a la caja que cobre una tarjeta, con el PIN de la tarjeta, y que pague una factura Lightning con lo que pagó la tarjeta. Empareja esa app con la nueva acción Emparejar una app de pago; Rotar token de pago las desempareja todas. Mientras está activado, la comprobación Pago con tarjeta muestra si la caja está lista para pagar. Una caja que lo deja desactivado funciona como antes, y los teléfonos POS siguen emparejados en ambos casos. Esta versión necesita StartOS 0.4.2 o posterior.',
    de_DE:
      'Fügt die Kartenzahlung hinzu, aus, solange du sie nicht einschaltest. Mit Kartenzahlung einschalten kann eine App, die mit einer Karte zahlt, etwa die Forge-App, die Kasse eine Karte belasten lassen, mit deren PIN, und mit dem, was die Karte gezahlt hat, eine Lightning-Rechnung bezahlen lassen. Koppel eine solche App mit der neuen Aktion Zahl-App koppeln; Zahl-Token erneuern entkoppelt alle. Solange sie an ist, zeigt die Prüfung Kartenzahlung, ob die Kasse zahlen kann. Eine Kasse, die sie aus lässt, arbeitet wie bisher, und POS-Telefone bleiben in jedem Fall gekoppelt. Diese Version braucht StartOS 0.4.2 oder neuer.',
    pl_PL:
      'Dodaje płatność kartą, wyłączoną, dopóki jej nie włączysz. Po uruchomieniu Włącz płatność kartą aplikacja płacąca kartą, taka jak aplikacja Forge, może poprosić kasę o obciążenie karty, z PIN-em karty, i opłacenie faktury Lightning tym, co zapłaciła karta. Sparuj taką aplikację nową akcją Sparuj aplikację płatniczą; Wymień token płatności rozparowuje je wszystkie. Gdy płatność jest włączona, sprawdzenie Płatność kartą pokazuje, czy kasa jest gotowa do płacenia. Kasa, która ma ją wyłączoną, działa jak dotąd, a telefony POS w obu przypadkach pozostają sparowane. To wydanie wymaga StartOS 0.4.2 lub nowszego.',
    fr_FR:
      "Ajoute le paiement par carte, désactivé tant que vous ne l'activez pas. Avec Activer le paiement par carte, une application qui paie avec une carte, comme l'application Forge, peut demander à la caisse de débiter une carte, avec le PIN de la carte, et de payer une facture Lightning avec ce que la carte a payé. Appairez une telle application avec la nouvelle action Appairer une application de paiement ; Renouveler le jeton de paiement les désappaire toutes. Tant qu'il est activé, la vérification Paiement par carte indique si la caisse est prête à payer. Une caisse qui le laisse désactivé fonctionne comme avant, et les téléphones POS restent appairés dans tous les cas. Cette version nécessite StartOS 0.4.2 ou plus récent.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
