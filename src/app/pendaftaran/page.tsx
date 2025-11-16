"use client";

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

    setLoading(true);
    try {
      // Upload documents (optional)
      let documents: any = {};
      if (docs && docs.length > 0) {
        const uploads = await Promise.all(
          Array.from(docs).map(async (file, idx) => {
            const path = `pendaftaran/${Date.now()}_${idx}_${file.name}`;
            const url = await uploadFile(file as File, path);
            return { name: file.name, url };
          })
        );
        documents.uploads = uploads;
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

      // Back to homepage
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Ralat semasa menghantar permohonan.');
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
                  <Label htmlFor="email">E-mel</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                {/* Nama */}
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama</Label>
                  <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} required />
                </div>

                {/* Bahagian */}
                <div className="space-y-2">
                  <Label htmlFor="bahagian">Bahagian</Label>
                  <Input id="bahagian" value={bahagian} onChange={(e) => setBahagian(e.target.value)} required />
                </div>

                {/* Tarikh Permohonan */}
                <div className="space-y-2">
                  <Label htmlFor="tarikh">Tarikh Permohonan</Label>
                  <Input id="tarikh" type="date" value={tarikhPermohonan} onChange={(e) => setTarikhPermohonan(e.target.value)} required />
                </div>

                {/* Aset (Multi-select via checkboxes) */}
                <div className="space-y-2">
                  <Label>Aset</Label>
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
                  <Label htmlFor="justifikasi">Justifikasi</Label>
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
                  <Label>Jenis Pengguna</Label>
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
                    <Label htmlFor="peranan">Peranan (eTanah)</Label>
                    <Input id="peranan" value={peranan} onChange={(e) => setPeranan(e.target.value)} required />
                  </div>
                )}

                {/* Upload Dokumen */}
                <div className="space-y-2">
                  <Label htmlFor="docs">Muat Naik Dokumen (opsyenal)</Label>
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
    </>
  );
}
