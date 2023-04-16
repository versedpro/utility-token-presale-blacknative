import React, { useState, useEffect } from 'react'
import { ethers, BigNumber } from 'ethers'
import contractabi from './contracts/artifacts/contractabi.json'
import tokenabi from './contracts/artifacts/tokenabi.json'
import PropTypes from 'prop-types'
import LinearProgress from '@mui/material/LinearProgress'
import Box from '@mui/material/Box'
import { initWeb3Onboard } from './services'
import Lottie from 'react-lottie-player'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  useConnectWallet,
  useNotifications,
  useSetChain,
  useWallets
} from '@web3-onboard/react'
import './App.css'
import lottie from './coin.json'

const PresaleContractAddress = '0x400AEf5F7Ec1d91a3eB339Cde02D68333f47B1a8'
const USDCAddress = '0xEEa85fdf0b05D1E0107A61b4b4DB1f345854B952'
const WETHAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress
          sx={{ height: '15px', borderRadius: '30px', background: '#0073ff3b' }}
          variant="determinate"
          {...props}
        />
      </Box>
    </Box>
  )
}
LinearProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate and buffer variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired
}

function MintPage() {
  const [{ wallet }, connect, disconnect] = useConnectWallet()
  const [notifications] = useNotifications()
  const connectedWallets = useWallets()
  const [web3Onboard, setWeb3Onboard] = useState(null)
  const [{ connectedChain }, setChain] = useSetChain()
  // const [error, setError] = useState('')
  const [data, setData] = useState({})
  const [quantity, setQuantity] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setWeb3Onboard(initWeb3Onboard)
  }, [])

  useEffect(() => {
    console.log(notifications)
  }, [notifications])

  useEffect(() => {
    if (!connectedWallets.length) return

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    )
    window.localStorage.setItem(
      'connectedWallets',
      JSON.stringify(connectedWalletsLabelArray)
    )
  }, [connectedWallets, wallet])

  useEffect(() => {
    if (connectedWallets.length !== 0) {
      fetchData()
    }
    // eslint-disable-next-line
  }, [connectedWallets])

  useEffect(() => {
    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem('connectedWallets')
    )

    if (previouslyConnectedWallets?.length) {
      async function setWalletFromLocalStorage() {
        await connect({
          autoSelect: previouslyConnectedWallets[0],
          disableModals: true
        })
      }
      setWalletFromLocalStorage()
    }
  }, [web3Onboard, connect])

  async function fetchData() {
    const provider = new ethers.providers.Web3Provider(
      connectedWallets[0].provider,
      'any'
    )
    const contract = new ethers.Contract(
      PresaleContractAddress,
      contractabi.abi,
      provider
    )
    const usdc = new ethers.Contract(USDCAddress, tokenabi.abi, provider)
    const weth = new ethers.Contract(WETHAddress, tokenabi.abi, provider)
    try {
      const currentPhase = await contract.getCurrentPhase()
      const phaseNumber = await contract.currentPhase()
      const usdcAllowance = await usdc.allowance(
        connectedWallets[0]['accounts'][0]['address'],
        PresaleContractAddress
      )
      const wethAllowance = await weth.allowance(
        connectedWallets[0]['accounts'][0]['address'],
        PresaleContractAddress
      )
      const ethLatest = await contract.getETHLatestPrice()
      let whitelisted
      if (phaseNumber === 0) {
        whitelisted = await contract.whitelist(
          connectedWallets[0]['accounts'][0]['address']
        )
      }
      setQuantity(currentPhase.minPurchase.toString() / 10 ** 18)
      console.log(whitelisted)
      const claimingEnabled = await contract.claimingEnabled()
      const tokenBalanceUser = await contract.balances(
        connectedWallets[0]['accounts'][0]['address']
      )
      const object = {
        currentPhase: currentPhase,
        phaseNumber: String(phaseNumber),
        claimingEnabled: String(claimingEnabled),
        tokenBalanceUser: String(tokenBalanceUser),
        whitelisted: String(whitelisted),
        usdcAllowance: String(usdcAllowance),
        wethAllowance: String(wethAllowance),
        ethLatest: String(ethLatest)
      }
      console.log(object)
      setData(object)
      setLoading(false)
    } catch (err) {
      // setError(err.message)
      console.error(err.message)
      handleError(err)
    }
  }

  const handleConnect = async () => {
    connect()
      .then(console.log(connectedWallets))
      .catch(e => console.Console.log(e))
  }
  async function approve(isEth) {
    const provider = new ethers.providers.Web3Provider(
      connectedWallets[0].provider,
      'any'
    )
    const signer = provider.getSigner()
    let token
    let amountForApproval
    if (isEth) {
      token = new ethers.Contract(WETHAddress, tokenabi.abi, signer)
      amountForApproval =
        ((data.currentPhase.tokenPrice.toString() * quantity) / data.ethLatest +
          1000000000000000) *
        quantity
    } else {
      token = new ethers.Contract(USDCAddress, tokenabi.abi, signer)
      amountForApproval = data.currentPhase.tokenPrice.toString() * quantity
    }
    try {
      let overrides = {
        from: connectedWallets[0]['accounts'][0]['address']
      }
      const tokenapproval = await token.approve(
        PresaleContractAddress,
        String(amountForApproval),
        overrides
      )
      await tokenapproval.wait()
      fetchData()
    } catch (err) {
      console.log(err)
      // setError(err)
      handleError(err)
    }
  }
  async function buy(isEth) {
    if (
      quantity <
      parseInt(data.currentPhase.minPurchase.toString() / 10 ** 18, 10)
    ) {
      toast.error(
        `Minimum you can buy in this phase is: ${
          data.currentPhase.minPurchase.toString() / 10 ** 18
        }`,
        {
          position: 'bottom-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'dark'
        }
      )
    }
    if (
      quantity >
      parseInt(data.currentPhase.maxPurchase.toString() / 10 ** 18, 10)
    ) {
      toast.error(
        `Maximum allowed per wallet on this phase is: ${
          data.currentPhase.maxPurchase.toString() / 10 ** 18
        }`,
        {
          position: 'bottom-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'dark'
        }
      )
    }
    const provider = new ethers.providers.Web3Provider(
      connectedWallets[0].provider,
      'any'
    )
    const signer = provider.getSigner()
    const contract = new ethers.Contract(
      PresaleContractAddress,
      contractabi.abi,
      signer
    )
    try {
      let overrides = {
        from: connectedWallets[0]['accounts'][0]['address']
      }
      const transaction = await contract.buyTokens(
        String(quantity * 10 ** 18),
        isEth,
        overrides
      )
      await transaction.wait()
      fetchData()
    } catch (err) {
      // setError(err)
      handleError(err)
    }
  }

  async function handleError(err) {
    if (
      err.message?.includes('user rejected transaction') ||
      err.data?.message?.includes('user rejected transaction')
    ) {
      console.log('User denied the transaction signature.')
      toast.error('Transaction denied', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark'
      })
    } else if (
      err.message?.includes('Insufficient') ||
      err.data?.message?.includes('Insufficient') ||
      err.message?.includes('ERC20: transfer amount exceeds balance') ||
      err.data?.message?.includes('ERC20: transfer amount exceeds balance')
    ) {
      console.log('Insufficient funds')
      toast.error('Insufficient funds', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark'
      })
    } else {
      toast.error('Error occurs on your transaction', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark'
      })
    }
  }

  const switchNetworkETH = async () => {
    await setChain({ chainId: '0x5' })
  }
  useEffect(() => {
    function setScreenHeight() {
      document.documentElement.style.setProperty(
        '--screen-height',
        `${window.innerHeight}px`
      )
    }

    // Set the initial screen height
    setScreenHeight()

    // Update the screen height on resize
    window.addEventListener('resize', setScreenHeight)

    return () => {
      window.removeEventListener('resize', setScreenHeight)
    }
  }, [])

  return (
    <main>
      <section className="main">
        <div className="main-content">
          <div className="containerr onboard">
            <div className="part">
              {!wallet && (
                <>
                  <img src="logo.png" className="logo-before-connect" alt="" />
                  <button className="mintbutton" onClick={handleConnect}>
                    Connect Wallet
                  </button>
                </>
              )}
              {wallet && connectedChain.id === '0x5' && loading && (
                <h2 className="loadingcolor">Loading...</h2>
              )}
              {wallet && connectedChain.id !== '0x5' && (
                <div className="buttonswitch" onClick={switchNetworkETH}>
                  <h2>Switch to Ethereum Mainnet</h2>
                  <img src="/assets/eth.svg" className="buttonlogo" alt="" />
                </div>
              )}

              {!loading && wallet && connectedChain.id === '0x5' && (
                <>
                  {data.claimingEnabled === 'true' ? (
                    <h1 className="phase">
                      Phase {data.phaseNumber} has started.
                    </h1>
                  ) : (
                    <h1 className="phase">
                      Phase {data.phaseNumber} will start soon.
                    </h1>
                  )}
                  {data.phaseNumber === '0' && data.whitelisted === 'false' && (
                    <h2 className="whitelist">
                      You are not whitelisted. Please wait for the next phase.
                    </h2>
                  )}
                  {data.phaseNumber === '0' && data.whitelisted === 'true' && (
                    <h2 className="whitelist">You are whitelisted.</h2>
                  )}
                  <div className="minting">
                    <>
                      <h1 className="tokensowned">
                        You own {data.tokenBalanceUser} tokens.
                      </h1>
                      <h2 className="wallet">Connected wallet</h2>
                      <h3 className="wallet-address">
                        {connectedWallets[0]['accounts'][0]['address']}
                      </h3>
                      <div className="cost">
                        <h2>
                          1 TOKEN ={' '}
                          {(
                            data.currentPhase.tokenPrice.toString() /
                            10 ** 18
                          ).toFixed(2)}{' '}
                          USDC
                        </h2>
                      </div>
                    </>

                    <div>
                      <div className="quantitymint">
                        <h2>Quantity</h2>
                        <input
                          type="number"
                          id="quantity"
                          min={
                            data.currentPhase.minPurchase.toString() / 10 ** 18
                          }
                          max={
                            data.currentPhase.maxPurchase.toString() / 10 ** 18
                          }
                          step="1"
                          value={quantity}
                          onChange={e => setQuantity(e.target.value)}
                        />
                      </div>

                      {data.phaseNumber === 0 && (
                        <div className="mintbuttons">
                          <button
                            className="mintbutton"
                            onClick={() => approve(false)}
                          >
                            APPROVE{' '}
                            {(
                              data.currentPhase.tokenPrice.toString() /
                              10 ** 18
                            ).toFixed(2) * quantity}{' '}
                            USDC
                          </button>
                          <button
                            className="mintbutton"
                            onClick={() => approve(true)}
                          >
                            APPROVE{' '}
                            {(
                              ((
                                data.currentPhase.tokenPrice.toString() /
                                10 ** 18
                              ).toFixed(2) *
                                quantity) /
                                data.ethLatest +
                              0.001
                            ).toFixed(3)}{' '}
                            WETH
                          </button>
                          <button
                            className="mintbutton"
                            disabled={
                              data.whitelisted === 'false' ||
                              data.usdcAllowance <
                                (
                                  data.currentPhase.tokenPrice.toString() /
                                  10 ** 18
                                ).toFixed(2) *
                                  quantity
                            }
                            onClick={() => buy(false)}
                          >
                            Buy with USDC
                          </button>
                          <button
                            className="mintbutton"
                            disabled={
                              data.whitelisted === 'false' ||
                              data.wethAllowance <
                                ((
                                  data.currentPhase.tokenPrice.toString() /
                                  10 ** 18
                                ).toFixed(2) *
                                  quantity) /
                                  data.ethLatest
                            }
                            onClick={() => buy(true)}
                          >
                            Buy with WETH
                          </button>
                          <button
                            className="mintbutton"
                            onClick={() => disconnect(wallet)}
                          >
                            Disconnect
                          </button>
                        </div>
                      )}
                      {data.phaseNumber !== 0 && (
                        <div className="mintbuttons">
                          <button
                            className="mintbutton"
                            onClick={() => approve(false)}
                          >
                            APPROVE{' '}
                            {(
                              data.currentPhase.tokenPrice.toString() /
                              10 ** 18
                            ).toFixed(2) * quantity}{' '}
                            USDC
                          </button>
                          <button
                            className="mintbutton"
                            onClick={() => approve(true)}
                          >
                            APPROVE{' '}
                            {(
                              ((
                                data.currentPhase.tokenPrice.toString() /
                                10 ** 18
                              ).toFixed(2) *
                                quantity) /
                                data.ethLatest +
                              0.001
                            ).toFixed(3)}{' '}
                            WETH
                          </button>
                          <button
                            className="mintbutton"
                            disabled={
                              data.usdcAllowance <
                              (
                                data.currentPhase.tokenPrice.toString() /
                                10 ** 18
                              ).toFixed(2) *
                                quantity
                            }
                            onClick={() => buy(false)}
                          >
                            Buy with USDC
                          </button>
                          <button
                            className="mintbutton"
                            disabled={
                              data.wethAllowance <
                              ((
                                data.currentPhase.tokenPrice.toString() /
                                10 ** 18
                              ).toFixed(2) *
                                quantity) /
                                data.ethLatest
                            }
                            onClick={() => buy(true)}
                          >
                            Buy with WETH
                          </button>
                          <button
                            className="mintbutton"
                            onClick={() => disconnect(wallet)}
                          >
                            Disconnect
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="line"></div>
            <div className="lottie part">
              <Lottie className="lottie" loop animationData={lottie} play />
              {!loading && wallet && connectedChain.id === '0x5' && (
                <>
                  <div className="progress">
                    <h3 className="minted">
                      Tokens Sold: &nbsp;
                      {Number(
                        data.currentPhase.tokensSold.toString()
                      ).toLocaleString('en-US')}{' '}
                      /{' '}
                      {Number(
                        data.currentPhase.tokensAvailable.toString() / 10 ** 18
                      ).toLocaleString('en-US')}{' '}
                      (
                      {Math.round(
                        (data.currentPhase.tokensSold.toString() * 100) /
                          data.currentPhase.tokensAvailable.toString()
                      ) + '%'}
                      )
                    </h3>
                    <Box sx={{ width: '100%', height: '60px' }}>
                      <LinearProgressWithLabel
                        value={
                          (data.currentPhase.tokensSold.toString() * 100) /
                          data.currentPhase.tokensAvailable.toString()
                        }
                      />
                    </Box>
                  </div>
                </>
              )}
            </div>

            <ToastContainer
              position="bottom-center"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
          </div>
        </div>
        <div className="main-content">
          <div className="containerr presale">
            <h2>Presale Phases</h2>
            <h3>Total Supply: 10,000,000 tokens</h3>
            <h3>Total Presale: 5,000,000 tokens</h3>
            <h3>Listing Price: $0.55</h3>
            <div className="stages">
              <div className="stage">
                <h4>Phase 0 (reserved for nft holders):</h4>
                <p>
                  Minimum buy: 300 tokens <br />
                  Maximum buy: 2,500 tokens <br />
                  1,500,000 tokens, price $0.40
                </p>
              </div>
              <div className="stage">
                <h4>Phase 1:</h4>
                <p>
                  Minimum buy: 300 tokens <br />
                  Maximum buy: 5,000 tokens <br />
                  875,000 tokens, price $0.44
                </p>
              </div>
              <div className="stage">
                <h4>Phase 2:</h4>
                <p>
                  Minimum buy: 200 tokens <br />
                  Maximum buy: 7,500 tokens <br />
                  875,000 tokens, price $0.46
                </p>
              </div>
              <div className="stage">
                <h4>Phase 3:</h4>
                <p>
                  Minimum buy: 200 tokens <br />
                  Maximum buy: 7,500 tokens <br />
                  875,000 tokens, price $0.48
                </p>
              </div>
              <div className="stage">
                <h4>Phase 4:</h4>
                <p>
                  Minimum buy: 100 tokens <br />
                  Maximum buy: 10,000 tokens <br />
                  875,000 tokens, price $0.50
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default MintPage
