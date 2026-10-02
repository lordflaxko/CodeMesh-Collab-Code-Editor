import { useCallback, useRef, useSyncExternalStore } from 'react'
import * as Y from 'yjs'
import { postJson } from './api'

export interface AiChatEntry {
  id: string
  role: 'user' | 'assistant'
  author: string
  text: string
  timestamp: number
  error?: boolean
  /** Project files whose contents were sent as context for this answer. */
  sources?: string[]
}

/**
 * A reply still being written. The server streams partial text into this map
 * as it arrives from the model, so everyone in the room watches the answer
 * appear rather than only the person who asked.
 */
export interface AiStreamingReply {
  id: string
  author: string
  text: string
  startedAt: number
  sources?: string[]
}

export function aiStreamingMapFor(ydoc: Y.Doc): Y.Map<unknown> {
  return ydoc.getMap('aiStreaming')
}

export function aiChatArrayFor(ydoc: Y.Doc): Y.Array<AiChatEntry> {
  return ydoc.getArray('aiChat')
}

export function askAssistant(
  room: string,
  question: string,
  sessionToken: string | null,
  activeFileId: string | null,
): Promise<{ reply: string }> {
  return postJson('/ai/ask', { room, question, sessionToken, activeFileId })
}

export function explainCode(
  room: string,
  code: string,
  languageId: string,
  sessionToken: string | null,
): Promise<{ explanation: string }> {
  return postJson('/ai/explain', { room, code, languageId, sessionToken })
}

export function useAiChat(ydoc: Y.Doc): AiChatEntry[] {
  const array = aiChatArrayFor(ydoc)
  const versionRef = useRef(0)
  const cacheRef = useRef<{ version: number; items: AiChatEntry[] }>({ version: -1, items: [] })

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handler = () => {
        versionRef.current += 1
        onStoreChange()
      }
      array.observe(handler)
      return () => array.unobserve(handler)
    },
    [array],
  )

  const getSnapshot = useCallback((): AiChatEntry[] => {
    if (cacheRef.current.version === versionRef.current) {
      return cacheRef.current.items
    }
    const items = array.toJSON() as AiChatEntry[]
    cacheRef.current = { version: versionRef.current, items }
    return items
  }, [array])

  return useSyncExternalStore(subscribe, getSnapshot)
}


/** Live view of the in-flight reply, or null when nothing is streaming. */
export function useAiStreaming(ydoc: Y.Doc): AiStreamingReply | null {
  const map = aiStreamingMapFor(ydoc)
  const versionRef = useRef(0)
  const cacheRef = useRef<{ version: number; value: AiStreamingReply | null }>({
    version: -1,
    value: null,
  })

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handler = () => {
        versionRef.current += 1
        onStoreChange()
      }
      map.observe(handler)
      return () => map.unobserve(handler)
    },
    [map],
  )

  const getSnapshot = useCallback((): AiStreamingReply | null => {
    if (cacheRef.current.version === versionRef.current) return cacheRef.current.value
    const id = map.get('id') as string | undefined
    // The map is cleared the moment the finished message lands in aiChat, so
    // a missing id means there is nothing in flight.
    const value = id
      ? {
          id,
          author: (map.get('author') as string) ?? 'Assistant',
          text: (map.get('text') as string) ?? '',
          startedAt: (map.get('startedAt') as number) ?? Date.now(),
          sources: (map.get('sources') as string[]) ?? [],
        }
      : null
    cacheRef.current = { version: versionRef.current, value }
    return value
  }, [map])

  return useSyncExternalStore(subscribe, getSnapshot)
}
