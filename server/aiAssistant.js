const crypto = require('crypto')
const { getLoadedLiveDoc } = require('./yjsDoc')

// A single pinned model is a single point of failure: individual Gemini models
// get saturated independently, and when one does it returns 503 for minutes at
// a time while its neighbours answer fine. Measured during one such spike:
// gemini-3.8-flash failed 4 of 4 requests while gemini-3.5-flash served 4 of 4.
// So the primary is tried first and the rest are fallbacks, each overridable by
// env so a future outage is a config change rather than a deploy.
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-flash-latest,gemini-3.8-flash')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean)
// Deduped so an explicit GEMINI_MODEL that also appears in the fallback list
// isn't retried twice for nothing.
const MODELS = [...new Set([PRIMARY_MODEL, ...FALLBACK_MODELS])]

const modelUrl = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

const MAX_CONTEXT_CHARS = 8000
// Bounds how much of the room's own aiChat history gets replayed back to the
// API as conversation context, so the prompt (and its cost) doesn't grow
// without limit as a project's assistant thread gets longer.
const HISTORY_MESSAGES = 20

// Gemini returns 503 "This model is currently experiencing high demand" during
// load spikes, and the identical request usually succeeds moments later. Giving
// up on the first failure turned a few seconds of congestion at Google into an
// assistant that looked broken, so those statuses get a couple of retries.
// Anything else -- 400, 401, 403 -- is a wrong request or a bad key, where
// retrying only delays the same answer.
const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504])
const MAX_ATTEMPTS = 3

/** Exponential backoff with jitter, so concurrent retries don't resynchronise. */
function backoffMs(attempt) {
  return 400 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function truncate(text) {
  return text.length > MAX_CONTEXT_CHARS
    ? `${text.slice(0, MAX_CONTEXT_CHARS)}\n… (truncated)`
    : text
}

function requireApiKey() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('The AI assistant is not configured (GEMINI_API_KEY is not set on the server)')
  }
  return apiKey
}

// Shared by askAssistant (persisted room chat) and explainCode (a private,
// one-shot request) -- both just need "send this system prompt and message
// history, get the reply text back" from the same underlying API.
// `messages` uses Gemini's own role names ('user' / 'model') rather than
// Anthropic's ('user' / 'assistant') -- callers are responsible for mapping
// their own roles before calling this.
/**
 * One model, with retries. Resolves to the reply text, or to a transient
 * failure the caller can respond to by moving on to the next model. A
 * permanent failure (bad request, bad key, model retired) throws instead,
 * since no amount of retrying or substituting fixes it.
 */
async function tryModel(apiKey, model, body) {
  let lastMessage = `AI request failed (${model})`

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response
    try {
      response = await fetch(modelUrl(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body,
      })
    } catch (err) {
      // A dropped connection or DNS blip is as transient as a 503, and the
      // caller sees the same "it's broken" either way.
      lastMessage = `Could not reach the AI service (${err.message})`
      if (attempt === MAX_ATTEMPTS) return { transient: lastMessage }
      await sleep(backoffMs(attempt))
      continue
    }

    const data = await response.json().catch(() => ({}))
    if (response.ok) {
      const parts = data.candidates?.[0]?.content?.parts ?? []
      return { text: parts.map((part) => part.text ?? '').join('') }
    }

    lastMessage = data.error?.message || `AI request failed (${response.status})`
    // 400/401/403 mean the request or the key is wrong; retrying or switching
    // models just delays the same answer.
    if (!TRANSIENT_STATUSES.has(response.status)) throw new Error(lastMessage)
    if (attempt === MAX_ATTEMPTS) return { transient: lastMessage }
    await sleep(backoffMs(attempt))
  }

  return { transient: lastMessage }
}

async function callGemini(apiKey, systemPrompt, messages) {
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
  })

  let lastMessage = 'AI request failed'
  for (const model of MODELS) {
    const result = await tryModel(apiKey, model, body)
    if (result.text !== undefined) return result.text
    lastMessage = result.transient
  }

  // Every model was unreachable or overloaded. Surface the last provider
  // message -- it is the one that explains why ("high demand", a timeout) --
  // rather than a generic failure the user can do nothing with.
  throw new Error(lastMessage)
}

// Lives in the project's own Y.Doc (same pattern as chat/comments/activity),
// so everyone in the room sees the same assistant thread and can build on
// each other's questions, rather than each person getting a private,
// disconnected conversation.
async function askAssistant(room, question, actor, activeFileId) {
  const apiKey = requireApiKey()
  if (!question || !question.trim()) throw new Error('A question is required')

  const ydoc = await getLoadedLiveDoc(room)
  const chat = ydoc.getArray('aiChat')
  const filesMap = ydoc.getMap('files')
  const order = ydoc.getArray('fileOrder')

  const fileNames = order
    .toArray()
    .map((id) => filesMap.get(id)?.name)
    .filter(Boolean)

  let activeFileContext = ''
  const activeMeta = activeFileId ? filesMap.get(activeFileId) : null
  if (activeMeta) {
    const content = ydoc.getText(`content:${activeFileId}`).toString()
    activeFileContext = `\n\nThe file currently open is "${activeMeta.name}":\n\`\`\`\n${truncate(content)}\n\`\`\``
  }

  const systemPrompt =
    'You are a read-only coding assistant embedded in a collaborative code editor. ' +
    "You cannot edit files yourself -- only answer questions and suggest code in your reply for someone to copy in themselves. Keep answers concise.\n\n" +
    `This project's files: ${fileNames.join(', ') || '(none yet)'}.` +
    activeFileContext

  chat.push([
    { id: crypto.randomUUID(), role: 'user', author: actor, text: question.trim(), timestamp: Date.now() },
  ])

  const history = chat
    .toArray()
    .slice(-HISTORY_MESSAGES)
    .map((entry) => ({ role: entry.role === 'assistant' ? 'model' : 'user', content: entry.text }))

  let text
  try {
    text = await callGemini(apiKey, systemPrompt, history)
  } catch (err) {
    chat.push([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        author: 'Assistant',
        text: `Error: ${err.message}`,
        timestamp: Date.now(),
        error: true,
      },
    ])
    throw err
  }

  chat.push([
    { id: crypto.randomUUID(), role: 'assistant', author: 'Assistant', text, timestamp: Date.now() },
  ])
  return text
}

// Unlike askAssistant, this is deliberately private and ephemeral -- it
// doesn't touch the project's shared aiChat array, so asking for an
// explanation doesn't post anything into the room's persisted AI thread for
// everyone else to see. Each call is a one-shot request with no memory of
// previous ones.
async function explainCode(code, languageId) {
  const apiKey = requireApiKey()
  if (!code || !code.trim()) throw new Error('There is no code to explain')

  const systemPrompt =
    'You are a coding assistant embedded in a collaborative code editor. ' +
    'Explain the code the user gives you clearly and concisely, in a few sentences or a short list. ' +
    "Don't rewrite or suggest changes to it -- just explain what it does."

  const message = `Explain this ${languageId} code:\n\n\`\`\`${languageId}\n${truncate(code.trim())}\n\`\`\``

  return callGemini(apiKey, systemPrompt, [{ role: 'user', content: message }])
}

module.exports = { askAssistant, explainCode }
