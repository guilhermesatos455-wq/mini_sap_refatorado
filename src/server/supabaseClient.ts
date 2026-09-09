import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ndurdzchsdneososflbd.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_RfQsXeKoeSvVqaWW9zI4wg_ydbjnNBw';

export const supabase = createClient(supabaseUrl, supabaseKey);
console.log('[Supabase] Initialized client for project: ndurdzchsdneososflbd');
