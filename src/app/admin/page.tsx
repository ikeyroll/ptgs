"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Download, Eye, CheckCircle, XCircle, Calendar, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateNoSiri } from '@/lib/generateNoSiri';
import { exportWithDateRange } from '@/lib/csvExport';
import { useLanguage } from '@/contexts/LanguageContext';
import { getApplications, updateApplication, approveApplication, rejectApplication } from '@/lib/api/applications';
 
import type { Application } from '@/lib/supabase';

// No mock data - using Supabase only

export default function AdminPanel() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      router.push('/admin/login');
    } else {
      // Load data from Supabase
      loadApplications();
    }
  }, [router]);

  // Load applications from Supabase
  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getApplications();
      setApplications(data);
      toast.success(`Loaded ${data.length} applications from database`);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Error loading data from Supabase');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    document.cookie = 'adminLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/admin/login');
  };
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [adminNoteDraft, setAdminNoteDraft] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  // Helper function to get application year
  const getApplicationYear = (submittedDate: string): string => {
    try {
      return new Date(submittedDate).getFullYear().toString();
    } catch (e) {
      return '-';
    }
  };

  // Get unique application years from applications
  const getUniqueYears = () => {
    const years = new Set<string>();
    applications.forEach(app => {
      const year = getApplicationYear(app.submitted_date);
      if (year !== '-') {
        years.add(year);
      }
    });
    return Array.from(years).sort().reverse(); // Sort by most recent first
  };

  

  

  // Show only applications from the new flow (with pemohon.email)
  const visibleApps = applications.filter((app) => {
    try {
      const p = typeof app.pemohon === 'string' ? JSON.parse(app.pemohon) : app.pemohon;
      return !!p?.email;
    } catch {
      return false;
    }
  });

  // Filter applications
  const filteredApps = visibleApps.filter((app) => {
    const p = typeof app.pemohon === 'string' ? JSON.parse(app.pemohon) : app.pemohon;
    const assetsList = Array.isArray(p?.assets) ? p.assets.join(', ') : '';
    const hay = `${app.ref_no} ${p?.name || ''} ${p?.email || ''}`.toLowerCase();
    const matchesSearch = hay.includes(searchQuery.toLowerCase());
    
    // Match status directly (already normalized in database)
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    const appYear = getApplicationYear(app.submitted_date);
    const matchesYear = sessionFilter === 'all' || appYear === sessionFilter;
    
    return matchesSearch && matchesStatus && matchesYear;
  });

  // Notes-only workflow: no approve/reject handlers

  const handleExportCSV = () => {
    if (!dateFrom || !dateTo) {
      toast.error('Sila pilih tarikh mula dan tarikh akhir');
      return;
    }

    exportWithDateRange(applications, new Date(dateFrom), new Date(dateTo));
    toast.success('CSV berjaya dimuat turun');
  };

  // Notes-only workflow: no mark ready/collected handlers

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Dalam Proses':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Dalam Proses</Badge>;
      case 'Diluluskan':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Diluluskan</Badge>;
      case 'Tidak Berjaya':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Tidak Berjaya</Badge>;
      case 'Ditolak':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Tidak Berjaya</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'baru' 
      ? <Badge variant="outline" className="bg-blue-50 text-blue-700">Baharu</Badge>
      : <Badge variant="outline" className="bg-purple-50 text-purple-700">Pembaharuan</Badge>;
  };

  // Handle approve
  const handleApprove = async () => {
    if (!selectedApp) return;
    try {
      await approveApplication(selectedApp.id);
      toast.success('Permohonan telah diluluskan!');
      setShowApproveModal(false);
      loadApplications();
    } catch (error: any) {
      toast.error(error.message || 'Gagal meluluskan permohonan');
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedApp || !rejectionNotes.trim()) return;
    if (wordCount > 80) {
      toast.error('Catatan melebihi 80 perkataan');
      return;
    }
    try {
      await rejectApplication(selectedApp.id, rejectionNotes);
      toast.success('Permohonan telah ditolak');
      setShowRejectModal(false);
      setRejectionNotes('');
      loadApplications();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menolak permohonan');
    }
  };

  // Handle delete
  const handleDelete = async (app: Application) => {
    if (!confirm(`Adakah anda pasti untuk memadam permohonan ${app.ref_no}?`)) return;
    try {
      const { error } = await (await import('@/lib/supabase')).supabase
        .from('applications')
        .delete()
        .eq('id', app.id);
      if (error) throw error;
      toast.success('Permohonan telah dipadam');
      loadApplications();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memadam permohonan');
    }
  };

  const wordCount = rejectionNotes.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('admin.title')}</h1>
              <p className="text-muted-foreground">{t('admin.subtitle')}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              {t('admin.logout')}
            </Button>
          </div>

          {/* Export CSV - MOVED TO TOP */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('admin.export')}</CardTitle>
              <CardDescription>{t('admin.exportDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-2 block">{t('admin.dateFrom')}</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">{t('admin.dateTo')}</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleExportCSV} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {t('admin.download')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          

          {/* Search & Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('admin.searchFilter')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-3">
                <div className="md:col-span-2">
                  <Label className="mb-2 block">{t('admin.searchLabel')}</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('admin.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">{t('admin.status')}</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('admin.all')}</SelectItem>
                      <SelectItem value="Dalam Proses">Dalam Proses</SelectItem>
                      <SelectItem value="Diluluskan">Diluluskan</SelectItem>
                      <SelectItem value="Tidak Berjaya">Tidak Berjaya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">{language === 'en' ? 'Application Year' : 'Tahun Mohon'}</Label>
                  <Select value={sessionFilter} onValueChange={setSessionFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === 'en' ? 'All' : 'Semua'}</SelectItem>
                      {getUniqueYears().map(year => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.applicationList')} ({filteredApps.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">{t('admin.loading')}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.refNo')}</TableHead>
                        <TableHead>{t('admin.type')}</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>E-mel</TableHead>
                        <TableHead>Aset</TableHead>
                        <TableHead>{t('admin.status')}</TableHead>
                        <TableHead>{t('admin.dateApplied')}</TableHead>
                        <TableHead className="text-right">{t('admin.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApps.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {t('admin.noApplications')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredApps.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.ref_no}</TableCell>
                          <TableCell>{getTypeBadge(app.application_type)}</TableCell>
                          <TableCell>{(typeof app.pemohon==='string'? JSON.parse(app.pemohon): app.pemohon)?.name}</TableCell>
                          <TableCell>{(typeof app.pemohon==='string'? JSON.parse(app.pemohon): app.pemohon)?.email}</TableCell>
                          <TableCell className="text-sm">{(() => { const p = (typeof app.pemohon==='string'? JSON.parse(app.pemohon): app.pemohon); return Array.isArray(p?.assets)? p.assets.join(', '): '-'; })()}</TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell>{new Date(app.submitted_date).toLocaleDateString('ms-MY')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApp(app);
                                  try {
                                    const p = typeof app.pemohon === 'string' ? JSON.parse(app.pemohon) : app.pemohon;
                                    setAdminNoteDraft(app.admin_notes || '');
                                  } catch {
                                    setAdminNoteDraft(app.admin_notes || '');
                                  }
                                  setShowDetailModal(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(app)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Butiran Permohonan</DialogTitle>
            <DialogDescription>No. Rujukan: {selectedApp?.ref_no}</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Maklumat Permohonan</h4>
                {(() => { const p = typeof selectedApp.pemohon === 'string' ? JSON.parse(selectedApp.pemohon) : selectedApp.pemohon; const submittedStr = selectedApp.submitted_date ? new Date(selectedApp.submitted_date).toLocaleDateString('ms-MY') : '-'; const assets = Array.isArray(p?.assets)? p.assets.join(', '): '-'; return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Nama:</span> {p?.name || '-'}</div>
                    <div><span className="text-muted-foreground">E-mel:</span> {p?.email || '-'}</div>
                    <div><span className="text-muted-foreground">Bahagian:</span> {p?.bahagian || '-'}</div>
                    <div><span className="text-muted-foreground">Tarikh Permohonan:</span> {submittedStr}</div>
                    <div><span className="text-muted-foreground">Jenis Pengguna:</span> {p?.userType || '-'}</div>
                    {p?.userType === 'eTanah' && (
                      <div><span className="text-muted-foreground">Peranan (eTanah):</span> {p?.peranan || '-'}</div>
                    )}
                    <div className="sm:col-span-2"><span className="text-muted-foreground">Aset Dipohon:</span> {assets}</div>
                    <div className="sm:col-span-2"><span className="text-muted-foreground">Justifikasi:</span> {p?.justification || '-'}</div>
                  </div>
                ); })()}
              </div>


              {/* Approve/Reject/Edit Buttons */}
              <div className="flex gap-3">
                {selectedApp.status === 'Dalam Proses' && (
                  <>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowApproveModal(true);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Luluskan
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowRejectModal(true);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Tolak
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (!selectedApp) return;
                    const pemohon = typeof selectedApp.pemohon === 'string' ? JSON.parse(selectedApp.pemohon) : selectedApp.pemohon;
                    setEditFormData({
                      name: pemohon?.name || '',
                      email: pemohon?.email || '',
                      bahagian: pemohon?.bahagian || '',
                      justification: pemohon?.justification || '',
                      assets: pemohon?.assets || []
                    });
                    setIsEditMode(true);
                  }}
                >
                  Kemaskini
                </Button>
              </div>

              <div className="p-4 bg-blue-50 border-l-4 border-l-blue-500 rounded">
                <h4 className="font-semibold text-blue-800 mb-2">Catatan Admin</h4>
                <textarea
                  className="w-full border rounded p-2 min-h-[100px] bg-white"
                  value={adminNoteDraft}
                  onChange={(e)=>setAdminNoteDraft(e.target.value)}
                  placeholder="Masukkan nota untuk pengguna (dipaparkan kepada pengguna)"
                />
                <div className="mt-2 flex justify-end">
                  <Button onClick={async ()=>{
                    if (!selectedApp) return;
                    try {
                      const updated = await updateApplication(selectedApp.id, { admin_notes: adminNoteDraft });
                      setSelectedApp({ ...selectedApp, admin_notes: updated.admin_notes } as any);
                      toast.success('Nota telah disimpan');
                    } catch (e) {
                      toast.error('Gagal menyimpan nota');
                    }
                  }}>Simpan Nota</Button>
                </div>
              </div>

              {/* No expiry display for asset borrow workflow */}

              {/* Documents Section */}
              {selectedApp.documents && (() => {
                try {
                  const docs = typeof selectedApp.documents === 'string' ? JSON.parse(selectedApp.documents) : selectedApp.documents;
                  console.log('Documents data:', docs);
                  const hasDocuments = docs?.uploads && Array.isArray(docs.uploads) && docs.uploads.length > 0;
                  
                  return (
                    <div>
                      <h4 className="font-semibold mb-3">Dokumen Yang Dimuat Naik</h4>
                      {hasDocuments ? (
                        <div className="grid grid-cols-1 gap-3">
                          {docs.uploads.map((doc: any, idx: number) => (
                            doc.url ? (
                              <a 
                                key={idx}
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                              >
                                <FileText className="w-5 h-5 text-blue-600" />
                                <div className="text-sm">
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-xs text-muted-foreground">Klik untuk lihat</p>
                                </div>
                              </a>
                            ) : (
                              <div key={idx} className="p-3 border rounded-lg bg-gray-50 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <div className="text-sm">
                                  <p className="font-medium text-gray-600">{doc.name}</p>
                                  <p className="text-xs text-red-500">{doc.error || 'Fail gagal dimuat naik'}</p>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Tiada dokumen dimuat naik</p>
                      )}
                    </div>
                  );
                } catch (error) {
                  console.error('Error parsing documents:', error);
                  return (
                    <div>
                      <h4 className="font-semibold mb-3">Dokumen Yang Dimuat Naik</h4>
                      <p className="text-sm text-muted-foreground">Tiada dokumen dimuat naik</p>
                    </div>
                  );
                }
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Luluskan Permohonan</DialogTitle>
            <DialogDescription>
              Adakah anda pasti untuk meluluskan permohonan ini?
            </DialogDescription>
          </DialogHeader>
          {selectedApp && (() => {
            const pemohon = typeof selectedApp.pemohon === 'string' ? JSON.parse(selectedApp.pemohon) : selectedApp.pemohon;
            const assets = Array.isArray(pemohon?.assets) ? pemohon.assets.join(', ') : '-';
            return (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-700">No. Rujukan: <span className="font-semibold">{selectedApp.ref_no}</span></p>
                  <p className="text-sm text-blue-700">Nama: <span className="font-semibold">{pemohon?.name || '-'}</span></p>
                  <p className="text-sm text-blue-700 mt-2">Aset yang Dipinjam: <span className="font-semibold">{assets}</span></p>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>Batal</Button>
            <Button onClick={handleApprove}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Sahkan Kelulusan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permohonan Tidak Lengkap</DialogTitle>
            <DialogDescription>
              Sila nyatakan sebab permohonan tidak lengkap
            </DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-700">No. Rujukan: <span className="font-semibold">{selectedApp.ref_no}</span></p>
                <p className="text-sm text-red-700">Nama: <span className="font-semibold">{(() => {
                  const p = typeof selectedApp.pemohon === 'string' ? JSON.parse(selectedApp.pemohon) : selectedApp.pemohon;
                  return p?.name || '-';
                })()}</span></p>
              </div>
              
              <div>
                <Label htmlFor="notes">Sebab/Catatan (Maksimum 80 perkataan) *</Label>
                <Textarea
                  id="notes"
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Nyatakan sebab permohonan tidak lengkap. Contoh: Dokumen tidak lengkap, maklumat tidak tepat, dll."
                  rows={4}
                  className="mt-2"
                />
                <p className={`text-sm mt-1 ${wordCount > 80 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {wordCount}/80 perkataan
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectModal(false);
              setRejectionNotes('');
            }}>Batal</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionNotes.trim() || wordCount > 80}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Sahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kemaskini Maklumat Permohonan</DialogTitle>
            <DialogDescription>No. Rujukan: {selectedApp?.ref_no}</DialogDescription>
          </DialogHeader>
          {editFormData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nama</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">E-mel</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-bahagian">Bahagian</Label>
                <Input
                  id="edit-bahagian"
                  value={editFormData.bahagian}
                  onChange={(e) => setEditFormData({ ...editFormData, bahagian: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-justification">Justifikasi</Label>
                <Textarea
                  id="edit-justification"
                  value={editFormData.justification}
                  onChange={(e) => setEditFormData({ ...editFormData, justification: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditMode(false)}>Batal</Button>
            <Button onClick={async () => {
              if (!selectedApp || !editFormData) return;
              try {
                const currentPemohon = typeof selectedApp.pemohon === 'string' ? JSON.parse(selectedApp.pemohon) : selectedApp.pemohon;
                const updatedPemohon = {
                  ...currentPemohon,
                  name: editFormData.name,
                  email: editFormData.email,
                  bahagian: editFormData.bahagian,
                  justification: editFormData.justification,
                  assets: editFormData.assets
                };
                await updateApplication(selectedApp.id, { pemohon: updatedPemohon });
                toast.success('Maklumat telah dikemaskini');
                setIsEditMode(false);
                loadApplications();
              } catch (e) {
                toast.error('Gagal mengemas kini maklumat');
              }
            }}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
}
