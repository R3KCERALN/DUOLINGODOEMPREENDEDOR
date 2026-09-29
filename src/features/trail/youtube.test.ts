import { youtubeEmbedUrl } from './youtube'

test('converte links do YouTube para o player sem cookies', () => {
  expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=ywJw8hjzTig')).toBe('https://www.youtube-nocookie.com/embed/ywJw8hjzTig')
  expect(youtubeEmbedUrl('https://youtu.be/ywJw8hjzTig')).toBe('https://www.youtube-nocookie.com/embed/ywJw8hjzTig')
})

test('recusa links inválidos ou de outros sites', () => {
  expect(youtubeEmbedUrl('não é url')).toBeNull()
  expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=curto')).toBeNull()
  expect(youtubeEmbedUrl('https://evil.example/watch?v=ywJw8hjzTig')).toBeNull()
  expect(youtubeEmbedUrl('javascript:alert(1)')).toBeNull()
})
