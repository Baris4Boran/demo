import fs from "fs"
import chalk from "chalk"
import { Command } from "commander";
const program = new Command();

const poolFile = './pool.json';
const userFile = './user.json';

function readData(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Constant product formula: (x + dx)(y - dy) = K
function calculateSwap(tokenIn, tokenOut, amount) {
  const tokensOut = (amount * tokenOut) / (tokenIn + amount);
  return tokensOut;
}

function calculatePriceImpact(tokenIn, tokenOut, amount) {
  const spotPrice = tokenOut / tokenIn;
  const tokensOut = calculateSwap(tokenIn, tokenOut, amount);
  const executionPrice = tokensOut / amount;
  const impact = ((spotPrice - executionPrice) / spotPrice) * 100;
  return { tokensOut, impact };
}

program
  .name('uniswap-v2-sim')
  .description('Uniswap V2 AMM Simulator — constant product market maker (x*y=K)')
  .version('1.0.0');

// ── add-liquidity ─────────────────────────────────────────────────────────────
program
  .command('add-liquidity <amountA> <amountB>')
  .description('Add liquidity to the pool')
  .action((amountA, amountB) => {
    const pool = readData(poolFile);
    const user = readData(userFile);

    const a = parseFloat(amountA);
    const b = parseFloat(amountB);

    if (user.tokenA < a || user.tokenB < b) {
      console.log(chalk.red('Insufficient balance.'));
      return;
    }

    pool.tokenA += a;
    pool.tokenB += b;
    pool.K = pool.tokenA * pool.tokenB;

    user.tokenA -= a;
    user.tokenB -= b;

    writeData(poolFile, pool);
    writeData(userFile, user);

    console.log(chalk.green(`✓ Liquidity added: ${a} TokenA + ${b} TokenB`));
    console.log(chalk.blue(`  Pool: ${pool.tokenA} A | ${pool.tokenB} B | K = ${pool.K}`));
  });

// ── remove-liquidity ──────────────────────────────────────────────────────────
program
  .command('remove-liquidity <amountA> <amountB>')
  .description('Remove liquidity from the pool')
  .action((amountA, amountB) => {
    const pool = readData(poolFile);
    const user = readData(userFile);

    const a = parseFloat(amountA);
    const b = parseFloat(amountB);

    if (pool.tokenA < a || pool.tokenB < b) {
      console.log(chalk.red('Not enough liquidity in pool.'));
      return;
    }

    pool.tokenA -= a;
    pool.tokenB -= b;
    pool.K = pool.tokenA * pool.tokenB;

    user.tokenA += a;
    user.tokenB += b;

    writeData(poolFile, pool);
    writeData(userFile, user);

    console.log(chalk.green(`✓ Liquidity removed: ${a} TokenA + ${b} TokenB`));
    console.log(chalk.blue(`  Pool: ${pool.tokenA} A | ${pool.tokenB} B | K = ${pool.K}`));
  });

// ── swap ──────────────────────────────────────────────────────────────────────
program
  .command('swap <fromToken> <amount>')
  .description('Swap tokens (fromToken: A or B)')
  .action((fromToken, amount) => {
    const pool = readData(poolFile);
    const user = readData(userFile);

    const tokenIn  = fromToken.toUpperCase() === 'A' ? 'tokenA' : 'tokenB';
    const tokenOut = fromToken.toUpperCase() === 'A' ? 'tokenB' : 'tokenA';

    const a = parseFloat(amount);

    if (user[tokenIn] < a) {
      console.log(chalk.red('Insufficient user balance.'));
      return;
    }

    const { tokensOut, impact } = calculatePriceImpact(pool[tokenIn], pool[tokenOut], a);

    if (tokensOut <= 0) {
      console.log(chalk.red('Swap not possible.'));
      return;
    }

    // Slippage warning
    if (impact > 5) {
      console.log(chalk.yellow(`⚠ High price impact: ${impact.toFixed(2)}%`));
    }

    pool[tokenIn]  += a;
    pool[tokenOut] -= tokensOut;
    pool.K = pool.tokenA * pool.tokenB;

    user[tokenIn]  -= a;
    user[tokenOut] += tokensOut;

    writeData(poolFile, pool);
    writeData(userFile, user);

    console.log(chalk.green(`✓ Swapped ${a} ${tokenIn} → ${tokensOut.toFixed(4)} ${tokenOut}`));
    console.log(chalk.gray(`  Price impact: ${impact.toFixed(2)}%`));
  });

// ── price ─────────────────────────────────────────────────────────────────────
program
  .command('price <fromToken> <amount>')
  .description('Check swap price without executing')
  .action((fromToken, amount) => {
    const pool = readData(poolFile);

    const tokenIn  = fromToken.toUpperCase() === 'A' ? 'tokenA' : 'tokenB';
    const tokenOut = fromToken.toUpperCase() === 'A' ? 'tokenB' : 'tokenA';

    const a = parseFloat(amount);
    const { tokensOut, impact } = calculatePriceImpact(pool[tokenIn], pool[tokenOut], a);

    console.log(chalk.blue(`  ${a} ${tokenIn} → ${tokensOut.toFixed(4)} ${tokenOut}`));
    console.log(chalk.gray(`  Price impact: ${impact.toFixed(2)}%`));
    if (impact > 5) console.log(chalk.yellow(`  ⚠ High slippage warning`));
  });

// ── view-pool ─────────────────────────────────────────────────────────────────
program
  .command('view-pool')
  .description('Display current pool state')
  .action(() => {
    const pool = readData(poolFile);
    console.log(chalk.blue('Pool State:'));
    console.log(`  TokenA : ${pool.tokenA}`);
    console.log(`  TokenB : ${pool.tokenB}`);
    console.log(`  K      : ${pool.K}`);
    console.log(`  Price  : 1 A = ${(pool.tokenB / pool.tokenA).toFixed(4)} B`);
  });

// ── view-balance ──────────────────────────────────────────────────────────────
program
  .command('view-balance')
  .description('Display user balance')
  .action(() => {
    const user = readData(userFile);
    console.log(chalk.yellow('User Balance:'));
    console.log(`  TokenA : ${user.tokenA}`);
    console.log(`  TokenB : ${user.tokenB}`);
  });

// ── reset ─────────────────────────────────────────────────────────────────────
program
  .command('reset')
  .description('Reset pool and user balance to defaults')
  .action(() => {
    writeData(poolFile, { tokenA: 1000, tokenB: 1000, K: 1000000 });
    writeData(userFile, { tokenA: 500, tokenB: 500 });
    console.log(chalk.green('✓ Pool and balances reset to defaults.'));
  });

program.parse(process.argv);
