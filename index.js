const express = require("express");
const bodyParser = require("body-parser");
const noblox = require("noblox.js");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

noblox.setOptions({ show_deprecation_warnings: false });

function authenticateRequest(req, res, next) {
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"];
  const validApiKey = process.env.API_KEY;

  if (!apiKey || apiKey !== validApiKey) {
    return res
      .status(401)
      .send({ Success: false, Errors: "invalid or missing API key" });
  }

  next();
}

async function startApp() {
  try {
    const cookie = process.env.cookie;
    const groupIdStr = process.env.GroupId;
    const apiKey = process.env.API_KEY;

    if (!cookie) {
      console.warn("ERROR: cookie environment variable is not set!");
      process.exit(1);
    }

    if (!groupIdStr) {
      console.warn("ERROR: GroupId environment variable is not set!");
      process.exit(1);
    }

    const groupId = parseInt(groupIdStr);
    if (isNaN(groupId) || !Number.isInteger(groupId) || groupId <= 0) {
      console.warn("ERROR: GroupId must be a valid positive integer!");
      console.warn(`Current value: "${groupIdStr}"`);
      process.exit(1);
    }

    if (!apiKey) {
      console.warn("ERROR: API_KEY environment variable is not set!");
      process.exit(1);
    }

    await noblox.setCookie(cookie);
    const currentUser = await noblox.getAuthenticatedUser();
    console.log(`Successfully logged in as: ${currentUser.name} (${currentUser.id})`,);
    console.log(`Managing group: ${groupId}`);
    console.log(`API authentication is enabled and protecting all endpoints`);
  } catch (err) {
    console.warn("Failed to authenticate with Roblox:", err.message);
    console.warn("Please check that your cookie is valid and not expired.");
    process.exit(1);
  }
}

app.post("/promote", authenticateRequest, async (req, res) => {
  const userId = parseInt(req.body.userID);
  const groupId = parseInt(process.env.GroupId);

  console.log(`request on /promote with userId ${userId}`);
  
  try {
    if (isNaN(userId) || !Number.isInteger(userId) || userId <= 0) {
      return res.status(400).send({
        Success: false,
        Errors: "provide a valid userId (positive int)",
      });
    }

    await noblox.promote(groupId, userId);
    console.log(`finished /promote with userId ${userId}`);
    res.status(200).send({ Success: true });
  } catch (err) {
    console.warn(`promote error for user ${userId}:`, err.message);
    res.status(500).send({ Success: false, Errors: err.message });
  }
});

app.post("/demote", authenticateRequest, async (req, res) => {
  const userId = parseInt(req.body.userID);
  const groupId = parseInt(process.env.GroupId);

  console.log(`request on /demote with userId ${userId}`);
  
  try {
    if (isNaN(userId) || !Number.isInteger(userId) || userId <= 0) {
      return res.status(400).send({
        Success: false,
        Errors: "provide a valid userId (positive int)",
      });
    }

    await noblox.demote(groupId, userId);
    console.log(`finished /demote with userId ${userId}`);
    res.status(200).send({ Success: true });
  } catch (err) {
    console.warn(`demote error for user ${userId}:`, err.message);
    res.status(500).send({ Success: false, Errors: err.message });
  }
});

app.get("/", (req, res) => {
  res.send({
    status: "Roblox Group Ranker API is running",
    endpoints: {
      "/promote": "POST with { userID: number }",
      "/demote": "POST with { userID: number }",
    },
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
  startApp();
});
