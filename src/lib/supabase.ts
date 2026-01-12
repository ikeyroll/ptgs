import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Application {
  id: string;
  ref_no: string;
  no_siri?: string;
  application_type: 'baru' | 'pembaharuan';
  pemohon: {
    name: string;
    ic: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    address: string;
  };
  equipment: {
    type: string;
    model?: string;
    quantity: number;
    purpose: string;
    justification: string;
  };
  documents: {
    icCopy: string;
    justificationLetter: string;
    departmentApproval: string;
    otherDocuments?: string;
  };
  status: 'Dalam Proses' | 'Diluluskan' | 'Tidak Berjaya';
  admin_notes?: string;
  submitted_date: string;
  approved_date?: string;
  expiry_date?: string;
  ready_date?: string;
  collected_date?: string;
  created_at: string;
  updated_at: string;
  // Geospatial fields
  latitude?: number;
  longitude?: number;
  daerah?: string;
  mukim?: string;
  // Generated KML URL (if stored)
  kml_url?: string;
}