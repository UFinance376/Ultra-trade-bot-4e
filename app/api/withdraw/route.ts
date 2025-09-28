import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

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
    const { amount, address } = body

    // Validate required fields
    if (!amount || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const withdrawAmount = Number.parseFloat(amount)
    const feePercentage = 18
    const fee = withdrawAmount * (feePercentage / 100)
    const netAmount = withdrawAmount - fee

    // Validate minimum amount
    if (withdrawAmount < 1) {
      return NextResponse.json({ error: "Minimum withdrawal amount is $1" }, { status: 400 })
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

    if (wallet.available_balance < withdrawAmount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Create withdrawal record
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .insert({
        user_id: user.id,
        amount: withdrawAmount,
        fee,
        net_amount: netAmount,
        destination_address: address,
        status: "pending",
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error("Withdrawal creation error:", withdrawalError)
      return NextResponse.json({ error: "Failed to create withdrawal" }, { status: 500 })
    }

    // Deduct amount from available balance
    const { error: updateError } = await supabase
      .from("wallets")
      .update({
        available_balance: wallet.available_balance - withdrawAmount,
      })
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Wallet update error:", updateError)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    // In a real implementation, you would integrate with a payment processor
    // For now, we'll simulate a transaction hash
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`

    const response = {
      withdrawal_id: withdrawal.id,
      amount: withdrawal.amount,
      fee: withdrawal.fee,
      net_amount: withdrawal.net_amount,
      status: withdrawal.status,
      tx_hash: txHash,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Withdrawal API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    // Get user's withdrawal history
    const { data: withdrawals, error } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Withdrawals fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
    }

    return NextResponse.json({ withdrawals })
  } catch (error) {
    console.error("Withdrawals API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
