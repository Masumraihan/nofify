import { USER_ROLE } from "../../enums";
import prisma from "../../shared/prisma";
import { TTokenUser } from "../../types/common";
import { PAYMENT_STATUS } from "../payment/payment.constant";

const getUsersChartData = async (query: Record<string, unknown>) => {
  let year = new Date().getFullYear();

  if (query.year) {
    year = Number(query.year);
  }

  // Step 1: Group users by month of the year they were created
  const result = await prisma.user.groupBy({
    by: ["createdAt"], // Group by createdAt field
    where: {
      isDelete: false,
      role: {
        not: USER_ROLE.SUPER_ADMIN,
      },
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`), // Start of the year
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`), // Start of the next year
      },
    },
    _count: {
      id: true, // Count the number of users
    },
    orderBy: {
      createdAt: "asc", // Order by creation date to maintain month sequence
    },
  });

  // Step 2: Prepare the data to match months
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Initialize the months array with 0 user count for each month
  const monthsUserCount = monthNames.map((month) => ({ month, userCount: 0 }));
  // Step 3: Populate the monthsUserCount array with the aggregated data
  result.forEach((entry: any) => {
    const monthIndex = entry.createdAt.getMonth(); // Get the month from createdAt
    const userCount = entry._count.id || 0; // User count for the given month

    // Assign the user count to the corresponding month in the array
    monthsUserCount[monthIndex] = {
      month: monthNames[monthIndex],
      userCount,
    };
  });

  // Step 4: Return the populated monthsUserCount array
  return monthsUserCount;
};

const getPaymentChartData = async (query: Record<string, unknown>) => {
  let year = new Date().getFullYear();

  if (query.year) {
    year = Number(query.year);
  }

  // Step 1: Group payments by month of the specified year
  const result = await prisma.payment.groupBy({
    by: ["createdAt"],
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`), // Start of the year
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`), // Start of the next year
      },
      status: PAYMENT_STATUS.PAID,
    },
    _sum: {
      amount: true, // Calculate total revenue
    },
  });

  // Step 2: Aggregate data by months
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Initialize monthly revenue array
  const monthsPaymentCount = Array.from({ length: 12 }, (_, i) => ({
    month: monthNames[i],
    revenue: 0,
  }));

  // Populate monthly revenue array
  result.forEach((entry) => {
    const monthIndex = new Date(entry.createdAt).getMonth(); // Extract month index
    const revenue = entry._sum.amount || 0; // Get the revenue for the month
    monthsPaymentCount[monthIndex].revenue += revenue;
  });

  return monthsPaymentCount;
};
const myEarningChartData = async (user: TTokenUser, query: Record<string, unknown>) => {
  let year = new Date().getFullYear();

  if (query.year) {
    year = Number(query.year);
  }

  // Step 1: Group payments by month of the specified year
  const result = await prisma.coins.groupBy({
    by: ["createdAt"],
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`), // Start of the year
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`), // Start of the next year
      },
      assignTask: {
        userId: user.id,
      },
    },
    _sum: {
      coin: true,
    },
  });

  // Step 2: Aggregate data by months
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Initialize monthly revenue array
  const monthsCoinCount = Array.from({ length: 12 }, (_, i) => ({
    month: monthNames[i],
    revenue: 0,
  }));

  // Populate monthly revenue array
  result.forEach((entry) => {
    const monthIndex = new Date(entry.createdAt).getMonth(); // Extract month index
    const revenue = entry._sum.coin || 0; // Get the revenue for the month
    monthsCoinCount[monthIndex].revenue += revenue;
  });

  return monthsCoinCount;
};

const metaCounts = async () => {
  const totalUserCount = await prisma.user.count({
    where: {
      role: USER_ROLE.USER,
    },
  });

  const totalRevenue = await prisma.payment.aggregate({
    where: {
      status: PAYMENT_STATUS.PAID,
    },
    _sum: {
      amount: true,
    },
  });

  const todayRevenue = await prisma.payment.aggregate({
    where: {
      status: PAYMENT_STATUS.PAID,
      createdAt: {
        gte: new Date(),
      },
    },
    _sum: {
      amount: true,
    },
  });

  const thisMonthRevenue = await prisma.payment.aggregate({
    where: {
      status: PAYMENT_STATUS.PAID,
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
    _sum: {
      amount: true,
    },
  });

  const thisYearRevenue = await prisma.payment.aggregate({
    where: {
      status: PAYMENT_STATUS.PAID,
      createdAt: {
        gte: new Date(new Date().getFullYear(), 0, 1),
      },
    },
    _sum: {
      amount: true,
    },
  });

  return {
    totalUsers: totalUserCount || 0,
    totalRevenue: totalRevenue._sum.amount || 0,
    todayRevenue: todayRevenue._sum.amount || 0,
    thisMonthRevenue: thisMonthRevenue._sum.amount || 0,
    thisYearRevenue: thisYearRevenue._sum.amount || 0,
  };
};

export const MetaServices = {
  getUsersChartData,
  getPaymentChartData,
  metaCounts,
  myEarningChartData,
};
