// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PeaBots is ERC721Enumerable, Ownable, ERC721Burnable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdTracker;

    uint256 public constant MAX_ELEMENTS = 10000;
    uint256 public constant PRICE = 8 * 10**16;
    uint256 public constant MAX_BY_MINT = 5;
    uint256 constant public MAX_MINT_WHITELIST = 20;
    uint256 constant public REVEAL_TIMESTAMP = 0;
    uint256 constant public MAX_CLAIM = 25;

    string public baseTokenURI;
    bool private _pause;
    uint256 public startingIndex;
    uint256 public startingIndexBlock;

    struct Whitelist {
        address addr;
        uint claimAmount;
        uint hasMinted;
    }
    mapping(address => Whitelist) public whitelist;
    
    address[] whitelistAddr;
    address payable claimEthAddress = payable(0x2B12055415cCD0478dEf607F792666c2ec4a892b);

    bool public saleIsActive = false;
    bool public privateSaleIsActive = true;

    constructor(string memory baseURI, address[] memory addrs, uint[] memory claimAmounts) ERC721("PeaBots", "PEABOT") {
        whitelistAddr = addrs;
        for(uint i = 0; i < whitelistAddr.length; i++) {
            addAddressToWhitelist(whitelistAddr[i], claimAmounts[i]);
        }
        setBaseURI(baseURI);
        pause(true);
    }

    modifier saleIsOpen {
        require(_totalSupply() <= MAX_ELEMENTS, "Sale end");
        if (_msgSender() != owner()) {
            require(!_pause, "Pausable: paused");
        }
        _;
    }
    function _totalSupply() internal view returns (uint) {
        return _tokenIdTracker.current();
    }
    function totalMint() public view returns (uint256) {
        return _totalSupply();
    }
    function mint(address _to, uint256 _count) public payable saleIsOpen {
        uint256 total = _totalSupply();
        require(saleIsActive, "Sale must be active to mint");
        require(total + _count <= MAX_ELEMENTS, "Max limit");
        require(total <= MAX_ELEMENTS, "Sale end");
        require(_count <= MAX_BY_MINT, "Exceeds number");
        require(msg.value >= price(_count), "Value below price");

        if(privateSaleIsActive) {
            require(_count <= MAX_MINT_WHITELIST, "Above max tx count");
            require(isWhitelisted(msg.sender), "Is not whitelisted");
            require(whitelist[msg.sender].hasMinted.add(_count) <= MAX_MINT_WHITELIST, "Can only mint 20 while whitelisted");
            require(whitelist[msg.sender].hasMinted <= MAX_MINT_WHITELIST, "Can only mint 20 while whitelisted");
            whitelist[msg.sender].hasMinted = whitelist[msg.sender].hasMinted.add(_count);
        } else {
            require(_count <= MAX_BY_MINT, "Above max tx count");
        }

        for (uint256 i = 0; i < _count; i++) {
            _mintAnElement(_to);
        }

        // If we haven't set the starting index and this is either
        // 1) the last saleable token or
        // 2) the first token to be sold after the end of pre-sale, set the starting index block
        if (startingIndexBlock == 0 && (totalSupply() == MAX_ELEMENTS || block.timestamp >= REVEAL_TIMESTAMP)) {
            startingIndexBlock = block.number;
        }
    }

    function claimFreeMints(address _to, uint _count) public {
        // require(isWhitelisted(msg.sender), "Is not whitelisted");
        require(_count <= MAX_CLAIM, "Above max tx count");
        require(saleIsActive, "Sale must be active to mint");
        require(totalSupply().add(_count) <= MAX_ELEMENTS, "Exceeds max supply");
        require(whitelist[msg.sender].claimAmount > 0, "You have no amount to claim");
        require(_count <= whitelist[msg.sender].claimAmount, "You have no amount to claim");

        for(uint i = 0; i < _count; i++) {
            _mintAnElement(_to);
        }
        whitelist[msg.sender].claimAmount = whitelist[msg.sender].claimAmount.sub(_count);
        
        // If we haven't set the starting index and this is either
        // 1) the last saleable token or
        // 2) the first token to be sold after the end of pre-sale, set the starting index block
        if (startingIndexBlock == 0 && (totalSupply() == MAX_ELEMENTS || block.timestamp >= REVEAL_TIMESTAMP)) {
            startingIndexBlock = block.number;
        }
    }

    /**
    * Set the starting index for the collection
    */
    function setStartingIndex() public onlyOwner {
        require(startingIndex == 0, "Starting index is already set");
        require(startingIndexBlock != 0, "Starting index block must be set");
        startingIndex = uint(blockhash(startingIndexBlock)) % MAX_ELEMENTS;
        // Just a sanity case in the worst case if this function is called late (EVM only stores last 256 block hashes)
        if (block.number.sub(startingIndexBlock) > 255) {
            startingIndex = uint(blockhash(block.number - 1)) % MAX_ELEMENTS;
        }
    }

    function claimETH() public {
        require(claimEthAddress == _msgSender(), "Ownable: caller is not the claimEthAddress");
        payable(address(claimEthAddress)).transfer(address(this).balance);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (startingIndex == 0) {
            return super.tokenURI(0);
        }
        uint256 moddedId = (tokenId + startingIndex) % MAX_ELEMENTS;
        return super.tokenURI(moddedId);
    }

    function _mintAnElement(address _to) private {
        uint id = _totalSupply();
        _tokenIdTracker.increment();
        _safeMint(_to, id + 1);
    }
    function price(uint256 _count) public pure returns (uint256) {
        return PRICE.mul(_count);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        baseTokenURI = baseURI;
    }

    function flipSaleState() public onlyOwner {
        saleIsActive = !saleIsActive;
    }

    function flipPrivateSaleState() public onlyOwner {
        privateSaleIsActive = !privateSaleIsActive;
    }

    function walletOfOwner(address _owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(_owner);

        uint256[] memory tokensId = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }

        return tokensId;
    }

    function pause(bool val) public onlyOwner {
        _pause = val;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function reserve(uint256 _count) public onlyOwner {
        uint256 total = _totalSupply();
        require(total + _count <= 100, "Exceeded");
        for (uint256 i = 0; i < _count; i++) {
            _mintAnElement(_msgSender());
        }
    }
    
    function addAddressToWhitelist(address addr, uint claimAmount) onlyOwner public returns(bool success) {
        require(!isWhitelisted(addr), "Already whitelisted");
        whitelist[addr].addr = addr;
        whitelist[addr].claimAmount = claimAmount;
        whitelist[addr].hasMinted = 0;
        success = true;
    }

    function isWhitelisted(address addr) public view returns (bool isWhiteListed) {
        return whitelist[addr].addr == addr;
    }
}