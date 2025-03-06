import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Use your actual Supabase URL and anon key
const supabaseUrl = 'https://whzdkyhqvuwdbhqgcfyl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoemRreWhxdnV3ZGJocWdjZnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMDg5MjMsImV4cCI6MjA1NjU4NDkyM30.B_wMKwypr_c52c5xZbWOZzzpmlLltSPTU_tx8qqpnzg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 