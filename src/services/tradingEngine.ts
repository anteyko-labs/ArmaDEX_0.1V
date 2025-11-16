import { ethers } from 'ethers';

export interface MatchOrder {
  id: string;
  user: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface BatchTrade {
  id: string;
  orders: MatchOrder[];
  totalFee: string;
  gasEstimate: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  txHash?: string;
  timestamp: number;
}

class TradingEngine {
  private provider: ethers.providers.JsonRpcProvider;
  private feeWallet: ethers.Wallet;
  private dexContract?: ethers.Contract;
  
  // РЕАЛЬНЫЕ адреса (из deployed_addresses.json)
  private readonly DEX_ADDRESS = '0xCcA67eB690872566C1260F4777BfE7C79ff4047d'; // UNIVERSAL_DEX
  private readonly USDT_ADDRESS = '0x434897c0Be49cd3f8d9bed1e9C56F8016afd2Ee6';
  private readonly BTC_ADDRESS = '0xC941593909348e941420D5404Ab00b5363b1dDB4';
  private readonly ETH_ADDRESS = '0x13E5f0d98D1dA90931A481fe0CE9eDAb24bA2Ecb';
  
  // Кошелек для комиссий
  private readonly FEE_WALLET_ADDRESS = '0xB468B3837e185B59594A100c1583a98C79b524F3';
  private readonly FEE_WALLET_PRIVATE_KEY = 'cbd0632c261aa3c4724616833151488df591ee1372c9982cac661ad773d8f42c';
  
  // Очередь ордеров
  private orderQueue: MatchOrder[] = [];
  private batchSize = 10; // Собираем 10 ордеров в батч
  private batchTimeout = 30000; // 30 секунд максимум ожидания
  
  // ABI для DEX контракта
  private readonly DEX_ABI = [
    "function executeBatch(address[] memory users, address[] memory tokensIn, address[] memory tokensOut, uint256[] memory amountsIn, uint256[] memory minAmountsOut) external returns (bool)",
    "function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256)",
    "function collectFees() external",
    "function getFeeBalance() external view returns (uint256)"
  ];

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/4c8f4a87f45c4e9d9a655e66dfacfcd9');
    this.feeWallet = new ethers.Wallet(this.FEE_WALLET_PRIVATE_KEY, this.provider);
  }

  async initialize(dexAddress?: string): Promise<void> {
    if (dexAddress) {
      this.DEX_ADDRESS = dexAddress;
    }
    this.dexContract = new ethers.Contract(this.DEX_ADDRESS, this.DEX_ABI, this.feeWallet);
    console.log('🚀 TradingEngine инициализирован с DEX:', this.DEX_ADDRESS);
  }

  // Добавить ордер в очередь
  async addOrder(order: MatchOrder): Promise<string> {
    console.log(`📝 Добавлен ордер: ${order.side} ${order.amountIn} ${order.tokenIn} -> ${order.tokenOut}`);
    
    this.orderQueue.push(order);
    
    // Проверяем нужно ли выполнить батч
    if (this.orderQueue.length >= this.batchSize) {
      await this.executeBatch();
    }
    
    return order.id;
  }

  // Выполнить батч ордеров
  private async executeBatch(): Promise<void> {
    if (this.orderQueue.length === 0) return;
    
    console.log(`🔄 Выполнение батча из ${this.orderQueue.length} ордеров...`);
    
    // Берем первые N ордеров
    const batchOrders = this.orderQueue.splice(0, this.batchSize);
    
    try {
      // Подготавливаем данные для контракта
      const users = batchOrders.map(order => order.user);
      const tokensIn = batchOrders.map(order => order.tokenIn);
      const tokensOut = batchOrders.map(order => order.tokenOut);
      const amountsIn = batchOrders.map(order => order.amountIn);
      const minAmountsOut = batchOrders.map(order => order.minAmountOut);
      
      // Вычисляем общую комиссию (0.2% с каждого ордера)
      const totalFee = batchOrders.reduce((sum, order) => {
        const fee = parseFloat(order.amountIn) * 0.002;
        return sum + fee;
      }, 0);
      
      console.log(`💰 Общая комиссия батча: ${totalFee.toFixed(6)} USDT`);
      
      // Проверяем инициализацию
      if (!this.dexContract) {
        throw new Error('DEX контракт не инициализирован');
      }
      
      // Выполняем батч транзакцию
      const tx = await this.dexContract.executeBatch(
        users,
        tokensIn,
        tokensOut,
        amountsIn,
        minAmountsOut,
        {
          gasLimit: 500000, // Больше газа для батча
          gasPrice: await this.getOptimalGasPrice()
        }
      );
      
      console.log(`✅ Батч выполнен! TX: ${tx.hash}`);
      
      // Ждем подтверждения
      const receipt = await tx.wait();
      console.log(`⛽ Потрачено газа: ${receipt.gasUsed.toString()}`);
      
      // Комиссия автоматически переводится на FEE_WALLET
      console.log(`💸 Комиссия ${totalFee.toFixed(6)} USDT переведена на ${this.FEE_WALLET_ADDRESS}`);
      
    } catch (error) {
      console.error('❌ Ошибка выполнения батча:', error);
      
      // Возвращаем ордера в очередь
      this.orderQueue.unshift(...batchOrders);
    }
  }

  // Получить оптимальную цену газа
  private async getOptimalGasPrice(): Promise<string> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice?.toString() || '20000000000'; // 20 gwei по умолчанию
    } catch (error) {
      console.error('Ошибка получения цены газа:', error);
      return '20000000000';
    }
  }

  // Автоматическое выполнение батчей по таймауту
  startBatchProcessor(): void {
    console.log('⏰ Запуск автоматического батчера...');
    
    setInterval(async () => {
      if (this.orderQueue.length > 0) {
        console.log(`⏰ Таймаут батча: ${this.orderQueue.length} ордеров в очереди`);
        // ВРЕМЕННО ОТКЛЮЧАЕМ автоматическое выполнение батчей
        console.log('⚠️ Автоматическое выполнение батчей отключено');
        // await this.executeBatch();
      }
    }, this.batchTimeout);
  }

  // Получить баланс комиссий
  async getFeeBalance(): Promise<string> {
    if (!this.dexContract) return '0';
    
    try {
      const balance = await this.dexContract.getFeeBalance();
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Ошибка получения баланса комиссий:', error);
      return '0';
    }
  }

  // Собрать комиссии на кошелек
  async collectFees(): Promise<string> {
    if (!this.dexContract) return '';
    
    try {
      console.log('💰 Сбор комиссий...');
      const tx = await this.dexContract.collectFees();
      await tx.wait();
      console.log(`✅ Комиссии собраны! TX: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error('❌ Ошибка сбора комиссий:', error);
      return '';
    }
  }

  // Получить статистику
  getStats() {
    return {
      ordersInQueue: this.orderQueue.length,
      batchSize: this.batchSize,
      batchTimeout: this.batchTimeout,
      feeWallet: this.FEE_WALLET_ADDRESS
    };
  }

  // Получить ордера в очереди
  getQueuedOrders(): MatchOrder[] {
    return [...this.orderQueue];
  }
}

export const tradingEngine = new TradingEngine();