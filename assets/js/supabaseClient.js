import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://qxkevkikrqmffhxlgvab.supabase.co';
const SUPABASE_ANON_KEY = 'b_publishable_q5gjyDQg0DqM2JPqdRsxVQ_V6HxK72c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);