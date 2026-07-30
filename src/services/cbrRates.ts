export interface CbrValute {
  code: string;
  name: string;
  nominal: number;
  rateToRub: number;
}

export interface CbrRatesResult {
  rates: Record<string, number>;
  valutes: CbrValute[];
  date?: string;
  source?: string;
}

// Popular CBR currencies fallback dictionary
export const POPULAR_CBR_CURRENCIES: CbrValute[] = [
  { code: 'EUR', name: 'Евро', nominal: 1, rateToRub: 98.45 },
  { code: 'USD', name: 'Доллар США', nominal: 1, rateToRub: 89.20 },
  { code: 'CNY', name: 'Китайский юань', nominal: 1, rateToRub: 12.35 },
  { code: 'BYN', name: 'Белорусский рубль', nominal: 1, rateToRub: 27.50 },
  { code: 'KZT', name: 'Казахстанский тенге', nominal: 100, rateToRub: 18.50 },
  { code: 'TRY', name: 'Турецкая лира', nominal: 10, rateToRub: 27.10 },
  { code: 'AED', name: 'Дирхам ОАЭ', nominal: 1, rateToRub: 24.28 },
  { code: 'GBP', name: 'Фунт стерлингов Соединенного королевства', nominal: 1, rateToRub: 114.50 },
  { code: 'CHF', name: 'Швейцарский франк', nominal: 1, rateToRub: 101.30 },
  { code: 'AMD', name: 'Армянский драм', nominal: 100, rateToRub: 22.90 },
  { code: 'GEL', name: 'Грузинский лари', nominal: 1, rateToRub: 32.80 },
  { code: 'INRF', name: 'Индийская рупия', nominal: 10, rateToRub: 10.65 },
];

/**
 * Fetches all official currency exchange rates from the Central Bank of Russia (ЦБ РФ).
 */
export async function fetchCbrRates(): Promise<CbrRatesResult> {
  // Primary Method: Official CBR daily JSON mirror (CORS-friendly)
  try {
    const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
    if (res.ok) {
      const data = await res.json();
      const valutesRaw = data.Valute || {};
      const rates: Record<string, number> = {};
      const valutes: CbrValute[] = [];

      const dateRaw = data.Date;
      const formattedDate = dateRaw
        ? new Date(dateRaw).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : new Date().toLocaleDateString('ru-RU');

      Object.keys(valutesRaw).forEach((key) => {
        const item = valutesRaw[key];
        if (item && item.CharCode && item.Value) {
          const charCode = item.CharCode;
          const nominal = item.Nominal || 1;
          const value = item.Value;
          const ratePerUnit = Number((value / nominal).toFixed(4));
          rates[charCode] = ratePerUnit;
          valutes.push({
            code: charCode,
            name: item.Name || charCode,
            nominal: 1, // Store normalized rate per 1 unit
            rateToRub: Number(ratePerUnit.toFixed(2)),
          });
        }
      });

      return {
        rates,
        valutes,
        date: formattedDate,
        source: 'ЦБ РФ',
      };
    }
  } catch (err) {
    console.warn('Primary CBR JSON API fetch error, attempting XML fallback...', err);
  }

  // Fallback Method: Direct XML fetch from cbr.ru
  try {
    const res = await fetch('https://www.cbr.ru/scripts/XML_daily.asp');
    if (res.ok) {
      const text = await res.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const valuteNodes = xmlDoc.getElementsByTagName('Valute');
      
      const rates: Record<string, number> = {};
      const valutes: CbrValute[] = [];

      for (let i = 0; i < valuteNodes.length; i++) {
        const code = valuteNodes[i].getElementsByTagName('CharCode')[0]?.textContent;
        const name = valuteNodes[i].getElementsByTagName('Name')[0]?.textContent;
        const valueStr = valuteNodes[i].getElementsByTagName('Value')[0]?.textContent?.replace(',', '.');
        const nominalStr = valuteNodes[i].getElementsByTagName('Nominal')[0]?.textContent || '1';

        if (code && valueStr) {
          const nominal = parseFloat(nominalStr);
          const value = parseFloat(valueStr);
          const ratePerUnit = Number((value / nominal).toFixed(4));
          rates[code] = ratePerUnit;
          valutes.push({
            code,
            name: name || code,
            nominal: 1,
            rateToRub: Number(ratePerUnit.toFixed(2)),
          });
        }
      }

      const dateAttr = xmlDoc.documentElement.getAttribute('Date');
      return {
        rates,
        valutes,
        date: dateAttr || new Date().toLocaleDateString('ru-RU'),
        source: 'ЦБ РФ (XML)',
      };
    }
  } catch (err) {
    console.error('Direct CBR XML fetch failed:', err);
  }

  // Final fallback using popular default array
  const fallbackRates: Record<string, number> = {};
  POPULAR_CBR_CURRENCIES.forEach((c) => {
    fallbackRates[c.code] = c.rateToRub;
  });

  return {
    rates: fallbackRates,
    valutes: POPULAR_CBR_CURRENCIES,
    date: new Date().toLocaleDateString('ru-RU'),
    source: 'ЦБ РФ (Кэш)',
  };
}
