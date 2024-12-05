const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const BudgetCategory = require('../models/BudgetCategory');
const Attachment = require('../models/Attachment');
const bcrypt = require('bcryptjs');

const resolvers = {
  // Query Resolvers
  user: async ({ id }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    return await User.findById(id);
  },
  
  account: async ({ id }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    const account = await Account.findById(id);
    if (account.userId.toString() !== context.userId) {
      throw new Error('Not authorized');
    }
    return account;
  },
  
  accounts: async ({ userId }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    if (userId !== context.userId) throw new Error('Not authorized');
    return await Account.find({ userId });
  },
  
  transaction: async ({ id }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    const transaction = await Transaction.findById(id);
    if (transaction.userId.toString() !== context.userId) {
      throw new Error('Not authorized');
    }
    return transaction;
  },
  
  transactions: async ({ userId, accountId }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    if (userId !== context.userId) throw new Error('Not authorized');
    const query = { userId };
    if (accountId) query.accountId = accountId;
    return await Transaction.find(query).sort({ transactionDate: -1 });
  },
  
  category: async ({ id }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    const category = await Category.findById(id);
    if (category.userId.toString() !== context.userId) {
      throw new Error('Not authorized');
    }
    return category;
  },
  
  categories: async ({ userId }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    if (userId !== context.userId) throw new Error('Not authorized');
    return await Category.find({ userId });
  },
  
  budget: async ({ id }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    const budget = await Budget.findById(id);
    if (budget.userId.toString() !== context.userId) {
      throw new Error('Not authorized');
    }
    return budget;
  },
  
  budgets: async ({ userId }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    if (userId !== context.userId) throw new Error('Not authorized');
    return await Budget.find({ userId });
  },

  // Mutation Resolvers
  createUser: async ({ input }) => {
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // The password is already hashed from the frontend
    const user = new User({
      ...input,
      hashedPassword: input.hashedPassword // Use the pre-hashed password
    });
    return await user.save();
  },
  
  createAccount: async ({ input }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    if (input.userId !== context.userId) throw new Error('Not authorized');
    const account = new Account(input);
    return await account.save();
  },
  
  createTransaction: async ({ input }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    if (input.userId !== context.userId) throw new Error('Not authorized');
    
    const account = await Account.findById(input.accountId);
    if (!account) throw new Error('Account not found');
    
    const transaction = new Transaction(input);
    await transaction.save();
    
    // Update account balance
    if (input.type === 'EXPENSE') {
      account.balance -= input.amount;
    } else if (input.type === 'INCOME') {
      account.balance += input.amount;
    }
    await account.save();
    
    return transaction;
  },
  
  createCategory: async ({ input }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    if (input.userId !== context.userId) throw new Error('Not authorized');
    const category = new Category(input);
    return await category.save();
  },
  
  createBudget: async ({ input }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    if (input.userId !== context.userId) throw new Error('Not authorized');
    const budget = new Budget(input);
    return await budget.save();
  },

  updateAccount: async ({ id, input }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    const account = await Account.findById(id);
    if (!account || account.userId.toString() !== context.userId) {
      throw new Error('Not authorized');
    }
    return await Account.findByIdAndUpdate(id, input, { new: true });
  },
  
  updateTransaction: async ({ id, input }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    const transaction = await Transaction.findById(id);
    if (!transaction || transaction.userId.toString() !== context.userId) {
      throw new Error('Not authorized');
    }
    
    const account = await Account.findById(transaction.accountId);
    if (!account) throw new Error('Account not found');
    
    // Revert old transaction
    if (transaction.type === 'EXPENSE') {
      account.balance += transaction.amount;
    } else if (transaction.type === 'INCOME') {
      account.balance -= transaction.amount;
    }
    
    // Apply new transaction
    if (input.type === 'EXPENSE') {
      account.balance -= input.amount;
    } else if (input.type === 'INCOME') {
      account.balance += input.amount;
    }
    
    await account.save();
    return await Transaction.findByIdAndUpdate(id, input, { new: true });
  },
  
  updateCategory: async ({ id, input }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    const category = await Category.findById(id);
    if (!category || category.userId.toString() !== context.userId) {
      throw new Error('Not authorized');
    }
    return await Category.findByIdAndUpdate(id, input, { new: true });
  },
  
  updateBudget: async ({ id, input }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    const budget = await Budget.findById(id);
    if (!budget || budget.userId.toString() !== context.userId) {
      throw new Error('Not authorized');
    }
    return await Budget.findByIdAndUpdate(id, input, { new: true });
  },

  deleteAccount: async ({ id }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    const account = await Account.findById(id);
    if (!account || account.userId.toString() !== context.userId) {
      throw new Error('Not authorized');
    }
    await Transaction.deleteMany({ accountId: id });
    await Account.findByIdAndDelete(id);
    return true;
  },
  
  deleteTransaction: async ({ id }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    const transaction = await Transaction.findById(id);
    if (!transaction || transaction.userId.toString() !== context.userId) {
      throw new Error('Not authorized');
    }
    
    const account = await Account.findById(transaction.accountId);
    if (account) {
      if (transaction.type === 'EXPENSE') {
        account.balance += transaction.amount;
      } else if (transaction.type === 'INCOME') {
        account.balance -= transaction.amount;
      }
      await account.save();
    }
    
    await Attachment.deleteMany({ transactionId: id });
    await Transaction.findByIdAndDelete(id);
    return true;
  },
  
  deleteCategory: async ({ id }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    const category = await Category.findById(id);
    if (!category || category.userId.toString() !== context.userId) {
      throw new Error('Not authorized');
    }
    
    const hasTransactions = await Transaction.exists({ categoryId: id });
    if (hasTransactions) {
      throw new Error('Cannot delete category with existing transactions');
    }
    
    await BudgetCategory.deleteMany({ categoryId: id });
    await Category.findByIdAndDelete(id);
    return true;
  },
  
  deleteBudget: async ({ id }, context) => {
    if (!context.isAuth) throw new Error('Not authenticated');
    const budget = await Budget.findById(id);
    if (!budget || budget.userId.toString() !== context.userId) {
      throw new Error('Not authorized');
    }
    await BudgetCategory.deleteMany({ budgetId: id });
    await Budget.findByIdAndDelete(id);
    return true;
  }
};

module.exports = resolvers;