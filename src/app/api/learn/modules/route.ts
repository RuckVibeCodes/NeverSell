import { NextResponse } from 'next/server';
import type { ApiResponse, LearnTopic, FAQ, GlossaryTerm } from '@/types/api';

// Educational modules/topics
const LEARN_TOPICS: LearnTopic[] = [
  {
    id: 'what-is-neversell',
    title: 'What is NeverSell?',
    description: 'Learn how NeverSell helps you earn yield on your crypto without selling.',
    readTimeMinutes: 2,
    order: 1,
    category: 'basics',
  },
  {
    id: 'how-you-earn',
    title: 'How You Earn Money',
    description: 'Understanding where your yield comes from.',
    readTimeMinutes: 3,
    order: 2,
    category: 'earning',
  },
  {
    id: 'the-60-40-split',
    title: 'Where Your Money Goes',
    description: 'The 60/40 allocation strategy explained.',
    readTimeMinutes: 3,
    order: 3,
    category: 'earning',
  },
  {
    id: 'what-is-apy',
    title: 'APY Explained Simply',
    description: 'Annual Percentage Yield — what it means for you.',
    readTimeMinutes: 2,
    order: 4,
    category: 'basics',
  },
  {
    id: 'why-borrow',
    title: 'Why Borrow Instead of Sell?',
    description: 'The wealthy don\'t sell — they borrow. Here\'s why.',
    readTimeMinutes: 4,
    order: 5,
    category: 'borrowing',
  },
  {
    id: 'borrow-vs-not',
    title: 'Should You Borrow?',
    description: 'Understand when borrowing makes sense and when it doesn\'t.',
    readTimeMinutes: 3,
    order: 6,
    category: 'borrowing',
  },
  {
    id: 'what-is-health-factor',
    title: 'Health Factor: Your Safety Score',
    description: 'How to stay safe when borrowing.',
    readTimeMinutes: 3,
    order: 7,
    category: 'safety',
  },
  {
    id: 'liquidation-explained',
    title: 'What is Liquidation?',
    description: 'Understanding the risks and how to avoid them.',
    readTimeMinutes: 4,
    order: 8,
    category: 'safety',
  },
  {
    id: 'the-neversell-method',
    title: 'The NeverSell Method',
    description: 'The complete strategy: deposit, earn, borrow, never sell.',
    readTimeMinutes: 5,
    order: 9,
    category: 'advanced',
  },
  {
    id: 'taxes-and-borrowing',
    title: 'How Borrowing Saves on Taxes',
    description: 'The tax advantages of borrowing vs selling.',
    readTimeMinutes: 4,
    order: 10,
    category: 'advanced',
  },
];

// FAQs
const FAQS: FAQ[] = [
  {
    id: 'is-it-safe',
    question: 'Is my money safe?',
    answer: 'Your funds are held in Aave and GMX — two of the most battle-tested DeFi protocols with billions in deposits. NeverSell is just the routing layer. We never have custody of your funds.',
    category: 'safety',
  },
  {
    id: 'how-much-earn',
    question: 'How much will I earn?',
    answer: 'Current APY ranges from 8-16% depending on your asset allocation. Conservative (mostly BTC) earns less but is more stable. Growth (mixed assets) earns more but has more volatility.',
    category: 'earning',
  },
  {
    id: 'do-i-have-to-borrow',
    question: 'Do I have to borrow?',
    answer: 'No! Borrowing is completely optional. Most users just deposit and earn. Borrowing is there if you ever need cash without selling.',
    category: 'borrowing',
  },
  {
    id: 'what-are-fees',
    question: 'What are the fees?',
    answer: 'We take 10-15% of your yield (not your principal). If you earn $100, we keep $10-15, you keep $85-90. No deposit fees. No withdrawal fees. No hidden costs.',
    category: 'fees',
  },
  {
    id: 'can-i-lose-money',
    question: 'Can I lose money?',
    answer: 'Your principal is exposed to asset price movements. If BTC drops 20%, your BTC position drops 20%. If you\'ve borrowed and prices drop too much, liquidation can occur. We show you your Health Factor at all times so you can manage risk.',
    category: 'safety',
  },
  {
    id: 'how-withdraw',
    question: 'How do I withdraw?',
    answer: 'Anytime. Click withdraw, choose amount, sign the transaction. Funds arrive in your wallet within minutes. If you have an open loan, you\'ll need to repay it first (or we\'ll deduct it from your withdrawal).',
    category: 'general',
  },
  {
    id: 'minimum-deposit',
    question: 'What\'s the minimum deposit?',
    answer: 'The minimum deposit is $10 worth of any supported asset. We recommend starting with at least $100 to make the yield meaningful.',
    category: 'general',
  },
  {
    id: 'supported-chains',
    question: 'What chains are supported?',
    answer: 'We currently support Arbitrum One. All deposits are routed to Arbitrum where the yield strategies operate. You can deposit from any supported chain and we\'ll bridge for you.',
    category: 'general',
  },
];

// Glossary
const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'APY',
    definition: 'Annual Percentage Yield — how much you earn in a year, including compound interest.',
    example: 'If you deposit $1,000 at 10% APY, you\'ll have $1,100 after one year.',
  },
  {
    term: 'Collateral',
    definition: 'Assets you lock up to secure a loan. If you don\'t repay, the collateral can be taken.',
    example: 'Like putting your car title up to get a loan from a pawn shop.',
  },
  {
    term: 'Health Factor',
    definition: 'A safety score for your loan. Above 1 is safe. Below 1 means liquidation.',
    example: 'Think of it like a gas gauge. Green (>1.5) is good. Yellow (1.0-1.5) is caution. Red (<1) is danger.',
  },
  {
    term: 'Liquidation',
    definition: 'When the protocol sells some of your collateral to repay your loan because prices dropped.',
    example: 'Like a margin call in stock trading — you borrowed too much and the bank takes action.',
  },
  {
    term: 'LTV (Loan-to-Value)',
    definition: 'How much you can borrow compared to your collateral. 60% LTV means you can borrow $60 for every $100 deposited.',
    example: 'A house with 80% LTV mortgage means you put 20% down.',
  },
  {
    term: 'Yield',
    definition: 'The return you earn on your deposited assets.',
    example: 'Like interest from a savings account, but usually higher.',
  },
  {
    term: 'TVL',
    definition: 'Total Value Locked — how much money is deposited in a protocol. Higher TVL often means more trust.',
    example: 'Like total deposits at a bank.',
  },
  {
    term: 'Slippage',
    definition: 'The difference between expected and actual price when swapping assets.',
    example: 'If you expect to get $100 of ETH but get $99.50, that\'s 0.5% slippage.',
  },
  {
    term: 'Gas',
    definition: 'The fee you pay to execute transactions on the blockchain.',
    example: 'Like a transaction fee when wiring money internationally.',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const include = searchParams.get('include')?.split(',') || ['topics'];

  const response: {
    topics?: LearnTopic[];
    faqs?: FAQ[];
    glossary?: GlossaryTerm[];
  } = {};

  if (include.includes('topics') || include.includes('all')) {
    response.topics = LEARN_TOPICS;
  }

  if (include.includes('faqs') || include.includes('all')) {
    response.faqs = FAQS;
  }

  if (include.includes('glossary') || include.includes('all')) {
    response.glossary = GLOSSARY;
  }

  const apiResponse: ApiResponse<typeof response> = {
    success: true,
    data: response,
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  };

  return NextResponse.json(apiResponse);
}
