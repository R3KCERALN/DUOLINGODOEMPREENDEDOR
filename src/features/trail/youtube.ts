const HOSTS = new Set(['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'])

/** RF-21: player sem cookies. Retorna null para qualquer link que não seja um vídeo do YouTube. */
export function youtubeEmbedUrl(url: string): string | null {
  let u: URL
  try { u = new URL(url) } catch { return null }
  if (u.protocol !== 'https:' || !HOSTS.has(u.hostname)) return null
  const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v')
  return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
}
