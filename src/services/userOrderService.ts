import { ethers } from 'ethers';
import { userBalanceService } from './userBalanceService';

export interface UserOrder {
  id: string;
  userId: string;
  side: 'buy' | 'sell';
  token: string;
  amount: number;
  price: number;
  total: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: number;
  txHash?: string;
}

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
  orders: number;
}

class UserOrderService {
  private userOrders: UserOrder[] = [];
  private orderBook: { bids: OrderBookEntry[]; asks: OrderBookEntry[] } = {
    bids: [],
    asks: []
  };

  // Создать ордер пользователя
  async createOrder(
    userId: string,
    side: 'buy' | 'sell',
    token: string,
    amount: number,
    price: number
  ): Promise<UserOrder> {
    // Проверяем доступный баланс для заморозки
    if (side === 'sell') {
      const availableBalance = userBalanceService.getAvailableBalance(userId, token);
      if (availableBalance < amount) {
        throw new Error(`Недостаточно ${token} для создания ордера. Доступно: ${availableBalance}, требуется: ${amount}`);
      }
    }

    const order: UserOrder = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      side,
      token,
      amount,
      price,
      total: amount * price,
      status: 'pending',
      timestamp: Date.now()
    };

    // Замораживаем токены для sell ордера
    if (side === 'sell') {
      const frozen = userBalanceService.freezeTokens(userId, token, amount, order.id);
      if (!frozen) {
        throw new Error('Не удалось заморозить токены для ордера');
      }
    }

    this.userOrders.push(order);
    await this.updateOrderBook();
    
    console.log(`📝 Создан ${side} ордер: ${amount} ${token} @ $${price}`);
    
    // Пытаемся сразу исполнить ордер с существующими ордерами
    await this.tryExecuteOrder(order);
    
    return order;
  }

  // Попытка исполнения ордера
  private async tryExecuteOrder(order: UserOrder): Promise<void> {
    try {
      // Импортируем сервис ботов для получения их ордеров
      const { realBotService } = await import('./realBotService');
      const botOrders = realBotService.getOrderBook();
      
      if (order.side === 'buy') {
        // Ищем подходящие ask ордера ботов
        const matchingAsks = botOrders.asks.filter(ask => 
          ask.token === order.token && 
          ask.price <= order.price &&
          ask.isActive
        );
        
        if (matchingAsks.length > 0) {
          // Исполняем с лучшим предложением
          const bestAsk = matchingAsks.sort((a, b) => a.price - b.price)[0];
          await this.executeTrade(order, bestAsk);
        }
      } else {
        // Ищем подходящие bid ордера ботов
        const matchingBids = botOrders.bids.filter(bid => 
          bid.token === order.token && 
          bid.price >= order.price &&
          bid.isActive
        );
        
        if (matchingBids.length > 0) {
          // Исполняем с лучшим предложением
          const bestBid = matchingBids.sort((a, b) => b.price - a.price)[0];
          await this.executeTrade(order, bestBid);
        }
      }
    } catch (error) {
      console.error('Ошибка исполнения ордера:', error);
    }
  }
  
  // Исполнение сделки
  private async executeTrade(userOrder: UserOrder, botOrder: any): Promise<void> {
    const tradeAmount = Math.min(userOrder.amount, botOrder.amount);
    const tradePrice = botOrder.price;
    const tradeTotal = tradeAmount * tradePrice;
    
    console.log(`🔄 Исполнение сделки: ${tradeAmount} ${userOrder.token} @ $${tradePrice}`);
    
    // Обновляем статус ордера
    userOrder.amount -= tradeAmount;
    if (userOrder.amount <= 0) {
      userOrder.status = 'filled';
      userBalanceService.unfreezeTokens(userOrder.userId, userOrder.token, userOrder.amount, userOrder.id);
    }
    
    // Обновляем балансы пользователя
    if (userOrder.side === 'buy') {
      // Пользователь покупает - добавляем токены, списываем USDT
      userBalanceService.addTokens(userOrder.userId, userOrder.token, tradeAmount);
      userBalanceService.subtractTokens(userOrder.userId, 'USDT', tradeTotal);
    } else {
      // Пользователь продает - списываем токены, добавляем USDT
      userBalanceService.subtractTokens(userOrder.userId, userOrder.token, tradeAmount);
      userBalanceService.addTokens(userOrder.userId, 'USDT', tradeTotal);
    }
    
    console.log(`✅ Сделка исполнена: ${tradeAmount} ${userOrder.token} @ $${tradePrice}`);
  }

  // Обновить ордербук
  private async updateOrderBook(): Promise<void> {
    // Очищаем старые данные
    this.orderBook.bids = [];
    this.orderBook.asks = [];

    // Группируем ордера по ценам
    const bidGroups = new Map<number, { size: number; orders: number }>();
    const askGroups = new Map<number, { size: number; orders: number }>();

    // Обрабатываем пользовательские ордера
    this.userOrders
      .filter(order => order.status === 'pending')
      .forEach(order => {
        if (order.side === 'buy') {
          const existing = bidGroups.get(order.price) || { size: 0, orders: 0 };
          bidGroups.set(order.price, {
            size: existing.size + order.amount,
            orders: existing.orders + 1
          });
        } else {
          const existing = askGroups.get(order.price) || { size: 0, orders: 0 };
          askGroups.set(order.price, {
            size: existing.size + order.amount,
            orders: existing.orders + 1
          });
        }
      });

    // Добавляем ордера ботов (импортируем динамически)
    const { realBotService } = await import('./realBotService');
    const botOrders = realBotService.getOrderBook();
    botOrders.bids.forEach(bid => {
      const existing = bidGroups.get(bid.price) || { size: 0, orders: 0 };
      bidGroups.set(bid.price, {
        size: existing.size + bid.size,
        orders: existing.orders + 1
      });
    });

    botOrders.asks.forEach(ask => {
      const existing = askGroups.get(ask.price) || { size: 0, orders: 0 };
      askGroups.set(ask.price, {
        size: existing.size + ask.size,
        orders: existing.orders + 1
      });
    });

    // Создаем записи ордербука
    let totalBids = 0;
    Array.from(bidGroups.entries())
      .sort((a, b) => b[0] - a[0]) // Сортируем по убыванию цены
      .slice(0, 9) // Берем топ-9
      .forEach(([price, data]) => {
        totalBids += data.size;
        this.orderBook.bids.push({
          price,
          size: data.size,
          total: totalBids,
          orders: data.orders
        });
      });

    let totalAsks = 0;
    Array.from(askGroups.entries())
      .sort((a, b) => a[0] - b[0]) // Сортируем по возрастанию цены
      .slice(0, 9) // Берем топ-9
      .forEach(([price, data]) => {
        totalAsks += data.size;
        this.orderBook.asks.push({
          price,
          size: data.size,
          total: totalAsks,
          orders: data.orders
        });
      });
  }

  // Получить ордербук
  getOrderBook(): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
    return this.orderBook;
  }

  // Получить ордера пользователя
  getUserOrders(userId: string): UserOrder[] {
    return this.userOrders.filter(order => order.userId === userId);
  }

  // Отменить ордер
  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.userOrders.find(o => o.id === orderId);
    if (order && order.status === 'pending') {
      order.status = 'cancelled';
      
      // Размораживаем токены при отмене sell ордера
      if (order.side === 'sell') {
        userBalanceService.unfreezeTokens(orderId);
      }
      
      await this.updateOrderBook();
      console.log(`❌ Ордер ${orderId} отменен`);
      return true;
    }
    return false;
  }

  // Выполнить ордер (имитация)
  async executeOrder(orderId: string, txHash: string): Promise<boolean> {
    const order = this.userOrders.find(o => o.id === orderId);
    if (order && order.status === 'pending') {
      order.status = 'filled';
      order.txHash = txHash;
      
      // Списываем замороженные токены при выполнении sell ордера
      if (order.side === 'sell') {
        userBalanceService.executeOrder(orderId);
      }
      
      // Обновляем баланс при выполнении buy ордера
      if (order.side === 'buy') {
        userBalanceService.updateBalance(order.userId, order.token, order.amount);
      }
      
      await this.updateOrderBook();
      console.log(`✅ Ордер ${orderId} выполнен`);
      return true;
    }
    return false;
  }

  // Получить статистику
  getStats() {
    const pendingOrders = this.userOrders.filter(o => o.status === 'pending').length;
    const filledOrders = this.userOrders.filter(o => o.status === 'filled').length;
    const cancelledOrders = this.userOrders.filter(o => o.status === 'cancelled').length;
    
    return {
      totalOrders: this.userOrders.length,
      pendingOrders,
      filledOrders,
      cancelledOrders,
      bidOrders: this.orderBook.bids.length,
      askOrders: this.orderBook.asks.length
    };
  }

  // Очистить старые ордера
  async clearOldOrders(daysToKeep: number = 7): Promise<void> {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    this.userOrders = this.userOrders.filter(order => order.timestamp > cutoffTime);
    await this.updateOrderBook();
    console.log(`🗑️ Очищены ордера старше ${daysToKeep} дней`);
  }
  
}

export const userOrderService = new UserOrderService();
