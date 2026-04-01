# Uniswap V2 AMM Simulator

A command-line simulation of a Uniswap V2-style Automated Market Maker (AMM), built with Node.js.

Implements the **constant product formula**: `x * y = K`

---

## How It Works

In a Uniswap V2 pool, two tokens (A and B) are held in reserve. Every swap must satisfy:

```
(tokenA + dx) * (tokenB - dy) = K
```

Where `dx` is the amount swapped in and `dy` is the amount received. This ensures the product `K` remains constant, which naturally adjusts the price based on supply and demand.

---

## Setup

```bash
npm install
```

---

## Commands

```bash
# Check swap price without executing
node deneme.js price <A|B> <amount>

# Execute a swap
node deneme.js swap <A|B> <amount>

# Add liquidity to the pool
node deneme.js add-liquidity <amountA> <amountB>

# Remove liquidity from the pool
node deneme.js remove-liquidity <amountA> <amountB>

# View current pool state
node deneme.js view-pool

# View user balance
node deneme.js view-balance

# Reset pool and balances to defaults
node deneme.js reset
```

---

## Example

```bash
$ node deneme.js view-pool
Pool State:
  TokenA : 1000
  TokenB : 1000
  K      : 1000000
  Price  : 1 A = 1.0000 B

$ node deneme.js price A 100
  100 tokenA → 90.9091 tokenB
  Price impact: 9.09%
  ⚠ High slippage warning

$ node deneme.js swap A 50
✓ Swapped 50 tokenA → 47.6190 tokenB
  Price impact: 4.76%
```

---

## Stack

- Node.js
- [commander](https://github.com/tj/commander.js) — CLI framework
- [chalk](https://github.com/chalk/chalk) — terminal colours
