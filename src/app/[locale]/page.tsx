"use client";

import { useEffect } from "react";
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function SellerHome() {
  const router = useRouter();
  const t = useTranslations('common');

  useEffect(() => {
    router.push("/seller/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t('loading')}...
        </h1>
      </div>
    </div>
  );
}


