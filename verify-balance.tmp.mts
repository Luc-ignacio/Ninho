import { PrismaClient } from "/Users/luc.ignacio/1. Projects/2. Personal/ninho/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const accounts = await prisma.account.findMany({
  select: { id: true, name: true, currency: true,
    BalanceSnapshots: { orderBy: { date: "desc" }, take: 1 } },
});
console.log("accounts:", accounts.length);

const inputs = accounts.map(a => ({
  id: a.id, name: a.name,
  snapshotDate: a.BalanceSnapshots[0]?.date ?? null,
  snapshotCents: a.BalanceSnapshots[0] ? Math.round(Number(a.BalanceSnapshots[0].balance.toString())*100) : 0,
}));

if (inputs.length) {
  const [out, inn] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["originAccountId"],
      where: { OR: inputs.map(a => ({ originAccountId: a.id, ...(a.snapshotDate ? { date: { gte: a.snapshotDate } } : {}) })) },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["destinationAccountId"],
      where: { OR: inputs.map(a => ({ destinationAccountId: a.id, ...(a.snapshotDate ? { date: { gte: a.snapshotDate } } : {}) })) },
      _sum: { amount: true },
    }),
  ]);
  console.log("groupBy OK — outflow rows:", out.length, "inflow rows:", inn.length);
  for (const a of inputs) console.log(` ${a.name}: snapshot=${a.snapshotCents} date=${a.snapshotDate?.toISOString().slice(0,10)}`);
}
console.log("transactions in db:", await prisma.transaction.count());
await prisma.$disconnect();
