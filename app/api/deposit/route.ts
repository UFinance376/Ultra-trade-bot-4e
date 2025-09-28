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
    const { amount, method, name, email, phone } = body

    // Validate required fields
    if (!amount || !method || !name || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate deposit address for crypto
    let depositAddress = null
    if (method === "crypto") {
      // In a real implementation, you would generate a unique address
      depositAddress = "TDD6XsuM6FdiD3GrpDd39ZWL8rzFfLTpbU"
    }

    // Create deposit record
    const { data: deposit, error: depositError } = await supabase
      .from("deposits")
      .insert({
        user_id: user.id,
        amount: Number.parseFloat(amount),
        method,
        status: "pending",
        deposit_address: depositAddress,
      })
      .select()
      .single()

    if (depositError) {
      console.error("Deposit creation error:", depositError)
      return NextResponse.json({ error: "Failed to create deposit" }, { status: 500 })
    }

    // Return deposit info with QR code for crypto
    const response = {
      deposit_id: deposit.id,
      amount: deposit.amount,
      method: deposit.method,
      status: deposit.status,
      deposit_address: depositAddress,
      qr_code: depositAddress
        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${depositAddress}`
        : null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Deposit API error:", error)
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

    // Get user's deposit history
    const { data: deposits, error } = await supabase
      .from("deposits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Deposits fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch deposits" }, { status: 500 })
    }

    return NextResponse.json({ deposits })
  } catch (error) {
    console.error("Deposits API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
