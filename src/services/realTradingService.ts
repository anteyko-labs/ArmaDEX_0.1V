import { ethers } from 'ethers';

export interface RealTradeResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
}

export interface RealOrder {
  id: string;
  user: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  timestamp: number;
  status: 'pending' | 'filled' | 'cancelled';
}

class RealTradingService {
  private provider: ethers.providers.JsonRpcProvider;
  private signer?: ethers.Signer;
  private dexContract?: ethers.Contract;
  private tokenRegistry?: ethers.Contract;
  
  // РЕАЛЬНЫЕ адреса контрактов (из deployed_addresses.json)
  private readonly DEX_ADDRESS = '0xCcA67eB690872566C1260F4777BfE7C79ff4047d'; // UNIVERSAL_DEX
  private readonly TOKEN_REGISTRY_ADDRESS = '0x0557CF561B428bCf9cDD8b49044E330Ae8BBDa34'; // TOKEN_REGISTRY
  
  // РЕАЛЬНЫЕ адреса токенов
  private readonly USDT_ADDRESS = '0x434897c0Be49cd3f8d9bed1e9C56F8016afd2Ee6';
  private readonly BTC_ADDRESS = '0xC941593909348e941420D5404Ab00b5363b1dDB4';
  private readonly ETH_ADDRESS = '0x13E5f0d98D1dA90931A481fe0CE9eDAb24bA2Ecb';
  
  // Кошелек для комиссий
  private readonly FEE_WALLET_ADDRESS = '0xB468B3837e185B59594A100c1583a98C79b524F3';
  private readonly FEE_WALLET_PRIVATE_KEY = 'cbd0632c261aa3c4724616833151488df591ee1372c9982cac661ad773d8f42c';
  
  // ABI контрактов (упрощенные)
  private readonly DEX_ABI = [
    "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (bool)",
    "function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256)",
    "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external",
    "function getReserves(address tokenA, address tokenB) external view returns (uint256, uint256)"
  ];
  
  private readonly TOKEN_REGISTRY_ABI = [
    "function getTokenAddress(string memory symbol) external view returns (address)",
    "function registerToken(address tokenAddress, string memory name, string memory symbol) external"
  ];

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
  }

  async initialize(provider: ethers.providers.Web3Provider, signer: ethers.Signer): Promise<void> {
    this.provider = provider;
    this.signer = signer;
    
    if (this.DEX_ADDRESS && this.DEX_ADDRESS !== '0x...') {
      this.dexContract = new ethers.Contract(this.DEX_ADDRESS, this.DEX_ABI, signer);
    }
    
    if (this.TOKEN_REGISTRY_ADDRESS && this.TOKEN_REGISTRY_ADDRESS !== '0x...') {
      this.tokenRegistry = new ethers.Contract(this.TOKEN_REGISTRY_ADDRESS, this.TOKEN_REGISTRY_ABI, signer);
    }
    
    console.log('🔗 RealTradingService инициализирован');
  }

  // РЕАЛЬНАЯ ПОКУПКА ТОКЕНА
  async buyToken(tokenSymbol: string, usdtAmount: string): Promise<RealTradeResult> {
    if (!this.signer || !this.dexContract) {
      return { success: false, error: 'Сервис не инициализирован' };
    }

    try {
      console.log(`💰 Покупка ${tokenSymbol} за ${usdtAmount} USDT...`);
      
      // 1. Получаем адрес токена из реестра
      const tokenAddress = await this.getTokenAddress(tokenSymbol);
      if (!tokenAddress) {
        return { success: false, error: `Токен ${tokenSymbol} не найден` };
      }

      // 2. Получаем адрес USDT
      const usdtAddress = await this.getTokenAddress('USDT');
      if (!usdtAddress) {
        return { success: false, error: 'USDT не найден' };
      }

      // 3. Проверяем баланс USDT у пользователя
      const usdtContract = new ethers.Contract(usdtAddress, [
        "function balanceOf(address owner) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
      ], this.signer);

      const userAddress = await this.signer.getAddress();
      const usdtBalance = await usdtContract.balanceOf(userAddress);
      const amountIn = ethers.utils.parseUnits(usdtAmount, 6); // USDT имеет 6 decimals

      if (usdtBalance.lt(amountIn)) {
        return { success: false, error: 'Недостаточно USDT' };
      }

      // 4. Получаем ожидаемое количество токенов
      const amountOut = await this.dexContract.getAmountOut(usdtAddress, tokenAddress, amountIn);
      const minAmountOut = amountOut.mul(95).div(100); // 5% slippage

      // 5. Одобряем трату USDT
      const approveTx = await usdtContract.approve(this.DEX_ADDRESS, amountIn);
      await approveTx.wait();

      // 6. Выполняем свап
      const swapTx = await this.dexContract.swap(
        usdtAddress,
        tokenAddress, 
        amountIn,
        minAmountOut,
        { gasLimit: 300000 }
      );

      const receipt = await swapTx.wait();
      
      console.log(`✅ Покупка успешна! TX: ${swapTx.hash}`);
      
      return {
        success: true,
        txHash: swapTx.hash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error: any) {
      console.error('❌ Ошибка покупки:', error);
      return {
        success: false,
        error: error.message || 'Неизвестная ошибка'
      };
    }
  }

  // РЕАЛЬНАЯ ПРОДАЖА ТОКЕНА
  async sellToken(tokenSymbol: string, tokenAmount: string): Promise<RealTradeResult> {
    if (!this.signer || !this.dexContract) {
      return { success: false, error: 'Сервис не инициализирован' };
    }

    try {
      console.log(`💸 Продажа ${tokenAmount} ${tokenSymbol}...`);
      
      // 1. Получаем адреса токенов
      const tokenAddress = await this.getTokenAddress(tokenSymbol);
      const usdtAddress = await this.getTokenAddress('USDT');
      
      if (!tokenAddress || !usdtAddress) {
        return { success: false, error: 'Токены не найдены' };
      }

      // 2. Проверяем баланс токена
      const tokenContract = new ethers.Contract(tokenAddress, [
        "function balanceOf(address owner) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
      ], this.signer);

      const userAddress = await this.signer.getAddress();
      const tokenBalance = await tokenContract.balanceOf(userAddress);
      const amountIn = ethers.utils.parseUnits(tokenAmount, 18); // Предполагаем 18 decimals

      if (tokenBalance.lt(amountIn)) {
        return { success: false, error: `Недостаточно ${tokenSymbol}` };
      }

      // 3. Получаем ожидаемое количество USDT
      const amountOut = await this.dexContract.getAmountOut(tokenAddress, usdtAddress, amountIn);
      const minAmountOut = amountOut.mul(95).div(100); // 5% slippage

      // 4. Одобряем трату токена
      const approveTx = await tokenContract.approve(this.DEX_ADDRESS, amountIn);
      await approveTx.wait();

      // 5. Выполняем свап
      const swapTx = await this.dexContract.swap(
        tokenAddress,
        usdtAddress,
        amountIn, 
        minAmountOut,
        { gasLimit: 300000 }
      );

      const receipt = await swapTx.wait();
      
      console.log(`✅ Продажа успешна! TX: ${swapTx.hash}`);
      
      return {
        success: true,
        txHash: swapTx.hash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error: any) {
      console.error('❌ Ошибка продажи:', error);
      return {
        success: false,
        error: error.message || 'Неизвестная ошибка'
      };
    }
  }

  // Получить адрес токена
  private async getTokenAddress(symbol: string): Promise<string | null> {
    if (!this.tokenRegistry) return null;
    
    try {
      return await this.tokenRegistry.getTokenAddress(symbol);
    } catch (error) {
      console.error(`Ошибка получения адреса токена ${symbol}:`, error);
      return null;
    }
  }

  // Получить баланс токена
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ], this.provider);

      const balance = await tokenContract.balanceOf(userAddress);
      const decimals = await tokenContract.decimals();
      
      return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Ошибка получения баланса:', error);
      return '0';
    }
  }

  // Получить цену токена
  async getTokenPrice(tokenSymbol: string, usdtAmount: string): Promise<string> {
    if (!this.dexContract) return '0';
    
    try {
      const tokenAddress = await this.getTokenAddress(tokenSymbol);
      const usdtAddress = await this.getTokenAddress('USDT');
      
      if (!tokenAddress || !usdtAddress) return '0';
      
      const amountIn = ethers.utils.parseUnits(usdtAmount, 6);
      const amountOut = await this.dexContract.getAmountOut(usdtAddress, tokenAddress, amountIn);
      
      return ethers.utils.formatUnits(amountOut, 18);
    } catch (error) {
      console.error('Ошибка получения цены:', error);
      return '0';
    }
  }
}

export const realTradingService = new RealTradingService();