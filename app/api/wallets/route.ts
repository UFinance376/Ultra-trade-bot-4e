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

    // Get user's wallet
    const { data: wallet, error } = await supabase.from("wallets").select("*").eq("user_id", user.id).single()

    if (error) {
      console.error("Wallet fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 })
    }

    return NextResponse.json({ wallet })
  } catch (error) {
    console.error("Wallet API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
