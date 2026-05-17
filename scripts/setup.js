const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "private", "data");
const infoPath = path.join(dataDir, "info.json");
const applyPath = path.join(dataDir, "apply.csv");
const appliedPath = path.join(dataDir, "applied.csv");

if (fs.existsSync(infoPath) && fs.existsSync(applyPath) && fs.existsSync(appliedPath)) process.exit(0);

const skeleton = {
  "personal info": {
    "first name": "",
    "last name": "",
    "contact info": {
      email: "",
      "country code": "",
      phone: "",
      linkedIn: "",
      website: "",
      github: "",
    },
    address: {
      street: "",
      apt: "",
      city: "",
      state: "",
      "zip code": "",
      country: "",
      county: "",
    },
  },
  "school info": [
    {
      "school name": "",
      degree: "",
      major: "",
      "start month": "",
      "start year": "",
      "graduation month": "",
      "graduation year": "",
    },
  ],
  experience: [
    {
      "job title": "",
      company: "",
      location: "",
      "current job": false,
      "start month": "",
      "start year": "",
      "end month": null,
      "end year": null,
      "role description": [],
    },
  ],
  languages: [
    {
      language: "",
      fluent: false,
      reading: "",
      "reading / speaking / writing": "",
      speaking: "",
      writing: "",
      proficiency: "",
    },
  ],
  attachments: {
    resume: "",
    "cover letter": "",
  },
  "equal employment opportunity info": {
    gender: "",
    ethnicity: "",
    race: "",
    "veteran status": "",
    "disability status": "",
  },
  "work authorization": {
    "Are you currently authorized to work in the United States?": "",
    "Will you now or in the future require sponsorship for employment visa status (e.g., H-1B visa status)?": "",
    citizenship: "",
  },
};

fs.mkdirSync(dataDir, { recursive: true });

if (!fs.existsSync(infoPath)) {
  fs.writeFileSync(infoPath, JSON.stringify(skeleton, null, 4), "utf-8");
  console.log("Created private/data/info.json");
}

if (!fs.existsSync(applyPath)) {
  fs.writeFileSync(applyPath, "Link,Notes\n", "utf-8");
  console.log("Created private/data/apply.csv");
}

if (!fs.existsSync(appliedPath)) {
  fs.writeFileSync(appliedPath, "Time & Date,Company,Position,Status,Link,Notes\n", "utf-8");
  console.log("Created private/data/applied.csv");
}
