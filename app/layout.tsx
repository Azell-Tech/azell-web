import "./globals.css";

export const metadata = {
  title: "Azell | Portal",
  description: "Portal de inversión Azell",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="az-sans">{children}</body>
    </html>
  );
}
