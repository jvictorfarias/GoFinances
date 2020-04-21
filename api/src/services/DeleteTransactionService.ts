import { getCustomRepository } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

interface Request {
  id: string;
}
class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionRepository);

    const transaction = transactionRepository.findOne({ where: { id } });

    if (!transaction) {
      throw new AppError('Transaction does not exists');
    }

    await transactionRepository.delete({ id });
  }
}

export default DeleteTransactionService;
