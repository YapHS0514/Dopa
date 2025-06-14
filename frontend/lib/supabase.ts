import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rlarifarfnpjlxjwpjiq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXJpZmFyZm5wamx4andwamlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MzgyMjYsImV4cCI6MjA2NTMxNDIyNn0.LX6Z3MRR_eElu9qi27yTl5QVXvgtc1lFjTz9SI8iJgw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);