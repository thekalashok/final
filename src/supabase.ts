import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://yxbbjxsaaksxpqrocscz.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4YmJqeHNhYWtzeHBxcm9jc2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMzU3NjcsImV4cCI6MjA5MTcxMTc2N30.qGLiYtGQTNhaf6X1B-74CjdkIOGKIda4LA5m-4iruM8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
