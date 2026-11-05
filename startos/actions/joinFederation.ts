import { inviteCode } from '../fileModels/tillFiles'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { dataDir, tillCli } from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  invite: Value.text({
    name: i18n('Invite code'),
    description: i18n(
      "The federation's invite code (fed11…), from a guardian's Connect a Client screen.",
    ),
    required: true,
    default: null,
    placeholder: 'fed11…',
    patterns: [
      {
        // bech32m (fed11…) or base32hex (fedimint…), either case, as the provisioner reads them.
        regex:
          '^\\s*(fed11[02-9ac-hj-np-zAC-HJ-NP-Z]{6,}|fedimint[0-9a-vA-V]{6,})\\s*$',
        description: i18n('An invite code starts with fed11 or fedimint'),
      },
    ],
  }),
})

export const joinFederation = sdk.Action.withInput(
  'join-federation',
  async () => ({
    name: i18n('Join federation'),
    description: i18n(
      "Make the till's wallet and join it to a Fedimint federation. Runs once: a till stays with the federation it joined.",
    ),
    warning: null,
    allowedStatuses: 'only-stopped',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async () => null,
  async ({ effects, input }) => {
    if (await inviteCode.read().once()) {
      throw new Error(
        i18n(
          'This till has already joined a federation. A till cannot change federations; install a new one instead.',
        ),
      )
    }
    const invite = input.invite.trim().toLowerCase()
    const out = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'till' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: dataDir,
        readonly: false,
      }),
      'join-federation',
      (sub) => sub.exec(tillCli('join', invite), { timeout: 300_000 }),
    )
    if (out.exitCode !== 0) {
      throw new Error(
        i18n('Joining the federation failed: ${detail}', {
          detail:
            String(out.stderr).trim().split('\n').slice(-3).join(' ') ||
            `exit ${out.exitCode}`,
        }),
      )
    }
    const federationId =
      /joined federation (\S+)/.exec(String(out.stdout))?.[1] ?? '?'
    return {
      version: '1',
      title: i18n('Federation joined'),
      message: i18n(
        "The till's wallet is in the federation. Its secret is in the service's data, so keep StartOS backups of this service.",
      ),
      result: {
        type: 'single',
        value: federationId,
        masked: false,
        copyable: true,
        qr: false,
        launchable: false,
      },
    }
  },
)
