import { getCustomRepository, getRepository, In } from 'typeorm';
import path from 'path';
import fs from 'fs';
import csv from 'csv-parse';

import uploadConfig from '../config/upload';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  filename: string;
}

interface CSVImport {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  private importedTransactions: CSVImport[];

  private categories: string[];

  constructor() {
    this.importedTransactions = [];
    this.categories = [];
  }

  async execute({ filename }: Request): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);
    const csvPath = path.join(uploadConfig.directory, filename);
    if (!(await fs.promises.stat(csvPath))) {
      throw new AppError('File not found');
    }

    const csvFileStream = fs.createReadStream(csvPath);

    const parseConfig = csv({
      from_line: 2,
    });

    const parsedTransactions = csvFileStream.pipe(parseConfig);

    parsedTransactions.on('data', async line => {
      const [title, type, value, category] = line.map((data: string) =>
        data.trim(),
      );

      if (
        !title ||
        !type ||
        !value ||
        (type === 'outcome' && value > transactionsRepository.getBalance())
      ) {
        throw new AppError(
          'Invalid CSV format or inconsistent value transaction.',
        );
      }
      this.categories.push(category);
      this.importedTransactions.push({ title, type, value, category });
    });

    await new Promise((resolve, reject) => {
      parsedTransactions.on('end', resolve);
      parsedTransactions.on('error', err => reject(err));
    });

    const existentCategories = await categoriesRepository.find({
      where: { title: In(this.categories) },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = Array.from(
      new Set(
        this.categories.filter(
          (category: string) => !existentCategoriesTitles.includes(category),
        ),
      ),
    );

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...existentCategories, ...newCategories];

    const createdTransactions: Transaction[] = transactionsRepository.create(
      this.importedTransactions.map(transaction => ({
        title: transaction.title,
        value: Number(transaction.value),
        type: transaction.type,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    // const parsedTransactions = await csv({
    //  checkType: true,
    //  headers: ['title', 'type', 'value', 'category'],
    // }).fromFile(csvPath);

    // console.log(parsedTransactions);

    // parsedTransactions.reduce(
    //   async (accumulator: Promise<Transaction>, transaction: Transaction) => {
    //     this.importedTransactions.push(await accumulator);
    //     return this.createTransaction.execute({
    //       title: transaction.title,
    //       type: transaction.type,
    //       value: transaction.value,
    //       category: transaction.category.toString(),
    //     });
    //   },
    //   Promise.resolve(),
    // );

    await fs.promises.unlink(csvPath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
