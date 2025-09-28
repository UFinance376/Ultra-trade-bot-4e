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

    // In a real implementation, you would stop the trading bot
    // For now, we'll just return a success response
    console.log(`Stopping trading bot for user ${user.id}`)

    return NextResponse.json({
      status: "success",
      message: "Trading bot stopped successfully",
      user_id: user.id,
    })
  } catch (error) {
    console.error("Bot stop API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
