// index.js
const express = require("express");
const fetch = require("node-fetch"); // v2 for CommonJS
const app = express();
app.use(express.json());

const API_KEY = process.env.ROBLOX_API_KEY;
const GROUP_ID = 14890643; // Replace with your group ID

if (!API_KEY) {
    console.error("ROBLOX_API_KEY not set in environment variables");
    process.exit(1);
}

// Helper to get member
async function getMember(userId) {
    try {
        const res = await fetch(`https://apis.roblox.com/cloud/groups/${GROUP_ID}/memberships?maxPageSize=200`, {
            headers: { "x-api-key": API_KEY }
        });
        const data = await res.json();
        console.log("Members API response:", data);

        if (!data.groupMemberships) return null;
        return data.groupMemberships.find(m => m.user.id == userId);
    } catch (err) {
        console.error("Error fetching members:", err);
        return null;
    }
}

// Helper to get sorted roles
async function getRoles() {
    try {
        const res = await fetch(`https://apis.roblox.com/cloud/groups/${GROUP_ID}/roles`, {
            headers: { "x-api-key": API_KEY }
        });
        const data = await res.json();
        if (!data.roles) return [];
        return data.roles.sort((a, b) => a.rank - b.rank);
    } catch (err) {
        console.error("Error fetching roles:", err);
        return [];
    }
}

// Promote endpoint
app.post("/promote", async (req, res) => {
    try {
        console.log("Promote request received:", req.body);
        const { userId } = req.body;
        if (!userId) return res.status(400).send({ error: "Missing userId" });

        const member = await getMember(userId);
        if (!member) return res.status(404).send({ error: "User not found in group or API key invalid" });

        const roles = await getRoles();
        const currentIndex = roles.findIndex(r => r.id === member.role.id);
        if (currentIndex === -1) return res.status(500).send({ error: "Current role not found in roles list" });

        const nextRole = roles[currentIndex + 1];
        if (!nextRole) return res.status(400).send({ error: "Already highest rank" });

        const membershipId = member.path.split("/").pop();
        const patchRes = await fetch(`https://apis.roblox.com/cloud/groups/${GROUP_ID}/memberships/${membershipId}`, {
            method: "PATCH",
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ roleId: nextRole.id })
        });
        const patchData = await patchRes.json();
        res.send({ success: true, data: patchData });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err.message });
    }
});

// Demote endpoint
app.post("/demote", async (req, res) => {
    try {
        console.log("Demote request received:", req.body);
        const { userId } = req.body;
        if (!userId) return res.status(400).send({ error: "Missing userId" });

        const member = await getMember(userId);
        if (!member) return res.status(404).send({ error: "User not found in group or API key invalid" });

        const roles = await getRoles();
        const currentIndex = roles.findIndex(r => r.id === member.role.id);
        if (currentIndex === -1) return res.status(500).send({ error: "Current role not found in roles list" });

        const prevRole = roles[currentIndex - 1];
        if (!prevRole) return res.status(400).send({ error: "Already lowest rank" });

        const membershipId = member.path.split("/").pop();
        const patchRes = await fetch(`https://apis.roblox.com/cloud/groups/${GROUP_ID}/memberships/${membershipId}`, {
            method: "PATCH",
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ roleId: prevRole.id })
        });
        const patchData = await patchRes.json();
        res.send({ success: true, data: patchData });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));