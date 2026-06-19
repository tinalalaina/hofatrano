import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { fetchMe, logoutUser, SessionUser } from "@/lib/session";
import { OwnerHouse, OwnerReservation, OwnerStats, OwnerVisit } from "@/features/owner/types";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Home,
  LayoutDashboard,
  Lightbulb,
  Menu,
  MessageSquare,
  Search,
  Star,
  Wallet,
} from "lucide-react";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Area, AreaChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

const currency = new Intl.NumberFormat("fr-FR");

type DashboardTab = "dashboard" | "maisons" | "ajouter" | "visites" | "reservations";

interface OwnerDashboardDataShape {
  stats: OwnerStats;
  houses: OwnerHouse[];
  visits: OwnerVisit[];
  reservations: OwnerReservation[];
}

interface OwnerDashboardLayoutProps {
  tab: string;
  onTabChange: (tab: DashboardTab) => void;
  data?: OwnerDashboardDataShape;
  children: ReactNode;
}

const navItems: { value: DashboardTab | "messages" | "avis" | "revenus" | "parametres"; label: string; icon: typeof LayoutDashboard }[] = [
  { value: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { value: "maisons", label: "Mes maisons", icon: Home },
  { value: "visites", label: "Demandes de visite", icon: MessageSquare },
  { value: "reservations", label: "Demandes de réservation", icon: CalendarDays },
  { value: "reservations", label: "Réservations", icon: CalendarCheck },
  { value: "messages", label: "Messages", icon: MessageSquare },
  { value: "avis", label: "Avis et évaluations", icon: Star },
  { value: "revenus", label: "Revenus et paiements", icon: Wallet },
  { value: "parametres", label: "Paramètres", icon: CreditCard },
];

const OwnerDashboardLayout = ({ tab, onTabChange, data, children }: OwnerDashboardLayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetchMe().then(setUser).catch(() => setUser(null));
  }, []);

  const name = user?.first_name || user?.username || "Propriétaire";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[300px] border-r bg-white xl:block">
        <div className="flex h-full flex-col p-6">
          <Link to="/" className="mb-10 flex items-center gap-1 text-3xl font-display font-bold text-primary">
            Trano<span className="text-sm font-body font-normal text-muted-foreground">.mg</span>
          </Link>
          <nav className="space-y-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isFunctional = ["dashboard", "maisons", "visites", "reservations"].includes(item.value);
              const isActive = tab === item.value || (tab === "ajouter" && item.value === "maisons");
              return (
                <button
                  key={`${item.label}-${index}`}
                  className={cn(
                    "relative flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-sm font-medium text-slate-700 transition hover:bg-primary/5 hover:text-primary",
                    isActive && "bg-primary/10 text-primary shadow-sm before:absolute before:-left-6 before:h-12 before:w-1.5 before:rounded-r-full before:bg-primary",
                    !isFunctional && "opacity-80",
                  )}
                  onClick={() => {
                    if (isFunctional) {
                      onTabChange(item.value as DashboardTab);
                      setMobileNavOpen(false);
                    }
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl border bg-primary/5 p-5">
            <CircleHelp className="mb-3 h-10 w-10 text-primary" />
            <p className="font-semibold text-primary">Besoin d'aide ?</p>
            <p className="mt-2 text-sm text-muted-foreground">Notre équipe est là pour vous accompagner.</p>
            <Button className="mt-4 w-full" size="sm">Contacter support</Button>
          </div>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button aria-label="Fermer le menu" className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative h-full w-[300px] max-w-[85vw] border-r bg-white p-6 shadow-2xl">
            <Link to="/" className="mb-8 flex items-center gap-1 text-3xl font-display font-bold text-primary">
              Trano<span className="text-sm font-body font-normal text-muted-foreground">.mg</span>
            </Link>
            <nav className="space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isFunctional = ["dashboard", "maisons", "visites", "reservations"].includes(item.value);
                const isActive = tab === item.value || (tab === "ajouter" && item.value === "maisons");
                return (
                  <button
                    key={`mobile-${item.label}-${index}`}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-sm font-medium text-slate-700",
                      isActive && "bg-primary/10 text-primary",
                      !isFunctional && "opacity-60",
                    )}
                    onClick={() => {
                      if (isFunctional) {
                        onTabChange(item.value as DashboardTab);
                        setMobileNavOpen(false);
                      }
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="xl:pl-[300px]">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-white/95 px-5 backdrop-blur md:px-10">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="xl:hidden" onClick={() => setMobileNavOpen(true)}><Menu className="h-5 w-5" /></Button>
            <div className="hidden h-11 w-[320px] items-center gap-3 rounded-xl border bg-slate-50 px-4 md:flex lg:w-[480px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Rechercher..." />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="h-5 w-5" />
            <MessageSquare className="h-5 w-5" />
            <Avatar>
              <AvatarImage src={user?.photo_url} />
              <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <button className="hidden items-center gap-2 text-sm font-semibold md:flex" onClick={async () => { await logoutUser(); navigate("/"); }}>
              Propriétaire <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1480px] p-5 md:p-10">
          {tab === "dashboard" && data ? <OwnerDashboardHome data={data} ownerName={name} onTabChange={onTabChange} /> : children}
        </main>
      </div>
    </div>
  );
};

const OwnerDashboardHome = ({ data, ownerName, onTabChange }: { data: OwnerDashboardDataShape; ownerName: string; onTabChange: (tab: DashboardTab) => void }) => {
  const revenueData = useMemo(() => [
    { day: "01 Mai", revenue: Math.round(data.stats.revenue_total * 0.05) },
    { day: "08 Mai", revenue: Math.round(data.stats.revenue_total * 0.18) },
    { day: "15 Mai", revenue: Math.round(data.stats.revenue_total * 0.32) },
    { day: "22 Mai", revenue: Math.round(data.stats.revenue_total * 0.62) },
    { day: "29 Mai", revenue: data.stats.revenue_total },
  ], [data.stats.revenue_total]);
  const published = data.houses.filter((house) => ["published", "validated"].includes(house.status)).length;
  const draft = data.houses.filter((house) => house.status === "draft").length;
  const pieData = [
    { name: "En attente de validation", value: data.stats.houses_pending_validation, color: "#f15a24" },
    { name: "Publiées", value: published, color: "#22c55e" },
    { name: "Brouillons", value: draft, color: "#e5e7eb" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div><h1 className="text-3xl font-bold">Bonjour, {ownerName} 👋</h1><p className="mt-2 text-muted-foreground">Voici un aperçu de vos activités sur Trano.mg.</p></div>
        <Button className="h-12 rounded-xl px-6" onClick={() => onTabChange("ajouter")}><Home className="mr-2 h-4 w-4" />Ajouter une maison</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Home} label="Maisons publiées" value={data.stats.houses_total} hint="+1 ce mois" />
        <StatCard icon={CalendarDays} label="Demandes de visite" value={data.stats.visits_pending} hint="+4 ce mois" />
        <StatCard icon={CalendarCheck} label="Réservations" value={data.stats.reservations_total} hint="+2 ce mois" />
        <StatCard icon={Wallet} label="Revenus générés" value={`${currency.format(data.stats.revenue_total)} Ar`} hint="+10% ce mois" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1.1fr_1fr]">
        <Card><CardHeader><CardTitle>Aperçu des revenus</CardTitle></CardHeader><CardContent><ChartContainer config={{ revenue: { color: "#f15a24" } }} className="h-[280px] w-full"><AreaChart data={revenueData}><XAxis dataKey="day" /><YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000000)}M Ar`} /><ChartTooltip content={<ChartTooltipContent />} /><Area dataKey="revenue" type="monotone" stroke="#f15a24" fill="#f15a24" fillOpacity={0.16} /></AreaChart></ChartContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Répartition des maisons</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-1"><ChartContainer config={{ houses: { color: "#22c55e" } }} className="mx-auto h-[210px] w-full"><PieChart><Pie data={pieData} innerRadius={55} outerRadius={88} dataKey="value">{pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie></PieChart></ChartContainer><div className="space-y-3">{pieData.map((entry) => <div key={entry.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: entry.color }} />{entry.name}</span><b>{entry.value}</b></div>)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Activités récentes</CardTitle></CardHeader><CardContent className="space-y-5">{[...data.visits.slice(0, 2), ...data.reservations.slice(0, 2)].map((item, i) => <div key={`${item.id}-${i}`} className="flex items-start justify-between gap-3 text-sm"><span>{"houseTitle" in item ? `Réservation ${item.status}` : `Visite ${item.status}`}<small className="block text-muted-foreground">{"houseTitle" in item ? item.houseTitle : item.houseTitle}</small></span><span className="text-xs text-muted-foreground">Hier</span></div>)}<button className="text-sm font-medium" onClick={() => onTabChange("visites")}>Voir toutes les activités →</button></CardContent></Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_0.7fr]">
        <Card><CardHeader><CardTitle>Performances des maisons</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-slate-100 text-muted-foreground"><tr><th className="rounded-l-lg p-3 text-left">Maison</th><th>Vues</th><th>Demandes</th><th>Réservations</th><th>Taux d'occupation</th><th className="rounded-r-lg">Revenus</th></tr></thead><tbody>{data.houses.slice(0, 4).map((house, index) => { const rate = index === 0 ? 75 : 60; return <tr key={house.id} className="border-b"><td className="flex items-center gap-3 p-3"><img src={house.image} className="h-12 w-16 rounded-md object-cover" /><span><b>{house.title}</b><small className="block text-muted-foreground">{house.city}</small></span></td><td className="text-center">{1245 - index * 355}</td><td className="text-center">{8 - index}</td><td className="text-center">{3 - index}</td><td><Progress value={rate} className="h-2" /></td><td className="text-center">{currency.format(Math.round(data.stats.revenue_total / Math.max(data.houses.length, 1)))} Ar</td></tr>; })}</tbody></table><button className="mt-4 text-sm" onClick={() => onTabChange("maisons")}>Voir toutes les maisons →</button></CardContent></Card>
        <Card><CardHeader><CardTitle>Conseils pour vous</CardTitle></CardHeader><CardContent className="flex gap-4"><Lightbulb className="h-10 w-10 text-green-500" /><div><b>Complétez votre profil</b><p className="mt-2 text-sm text-muted-foreground">Ajoutez vos informations fiscales pour recevoir vos paiements plus rapidement.</p><button className="mt-4 text-sm font-semibold text-primary">Compléter maintenant →</button></div></CardContent></Card>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, hint }: { icon: typeof Home; label: string; value: string | number; hint: string }) => (
  <Card className="shadow-sm"><CardContent className="flex items-center gap-6 p-6"><span className="rounded-full bg-primary/10 p-4 text-primary"><Icon className="h-6 w-6" /></span><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-2 text-sm font-medium text-green-600">{hint}</p></div></CardContent></Card>
);

export default OwnerDashboardLayout;
