"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DepositForm from "./deposit-form"
import WithdrawForm from "./withdraw-form"

interface WalletManagerProps {
  userId: string
}

export default function WalletManager({ userId }: WalletManagerProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="mt-6">
          <DepositForm userId={userId} />
        </TabsContent>

        <TabsContent value="withdraw" className="mt-6">
          <WithdrawForm userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
