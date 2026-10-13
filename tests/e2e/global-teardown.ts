import { admin, RUN_ID } from "./helpers";

// Removes the shared test users of this run and any older leftovers (a test that crashed before cleaning up).
export default async function teardown() {
  const old = Date.now() - 30 * 60 * 1000;
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    for (const u of data.users) {
      const isTest = !!u.email?.endsWith("@example.com");
      if (isTest && (u.email!.includes(`-${RUN_ID}-`) || new Date(u.created_at).getTime() < old)) await admin.auth.admin.deleteUser(u.id);
    }
    if (data.users.length < 200) break;
  }
}
