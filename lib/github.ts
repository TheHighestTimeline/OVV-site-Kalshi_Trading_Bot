import sodium from 'libsodium-wrappers'

/**
 * GitHub helper for driving the user's bot fork via the REST API.
 *
 * Reconstructed from the deployed dashboard's call sites:
 *   getGitHubUser, validatePatForRepo, pushBotSecrets,
 *   dispatchBotWorkflow, getLatestWorkflowRun, cancelWorkflowRun, getRepoFile.
 *
 * The bot itself runs as a GitHub Actions workflow (`bot.yml`) on the user's
 * fork. We push the Kalshi credentials as encrypted Actions secrets (libsodium
 * sealed box, exactly as GitHub requires) and then dispatch the workflow.
 */

const GH = 'https://api.github.com'

function ghHeaders(pat: string) {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

/** Return the authenticated user's login, or throw. */
export async function getGitHubUser(pat: string): Promise<string> {
  const res = await fetch(`${GH}/user`, { headers: ghHeaders(pat) })
  if (!res.ok) {
    throw new Error(
      'Invalid PAT or insufficient permissions (need repo + workflow + secrets scopes).'
    )
  }
  const user = await res.json()
  return user.login
}

/** Check the PAT can read Actions secrets on owner/repo. */
export async function validatePatForRepo(
  pat: string,
  owner: string,
  repo: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${GH}/repos/${owner}/${repo}/actions/secrets/public-key`, {
      headers: ghHeaders(pat),
    })
    if (res.ok) return { ok: true }
    return { ok: false, error: `HTTP ${res.status}` }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

async function getRepoPublicKey(
  pat: string,
  owner: string,
  repo: string
): Promise<{ key_id: string; key: string }> {
  const res = await fetch(`${GH}/repos/${owner}/${repo}/actions/secrets/public-key`, {
    headers: ghHeaders(pat),
  })
  if (!res.ok) throw new Error(`Could not fetch repo public key (HTTP ${res.status}).`)
  return res.json()
}

async function putSecret(
  pat: string,
  owner: string,
  repo: string,
  name: string,
  value: string,
  pubkey: { key_id: string; key: string }
): Promise<void> {
  await sodium.ready
  const binKey = sodium.from_base64(pubkey.key, sodium.base64_variants.ORIGINAL)
  const binSec = sodium.from_string(value)
  const encrypted = sodium.crypto_box_seal(binSec, binKey)
  const encrypted_value = sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL)

  const res = await fetch(`${GH}/repos/${owner}/${repo}/actions/secrets/${name}`, {
    method: 'PUT',
    headers: { ...ghHeaders(pat), 'Content-Type': 'application/json' },
    body: JSON.stringify({ encrypted_value, key_id: pubkey.key_id }),
  })
  if (!res.ok && res.status !== 201 && res.status !== 204) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to set secret ${name} (HTTP ${res.status}) ${text.slice(0, 150)}`)
  }
}

/** Push the bot's Kalshi credentials as encrypted Actions secrets. */
export async function pushBotSecrets(
  pat: string,
  owner: string,
  repo: string,
  secrets: { kalshiKeyId: string; kalshiPem: string }
): Promise<void> {
  const pubkey = await getRepoPublicKey(pat, owner, repo)
  await putSecret(pat, owner, repo, 'KALSHI_API_KEY_ID', secrets.kalshiKeyId, pubkey)
  await putSecret(pat, owner, repo, 'KALSHI_PRIVATE_KEY', secrets.kalshiPem, pubkey)
}

/** Dispatch the bot.yml workflow with the chosen mode. */
export async function dispatchBotWorkflow(
  pat: string,
  owner: string,
  repo: string,
  mode: 'paper' | 'live'
): Promise<void> {
  const res = await fetch(
    `${GH}/repos/${owner}/${repo}/actions/workflows/bot.yml/dispatches`,
    {
      method: 'POST',
      headers: { ...ghHeaders(pat), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main', inputs: { mode } }),
    }
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Could not start the bot workflow (HTTP ${res.status}). Make sure bot.yml exists on the default branch with a workflow_dispatch trigger. ${text.slice(0, 150)}`
    )
  }
}

/** Latest workflow run for bot.yml (or any run if that fails). */
export async function getLatestWorkflowRun(
  pat: string,
  owner: string,
  repo: string
): Promise<any | null> {
  const res = await fetch(
    `${GH}/repos/${owner}/${repo}/actions/workflows/bot.yml/runs?per_page=1`,
    { headers: ghHeaders(pat) }
  )
  if (!res.ok) return null
  const data = await res.json()
  const run = data.workflow_runs && data.workflow_runs[0]
  if (!run) return null
  return {
    id: run.id,
    // Normalize: GitHub uses status in_progress/queued/completed + conclusion.
    status:
      run.status === 'completed'
        ? run.conclusion === 'cancelled'
          ? 'cancelled'
          : run.conclusion === 'failure'
          ? 'failure'
          : 'completed'
        : run.status,
  }
}

/** Cancel a running workflow run. */
export async function cancelWorkflowRun(
  pat: string,
  owner: string,
  repo: string,
  runId: number | string
): Promise<void> {
  const res = await fetch(`${GH}/repos/${owner}/${repo}/actions/runs/${runId}/cancel`, {
    method: 'POST',
    headers: ghHeaders(pat),
  })
  if (!res.ok && res.status !== 202) {
    throw new Error(`Could not cancel workflow run ${runId} (HTTP ${res.status}).`)
  }
}

/** Read a UTF-8 file from a repo via the Contents API. Returns null if 404. */
export async function getRepoFile(
  pat: string,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const res = await fetch(`${GH}/repos/${owner}/${repo}/contents/${path}`, {
    headers: ghHeaders(pat),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Could not read ${path} (HTTP ${res.status}).`)
  const data = await res.json()
  if (!data.content) return null
  return Buffer.from(data.content, 'base64').toString('utf8')
}
