"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface WithdrawFormProps {
  userId: string
}

export default function WithdrawForm({ userId }: WithdrawFormProps) {
  const [amount, setAmount] = useState("")
  const [address, setAddress] = useState("")
  const [availableBalance, setAvailableBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  const feePercentage = 18
  const withdrawAmount = Number.parseFloat(amount) || 0
  const fee = withdrawAmount * (feePercentage / 100)
  const netAmount = withdrawAmount - fee

  useEffect(() => {
    fetchBalance()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (withdrawAmount < 1) {
      alert("Minimum withdrawal amount is $1")
      return
    }

    if (withdrawAmount > availableBalance) {
      alert("Insufficient balance")
      return
    }

    if (!address.trim()) {
      alert("Please enter a valid TRC20 address")
      return
    }

    setLoading(true)

    try {
      // TODO: Implement withdrawal API call
      console.log("Withdrawal request:", {
        userId,
        amount: withdrawAmount,
        fee,
        netAmount,
        address,
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      alert("Withdrawal request submitted successfully!")
      setAmount("")
      setAddress("")
      fetchBalance() // Refresh balance
    } catch (error) {
      console.error("Withdrawal error:", error)
      alert("Failed to submit withdrawal request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
          <CardDescription>Transfer funds to your TRC20 wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Available Balance</Label>
              <div className="text-2xl font-bold text-green-600">${availableBalance.toFixed(2)}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Minimum $1.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">TRC20 Wallet Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your TRC20 address"
                required
              />
            </div>

            {withdrawAmount > 0 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Withdrawal Amount:</span>
                  <span>${withdrawAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fee ({feePercentage}%):</span>
                  <span className="text-red-600">-${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Net Amount:</span>
                  <span className="text-green-600">${netAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || withdrawAmount <= 0 || withdrawAmount > availableBalance}
            >
              {loading ? "Processing..." : "Submit Withdrawal"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Information</CardTitle>
          <CardDescription>Important details about withdrawals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Processing Time</h4>
            <p className="text-sm text-muted-foreground">
              Withdrawals are typically processed within 24 hours. You'll receive a confirmation email with the
              transaction hash.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Fees</h4>
            <Badge variant="outline" className="text-red-600">
              18% withdrawal fee
            </Badge>
            <p className="text-sm text-muted-foreground">This fee covers network costs and processing charges.</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Requirements</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Minimum withdrawal: $1.00</li>
              <li>• Valid TRC20 wallet address required</li>
              <li>• Sufficient available balance</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Double-check your wallet address. Transactions cannot be reversed once
              processed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
