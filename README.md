# Crumb Finance
Dollar cost averaging protocol that allows any Sui coins to be swapped on a recurring basis.

Users can create positions by depositing a coin and specifying what currency they want to swap to, trade amount per swap, and the frequency. The initial implementation uses a whitelisted set of assets and relies on keepers to provide the spot asset in exchange, following an oracle price. This can easily be modified to support difference price feeds.

## Development
### Build contracts
```
sui move build
```

### Test
```
sui move test
```
