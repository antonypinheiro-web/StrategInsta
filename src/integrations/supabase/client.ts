import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uuotsgoqgdzrnyhvegvs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1b3RzZ29xZ2R6cm55aHZlZ3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjAzMDUsImV4cCI6MjA3NDI5NjMwNX0.v7cgrwWi9hFnM5tv4K9qzFEZF6hUfTzaPVlU47k-4-c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);