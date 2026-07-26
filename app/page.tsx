import { getDashboardData } from "@/lib/dashboard/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KpiCards from "@/components/dashboard/KpiCards";
import WorldMap from "@/components/dashboard/WorldMap";
import TopCountries from "@/components/dashboard/TopCountries";
import PipelineFunnel from "@/components/dashboard/PipelineFunnel";
import MonthlyGrowthChart from "@/components/dashboard/MonthlyGrowthChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import TasksOpen from "@/components/dashboard/TasksOpen";
import RemindersDue from "@/components/dashboard/RemindersDue";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentProspectsTable from "@/components/dashboard/RecentProspectsTable";
import FadeIn from "@/components/dashboard/FadeIn";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Bonjour Babacar 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bienvenue sur votre espace de prospection internationale.
        </p>
      </div>

      <KpiCards
        totalProspects={data.totalProspects}
        countriesCount={data.countriesCount}
        negotiationCount={data.negotiationCount}
        offerSentCount={data.offerSentCount}
        wonCount={data.wonCount}
        conversionRate={data.conversionRate}
        monthlyGrowth={data.monthlyGrowth}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <FadeIn delay={0.05} className="xl:col-span-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Carte du monde</CardTitle>
            </CardHeader>
            <CardContent>
              <WorldMap countryStats={data.countryStats} />
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.1}>
          <Card className="h-full border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Top pays</CardTitle>
            </CardHeader>
            <CardContent>
              <TopCountries countryStats={data.countryStats} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <FadeIn delay={0.05} className="xl:col-span-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Pipeline commercial</CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineFunnel funnel={data.funnel} />
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.1}>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Évolution mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyGrowthChart data={data.monthlyGrowth} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FadeIn delay={0.05}>
          <Card className="h-full border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivity activity={data.recentActivity} />
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.1}>
          <Card className="h-full border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Tâches ouvertes</CardTitle>
            </CardHeader>
            <CardContent>
              <TasksOpen tasks={data.tasksOpen} />
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.15}>
          <Card className="h-full border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Rappels</CardTitle>
            </CardHeader>
            <CardContent>
              <RemindersDue reminders={data.remindersDue} />
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.2}>
          <Card className="h-full border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.05}>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Derniers prospects</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentProspectsTable prospects={data.recentProspects} />
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
