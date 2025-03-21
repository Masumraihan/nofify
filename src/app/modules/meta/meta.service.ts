import { USER_ROLE } from "../../enums";
import prisma from "../../shared/prisma";
import { TTokenUser } from "../../types/common";
import { PAYMENT_STATUS } from "../payment/payment.constant";

const getUsersChartData = async (query: Record<string, unknown>) => {
  let year = new Date().getFullYear();
  if (query.year) {
    year = Number(query.year);
  }

  // Step 1: Fetch all users created within the specified year
  const users = await prisma.user.findMany({
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
    select: {
      createdAt: true, // Fetch only the createdAt field
    },
  });

  // Step 2: Initialize an array for counting users per month
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

  const monthsUserCount = monthNames.map((month) => ({ month, userCount: 0 }));

  // Step 3: Count users per month
  users.forEach((user) => {
    const monthIndex = new Date(user.createdAt).getMonth(); // Get the month index (0-11)
    monthsUserCount[monthIndex].userCount += 1; // Increment the count for that month
  });

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
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
      assignTask: {
        addTask: {
          userId: user.id,
        },
      },
      isRedeemed: true,
    },
    _sum: {
      coin: true,
    },
  });

  //const subscription = await prisma.subscription.groupBy({
  //  by: ["createdAt"],
  //  where: {
  //    createdAt: {
  //      gte: new Date(`${year}-01-01T00:00:00.000Z`),
  //      lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
  //    },
  //    userId: user.id,
  //  },
  //});

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
    coin: 0,
  }));

  // Populate monthly revenue array
  result.forEach((entry) => {
    const monthIndex = new Date(entry.createdAt).getMonth(); // Extract month index
    const coin = entry?._sum?.coin || 0; // Get the revenue for the month
    monthsCoinCount[monthIndex].coin += coin;
  });

  console.log("monthsCoinCount", monthsCoinCount);
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
