import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kkkaaofhlnlkhtwxojpz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtra2Fhb2ZobG5sa2h0d3hvanB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDAxNTIsImV4cCI6MjA2ODc3NjE1Mn0.iMbgA_0K-8PbxCQyGJ8PB_wkBVHHIn0N3OWj72WQrDw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)