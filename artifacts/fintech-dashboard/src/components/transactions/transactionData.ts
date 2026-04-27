export type TransactionType = "income" | "expense";

export type Category =
  | "Food & Dining"
  | "Travel"
  | "Rent & Housing"
  | "Shopping"
  | "Health"
  | "Entertainment"
  | "Transport"
  | "Salary"
  | "Freelance"
  | "Investment"
  | "Other";

export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  type: TransactionType;
  date: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  "Food & Dining",
  "Travel",
  "Rent & Housing",
  "Shopping",
  "Health",
  "Entertainment",
  "Transport",
  "Salary",
  "Freelance",
  "Investment",
  "Other",
];

export const INCOME_CATEGORIES: Category[] = [
  "Salary",
  "Freelance",
  "Investment",
  "Other",
];

export const EXPENSE_CATEGORIES: Category[] = [
  "Food & Dining",
  "Travel",
  "Rent & Housing",
  "Shopping",
  "Health",
  "Entertainment",
  "Transport",
  "Other",
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "1",  amount: 5200,  category: "Salary",        type: "income",  date: "2024-10-01", description: "Monthly salary" },
  { id: "2",  amount: 1800,  category: "Freelance",     type: "income",  date: "2024-10-03", description: "Design project payment" },
  { id: "3",  amount: 1400,  category: "Rent & Housing",type: "expense", date: "2024-10-05", description: "Monthly rent" },
  { id: "4",  amount: 320,   category: "Food & Dining", type: "expense", date: "2024-10-06", description: "Grocery shopping" },
  { id: "5",  amount: 85,    category: "Transport",     type: "expense", date: "2024-10-07", description: "Uber rides" },
  { id: "6",  amount: 450,   category: "Investment",    type: "income",  date: "2024-10-08", description: "Stock dividends" },
  { id: "7",  amount: 210,   category: "Entertainment", type: "expense", date: "2024-10-09", description: "Concert tickets" },
  { id: "8",  amount: 65,    category: "Health",        type: "expense", date: "2024-10-10", description: "Pharmacy" },
  { id: "9",  amount: 1200,  category: "Freelance",     type: "income",  date: "2024-10-12", description: "Web dev project" },
  { id: "10", amount: 180,   category: "Shopping",      type: "expense", date: "2024-10-13", description: "Clothing" },
  { id: "11", amount: 95,    category: "Food & Dining", type: "expense", date: "2024-10-14", description: "Restaurants" },
  { id: "12", amount: 540,   category: "Travel",        type: "expense", date: "2024-10-16", description: "Weekend trip flights" },
  { id: "13", amount: 15,    category: "Entertainment", type: "expense", date: "2024-10-17", description: "Netflix subscription" },
  { id: "14", amount: 3800,  category: "Salary",        type: "income",  date: "2024-10-18", description: "Bonus payment" },
  { id: "15", amount: 120,   category: "Transport",     type: "expense", date: "2024-10-19", description: "Fuel" },
  { id: "16", amount: 250,   category: "Health",        type: "expense", date: "2024-10-21", description: "Gym membership + checkup" },
  { id: "17", amount: 75,    category: "Food & Dining", type: "expense", date: "2024-10-22", description: "Coffee & lunch" },
  { id: "18", amount: 800,   category: "Investment",    type: "income",  date: "2024-10-23", description: "ETF gains" },
  { id: "19", amount: 340,   category: "Shopping",      type: "expense", date: "2024-10-24", description: "Electronics" },
  { id: "20", amount: 60,    category: "Travel",        type: "expense", date: "2024-10-25", description: "Hotel parking" },
  { id: "21", amount: 490,   category: "Rent & Housing",type: "expense", date: "2024-10-27", description: "Utilities & internet" },
  { id: "22", amount: 900,   category: "Freelance",     type: "income",  date: "2024-10-28", description: "Consulting fee" },
  { id: "23", amount: 45,    category: "Entertainment", type: "expense", date: "2024-10-29", description: "Spotify & games" },
  { id: "24", amount: 160,   category: "Food & Dining", type: "expense", date: "2024-10-30", description: "Dinner party groceries" },
];
