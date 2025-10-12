const express = require("express");
const fetch = require("node-fetch"); // install via npm
const app = express();
app.use(express.json());

const API_KEY = GgOcF4pTNUu9klw3ro3W7S79+yKrwu0kxtxymqsd8ZzJ1IlOZXlKaGJHY2lPaUpTVXpJMU5pSXNJbXRwWkNJNkluTnBaeTB5TURJeExUQTNMVEV6VkRFNE9qVXhPalE1V2lJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaGRXUWlPaUpTYjJKc2IzaEpiblJsY201aGJDSXNJbWx6Y3lJNklrTnNiM1ZrUVhWMGFHVnVkR2xqWVhScGIyNVRaWEoyYVdObElpd2lZbUZ6WlVGd2FVdGxlU0k2SWtkblQyTkdOSEJVVGxWMU9XdHNkek55YnpOWE4xTTNPU3Q1UzNKM2RUQnJlSFI0ZVcxeGMyUTRXbnBLTVVsc1R5SXNJbTkzYm1WeVNXUWlPaUl4TWpJMk9UZ3dPVEF3SWl3aVpYaHdJam94TnpZd01qZzNNVEk0TENKcFlYUWlPakUzTmpBeU9ETTFNamdzSW01aVppSTZNVGMyTURJNE16VXlPSDAuWWZLX0c4M2NkN0JpNnA2NGpzbDJsaWtTNTQ0anh0cWE3VmJjdzR4eEhTTFBwMjdiUXJuMFEyLVI1UlY0T3ZUSHlmbjZPNVF0eHNMYVlTRGZGdjZnRWJxM1hRSk9KR3hCUmpocFE0R1NucDNkbTNReHFwMXFrVjc1Vnk1OXh2SnNrcUVUZUlqU29uazN0aUc2aWVmSTNNUGJoWXZNWVNJbGVRVmZuQXc5WEQwWmFLREliamhCX3BieVNNT2Noc1k0SXZBR3dfOTBTd2RDbDIzN19TdXFwcHFzVGVOX0NLOERvMkhVWnh0UVlLbDdyQW05dnYzbERmbHRIOWdibENCbkVOLVVFNEFDWmhHZ0pMczk1dVVKdmxoRVRyS2ZhOG9ySmZTOUhtSENGV2twaUM2M21xQlM5TmZhZjMxb2NoTW5yOXUtYjh5UUc5Xzhta25XRXZPWkxB;
const GROUP_ID = 14890643; // replace with your group

// Promote endpoint
app.post("/promote", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).send("Missing userId");

    // Get memberships
    const membersRes = await fetch(`https://apis.roblox.com/cloud/groups/${GROUP_ID}/memberships?maxPageSize=200`, {
        headers: { "x-api-key": API_KEY }
    });
    const membersData = await membersRes.json();
    const member = membersData.groupMemberships.find(m => m.user.id == userId);
    if (!member) return res.status(404).send("User not found");

    const membershipId = member.path.split("/").pop();
    
    // Get roles
    const rolesRes = await fetch(`https://apis.roblox.com/cloud/groups/${GROUP_ID}/roles`, {
        headers: { "x-api-key": API_KEY }
    });
    const rolesData = await rolesRes.json();
    const roles = rolesData.roles.sort((a,b) => a.rank - b.rank);
    
    const currentRoleIndex = roles.findIndex(r => r.id === member.role.id);
    const nextRole = roles[currentRoleIndex+1];
    if (!nextRole) return res.status(400).send("Already highest rank");

    // Patch to promote
    const patchRes = await fetch(`https://apis.roblox.com/cloud/groups/${GROUP_ID}/memberships/${membershipId}`, {
        method: "PATCH",
        headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ roleId: nextRole.id })
    });

    res.send(await patchRes.json());
});

// Demote endpoint
app.post("/demote", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).send("Missing userId");

    const membersRes = await fetch(`https://apis.roblox.com/cloud/groups/${GROUP_ID}/memberships?maxPageSize=200`, {
        headers: { "x-api-key": API_KEY }
    });
    const membersData = await membersRes.json();
    const member = membersData.groupMemberships.find(m => m.user.id == userId);
    if (!member) return res.status(404).send("User not found");

    const membershipId = member.path.split("/").pop();

    const rolesRes = await fetch(`https://apis.roblox.com/cloud/groups/${GROUP_ID}/roles`, {
        headers: { "x-api-key": API_KEY }
    });
    const rolesData = await rolesRes.json();
    const roles = rolesData.roles.sort((a,b) => a.rank - b.rank);

    const currentRoleIndex = roles.findIndex(r => r.id === member.role.id);
    const prevRole = roles[currentRoleIndex-1];
    if (!prevRole) return res.status(400).send("Already lowest rank");

    const patchRes = await fetch(`https://apis.roblox.com/cloud/groups/${GROUP_ID}/memberships/${membershipId}`, {
        method: "PATCH",
        headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ roleId: prevRole.id })
    });

    res.send(await patchRes.json());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));