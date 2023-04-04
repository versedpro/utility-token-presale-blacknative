import blocknativeLogo from './icons/logo192.png'
import blocknativeIcon from './icons/logo192.png'

import { init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule from '@web3-onboard/walletconnect'

// Replace with your DApp's Infura ID
const INFURA_ID = `${process.env.REACT_APP_INFURA_KEY}`

const dappId = `${process.env.REACT_APP_DAPP_ID}`

const injected = injectedModule()
const walletConnect = walletConnectModule()

export const initWeb3Onboard = init({
  wallets: [injected, walletConnect],
  chains: [
    {
      id: '0x5',
      token: 'GETH',
      label: 'Goerli Testnet',
      rpcUrl:
        'https://eth-goerli.g.alchemy.com/v2/PnVem01ekyMVFVPPwGj-8_zgAeAC5u--'
      //rpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`
    }
  ],
  appMetadata: {
    name: 'AI Fund',
    icon: blocknativeIcon,
    logo: blocknativeLogo,
    description: 'AI Fund - Buy',
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
