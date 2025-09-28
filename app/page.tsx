import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardPageLayout from "@/components/dashboard/layout"
import TradingDashboard from "@/components/trading/dashboard"
import { TrendingUp } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Trading Dashboard",
        description: "Monitor your portfolio and trading performance",
        icon: TrendingUp,
      }}
    >
      <TradingDashboard userId={data.user.id} />
    </DashboardPageLayout>
  )
}
