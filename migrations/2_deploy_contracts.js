const PeaBots = artifacts.require('./PeaBots.sol')

module.exports = async (deployer, network, addresses) => {
  deployer.deploy(PeaBots, 'https://opensea-creatures-api.herokuapp.com/api/creature/')
}
