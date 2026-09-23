import { test, expect } from "@playwright/test";

const rolePassword = process.env.ROLE_FIXTURE_PASSWORD;
async function openAs(browser, viewport={width:1440,height:960}) {
  const context=await browser.newContext({viewport,geolocation:{latitude:5.6037,longitude:-0.1870},permissions:["geolocation"]});
  const page=await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill("manager@ceac.local.test");
  await page.getByPlaceholder("Password").fill(rolePassword);
  await page.getByRole("button",{name:"Sign in"}).click();
  await expect(page.locator(".manager-app")).toBeVisible({timeout:15000});
  return {context,page};
}
test.describe("Premium redesign R2 Manager",()=>{
  test("Manager Overview is a command centre",async({browser})=>{
    const {context,page}=await openAs(browser);
    await expect(page.locator(".manager-command-surface")).toBeVisible();
    await expect(page.getByText("Decisions first.",{exact:false})).toBeVisible();
    await expect(page.getByRole("button",{name:"Give out work",exact:true})).toBeVisible();
    await page.screenshot({path:"test-artifacts/redesign-r2-manager-overview.png",fullPage:true});
    await context.close();
  });
  test("Manager Work exposes delegation views",async({browser})=>{
    const {context,page}=await openAs(browser);
    await page.locator(".premium-side").getByRole("button",{name:"Work",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Work",exact:true})).toBeVisible();
    for (const label of ["Given out","Needs review","Team work","Mine"]) {
      await expect(page.getByRole("tab",{name:new RegExp(label)})).toBeVisible();
    }
    await page.screenshot({path:"test-artifacts/redesign-r2-manager-work.png",fullPage:true});
    await context.close();
  });
  test("Manager Team and person remain contextual",async({browser})=>{
    const {context,page}=await openAs(browser);
    await page.locator(".premium-side").getByRole("button",{name:"Team",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Your team",exact:true})).toBeVisible();
    await expect(page.getByRole("button",{name:/Unit Room/})).toBeVisible();
    const person=page.locator(".row").filter({hasText:"Staff Fixture"}).first();
    if(await person.count()) {
      await person.click();
      await expect(page.locator(".manager-person-detail")).toBeVisible();
    }
    await page.screenshot({path:"test-artifacts/redesign-r2-manager-team.png",fullPage:true});
    await context.close();
  });
  test("Manager mobile remains within viewport",async({browser})=>{
    const {context,page}=await openAs(browser,{width:390,height:844});
    await expect(page.locator(".premium-tabs")).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({path:"test-artifacts/redesign-r2-manager-mobile.png",fullPage:true});
    await context.close();
  });
});
