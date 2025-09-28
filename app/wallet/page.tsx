import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardPageLayout from "@/components/dashboard/layout"
import WalletManager from "@/components/wallet/wallet-manager"
import { Wallet } from "lucide-react"

export default async function WalletPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Wallet",
        description: "Manage your deposits and withdrawals",
        icon: Wallet,
      }}
    >
      <WalletManager userId={data.user.id} />
    </DashboardPageLayout>
  )
}
