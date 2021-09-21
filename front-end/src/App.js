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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Web3 from 'web3';
import {ADDRESS, ABI} from "./config.js";
import { library } from '@fortawesome/fontawesome-svg-core';

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
  const [nfPeabotPrice, setNFPeabotPrice] = useState(0);
  const [maxTokenNumber, setMaxTokenNumber] = useState(0);
  
  const toggle = () => setIsOpen(!isOpen);

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
      alert("No Ethereum interface injected into browser. Read-only access");
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

    const nfPeabotPrice = await nfPeabotContract.methods.PRICE().call();
    setNFPeabotPrice(nfPeabotPrice);
   
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
 
      const price = Number(nfPeabotPrice)  * numberofTokens 

      const gasAmount = await nfPeabotContract.methods.mint(walletAddress, numberofTokens).estimateGas({from: walletAddress, value: price})

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
          // dispatch({type: SET_TOTALSUPPLY, data: parseInt(_totalSupply, 10) + numberofTokens})
        })
        .on('error', console.error)
      // props.setTotalSupply({totalSupply})
      // setTotalSupply(totalSupply)
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
              <img src="/images/logo.svg" alt="" style={{width: "115px"}}/>
            </NavbarBrand>
            <NavbarToggler onClick={toggle} />
            <Collapse isOpen={isOpen} navbar>
              <Nav navbar>
                <NavItem>
                  <NavLink href="/">Home</NavLink>
                </NavItem>
                <NavItem>
                  <NavLink href="/#mint">MINT</NavLink>
                </NavItem>
                <NavItem>
                  <NavLink href="#faq">FAQ</NavLink>
                </NavItem>
                <NavItem>
                  {!signedIn ? <Button size="sm" onClick={connectMetamask}>CONNECT WALLET</Button>
                  :
                  <Button size="sm" onClick={disconnectMetamask}>DISCONNECT WALLET</Button>}
                </NavItem>
              </Nav>
            </Collapse>
          </Container>
        </Navbar>
      </div>
      <Container>
        {/* Banner */}
        <div className="banner">
          <div className="banner-content">
            <div className="d-flex justify-content-center">
              <img src="/images/banner.png" alt="banner" style={{height: "400px"}}/>
            </div>
            <h1>PEABOT SUCCESSFULLY SOLD OUT!</h1>
          </div>
        </div>
        {/* About */}
        <div id="mint">
          <Row>
            <Col md={6} sm={12}>
              <p>The Blockchain Favourite Anti-Hero in 10000 Different disguises and forms!</p>
              <h2>WHO IS EVAL?</h2>
              <p>
                EVOL, a 2000 year old Cherub, has been cast down to earth after a disagreement with the management. 
                At first too proud to try and get back home, now, unable to remember what he has to do to get there.
              </p>
              <p>
                After centuries of equally good and bad behaviour he has found a home on the blockchain. 
                G’EVOLs is a collection of 8888 disguises and forms that EVOL can take on any given day.
              </p>
              <div className="banner-btn">
                <Button size="lg" onClick={handleShow}>MINT</Button>
              </div>
              <h2>SPECS</h2>
              <p>
                Each G’EVOL is Randomly generated from over 150 traits. 
                Each one is Unique and could easily steal your girl.
              </p>
              <p>
                G’EVOLs has some traits unlike other Generative collections you may have seen before - Fresh, bold and colourful - A new way of thinking about what a generative collection can be.
              </p>
            </Col>
            <Col md={6} sm={12}>
              <img src="/images/sample.png" alt="peabot" style={{width: "450px"}}/>
            </Col>
          </Row>
        </div>
        {/* Discord */}
        <div id="discord">
          <Row>
            <Col lg={6} md={6} sm={12}>
              <div className="discord-title">
                <h2>JOIN OUR DISCORD GROUP</h2>
                <p>
                  The EVOL Community is a hub for Degens and Creatives a-like, join the discord to stay ontop of all news and announcements. 
                  All news regarding the G'EVOLs drop will appear here first, do not miss out!
                </p>
              </div>
              <div className="discord-btn">
                <Button size="lg">DISCORD</Button>
              </div>
            </Col>
            <Col lg={6} md={6} sm={12}>
              <img src="/images/discord-img.png" alt="DiscordImg" style={{width: "450px"}}/>
            </Col>
          </Row>
        </div>
      </Container>
      {/* Roadmap */}
      <div id="roadmap">
        <Container>
          <h2 className="roadmap-header text-center mb-3">ROADMAP</h2>
          <h5 className="roadmap-content mb-5">
            The PeaBot is a full time project for us now and it will continue to be after the public sale. 
            Below is what we're working towards in the short term. 
            Each milestone unlocks when a certain % of doges have been minted. 
            Future developments will be decided and voted upon by the community.
          </h5>
          <div className="roadmap-step" style={{marginTop: "20px"}}>
            <div className="roadmap-item d-flex mb-2">
              <div className="roadmap-progress">
                <div className="roadmap-progress-circle">
                  <div className="roadmap-progress-value">
                    20%
                  </div>
                </div>
                <img src="/images/arrow.png" alt="" />
              </div>
              <div className="roadmap-content">
                <div>
                  Some of Doge NFTs will be airdropped to our early adopters and fanbase
                </div>
                <div>
                  We ramp up our Discord and social media management, which will include a pack of community managers and moderators to bring our Doge community to the moon 🌙
                </div>
              </div>
            </div>
            <div className="roadmap-item d-flex mb-2">
              <div className="roadmap-progress">
                <div className="roadmap-progress-circle">
                  <div className="roadmap-progress-value">
                    50%
                  </div>
                </div>
                <img src="/images/arrow.png" alt="" />
              </div>
              <div className="roadmap-content">
                <div>
                  $20,000 donation fund will be established and with the help of the community we will decide on a charity who is a
                </div>
                <div>
                good partner for our project. With the project we want to bring together a community of doge and dog lovers 🐶
                </div>
              </div>
            </div>
            <div className="roadmap-item d-flex mb-2">
              <div className="roadmap-progress">
                <div className="roadmap-progress-circle">
                  <div className="roadmap-progress-value">
                    70%
                  </div>
                </div>
                <img src="/images/arrow.png" alt="" />
              </div>
              <div className="roadmap-content">
                <div>
                  An exclusive The Doge Pound merch line will drop. This will be hats, Tshirts, and most importantly apparel for your
                </div>
                <div>
                  dogs! We already have several designs done and ready to go!
                </div>
              </div>
            </div>
            <div className="roadmap-item d-flex mb-2">
              <div className="roadmap-progress">
                <div className="roadmap-progress-circle">
                  <div className="roadmap-progress-value">
                    90%
                  </div>
                </div>
                <img src="/images/arrow.png" alt="" />
              </div>
              <div className="roadmap-content">
                <div>
                  Community grant fund of $30,000 is launched. Create, design, develop, or build something that the community values (e.g. extra utility
                </div>
                <div>
                  for the doges, additional art, memes, etc.) and receive funding from The Doge Pound team. In addition to this 2.5% of the OpenSea
                </div>
                <div>
                  fees will go into the community grant forever! Building out the longevity and community is our #1 priority.
                </div>
              </div>
            </div>
            <div className="roadmap-item d-flex mb-2">
              <div className="roadmap-progress">
                <div className="roadmap-progress-circle">
                  <div className="roadmap-progress-value">
                    100%
                  </div>
                </div>
                <img src="/images/arrow.png" alt="" />
              </div>
              <div className="roadmap-content">
                <div>
                  We will establish a liquidity pool and seed it in order to help stabilize the price of the doge NFTs/token. The plan is to
                </div>
                <div>
                  launch this 2-3 days after launch and buy up a handful of doges at floor price.
                </div>
              </div>
            </div>
            <div className="roadmap-item d-flex mb-2">
              <div className="roadmap-progress">
                <div className="roadmap-progress-circle">
                  <div className="roadmap-progress-value">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="38" width="38" xmlns="http://www.w3.org/2000/svg"><path d="M256 421.6c-18.1 0-33.2-6.8-42.9-10.9-5.4-2.3-11.3 1.8-10.9 7.6l3.5 51c.2 3.1 3.8 4.7 6.3 2.8l14.5-11c1.8-1.4 4.5-.9 5.7 1l20.5 32.1c1.5 2.4 5.1 2.4 6.6 0l20.5-32.1c1.2-1.9 3.9-2.4 5.7-1l14.5 11c2.5 1.9 6.1.3 6.3-2.8l3.5-51c.4-5.8-5.5-10-10.9-7.6-9.8 4.1-24.8 10.9-42.9 10.9z"></path><path d="M397.7 293.1l-48-49.1c0-158-93.2-228-93.2-228s-94.1 70-94.1 228l-48 49.1c-1.8 1.8-2.6 4.5-2.2 7.1L130.6 412c.9 5.7 7.1 8.5 11.8 5.4l67.1-45.4s20.7 20 47.1 20c26.4 0 46.1-20 46.1-20l67.1 45.4c4.6 3.1 10.8.3 11.8-5.4l18.5-111.9c.2-2.6-.6-5.2-2.4-7zM256.5 192c-17 0-30.7-14.3-30.7-32s13.8-32 30.7-32c17 0 30.7 14.3 30.7 32s-13.7 32-30.7 32z"></path></svg>
                  </div>
                </div>
              </div>
              <div className="roadmap-content" style={{borderBottom: "none"}}>
                <div style={{marginBottom: "15px"}}>
                  <div>
                    🚀🚀 Already in the works 🚀🚀
                  </div>
                  <div>
                    We will make Doges ready for MetaVerse / 3D. (We will leak some previews of this as we’ve secretly been working on
                  </div>
                  <div>
                    this for a while)
                  </div>
                </div>
                <div style={{marginBottom: "15px"}}>
                  <div>
                    Companion NFT will be dropped. (Every doge lover that is holding a doge down the road will get a companion NFT for
                  </div>
                  <div>
                    free)
                  </div>
                </div>
                <div style={{marginBottom: "15px"}}>
                  <div>
                    The rest of the fate of this project will be determined by YOU, the community! Together, we plan to make this an ultra
                  </div>
                  <div>
                    strong, fun loving, community! Let’s kick some butt! 🐶
                  </div>
                </div>
                <div style={{marginBottom: "15px"}}>
                  <div>
                    Finally, there is a lot being discussed about potential partnerships and future developments of the project. Our focus
                  </div>
                  <div>
                    for the time being is having a super smooth launch and delivering on everything listed above. We don’t think it is fair
                  </div>
                  <div>
                    to over hype things for now that aren’t set in stone.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
      {/* Faq */}
      <div id="faq">
        <Container>
          <h2 className="text-center">FREQUENTLY ASKED QUESTIONS</h2>
          <Accordion title="How Much to Mint a G'EVOL?">
            G'EVOLs will be listed at 0.1 ETH per mint
          </Accordion>
          <Accordion title="What's It Like Inside Jupiter?">
            888 G'EVOLS will be created and minted. 50 Mints will be reserved from the sale. These will be held for competitions and the team's memberships.
          </Accordion>
          <Accordion title="Do I won the IP to the G'EVOLs I mint?">
            No! Absolutely not! Just because apes did it doesn’t mean it applies to everything. This project is the life work of KidEight and all EVOLs IP and storyline stay in his complete control.
            Tribute art of the EVOLs you own is fine, please don’t take the piss.
            By purchasing an EVOL you are effectively a part of the EVOL story and timeline, buckle in.
          </Accordion>
          <Accordion title="I'm worried about all the attention I'll get with my new G'EVOL mint!">
            Get Used to it
          </Accordion>
        </Container>
      </div>
      {/*Footer*/}
      <div  className="footer container-fluid text-center text-md-left">
        <Container>
          <div className="d-flex justify-content-between">
            <img src="/images/logo.svg" alt="" style={{width: "115px"}}/>
            <ul className="d-flex list-unstyled">
              <li><a href="#dicord">Discord</a></li>
              <li><a href="#mint">Mint</a></li>
              <li><a href="#roadmap">Roadmap</a></li>
              <li><a href="#faq">Faq</a></li>
            </ul>
            <Button size="lg" onClick={handleShow}>MINT</Button>
          </div>
          <hr />
          <div className="d-flex justify-content-between">
            <div>
              © Copyright 2021 G'Evols
            </div>
            <ul class="d-flex list-unstyled">
              <li>
                <a href="https://t.co/q9DCKK06lL" target="_blank" title="Discord">
                  <FontAwesomeIcon icon={["fab", "discord"]} />
                </a>
              </li>
              <li>
                <a href="https://twitter.com/gevolsNFT" target="_blank" title="Twitter">
                  <FontAwesomeIcon icon={["fab", "twitter"]} />
                </a>
              </li>
            </ul>
          </div>
        </Container>
      </div>
      {/* Modal */}
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Mint a Metabaes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <img src="/images/sample.png" alt="" style={{maxWidth: "320px"}} />
          <div className="mint-number">
            <button type="button" onClick={decreaseTokenNumber}><span aria-hidden="true">-</span></button>
            <Form>
              <Form.Label>
                { tokenNumber }
              </Form.Label>
            </Form>
            <button type="button" onClick={() => setTokenNumber(tokenNumber + 1)}><span aria-hidden="true">+</span></button>
          </div>
          <div>
            Total minted so far: { totalSupply } / { maxTokenNumber }
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => mint(tokenNumber)}>
            Mint
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;
