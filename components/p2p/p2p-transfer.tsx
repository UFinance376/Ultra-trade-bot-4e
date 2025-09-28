"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, XCircle } from "lucide-react"

interface P2PTransferProps {
  userId: string
}

interface TransferHistory {
  id: string
  sender_id: string
  recipient_id: string
  amount: number
  status: string
  created_at: string
  sender_email?: string
  recipient_email?: string
}

export default function P2PTransfer({ userId }: P2PTransferProps) {
  const [recipientEmail, setRecipientEmail] = useState("")
  const [amount, setAmount] = useState("")
  const [availableBalance, setAvailableBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [transfers, setTransfers] = useState<TransferHistory[]>([])

  useEffect(() => {
    fetchBalance()
    fetchTransferHistory()
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

  const fetchTransferHistory = async () => {
    const supabase = createClient()

    try {
      // Get transfers where user is sender or recipient
      const { data } = await supabase
        .from("p2p_transfers")
        .select(`
          *,
          sender:users!p2p_transfers_sender_id_fkey(email),
          recipient:users!p2p_transfers_recipient_id_fkey(email)
        `)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(10)

      if (data) {
        setTransfers(data as any)
      }
    } catch (error) {
      console.error("Error fetching transfer history:", error)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()

    const transferAmount = Number.parseFloat(amount)

    if (!recipientEmail || !amount) {
      alert("Please fill in all fields")
      return
    }

    if (transferAmount <= 0) {
      alert("Amount must be greater than 0")
      return
    }

    if (transferAmount > availableBalance) {
      alert("Insufficient balance")
      return
    }

    setLoading(true)

    const supabase = createClient()

    try {
      // Find recipient by email
      const { data: recipient, error: recipientError } = await supabase
        .from("users")
        .select("id")
        .eq("email", recipientEmail)
        .single()

      if (recipientError || !recipient) {
        alert("Recipient email not found")
        setLoading(false)
        return
      }

      if (recipient.id === userId) {
        alert("Cannot transfer to yourself")
        setLoading(false)
        return
      }

      // Start transaction
      const { data: transfer, error: transferError } = await supabase
        .from("p2p_transfers")
        .insert({
          sender_id: userId,
          recipient_id: recipient.id,
          amount: transferAmount,
          status: "completed",
        })
        .select()
        .single()

      if (transferError) {
        throw transferError
      }

      // Update sender balance
      const { error: senderUpdateError } = await supabase
        .from("wallets")
        .update({
          available_balance: availableBalance - transferAmount,
        })
        .eq("user_id", userId)

      if (senderUpdateError) {
        throw senderUpdateError
      }

      // Update recipient balance
      const { data: recipientWallet } = await supabase
        .from("wallets")
        .select("available_balance")
        .eq("user_id", recipient.id)
        .single()

      if (recipientWallet) {
        const { error: recipientUpdateError } = await supabase
          .from("wallets")
          .update({
            available_balance: recipientWallet.available_balance + transferAmount,
          })
          .eq("user_id", recipient.id)

        if (recipientUpdateError) {
          throw recipientUpdateError
        }
      }

      alert("Transfer completed successfully!")
      setRecipientEmail("")
      setAmount("")
      fetchBalance()
      fetchTransferHistory()
    } catch (error) {
      console.error("Transfer error:", error)
      alert("Transfer failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Send Money</CardTitle>
            <CardDescription>Transfer funds to another Ultra Finance user</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-2">
                <Label>Available Balance</Label>
                <div className="text-2xl font-bold text-green-600">${availableBalance.toFixed(2)}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Recipient Email</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Enter recipient's email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : "Send Money"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transfer Information</CardTitle>
            <CardDescription>Important details about P2P transfers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">How it works</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enter the recipient's registered email</li>
                <li>• Specify the amount to transfer</li>
                <li>• Funds are transferred instantly</li>
                <li>• Both parties receive confirmation</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Recipient must have an Ultra Finance account</li>
                <li>• Sufficient available balance required</li>
                <li>• No fees for P2P transfers</li>
                <li>• Transfers are irreversible</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> All P2P transfers are processed instantly and cannot be reversed. Please verify
                the recipient email before sending.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
          <CardDescription>Your latest P2P transfer history</CardDescription>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transfers yet</p>
          ) : (
            <div className="space-y-4">
              {transfers.map((transfer) => (
                <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {transfer.sender_id === userId ? (
                      <div className="flex items-center text-red-600">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        <span className="text-sm">Sent to {(transfer as any).recipient.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-green-600">
                        <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                        <span className="text-sm">Received from {(transfer as any).sender.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">${transfer.amount.toFixed(2)}</span>
                    {transfer.status === "completed" ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
