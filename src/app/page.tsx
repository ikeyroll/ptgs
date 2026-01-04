"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
// import StatusChecker from '@/components/StatusChecker'; // REMOVED
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Upload, CheckCircle, Package, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getApplicationsByEmail } from '@/lib/api/applications';

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [emailRegistered, setEmailRegistered] = useState<boolean | null>(null);
  const [userApps, setUserApps] = useState<any[] | null>(null);
  const [showButtons, setShowButtons] = useState(false);

  // Check if email exists in Supabase database
  const checkEmail = async (em: string) => {
    console.log('🔍 Homepage - Checking Email:', em);
    setIsChecking(true);
    setShowButtons(false);
    
    try {
      const cleanEmail = em.trim().toLowerCase();
      console.log('📡 Calling getApplicationsByEmail with:', cleanEmail);
      const apps = await getApplicationsByEmail(cleanEmail);
      console.log('✅ Email lookup complete. Count:', apps.length);
      setEmailRegistered(apps.length > 0);
      setUserApps(apps);
      setShowButtons(true);
    } catch (error) {
      console.log('❌ Email lookup error or not found');
      setEmailRegistered(false);
      setUserApps(null);
      setShowButtons(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      checkEmail(email);
    }
  };

  const handleNewRegistration = () => {
    sessionStorage.setItem('applicantEmail', email);
    router.push('/pendaftaran');
  };

  const handleStartNewRequest = () => {
    sessionStorage.setItem('applicantEmail', email);
    router.push('/pendaftaran');
  };

  const processSteps = [
    {
      icon: <FileText className="h-8 w-8" />,
      titleKey: 'process.step1.title',
      descKey: 'process.step1.desc',
    },
    {
      icon: <Upload className="h-8 w-8" />,
      titleKey: 'process.step2.title',
      descKey: 'process.step2.desc',
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      titleKey: 'process.step3.title',
      descKey: 'process.step3.desc',
    },
    {
      icon: <Package className="h-8 w-8" />,
      titleKey: 'process.step4.title',
      descKey: 'process.step4.desc',
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section with IC Validation */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                {/* Logo MPHS */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36">
                    <Image
                      src="/ptgs.png"
                      alt="Logo PTGS"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
                
                {/* Nama Penuh Majlis */}
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                    {t('hero.mphs')}
                  </h2>
                  <p className="text-base sm:text-lg text-muted-foreground italic">
                    {t('hero.mphs.en')}
                  </p>
                </div>
                
                {/* Sistem Title */}
                <div className="border-t border-b border-primary/20 py-6 space-y-4">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                      {t('hero.title')}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      {t('hero.subtitle')}
                    </p>
                  </div>
                  
                  {/* Description Box */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-blue-800 text-justify">
                      {t('hero.description')}
                    </p>
                  </div>
                </div>
              </div>

              <Card className="shadow-lg">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{t('hero.enterIC')}</CardTitle>
                  <CardDescription>{t('hero.checkRegistration')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder={t('hero.icPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="text-lg h-12"
                        disabled={isChecking}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg"
                      disabled={isChecking || !email.trim()}
                    >
                      {isChecking ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t('hero.checking')}
                        </>
                      ) : (
                        t('hero.check')
                      )}
                    </Button>
                  </form>

                  {/* Show buttons after checking */}
                  {showButtons && (
                    <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                      {emailRegistered ? (
                        <>
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                            <p className="text-green-800 font-medium mb-3">
                              {t('hero.recordFound')}
                            </p>
                          </div>
                          <Button 
                            onClick={handleStartNewRequest}
                            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                          >
                            {t('hero.startNewRequest')}
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                          {/* Detailed previous applications */}
                          {Array.isArray(userApps) && userApps.length > 0 && (
                            <div className="mt-4">
                              <div className="text-left font-semibold mb-2">Permohonan Terdahulu</div>
                              <div className="space-y-3">
                                {userApps.slice(0, 5).map((app: any) => {
                                  const pemohon = typeof app.pemohon === 'string' ? JSON.parse(app.pemohon) : app.pemohon;
                                  const submitted = app.submitted_date ? new Date(app.submitted_date) : null;
                                  const submittedStr = submitted ? submitted.toLocaleDateString('ms-MY') : '-';
                                  const assets = Array.isArray(pemohon?.assets) ? pemohon.assets.join(', ') : '-';
                                  const justification = pemohon?.justification || '-';
                                  const adminNotes = app.admin_notes || '';
                                  return (
                                    <div key={app.id} className="border rounded-lg p-3 text-sm">
                                      <div className="flex items-center justify-between">
                                        <div className="font-mono font-semibold">{app.ref_no}</div>
                                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">{app.status}</span>
                                      </div>
                                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-muted-foreground">
                                        <div>
                                          <div className="text-xs">Tarikh</div>
                                          <div className="text-foreground">{submittedStr}</div>
                                        </div>
                                        <div className="sm:col-span-2">
                                          <div className="text-xs">Aset Dipohon</div>
                                          <div className="text-foreground">{assets}</div>
                                        </div>
                                      </div>
                                      <div className="mt-2">
                                        <div className="text-xs text-muted-foreground">Justifikasi</div>
                                        <div className="text-foreground">{justification}</div>
                                      </div>
                                      {adminNotes && (
                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                          <div className="text-xs text-blue-800 font-semibold mb-1">Nota Admin</div>
                                          <div className="text-blue-900">{adminNotes}</div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                            <p className="text-amber-800 font-medium mb-3">
                              {t('hero.noRecord')}
                            </p>
                          </div>
                          <Button 
                            onClick={handleNewRegistration}
                            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                          >
                            {t('hero.registerNow')}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </section>

        {/* Status Checker Section */}
        {/* StatusChecker section REMOVED - use Semak IC page instead */}
      </main>
      <Footer />
    </>
  );
}