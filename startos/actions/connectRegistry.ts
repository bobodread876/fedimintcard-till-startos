import { storeJson } from '../fileModels/store.json'
import { inviteCode, tillOps } from '../fileModels/tillFiles'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { dataDir, defaultRegistryUrl, defaultTillName, tillCli } from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  name: Value.text({
    name: i18n('Till name'),
    description: i18n(
      'What the operator sees in the provisioner app before approving, and how the till is listed there.',
    ),
    required: true,
    default: defaultTillName,
    maxLength: 64,
  }),
  opsUrl: Value.text({
    name: i18n('Registry URL'),
    description: i18n('The fedimintcard registry that holds your cards.'),
    required: true,
    default: defaultRegistryUrl,
    patterns: [
      {
        regex: '^https://[^\\s/?#]+$',
        description: i18n(
          'An https:// address with no path, like https://registry.fedimintcard.org',
        ),
      },
    ],
  }),
})

// `till claim` asks the registry for this till's token (fedimintcard docs/TILL-CLAIM.md) and
// writes the claim to the data directory; the running till polls it and goes on ops once an
// operator approves it in the provisioner app. `--replace`: a connected till keeps its token until
// the new claim is approved.
export const connectRegistry = sdk.Action.withInput(
  'connect-registry',
  // `.const`: the metadata is read again when these files change, so the action turns on as
  // soon as Join federation finishes, with no restart.
  async ({ effects }) => {
    const joined = !!(await inviteCode.read((s) => s.trim()).const(effects))
    const connected = !!(await tillOps.read((s) => s.url).const(effects))
    return {
      name: i18n('Connect to registry'),
      description: i18n(
        'Ask the fedimintcard registry for a till token. Shows a QR code and a code for the operator to approve in the provisioner app (Settings, Tills, Add a till).',
      ),
      warning: connected
        ? i18n(
            'This till is already connected. Once the new request is approved the till uses the new token; the old one keeps working until then.',
          )
        : null,
      allowedStatuses: 'any',
      group: null,
      // The till polls only while it runs, and it cannot run before it has a wallet; a request
      // lives 10 minutes.
      visibility: joined
        ? 'enabled'
        : { disabled: i18n('Join a federation first') },
    }
  },
  inputSpec,
  async () => ({
    opsUrl: (await storeJson.read((s) => s.opsUrl).once()) ?? undefined,
  }),
  async ({ effects, input }) => {
    const opsUrl = input.opsUrl.trim()
    await storeJson.merge(effects, { opsUrl })
    const out = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'till' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: dataDir,
        readonly: false,
      }),
      'connect-registry',
      (sub) =>
        sub.exec(
          tillCli(
            'till',
            'claim',
            '--ops-url',
            opsUrl,
            '--name',
            input.name.trim(),
            '--text',
            '--replace',
          ),
          { timeout: 60_000 },
        ),
    )
    if (out.exitCode !== 0) {
      throw new Error(
        i18n('The registry did not take the request: ${detail}', {
          detail:
            String(out.stderr).trim().split('\n').slice(-2).join(' ') ||
            `exit ${out.exitCode}`,
        }),
      )
    }
    // `--text` prints the QR text, then the code.
    const [qrText, code] = String(out.stdout).trim().split('\n')
    if (!qrText || !code) {
      throw new Error(i18n('The till printed no request code'))
    }
    return {
      version: '1',
      title: i18n('Approve this till'),
      message: i18n(
        'In the provisioner app open Settings, then Tills, then Add a till, and scan the QR code or type the code. The request expires in 10 minutes. Keep the service running: the till picks up its token within seconds of the approval, and the Registry check turns green.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('QR code'),
            description: null,
            value: qrText,
            masked: false,
            copyable: true,
            qr: true,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Code'),
            description: null,
            value: code,
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
