"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface DepositFormProps {
  userId: string
}

export default function DepositForm({ userId }: DepositFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    amount: "",
    method: "",
  })
  const [loading, setLoading] = useState(false)
  const [depositInfo, setDepositInfo] = useState<any>(null)

  const paymentMethods = [
    { value: "ecocash", label: "EcoCash" },
    { value: "onemoney", label: "OneMoney" },
    { value: "telecash", label: "TeleCash" },
    { value: "crypto", label: "Crypto (TRC20)" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, user_id: userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create deposit")
      }

      setDepositInfo(data)
      alert("Deposit request created successfully!")
    } catch (error) {
      console.error("Deposit error:", error)
      alert("Failed to submit deposit request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Make a Deposit</CardTitle>
          <CardDescription>Add funds to your trading account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select
                value={formData.method}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, method: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Pay Now"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>Important details about deposits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {depositInfo && (
            <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800">Deposit Created Successfully!</h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Amount:</strong> ${depositInfo.amount}
                </p>
                <p className="text-sm">
                  <strong>Method:</strong> {depositInfo.method}
                </p>
                {depositInfo.deposit_address && (
                  <>
                    <p className="text-sm">
                      <strong>Deposit Address:</strong>
                    </p>
                    <code className="text-xs bg-background p-2 rounded block break-all">
                      {depositInfo.deposit_address}
                    </code>
                    {depositInfo.qr_code && (
                      <div className="text-center">
                        <img src={depositInfo.qr_code || "/placeholder.svg"} alt="QR Code" className="mx-auto" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold">Crypto Deposits (TRC20)</h4>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Deposit Address:</p>
              <code className="text-xs bg-background p-2 rounded block">TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE</code>
            </div>
            <Badge variant="outline">Fee: 8 USDT + 8%</Badge>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Mobile Money</h4>
            <p className="text-sm text-muted-foreground">
              EcoCash, OneMoney, and TeleCash payments are processed instantly. You'll receive a payment confirmation
              within 3 minutes.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All deposits are processed automatically. Your balance will be updated immediately
              upon payment confirmation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
