import type { FilterQuery, Model, PopulateOptions, SortOrder } from 'mongoose';

export function pagination(query: Record<string, unknown>) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

export async function paginate<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  query: Record<string, unknown>,
  options: {
    sort?: Record<string, SortOrder>;
    populate?: PopulateOptions | PopulateOptions[];
  } = {}
) {
  const { page, limit, skip } = pagination(query);
  const [items, total] = await Promise.all([
    model.find(filter).sort(options.sort ?? { createdAt: -1 }).skip(skip).limit(limit).populate(options.populate ?? []),
    model.countDocuments(filter)
  ]);

  return { items, total, page, pages: Math.ceil(total / limit) || 1 };
}

export function regex(value: unknown) {
  return typeof value === 'string' && value.trim() ? new RegExp(value.trim(), 'i') : undefined;
}
