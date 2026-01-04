import { supabase } from '../supabase';
import { getIssuedCount, getSessionCapacity } from './session';
import type { Application } from '../supabase';

// Get all applications
export async function getApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('submitted_date', { ascending: false });
  
  if (error) throw error;
  return data as Application[];
}

// Get applications by Email (returns list)
export async function getApplicationsByEmail(email: string) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) throw new Error('Email diperlukan');

  // Fetch all then filter by pemohon.email due to JSONB structure
  const { data: allApps, error } = await supabase
    .from('applications')
    .select('*')
    .order('submitted_date', { ascending: false });

  if (error) throw error;
  if (!allApps) return [];

  const matches = allApps.filter((app) => {
    try {
      const pemohon = typeof app.pemohon === 'string' ? JSON.parse(app.pemohon) : app.pemohon;
      const dbEmail = (pemohon?.email || '').trim().toLowerCase();
      return dbEmail === cleanEmail;
    } catch {
      return false;
    }
  });

  return matches as Application[];
}

// Get application by ref number
export async function getApplicationByRefNo(refNo: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('ref_no', refNo)
    .single();
  
  if (error) throw error;
  return data as Application;
}

// Get application by IC number  
export async function getApplicationByIC(ic: string) {
  const cleanIC = ic.replace(/[-\s]/g, '');
  const formattedIC = `${cleanIC.slice(0, 6)}-${cleanIC.slice(6, 8)}-${cleanIC.slice(8)}`;
  
  console.log('=== Semak IC Debug ===');
  console.log('Input IC:', ic);
  console.log('Clean IC:', cleanIC);
  console.log('Formatted IC:', formattedIC);
  
  // Get all applications and filter client-side (most reliable for JSONB)
  const { data: allApps, error } = await supabase
    .from('applications')
    .select('*')
    .order('submitted_date', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }
  
  if (!allApps || allApps.length === 0) {
    console.log('No applications in database');
    throw new Error('No data');
  }

  console.log('Total applications in DB:', allApps.length);
  
  // Debug: Show all ICs in database
  console.log('\n📋 Semua IC dalam database:');
  allApps.forEach((app, index) => {
    try {
      const pemohon = typeof app.pemohon === 'string' ? JSON.parse(app.pemohon) : app.pemohon;
      const dbIC = pemohon?.ic || 'NO IC';
      const dbICClean = dbIC.replace(/[-\s]/g, '');
      console.log(`  ${index + 1}. ${app.ref_no} - IC: ${dbIC} (Clean: ${dbICClean})`);
    } catch (err) {
      console.log(`  ${index + 1}. ${app.ref_no} - ERROR parsing pemohon`);
    }
  });
  console.log('');

  // Find matching application
  const found = allApps.find(app => {
    try {
      // Handle both direct object and JSON string
      const pemohon = typeof app.pemohon === 'string' ? JSON.parse(app.pemohon) : app.pemohon;
      
      if (!pemohon || !pemohon.ic) {
        console.log('⚠️ App without pemohon.ic:', app.ref_no);
        return false;
      }
      
      const dbIC = pemohon.ic.replace(/[-\s]/g, '');
      const match = dbIC === cleanIC;
      
      console.log(`Comparing: "${dbIC}" === "${cleanIC}" ? ${match}`);
      
      if (match) {
        console.log('✅ MATCH FOUND!');
        console.log('  Ref No:', app.ref_no);
        console.log('  Name:', pemohon.name);
        console.log('  IC:', pemohon.ic);
        console.log('  Status:', app.status);
      }
      
      return match;
    } catch (err) {
      console.error('❌ Error processing app:', app.ref_no, err);
      return false;
    }
  });

  if (!found) {
    console.log('❌ No matching record found for IC:', cleanIC);
    console.log('Checked', allApps.length, 'applications');
    throw new Error('No record found');
  }
  
  console.log('=== End Debug ===');
  return found as Application;
}

// Search applications
export async function searchApplications(query: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .or(`ref_no.ilike.%${query}%,no_siri.ilike.%${query}%,pemohon->>name.ilike.%${query}%,pemohon->>ic.ilike.%${query}%`)
    .order('submitted_date', { ascending: false });
  
  if (error) throw error;
  return data as Application[];
}

// Filter applications by status
export async function filterApplicationsByStatus(status: string) {
  if (status === 'all') {
    return getApplications();
  }
  
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('status', status)
    .order('submitted_date', { ascending: false });
  
  if (error) throw error;
  return data as Application[];
}

// Create new application
export async function createApplication(application: Partial<Application>) {
  const { data, error } = await supabase
    .from('applications')
    .insert([application])
    .select()
    .single();
  
  if (error) throw error;
  return data as Application;
}

// Update application
export async function updateApplication(id: string, updates: Partial<Application>) {
  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Application;
}

// Approve application (generates No Siri)
export async function approveApplication(id: string) {
  const year = new Date().getFullYear();
  
  // Get count of approved applications this year to generate sequence
  const { data: approvedApps, error: countError } = await supabase
    .from('applications')
    .select('no_siri')
    .not('no_siri', 'is', null)
    .like('no_siri', `MPHS/${year}/%`)
    .order('no_siri', { ascending: false });
  
  if (countError) throw countError;
  
  // Calculate next sequence number
  let nextSequence = 1;
  if (approvedApps && approvedApps.length > 0) {
    const lastNoSiri = approvedApps[0].no_siri;
    const lastSequence = parseInt(lastNoSiri.split('/')[2]);
    nextSequence = lastSequence + 1;
  }
  
  // Check capacity limit (350 per year)
  if (nextSequence > 350) {
    throw new Error(`Kapasiti sesi ${year} telah penuh (350). Capacity for session ${year} is full.`);
  }
  
  // Generate No Siri in format MPHS/YYYY/NNN
  const noSiri = `MPHS/${year}/${nextSequence.toString().padStart(3, '0')}`;
  
  // Calculate dates
  const approvalDate = new Date();
  
  // Update application (removed expiry_date as it may not exist in schema)
  const { data, error } = await supabase
    .from('applications')
    .update({
      status: 'Diluluskan',
      no_siri: noSiri,
      approved_date: approvalDate.toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Application;
}

// Reject application
export async function rejectApplication(id: string, adminNotes: string) {
  const { data, error } = await supabase
    .from('applications')
    .update({
      status: 'Tidak Berjaya',
      admin_notes: adminNotes
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Application;
}

// Create renewal application
export async function createRenewalApplication(
  existingAppId: string,
  updatedData: {
    pemohon: any;
    tanggungan?: any;
    documents: any;
  }
) {
  try {
    // Get existing application
    const { data: existing, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', existingAppId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Parse existing data
    const existingPemohon = typeof existing.pemohon === 'string' 
      ? JSON.parse(existing.pemohon) 
      : existing.pemohon;
    
    // Merge documents (use existing if not updated)
    const mergedDocuments = {
      ...existing.documents,
      ...updatedData.documents
    };
    
    // Generate new ref number
    const refNo = await generateRefNumber('pembaharuan');
    
    // Create new application
    const newApp = {
      ref_no: refNo,
      application_type: 'pembaharuan',
      pemohon: updatedData.pemohon || existingPemohon,
      tanggungan: updatedData.tanggungan || existing.tanggungan,
      documents: mergedDocuments,
      status: 'Dalam Proses',
      submitted_date: new Date().toISOString(),
      previous_ref_no: existing.ref_no, // Link to previous application
      previous_app_id: existingAppId
    };
    
    const { data, error } = await supabase
      .from('applications')
      .insert([newApp])
      .select()
      .single();
    
    if (error) throw error;
    return data as Application;
  } catch (error) {
    console.error('Error creating renewal application:', error);
    throw error;
  }
}

// Get application by ID
export async function getApplicationById(id: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Application;
}

// Mark as ready
export async function markAsReady(id: string) {
  const { data, error } = await supabase
    .from('applications')
    .update({
      status: 'Sedia Diambil',
      ready_date: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Application;
}

// Mark as collected
export async function markAsCollected(id: string) {
  const { data, error } = await supabase
    .from('applications')
    .update({
      status: 'Telah Diambil',
      collected_date: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Application;
}

// Get dashboard stats
export async function getDashboardStats(year?: number) {
  try {
    // Get all applications for the year
    let query = supabase
      .from('applications')
      .select('*');
    
    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query
        .gte('submitted_date', startDate)
        .lte('submitted_date', endDate);
    }
    
    const { data: apps, error } = await query;
    
    if (error) throw error;
    
    // Calculate stats
    const total = apps?.length || 0;
    const baharu = apps?.filter(app => app.application_type === 'baru').length || 0;
    const pembaharuan = apps?.filter(app => app.application_type === 'pembaharuan').length || 0;
    
    // Calculate expired (tidak diperbaharui)
    const now = new Date();
    const expired = apps?.filter(app => {
      if (!app.expiry_date) return false;
      const expiryDate = new Date(app.expiry_date);
      const isExpired = expiryDate < now;
      const isApproved = app.status === 'Diluluskan' || app.status === 'Sedia Diambil' || app.status === 'Telah Diambil';
      
      // Debug logging
      if (isExpired && isApproved) {
        console.log('Found expired application:', {
          ref_no: app.ref_no,
          expiry_date: app.expiry_date,
          status: app.status,
          days_expired: Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24))
        });
      }
      
      return isExpired && isApproved;
    }).length || 0;
    
    const dalam_proses = apps?.filter(app => app.status === 'Dalam Proses').length || 0;
    const diluluskan = apps?.filter(app => app.status === 'Diluluskan').length || 0;
    const sedia_diambil = apps?.filter(app => app.status === 'Sedia Diambil').length || 0;
    const telah_diambil = apps?.filter(app => app.status === 'Telah Diambil').length || 0;
    const tidak_berjaya = apps?.filter(app => app.status === 'Tidak Berjaya').length || 0;
    
    console.log(`📊 Dashboard Stats - Year ${year}:`, {
      total: apps?.length,
      baharu,
      pembaharuan,
      expired,
      dalam_proses,
      diluluskan,
      sedia_diambil,
      telah_diambil,
      tidak_berjaya
    });
    
    return {
      total,
      baharu,
      pembaharuan,
      tidak_diperbaharui: expired, // NEW: Expired count
      dalam_proses,
      diluluskan,
      sedia_diambil,
      telah_diambil,
      tidak_berjaya,
      year: year || new Date().getFullYear()
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      total: 0,
      baharu: 0,
      pembaharuan: 0,
      tidak_diperbaharui: 0,
      dalam_proses: 0,
      diluluskan: 0,
      sedia_diambil: 0,
      telah_diambil: 0,
      tidak_berjaya: 0,
      year: year || new Date().getFullYear()
    };
  }
}

// Get monthly stats
export async function getMonthlyStats(year: number) {
  const { data, error } = await supabase
    .from('monthly_stats')
    .select('*')
    .eq('year', year)
    .order('month_num', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

// Export applications to CSV (get data for date range)
export async function getApplicationsForExport(dateFrom: Date, dateTo: Date) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .gte('submitted_date', dateFrom.toISOString())
    .lte('submitted_date', dateTo.toISOString())
    .order('submitted_date', { ascending: false });
  
  if (error) throw error;
  return data as Application[];
}

// Upload file to Supabase Storage
export async function uploadFile(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(path);
  
  return urlData.publicUrl;
}

// Generate unique reference number
export async function generateRefNumber(type: 'baru' | 'pembaharuan'): Promise<string> {
  const prefix = type === 'baru' ? 'RB' : 'RP';
  const year = new Date().getFullYear();
  
  // Get last ref number for the year
  const { data, error } = await supabase
    .from('applications')
    .select('ref_no')
    .like('ref_no', `${prefix}${year}%`)
    .order('ref_no', { ascending: false })
    .limit(1);
  
  if (error) throw error;
  
  let sequence = 1;
  if (data && data.length > 0) {
    const lastRefNo = data[0].ref_no;
    const lastSequence = parseInt(lastRefNo.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${year}${sequence.toString().padStart(4, '0')}`;
}
