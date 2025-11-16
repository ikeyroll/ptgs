"use client";

import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t, language } = useLanguage();

  return (
    <footer className="bg-muted border-t mt-20">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">PTGS</h3>
            <p className="text-sm text-muted-foreground">
              {language === 'ms'
                ? 'BTM - Bahagian Teknologi Maklumat, Pejabat Tanah dan Galian Selangor'
                : 'IT Division, Selangor Land & Mines Office'}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.contact')}</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  PEJABAT TANAH DAN GALIAN NEGERI SELANGOR<br/>
                  Tingkat 3 Bangunan Sultan Salahuddin Abdul Aziz Shah<br/>
                  40576 Shah Alam, Selangor Darul Ehsan.
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>
                  +60 19-674 9360 (Hayati) · +60 12-236 5901 (Muhammad)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>norhayati.mahmud@selangor.gov.my · muhammad@selangor.gov.my</span>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.hours')}</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>Isnin - Khamis: 8.30 pagi - 3.30 petang</p>
                  <p>Jumaat: 8.30 pagi - 11.45 pagi dan 2.45 petang - 3.30 petang</p>
                  <p>Sabtu - Ahad: Tutup</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>Hak Cipta Terpelihara @ 2022 Pejabat Tanah dan Galian Negeri Selangor</p>
        </div>
      </div>
    </footer>
  );
}
