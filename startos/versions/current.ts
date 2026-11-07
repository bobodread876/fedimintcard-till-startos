import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.0:2',
  releaseNotes: {
    en_US:
      'Connect to registry: an approval made while the till was stopped or restarting is no longer lost. The till collects it when it next runs, for up to 7 days after the approval.',
    es_ES:
      'Conectar al registro: una aprobación hecha mientras la caja estaba detenida o reiniciándose ya no se pierde. La caja la recoge la próxima vez que funcione, hasta 7 días después de la aprobación.',
    de_DE:
      'Mit Registry verbinden: Eine Freigabe, die erteilt wurde, während die Kasse gestoppt war oder neu startete, geht nicht mehr verloren. Die Kasse holt sie beim nächsten Lauf ab, bis zu 7 Tage nach der Freigabe.',
    pl_PL:
      'Połącz z rejestrem: zatwierdzenie wykonane, gdy kasa była zatrzymana lub uruchamiała się ponownie, nie przepada. Kasa odbiera je przy następnym uruchomieniu, do 7 dni po zatwierdzeniu.',
    fr_FR:
      "Se connecter au registre : une approbation donnée pendant que la caisse était arrêtée ou redémarrait n'est plus perdue. La caisse la récupère à son prochain démarrage, jusqu'à 7 jours après l'approbation.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
