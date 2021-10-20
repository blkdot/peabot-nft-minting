import './styles/global.scss';
import React, { useState, useEffect } from 'react';
import { 
  Container,
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  Button,
  Row,
  Col
} from 'reactstrap';

import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

// get our fontawesome imports
import { fab, faDiscord, faTwitter } from '@fortawesome/free-brands-svg-icons';

import Web3 from 'web3';
import {ADDRESS, ABI} from "./config.js";
import { library } from '@fortawesome/fontawesome-svg-core';

// import Timer from './timer';

library.add(
  fab,
  faDiscord,
  faTwitter
)

const Accordion = ({ title, children }) => {
  const [isOpen, setOpen] = React.useState(false);
  return (
    <div className="accordion-wrapper">
      
      <div
        className={`accordion-title ${isOpen ? "open" : ""}`}
        onClick={() => setOpen(!isOpen)}
        >
        {title}
      </div>
      <div className={`accordion-item ${!isOpen ? "collapsed" : ""}`}>
        <div className="accordion-content">{children}</div>
      </div>
    </div>
  );
};

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [show, setShow] = useState(false);

  // for wallet
  const [signedIn, setSignedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null)

  // for minting
  const [nfPeabotContract, setNFPeabotContract] = useState(null);
  const [tokenNumber, setTokenNumber] = useState(1);

  // info from smart contract
  const [totalSupply, setTotalSupply] = useState(0);
  // const [nfPeabotPrice, setNFPeabotPrice] = useState(0);
  const [maxTokenNumber, setMaxTokenNumber] = useState(0);

  // public sale date
  // eslint-disable-next-line
  const [publicSaleDate, setPublicSaleDate] = useState({name: 'Public Sale Date', date: 'September 30, 2021'});
  
  const toggle = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
  })

  // useEffect( async() => { 
  //   signIn()
  // }, [])

  const handleScroll = () => {
    if (window.scrollY > 90) {
      setSticky(true);
    } else if (window.scrollY < 90) {
      setSticky(false);
    }
  }

  const connectMetamask = () => {
    signIn();
  }

  const disconnectMetamask = () => {
    signOut();
  }

  const signIn = async () => {
    if (typeof window.web3 !== 'undefined') {
      // Use existing gateway
      window.web3 = new Web3(window.ethereum);
     
    } else {
      alert("No Ethereum interface injected into browser. Please install Metamask.");
      return;
    }

    window.ethereum.enable()
      .then(function (accounts) {
        window.web3.eth.net.getNetworkType()
        // checks if connected network is mainnet (change this to rinkeby if you wanna test on testnet)
        .then((network) => {
          console.log(network);
          if(network !== "rinkeby") { 
            alert("You are on " + network+ " network. Change network to rinkeby or you won't be able to do anything here")
          } else {
            let wallet = accounts[0]
            setWalletAddress(wallet)
            setSignedIn(true)
            callContractData(wallet)
          }
        });  
      })
      .catch(function (error) {
        // Handle error. Likely the user rejected the login
        console.error(error)
      })
  }

  const signOut = async () => {
    setSignedIn(false);
  }

  async function callContractData(wallet) {
    // let balance = await web3.eth.getBalance(wallet);
    // setWalletBalance(balance)
    const nfPeabotContract = new window.web3.eth.Contract(ABI, ADDRESS);
    setNFPeabotContract(nfPeabotContract);

    const maxTokenNumber = await nfPeabotContract.methods.MAX_ELEMENTS().call();
    setMaxTokenNumber(maxTokenNumber);

    const totalSupply = await nfPeabotContract.methods.totalSupply().call();
    setTotalSupply(totalSupply);

    // const nfPeabotPrice = await nfPeabotContract.methods.mintPrice().call();
    // setNFPeabotPrice(nfPeabotPrice);
   
  }
  
  const handleShow = () => {
    if (signedIn) {
      setShow(true);
    } else {
      alert('please connnect your metamask');
    }
  }

  const handleClose = () => setShow(false);

  const decreaseTokenNumber = () => {
    if (tokenNumber === 0) {
      return;
    }
    setTokenNumber(tokenNumber - 1);
  }

  const mint = async (numberofTokens) => {
    if (nfPeabotContract) {
      const nfPeabotPrice = await nfPeabotContract.methods.mintPrice().call();
      const price = Number(nfPeabotPrice)  * numberofTokens
      const gasAmount = await nfPeabotContract.methods.mint(numberofTokens).estimateGas({from: walletAddress, value: price})

      const _totalSupply = await nfPeabotContract.methods.totalSupply().call()
      nfPeabotContract.methods
        .mint(walletAddress, numberofTokens)
        .send({from: walletAddress, value: price, gas: String(gasAmount)})
        .on('transactionHash', function(hash){
          console.log("transactionHash", hash)
        })
        .on('receipt', function(receipt) {
          console.log('receipt')
        })
        .on('confirmation', function(confirmationNumber, receipt){
          console.log('confirmation')
          setTotalSupply(parseInt(_totalSupply, 10) + numberofTokens)
        })
        .on('error', console.error)
        setShow(false)
    } else {
        console.log("Wallet not connected")
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <div className={`header${sticky ? ' sticky' : ''}`}>
        <Navbar light expand="md">
          <Container>
            <NavbarBrand href="/">
              <img src="/images/logo.svg" alt="" />
            </NavbarBrand>
            <NavbarToggler onClick={toggle} />
            <Collapse isOpen={isOpen} navbar>
              <Nav navbar className = "d-flex justify-content-between">
                <div className="menu d-flex align-items-center">
                  <NavItem>
                    <NavLink href="#about" onClick={closeMenu}>ABOUT</NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink href="#community" onClick={closeMenu}>COMMUNITY</NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink href="#specs" onClick={closeMenu}>SPECS</NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink href="#roadmap" onClick={closeMenu}>ROADMAP</NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink href="#faq" onClick={closeMenu}>FAQ</NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink href="#mint" onClick={closeMenu}>MINT</NavLink>
                  </NavItem>
                </div>
                <div className="d-flex align-items-center">
                  <div className="social-icons d-flex">
                    <NavItem className="discord">
                      <NavLink href="https://discord.com/invite/peabots" target="_blank">
                        <svg id="discord-seeklogo.com" xmlns="http://www.w3.org/2000/svg" width="24.502" height="27.133" viewBox="0 0 24.502 27.133">
                          <path id="Path_2" data-name="Path 2" d="M21.632,0H2.87A2.833,2.833,0,0,0,0,2.795V21.137a2.833,2.833,0,0,0,2.87,2.795H18.748l-.742-2.51L19.8,23.036l1.694,1.519,3.01,2.578V2.795A2.833,2.833,0,0,0,21.632,0Zm-5.4,17.718s-.5-.583-.924-1.1A4.412,4.412,0,0,0,17.838,15a8.113,8.113,0,0,1-1.61.8,9.438,9.438,0,0,1-2.03.583,10.117,10.117,0,0,1-3.626-.014,12.042,12.042,0,0,1-2.058-.583,8.336,8.336,0,0,1-1.022-.461c-.042-.027-.084-.041-.126-.068a.193.193,0,0,1-.056-.041c-.252-.136-.392-.231-.392-.231a4.344,4.344,0,0,0,2.45,1.6c-.42.516-.938,1.126-.938,1.126a5.107,5.107,0,0,1-4.27-2.062A17.741,17.741,0,0,1,6.175,7.747a7.074,7.074,0,0,1,3.934-1.425l.14.163A9.542,9.542,0,0,0,6.567,8.262s.308-.163.826-.393a10.783,10.783,0,0,1,3.178-.855,1.421,1.421,0,0,1,.238-.027,12.223,12.223,0,0,1,2.828-.027,11.675,11.675,0,0,1,4.214,1.3,9.407,9.407,0,0,0-3.486-1.723l.2-.217A7.074,7.074,0,0,1,18.5,7.747a17.74,17.74,0,0,1,2.016,7.909A5.15,5.15,0,0,1,16.227,17.718ZM9.717,11.382a1.508,1.508,0,1,0,1.428,1.506,1.465,1.465,0,0,0-1.428-1.506m5.111,0a1.508,1.508,0,1,0,1.428,1.506,1.465,1.465,0,0,0-1.428-1.506" fill="#fff"/>
                        </svg>
                      </NavLink>
                    </NavItem>
                    <NavItem className="twitter">
                      <NavLink href="https://twitter.com/PeaBotsNFT" target="_blank">
                        <svg xmlns="http://www.w3.org/2000/svg" width="26.657" height="21.663" viewBox="0 0 26.657 21.663">
                          <path id="Path_3" data-name="Path 3" d="M165.657,85.3a10.937,10.937,0,0,1-3.141.861,5.487,5.487,0,0,0,2.4-3.026,10.944,10.944,0,0,1-3.473,1.327,5.474,5.474,0,0,0-9.319,4.988,15.526,15.526,0,0,1-11.272-5.714,5.475,5.475,0,0,0,1.692,7.3,5.447,5.447,0,0,1-2.477-.684c0,.023,0,.046,0,.069a5.472,5.472,0,0,0,4.387,5.363,5.482,5.482,0,0,1-2.47.094,5.474,5.474,0,0,0,5.109,3.8,10.972,10.972,0,0,1-6.792,2.341,11.094,11.094,0,0,1-1.3-.077,15.553,15.553,0,0,0,23.943-13.1q0-.356-.016-.708A11.112,11.112,0,0,0,165.657,85.3Z" transform="translate(-139 -82.733)" fill="#fff"/>
                        </svg>
                      </NavLink>
                    </NavItem>
                  </div>
                  {/* <NavItem className="wallet-connect-btn">
                    {!signedIn ? <Button size="sm" onClick={connectMetamask}>CONNECT WALLET</Button>
                    :
                    <Button size="sm" onClick={disconnectMetamask}>DISCONNECT WALLET</Button>}
                  </NavItem> */}
                  <NavItem className="wallet-connect-btn">
                    <Button size="sm">COMING SOON</Button>
                  </NavItem>
                </div>
              </Nav>
            </Collapse>
          </Container>
        </Navbar>
      </div>
      {/* Banner */}
      <div id="mint">
        <Container>
          <div className="banner d-flex justify-content-between">
            <div className="banner-content d-flex">
              <div>
                <h2>Join the PeaBot Army</h2>
                <p>A collection of 10,000 unique PeaBots, forever dreaming of living like humans.</p>
              </div>
              <div className="d-flex align-items-center">
                {/* <Button size="sm" onClick={handleShow}>MINT</Button> */}
                <Button size="sm">COMING SOON</Button>
              </div>
            </div>
            <div className="banner-img">
              <img className="img" src="/images/banner.png" alt="" />
            </div>    
          </div>
        </Container>
      </div>
      {/* About */}
      <div id="about" >
        <Container>
          <h2 className="text-center">What are PeaBots?</h2>
          <p className="passage1">
            PeaBots, the first Japanese female led 10,000 randomly generated digital collectibles of various rarity living on the Ethereum blockchain as ERC-721 tokens and hosted on IPFS.
            The total number of combinations possible amount to over 124 trillion which they think is enough to take over the human race.
          </p>
          <p className="passage2">
            PeaBots were originally created to protect the human race and the world they in live in as an experiment.
            However they accidentally left some negative human traits that were meant to be removed in the final phase of the experiment.
            PeaBots escaped the lab based on outskirts of Tokyo and bred rapidly, growing in population with an aim to take over human race.
            They want to live like humans and they want to be on top of the hierarchical structure of the earth's ecosystem. Yes, more superior than humans.
          </p>
          <p className="passage3">
            PeaBots are the creation of Japanese female artist Isako, inspired by 90's Japanese manga and City Pop.
          </p>
        </Container>
      </div>
      {/* communtiy */}
      <div id="community">
        <Container>
          <Row>
            <Col lg={6} md={6} sm={12}>
              <img src="/images/PeaBots_5.png" alt="" />
            </Col>
            <Col lg={6} md={6} sm={12}>
              <div className="community-title">
                <h2>Be part of the community</h2>
                <p>
                  Join the PeaBot army in our Discord Community. Get the latest news about giveaways, important dates, airdrops and more!
                </p>
              </div>
              <div className="d-flex flex-column">
                {/* eslint-disable-next-line */}
                <a className="discord-btn" href="https://discord.com/invite/peabots" target="_blank">
                  <svg id="discord-seeklogo.com" xmlns="http://www.w3.org/2000/svg" width="13.114" height="14.522" viewBox="0 0 13.114 14.522">
                    <path id="Path_2" data-name="Path 2" d="M11.578,0H1.536A1.516,1.516,0,0,0,0,1.5v9.817a1.516,1.516,0,0,0,1.536,1.5h8.5l-.4-1.343.959.864.907.813,1.611,1.38V1.5A1.516,1.516,0,0,0,11.578,0ZM8.685,9.483s-.27-.312-.495-.588a2.361,2.361,0,0,0,1.356-.864,4.342,4.342,0,0,1-.862.428A5.051,5.051,0,0,1,7.6,8.771a5.415,5.415,0,0,1-1.941-.007,6.445,6.445,0,0,1-1.1-.312,4.461,4.461,0,0,1-.547-.247c-.022-.015-.045-.022-.067-.036a.1.1,0,0,1-.03-.022c-.135-.073-.21-.123-.21-.123a2.325,2.325,0,0,0,1.311.857c-.225.276-.5.6-.5.6a2.733,2.733,0,0,1-2.286-1.1A9.5,9.5,0,0,1,3.3,4.146,3.786,3.786,0,0,1,5.41,3.384l.075.087a5.107,5.107,0,0,0-1.971.951s.165-.087.442-.211a5.771,5.771,0,0,1,1.7-.457.76.76,0,0,1,.127-.015A6.542,6.542,0,0,1,7.3,3.725a6.249,6.249,0,0,1,2.256.7A5.035,5.035,0,0,0,7.689,3.5l.1-.116A3.786,3.786,0,0,1,9.9,4.146a9.495,9.495,0,0,1,1.079,4.233A2.756,2.756,0,0,1,8.685,9.483ZM5.2,6.092a.807.807,0,1,0,.764.806A.784.784,0,0,0,5.2,6.092m2.735,0A.807.807,0,1,0,8.7,6.9a.784.784,0,0,0-.764-.806" transform="translate(0 0)" fill="#fff"/>
                  </svg>
                  DISCORD
                </a>
                {/* eslint-disable-next-line */}
                <a className="twitter-btn" href="https://twitter.com/PeaBotsNFT" target="_blank">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14.462" height="11.753" viewBox="0 0 14.462 11.753">
                    <path id="Path_14" data-name="Path 14" d="M153.462,84.124a5.934,5.934,0,0,1-1.7.467,2.977,2.977,0,0,0,1.3-1.642,5.938,5.938,0,0,1-1.884.72,2.97,2.97,0,0,0-5.056,2.706,8.424,8.424,0,0,1-6.116-3.1,2.97,2.97,0,0,0,.918,3.961,2.955,2.955,0,0,1-1.344-.371c0,.012,0,.025,0,.037a2.969,2.969,0,0,0,2.38,2.909,2.974,2.974,0,0,1-1.34.051,2.97,2.97,0,0,0,2.772,2.061,5.953,5.953,0,0,1-3.685,1.27,6.018,6.018,0,0,1-.708-.042,8.438,8.438,0,0,0,12.99-7.109q0-.193-.009-.384A6.029,6.029,0,0,0,153.462,84.124Z" transform="translate(-139 -82.733)" fill="#fff"/>
                  </svg>
                  TWITTER
                </a>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      {/* specs */}
      <div id="specs">
        <Container>
          <h2 className="text-center">Specs</h2>
          <Row className="first-part">
            <Col lg={6} md={6} sm={12}>
              <div className="volume spec-box text-center">
                <h4>Volume</h4>
                <p>10,000 artworks with 290+ traits in 11 categories</p>
              </div>
            </Col>
            <Col lg={6} md={6} sm={12}>
              <div className="unique spec-box text-center">
                <h4>Unique</h4>
                <p>Every PeaBot has an unique combination of traits with varying rarity … and personalities of course!</p>
              </div>
            </Col>
          </Row>
          <Row className="second-part">
          <Col lg={6} md={6} sm={12}>
              <div className="high-quality-art spec-box text-center">
                <h4>High quality art</h4>
                <p>Lovingly hand drawn by Japanese female artist Isako Tokumei.</p>
              </div>
            </Col>
            <Col lg={6} md={6} sm={12}>
              <div className="fair-minting-price spec-box text-center">
                <h4>Fair minting price</h4>
                <p>PeaBots will be sold at a flat price. No FOMO.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      {/* Roadmap */}
      <div id="roadmap">
        <Container>
          <h2 className="roadmap-header text-center">Roadmap</h2>
          <div className="roadmap-step">
            <div className="roadmap-item d-flex mb-2">
              <div className="roadmap-progress">
                <img src="/images/roadmap-progress.png" alt="" />
              </div>
              <div className="roadmap-content">
                <p className="roadmap-content-title">
                  Private sale & Public sale
                </p>
                <p>
                  Pre-sale participants can participate in The Key Citizen Reward Campaign.
                  The winners will receive a randomly selected key citizen badged PeaBot (only 2% or so PeaBots will have the KC badge in the entire collection!).
                  The KC Reward Campaign will take place before the pre-sale. You can get whitelisted from our discord.
                </p>
              </div>
            </div>
            <div className="roadmap-item d-flex mb-2">
              <div className="roadmap-progress">
                <img src="/images/roadmap-progress.png" alt="" />
              </div>
              <div className="roadmap-content">
                <p className="roadmap-content-title">
                  Public sale
                </p>
                <p>
                  Our team really loves PeaBots and the future opportunities this project will bring.
                  We hope you can take part in this journey and enjoy it with us! The PeaBots project will be listed on Rarity Tools once the sale completes.
                </p>
              </div>
            </div>
            <div className="roadmap-item d-flex mb-2">
              <div className="roadmap-progress">
                <img src="/images/roadmap-progress.png" alt="" />
              </div>
              <div className="roadmap-content">
                <p className="roadmap-content-title">
                  Exciting collaborations
                </p>
                <p>
                  We will be collaborating with other NFT artists as well as looking for opportunities with brands for collaborations.
                </p>
              </div>
            </div>
            <div className="roadmap-item d-flex mb-2">
              <div className="roadmap-progress">
                <img src="/images/roadmap-progress.png" alt="" />
              </div>
              <div className="roadmap-content">
                <p className="roadmap-content-title">
                  NEXTO ART  Project
                </p>
                <p>
                  We want to take a role in assisting the next generation of artists in this fast changing new art industry.
                  We will be connecting art projects around the world and the most talented young creative artists from Japan, Korea and rest of Asia.
                  The aim is to bring the fresh next generation talents and undiscovered gems with tech and linguistic disadvantages onto the world stage,  providing a platform to shine.
                  NEXTO ART aims to be the greatest art hub in the field. You will be given access to private sales from NEXTO ART, as well as updates and invitations to participate as a community member.
                </p>
              </div>
            </div>
            <div className="roadmap-item d-flex mb-2">
              <div className="roadmap-progress">
                <img src="/images/roadmap-progress.png" alt="" />
              </div>
              <div className="roadmap-content">
                <p className="roadmap-content-title">
                  Airdrops
                </p>
                <p>
                  PeaBots Token holders will benefit from airdrops.
                </p>
              </div>
            </div>
            <div className="roadmap-item d-flex mb-2">
              <div className="roadmap-progress">
                <img src="/images/roadmap-progress.png" alt="" />
              </div>
              <div className="roadmap-content">
                <p className="roadmap-content-title">
                  NEXTO ART
                </p>
                <p>
                  NEXTO ART will take over the PeaBots discord and PeaBots will become the OG project of NEXTO ART and you will be the OG members!!
                </p>
              </div>
            </div>
          </div>
          <div className="roadmap-description">
            Roadmap may be subject to change and improvements
          </div>
        </Container>
      </div>
      {/* team member */}
      <div id="team">
        <Container>
          <h2 className="text-center">The Team</h2>
          <Row>
            <Col lg={3} md={6} sm={6}>
              <div className="team-member">
                <img src="/images/4.jpg" alt="" />
                <h5>Isako</h5>
                <div className="d-flex justify-content-between align-items-start">
                  <p>Artist / Founder</p>
                  {/* eslint-disable-next-line */}
                  <a href="https://twitter.com/Isako_Tokumei" title="Twitter" target="_blank">
                    <img src="/images/dove.svg" alt="" />
                  </a>
                </div>
              </div>
            </Col>
            <Col lg={3} md={6} sm={6}>
              <div className="team-member">
                <img src="/images/3.jpg" alt="" />
                <h5>Toldo</h5>
                <div className="d-flex justify-content-between align-items-start">
                  <p>Tech & Dev</p>
                  {/* eslint-disable-next-line */}
                  <a href="https://twitter.com/Toldo001" title="Twitter" target="_blank">
                    <img src="/images/dove.svg" alt="" />
                  </a>
                </div>
              </div>
            </Col>
            <Col lg={3} md={6} sm={6}>
              <div className="team-member">
                <img src="/images/2.jpg" alt="" />
                <h5>Antoniio</h5>
                <p>Dev</p>
              </div>
            </Col>
            <Col lg={3} md={6} sm={6}>
              <div className="team-member">
                <img src="/images/1.jpg" alt="" />
                <h5>Hana</h5>
                <p>Marketing</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      {/* Faq */}
      <div id="faq">
        <Container>
          <h2 className="text-center">FAQ</h2>
          <Accordion title="How much is it to mint a PeaBot?">
            PeaBots will be sold at a flat price of 0.08 ETH per token. We have cut out all unnecesary bits so we can share PeaBots at a fair price.
          </Accordion>
          <Accordion title="How many will there be?">
            Total 10,000 tokens, which means 10,000 unique artworks with 290+ traits in 10 categories. Also including special rare editions.
          </Accordion>
          <Accordion title="What about IP?">
            The IP belongs to Isako Tokumei, the artist of PeaBots.
          </Accordion>
          <Accordion title="When is the release date?">
            TBC (Q4 2021). Join us on Discord and Twitter for announcements and various exclusive deals.
          </Accordion>
          <Accordion title="Total number of tokens">
            10000
          </Accordion>
          <Accordion title="Tokens withheld from sale">
            250 (giveaways, marketing and team)
          </Accordion>
          <Accordion title="Price per token">
            TBC
          </Accordion>
          <Accordion title="Token type">
            ERC-721
          </Accordion>
          <Accordion title="Blockchain">
            Ethereum
          </Accordion>
          <Accordion title="File hosting">
            IPFS
          </Accordion>
        </Container>
      </div>
      {/*Footer*/}
      <div className="footer container-fluid text-center text-md-left">
        <Container>
          <div className="footer-logo d-flex justify-content-start">
            <img src="/images/footer-logo.svg" alt="" />
          </div>
          <div className="footer-links d-flex">
            <ul className="d-flex list-unstyled">
              <li><a href="#about">ABOUT</a></li>
              <li><a href="#community">COMMUNITY</a></li>
              <li><a href="#specs">SPECS</a></li>
              <li><a href="#roadmap">ROADMAP</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#mint">MINT</a></li>
            </ul>
          </div>
          <hr />
          <div className="footer-left d-flex justify-content-between align-items-center">
            <div>
              Peabots 2021. All rights reserved
            </div>
            <ul className="d-flex list-unstyled">
              <li>
                {/* eslint-disable-next-line */}
                <a href="https://discord.com/invite/peabots" title="Discord" target="_blank">
                  <svg id="discord-seeklogo.com" xmlns="http://www.w3.org/2000/svg" width="24.502" height="27.133" viewBox="0 0 24.502 27.133">
                    <path id="Path_2" data-name="Path 2" d="M21.632,0H2.87A2.833,2.833,0,0,0,0,2.795V21.137a2.833,2.833,0,0,0,2.87,2.795H18.748l-.742-2.51L19.8,23.036l1.694,1.519,3.01,2.578V2.795A2.833,2.833,0,0,0,21.632,0Zm-5.4,17.718s-.5-.583-.924-1.1A4.412,4.412,0,0,0,17.838,15a8.113,8.113,0,0,1-1.61.8,9.438,9.438,0,0,1-2.03.583,10.117,10.117,0,0,1-3.626-.014,12.042,12.042,0,0,1-2.058-.583,8.336,8.336,0,0,1-1.022-.461c-.042-.027-.084-.041-.126-.068a.193.193,0,0,1-.056-.041c-.252-.136-.392-.231-.392-.231a4.344,4.344,0,0,0,2.45,1.6c-.42.516-.938,1.126-.938,1.126a5.107,5.107,0,0,1-4.27-2.062A17.741,17.741,0,0,1,6.175,7.747a7.074,7.074,0,0,1,3.934-1.425l.14.163A9.542,9.542,0,0,0,6.567,8.262s.308-.163.826-.393a10.783,10.783,0,0,1,3.178-.855,1.421,1.421,0,0,1,.238-.027,12.223,12.223,0,0,1,2.828-.027,11.675,11.675,0,0,1,4.214,1.3,9.407,9.407,0,0,0-3.486-1.723l.2-.217A7.074,7.074,0,0,1,18.5,7.747a17.74,17.74,0,0,1,2.016,7.909A5.15,5.15,0,0,1,16.227,17.718ZM9.717,11.382a1.508,1.508,0,1,0,1.428,1.506,1.465,1.465,0,0,0-1.428-1.506m5.111,0a1.508,1.508,0,1,0,1.428,1.506,1.465,1.465,0,0,0-1.428-1.506" fill="#fff"/>
                  </svg>
                </a>
              </li>
              <li>
                {/* eslint-disable-next-line */}
                <a href="https://twitter.com/PeaBotsNFT" title="Twitter" target="_blank">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26.657" height="21.663" viewBox="0 0 26.657 21.663">
                    <path id="Path_3" data-name="Path 3" d="M165.657,85.3a10.937,10.937,0,0,1-3.141.861,5.487,5.487,0,0,0,2.4-3.026,10.944,10.944,0,0,1-3.473,1.327,5.474,5.474,0,0,0-9.319,4.988,15.526,15.526,0,0,1-11.272-5.714,5.475,5.475,0,0,0,1.692,7.3,5.447,5.447,0,0,1-2.477-.684c0,.023,0,.046,0,.069a5.472,5.472,0,0,0,4.387,5.363,5.482,5.482,0,0,1-2.47.094,5.474,5.474,0,0,0,5.109,3.8,10.972,10.972,0,0,1-6.792,2.341,11.094,11.094,0,0,1-1.3-.077,15.553,15.553,0,0,0,23.943-13.1q0-.356-.016-.708A11.112,11.112,0,0,0,165.657,85.3Z" transform="translate(-139 -82.733)" fill="#fff"/>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </Container>
      </div>
      {/* Modal */}
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Mint a PeaBot</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <img src="/images/reveal.gif" alt="" style={{maxWidth: "320px"}} />
          <div className="mint-number d-flex align-items-center">
            <button type="button" onClick={decreaseTokenNumber}><span aria-hidden="true">-</span></button>
            <Form>
              <Form.Label>
                { tokenNumber }
              </Form.Label>
            </Form>
            <button type="button" onClick={() => setTokenNumber(tokenNumber + 1)}><span aria-hidden="true">+</span></button>
          </div>
          <div>
            Minted so far: { totalSupply } / { maxTokenNumber }
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => mint(tokenNumber)}>
            Mint
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;
