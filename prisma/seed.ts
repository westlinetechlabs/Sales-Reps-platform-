import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("demo1234", 10);

  // Create owner
  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: {},
    create: {
      name: "Sarah Johnson",
      email: "owner@demo.com",
      password,
      role: "OWNER",
      phone: "+1 555 100 0000",
      region: "HQ",
    },
  });

  // Create sales reps
  const rep1 = await prisma.user.upsert({
    where: { email: "rep1@demo.com" },
    update: {},
    create: {
      name: "Marcus Rivera",
      email: "rep1@demo.com",
      password,
      role: "SALES_REP",
      phone: "+1 555 200 0001",
      region: "North East",
    },
  });

  const rep2 = await prisma.user.upsert({
    where: { email: "rep2@demo.com" },
    update: {},
    create: {
      name: "Priya Patel",
      email: "rep2@demo.com",
      password,
      role: "SALES_REP",
      phone: "+1 555 200 0002",
      region: "South West",
    },
  });

  const rep3 = await prisma.user.upsert({
    where: { email: "rep3@demo.com" },
    update: {},
    create: {
      name: "Jake Thompson",
      email: "rep3@demo.com",
      password,
      role: "SALES_REP",
      phone: "+1 555 200 0003",
      region: "Midwest",
    },
  });

  console.log("Created users:", { owner: owner.name, rep1: rep1.name, rep2: rep2.name, rep3: rep3.name });

  // Customers for rep1
  const c1 = await prisma.customer.upsert({
    where: { id: "c1" },
    update: {},
    create: {
      id: "c1",
      name: "Alice Cooper",
      email: "alice@techcorp.com",
      phone: "+1 555 300 0001",
      company: "TechCorp Inc",
      city: "New York",
      status: "CUSTOMER",
      value: 25000,
      repId: rep1.id,
    },
  });

  const c2 = await prisma.customer.upsert({
    where: { id: "c2" },
    update: {},
    create: {
      id: "c2",
      name: "Bob Martinez",
      email: "bob@startup.io",
      phone: "+1 555 300 0002",
      company: "Startup.io",
      city: "Boston",
      status: "PROSPECT",
      value: 12000,
      repId: rep1.id,
    },
  });

  const c3 = await prisma.customer.upsert({
    where: { id: "c3" },
    update: {},
    create: {
      id: "c3",
      name: "Carol White",
      email: "carol@enterprise.com",
      phone: "+1 555 300 0003",
      company: "Enterprise Ltd",
      city: "Philadelphia",
      status: "LEAD",
      value: 50000,
      repId: rep1.id,
    },
  });

  // Customers for rep2
  const c4 = await prisma.customer.upsert({
    where: { id: "c4" },
    update: {},
    create: {
      id: "c4",
      name: "David Kim",
      email: "david@globaltech.com",
      phone: "+1 555 300 0004",
      company: "GlobalTech",
      city: "Los Angeles",
      status: "CUSTOMER",
      value: 35000,
      repId: rep2.id,
    },
  });

  const c5 = await prisma.customer.upsert({
    where: { id: "c5" },
    update: {},
    create: {
      id: "c5",
      name: "Emma Davis",
      email: "emma@cloudco.com",
      company: "CloudCo",
      city: "San Diego",
      status: "PROSPECT",
      value: 18000,
      repId: rep2.id,
    },
  });

  // Customers for rep3
  const c6 = await prisma.customer.upsert({
    where: { id: "c6" },
    update: {},
    create: {
      id: "c6",
      name: "Frank Wilson",
      email: "frank@midwest.biz",
      company: "Midwest Business",
      city: "Chicago",
      status: "CUSTOMER",
      value: 22000,
      repId: rep3.id,
    },
  });

  console.log("Created customers");

  // Deals for rep1
  await prisma.deal.upsert({
    where: { id: "d1" },
    update: {},
    create: {
      id: "d1",
      title: "TechCorp Annual License",
      value: 25000,
      stage: "CLOSED_WON",
      probability: 100,
      repId: rep1.id,
      customerId: c1.id,
    },
  });

  await prisma.deal.upsert({
    where: { id: "d2" },
    update: {},
    create: {
      id: "d2",
      title: "Startup.io Team Plan",
      value: 12000,
      stage: "PROPOSAL",
      probability: 50,
      repId: rep1.id,
      customerId: c2.id,
    },
  });

  await prisma.deal.upsert({
    where: { id: "d3" },
    update: {},
    create: {
      id: "d3",
      title: "Enterprise Ltd Platform",
      value: 50000,
      stage: "QUALIFICATION",
      probability: 25,
      repId: rep1.id,
      customerId: c3.id,
    },
  });

  // Deals for rep2
  await prisma.deal.upsert({
    where: { id: "d4" },
    update: {},
    create: {
      id: "d4",
      title: "GlobalTech Integration",
      value: 35000,
      stage: "CLOSED_WON",
      probability: 100,
      repId: rep2.id,
      customerId: c4.id,
    },
  });

  await prisma.deal.upsert({
    where: { id: "d5" },
    update: {},
    create: {
      id: "d5",
      title: "CloudCo Migration",
      value: 18000,
      stage: "NEGOTIATION",
      probability: 75,
      repId: rep2.id,
      customerId: c5.id,
    },
  });

  // Deals for rep3
  await prisma.deal.upsert({
    where: { id: "d6" },
    update: {},
    create: {
      id: "d6",
      title: "Midwest Business Suite",
      value: 22000,
      stage: "CLOSED_WON",
      probability: 100,
      repId: rep3.id,
      customerId: c6.id,
    },
  });

  console.log("Created deals");

  // Activities
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const twoDaysAgo = new Date(now); twoDaysAgo.setDate(now.getDate() - 2);

  const activityData = [
    { id: "a1", type: "CALL", title: "Discovery call with Alice", date: yesterday, duration: 30, outcome: "Very interested, scheduled demo", repId: rep1.id, customerId: c1.id },
    { id: "a2", type: "DEMO", title: "Product demo for Startup.io", date: now, duration: 60, outcome: "Positive feedback, sending proposal", repId: rep1.id, customerId: c2.id },
    { id: "a3", type: "EMAIL", title: "Follow-up email to Enterprise Ltd", date: twoDaysAgo, repId: rep1.id, customerId: c3.id },
    { id: "a4", type: "MEETING", title: "Contract negotiation with GlobalTech", date: yesterday, duration: 90, outcome: "Deal signed!", repId: rep2.id, customerId: c4.id },
    { id: "a5", type: "CALL", title: "Pricing discussion with CloudCo", date: now, duration: 45, repId: rep2.id, customerId: c5.id },
    { id: "a6", type: "VISIT", title: "On-site visit to Midwest Business", date: twoDaysAgo, duration: 120, outcome: "Great relationship building", repId: rep3.id, customerId: c6.id },
  ];
  for (const a of activityData) {
    await prisma.activity.upsert({
      where: { id: a.id },
      update: {},
      create: a,
    });
  }

  console.log("Created activities");

  // Set targets for current month
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await prisma.target.upsert({
    where: { repId_month_year: { repId: rep1.id, month, year } },
    update: {},
    create: { repId: rep1.id, month, year, revenue: 60000, deals: 3, calls: 30, meetings: 10 },
  });

  await prisma.target.upsert({
    where: { repId_month_year: { repId: rep2.id, month, year } },
    update: {},
    create: { repId: rep2.id, month, year, revenue: 50000, deals: 2, calls: 25, meetings: 8 },
  });

  await prisma.target.upsert({
    where: { repId_month_year: { repId: rep3.id, month, year } },
    update: {},
    create: { repId: rep3.id, month, year, revenue: 40000, deals: 2, calls: 20, meetings: 6 },
  });

  console.log("Created targets");
  console.log("\n✅ Seed complete!");
  console.log("Login credentials (password: demo1234):");
  console.log("  Owner:  owner@demo.com");
  console.log("  Rep 1:  rep1@demo.com");
  console.log("  Rep 2:  rep2@demo.com");
  console.log("  Rep 3:  rep3@demo.com");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
