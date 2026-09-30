-- updated_at é do banco: o cliente não escolhe o horário
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger notes_touch before insert or update on public.notes
for each row execute function public.touch_updated_at();
create trigger book_progress_touch before insert or update on public.book_progress
for each row execute function public.touch_updated_at();

-- Limites e coerência dos dados (o cliente também valida, o banco é a autoridade)
alter table public.notes
  add constraint notes_title_len check (char_length(title) <= 200),
  add constraint notes_body_len check (char_length(body) <= 20000),
  add constraint notes_link_pair check ((link_type is null) = (link_id is null));

alter table public.books
  add constraint books_file_path_ck check (file_path is null or file_path like id || '/%'),
  add constraint books_external_url_ck check (external_url is null or external_url ~* '^https?://');

alter table public.book_progress
  add constraint book_progress_page_ck check (total_pages is null or page <= total_pages);

-- PDFs: só o mentor envia, só para dentro da pasta de um livro existente, só PDF (RF-61)
drop policy books_write on storage.objects;
create policy books_write on storage.objects for insert to authenticated with check (
  bucket_id = 'books' and public.my_role() = 'mentor'
  and exists (select 1 from public.books b where b.id = (storage.foldername(name))[1]));
update storage.buckets set allowed_mime_types = array['application/pdf'] where id = 'books';
