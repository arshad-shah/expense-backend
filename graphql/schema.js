const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    currency: String!
    accounts: [Account]
    transactions: [Transaction]
    categories: [Category]
    budgets: [Budget]
  }

  type Account {
    id: ID!
    user: User!
    name: String!
    accountType: String!
    bankName: String!
    balance: Float!
    currency: String!
    isActive: Boolean!
    lastSync: String
    transactions: [Transaction]
  }

  type Category {
    id: ID!
    user: User!
    name: String!
    type: String!
    icon: String!
    color: String!
    isDefault: Boolean!
    isActive: Boolean!
    transactions: [Transaction]
  }

  type Transaction {
    id: ID!
    user: User!
    account: Account!
    category: Category!
    amount: Float!
    type: String!
    description: String!
    transactionDate: String!
    isRecurring: Boolean!
    recurringPattern: String
    attachments: [Attachment]
  }

  type Budget {
    id: ID!
    user: User!
    name: String!
    amount: Float!
    period: String!
    startDate: String!
    endDate: String!
    isActive: Boolean!
    categories: [BudgetCategory]
  }

  type BudgetCategory {
    budget: Budget!
    category: Category!
    allocatedAmount: Float!
    spentAmount: Float!
  }

  type Attachment {
    id: ID!
    transaction: Transaction!
    fileName: String!
    fileType: String!
    fileUrl: String!
    fileSize: Float!
    uploadedAt: String!
  }

  type Query {
    user(id: ID!): User
    account(id: ID!): Account
    accounts(userId: ID!): [Account]
    transaction(id: ID!): Transaction
    transactions(userId: ID!, accountId: ID): [Transaction]
    category(id: ID!): Category
    categories(userId: ID!): [Category]
    budget(id: ID!): Budget
    budgets(userId: ID!): [Budget]
  }

  input UserInput {
    email: String!
    hashedPassword: String!
    firstName: String!
    lastName: String!
    currency: String!
  }

  input AccountInput {
    userId: ID!
    name: String!
    accountType: String!
    bankName: String!
    balance: Float!
    currency: String!
  }

  input TransactionInput {
    userId: ID!
    accountId: ID!
    categoryId: ID!
    amount: Float!
    type: String!
    description: String!
    transactionDate: String!
    isRecurring: Boolean
    recurringPattern: String
  }

  input CategoryInput {
    userId: ID!
    name: String!
    type: String!
    icon: String!
    color: String!
    isDefault: Boolean
  }

  input BudgetInput {
    userId: ID!
    name: String!
    amount: Float!
    period: String!
    startDate: String!
    endDate: String!
  }

  type Mutation {
    createUser(input: UserInput!): User
    createAccount(input: AccountInput!): Account
    createTransaction(input: TransactionInput!): Transaction
    createCategory(input: CategoryInput!): Category
    createBudget(input: BudgetInput!): Budget
    updateAccount(id: ID!, input: AccountInput!): Account
    updateTransaction(id: ID!, input: TransactionInput!): Transaction
    updateCategory(id: ID!, input: CategoryInput!): Category
    updateBudget(id: ID!, input: BudgetInput!): Budget
    deleteAccount(id: ID!): Boolean
    deleteTransaction(id: ID!): Boolean
    deleteCategory(id: ID!): Boolean
    deleteBudget(id: ID!): Boolean
  }
`);

module.exports = schema;