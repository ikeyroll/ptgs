"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, AlertCircle, ArrowRight, Calendar, Clock, FileText } from 'lucide-react';
import { getApplicationsByEmail } from '@/lib/api/applications';
import type { Application } from '@/lib/supabase';

export default function SemakEmail() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) {
      setError('Sila masukkan alamat e-mel');
      return;
    }

    setLoading(true);
    setError('');
    setApplications([]);
    setSearched(false);

    try {
      const apps = await getApplicationsByEmail(email.trim());
      setApplications(apps);
      setSearched(true);
      
      if (apps.length === 0) {
        setError('Tiada permohonan dijumpai untuk e-mel ini');
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError('Ralat semasa mencari permohonan');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'Dalam Proses': { label: 'Dalam Proses', className: 'bg-yellow-200 text-yellow-900 border-yellow-400' },
      'Diluluskan': { label: 'Diluluskan', className: '!bg-green-500 !text-white !border-green-600' },
      'Sedia Diambil': { label: 'Sedia Diambil', className: 'bg-blue-500 text-white border-blue-600' },
      'Telah Diambil': { label: 'Telah Diambil', className: 'bg-purple-500 text-white border-purple-600' },
      'Tidak Berjaya': { label: 'Tidak Berjaya', className: '!bg-red-500 !text-white !border-red-600' },
      'Tidak Lengkap': { label: 'Tidak Lengkap', className: '!bg-red-500 !text-white !border-red-600' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-300' };
    
    return (
      <Badge variant="outline" className={`${config.className} font-semibold px-3 py-1`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Dalam Proses':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'Diluluskan':
          return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Sedia Diambil':

      case 'Telah Diambil':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Tidak Berjaya':
         return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'Tidak Lengkap':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                <Image
                  src="/ptgs.png"
                  alt="Logo PTGS"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            
            <div className="mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                Majlis Perbandaran Hulu Selangor
              </h2>
            </div>
            
            <div className="border-t border-b border-primary/20 py-4 mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Semak Status Permohonan</h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                Untuk menyemak status pendaftaran e-mel anda
              </p>
            </div>
          </div>

          {/* Search Card */}
          <Card className="shadow-lg mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sila Masukkan E-mel</CardTitle>
              <CardDescription>Untuk menyemak status pendaftaran anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="izzat02@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-center text-lg"
                  disabled={loading}
                />
              </div>

              <Button 
                onClick={handleSearch} 
                disabled={loading || !email}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mencari...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Semak
                  </>
                )}
              </Button>

              {/* Success Message */}
              {searched && applications.length > 0 && (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-green-800 font-semibold">✓ E-mel berdaftar</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-yellow-800 font-medium">{error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applications List */}
          {applications.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Permohonan Terdahulu</h2>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {applications.length} Permohonan
                </Badge>
              </div>

              {applications.map((app) => {
                const pemohon = typeof app.pemohon === 'string' ? JSON.parse(app.pemohon) : app.pemohon;
                const assets = Array.isArray(pemohon?.assets) ? pemohon.assets.join(', ') : '-';
                const justification = pemohon?.justification || '-';

                return (
                  <Card key={app.id} className="hover:shadow-lg transition-shadow border-2">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(app.status)}
                            <div>
                              <div className="font-mono font-bold text-lg text-primary">
                                {app.ref_no}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                No. Rujukan
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(app.status)}
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Tarikh</div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{formatDate(app.submitted_date)}</span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Aset Dipohon</div>
                            <div className="font-semibold text-sm">{assets}</div>
                          </div>

                          <div className="sm:col-span-2">
                            <div className="text-xs text-muted-foreground mb-1">Justifikasi</div>
                            <div className="text-sm line-clamp-2">{justification}</div>
                          </div>
                        </div>

                        {/* Status-specific Messages */}
                        {app.status === 'Dalam Proses' && (
                          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <div className="flex items-start gap-3">
                              <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-yellow-900 mb-1">
                                  Permohonan Sedang Diproses
                                </p>
                                <p className="text-sm text-yellow-800">
                                  Sila tunggu keputusan dalam masa 5 hari bekerja.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {app.status === 'Diluluskan' && (
                          <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-semibold text-green-900 mb-1">
                                  Permohonan Diluluskan
                                </p>
                                <p className="text-sm text-green-800">
                                  Permohonan anda telah diluluskan. Sila tunggu untuk pengambilan.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {app.status === 'Sedia Diambil' && (
                          <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-semibold text-blue-900 mb-1">
                                  Sedia Untuk Diambil
                                </p>
                                <p className="text-sm text-blue-800">
                                  Aset anda sudah sedia untuk diambil di Pejabat MPHS.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {app.status === 'Telah Diambil' && (
                          <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-semibold text-purple-900 mb-1">
                                  Telah Diambil
                                </p>
                                <p className="text-sm text-purple-800">
                                  Aset telah diambil. Terima kasih!
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {(app.status === 'Tidak Berjaya' || (app.status as string) === 'Tidak Lengkap') && (
                          <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-semibold text-red-900 mb-1">
                                  Permohonan Tidak Lengkap
                                </p>
                                {app.admin_notes && (
                                  <div className="mt-2 p-3 bg-white rounded border border-red-200">
                                    <p className="text-xs text-red-700 font-semibold mb-1">
                                      Catatan Admin:
                                    </p>
                                    <p className="text-sm text-red-800">{app.admin_notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* New Application Button */}
              <Card className="border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors">
                <CardContent className="p-6">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-6 text-lg"
                    onClick={() => router.push('/pendaftaran')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowRight className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold">Permohonan Baharu</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          Klik untuk membuat permohonan baharu
                        </div>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
