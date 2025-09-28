import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    // Simulate AI response (replace with actual OpenAI API integration)
    const responses = [
      "Based on current market conditions, I'd recommend focusing on risk management and diversification. What's your current trading experience level?",
      "That's a great question! For market analysis, I suggest looking at both technical indicators and fundamental analysis. Would you like me to explain either approach in detail?",
      "The Ultra Finance platform offers multiple deposit methods including crypto and traditional payment options. Withdrawals are processed within 24-48 hours. Is there a specific aspect you'd like to know more about?",
      "Trading strategies should always align with your risk tolerance. For beginners, I recommend starting with smaller positions and paper trading to practice. What's your primary trading goal?",
      "Market volatility can create both opportunities and risks. The key is having a solid strategy and sticking to your risk management rules. Are you looking for short-term or long-term trading advice?",
    ]

    // Simple response selection based on message content
    let response = responses[Math.floor(Math.random() * responses.length)]

    if (message.toLowerCase().includes("deposit")) {
      response =
        "For deposits, you can use Ecocash, OneMoney, Telecash, or crypto (TRC20). The minimum deposit is $1, and crypto deposits have an 8 USDT + 8% fee. Would you like specific instructions for any payment method?"
    } else if (message.toLowerCase().includes("withdraw")) {
      response =
        "Withdrawals have a minimum of $1 and an 18% fee. You'll need to provide a TRC20 address for crypto withdrawals. The net amount will be your withdrawal amount minus the fee. Would you like help calculating your net withdrawal amount?"
    } else if (message.toLowerCase().includes("trading") || message.toLowerCase().includes("trade")) {
      response =
        "Our trading platform uses TradingView charts with EURUSD pairs. You can stake a minimum of $0.3 and predict market direction for various durations. Wins earn you a percentage of your staked amount, while losses result in losing the entire stake. What trading duration interests you most?"
    } else if (message.toLowerCase().includes("affiliate") || message.toLowerCase().includes("referral")) {
      response =
        "The affiliate program gives you 50% of your referrals' trading profits! You need at least 20 first-time depositors with balance ≥$2 to unlock withdrawals. Your unique referral link is available in the Affiliate section. Would you like tips on promoting your referral link?"
    } else if (message.toLowerCase().includes("spin") || message.toLowerCase().includes("wheel")) {
      response =
        "The Spin Wheel gives you 2 free spins to start! You can win between $0.5 to $100, with winnings ≥$2 added directly to your wallet. Smaller winnings require more referrals to withdraw. Have you tried your free spins yet?"
    }

    // Add some delay to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}
