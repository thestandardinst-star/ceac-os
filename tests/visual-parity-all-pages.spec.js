import { test, expect } from "@playwright/test";

const password=process.env.ROLE_FIXTURE_PASSWORD;

const roleRoutes={
  staff:{
    email:"staff@ceac.local.test",
    app:".staff-app",
    routes:[
      ["home","home"],["work","work"],["team","team"],["staff-calendar","calendar"],
      ["messages","messages"],["me","my-hub"],["record","record"],["announcements","announcements"],
      ["performance","performance"],["learning","learning"],["attendance","workforce"],
      ["assets","assets"],["compliance","compliance"]
    ]
  },
  manager:{
    email:"manager@ceac.local.test",
    app:".manager-app",
    routes:[
      ["home","home"],["work","work"],["team","team"],["projects","projects"],["calendar","calendar"],
      ["manager-finance","budget"],["manager-reports","reports"],["record","record"],["announcements","announcements"],
      ["strategy","strategy"],["delivery","delivery"],["workload","workload"],["performance","performance"],
      ["learning","learning"],["attendance","workforce"],["assets","assets"],["compliance","compliance"]
    ]
  },
  administration:{
    email:"admin@ceac.local.test",
    app:".office-app",
    routes:[
      ["home","home"],["people","people"],["work","work"],["attendance","workforce"],["finance","finance"],
      ["cost","expenses"],["reporting","reports"],["units","units"],["admin-projects","projects"],
      ["admin-calendar","calendar"],["lifecycle","lifecycle"],["protected-hr","protected-hr"],["audit","audit"],
      ["events","events"],["workflows","workflows"],["policies","policies"],["integrations","integrations"],
      ["authority","authority"],["office-settings","organisation-settings"],["settings","control-center"]
    ]
  },
  executive:{
    email:"exec@ceac.local.test",
    app:".executive-app",
    routes:[
      ["home","home"],["work","work"],["strategy","ministry"],["delivery","portfolio"],
      ["exec-organisation","organisation"],["exec-finance","finance"],["exec-reports","reports"]
    ]
  }
};

async function signIn(page,email,app){
  await page.goto("/");
  await page.getByPlaceholder("Work email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button",{name:"Sign in"}).click();
  await expect(page.locator(app)).toBeVisible({timeout:15000});
}

for(const [role,config] of Object.entries(roleRoutes)){
  test(role+" visual inventory",async({page})=>{
    test.setTimeout(120000);
    await page.setViewportSize({width:1440,height:960});
    await signIn(page,config.email,config.app);
    for(const [tab,label] of config.routes){
      const url=tab==="home"?"/":"/?tab="+encodeURIComponent(tab);
      await page.goto(url);
      await expect(page.locator(config.app)).toBeVisible({timeout:15000});
      await expect(page.locator(".app-content")).toBeVisible();
      await expect(page.locator(".body").first()).toBeVisible({timeout:15000});
      await page.waitForTimeout(250);
      await page.screenshot({path:"test-artifacts/visual-parity-"+role+"-"+label+".png",fullPage:true});
    }
  });
}
