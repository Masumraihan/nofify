import { TPaginationOptions } from "../types/pagination";

type IOptionResult = {
  page: number;
  skip: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
};

const calculatePagination = (option: TPaginationOptions): IOptionResult => {
  const page = Number(option.page) || 1;
  const limit = Number(option.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = option.sortBy || "createdAt";
  const sortOrder = option.sortOrder || "desc";

  return {
    page,
    skip,
    limit,
    sortBy,
    sortOrder,
  };
};
export const paginationHelper = {
  calculatePagination,
};
