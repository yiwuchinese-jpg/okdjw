import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Outfit, Noto_Sans_SC } from "next/font/google";
import "../globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { CustomCursor } from "@/components/ui/CustomCursor";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

const notoMobile = Noto_Sans_SC({
  variable: "--font-noto-zh",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    metadataBase: new URL('https://okdjw.com'),
    title: {
      default: t('title'),
      template: `%s | ${t('title')}`
    },
    description: t('description'),
    keywords: ["Yiwu Entrepreneur", "Full-stack Developer", "Growth Hacker", "AI Automation", "Global Marketing"],
    authors: [{ name: "Justin Du", url: "https://okdjw.com" }],
    creator: "Justin Du",
    openGraph: {
      type: "website",
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      url: `https://okdjw.com/${locale}`,
      title: t('title'),
      description: t('description'),
      siteName: "OKdjw",
      images: [
        {
          url: '/images/chineseyiwu.png',
          width: 1200,
          height: 630,
          alt: 'OKdjw - Justin Du Portfolio',
        }
      ],
    },
    icons: {
      icon: '/icon.svg',
    },
    twitter: {
      card: "summary_large_image",
      title: t('title'),
      description: t('description'),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body
        className={`${outfit.variable} ${notoMobile.variable} antialiased cursor-none font-sans overflow-x-hidden`}
      >
        <NextIntlClientProvider messages={messages}>
          <CustomCursor />
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
