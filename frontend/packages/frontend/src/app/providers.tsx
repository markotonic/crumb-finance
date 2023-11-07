import { WalletKitProvider } from '@mysten/wallet-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import RpcClientProvider from '@/context/RpcContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()

  return (
    <WalletKitProvider>
      <RpcClientProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </RpcClientProvider>
    </WalletKitProvider>
  )
}
