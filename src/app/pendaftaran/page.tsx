"use client";

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createApplication, generateRefNumber, uploadFile } from '@/lib/api/applications';

export default function PendaftaranPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [nama, setNama] = useState('');
  const [bahagian, setBahagian] = useState('');
  const [tarikhPermohonan, setTarikhPermohonan] = useState<string>('');
  const [aset, setAset] = useState<string[]>([]);
  const [justifikasi, setJustifikasi] = useState('');
  const [userType, setUserType] = useState<'PTGS' | 'eTanah' | ''>('');
  const [peranan, setPeranan] = useState('');

  // Documents
  const [docs, setDocs] = useState<FileList | null>(null);
  
  // Success dialog
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('applicantEmail');
    if (stored) setEmail(stored);
    // Default tarikh permohonan to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setTarikhPermohonan(`${yyyy}-${mm}-${dd}`);
  }, []);

  const asetOptions = [
    'Laptop',
    'Printer',
    'Projector',
    'Set Computer',
    'Scanner',
    'Biometric',
  ];

  const toggleAset = (item: string) => {
    setAset((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !nama || !bahagian || !tarikhPermohonan || aset.length === 0 || !justifikasi || !userType || (userType === 'eTanah' && !peranan)) {
      alert('Sila lengkapkan semua ruangan yang diperlukan.');
      return;
    }

    // Validate file sizes (max 5MB per file)
    if (docs && docs.length > 0) {
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      for (let i = 0; i < docs.length; i++) {
        if (docs[i].size > maxSize) {
          alert(`Fail "${docs[i].name}" melebihi saiz maksimum 5MB. Sila pilih fail yang lebih kecil.`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Upload documents (optional) - continue even if upload fails
      let documents: any = {};
      if (docs && docs.length > 0) {
        try {
          const uploads = await Promise.all(
            Array.from(docs).map(async (file, idx) => {
              try {
                const path = `pendaftaran/${Date.now()}_${idx}_${file.name}`;
                const url = await uploadFile(file as File, path);
                return { name: file.name, url };
              } catch (uploadErr) {
                console.warn('Failed to upload file:', file.name, uploadErr);
                return { name: file.name, url: null, error: 'Upload failed' };
              }
            })
          );
          documents.uploads = uploads;
        } catch (uploadErr) {
          console.warn('Document upload failed, continuing without documents:', uploadErr);
          documents.uploads = [];
        }
      }

      // Generate a reference number
      const refNo = await generateRefNumber('baru');

      const pemohon = {
        email,
        name: nama,
        bahagian,
        tarikhPermohonan,
        userType,
        peranan: userType === 'eTanah' ? peranan : undefined,
        justification: justifikasi,
        assets: aset,
      };

      const newApp = await createApplication({
        ref_no: refNo,
        application_type: 'baru',
        pemohon,
        documents,
        status: 'Dalam Proses',
        submitted_date: new Date().toISOString(),
      } as any);

      // Show success dialog
      setShowSuccess(true);
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Ralat semasa menghantar permohonan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Pendaftaran Baharu</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mel <span className="text-red-600">*</span></Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                {/* Nama */}
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama <span className="text-red-600">*</span></Label>
                  <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} required />
                </div>

                {/* Bahagian */}
                <div className="space-y-2">
                  <Label htmlFor="bahagian">Bahagian <span className="text-red-600">*</span></Label>
                  <Input id="bahagian" value={bahagian} onChange={(e) => setBahagian(e.target.value)} required />
                </div>

                {/* Tarikh Permohonan */}
                <div className="space-y-2">
                  <Label htmlFor="tarikh">Tarikh Permohonan <span className="text-red-600">*</span></Label>
                  <Input id="tarikh" type="date" value={tarikhPermohonan} onChange={(e) => setTarikhPermohonan(e.target.value)} required />
                </div>

                {/* Aset (Multi-select via checkboxes) */}
                <div className="space-y-2">
                  <Label>Aset <span className="text-red-600">*</span></Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {asetOptions.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={aset.includes(opt)}
                          onChange={() => toggleAset(opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Justifikasi */}
                <div className="space-y-2">
                  <Label htmlFor="justifikasi">Justifikasi <span className="text-red-600">*</span></Label>
                  <textarea
                    id="justifikasi"
                    value={justifikasi}
                    onChange={(e) => setJustifikasi(e.target.value)}
                    className="w-full border rounded-md p-2 min-h-[120px]"
                    required
                  />
                </div>

                {/* PTGS / eTanah */}
                <div className="space-y-2">
                  <Label>Jenis Pengguna <span className="text-red-600">*</span></Label>
                  <div className="flex gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="userType" value="PTGS" checked={userType==='PTGS'} onChange={() => setUserType('PTGS')} />
                      <span>PTGS</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="userType" value="eTanah" checked={userType==='eTanah'} onChange={() => setUserType('eTanah')} />
                      <span>eTanah</span>
                    </label>
                  </div>
                </div>

                {/* Peranan (if eTanah) */}
                {userType === 'eTanah' && (
                  <div className="space-y-2">
                    <Label htmlFor="peranan">Peranan (eTanah) <span className="text-red-600">*</span></Label>
                    <Input id="peranan" value={peranan} onChange={(e) => setPeranan(e.target.value)} required />
                  </div>
                )}

                {/* Upload Dokumen */}
                <div className="space-y-2">
                  <Label htmlFor="docs">Muat Naik Dokumen (optional)</Label>
                  <Input id="docs" type="file" multiple onChange={(e) => setDocs(e.target.files)} />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Menghantar...' : 'Hantar Pendaftaran'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      
      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Berjaya!</DialogTitle>
            <DialogDescription className="text-center text-base">
              Pendaftaran anda telah berjaya dihantar.
              <br />
              Anda akan dikembalikan ke halaman utama.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
