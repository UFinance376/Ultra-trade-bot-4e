"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Square, TrendingUp, TrendingDown, Activity, Target } from "lucide-react"

interface SystemControlProps {
  userId: string
}

interface TradingStats {
  totalTrades: number
  wonTrades: number
  lostTrades: number
  activeTrades: number
  winRate: number
  totalProfit: number
}

export default function SystemControl({ userId }: SystemControlProps) {
  const [botActive, setBotActive] = useState(false)
  const [stats, setStats] = useState<TradingStats>({
    totalTrades: 0,
    wonTrades: 0,
    lostTrades: 0,
    activeTrades: 0,
    winRate: 0,
    totalProfit: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTradingStats()
  }, [userId])

  const fetchTradingStats = async () => {
    try {
      const response = await fetch("/api/trades")
      const data = await response.json()

      if (response.ok && data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching trading stats:", error)
    }
  }

  const handleBotToggle = async () => {
    setLoading(true)

    try {
      const endpoint = botActive ? "/api/bot/stop" : "/api/bot/start"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      })

      const data = await response.json()

      if (response.ok) {
        setBotActive(!botActive)
        alert(data.message)
      } else {
        throw new Error(data.error || "Failed to toggle bot")
      }
    } catch (error) {
      console.error("Bot toggle error:", error)
      alert("Failed to toggle bot")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Bot Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Trading Bot Control
            <Badge variant={botActive ? "default" : "secondary"}>{botActive ? "Active" : "Inactive"}</Badge>
          </CardTitle>
          <CardDescription>Start or stop the automated trading system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {botActive
              ? "The trading bot is currently active and monitoring markets for trading opportunities."
              : "The trading bot is currently stopped. Click the button below to start automated trading."}
          </div>

          <Button
            onClick={handleBotToggle}
            disabled={loading}
            size="lg"
            variant={botActive ? "destructive" : "default"}
          >
            {loading ? (
              "Processing..."
            ) : botActive ? (
              <>
                <Square className="mr-2 h-5 w-5" />
                Stop Trading Bot
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Start Trading Bot
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Trading Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrades}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.winRate}%</div>
            <p className="text-xs text-muted-foreground">Success percentage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            {stats.totalProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Current P&L</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Performance</CardTitle>
          <CardDescription>Detailed breakdown of your trading activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Won Trades</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {stats.wonTrades}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lost Trades</span>
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  {stats.lostTrades}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Trades</span>
                <Badge variant="secondary">{stats.activeTrades}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Win Rate Progress</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(stats.winRate, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">{stats.winRate}% success rate</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Profit Trend</div>
              <div className={`text-lg font-semibold ${stats.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.totalProfit >= 0 ? "Profitable" : "Loss"} trading session
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
