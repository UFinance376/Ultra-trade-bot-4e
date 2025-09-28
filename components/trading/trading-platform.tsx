"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, Clock } from "lucide-react"
import TradingViewWidget from "./tradingview-widget"

interface TradingPlatformProps {
  userId: string
}

interface ActiveTrade {
  id: string
  symbol: string
  direction: string
  stake_amount: number
  multiplier: number
  potential_profit: number
  status: string
  duration: number
  created_at: string
}

export default function TradingPlatform({ userId }: TradingPlatformProps) {
  const [availableBalance, setAvailableBalance] = useState(0)
  const [stakeAmount, setStakeAmount] = useState("0.3")
  const [selectedDuration, setSelectedDuration] = useState("60")
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([])
  const [loading, setLoading] = useState(false)

  const durations = [
    { value: "30", label: "30 seconds", multiplier: 1.8 },
    { value: "60", label: "1 minute", multiplier: 1.85 },
    { value: "120", label: "2 minutes", multiplier: 1.9 },
    { value: "300", label: "5 minutes", multiplier: 2.0 },
    { value: "600", label: "10 minutes", multiplier: 2.2 },
  ]

  useEffect(() => {
    fetchBalance()
    fetchActiveTrades()

    // Refresh active trades every 5 seconds
    const interval = setInterval(fetchActiveTrades, 5000)
    return () => clearInterval(interval)
  }, [userId])

  const fetchBalance = async () => {
    const supabase = createClient()

    try {
      const { data } = await supabase.from("wallets").select("available_balance").eq("user_id", userId).single()

      if (data) {
        setAvailableBalance(data.available_balance)
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
    }
  }

  const fetchActiveTrades = async () => {
    const supabase = createClient()

    try {
      const { data } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (data) {
        setActiveTrades(data)
      }
    } catch (error) {
      console.error("Error fetching active trades:", error)
    }
  }

  const executeTrade = async (direction: "buy" | "sell") => {
    const stake = Number.parseFloat(stakeAmount)
    const duration = Number.parseInt(selectedDuration)
    const selectedDurationData = durations.find((d) => d.value === selectedDuration)
    const multiplier = selectedDurationData?.multiplier || 1.8

    if (stake < 0.3) {
      alert("Minimum stake amount is $0.30")
      return
    }

    if (stake > availableBalance) {
      alert("Insufficient balance")
      return
    }

    setLoading(true)

    const supabase = createClient()

    try {
      // Calculate potential profit
      const potentialProfit = stake * multiplier

      // Create trade record
      const { data: trade, error: tradeError } = await supabase
        .from("trades")
        .insert({
          user_id: userId,
          symbol: "EURUSD",
          direction,
          stake_amount: stake,
          multiplier,
          potential_profit: potentialProfit,
          duration,
          status: "active",
          entry_price: 1.085 + Math.random() * 0.01, // Simulated entry price
        })
        .select()
        .single()

      if (tradeError) {
        throw tradeError
      }

      // Update wallet balance (lock the stake amount)
      const { error: walletError } = await supabase
        .from("wallets")
        .update({
          available_balance: availableBalance - stake,
          locked_balance: stake,
        })
        .eq("user_id", userId)

      if (walletError) {
        throw walletError
      }

      alert(`${direction.toUpperCase()} trade executed successfully!`)
      fetchBalance()
      fetchActiveTrades()

      // Simulate trade completion after duration
      setTimeout(() => {
        completeTrade(trade.id, Math.random() > 0.4) // 60% win rate simulation
      }, duration * 1000)
    } catch (error) {
      console.error("Trade execution error:", error)
      alert("Failed to execute trade")
    } finally {
      setLoading(false)
    }
  }

  const completeTrade = async (tradeId: string, won: boolean) => {
    const supabase = createClient()

    try {
      const trade = activeTrades.find((t) => t.id === tradeId)
      if (!trade) return

      const actualProfit = won ? trade.potential_profit : 0
      const status = won ? "won" : "lost"

      // Update trade status
      await supabase
        .from("trades")
        .update({
          status,
          actual_profit: actualProfit,
          closed_at: new Date().toISOString(),
          exit_price: 1.085 + Math.random() * 0.01, // Simulated exit price
        })
        .eq("id", tradeId)

      // Update wallet balance
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", userId).single()

      if (wallet) {
        const newAvailableBalance = wallet.available_balance + (won ? actualProfit : 0)
        const newLockedBalance = Math.max(0, wallet.locked_balance - trade.stake_amount)

        await supabase
          .from("wallets")
          .update({
            available_balance: newAvailableBalance,
            locked_balance: newLockedBalance,
          })
          .eq("user_id", userId)
      }

      fetchBalance()
      fetchActiveTrades()
    } catch (error) {
      console.error("Error completing trade:", error)
    }
  }

  const selectedDurationData = durations.find((d) => d.value === selectedDuration)
  const potentialProfit = Number.parseFloat(stakeAmount) * (selectedDurationData?.multiplier || 1.8)

  return (
    <div className="space-y-6">
      {/* TradingView Chart */}
      <Card>
        <CardHeader>
          <CardTitle>EUR/USD Chart</CardTitle>
          <CardDescription>Live market data powered by TradingView</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <TradingViewWidget />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Place Trade</CardTitle>
              <CardDescription>Predict market direction and stake your amount</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Available Balance</Label>
                  <div className="text-xl font-bold text-green-600">${availableBalance.toFixed(2)}</div>
                </div>
                <div className="space-y-2">
                  <Label>Potential Profit</Label>
                  <div className="text-xl font-bold text-blue-600">${potentialProfit.toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stakeAmount">Stake Amount (USD)</Label>
                <Input
                  id="stakeAmount"
                  type="number"
                  min="0.3"
                  step="0.1"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Minimum $0.30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Trade Duration</Label>
                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value}>
                        {duration.label} (x{duration.multiplier})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button
                  onClick={() => executeTrade("buy")}
                  disabled={loading}
                  className="h-16 text-lg bg-green-600 hover:bg-green-700"
                >
                  <TrendingUp className="mr-2 h-6 w-6" />
                  BUY / UP
                </Button>
                <Button
                  onClick={() => executeTrade("sell")}
                  disabled={loading}
                  variant="destructive"
                  className="h-16 text-lg"
                >
                  <TrendingDown className="mr-2 h-6 w-6" />
                  SELL / DOWN
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Trades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Active Trades
            </CardTitle>
            <CardDescription>Your current open positions</CardDescription>
          </CardHeader>
          <CardContent>
            {activeTrades.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No active trades</p>
            ) : (
              <div className="space-y-4">
                {activeTrades.map((trade) => (
                  <div key={trade.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={trade.direction === "buy" ? "default" : "destructive"}>
                        {trade.direction.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">{trade.symbol}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Stake:</span>
                        <span>${trade.stake_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Potential:</span>
                        <span className="text-green-600">${trade.potential_profit.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{trade.duration}s duration</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
