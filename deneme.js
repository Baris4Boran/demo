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
function calculateSwap(tokenA, tokenB, amount) {
    //(x + dx) * (y - dy) = K
    const newTokenB = tokenB - (amount * tokenB) / (tokenA + amount);
    const tokensOut = tokenB - newTokenB;
    return tokensOut;
  }

  program
  .name('Uniswap V2 Simulator')
  .description('Basit bir DEX simülasyonu')
  .version('1.0.0');

program
  .command('add-liquidity <amountA> <amountB>')
  .description('Havuza likidite ekle')
  .action((amountA, amountB) => {
    const pool = readData(poolFile);
    pool.tokenA += parseFloat(amountA);
    pool.tokenB += parseFloat(amountB);
    pool.K = pool.tokenA * pool.tokenB;
    writeData(poolFile, pool);
    console.log(chalk.green('Likidite başarıyla eklendi.'));
  });

program
  .command('swap <fromToken> <amount>')
  .description('Token takası yap')
  .action((fromToken, amount) => {
    const pool = readData(poolFile);
    const user = readData(userFile);
    const tokenA = fromToken === 'A' ? 'tokenA' : 'tokenB';
    const tokenB = fromToken === 'A' ? 'tokenB' : 'tokenA';

    const tokensOut = calculateSwap(pool[tokenA], pool[tokenB], parseFloat(amount));
    if (tokensOut <= 0) {
      console.log(chalk.red('Takas mümkün değil.'));
      return;
    }

    pool[tokenA] += parseFloat(amount);
    pool[tokenB] -= tokensOut;
    user[tokenA] -= parseFloat(amount);
    user[tokenB] += tokensOut;

    writeData(poolFile, pool);
    writeData(userFile, user);

    console.log(chalk.green(`Takas başarılı. ${tokensOut} ${tokenB} alındı.`));
  });

program
  .command('view-pool')
  .description('Havuz durumunu görüntüle')
  .action(() => {
    const pool = readData(poolFile);
    console.log(chalk.blue(JSON.stringify(pool, null, 2)));
  });

program
  .command('view-balance')
  .description('Kullanıcı bakiyesini görüntüle')
  .action(() => {
    const user = readData(userFile);
    console.log(chalk.yellow(JSON.stringify(user, null, 2)));
  });

program.parse(process.argv);