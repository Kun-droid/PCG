import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://lwegonnsuywzhytacdmf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZWdvbm5zdXl3emh5dGFjZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzIwOTcsImV4cCI6MjEwMjU0ODA5N30.bvZtVFXID_VjwkUrIVdRkJJeOKDIi77F6CK2JSFLFqk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);