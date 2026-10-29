import {
  type Bond,
  type Hint,
  MAX_PLAUSIBLE_YIELD,
  type Position,
  type Verdict,
  amountForYield,
  annualYield,
  canBuyOn,
  groupPositions,
  isPlannedPurchase,
  keyRateHint,
  newBondsHint,
  newBondsLabel,
  newBondsRate,
  sortHints,
  sumTotals,
  walletPosition,
  worstTone,
} from '@/entities/portfolio';
import { formatMoney, round2 } from '@/shared/lib';

/** What the money from a sale could earn instead: new bonds like this one, or the key rate. */
type Benchmark = {
  /** % a year */
  rate: number;
  /** The rate in words, after «за»: «середню ставку купону (15.9%) 12 ОВДП у UAH …» */
  versus: string;
};

/** Selling at the price typed, against holding to maturity. */
export type SaleComparison = {
  /** What the buyer pays for the bonds held */
  proceeds: number;
  /** Payments received, plus the price, minus what the bonds cost */
  saleResult: number;
  /** What the money from the sale earns if the bonds are kept instead, % a year */
  holdYield: number;
};

export type HoldOrSell = {
  verdict: Verdict | null;
  hints: Hint[];
  /** Bonds held today: planned purchases are left out */
  quantity: number;
  /** The price per bond from which selling today loses nothing; 0 once payments returned the cost */
  breakEvenPrice: number;
  /**
   * The price per bond above which selling and buying at the benchmark earns more than keeping
   * the bonds; null without a benchmark
   */
  sellAbovePrice: number | null;
  /** All payments minus what the bonds cost, held to maturity */
  holdResult: number;
  /** Null until a plausible price is typed */
  sale: SaleComparison | null;
};

type Input = {
  position: Position;
  bond: Bond;
  today: string;
  /** NBU key policy rate today, % a year; null until loaded */
  keyRate: number | null;
  /** The whole NBU catalog, to find the bonds placed lately */
  bonds: Bond[];
  /** What a buyer pays for 1 bond today, as typed; null until typed */
  salePrice: number | null;
};

const HOLD: Verdict = { tone: 'success', title: 'Вигідніше тримати' };
const SELL: Verdict = { tone: 'warning', title: 'Вигідніше продати' };
const CHECK_PRICE: Verdict = { tone: 'warning', title: 'Перевірте ціну' };

const YIELD_VERDICTS = {
  success: { tone: 'success', title: 'Варто тримати' },
  warning: { tone: 'warning', title: 'Нові ОВДП дають більше' },
} as const satisfies Record<'success' | 'warning', Verdict>;

function benchmarkOf({ bond, today, keyRate, bonds }: Input): Benchmark | null {
  const newBonds = newBondsRate(bond, today, bonds);
  if (newBonds) {
    return {
      rate: newBonds.rate,
      versus: `середню ставку купону (${newBonds.rate}%) ${newBondsLabel(newBonds, bond.currency)}`,
    };
  }
  if (bond.currency === 'UAH' && keyRate !== null) {
    return { rate: keyRate, versus: `облікову ставку НБУ (${keyRate}%)` };
  }
  return null;
}

/** Without a price: keep a bond that pays at least what the market does. */
function yieldVerdict(hints: Hint[]): Verdict | null {
  const tone = worstTone(hints);
  return tone === 'success' || tone === 'warning' ? YIELD_VERDICTS[tone] : null;
}

/** The price typed, against holding: its verdict and why, before the yield's own hints. */
function saleHints(
  salePrice: number,
  sale: SaleComparison | null,
  benchmark: Benchmark | null,
  currency: Bond['currency'],
  yieldHints: Hint[],
): { verdict: Verdict | null; hints: Hint[] } {
  const price = `${formatMoney(salePrice, currency)} за 1 шт`;
  if (!sale) {
    return {
      verdict: CHECK_PRICE,
      hints: [
        {
          tone: 'warning',
          text: `За ${price} покупець отримав би з решти виплат дохідність, за якої на ринку ОВДП не купують. Перевірте ціну: вона — за 1 шт.`,
        },
        ...yieldHints,
      ],
    };
  }
  const hints: Hint[] = [];
  const yieldFromToday = `Дохідність від сьогодні ${sale.holdYield}%`;
  if (benchmark && sale.holdYield < benchmark.rate) {
    hints.push({
      tone: 'warning',
      text: `${yieldFromToday} нижча за ${benchmark.versus}: продати за ${price} й вкласти гроші в нову ОВДП вигідніше.`,
    });
  } else if (benchmark) {
    hints.push({
      tone: 'success',
      text: `${yieldFromToday} не нижча за ${benchmark.versus}: продаж за ${price} не дасть більше.`,
    });
  } else {
    hints.push({
      tone: 'info',
      text: `${yieldFromToday}: стільки річних заробляють у цій ОВДП гроші, які за неї дають сьогодні.`,
    });
  }
  if (sale.saleResult < 0) {
    hints.push({
      tone: 'warning',
      text: `За ${price} продаж дасть збиток ${formatMoney(-sale.saleResult, currency)}: виплати й ціна не повернуть вкладене.`,
    });
  }
  const verdict = benchmark ? (sale.holdYield < benchmark.rate ? SELL : HOLD) : null;
  return { verdict, hints: [...hints, ...yieldHints] };
}

/**
 * Whether to keep a bond of the wallet or sell it today. Without a price it compares the bond's
 * annual yield with the key rate and with new bonds, and gives the prices that decide: below the
 * break-even selling loses money, above the other the money from a sale earns more in a new bond.
 * A price typed decides by what that money earns if the bonds are kept. Null for a bond that
 * cannot be sold any more, has no bonds held today or whose redemption NBU has not published.
 */
export function holdOrSell(input: Input): HoldOrSell | null {
  const { position, bond, today, keyRate, salePrice } = input;
  const held = position.purchases.filter((purchase) => !isPlannedPurchase(purchase, today));
  if (held.length === 0 || !canBuyOn(bond, today)) return null;
  const {
    payments,
    results,
    annualYield: heldYield,
  } = walletPosition(groupPositions(held)[0], bond, today);
  if (!results?.complete || results.netIncome === null) return null;

  const quantity = held.reduce((total, purchase) => total + purchase.quantity, 0);
  // A payment on the day of the sale still goes to the seller.
  const received = sumTotals(payments.filter((payment) => payment.date <= today));
  const remaining = payments.filter((payment) => payment.date > today);
  const remainingPerBond = remaining.map((payment) => ({
    date: payment.date,
    total: payment.amount,
  }));
  const benchmark = benchmarkOf(input);

  const yieldHints = sortHints(
    heldYield === null
      ? []
      : [
          keyRateHint(heldYield, keyRate, bond.currency),
          newBondsHint(heldYield, newBondsRate(bond, today, input.bonds), bond.currency),
        ],
  );

  let sale: SaleComparison | null = null;
  if (salePrice !== null) {
    const holdYield = annualYield(salePrice * quantity, today, remaining);
    if (holdYield !== null && holdYield >= 0 && holdYield <= MAX_PLAUSIBLE_YIELD) {
      const proceeds = round2(salePrice * quantity);
      sale = { proceeds, saleResult: round2(received + proceeds - results.invested), holdYield };
    }
  }
  const assessed =
    salePrice === null
      ? { verdict: yieldVerdict(yieldHints), hints: yieldHints }
      : saleHints(salePrice, sale, benchmark, bond.currency, yieldHints);

  return {
    ...assessed,
    quantity,
    breakEvenPrice: Math.max(0, round2((results.invested - received) / quantity)),
    sellAbovePrice: benchmark ? amountForYield(today, remainingPerBond, benchmark.rate) : null,
    holdResult: results.netIncome,
    sale,
  };
}
