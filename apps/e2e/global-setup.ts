import { Client } from 'pg';

export default async function globalSetup() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Truncate in an order that satisfies FK constraints, or use CASCADE.
  await client.query(`
    TRUNCATE
      votes,
      group_invitations,
      group_memberships,
      arguments,
      debates,
      groups,
      users
    RESTART IDENTITY CASCADE
  `);

  await client.end();
}
