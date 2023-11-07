import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client'

const { SUI_CLIENT_ADDRESS = '' } = process.env

const client = new SuiClient({ url: getFullnodeUrl('devnet') })

async function main() {
  const resp = await client.getCoins({
    owner: SUI_CLIENT_ADDRESS,
  })
  // client.get

  // get coins owned by an address
  console.log(resp.data)
}

main()
