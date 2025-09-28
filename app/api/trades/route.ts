import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's trades with stats
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Trades fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 })
    }

    // Calculate stats
    const totalTrades = trades.length
    const wonTrades = trades.filter((trade) => trade.status === "won").length
    const lostTrades = trades.filter((trade) => trade.status === "lost").length
    const activeTrades = trades.filter((trade) => trade.status === "active").length
    const winRate = totalTrades > 0 ? (wonTrades / (wonTrades + lostTrades)) * 100 : 0
    const totalProfit = trades.reduce((sum, trade) => sum + (trade.actual_profit || 0), 0)

    const stats = {
      totalTrades,
      wonTrades,
      lostTrades,
      activeTrades,
      winRate: Number.parseFloat(winRate.toFixed(2)),
      totalProfit: Number.parseFloat(totalProfit.toFixed(2)),
    }

    return NextResponse.json({ trades, stats })
  } catch (error) {
    console.error("Trades API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { symbol, direction, stake_amount, duration } = body

    // Validate required fields
    if (!symbol || !direction || !stake_amount || !duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate stake amount
    if (stake_amount < 0.3) {
      return NextResponse.json({ error: "Minimum stake amount is $0.30" }, { status: 400 })
    }

    // Check user balance
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("available_balance")
      .eq("user_id", user.id)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 })
    }

    if (wallet.available_balance < stake_amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Calculate multiplier based on duration
    const multipliers: { [key: number]: number } = {
      30: 1.8,
      60: 1.85,
      120: 1.9,
      300: 2.0,
      600: 2.2,
    }

    const multiplier = multipliers[duration] || 1.8
    const potentialProfit = stake_amount * multiplier

    // Create trade
    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .insert({
        user_id: user.id,
        symbol,
        direction,
        stake_amount,
        multiplier,
        potential_profit: potentialProfit,
        duration,
        status: "active",
        entry_price: 1.085 + Math.random() * 0.01, // Simulated entry price
      })
      .select()
      .single()

    if (tradeError) {
      console.error("Trade creation error:", tradeError)
      return NextResponse.json({ error: "Failed to create trade" }, { status: 500 })
    }

    // Update wallet balance
    const { error: updateError } = await supabase
      .from("wallets")
      .update({
        available_balance: wallet.available_balance - stake_amount,
        locked_balance: stake_amount,
      })
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Wallet update error:", updateError)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    return NextResponse.json({ trade })
  } catch (error) {
    console.error("Trade creation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
