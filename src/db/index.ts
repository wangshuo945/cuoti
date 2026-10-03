import Dexie from 'dexie'
import type { Mistake, AppSetting } from '@/types'

class MistakeDatabase extends Dexie {
  mistakes!: Dexie.Table<Mistake, number>
  settings!: Dexie.Table<AppSetting, string>

  constructor() {
    super('mistake-book')
    this.version(1).stores({
      mistakes: '++id, subject, masteryLevel, nextReviewDate, createdAt',
      settings: 'key',
    })
  }

  async ensureOpen() {
    if (!this.isOpen()) {
      await this.open()
    }
  }
}

export const db = new MistakeDatabase()

const DEFAULT_SETTINGS = [
  { key: 'ocrProvider', value: 'baidu' },
  { key: 'ocrApiKey', value: '' },
  { key: 'ocrSecretKey', value: '' },
  { key: 'aiProvider', value: 'doubao' },
  { key: 'aiApiKey', value: '' },
  { key: 'aiModel', value: 'doubao-lite-4k' },
  { key: 'reviewInterval', value: JSON.stringify([1, 2, 4, 7, 15]) },
  { key: 'firstUse', value: 'true' },
]

export async function initDefaultSettings() {
  try {
    await db.ensureOpen()
    for (const setting of DEFAULT_SETTINGS) {
      const existing = await db.settings.get(setting.key)
      if (!existing) {
        await db.settings.add(setting)
      }
    }
  } catch (e) {
    console.warn('initDefaultSettings failed:', e)
  }
}

export async function getSetting(key: string): Promise<string | undefined> {
  try {
    await db.ensureOpen()
    const setting = await db.settings.get(key)
    return setting?.value
  } catch (e) {
    console.warn('getSetting failed:', key, e)
    return undefined
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.ensureOpen()
  await db.settings.put({ key, value })
}
