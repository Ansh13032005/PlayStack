export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const getPaginationOptions = (query: Record<string, unknown>): PaginationOptions => {
  const page = Math.max(1, parseInt(String(query['page'] || 1)));
  const limit = Math.min(100, Math.max(1, parseInt(String(query['limit'] || 10))));
  return { page, limit };
};

export const buildPaginationResult = (
  total: number,
  options: PaginationOptions
): PaginationResult => {
  const totalPages = Math.ceil(total / options.limit);
  return {
    total,
    page: options.page,
    limit: options.limit,
    totalPages,
    hasNextPage: options.page < totalPages,
    hasPrevPage: options.page > 1,
  };
};
