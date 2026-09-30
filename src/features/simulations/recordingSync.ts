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

/**
 * Reenvio da fila: além do áudio, tira o simulado de "em andamento". Se a aluna ficou sem rede ao encerrar,
 * o avanço da tela falhou e o áudio veio para a fila; sem isto o simulado ficaria parado mesmo com o áudio já no servidor.
 * Condicional (`status = em_andamento`): se a tela já avançou o simulado, não muda nada.
 */
export async function uploadAndAdvance(r: PendingRecording): Promise<void> {
  await uploadRecording(r)
  const { error } = await supabase.from('simulations').update({ status: 'aguardando_notas' }).eq('id', r.simulationId).eq('status', 'em_andamento')
  if (error) throw error
}

export const recordingQueue = createRecordingQueue(idbStore, uploadAndAdvance)
