import { test, expect, type Page } from "@playwright/test";
const suffix = () => `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
async function login(page: Page, username = "admin") {
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill("TechNotes123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dash$/);
}
async function createNote(page: Page, title: string, assignee?: string) {
  await page.goto("/dash/notes/new");
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page
    .getByLabel("Description")
    .fill("Inspect, repair and record the result.");
  if (assignee)
    await page.getByLabel("Assigned to").selectOption({ label: assignee });
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page).toHaveURL(/\/dash\/notes$/);
}
test("protected routes, invalid login, persisted session and logout", async ({
  page,
}) => {
  await page.goto("/dash/notes");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Username", { exact: true }).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Invalid username or password",
  );
  await page.getByLabel("Password", { exact: true }).fill("TechNotes123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dash\/notes$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Service notes", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dash/notes");
  await expect(page).toHaveURL(/\/login$/);
});
test("Admin completes the note create/edit/filter/delete lifecycle", async ({
  page,
}) => {
  await login(page);
  const title = `Oil service ${suffix()}`;
  await createNote(page, title, "employee");
  let row = page.getByRole("row").filter({ hasText: title });
  await expect(row).toBeVisible();
  await row.getByRole("link", { name: /Edit note/ }).click();
  await page.getByLabel("Title", { exact: true }).fill(`${title} done`);
  await page.getByLabel("Completed", { exact: true }).check();
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page).toHaveURL(/\/dash\/notes$/);
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("completed");
  await page.getByLabel("Search notes").fill(title);
  row = page.getByRole("row").filter({ hasText: title });
  await expect(row).toContainText("Completed");
  await row.getByRole("link", { name: /Edit note/ }).click();
  await page.getByRole("button", { name: "Delete note", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm delete", exact: true })
    .click();
  await expect(page.getByRole("row").filter({ hasText: title })).toHaveCount(0);
});
test("user lifecycle includes role change, deactivation, password change and deletion", async ({
  page,
}) => {
  await login(page);
  const username = `staff-${suffix()}`;
  await page.goto("/dash/users/new");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill("StaffPass123!");
  await page.getByRole("button", { name: "Save user" }).click();
  let row = page.getByRole("row").filter({ hasText: username });
  await row.getByRole("link", { name: `Edit user ${username}` }).click();
  await page.getByLabel("Manager", { exact: true }).check();
  await page.getByLabel("Active account").uncheck();
  await page.getByLabel("New password (optional)").fill("ChangedPass123!");
  await page.getByRole("button", { name: "Save user" }).click();
  row = page.getByRole("row").filter({ hasText: username });
  await expect(row).toContainText("Inactive");
  await expect(row).toContainText("Manager");
  await row.getByRole("link", { name: `Edit user ${username}` }).click();
  await page.getByRole("button", { name: "Delete user", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm delete", exact: true })
    .click();
  await expect(page.getByRole("row").filter({ hasText: username })).toHaveCount(
    0,
  );
});
test("employee can create/complete own notes and is denied staff administration", async ({
  page,
}) => {
  await login(page, "employee");
  await expect(
    page.getByRole("link", { name: "Team members", exact: true }),
  ).toHaveCount(0);
  await page.goto("/dash/users");
  await expect(page).toHaveURL(/\/dash\/notes$/);
  const title = `Employee task ${suffix()}`;
  await createNote(page, title);
  const row = page.getByRole("row").filter({ hasText: title });
  await row.getByRole("link", { name: /Edit note/ }).click();
  await expect(
    page.getByRole("button", { name: "Delete note", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Completed", { exact: true }).check();
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByRole("row").filter({ hasText: title })).toContainText(
    "Completed",
  );
  const response = await page.request.get("/api/users");
  expect(response.status()).toBe(403);
});
test("Manager can manage normal staff but cannot grant Admin access", async ({
  page,
}) => {
  await login(page, "manager");
  await page.goto("/dash/users/new");
  await expect(page.getByLabel("Admin", { exact: true })).toHaveCount(0);
  const response = await page.request.post("/api/users", {
    data: {
      username: `escalation-${suffix()}`,
      password: "TechNotes123!",
      roles: ["Admin"],
    },
  });
  expect(response.status()).toBe(403);
});
test("API failures offer retry and workspace fits the viewport", async ({
  page,
}) => {
  await login(page);
  await page.route("**/api/notes", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Service temporarily unavailable." }),
    }),
  );
  await page.goto("/dash/notes");
  await expect(page.getByRole("alert")).toContainText(
    "Service temporarily unavailable",
  );
  await page.unroute("**/api/notes");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: "Service notes", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
