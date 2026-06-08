import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Props {
  title: string;
  subtitle?: string;
}

const SimplePage = ({ title, subtitle }: Props) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1 container mx-auto px-4 py-10">
      <h1 className="text-3xl font-display mb-2">{title}</h1>
      <p className="text-muted-foreground">{subtitle || "Page en place et prête à être enrichie."}</p>
    </main>
    <Footer />
  </div>
);

export default SimplePage;
