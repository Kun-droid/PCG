import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://qxkevkikrqmffhxlgvab.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4a2V2a2lrcnFtZmZoeGxndmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0ODc5NzEsImV4cCI6MjEwMjA2Mzk3MX0.QI5QJkVMp4iRFFm0c4z0Jz_BkgUyCJXlEqCh2diCHcs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);