"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'ms' | 'en';

interface Translations {
  [key: string]: {
    ms: string;
    en: string;
  };
}

const translations: Translations = {
  // Header
  'nav.home': { ms: 'Laman Utama', en: 'Home' },
  'nav.apply': { ms: 'Permohonan', en: 'Apply' },
  'nav.dashboard': { ms: 'Dashboard', en: 'Dashboard' },
  'nav.admin': { ms: 'Admin', en: 'Admin' },
  'nav.contact': { ms: 'Hubungi', en: 'Contact' },

  // Homepage
  'hero.mphs': { ms: 'Pejabat Tanah dan Galian Selangor', en: 'Selangor Land & Mines Office' },
  'hero.mphs.en': { ms: 'Selangor Land & Mines Office', en: 'Selangor Land & Mines Office' },
  'hero.systemTitle': { ms: 'Sistem PTGS', en: 'PTGS System' },
  'hero.title': { ms: 'Pembangunan Sistem Permohonan Peralatan ICT & Pendaftaran Aset ICT', en: 'ICT Equipment Request & Asset Registration System' },
  'hero.subtitle': { ms: 'Sistem permohonan peralatan ICT untuk Bahagian Teknologi Maklumat, Pejabat Tanah dan Galian Selangor', en: 'ICT Equipment Request System for Information Technology Division, Selangor Land & Mines Office' },
  'hero.description': { ms: 'Sistem ini dibangunkan untuk memudahkan urusan permohonan peralatan ICT di Pejabat Tanah dan Galian Selangor. Sebelum ini, permohonan dilakukan melalui emel. Dengan sistem ini, semua permohonan dapat ditrack dengan lebih sistematik dan memudahkan kakitangan untuk membuat follow up.', en: 'This system was developed to facilitate ICT equipment requests at the Selangor Land & Mines Office. Previously, applications were made via email. With this system, all applications can be tracked systematically, making it easier for staff to follow up.' },
  'hero.enterIC': { ms: 'Sila Masukkan E-mel', en: 'Please Enter Email' },
  'hero.checkRegistration': { ms: 'Untuk menyemak status pendaftaran e-mel anda', en: 'To check your email registration status' },
  'hero.applyNow': { ms: 'Mohon Sekarang', en: 'Apply Now' },
  'hero.checkStatus': { ms: 'Semak IC', en: 'Check IC' },
  'hero.checkIC': { ms: 'Semak IC', en: 'Check IC' },
  'hero.icPlaceholder': { ms: 'Alamat E-mel (cth: user@ptgs.gov.my)', en: 'Email Address (e.g. user@ptgs.gov.my)' },
  'hero.check': { ms: 'Semak', en: 'Check' },
  'hero.checking': { ms: 'Menyemak...', en: 'Checking...' },
  'hero.recordFound': { ms: '✓ E-mel berdaftar', en: '✓ Email registered' },
  'hero.noRecord': { ms: 'ⓘ E-mel belum berdaftar', en: 'ⓘ Email not registered' },
  'hero.viewDetails': { ms: 'Permohonan Baharu', en: 'New Request' },
  'hero.newApplication': { ms: 'Pendaftaran Baharu', en: 'New Registration' },
  'hero.registerNow': { ms: 'Pendaftaran Baharu', en: 'Register' },
  'hero.startNewRequest': { ms: 'Permohonan Baharu', en: 'New Request' },
  'hero.documentsRequired': { ms: 'Dokumen Diperlukan', en: 'Required Documents' },
  'hero.documentsDesc': { ms: 'Sila sediakan dokumen berikut untuk permohonan', en: 'Please prepare the following documents for application' },
  
  // Process Steps
  'process.title': { ms: 'Cara Memohon', en: 'How to Apply' },
  'process.step1.title': { ms: 'Lengkapkan Borang', en: 'Complete Form' },
  'process.step1.desc': { ms: 'Isi borang permohonan dengan maklumat lengkap', en: 'Fill out the application form with complete information' },
  'process.step2.title': { ms: 'Muat Naik Dokumen', en: 'Upload Documents' },
  'process.step2.desc': { ms: 'Muat naik salinan IC, kad OKU dan geran kenderaan', en: 'Upload copies of IC, OKU card and vehicle grant' },
  'process.step3.title': { ms: 'Pengesahan Admin', en: 'Admin Verification' },
  'process.step3.desc': { ms: 'Permohonan akan disemak oleh pentadbir', en: 'Application will be reviewed by administrator' },
  'process.step4.title': { ms: 'Ambil Pelekat', en: 'Collect Sticker' },
  'process.step4.desc': { ms: 'Ambil pelekat di Pejabat PTGS', en: 'Collect sticker at PTGS office' },
  
  // Status Checker
  'status.title': { ms: 'Semak Status Permohonan', en: 'Check Application Status' },
  'status.refNumber': { ms: 'No. Rujukan', en: 'Reference Number' },
  'status.check': { ms: 'Semak', en: 'Check' },
  'status.pending': { ms: 'Dalam Semakan', en: 'Under Review' },
  'status.approved': { ms: 'Diluluskan', en: 'Approved' },
  'status.ready': { ms: 'Sedia Diambil', en: 'Ready for Collection' },
  'status.collected': { ms: 'Telah Diambil', en: 'Collected' },
  'status.rejected': { ms: 'Ditolak', en: 'Rejected' },
  
  // Footer
  'footer.contact': { ms: 'Hubungi Kami', en: 'Contact Us' },
  'footer.address': { ms: 'Alamat', en: 'Address' },
  'footer.phone': { ms: 'Telefon', en: 'Phone' },
  'footer.email': { ms: 'E-mel', en: 'Email' },
  'footer.hours': { ms: 'Waktu Operasi', en: 'Operating Hours' },
  'footer.weekdays': { ms: 'Isnin - Jumaat: 8:00 AM - 5:00 PM', en: 'Monday - Friday: 8:00 AM - 5:00 PM' },
  
  // Application Form
  'form.title': { ms: 'Borang Permohonan Pelekat OKU', en: 'OKU Sticker Application Form' },
  'form.personalInfo': { ms: 'Maklumat Peribadi', en: 'Personal Information' },
  'form.fullName': { ms: 'Nama Penuh', en: 'Full Name' },
  'form.icNumber': { ms: 'No. Kad Pengenalan', en: 'IC Number' },
  'form.okuNumber': { ms: 'No. Kad OKU', en: 'OKU Card Number' },
  'form.phone': { ms: 'No. Telefon', en: 'Phone Number' },
  'form.email': { ms: 'E-mel', en: 'Email' },
  'form.address': { ms: 'Alamat', en: 'Address' },
  'form.vehicleInfo': { ms: 'Maklumat Kenderaan', en: 'Vehicle Information' },
  'form.plateNumber': { ms: 'No. Pendaftaran Kenderaan', en: 'Vehicle Registration Number' },
  'form.vehicleType': { ms: 'Jenis Kenderaan', en: 'Vehicle Type' },
  'form.documents': { ms: 'Dokumen Sokongan', en: 'Supporting Documents' },
  'form.icCopy': { ms: 'Salinan Kad Pengenalan', en: 'IC Copy' },
  'form.okuCard': { ms: 'Salinan Kad OKU', en: 'OKU Card Copy' },
  'form.grant': { ms: 'Salinan Geran Kenderaan', en: 'Vehicle Grant Copy' },
  'form.submit': { ms: 'Hantar Permohonan', en: 'Submit Application' },
  'form.submitting': { ms: 'Menghantar...', en: 'Submitting...' },
  'form.success': { ms: 'Permohonan berjaya dihantar!', en: 'Application submitted successfully!' },
  'form.refNumberLabel': { ms: 'No. Rujukan Anda', en: 'Your Reference Number' },
  
  // Dashboard
  'dashboard.title': { ms: 'Carta Statistik', en: 'Statistics Dashboard' },
  'dashboard.selectYear': { ms: 'Pilih Tahun', en: 'Select Year' },
  'dashboard.lastUpdated': { ms: 'Kemaskini terakhir', en: 'Last updated' },
  'dashboard.autoUpdate': { ms: 'Auto-update: Setiap hari 8:00 AM (Isnin-Jumaat)', en: 'Auto-update: Daily 8:00 AM (Monday-Friday)' },
  'dashboard.totalApplications': { ms: 'Jumlah Permohonan', en: 'Total Applications' },
  'dashboard.newApplications': { ms: 'Permohonan Baharu', en: 'New Applications' },
  'dashboard.renewals': { ms: 'Pembaharuan', en: 'Renewals' },
  'dashboard.notRenewed': { ms: 'Tidak Diperbaharui', en: 'Not Renewed' },
  'dashboard.expired': { ms: 'Tamat tempoh', en: 'Expired' },
  'dashboard.ofTotal': { ms: 'daripada jumlah', en: 'of total' },
  'dashboard.year': { ms: 'Tahun', en: 'Year' },
  'dashboard.applicationTypes': { ms: 'Jenis Permohonan', en: 'Application Types' },
  'dashboard.applicationTypesDesc': { ms: 'Pecahan mengikut jenis permohonan', en: 'Breakdown by application type' },
  'dashboard.applicationStatus': { ms: 'Status Permohonan', en: 'Application Status' },
  'dashboard.applicationStatusDesc': { ms: 'Pecahan mengikut status', en: 'Breakdown by status' },
  'dashboard.monthlyTrend': { ms: 'Trend Bulanan', en: 'Monthly Trend' },
  'dashboard.monthlyTrendDesc': { ms: 'Jumlah permohonan mengikut bulan', en: 'Total applications by month' },
  'dashboard.applications': { ms: 'Permohonan', en: 'Applications' },
  
  // Admin Dashboard
  'admin.title': { ms: 'Panel Admin', en: 'Admin Panel' },
  'admin.subtitle': { ms: 'Pengurusan Permohonan Pelekat OKU', en: 'OKU Sticker Application Management' },
  'admin.login': { ms: 'Log Masuk', en: 'Login' },
  'admin.username': { ms: 'Nama Pengguna', en: 'Username' },
  'admin.password': { ms: 'Kata Laluan', en: 'Password' },
  'admin.applications': { ms: 'Permohonan', en: 'Applications' },
  'admin.search': { ms: 'Cari...', en: 'Search...' },
  'admin.searchPlaceholder': { ms: 'Cth: REF12345678, PTGS/2025/001, 850215-10-5432', en: 'E.g: REF12345678, PTGS/2025/001, 850215-10-5432' },
  'admin.filter': { ms: 'Tapis', en: 'Filter' },
  'admin.all': { ms: 'Semua', en: 'All' },
  'admin.export': { ms: 'Eksport Data (CSV)', en: 'Export Data (CSV)' },
  'admin.exportDesc': { ms: 'Pilih julat tarikh untuk eksport', en: 'Select date range for export' },
  'admin.dateFrom': { ms: 'Tarikh Mula', en: 'Date From' },
  'admin.dateTo': { ms: 'Tarikh Akhir', en: 'Date To' },
  'admin.download': { ms: 'Muat Turun CSV', en: 'Download CSV' },
  'admin.searchFilter': { ms: 'Carian & Penapis', en: 'Search & Filter' },
  'admin.searchLabel': { ms: 'Cari (No Rujukan, No Siri, IC, Nama)', en: 'Search (Ref No, Serial No, IC, Name)' },
  'admin.status': { ms: 'Status', en: 'Status' },
  'admin.applicationList': { ms: 'Senarai Permohonan', en: 'Application List' },
  'admin.approve': { ms: 'Luluskan', en: 'Approve' },
  'admin.reject': { ms: 'Tolak', en: 'Reject' },
  'admin.ready': { ms: 'Sedia', en: 'Ready' },
  'admin.collected': { ms: 'Diambil', en: 'Collected' },
  'admin.viewDetails': { ms: 'Lihat Butiran', en: 'View Details' },
  'admin.logout': { ms: 'Log Keluar', en: 'Logout' },
  'admin.refNo': { ms: 'No. Rujukan', en: 'Ref. No' },
  'admin.serialNo': { ms: 'No. Siri', en: 'Serial No' },
  'admin.type': { ms: 'Jenis', en: 'Type' },
  'admin.name': { ms: 'Nama', en: 'Name' },
  'admin.icNo': { ms: 'No. IC', en: 'IC No' },
  'admin.dateApplied': { ms: 'Tarikh Mohon', en: 'Date Applied' },
  'admin.actions': { ms: 'Tindakan', en: 'Actions' },
  'admin.noApplications': { ms: 'Tiada permohonan dijumpai', en: 'No applications found' },
  'admin.loading': { ms: 'Loading data from Supabase...', en: 'Loading data from Supabase...' },
  
  // Status
  'status.dalamProses': { ms: 'Dalam Proses', en: 'In Process' },
  'status.diluluskan': { ms: 'Diluluskan', en: 'Approved' },
  'status.sediaDiambil': { ms: 'Sedia Diambil', en: 'Ready for Collection' },
  'status.telahDiambil': { ms: 'Telah Diambil', en: 'Collected' },
  'status.tidakBerjaya': { ms: 'Tidak Berjaya', en: 'Rejected' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ms');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
