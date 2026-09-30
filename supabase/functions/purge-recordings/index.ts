import { createClient } from 'npm:@supabase/supabase-js@2'
import { authorized, purgeDueRecordings } from './purge.ts'

// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados pelo Supabase em toda Edge Function.
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

Deno.serve(async (req) => {
  if (req.method !== 'POST' || !authorized(req.headers.get('x-cron-secret'), Deno.env.get('CRON_SECRET'))) {
    return new Response('forbidden', { status: 403 })
  }
  try {
    const result = await purgeDueRecordings({
      async due() {
        const { data, error } = await db.rpc('due_recordings')
        if (error) throw error
        return data ?? []
      },
      async removeFiles(paths) {
        const { error } = await db.storage.from('recordings').remove(paths)
        if (error) throw error
      },
      async deleteRows(ids) {
        // keep = false de novo: se o mentor marcou "guardar" neste meio-tempo, a linha fica
        const { error } = await db.from('simulation_recordings').delete().in('simulation_id', ids).eq('keep', false)
        if (error) throw error
      },
    })
    return Response.json(result)
  } catch (e) {
    console.error('purge-recordings', e)
    return Response.json({ error: 'purge_failed' }, { status: 500 })
  }
})
