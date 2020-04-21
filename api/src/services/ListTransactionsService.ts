import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface Response {
  transactions: Array<Transaction>;
  balance: Balance;
}

class ListTransactionsService {
  public async execute(): Promise<Response> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    // Deve-se usar o 'relations' com o campo da tabela atual que você deu join em models
    const transactions = await transactionsRepository.find({
      select: ['id', 'title', 'value', 'type', 'created_at'],
      relations: ['category'],
    });

    const balance = await transactionsRepository.getBalance();

    return {
      transactions,
      balance,
    };
  }
}

export default ListTransactionsService;
