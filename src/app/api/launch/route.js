import { chromium } from "playwright";

export const runtime = "nodejs";

async function askModel(page, message) {
  await page.evaluate((text) => navigator.clipboard.writeText(text), message);
  await page.keyboard.press("Meta+V");
  await new Promise((r) => setTimeout(r, 2000));
  await page.keyboard.press("Enter");
  await page.waitForSelector('button[aria-label="Send message"]');

  await page.keyboard.type("Hi");
  await page.keyboard.press("Enter");
  await page.waitForSelector('button[aria-label="Send message"]');

  await page.getByRole('button', { name: 'Copy code' }).click();
  const codeText = await page.evaluate(() => navigator.clipboard.readText());
  console.log(codeText);
}

const message = "Job: https://wd1.myworkdaysite.com/en-US/recruiting/onto/onto_careers/job/Bloomington-MN/Software-QA-Engineer-Intermship_R-5708-1?source=LinkedInn" +
"I just opened a link to a job. I am using Playwright to apply to it and I need your help in deciding what my next actions should be to completing this job application. Tell me what buttons I need to press to move on and the information I need to input. Give me the javascript playwright code only!\n" +
"\n" +
"=== MAIN PAGE ===\n" +
"- link \"Skip to main content\":\n" +
"  - /url: \"\"\n" +
"- banner:\n" +
"  - link \"careers home\":\n" +
"    - /url: https://ontoinnovation.com/company/careersn" +
"    - img \"careers home\"\n" +
"  - heading \"Careers at ONTO\" [level=1]\n" +
"  - button \"Sign In\"\n" +
"  - navigation:\n" +
"    - button \"Careers Home\"\n" +
"    - button \"Search for Jobs\"\n" +
"    - button \"Introduce Yourself\"\n" +
"- alert: Software QA Engineer Internship page is loaded\n" +
"- heading \"Software QA Engineer Internship\" [level=2]\n" +
"- button \"Apply\"\n" +
"- term: locations\n" +
"- definition: Bloomington-MN\n" +
"- term: time type\n" +
"- definition: Full time\n" +
"- term: posted on\n" +
"- definition: Posted 7 Days Ago\n" +
"- term: job requisition id\n" +
"- definition: R-5708\n" +
"- paragraph: \"Onto Innovation is a leader in process control, combining global scale with an expanded portfolio of leading-edge technologies that include: 3D metrology spanning the chip from nanometer-scale transistors to micron-level die-interconnects; macro defect inspection of wafers and packages; metal interconnect composition; factory analytics; and lithography for advanced semiconductor packaging. Our breadth of offerings across the entire semiconductor value chain helps our customers solve their most difficult yield, device performance, quality, and reliability issues. Onto Innovation strives to optimize customers’ critical path of progress by making them smarter, faster and more efficient.\"\n" +
"- paragraph\n" +
"- paragraph: Job Summary & Responsibilities\n" +
"- paragraph\n" +
"- paragraph: The Software QA Intern will support the quality and reliability of the XTool suite of applications used in semiconductor inspection systems. This role focuses on expanding and enhancing test automation to accelerate software testing cycles and improve defect detection earlier in development.\n" +
"- paragraph: The intern will apply programming and software engineering skills to integrate existing test automation with Microsoft Copilot, improving test execution efficiency, failure analysis, and defect reporting. This position offers hands-on exposure to modern QA practices, including the practical use of generative AI within a real-world semiconductor manufacturing environment.\n" +
"- paragraph\n" +
"- paragraph: Qualifications\n" +
"- list:\n" +
"  - listitem:\n" +
"    - paragraph: Currently pursuing a Bachelor’s degree in Computer Science, Software Engineering, Computer Engineering, or a related field.\n" +
"  - listitem:\n" +
"    - paragraph: Programming experience in one or more languages such as Python, C#, Java, or JavaScript (academic or project experience acceptable).\n" +
"  - listitem:\n" +
"    - paragraph: Interest in software quality assurance, test automation, and DevOps practices.\n" +
"  - listitem:\n" +
"    - paragraph: Basic understanding of software development lifecycle concepts.\n" +
"  - listitem:\n" +
"    - paragraph: Strong analytical and problem-solving skills with attention to detail.\n" +
"  - listitem:\n" +
"    - paragraph: Ability to clearly document issues and communicate findings to technical team members.\n" +
"  - listitem:\n" +
"    - paragraph: Interest in learning how software engineering supports semiconductor manufacturing systems.\n" +
"- paragraph\n" +
"- paragraph: Why Join Onto Innovation?\n" +
"- paragraph\n" +
"- paragraph: At Onto Innovation, we believe your work should matter—and so should your well-being. That’s why we offer competitive salaries and a comprehensive benefits package designed to support you and your family. From health, dental, and vision coverage to life and disability insurance, PTO, and a 401(k) with employer match, we’ve got you covered. You’ll also enjoy access to our Employee Stock Purchase Program (ESPP), wellness initiatives, and cutting-edge tools—all within a collaborative, inclusive culture where your contributions are valued and recognized.\n" +
"- paragraph\n" +
"- paragraph: Compensation & Growth\n" +
"- paragraph\n" +
"- paragraph: \"• Base Salary Range:\"\n" +
"- text: $ - $, offered in good faith and based on experience, location, and qualifications.\n" +
"- paragraph\n" +
"- list:\n" +
"  - listitem:\n" +
"    - paragraph: \"Additional Rewards: Annual bonus opportunities and potential long-term incentives tied to both company and individual success.\"\n" +
"- paragraph\n" +
"- paragraph: \"Empowering Every Voice to Shape the Future:\"\n" +
"- paragraph\n" +
"- paragraph: Onto Innovation is committed to creating a workplace where every qualified candidate has an equal opportunity to succeed. We evaluate applicants based on skills, experience, and potential - without regard to race, color, religion, gender, sexual orientation, national origin, age, disability, veteran status, or any other characteristic protected by law. We believe diversity of thought and background drives innovation and strengthens our team.\n" +
"- paragraph\n" +
"- paragraph: Important Note on Export Compliance\n" +
"- paragraph: For certain positions requiring access to technical data, U.S. export licensing review may be necessary for applicants who are not U.S. Citizens, Permanent Residents, or other protected persons under 8 U.S.C. 1324b(a)(3).\n" +
"- heading \"About Us\" [level=3]\n" +
"- img \"Logo\"\n" +
"- button \"Read More\"\n" +
"- heading \"Follow Us\" [level=4]\n" +
"- list:\n" +
"  - listitem:\n" +
"    - link \"Facebook\":\n" +
"      - /url: https://www.facebook.com/ontoinnovationn" +
"  - listitem:\n" +
"    - link \"LinkedIn\":\n" +
"      - /url: https://www.linkedin.com/company/onto-innovationn" +
"- link \"Privacy Policy\":\n" +
"  - /url: https://ontoinnovation.com/privacyn" +
"- text: © 2026 Workday, Inc. All rights reserved.";

export async function POST() {
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  await page.goto("https://gemini.google.com/app");
  await new Promise((r) => setTimeout(r, 2000));

  await askModel(page, message);

  return Response.json({ ok: true });
}
