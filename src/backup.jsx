import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { keccak256, isAddress } from 'ethers/lib/utils'
import degenerates from './contracts/artifacts/degenerates.json'
import {
  VerticalTimeline,
  VerticalTimelineElement
} from 'react-vertical-timeline-component'
import 'react-vertical-timeline-component/style.min.css'
import PropTypes from 'prop-types'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import styled from 'styled-components'
import { initWeb3Onboard } from './services'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  useAccountCenter,
  useConnectWallet,
  useNotifications,
  useSetChain,
  useWallets,
  useSetLocale
} from '@web3-onboard/react'
import './App.css'
import addressesWL from './whitelist.json'
import addressesVIP from './viplist.json'
import { borderLeftColor } from '@mui/system'

let provider

const NFTcontractAddress = '0xA7041473133F1EA149b875C60E7eA22668187703'

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
  const [{ wallet }, connect, disconnect, updateBalances, setWalletModules] =
    useConnectWallet()
  const [notifications, customNotification, updateNotify] = useNotifications()
  const connectedWallets = useWallets()
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  const [web3Onboard, setWeb3Onboard] = useState(null)

  const [error, setError] = useState('')
  const [errCode, setErrCode] = useState(0)
  const [data, setData] = useState({})
  const [WL, setWL] = useState(false)
  const [VIP, setVIP] = useState(false)
  const [address, setAddress] = useState('')
  const [checkedVIP, setCheckedVIP] = useState(false)
  const [validVIP, setValidVIP] = useState(false)
  const [checkedWL, setCheckedWL] = useState(false)
  const [validWL, setValidWL] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [accountCenterPosition, setAccountCenterPosition] = useState('topRight')
  const [notifyPosition, setNotifyPosition] = useState('bottomRight')
  const [locale, setLocale] = useState('en')
  const [accountCenterSize, setAccountCenterSize] = useState('normal')
  const [accountCenterExpanded, setAccountCenterExpanded] = useState(false)

  const [progress, setProgress] = React.useState(10)

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

  useEffect(() => {
    checkWL()
    checkVIP()
    fetchData()
  }, [])

  async function checkWL() {
    if (isAddress(address)) {
      const { MerkleTree } = require('merkletreejs')
      const leaves = addressesWL.map(x => keccak256(x))
      const tree = new MerkleTree(leaves, keccak256, { sort: true })
      const root = tree.getHexRoot()
      const leaf = keccak256(address)
      const proof = tree.getHexProof(leaf)
      try {
        if (tree.verify(proof, leaf, root)) setWL(true)
        else setWL(false)

        setCheckedWL(true)
        setValidWL(true)
      } catch (err) {
        console.log('Invalid address')
      }
    } else {
      setCheckedWL(true)
      console.log('Invalid address')
    }
  }
  async function checkVIP() {
    if (isAddress(address)) {
      const { MerkleTree } = require('merkletreejs')
      const leaves = addressesVIP.map(x => keccak256(x))
      const tree = new MerkleTree(leaves, keccak256, { sort: true })
      const root = tree.getHexRoot()
      const leaf = keccak256(address)
      const proof = tree.getHexProof(leaf)
      try {
        if (tree.verify(proof, leaf, root)) setVIP(true)
        else setVIP(false)

        setCheckedVIP(true)
        setValidVIP(true)
      } catch (err) {
        console.log('Invalid address')
      }
    } else {
      setCheckedVIP(true)
      console.log('Invalid address')
    }
  }
  async function fetchData() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(
        NFTcontractAddress,
        degenerates.abi,
        provider
      )

      try {
        let cost

        const totalSupply = await contract.totalSupply()
        const step = await contract.sellingStep()

        if (step == 1) {
          cost = await contract.vipSalePrice()
          document.getElementById('whitelist').classList.remove('active')
          document.getElementById('public').classList.remove('active')
          document.getElementById('vip').classList.add('active')
        }
        if (step == 2) {
          cost = await contract.wlSalePrice()
          document.getElementById('whitelist').classList.add('active')
          document.getElementById('public').classList.remove('active')
          document.getElementById('vip').classList.remove('active')
        }
        if (step == 3) {
          cost = await contract.publicSalePrice()
          document.getElementById('public').classList.add('active')
          document.getElementById('whitelist').classList.remove('active')
          document.getElementById('vip').classList.remove('active')
        }
        const object = {
          cost: String(cost),
          totalSupply: String(totalSupply),
          step: String(step)
        }
        console.log(object)
        setData(object)
      } catch (err) {
        setError(err.message)
      }
    }
  }
  async function whitelistmint() {
    if (typeof window.ethereum !== 'undefined') {
      let accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const { MerkleTree } = require('merkletreejs')
      const contract = new ethers.Contract(
        NFTcontractAddress,
        degenerates.abi,
        signer
      )
      const leaves = addressesWL.map(x => keccak256(x))
      const tree = new MerkleTree(leaves, keccak256, { sort: true })
      const root = tree.getHexRoot()
      const leaf = keccak256(accounts[0])
      const proof = tree.getHexProof(leaf)
      try {
        let overrides = {
          from: accounts[0],
          value: String(data.cost * quantity)
        }
        const transaction = await contract.whitelistMint(
          accounts[0],
          quantity,
          proof,
          overrides
        )
        await transaction.wait()
        fetchData()
      } catch (err) {
        setError(err.message)
        handleError(err.message)
      }
    }
  }
  async function vipmint() {
    if (typeof window.ethereum !== 'undefined') {
      let accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const { MerkleTree } = require('merkletreejs')
      const contract = new ethers.Contract(
        NFTcontractAddress,
        degenerates.abi,
        signer
      )
      const leaves = addressesVIP.map(x => keccak256(x))
      const tree = new MerkleTree(leaves, keccak256, { sort: true })
      const leaf = keccak256(accounts[0])

      const proof = tree.getHexProof(leaf)

      try {
        let overrides = {
          from: accounts[0],
          value: String(data.cost)
        }
        const transaction = await contract.vipMint(
          accounts[0],
          1,
          proof,
          overrides
        )
        await transaction.wait()
        fetchData()
      } catch (err) {
        setError(err.message)
        handleError(err.message)
      }
    }
  }
  async function mint() {
    if (typeof window.ethereum !== 'undefined') {
      let accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        NFTcontractAddress,
        degenerates.abi,
        signer
      )
      try {
        let overrides = {
          from: accounts[0],
          value: String(data.cost * quantity)
        }
        const transaction = await contract.publicSaleMint(
          accounts[0],
          quantity,
          overrides
        )
        await transaction.wait()
        fetchData()
      } catch (err) {
        setError(err.message)
        handleError(err.message)
      }
    }
  }
  async function handleError(err) {
    if (err.includes('Max per wallet')) {
      console.log('You are trying to mint more than the allowed amount.')
      setErrCode(2)
      handleShow()
    }
    if (err.includes('user rejected transaction')) {
      console.log('User denied the transaction signature.')
      setErrCode(1)
      handleShow()
    }
    if (err.includes('insufficient funds')) {
      console.log('Insufficient funds')
      setErrCode(3)
      handleShow()
    }
  }

  function valueUp() {
    if (quantity < 500) {
      setQuantity(quantity + 1)
    }
  }
  function valueDown() {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  function toggleMenu() {
    const menu = document.getElementById('mobileNavContainer')
    menu.classList.toggle('open-menu')
    console.log('pressed')
  }
  const [navbar, setNavbar] = useState(false)
  const changeBackground = () => {
    if (window.scrollY >= 500) {
      setNavbar(true)
    } else {
      setNavbar(false)
    }
  }
  window.addEventListener('scroll', changeBackground)

  return (
    <main>
      <div>
        <div id="mobileNavContainer" className="mobile-nav">
          <div className="mobile-nav-close-button">
            <img src="/icons/close.svg" alt="" onClick={toggleMenu} />
          </div>

          <ul>
            <li className="nopad">
              <a href="/" rel="noreferrer" className="noborder">
                <img className="nav-logo" src="/icons/logo.png" alt="" />
              </a>
            </li>
            <li>
              <a href="#about" rel="noreferrer" onClick={toggleMenu}>
                About
              </a>
            </li>
            <li>
              <a href="#roadmap" rel="noreferrer" onClick={toggleMenu}>
                Roadmap
              </a>
            </li>
            <li>
              <a href="#faq" rel="noreferrer" onClick={toggleMenu}>
                FAQ
              </a>
            </li>
            <li className="socials mobiles">
              <a
                href="https://www.instagram.com/degen3rates"
                rel="noreferrer"
                target="_blank"
              >
                <img
                  src="/icons/instagram.svg"
                  alt=""
                  className="social-icon"
                />
              </a>
              <a
                href="https://discord.gg/8gx7AECGHU"
                rel="noreferrer"
                target="_blank"
              >
                <img src="/icons/discord.svg" alt="" className="social-icon" />
              </a>
              <a
                href="https://twitter.com/DEGEN3RATES"
                rel="noreferrer"
                target="_blank"
              >
                <img src="/icons/twitter.svg" alt="" className="social-icon" />
              </a>
            </li>
          </ul>
        </div>
        <div className="mobile-menu-button" onClick={toggleMenu}>
          <img src="/icons/menu.svg" alt="" />
        </div>
        <nav className={navbar ? 'navbar activenav' : 'navbar'}>
          <div className="nav-container">
            <a href="/" rel="noreferrer" className="noborder">
              <img className="nav-logo" src="/icons/logo.png" alt="" />
            </a>
            <div className="flex">
              <a className="hide-800" href="#about">
                About
              </a>
              <a className="hide-800" href="#roadmap">
                Roadmap
              </a>
              <a className="hide-800" href="#faq">
                FAQ
              </a>
              <div className="socials hide-800">
                <a
                  href="https://www.instagram.com/degen3rates"
                  rel="noreferrer"
                  target="_blank"
                  className="hide-800"
                >
                  <img
                    src="/icons/instagram.svg"
                    alt=""
                    className="social-icon"
                  />
                </a>
                <a
                  href="https://discord.gg/8gx7AECGHU"
                  rel="noreferrer"
                  target="_blank"
                  className="hide-800"
                >
                  <img
                    src="/icons/discord.svg"
                    className="social-icon"
                    alt=""
                  />
                </a>
                <a
                  href="https://twitter.com/DEGEN3RATES"
                  rel="noreferrer"
                  target="_blank"
                  className="hide-800"
                >
                  <img
                    src="/icons/twitter.svg"
                    className="social-icon"
                    alt=""
                  />
                </a>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <section className="hero">
        <div className="banner"></div>
        <div className="socials mobiles hidedesk">
          <a
            href="https://www.instagram.com/degen3rates"
            rel="noreferrer"
            target="_blank"
          >
            <img src="/icons/instagram.svg" alt="" className="social-icon" />
          </a>
          <a
            href="https://discord.gg/8gx7AECGHU"
            rel="noreferrer"
            target="_blank"
          >
            <img src="/icons/discord.svg" alt="" className="social-icon" />
          </a>
          <a
            href="https://twitter.com/DEGEN3RATES"
            rel="noreferrer"
            target="_blank"
          >
            <img src="/icons/twitter.svg" alt="" className="social-icon" />
          </a>
        </div>
        <div className="hero-wrapper" id="home">
          <div className="information">
            <div className="label bg-label-gradient">
              7,777 Degenerative NFTs
            </div>
            <div className="flextitle">
              <h1>
                <img src="/logo.gif" alt="" className="logomain" />
                <br />
                GIVING BACK TO DEGENS<br></br>
              </h1>
            </div>
            <p>
              First stop….. 20ETH GIVEAWAY AT 100% MINT and we are only getting
              started <br />
              <br />
              DEGEN3RATES is a collection of 7,777 Degenerative NFTs uniquely
              generated from 177 degenerative traits, showcasing the highs &
              lows of being a fellow Degen. <br />
              Degen3rates founders have been running IRL giveaways since early
              2020 with over $750,000 in prizes given out to date. <br />
              Setting out to shake up web3.0 with more community giveaways than
              any other collection on Opensea. 50% of all royalties will be
              given back to holders in free weekly giveaways in the form of rare
              NFTs, life changing amounts of ETH & other Degen prizes.
            </p>
          </div>

          <div className="leftcont">
            <div className="white__gradient"></div>
            <div className="gold__fade"></div>

            <div className="containerr onboard">
              <div className="phases">
                <div className="phase" id="vip">
                  FREE WL
                </div>
                <div className="phase" id="whitelist">
                  Whitelist
                </div>
                <div className="phase" id="public">
                  Public
                </div>
              </div>
              <h2>DEGEN3RATES MINT</h2>

              <div>
                {!wallet && (
                  <button
                    className="mintbutton"
                    onClick={() => {
                      connect()
                    }}
                  >
                    CONNECT
                  </button>
                )}

                {wallet && (
                  <div className="minting">
                    {data.step != 0 && data.step != null ? (
                      <>
                        <div className="cost">
                          <h2>Price</h2>
                          <h3>
                            {data.cost / 10 ** 18} <span>ETH</span>
                          </h3>
                        </div>

                        <div className="progress">
                          <h3 className="minted">
                            Total minted &nbsp;({data.totalSupply} / 7777) -{' '}
                            {Math.round((data.totalSupply * 100) / 7777) + '%'}
                          </h3>
                          <Box sx={{ width: '100%', height: '60px' }}>
                            <LinearProgressWithLabel
                              value={(data.totalSupply * 100) / 7777}
                            />
                          </Box>
                        </div>
                      </>
                    ) : (
                      <div>
                        <h3>Sale has not started yet.</h3>
                      </div>
                    )}

                    <br></br>
                    <br></br>
                    {data.step == 1 && VIP ? (
                      <div>
                        <button className="mintbutton" onClick={vipmint}>
                          MINT
                        </button>
                      </div>
                    ) : (
                      <div></div>
                    )}
                    {data.step == 1 && !VIP ? (
                      <div>
                        <p className="count">
                          You are not on the FREE WL list.
                        </p>
                      </div>
                    ) : (
                      <div></div>
                    )}
                    {data.step == 2 && WL ? (
                      <div>
                        <div className="quantitymint">
                          <h2>Quantity</h2>
                          <input
                            type="number"
                            id="quantity"
                            min="1"
                            max="500"
                            step="1"
                            value={quantity}
                          />
                          <div className="quantitybuttons">
                            <div className="arrowup" onClick={valueUp}></div>
                            <div
                              className="arrowdown"
                              onClick={valueDown}
                            ></div>
                          </div>
                        </div>
                        <button className="mintbutton" onClick={whitelistmint}>
                          MINT
                        </button>
                      </div>
                    ) : (
                      <div></div>
                    )}
                    {data.step == 2 && !WL ? (
                      <div>
                        <p className="count">You are not whitelisted.</p>
                      </div>
                    ) : (
                      <div></div>
                    )}
                    {data.step == 3 && (
                      <div>
                        <div className="quantitymint">
                          <h2>Quantity</h2>
                          <input
                            type="number"
                            id="quantity"
                            min="1"
                            max="100"
                            step="1"
                            value={quantity}
                          />
                          <div className="quantitybuttons">
                            <div className="arrowup" onClick={valueUp}></div>
                            <div
                              className="arrowdown"
                              onClick={valueDown}
                            ></div>
                          </div>
                        </div>
                        <button className="mintbutton" onClick={mint}>
                          MINT
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="wrapper">
                <div className="wrapper-section">
                  <input
                    type="text"
                    required
                    placeholder="Enter your wallet address"
                    onChange={e => setAddress(e.target.value)}
                    value={address}
                  />
                  <button className="checkbutton" onClick={() => checkWL()}>
                    Check WL
                  </button>
                </div>
                <div className="wrapper-section">
                  <input
                    type="text"
                    required
                    placeholder="Enter your wallet address"
                    onChange={e => setAddress(e.target.value)}
                    value={address}
                  />
                  <button className="checkbutton" onClick={() => checkWL()}>
                    Check Free WL
                  </button>
                </div>

                {address && checkedWL && validWL && (
                  <h3 className="wlstatus">
                    {WL ? 'You are Whitelisted!' : 'You are not Whitelisted.'}
                  </h3>
                )}
                {!validWL && checkedWL && (
                  <h3 className="wlstatus invalid">Invalid wallet address.</h3>
                )}
              </div>

              {errCode == 1 && (
                <Modal
                  show={show}
                  onHide={handleClose}
                  backdrop="static"
                  keyboard={false}
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    You rejected the transaction. Try minting again.
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                      Close
                    </Button>
                  </Modal.Footer>
                </Modal>
              )}
              {errCode == 2 && (
                <Modal
                  show={show}
                  onHide={handleClose}
                  backdrop="static"
                  keyboard={false}
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    You are trying to mint more than the allocated amount for
                    your wallet during this sale.
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                      Close
                    </Button>
                  </Modal.Footer>
                </Modal>
              )}
              {errCode == 3 && (
                <Modal
                  show={show}
                  onHide={handleClose}
                  backdrop="static"
                  keyboard={false}
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>Not enough funds.</Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                      Close
                    </Button>
                  </Modal.Footer>
                </Modal>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="about" id="about">
        <div className="about-wrapper">
          <div className="info-section">
            <h2>Time for the degens to take over</h2>
            <div className="tooltip">
              <span className="readmore">Read more</span>
              <span className="tooltiptext">
                <p>
                  No unrealistic roadmaps <br />
                  No pump & dumps
                  <br />
                  No false promises
                  <br />
                  No dying discords
                  <br />
                  No bots.
                </p>
              </span>
            </div>
            <a href="#home">Mint</a>
          </div>
          {/*<div className="info-section">
            <div className="benefit" >
              <div className="benefit-icon"><img src="/icons/community.svg" alt="" /></div>
              <div className="column">
                <h4>Community</h4>
                <p>DEGEN3RATES, a community ran by Degenerates where like-minded NFT & crypto holders will have the opportunity to win cool NFTs and crazy amounts of ETH for free.</p>
              </div>
            </div>
            <div className="benefit" >
              <div className="benefit-icon"><img src="/icons/giveback.svg" alt="" /></div>
              <div className="column">
                <h4>We give back</h4>
                <p>DEGEN3RATES are setting out to give back more to its members than any other collection in 2023 and beyond</p>
              </div>
            </div>
            <div className="benefit" >
              <div className="benefit-icon"><img src="/icons/transparency.svg" alt="" /></div>
              <div className="column">
                <h4>Total transparency</h4>
                <p>
                  No pump & dumps, no false promises, no dying discords, no bots
                </p>
              </div>
            </div>
            </div>*/}
          <div className="white__gradient2"></div>
        </div>
        <div className="about-wrapper nobot">
          <div className="gold__fade2"></div>
          <img
            className="aboutpicleft"
            src="assets/pic.gif"
            alt=""
            loading="lazy"
          />
          <div className="info-section third">
            <h2>How DEGEN3RATES create community giveaways</h2>
            <div className="tooltip">
              <span className="readmore">Read more</span>
              <span className="tooltiptext">
                <p>
                  With traditional giveaways members pay to enter each giveaway,
                  for Degens those who sell create value for those who hold.
                  Every degen3rate secondary sale on Opensea will create a 10%
                  royalty for the project. 50% of royalties will be paid
                  directly to the Degen-pool wallet which will be available for
                  public view and community members will vote weekly on how this
                  will be distributed back to holders via free giveaways. The
                  higher the Floor gets, the bigger the giveaways become so get
                  ready to hodl hard.
                </p>
              </span>
            </div>
          </div>
        </div>
        <div className="about-wrapper">
          <div className="info-section">
            <h2>Some of the free weekly giveaways will involve</h2>
          </div>
          <div className="info-section">
            <div className="benefit">
              <div className="benefit-icon">
                <img src="/icons/check.svg" alt="" />
              </div>
              <div className="column">
                <h4>Degen Army</h4>
                <p>All members qualify.</p>
              </div>
            </div>
            <div className="benefit">
              <div className="benefit-icon">
                <img src="/icons/check.svg" alt="" />
              </div>
              <div className="column">
                <h4>Trait of the week</h4>
                <p>Trait specific giveaways</p>
              </div>
            </div>
            <div className="benefit">
              <div className="benefit-icon">
                <img src="/icons/check.svg" alt="" />
              </div>
              <div className="column">
                <h4>The OG's</h4>
                <p>Loyalty pays</p>
              </div>
            </div>
          </div>
          <div className="white__gradient2"></div>
        </div>
      </div>
      <div className="statement">
        <h2>
          We are here to shake up opensea <br />
          <span>We are here to take over</span> <br />
          <em>We are the DEGEN3RATES</em>
        </h2>
      </div>
      <div className="roadmap" id="roadmap">
        <div className="white__gradient2"></div>
        <div className="gold__fade2"></div>
        <div className="roadmap-wrap">
          <h1>ROADMAP</h1>
          <div className="wrap-flex">
            <div className="left">
              <div className="tooltip">
                <span className="readmore monu">MINT INFO</span>
                <span className="tooltiptext bigger">
                  <p>
                    Fair Launch, fair distribution: All Degens cost 0.025 ETH to
                    mint. No price tiers… DEGENERATES membership is free for all
                    NFT holders. The more degens you hold the more your odds
                    increase
                    <br />
                    <br />
                    When you buy a Degen, you’re not simply buying an avatar.
                    You are joining a movement, creating a community & gaining a
                    free membership access to a club ran by degens setting out
                    to give back more value to Degens than ever before. When was
                    the last time you owned an NFT that gave you so many
                    opportunities to win big?
                    <br />
                    <br />
                    To access members-only areas such as VIP SUITE, Holders will
                    need to be signed in via their Wallet.
                    <br />
                    <br />
                    Ownership and commercial usage rights given to the consumer
                    over their NFT
                  </p>
                </span>
              </div>
            </div>
            <div className="right">
              <p>
                We have laid out some goals and we are going to have some fun
                along the way. Once we hit a mint target percentage we will
                begin to realize these goals.
              </p>
            </div>
          </div>
        </div>
        <VerticalTimeline>
          <VerticalTimelineElement
            className="vertical-timeline-element--work"
            contentStyle={{ background: '#9e0101', color: '#fff' }}
            contentArrowStyle={{ borderRight: '7px solid  #777777' }}
            iconStyle={{ background: '#9e0101', color: '#fff' }}
            //icon={<WorkIcon />}
          >
            <h2>0%</h2>
            <h3>
              7,777 Degen3rates are locked up ready for mint <br />
              600 = Free (VIP WL) <br />
              4,000 = 0.018 (Earlybird WL) <br />
              3,000 = 0.025 (Public) <br />
              177 = Team/promo
            </h3>
          </VerticalTimelineElement>
          <VerticalTimelineElement
            className="vertical-timeline-element--work"
            contentStyle={{ background: '#9e0101', color: '#fff' }}
            contentArrowStyle={{ borderRight: '7px solid  #777777' }}
            iconStyle={{ background: '#9e0101', color: '#fff' }}
            //icon={<WorkIcon />}
          >
            <h2>20%</h2>
            <h3>
              Our degen bail-outs are underway and 77 degen3rates are airdropped
              to random holders (from 777 lockup)
              <br /> <br />
              <b>Time for a 1ETH Giveaway!</b>
            </h3>
          </VerticalTimelineElement>
          <VerticalTimelineElement
            className="vertical-timeline-element--work"
            contentStyle={{ background: '#9e0101', color: '#fff' }}
            contentArrowStyle={{ borderRight: '7px solid  #777777' }}
            iconStyle={{ background: '#9e0101', color: '#fff' }}
            //icon={<WorkIcon />}
          >
            <h2>40%</h2>
            <h3>
              <b>Time for another 1ETH Giveaway!</b>
            </h3>
          </VerticalTimelineElement>
          <VerticalTimelineElement
            className="vertical-timeline-element--work"
            contentStyle={{ background: '#9e0101', color: '#fff' }}
            contentArrowStyle={{ borderRight: '7px solid  #777777' }}
            iconStyle={{ background: '#9e0101', color: '#fff' }}
            //icon={<WorkIcon />}
          >
            <h2>60%</h2>
            <h3>
              Member-Exclusive Merch Store gets unlocked, featuring Limited
              Edition tees, hoodies & other goodies you see our Degen3rates
              feature in the NFT collection.
              <br />
              <br />
              <b>Go on then... Another 1 ETH Giveaway!!</b>
            </h3>
          </VerticalTimelineElement>
          <VerticalTimelineElement
            className="vertical-timeline-element--work"
            contentArrowStyle={{ borderRight: '7px solid  #777777' }}
            contentStyle={{ background: '#9e0101', color: '#fff' }}
            iconStyle={{ background: '#9e0101', color: '#fff' }}
            //icon={<WorkIcon />}
          >
            <h2>80%</h2>
            <h3>
              Time for a little more love.. <br />
              Another 1ETH Giveaway <br />
              And 2ETH to a charity chosen by the community
            </h3>
          </VerticalTimelineElement>
          <VerticalTimelineElement
            className="vertical-timeline-element--work"
            contentArrowStyle={{ borderRight: '7px solid  #777777' }}
            contentStyle={{ background: '#777777', color: '#fff' }}
            iconStyle={{ background: '#9e0101', color: '#fff' }}
            //icon={<WorkIcon />}
          >
            <h2>100%</h2>
            <h3>
              Degens looking after Degens …20 ETHEREUM GIVEAWAY! And this is us
              just getting started. Draw announced on a live stream via the
              discord community
            </h3>
          </VerticalTimelineElement>
        </VerticalTimeline>
      </div>
      <div className="faq" id="faq">
        <h1>FAQ</h1>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>How many Degen3rates are in the collection?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>7,777 (All the lucky 7s)</Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>When is the Degen3rate Mint?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              To be revealed soon. Follow our socials & Discord
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>Where can I mint?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <a href="#home">Here!!</a>
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>What network is the collection stored on?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>Ethereum</Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>
              How much does it cost to enter the giveaways?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              It doesn’t… You are purchasing the NFT. <br />
              <br />
              The giveaways are simply our way of saying thank you and giving
              back to fellow Degens
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>
              I run another collection and I would be interested in
              collaborating in a giveaway?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Only vetted, well respected collections following the same ethics
              in the web3.0 space will be considered. Reach out to the founders
              via our socials if you fall in to this category
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>How are you giving away so much?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Every secondary sale on opensea will create a 10% royalty. Ongoing
              50% of the Opensea royalties will be paid directly into a
              Degen-pool for free weekly prizes & giveaways.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </div>
      <h5 className="contract">
        VERIFIED SMART CONTRACT ADDRESS
        <br />
        <a
          href="https://etherscan.io/address/0xA7041473133F1EA149b875C60E7eA22668187703"
          target="_blank"
          rel="noreferrer"
        >
          0xA7041473133F1EA149b875C60E7eA22668187703
        </a>
      </h5>
      <h6 className="footnote">All rights reserved Degen3rate</h6>
    </main>
  )
}

export default MintPage
