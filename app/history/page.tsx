"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Search, Calendar, ExternalLink } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "sonner"

interface Transaction {
  id: string
  amount: number
  status: string
  tx_hash?: string
  created_at: string
  type: "deposit" | "withdrawal" | "trade"
  method?: string
  profit?: number
  duration?: number
}

export default function HistoryPage() {
  const [deposits, setDeposits] = useState<Transaction[]>([])
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([])
  const [trades, setTrades] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("deposits")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch deposits
      const { data: depositsData } = await supabase
        .from("deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      // Fetch withdrawals
      const { data: withdrawalsData } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      // Fetch trades
      const { data: tradesData } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setDeposits(
        depositsData?.map((d) => ({
          ...d,
          type: "deposit" as const,
        })) || [],
      )

      setWithdrawals(
        withdrawalsData?.map((w) => ({
          ...w,
          type: "withdrawal" as const,
        })) || [],
      )

      setTrades(
        tradesData?.map((t) => ({
          ...t,
          type: "trade" as const,
        })) || [],
      )
    } catch (error) {
      console.error("Error fetching history:", error)
      toast.error("Failed to load transaction history")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "completed":
      case "win":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "failed":
      case "loss":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const filterTransactions = (transactions: Transaction[]) => {
    if (!searchTerm) return transactions
    return transactions.filter(
      (tx) =>
        tx.tx_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.amount.toString().includes(searchTerm),
    )
  }

  const TransactionList = ({ transactions, type }: { transactions: Transaction[]; type: string }) => {
    const filteredTransactions = filterTransactions(transactions)

    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      )
    }

    if (filteredTransactions.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No {type} found</div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    {transaction.type === "deposit" ? (
                      <ArrowDownLeft className="h-4 w-4 text-green-500" />
                    ) : transaction.type === "withdrawal" ? (
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {transaction.type === "trade"
                        ? `Trade - ${transaction.duration}min`
                        : transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(transaction.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="font-bold text-lg">
                    ${transaction.amount.toFixed(2)}
                    {transaction.type === "trade" && transaction.profit && (
                      <span className={`ml-2 text-sm ${transaction.profit > 0 ? "text-green-500" : "text-red-500"}`}>
                        ({transaction.profit > 0 ? "+" : ""}${transaction.profit.toFixed(2)})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                    {transaction.tx_hash && (
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {transaction.tx_hash && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    TX Hash: <span className="font-mono">{transaction.tx_hash}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deposits" className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            Deposits ({deposits.length})
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Withdrawals ({withdrawals.length})
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trades ({trades.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle>Deposit History</CardTitle>
              <CardDescription>All your deposit transactions and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={deposits} type="deposits" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>All your withdrawal requests and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={withdrawals} type="withdrawals" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades">
          <Card>
            <CardHeader>
              <CardTitle>Trading History</CardTitle>
              <CardDescription>All your trading activities and results</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={trades} type="trades" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
