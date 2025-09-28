"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, TrendingUp, TrendingDown, Activity, Play, Square } from "lucide-react"
import Link from "next/link"

interface WalletData {
  available_balance: number
  locked_balance: number
  total_balance: number
}

interface TradingStats {
  totalDeals: number
  profitPercentage: number
  winRate: number
  totalProfit: number
}

interface TradingDashboardProps {
  userId: string
}

export default function TradingDashboard({ userId }: TradingDashboardProps) {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [stats, setStats] = useState<TradingStats>({
    totalDeals: 0,
    profitPercentage: 0,
    winRate: 0,
    totalProfit: 0,
  })
  const [botActive, setBotActive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [userId])

  const fetchDashboardData = async () => {
    const supabase = createClient()

    try {
      // Fetch wallet data
      const { data: walletData } = await supabase.from("wallets").select("*").eq("user_id", userId).single()

      if (walletData) {
        setWallet(walletData)
      }

      // Fetch trading stats
      const { data: tradesData } = await supabase.from("trades").select("*").eq("user_id", userId)

      if (tradesData) {
        const totalDeals = tradesData.length
        const wonTrades = tradesData.filter((trade) => trade.status === "won").length
        const winRate = totalDeals > 0 ? (wonTrades / totalDeals) * 100 : 0
        const totalProfit = tradesData.reduce((sum, trade) => sum + (trade.actual_profit || 0), 0)
        const profitPercentage = walletData?.total_balance > 0 ? (totalProfit / walletData.total_balance) * 100 : 0

        setStats({
          totalDeals,
          profitPercentage,
          winRate,
          totalProfit,
        })
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBotToggle = async () => {
    try {
      const action = botActive ? "stop" : "start"
      // This would typically call your backend API
      // For now, we'll just toggle the state
      setBotActive(!botActive)

      // TODO: Implement actual bot API calls
      console.log(`Bot ${action} requested for user ${userId}`)
    } catch (error) {
      console.error("Error toggling bot:", error)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${wallet?.available_balance?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Ready for trading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked Balance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${wallet?.locked_balance?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">In active trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${wallet?.total_balance?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Complete portfolio</p>
          </CardContent>
        </Card>
      </div>

      {/* Trading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeals}</div>
            <p className="text-xs text-muted-foreground">Executed trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit %</CardTitle>
            {stats.profitPercentage >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.profitPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stats.profitPercentage >= 0 ? "+" : ""}
              {stats.profitPercentage.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your account and start trading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button asChild className="h-12">
                <Link href="/wallet">
                  <Wallet className="mr-2 h-4 w-4" />
                  Deposit
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 bg-transparent">
                <Link href="/wallet">
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Withdraw
                </Link>
              </Button>
            </div>
            <Button asChild className="w-full h-12" size="lg">
              <Link href="/trade">
                <TrendingUp className="mr-2 h-5 w-5" />
                Start Trading
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Trading Bot
              <Badge variant={botActive ? "default" : "secondary"}>{botActive ? "Active" : "Inactive"}</Badge>
            </CardTitle>
            <CardDescription>Automated trading system for consistent profits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {botActive
                ? "Bot is currently analyzing markets and executing trades"
                : "Bot is stopped. Click to start automated trading"}
            </div>
            <Button onClick={handleBotToggle} className="w-full h-12" variant={botActive ? "destructive" : "default"}>
              {botActive ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Stop Bot
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Bot
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
