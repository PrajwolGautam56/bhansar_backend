import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Company from '../models/Company.js';

dotenv.config();

type Row = Record<string, string>;

const aliases: Record<string, string[]> = {
  name: ['company', 'company name', 'name', 'importer', 'importer name', 'consignee_name', 'consignee name'],
  eximCode: ['exim', 'exim code', 'exim_code', 'eximcode', 'consignee'],
  location: ['location', 'city', 'address'],
  district: ['district'],
  panNumber: ['pan', 'pan number', 'vat', 'vat number'],
  products: ['products', 'product', 'import products', 'imported products'],
  startDate: ['start date', 'start_date', 'from date', 'from', 'firstofasmt_date', 'first asmt date'],
  endDate: ['end date', 'end_date', 'to date', 'to', 'lastofasmt_date', 'last asmt date'],
  transactionAmount: ['transaction amount', 'amount', 'import amount', 'value', 'transaction_value', 'sumofcif_value', 'cif value'],
  currentServiceProvider: ['current service provider', 'service provider', 'clearing agent', 'agent'],
  notes: ['notes', 'remarks']
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(input: string) {
  const lines = input.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<Row>((row, header, index) => {
      row[header] = values[index] || '';
      return row;
    }, {});
  });
}

function get(row: Row, key: keyof typeof aliases) {
  for (const alias of aliases[key]) {
    const value = row[alias.toLowerCase()];
    if (value) return value.trim();
  }
  return '';
}

function parseAmount(value: string) {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDateValue(value: string) {
  const trimmed = value.trim();
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  }
  return trimmed || undefined;
}

function parseProducts(value: string) {
  return value
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function importCompanies(filePath: string) {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  const content = await fs.readFile(filePath, 'utf8');
  const rows = parseCsv(content);
  await mongoose.connect(process.env.MONGODB_URI);

  let imported = 0;
  let operations: Parameters<typeof Company.bulkWrite>[0] = [];

  for (const row of rows) {
    const name = get(row, 'name');
    const eximCode = get(row, 'eximCode');
    if (!name && !eximCode) continue;

    const products = parseProducts(get(row, 'products'));
    const amount = parseAmount(get(row, 'transactionAmount'));
    const startDate = get(row, 'startDate');
    const endDate = get(row, 'endDate');
    const transaction = amount || startDate || endDate
      ? {
          startDate: parseDateValue(startDate),
          endDate: parseDateValue(endDate),
          amount,
          currency: 'NPR',
          notes: get(row, 'notes')
        }
      : undefined;

    const filter = eximCode ? { eximCode } : { name };
    const update = {
      $set: {
        name: name || eximCode,
        eximCode,
        location: get(row, 'location'),
        district: get(row, 'district'),
        panNumber: get(row, 'panNumber'),
        currentServiceProvider: get(row, 'currentServiceProvider'),
        importProducts: products,
        importProductDetails: products.map((product) => ({ name: product }))
      },
      ...(transaction ? { $addToSet: { importTransactions: transaction } } : {})
    };

    operations.push({
      updateOne: {
        filter,
        update,
        upsert: true
      }
    });
    imported += 1;

    if (operations.length >= 500) {
      await Company.bulkWrite(operations, { ordered: false });
      operations = [];
    }
  }

  if (operations.length) {
    await Company.bulkWrite(operations, { ordered: false });
  }

  await mongoose.disconnect();
  console.log(`Imported ${imported} companies`);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: npm run import:companies -w server -- /path/to/companies.csv');
  process.exit(1);
}

importCompanies(filePath).catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
