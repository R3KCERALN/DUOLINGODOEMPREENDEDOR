/** RF-76j: apaga do Storage e do banco as gravações vencidas. Sem dependências: roda no Deno (Edge Function) e no Vitest. */
export interface Due { simulation_id: string; file_path: string }

export interface PurgeDeps {
  /** Gravações vencidas (`public.due_recordings()`). */
  due(): Promise<Due[]>
  /** Remove os arquivos do bucket `recordings`; lança em erro. Remover arquivo que já não existe não é erro. */
  removeFiles(paths: string[]): Promise<void>
  /** Apaga as linhas; lança em erro. */
  deleteRows(ids: string[]): Promise<void>
}

export async function purgeDueRecordings(deps: PurgeDeps): Promise<{ purged: number }> {
  const due = await deps.due()
  if (due.length === 0) return { purged: 0 }
  // Arquivo primeiro: se apagar as linhas falhar, a próxima execução encontra as mesmas linhas e termina o serviço.
  await deps.removeFiles(due.map((d) => d.file_path))
  await deps.deleteRows(due.map((d) => d.simulation_id))
  return { purged: due.length }
}

/** Só o cron chama: cabeçalho `x-cron-secret` igual ao secret `CRON_SECRET` (≥ 32 caracteres). */
export function authorized(header: string | null, secret: string | undefined): boolean {
  return secret !== undefined && secret.length >= 32 && header === secret
}
