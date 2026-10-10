BEGIN;
CREATE TABLE public.pilot_attachments (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 business_id uuid NOT NULL REFERENCES public.pilot_businesses(id),
 briefing_id uuid NOT NULL,
 name text NOT NULL, kind text NOT NULL CHECK(kind IN ('pdf','docx','txt','image')),
 size bigint NOT NULL CHECK(size>0 AND size<=52428800), sha256 text NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'),
 mime_type text NOT NULL, storage_path text NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'uploading' CHECK(status IN ('uploading','ready','detached','deleted')),
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(kind<>'image' OR size<=10485760)
);
ALTER TABLE public.pilot_attachments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pilot_attachments FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.pilot_attachments TO authenticated;
GRANT ALL ON public.pilot_attachments TO service_role;
CREATE POLICY owner_read ON public.pilot_attachments FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.pilot_prepare_attachment(p_user uuid,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE business uuid:=(p_payload->>'businessId')::uuid; briefing uuid:=(p_payload->>'briefingId')::uuid; existing public.pilot_attachments%ROWTYPE; path text;
BEGIN
 INSERT INTO public.pilot_businesses(id,user_id) VALUES(business,p_user) ON CONFLICT(id) DO NOTHING;
 PERFORM 1 FROM public.pilot_businesses WHERE id=business AND user_id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'OWNERSHIP'; END IF;
 SELECT * INTO existing FROM public.pilot_attachments WHERE id=(p_payload->>'id')::uuid;
 IF FOUND THEN
  IF existing.user_id<>p_user OR existing.business_id<>business OR existing.briefing_id<>briefing OR existing.sha256<>p_payload->>'sha256' OR existing.size<>(p_payload->>'size')::bigint OR existing.status IN ('deleted','detached') THEN RAISE EXCEPTION 'ATTACHMENT_CONFLICT'; END IF;
  RETURN jsonb_build_object('storagePath',existing.storage_path,'bucket','briefing-files','status',existing.status);
 END IF;
 IF (SELECT count(*) FROM public.pilot_attachments WHERE business_id=business AND briefing_id=briefing AND status IN ('uploading','ready'))>=5 THEN RAISE EXCEPTION 'ATTACHMENT_COUNT_LIMIT'; END IF;
 IF coalesce((SELECT sum(size) FROM public.pilot_attachments WHERE business_id=business AND briefing_id=briefing AND status IN ('uploading','ready')),0)+(p_payload->>'size')::bigint>104857600 THEN RAISE EXCEPTION 'ATTACHMENT_TOTAL_LIMIT'; END IF;
 path:=p_user||'/'||business||'/'||(p_payload->>'id');
 INSERT INTO public.pilot_attachments(id,user_id,business_id,briefing_id,name,kind,size,sha256,mime_type,storage_path)
 VALUES((p_payload->>'id')::uuid,p_user,business,briefing,left(p_payload->>'name',200),p_payload->>'kind',(p_payload->>'size')::bigint,p_payload->>'sha256',p_payload->>'mimeType',path);
 RETURN jsonb_build_object('storagePath',path,'bucket','briefing-files','status','uploading');
END $$;
REVOKE ALL ON FUNCTION public.pilot_prepare_attachment(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pilot_prepare_attachment(uuid,jsonb) TO service_role;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 VALUES('briefing-files','briefing-files',false,52428800,ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','image/jpeg','image/png','image/webp'])
 ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=52428800,allowed_mime_types=EXCLUDED.allowed_mime_types;
CREATE POLICY "Private briefing read" ON storage.objects FOR SELECT TO authenticated
 USING(bucket_id='briefing-files' AND EXISTS(SELECT 1 FROM public.pilot_attachments a WHERE a.storage_path=objects.name AND a.user_id=auth.uid() AND a.status<>'deleted'));
CREATE POLICY "Private briefing upload" ON storage.objects FOR INSERT TO authenticated
 WITH CHECK(bucket_id='briefing-files' AND EXISTS(SELECT 1 FROM public.pilot_attachments a WHERE a.storage_path=objects.name AND a.user_id=auth.uid() AND a.status='uploading'));
-- UPDATE is deliberately absent: an approved source cannot be replaced behind a historical version.
COMMIT;
