import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardPageLayout from "@/components/dashboard/layout"
import TradingPlatform from "@/components/trading/trading-platform"
import { TrendingUp } from "lucide-react"

export default async function TradePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Trading Platform",
        description: "Execute trades and monitor market movements",
        icon: TrendingUp,
      }}
    >
      <TradingPlatform userId={data.user.id} />
    </DashboardPageLayout>
  )
}
