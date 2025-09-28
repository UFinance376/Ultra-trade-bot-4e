import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardPageLayout from "@/components/dashboard/layout"
import P2PTransfer from "@/components/p2p/p2p-transfer"
import { ArrowUpDown } from "lucide-react"

export default async function P2PPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <DashboardPageLayout
      header={{
        title: "P2P Transfer",
        description: "Transfer funds to other Ultra Finance users",
        icon: ArrowUpDown,
      }}
    >
      <P2PTransfer userId={data.user.id} />
    </DashboardPageLayout>
  )
}
