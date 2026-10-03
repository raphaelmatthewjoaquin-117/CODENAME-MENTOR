import localFont from "next/font/local";
import { Caveat, Indie_Flower, Permanent_Marker, Kalam, Shadows_Into_Light } from "next/font/google";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "500", "600", "700"],
});

const indieFlower = Indie_Flower({
  subsets: ["latin"],
  variable: "--font-indie-flower",
  weight: ["400"],
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  variable: "--font-permanent-marker",
  weight: ["400"],
});

const kalam = Kalam({
  subsets: ["latin"],
  variable: "--font-kalam",
  weight: ["300", "400", "700"],
});

const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  variable: "--font-shadows-into-light",
  weight: ["400"],
});

export const metadata = {
  title: "Professor's Day Appreciation Board",
  description:
    "A virtual bulletin board where students send warm notes and professors collect them.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${caveat.variable} ${indieFlower.variable} ${permanentMarker.variable} ${kalam.variable} ${shadowsIntoLight.variable} font-sans antialiased`}>
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
