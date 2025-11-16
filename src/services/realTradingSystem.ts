import { ethers } from 'ethers';
import { tradingBotService } from './tradingBotService';

// Адреса токенов
const TOKEN_ADDRESSES = {
  USDT: '0x434897c0Be49cd3f8d9bed1e9C56F8016afd2Ee6',
  BTC: '0xC941593909348e941420D5404Ab00b5363b1dDB4',
  ETH: '0x13E5f0d98D1dA90931A481fe0CE9eDAb24bA2Ecb'
};

// ABI для токенов
const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function transferFrom(address,address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)"
];

interface Trade {
  id: string;
  user: string;
  side: 'buy' | 'sell';
  token: string;
  amount: number;
  price: number;
  timestamp: number;
  status: 'pending' | 'filled' | 'cancelled';
}

/**
 * Реальная торговая система с блоками и ботами
 */
export class RealTradingSystem {
  public provider: ethers.providers.Provider | null = null;
  public signer: ethers.Signer | null = null;
  private trades: Trade[] = [];
  private orderBook: { [pair: string]: { bids: any[], asks: any[] } } = {};

  async initialize(provider: ethers.providers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    
    // Инициализируем ботов
    await tradingBotService.initialize(provider, signer);
    
    console.log('✅ Real trading system initialized');
  }

  /**
   * Размещаем ордер пользователя
   */
  async placeOrder(
    userAddress: string,
    side: 'buy' | 'sell',
    token: string,
    amount: number,
    price: number
  ): Promise<{ success: boolean; tradeId?: string; error?: string }> {
    try {
      // Создаем ордер
      const trade: Trade = {
        id: `trade_${Date.now()}_${Math.random()}`,
        user: userAddress,
        side,
        token,
        amount,
        price,
        timestamp: Date.now(),
        status: 'pending'
      };

      this.trades.push(trade);

      // Пытаемся найти совпадающий ордер в стакане
      const matchResult = await this.findMatch(trade);
      
      if (matchResult.matched) {
        // Исполняем сделку
        await this.executeTrade(trade, matchResult.counterpart);
        trade.status = 'filled';
        
        console.log(`✅ Trade executed: ${amount} ${token} @ $${price}`);
        return { success: true, tradeId: trade.id };
      } else {
        // Добавляем в стакан
        this.addToOrderBook(trade);
        console.log(`📋 Order placed in orderbook: ${amount} ${token} @ $${price}`);
        return { success: true, tradeId: trade.id };
      }

    } catch (error) {
      console.error('❌ Error placing order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ищем совпадающий ордер
   */
  private async findMatch(trade: Trade): Promise<{ matched: boolean; counterpart?: any }> {
    const pair = `${trade.token}/USDT`;
    const orderBook = this.orderBook[pair] || { bids: [], asks: [] };
    
    if (trade.side === 'buy') {
      // Ищем ордера на продажу
      for (const ask of orderBook.asks) {
        if (ask.price <= trade.price && ask.amount > 0) {
          return { matched: true, counterpart: ask };
        }
      }
    } else {
      // Ищем ордера на покупку
      for (const bid of orderBook.bids) {
        if (bid.price >= trade.price && bid.amount > 0) {
          return { matched: true, counterpart: bid };
        }
      }
    }
    
    return { matched: false };
  }

  /**
   * Исполняем сделку
   */
  private async executeTrade(trade: Trade, counterpart: any) {
    const amount = Math.min(trade.amount, counterpart.amount);
    const price = counterpart.price; // Используем цену встречного ордера
    
    // Обновляем балансы через смарт-контракты
    if (trade.side === 'buy') {
      // Пользователь покупает: сжигаем USDT, даем токен
      await this.burnTokens(userAddress, 'USDT', amount * price);
      await this.mintTokens(userAddress, trade.token, amount);
    } else {
      // Пользователь продает: сжигаем токен, даем USDT
      await this.burnTokens(userAddress, trade.token, amount);
      await this.mintTokens(userAddress, 'USDT', amount * price);
    }
    
    // Обновляем встречный ордер
    counterpart.amount -= amount;
    if (counterpart.amount <= 0) {
      counterpart.status = 'filled';
    }
  }

  /**
   * Сжигаем токены
   */
  private async burnTokens(userAddress: string, token: string, amount: number) {
    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES],
      TOKEN_ABI,
      this.signer
    );
    
    const decimals = await tokenContract.decimals();
    const amountParsed = ethers.utils.parseUnits(amount.toString(), decimals);
    
    const tx = await tokenContract.transfer(
      '0x000000000000000000000000000000000000dEaD',
      amountParsed
    );
    await tx.wait();
  }

  /**
   * Минтим токены
   */
  private async mintTokens(userAddress: string, token: string, amount: number) {
    // Используем владельца для перевода токенов
    const ownerPrivateKey = process.env.PRIVATE_KEY;
    if (!ownerPrivateKey) {
      throw new Error('Owner private key not found');
    }

    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    const ownerWallet = new ethers.Wallet(ownerPrivateKey, this.provider);
    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES],
      TOKEN_ABI,
      ownerWallet
    );
    
    const decimals = await tokenContract.decimals();
    const amountParsed = ethers.utils.parseUnits(amount.toString(), decimals);
    
    const tx = await tokenContract.transfer(userAddress, amountParsed);
    await tx.wait();
  }

  /**
   * Добавляем ордер в стакан
   */
  private addToOrderBook(trade: Trade) {
    const pair = `${trade.token}/USDT`;
    
    if (!this.orderBook[pair]) {
      this.orderBook[pair] = { bids: [], asks: [] };
    }
    
    if (trade.side === 'buy') {
      this.orderBook[pair].bids.push(trade);
      this.orderBook[pair].bids.sort((a, b) => b.price - a.price);
    } else {
      this.orderBook[pair].asks.push(trade);
      this.orderBook[pair].asks.sort((a, b) => a.price - b.price);
    }
  }

  /**
   * Получаем стакан
   */
  getOrderBook(pair: string) {
    const botOrderBook = tradingBotService.getOrderBook(pair);
    const userOrderBook = this.orderBook[pair] || { bids: [], asks: [] };
    
    // Объединяем ордера ботов и пользователей
    return {
      bids: [...botOrderBook.bids, ...userOrderBook.bids]
        .filter(o => !o.filled)
        .sort((a, b) => b.price - a.price)
        .slice(0, 20), // Показываем топ 20
      asks: [...botOrderBook.asks, ...userOrderBook.asks]
        .filter(o => !o.filled)
        .sort((a, b) => a.price - b.price)
        .slice(0, 20)
    };
  }

  /**
   * Получаем историю торгов пользователя
   */
  getUserTrades(userAddress: string): Trade[] {
    return this.trades.filter(t => t.user === userAddress);
  }

  /**
   * Получаем статистику системы
   */
  getSystemStats() {
    const botStats = tradingBotService.getBotStats();
    return {
      ...botStats,
      userTrades: this.trades.length,
      activeOrders: this.trades.filter(t => t.status === 'pending').length
    };
  }
}

export const realTradingSystem = new RealTradingSystem();
