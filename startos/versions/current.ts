import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.0:1',
  releaseNotes: {
    en_US:
      "Supports 32-slot cards (applet 2.1): the till keys a new card's later slots at the tap that needs them. 8-slot cards keep working.",
    es_ES:
      'Admite tarjetas de 32 ranuras (applet 2.1): la caja genera las claves de las ranuras restantes en el toque que las necesita. Las tarjetas de 8 ranuras siguen funcionando.',
    de_DE:
      'Unterstützt Karten mit 32 Plätzen (Applet 2.1): Die Kasse erzeugt die Schlüssel der weiteren Plätze bei dem Tippen, das sie braucht. Karten mit 8 Plätzen funktionieren weiter.',
    pl_PL:
      'Obsługuje karty z 32 slotami (aplet 2.1): kasa generuje klucze kolejnych slotów przy dotknięciu, które ich potrzebuje. Karty z 8 slotami działają nadal.',
    fr_FR:
      'Prend en charge les cartes à 32 emplacements (applet 2.1) : la caisse génère les clés des emplacements suivants lors du contact qui en a besoin. Les cartes à 8 emplacements continuent de fonctionner.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
