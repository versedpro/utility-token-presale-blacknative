import blocknativeLogo from './icons/logo192.png'
import blocknativeIcon from './icons/logo192.png'

import { init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule from '@web3-onboard/walletconnect'

// Replace with your DApp's Infura ID
// const INFURA_ID = `${process.env.REACT_APP_INFURA_KEY}`

// const dappId = `${process.env.REACT_APP_DAPP_ID}`

const injected = injectedModule()
const wcV2InitOptions = {
  /**
   * Project ID associated with [WalletConnect account](https://cloud.walletconnect.com)
   */
  projectId: 'b41d4a1473aef3c755f7b9c26b1e16be',
  /**
   * Chains required to be supported by all wallets connecting to your DApp
   */
  requiredChains: [1, 5, 11155111],
  /**
   * Defaults to `appMetadata.explore` that is supplied to the web3-onboard init
   * Strongly recommended to provide atleast one URL as it is required by some wallets (i.e. MetaMask)
   * To connect with WalletConnect
   */
  dappUrl: 'http://invesableai.com'
}
const walletConnect = walletConnectModule(wcV2InitOptions)

export const initWeb3Onboard = init({
  wallets: [injected, walletConnect],
  chains: [
    {
      id: '0x1',
      token: 'ETH',
      label: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/c10f793bf8b747f3b58b0e65d87fcd07'
    },
    {
      id: '0x5',
      token: 'GETH',
      label: 'Goerli Testnet',
      rpcUrl: 'https://goerli.infura.io/v3/c10f793bf8b747f3b58b0e65d87fcd07'
    },
    {
      id: '0xaa36a7',
      token: 'ETH',
      label: 'Sepolia Testnet',
      rpcUrl: 'https://sepolia.infura.io/v3/c10f793bf8b747f3b58b0e65d87fcd07'
    }
  ],
  appMetadata: {
    name: 'INVESABLEAI',
    icon: blocknativeIcon,
    logo: blocknativeLogo,
    description: 'INVESABLEAI - Buy',
    recommendedInjectedWallets: [
      { name: 'Coinbase', url: 'https://wallet.coinbase.com/' },
      { name: 'MetaMask', url: 'https://metamask.io' }
    ]
  },
  accountCenter: {
    desktop: {
      position: 'bottomRight',
      enabled: true,
      minimal: true
    }
  },
  // example customizing copy
  i18n: {
    en: {}
  }
})
