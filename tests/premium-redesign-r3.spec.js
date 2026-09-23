import { test, expect } from "@playwright/test";

const password=process.env.ROLE_FIXTURE_PASSWORD;
async function openAdmin(browser,viewport={width:1440,height:960}){
  const context=await browser.newContext({viewport,geolocation:{latitude:5.6037,longitude:-0.1870},permissions:["geolocation"]});
  const page=await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("admin@ceac.local.test");
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button",{name:"Sign in"}).click();
  await expect(page.locator(".office-app")).toBeVisible({timeout:15000});
  return {context,page};
}
test.describe("Premium redesign R3 Administration",()=>{
  test("Overview is an organisation operations console",async({browser})=>{
    const {context,page}=await openAdmin(browser);
    await expect(page.locator(".admin-command-surface")).toBeVisible();
    await expect(page.getByText("Need your action",{exact:true})).toBeVisible();
    await page.screenshot({path:"test-artifacts/redesign-r3-admin-overview.png",fullPage:true});
    await context.close();
  });
  test("Admin Work exposes delegated, review and organisation views",async({browser})=>{
    const {context,page}=await openAdmin(browser);
    await page.goto("/?tab=work");
    await expect(page.locator(".admin-work")).toBeVisible();
    await expect(page.getByRole("heading",{name:"Work",exact:true})).toBeVisible();
    for(const label of ["Given out","Needs review","Organisation","Mine"]) await expect(page.getByRole("tab",{name:new RegExp(label)})).toBeVisible();
    await page.screenshot({path:"test-artifacts/redesign-r3-admin-work.png",fullPage:true});
    await context.close();
  });
  test("People remains the flagship employee workspace",async({browser})=>{
    const {context,page}=await openAdmin(browser);
    await page.locator(".premium-side").getByRole("button",{name:"People",exact:true}).click();
    await expect(page.getByRole("heading",{name:"People",exact:true})).toBeVisible();
    await expect(page.getByPlaceholder("Name, email, job title or unit")).toBeVisible();
    await page.screenshot({path:"test-artifacts/redesign-r3-admin-people.png",fullPage:true});
    await context.close();
  });
  test("Finance connects actual spend to Expenses",async({browser})=>{
    const {context,page}=await openAdmin(browser);
    await page.locator(".premium-side").getByRole("button",{name:"Finance",exact:true}).click();
    await page.getByRole("button",{name:"Money out",exact:true}).click();
    await expect(page.getByRole("button",{name:"Open Expenses",exact:true})).toBeVisible();
    await page.getByRole("button",{name:"Open Expenses",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Expenses",exact:true})).toBeVisible();
    await page.screenshot({path:"test-artifacts/redesign-r3-admin-expenses.png",fullPage:true});
    await context.close();
  });
  test("Control Center hides technical architecture behind human labels",async({browser})=>{
    const {context,page}=await openAdmin(browser);
    await page.locator(".premium-side").getByRole("button",{name:"Control Center",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Control Center",exact:true})).toBeVisible();
    await expect(page.getByText("Connected Apps",{exact:true})).toBeVisible();
    await expect(page.getByText("Access & permissions",{exact:true})).toBeVisible();
    await expect(page.getByText("System events",{exact:true})).toBeVisible();
    await page.screenshot({path:"test-artifacts/redesign-r3-admin-control-center.png",fullPage:true});
    await context.close();
  });
  test("Administration mobile stays within the viewport",async({browser})=>{
    const {context,page}=await openAdmin(browser,{width:390,height:844});
    await expect(page.locator(".premium-tabs")).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({path:"test-artifacts/redesign-r3-admin-mobile.png",fullPage:true});
    await context.close();
  });
});
