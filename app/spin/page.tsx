"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, Gift, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { createBrowserClient } from "@supabase/ssr"

interface SpinData {
  chances_left: number
  total_winnings: number
  recent_wins: Array<{ amount: number; created_at: string }>
}

const SPIN_REWARDS = [0.5, 0.7, 1, 2, 5, 10, 15, 35, 100]

export default function SpinWheelPage() {
  const [spinData, setSpinData] = useState<SpinData | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [lastWin, setLastWin] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchSpinData()
  }, [])

  const fetchSpinData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get spin chances
      const { data: spinChances } = await supabase
        .from("spin_chances")
        .select("chances_left")
        .eq("user_id", user.id)
        .single()

      // Get affiliate earnings from spins
      const { data: spinWinnings } = await supabase
        .from("affiliate_earnings")
        .select("amount, created_at")
        .eq("user_id", user.id)
        .eq("source", "spin")
        .order("created_at", { ascending: false })

      const totalWinnings = spinWinnings?.reduce((sum, win) => sum + win.amount, 0) || 0

      setSpinData({
        chances_left: spinChances?.chances_left || 2,
        total_winnings: totalWinnings,
        recent_wins: spinWinnings?.slice(0, 5) || [],
      })
    } catch (error) {
      console.error("Error fetching spin data:", error)
      toast.error("Failed to load spin data")
    } finally {
      setLoading(false)
    }
  }

  const handleSpin = async () => {
    if (!spinData || spinData.chances_left <= 0) {
      toast.error("No spins left! Invite more users to get more chances.")
      return
    }

    setSpinning(true)
    setLastWin(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Simulate spin with weighted probabilities (favor smaller rewards)
      const weights = [30, 25, 20, 15, 5, 3, 1.5, 0.4, 0.1] // Higher weight = more likely
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
      const random = Math.random() * totalWeight

      let cumulativeWeight = 0
      let rewardIndex = 0

      for (let i = 0; i < weights.length; i++) {
        cumulativeWeight += weights[i]
        if (random <= cumulativeWeight) {
          rewardIndex = i
          break
        }
      }

      const reward = SPIN_REWARDS[rewardIndex]

      // Simulate spinning animation
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Update database
      await supabase
        .from("spin_chances")
        .update({ chances_left: spinData.chances_left - 1 })
        .eq("user_id", user.id)

      // Add winnings to affiliate_earnings
      await supabase.from("affiliate_earnings").insert({
        user_id: user.id,
        from_user_id: user.id,
        amount: reward,
        source: "spin",
      })

      // Update wallet balance if reward >= $2
      if (reward >= 2) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("available_balance")
          .eq("user_id", user.id)
          .single()

        await supabase
          .from("wallets")
          .update({
            available_balance: (wallet?.available_balance || 0) + reward,
          })
          .eq("user_id", user.id)

        toast.success(`🎉 You won $${reward}! Added to your wallet.`)
      } else {
        toast.success(`🎉 You won $${reward}! Invite more users to unlock withdrawal.`)
      }

      setLastWin(reward)
      fetchSpinData()
    } catch (error) {
      console.error("Error spinning:", error)
      toast.error("Spin failed. Please try again.")
    } finally {
      setSpinning(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Spin Wheel</h1>
        <Badge variant="secondary" className="text-sm">
          {spinData?.chances_left} spins left
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spin Wheel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Spin to Win
            </CardTitle>
            <CardDescription>Use your free spins to win instant rewards!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wheel Visual */}
            <div className="relative mx-auto w-64 h-64 rounded-full border-8 border-primary bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div
                className={`w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center transition-transform duration-3000 ${spinning ? "animate-spin" : ""}`}
              >
                <div className="text-white font-bold text-xl">{spinning ? "🎰" : lastWin ? `$${lastWin}` : "💰"}</div>
              </div>
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-primary"></div>
              </div>
            </div>

            {/* Spin Button */}
            <Button
              onClick={handleSpin}
              disabled={spinning || !spinData || spinData.chances_left <= 0}
              className="w-full h-12 text-lg"
            >
              {spinning ? "Spinning..." : "SPIN NOW!"}
            </Button>

            {spinData?.chances_left === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No spins left. Invite friends to get more chances!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats & Rewards */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Total Winnings:</span>
                <span className="font-bold">${spinData?.total_winnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Spins Remaining:</span>
                <span className="font-bold">{spinData?.chances_left}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Win:</span>
                <span className="font-bold">{lastWin ? `$${lastWin}` : "None yet"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Possible Rewards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Possible Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {SPIN_REWARDS.map((reward, index) => (
                  <div
                    key={index}
                    className={`p-2 text-center rounded border ${
                      reward >= 10
                        ? "bg-yellow-500/10 border-yellow-500"
                        : reward >= 5
                          ? "bg-orange-500/10 border-orange-500"
                          : "bg-green-500/10 border-green-500"
                    }`}
                  >
                    <div className="font-bold">${reward}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">* Winnings ≥$2 are added to your wallet instantly</p>
              <p className="text-xs text-muted-foreground">* Smaller winnings require more referrals to withdraw</p>
            </CardContent>
          </Card>

          {/* Recent Wins */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Wins</CardTitle>
            </CardHeader>
            <CardContent>
              {spinData?.recent_wins.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No wins yet</p>
              ) : (
                <div className="space-y-2">
                  {spinData?.recent_wins.map((win, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <span className="font-bold text-green-600">${win.amount}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(win.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
