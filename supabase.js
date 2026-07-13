import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://dwdxnpyybzpcjetxedyq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3ZHhucHl5YnpwY2pldHhlZHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNTAyOTMsImV4cCI6MjA5ODYyNjI5M30.4bRrW810z2C0Yjc6KdqZyQEEQKt_9nFa6vAxHEv75Y8"
);

window.sb = supabase;
