import { getRepository, getCustomRepository } from 'typeorm';

import Category from '../models/Category';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface Response {
  id: string;
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const categoryCapitalized =
      category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    const { total } = await transactionRepository.getBalance();

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Invalid type');
    }
    if (type === 'outcome' && value > total) {
      throw new AppError('Not enough cash');
    }

    if (
      !(await categoryRepository.findOne({
        where: { title: categoryCapitalized },
      }))
    ) {
      const newCategory = categoryRepository.create({
        title: categoryCapitalized,
      });
      await categoryRepository.save(newCategory);
    }

    const transactionCategory = await categoryRepository.findOne({
      where: { title: categoryCapitalized },
    });

    if (transactionCategory === undefined) {
      throw new AppError('Database error.');
    }
    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
