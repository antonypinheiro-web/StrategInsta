import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqngekcjshfvssqjqgkp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbmdla2Nqc2hmdnNzcWpxZ2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODIzMzUsImV4cCI6MjA5MDA1ODMzNX0.OmRe53MmusKU82moRltKlSzXxIY_qOcFJOxAp2hjaN8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);