"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { createApplication, generateRefNumber, uploadFile } from '@/lib/api/applications';
import { MapPicker } from '@/components/MapPicker';
import { loadBoundaryGeoJSON, isPointInsideGeoJSON } from '@/lib/geo';

export default function PendaftaranBaharu() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Jenis Permohonan (auto-set to 'baru')
    applicationType: 'baru' as 'baru' | 'pembaharuan',
    
    // Maklumat Pemohon
    pemohonName: '',
    pemohonIC: '',
    pemohonEmail: '',
    pemohonPhone: '',
    pemohonDepartment: '',
    pemohonPosition: '',
    pemohonAddress: '',
    
    // Maklumat Peralatan
    equipmentType: '',
    equipmentModel: '',
    equipmentQuantity: '1',
    equipmentPurpose: '',
    equipmentJustification: '',
  });
  
  // Geo fields (auto-sync with map)
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [daerah, setDaerah] = useState<string | undefined>(undefined);
  const [mukim, setMukim] = useState<string | undefined>(undefined);
  // District boundary and validation
  const [boundary, setBoundary] = useState<any | null>(null);
  const [boundaryLoaded, setBoundaryLoaded] = useState<boolean>(false);
  const [isInsideDistrict, setIsInsideDistrict] = useState<boolean>(true);
  
  const [documents, setDocuments] = useState({
    icCopy: null as File | null,
    justificationLetter: null as File | null,
    departmentApproval: null as File | null,
    otherDocuments: null as File | null,
  });

  useEffect(() => {
    // Get IC from sessionStorage
    const ic = sessionStorage.getItem('applicantIC');
    if (ic) {
      // Format IC number (accept both formats)
      const formattedIC = formatICNumber(ic);
      setFormData(prev => ({ ...prev, pemohonIC: formattedIC }));
    }
  }, []);

  // Load Hulu Selangor boundary once
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_HULU_SELANGOR_GEOJSON_URL as string | undefined;
    if (!url) {
      console.warn('Hulu Selangor GeoJSON URL is not configured.');
      setBoundaryLoaded(false);
      return;
    }
    loadBoundaryGeoJSON(url)
      .then((gj) => {
        setBoundary(gj);
        setBoundaryLoaded(!!gj);
        console.log('Boundary loaded:', gj?.type, Array.isArray((gj as any)?.features) ? (gj as any).features.length : 'n/a');
      })
      .catch((err) => {
        console.error('Failed to load boundary', err);
        setBoundary(null);
        setBoundaryLoaded(false);
      });
  }, []);

  // Recompute inside/outside when coordinates change
  useEffect(() => {
    if (latitude == null || longitude == null) return;
    if (!boundary) return;
    const inside = isPointInsideGeoJSON({ lat: latitude, lon: longitude }, boundary);
    console.log('Boundary check:', { lat: latitude, lon: longitude, inside });
    setIsInsideDistrict(inside);
  }, [latitude, longitude, boundary]);

  // Format IC number to standard format (850215-10-5432)
  const formatICNumber = (ic: string) => {
    // Remove all non-digits
    const digits = ic.replace(/\D/g, '');
    
    // Format as XXXXXX-XX-XXXX
    if (digits.length === 12) {
      return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
    }
    
    return ic; // Return as-is if not 12 digits
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof documents) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments(prev => ({ ...prev, [type]: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInsideDistrict) {
      toast.error('Lokasi di luar daerah Hulu Selangor. Sila pilih lokasi dalam kawasan Hulu Selangor.');
      return;
    }
    
    // Validation - Maklumat Pemohon (WAJIB)
    if (!formData.pemohonName || !formData.pemohonIC || !formData.pemohonEmail ||
        !formData.pemohonPhone || !formData.pemohonDepartment || !formData.pemohonPosition ||
        !formData.pemohonAddress) {
      toast.error('Sila lengkapkan semua maklumat pemohon yang diwajibkan');
      return;
    }

    // Validation - Maklumat Peralatan (WAJIB)
    if (!formData.equipmentType || !formData.equipmentQuantity || 
        !formData.equipmentPurpose || !formData.equipmentJustification) {
      toast.error('Sila lengkapkan semua maklumat peralatan yang diwajibkan');
      return;
    }

    // Validation - Documents (WAJIB)
    if (!documents.icCopy || !documents.justificationLetter || !documents.departmentApproval) {
      toast.error('Sila muat naik semua dokumen yang diwajibkan');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Generate reference number
      const refNo = await generateRefNumber('baru');
      toast.info('Generating reference number...');
      
      // 2. Upload documents to Supabase Storage
      toast.info('Uploading documents...');
      const uploadedDocs = {
        icCopy: await uploadFile(documents.icCopy!, `${refNo}/ic-copy.pdf`),
        justificationLetter: await uploadFile(documents.justificationLetter!, `${refNo}/justification.pdf`),
        departmentApproval: await uploadFile(documents.departmentApproval!, `${refNo}/approval.pdf`),
        otherDocuments: documents.otherDocuments 
          ? await uploadFile(documents.otherDocuments, `${refNo}/other.pdf`)
          : undefined
      };
      
      // 3. Prepare application data
      const applicationData = {
        ref_no: refNo,
        application_type: 'baru' as const,
        pemohon: {
          name: formData.pemohonName,
          ic: formData.pemohonIC,
          email: formData.pemohonEmail,
          phone: formData.pemohonPhone,
          department: formData.pemohonDepartment,
          position: formData.pemohonPosition,
          address: formData.pemohonAddress,
        },
        equipment: {
          type: formData.equipmentType,
          model: formData.equipmentModel || undefined,
          quantity: parseInt(formData.equipmentQuantity),
          purpose: formData.equipmentPurpose,
          justification: formData.equipmentJustification,
        },
        documents: uploadedDocs,
        status: 'Dalam Proses' as const,
        submitted_date: new Date().toISOString(),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        daerah,
        mukim,
      };
      
      // 4. Save to Supabase
      toast.info('Saving application...');
      await createApplication(applicationData);
      
      // 5. Store in sessionStorage
      sessionStorage.setItem('lastRefNo', refNo);
      
      toast.success('Permohonan berjaya dihantar!');
      
      // 6. Redirect to success page
      router.push(`/permohonan/berjaya?ref=${refNo}&type=new`);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Ralat semasa menghantar permohonan');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Borang Permohonan Peralatan ICT</h1>
            <p className="text-muted-foreground">Pejabat Tanah dan Galian Selangor</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Jenis Permohonan - Auto Selected */}
            <Card>
              <CardHeader>
                <CardTitle>Jenis Permohonan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="applicationType" 
                      value="baru"
                      checked={formData.applicationType === 'baru'}
                      disabled
                      className="mr-2"
                    />
                    <span className="font-medium">☑ Baru</span>
                  </label>
                  <label className="flex items-center opacity-50">
                    <input 
                      type="radio" 
                      name="applicationType" 
                      value="pembaharuan"
                      checked={formData.applicationType === 'pembaharuan'}
                      disabled
                      className="mr-2"
                    />
                    <span>☐ Pembaharuan</span>
                  </label>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  <Info className="w-4 h-4 inline mr-1" />
                  Jenis permohonan telah dipilih berdasarkan semakan IC anda
                </p>
              </CardContent>
            </Card>

            {/* a) Maklumat Pemohon - WAJIB */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>a) Maklumat Pemohon</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 font-medium">WAJIB DIISI</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pemohonName">Nama Pemohon *</Label>
                    <Input
                      id="pemohonName"
                      name="pemohonName"
                      value={formData.pemohonName}
                      onChange={handleInputChange}
                      placeholder="Ahmad bin Ali"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pemohonIC">No. Kad Pengenalan *</Label>
                    <Input
                      id="pemohonIC"
                      name="pemohonIC"
                      value={formData.pemohonIC}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: 850215-10-5432 atau 850215105432
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="pemohonEmail">E-mel *</Label>
                    <Input
                      id="pemohonEmail"
                      name="pemohonEmail"
                      type="email"
                      value={formData.pemohonEmail}
                      onChange={handleInputChange}
                      placeholder="user@ptgs.gov.my"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pemohonPhone">No. Tel *</Label>
                    <Input
                      id="pemohonPhone"
                      name="pemohonPhone"
                      type="tel"
                      value={formData.pemohonPhone}
                      onChange={handleInputChange}
                      placeholder="0123456789"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pemohonDepartment">Jabatan *</Label>
                    <Input
                      id="pemohonDepartment"
                      name="pemohonDepartment"
                      value={formData.pemohonDepartment}
                      onChange={handleInputChange}
                      placeholder="Contoh: Bahagian Teknologi Maklumat"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pemohonPosition">Jawatan *</Label>
                    <Input
                      id="pemohonPosition"
                      name="pemohonPosition"
                      value={formData.pemohonPosition}
                      onChange={handleInputChange}
                      placeholder="Contoh: Pegawai IT"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="pemohonAddress">Alamat *</Label>
                    <Textarea
                      id="pemohonAddress"
                      name="pemohonAddress"
                      value={formData.pemohonAddress}
                      onChange={handleInputChange}
                      placeholder="No 123, Jalan Merdeka, Taman Sejahtera, 44000 Kuala Kubu Bharu, Selangor"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <MapPicker
                      address={formData.pemohonAddress}
                      lat={latitude ?? undefined}
                      lon={longitude ?? undefined}
                      invalid={boundaryLoaded && !isInsideDistrict}
                      onLocationChange={(loc) => {
                        if (loc.address) {
                          setFormData(prev => ({ ...prev, pemohonAddress: loc.address! }));
                        }
                        setLatitude(loc.lat);
                        setLongitude(loc.lon);
                        if (loc.daerah) setDaerah(loc.daerah);
                        if (loc.mukim) setMukim(loc.mukim);
                      }}
                    />
                    {!isInsideDistrict && (
                      <p className="mt-2 text-sm text-red-600">
                        Lokasi di luar daerah Hulu Selangor. Sila pilih lokasi dalam kawasan Hulu Selangor.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* b) Maklumat Peralatan - WAJIB */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle>b) Maklumat Peralatan</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 font-medium">WAJIB DIISI</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="equipmentType">Jenis Peralatan *</Label>
                    <Input
                      id="equipmentType"
                      name="equipmentType"
                      value={formData.equipmentType}
                      onChange={handleInputChange}
                      placeholder="Contoh: Komputer Riba, Pencetak, Projektor"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipmentModel">Model (Pilihan)</Label>
                    <Input
                      id="equipmentModel"
                      name="equipmentModel"
                      value={formData.equipmentModel}
                      onChange={handleInputChange}
                      placeholder="Contoh: Dell Latitude 5420"
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipmentQuantity">Kuantiti *</Label>
                    <Input
                      id="equipmentQuantity"
                      name="equipmentQuantity"
                      type="number"
                      min="1"
                      value={formData.equipmentQuantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="equipmentPurpose">Tujuan Permohonan *</Label>
                    <Textarea
                      id="equipmentPurpose"
                      name="equipmentPurpose"
                      value={formData.equipmentPurpose}
                      onChange={handleInputChange}
                      placeholder="Nyatakan tujuan penggunaan peralatan"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="equipmentJustification">Justifikasi Permohonan *</Label>
                    <Textarea
                      id="equipmentJustification"
                      name="equipmentJustification"
                      value={formData.equipmentJustification}
                      onChange={handleInputChange}
                      placeholder="Nyatakan justifikasi keperluan peralatan ini"
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dokumen Diperlukan - WAJIB */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle>Dokumen Diperlukan</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 font-medium">SEMUA DOKUMEN WAJIB DIMUAT NAIK</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="icCopy">Salinan Kad Pengenalan *</Label>
                  <Input
                    id="icCopy"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'icCopy')}
                    required
                    className="mt-2"
                  />
                  {documents.icCopy && (
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {documents.icCopy.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="justificationLetter">Surat Justifikasi Permohonan *</Label>
                  <Input
                    id="justificationLetter"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e, 'justificationLetter')}
                    required
                    className="mt-2"
                  />
                  {documents.justificationLetter && (
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {documents.justificationLetter.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="departmentApproval">Kelulusan Ketua Jabatan *</Label>
                  <Input
                    id="departmentApproval"
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => handleFileChange(e, 'departmentApproval')}
                    required
                    className="mt-2"
                  />
                  {documents.departmentApproval && (
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {documents.departmentApproval.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="otherDocuments">Dokumen Lain (Pilihan)</Label>
                  <Input
                    id="otherDocuments"
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => handleFileChange(e, 'otherDocuments')}
                    className="mt-2"
                  />
                  {documents.otherDocuments && (
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {documents.otherDocuments.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !boundaryLoaded || !isInsideDistrict}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghantar Permohonan...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Hantar Permohonan
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
