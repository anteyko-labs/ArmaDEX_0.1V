import { ethers } from 'ethers';

// Адреса контрактов
const CONTRACT_ADDRESSES = {
  USDT_TOKEN: '0x434897c0Be49cd3f8d9bed1e9C56F8016afd2Ee6',
  BTC_TOKEN: '0xC941593909348e941420D5404Ab00b5363b1dDB4',
  ETH_TOKEN: '0x13E5f0d98D1dA90931A481fe0CE9eDAb24bA2Ecb'
};

// ABI для токенов
const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

/**
 * @title SimulatedTradingService
 * @dev Сервис для симуляции торговли (обход ошибок DEX контракта)
 * Использует прямые переводы токенов вместо DEX свапов
 */
class SimulatedTradingService {
  public provider: ethers.providers.Provider | null = null;
  public signer: ethers.Signer | null = null;
  public usdtToken: ethers.Contract | null = null;
  public btcToken: ethers.Contract | null = null;
  public ethToken: ethers.Contract | null = null;

  async initialize(provider: ethers.providers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    
    // Инициализируем токены
    this.usdtToken = new ethers.Contract(CONTRACT_ADDRESSES.USDT_TOKEN, TOKEN_ABI, signer);
    this.btcToken = new ethers.Contract(CONTRACT_ADDRESSES.BTC_TOKEN, TOKEN_ABI, signer);
    this.ethToken = new ethers.Contract(CONTRACT_ADDRESSES.ETH_TOKEN, TOKEN_ABI, signer);
    
    console.log('✅ Simulated trading service initialized');
    
    // Автоматически выдаем USDT при инициализации
    const userAddress = await signer.getAddress();
    await this.grantInitialUSDT(userAddress);
  }

  /**
   * @dev Получить реальные балансы пользователя
   */
  async getRealBalances(userAddress: string) {
    if (!this.usdtToken || !this.btcToken || !this.ethToken) {
      console.log('⚠️ Simulated service not initialized, attempting to initialize...');
      if (this.provider && this.signer) {
        await this.initialize(this.provider, this.signer);
      } else {
        throw new Error('Service not initialized and no provider/signer available');
      }
    }

    try {
      console.log('🔄 Getting real balances for:', userAddress);
      // Получаем баланс USDT
      const usdtBalance = await this.usdtToken.balanceOf(userAddress);
      const usdtBalanceFormatted = parseFloat(ethers.utils.formatUnits(usdtBalance, 6));
      console.log('💰 USDT Balance:', usdtBalanceFormatted, 'Raw:', usdtBalance.toString());

      // Получаем баланс BTC
      const btcBalance = await this.btcToken.balanceOf(userAddress);
      const btcBalanceFormatted = parseFloat(ethers.utils.formatUnits(btcBalance, 8));
      console.log('💰 BTC Balance:', btcBalanceFormatted, 'Raw:', btcBalance.toString());

      // Получаем баланс ETH
      const ethBalance = await this.ethToken.balanceOf(userAddress);
      const ethBalanceFormatted = parseFloat(ethers.utils.formatUnits(ethBalance, 18));
      console.log('💰 ETH Balance:', ethBalanceFormatted, 'Raw:', ethBalance.toString());

      return [
        {
          symbol: 'USDT',
          balance: usdtBalanceFormatted,
          decimals: 6,
          address: CONTRACT_ADDRESSES.USDT_TOKEN,
          name: 'ArmaDEX USDT',
          valueUSD: usdtBalanceFormatted
        },
        {
          symbol: 'BTC',
          balance: btcBalanceFormatted,
          decimals: 8,
          address: CONTRACT_ADDRESSES.BTC_TOKEN,
          name: 'ArmaDEX BTC',
          valueUSD: btcBalanceFormatted * 110000 // Примерная цена BTC
        },
        {
          symbol: 'ETH',
          balance: ethBalanceFormatted,
          decimals: 18,
          address: CONTRACT_ADDRESSES.ETH_TOKEN,
          name: 'ArmaDEX ETH',
          valueUSD: ethBalanceFormatted * 3000 // Примерная цена ETH
        }
      ];
    } catch (error) {
      console.error('Error getting real balances:', error);
      return [];
    }
  }

  /**
   * @dev Симуляция торговли через прямые переводы токенов
   */
  async executeSimulatedTrade(
    userAddress: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: number,
    minAmountOut: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.signer) {
      throw new Error('Service not initialized');
    }

    try {
      const tokenInAddress = this.getTokenAddress(tokenIn);
      const tokenOutAddress = this.getTokenAddress(tokenOut);

      // Получаем контракты токенов
      const tokenInContract = new ethers.Contract(tokenInAddress, TOKEN_ABI, this.signer);
      const tokenOutContract = new ethers.Contract(tokenOutAddress, TOKEN_ABI, this.signer);

      // Рассчитываем количество токенов для обмена
      const exchangeRate = this.getExchangeRate(tokenIn, tokenOut);
      const amountOut = amountIn * exchangeRate;

      // Проверяем, что у пользователя достаточно токенов
      const userBalance = await tokenInContract.balanceOf(userAddress);
      const requiredAmount = ethers.utils.parseUnits(amountIn.toString(), this.getTokenDecimals(tokenIn));

      if (userBalance.lt(requiredAmount)) {
        return {
          success: false,
          error: `Insufficient ${tokenIn} balance`
        };
      }

      // Симулируем торговлю через прямые переводы
      // 1. Сжигаем входящие токены (переводим на нулевой адрес)
      const burnTx = await tokenInContract.transfer(
        '0x000000000000000000000000000000000000dEaD',
        requiredAmount
      );
      await burnTx.wait();

      // 2. Минтим исходящие токены пользователю
      const mintAmount = ethers.utils.parseUnits(amountOut.toString(), this.getTokenDecimals(tokenOut));
      
      // Для симуляции используем transfer от владельца контракта
      // (в реальности это должен быть mint, но для демо используем transfer)
      const ownerAddress = await this.signer.getAddress();
      const ownerBalance = await tokenOutContract.balanceOf(ownerAddress);
      
      if (ownerBalance.gte(mintAmount)) {
        const transferTx = await tokenOutContract.transfer(userAddress, mintAmount);
        await transferTx.wait();
        
        return {
          success: true,
          txHash: transferTx.hash
        };
      } else {
        return {
          success: false,
          error: 'Insufficient liquidity in the system'
        };
      }

    } catch (error) {
      console.error('Error executing simulated trade:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * @dev Получить адрес токена по символу
   */
  getTokenAddress(symbol: string): string {
    switch (symbol) {
      case 'USDT': return CONTRACT_ADDRESSES.USDT_TOKEN;
      case 'BTC': return CONTRACT_ADDRESSES.BTC_TOKEN;
      case 'ETH': return CONTRACT_ADDRESSES.ETH_TOKEN;
      default: throw new Error(`Unknown token symbol: ${symbol}`);
    }
  }

  /**
   * @dev Получить десятичные знаки токена по символу
   */
  getTokenDecimals(symbol: string): number {
    switch (symbol) {
      case 'USDT': return 6;
      case 'BTC': return 8;
      case 'ETH': return 18;
      default: return 18;
    }
  }

  /**
   * @dev Получить курс обмена между токенами
   */
  getExchangeRate(tokenIn: string, tokenOut: string): number {
    // Простые курсы для демонстрации
    if (tokenIn === 'USDT' && tokenOut === 'BTC') {
      return 1 / 110000; // 1 USDT = 0.000009 BTC
    }
    if (tokenIn === 'BTC' && tokenOut === 'USDT') {
      return 110000; // 1 BTC = 110,000 USDT
    }
    if (tokenIn === 'USDT' && tokenOut === 'ETH') {
      return 1 / 3000; // 1 USDT = 0.00033 ETH
    }
    if (tokenIn === 'ETH' && tokenOut === 'USDT') {
      return 3000; // 1 ETH = 3,000 USDT
    }
    if (tokenIn === 'BTC' && tokenOut === 'ETH') {
      return 110000 / 3000; // 1 BTC = 36.67 ETH
    }
    if (tokenIn === 'ETH' && tokenOut === 'BTC') {
      return 3000 / 110000; // 1 ETH = 0.027 BTC
    }
    
    return 1; // По умолчанию 1:1
  }

  /**
   * @dev Выдать начальный USDT пользователю
   */
  async grantInitialUSDT(userAddress: string) {
    if (!this.usdtToken || !this.signer) {
      throw new Error('Service not initialized');
    }

    try {
      // Проверяем, есть ли уже баланс
      const balance = await this.usdtToken.balanceOf(userAddress);
      if (balance.gt(0)) {
        console.log('✅ User already has USDT balance');
        return;
      }

      // Создаем новый контракт от имени владельца
      const ownerPrivateKey = process.env.PRIVATE_KEY;
      if (!ownerPrivateKey) {
        throw new Error('PRIVATE_KEY not found in environment');
      }

      const ownerWallet = new ethers.Wallet(ownerPrivateKey, this.provider);
      const ownerUsdtContract = new ethers.Contract(
        CONTRACT_ADDRESSES.USDT_TOKEN,
        [
          "function transfer(address to, uint256 amount) returns (bool)",
          "function balanceOf(address account) view returns (uint256)"
        ],
        ownerWallet
      );

      // Проверяем баланс владельца
      const ownerBalance = await ownerUsdtContract.balanceOf(await ownerWallet.getAddress());
      const amount = ethers.utils.parseUnits('10000', 6); // 10,000 USDT
      
      if (ownerBalance.lt(amount)) {
        throw new Error(`Owner has insufficient USDT balance. Has: ${ethers.utils.formatUnits(ownerBalance, 6)}, Needs: ${ethers.utils.formatUnits(amount, 6)}`);
      }

      console.log(`🚀 Transferring 10,000 USDT from owner to ${userAddress}...`);
      
      const tx = await ownerUsdtContract.transfer(userAddress, amount);
      console.log(`⏳ Transaction hash: ${tx.hash}`);
      
      await tx.wait();
      console.log('✅ 10,000 USDT successfully transferred to user:', userAddress);
      
    } catch (error) {
      console.error('❌ Error granting initial USDT:', error);
      // Не выбрасываем ошибку, чтобы не блокировать работу
      console.log('⚠️ Continuing without initial USDT grant...');
    }
  }

  /**
   * @dev Получить общую стоимость портфолио
   */
  async getTotalPortfolioValue(userAddress: string): Promise<number> {
    try {
      const balances = await this.getRealBalances(userAddress);
      return balances.reduce((total, token) => total + token.valueUSD, 0);
    } catch (error) {
      console.error('Error getting total portfolio value:', error);
      return 0;
    }
  }
}

export const simulatedTradingService = new SimulatedTradingService();
