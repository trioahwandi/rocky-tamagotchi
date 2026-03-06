export const CONTRACT_ADDRESS = "0x948466f9c37a9A5c4e08f89c02DD9B3321dfB53D";

export const CONTRACT_ABI = [
  "function createRocky() public",
  "function feed() public",
  "function train() public",
  "function resonate() public",
  "function stabilize() public",
  "function revive() public",
  "function checkIn() public",
  "function rockies(address) public view returns (uint, uint, uint, uint, uint, uint, uint, uint, uint, bool, bool)",
  "function getLeaderboard() public view returns (tuple(address player, uint256 level, uint256 xp, uint256 resonance)[])",
  "function getTotalPlayers() public view returns (uint)"
];

export const NETWORK = {
  chainId: "0x1404",
  chainName: "Seismic Testnet",
  rpcUrls: ["https://gcp-2.seismictest.net/rpc"],
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  blockExplorerUrls: ["https://seismic-testnet.socialscan.io/"]
};