import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/lib/context/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Aktiv Grotesk - Todas las variantes
const aktivGrotesk = localFont({
  src: [
    // Hairline
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-Hairline.ttf',
      weight: '50',
      style: 'normal',
    },
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-HairlineItalic.ttf',
      weight: '50',
      style: 'italic',
    },
    // Thin
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-Thin.ttf',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-ThinItalic.ttf',
      weight: '100',
      style: 'italic',
    },
    // Light
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-LightItalic.ttf',
      weight: '300',
      style: 'italic',
    },
    // Regular
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    // Medium
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-MediumItalic.ttf',
      weight: '500',
      style: 'italic',
    },
    // Bold
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-BoldItalic.ttf',
      weight: '700',
      style: 'italic',
    },
    // XBold (la principal que más usaremos)
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-XBold.ttf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-XBoldItalic.ttf',
      weight: '800',
      style: 'italic',
    },
    // Black
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-Black.ttf',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../public/fonts/aktiv-grotesk/AktivGrotesk-BlackItalic.ttf',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-aktiv',
});

export const metadata: Metadata = {
  title: " Redy Marketplace App",
  description: "Compra y vende equipo deportivo de segunda mano de calidad y confianza en Redy. Encuentra ofertas increíbles o vende tu equipo usado de forma segura. ¡Únete a nuestra comunidad deportiva hoy mismo!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${aktivGrotesk.variable}`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
