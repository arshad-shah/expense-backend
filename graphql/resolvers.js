const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const bcrypt = require('bcryptjs');

const resolvers = {
  user: async ({ id }) => {
    return await User.findById(id);
  },
  account: async ({ id }) => {
    return await Account.findById(id);
  },
  accounts: async ({ userId }) => {
    return await Account.find({ userId });
  },
  transaction: async ({ id }) => {
    return await Transaction.findById(id);
  },
  transactions: async ({ userId, accountId }) => {
    const query = { userId };
    if (accountId) query.accountId = accountId;
    return await Transaction.find(query);
  },
  category: async ({ id }) => {
    return await Category.findById(id);
  },
  categories: async ({ userId }) => {
    return await Category.find({ userId });
  },
  budget: async ({ id }) => {
    return await Budget.findById(id);
  },
  budgets: async ({ userId }) => {
    return await Budget.find({ userId });
  },
  createUser: async ({ input }) => {
    const hashedPassword = await bcrypt.hash(input.password, 12);
    const user = new User({
      ...input,
      hashedPassword
    });
    return await user.save();
  },
  createAccount: async ({ input }) => {
    const account = new Account(input);
    return await account.save();
  },
  createTransaction: async ({ input }) => {
    const transaction = new Transaction(input);
    return await transaction.save();
  },
  createCategory: async ({ input }) => {
    const category = new Category(input);
    return await category.save();
  },
  createBudget: async ({ input }) => {
    const budget = new Budget(input);
    return await budget.save();
  }

};

module.exports = resolvers;