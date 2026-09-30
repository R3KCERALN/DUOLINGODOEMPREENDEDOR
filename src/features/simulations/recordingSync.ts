import { supabase } from '@/lib/supabase'
import { idbStore } from './idbStore'
import { createRecordingQueue, type PendingRecording } from './recordingQueue'

const extensionOf = (mime: string) => (mime.startsWith('audio/mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm')

/** Sobe o áudio e registra a linha. Idempotente: repetir o envio de um item já enviado não falha. */
export async function uploadRecording(r: PendingRecording): Promise<void> {
  const path = `${r.simulationId}/audio.${extensionOf(r.mime)}`
  const { error } = await supabase.storage.from('recordings').upload(path, r.blob, { contentType: r.mime.split(';')[0], upsert: false })
  if (error && !/already exists|duplicate/i.test(error.message)) throw error
  const { error: rowError } = await supabase.from('simulation_recordings').upsert(
    { simulation_id: r.simulationId, file_path: path, mime: r.mime, duration_sec: Math.min(720, r.durationSec), size_bytes: r.blob.size },
    { onConflict: 'simulation_id', ignoreDuplicates: true },
  )
  if (rowError) throw rowError
}

export const recordingQueue = createRecordingQueue(idbStore, uploadRecording)
