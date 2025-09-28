import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardPageLayout from "@/components/dashboard/layout"
import SystemControl from "@/components/system/system-control"
import { Settings } from "lucide-react"

export default async function SystemPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <DashboardPageLayout
      header={{
        title: "System Control",
        description: "Monitor and control your trading system",
        icon: Settings,
      }}
    >
      <SystemControl userId={data.user.id} />
    </DashboardPageLayout>
  )
}
