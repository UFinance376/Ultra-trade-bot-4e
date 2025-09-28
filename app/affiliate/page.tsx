"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Copy, Users, DollarSign, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { createBrowserClient } from "@supabase/ssr"

interface AffiliateData {
  affiliate_code: string
  total_earnings: number
  referred_users: Array<{ email: string; created_at: string }>
  can_withdraw: boolean
  first_time_depositors: number
}

export default function AffiliatePage() {
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchAffiliateData()
  }, [])

  const fetchAffiliateData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get user's affiliate code
      const { data: userData } = await supabase.from("users").select("affiliate_code").eq("id", user.id).single()

      // Get total earnings
      const { data: earnings } = await supabase.from("affiliate_earnings").select("amount").eq("user_id", user.id)

      const totalEarnings = earnings?.reduce((sum, earning) => sum + earning.amount, 0) || 0

      // Get referred users
      const { data: referredUsers } = await supabase
        .from("users")
        .select("email, created_at")
        .eq("referred_by", userData?.affiliate_code)

      // Count first-time depositors with balance >= $2
      const { data: depositors } = await supabase
        .from("deposits")
        .select("user_id")
        .gte("amount", 2)
        .eq("status", "confirmed")

      const uniqueDepositors = new Set(depositors?.map((d) => d.user_id)).size

      setAffiliateData({
        affiliate_code: userData?.affiliate_code || "",
        total_earnings: totalEarnings,
        referred_users: referredUsers || [],
        can_withdraw: uniqueDepositors >= 20,
        first_time_depositors: uniqueDepositors,
      })
    } catch (error) {
      console.error("Error fetching affiliate data:", error)
      toast.error("Failed to load affiliate data")
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = () => {
    const referralLink = `https://ultra-signals.com/signup?ref=${affiliateData?.affiliate_code}`
    navigator.clipboard.writeText(referralLink)
    toast.success("Referral link copied to clipboard!")
  }

  const handleWithdraw = async () => {
    if (!affiliateData?.can_withdraw) {
      toast.error("You need at least 20 first-time depositors with balance ≥$2 to withdraw")
      return
    }

    const amount = Number.parseFloat(withdrawAmount)
    if (amount <= 0 || amount > affiliateData.total_earnings) {
      toast.error("Invalid withdrawal amount")
      return
    }

    setWithdrawing(true)
    try {
      // Process withdrawal via NOWPayments API (simulated)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success("Withdrawal request submitted successfully!")
      setWithdrawAmount("")
      fetchAffiliateData()
    } catch (error) {
      toast.error("Withdrawal failed. Please try again.")
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Affiliate Program</h1>
        <Badge variant="secondary" className="text-sm">
          {affiliateData?.first_time_depositors}/20 Depositors
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${affiliateData?.total_earnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">50% of referred users' profits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referred Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliateData?.referred_users.length}</div>
            <p className="text-xs text-muted-foreground">Total referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Withdrawal Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliateData?.can_withdraw ? "Available" : "Locked"}</div>
            <p className="text-xs text-muted-foreground">Need 20 depositors ≥$2</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link to earn 50% of your referrals' trading profits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={`https://ultra-signals.com/signup?ref=${affiliateData?.affiliate_code}`}
              readOnly
              className="font-mono text-sm"
            />
            <Button onClick={copyReferralLink} size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Section */}
      <Card>
        <CardHeader>
          <CardTitle>Withdraw Earnings</CardTitle>
          <CardDescription>Minimum 20 first-time depositors with balance ≥$2 required</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Amount (USD)</Label>
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              max={affiliateData?.total_earnings}
              disabled={!affiliateData?.can_withdraw}
            />
          </div>
          <Button onClick={handleWithdraw} disabled={!affiliateData?.can_withdraw || withdrawing} className="w-full">
            {withdrawing ? "Processing..." : "Withdraw via NOWPayments"}
          </Button>
          {!affiliateData?.can_withdraw && (
            <p className="text-sm text-muted-foreground">
              You need {20 - (affiliateData?.first_time_depositors || 0)} more first-time depositors to unlock
              withdrawals
            </p>
          )}
        </CardContent>
      </Card>

      {/* Referred Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Referred Users</CardTitle>
          <CardDescription>List of users who signed up with your referral code</CardDescription>
        </CardHeader>
        <CardContent>
          {affiliateData?.referred_users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No referrals yet</p>
          ) : (
            <div className="space-y-2">
              {affiliateData?.referred_users.map((user, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">{user.email}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
