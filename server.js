const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const HZR_HEADER = "𝕳𝖅𝕽𝟏⁹";

app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/location", async (req, res) => {
    try {
        const {
            id,
            latitude,
            longitude,
            accuracy,
            device,
            userAgent
        } = req.body;

        // Validate required data
        if (
            typeof id !== "string" ||
            !id.trim() ||
            typeof latitude !== "number" ||
            !Number.isFinite(latitude) ||
            typeof longitude !== "number" ||
            !Number.isFinite(longitude)
        ) {
            return res.status(400).json({
                success: false,
                whatsapp: false,
                message: "Invalid location data."
            });
        }

        const now = new Date();

        const receivedDate =
            String(now.getDate()).padStart(2, "0") +
            " " +
            now.toLocaleString("en-US", {
                month: "long"
            }) +
            " " +
            now.getFullYear();

        const receivedTime =
            String(now.getHours()).padStart(2, "0") +
            ":" +
            String(now.getMinutes()).padStart(2, "0") +
            ":" +
            String(now.getSeconds()).padStart(2, "0");

        const accuracyText =
            typeof accuracy === "number" && Number.isFinite(accuracy)
                ? accuracy.toFixed(1) + " m"
                : "Unknown";

        const deviceText =
            typeof device === "string" && device.trim()
                ? device.trim()
                : "Unknown";

        const mapsUrl =
            `https://maps.google.com/?q=${latitude},${longitude}`;

        const whatsappMessage = `
━━━━━━━━━━━━━━━━━━
${HZR_HEADER}
━━━━━━━━━━━━━━━━━━

📍 HZR LOCATION

🆔 ID
${id}

📱 DEVICE
${deviceText}

🌐 LOCATION
Latitude: ${latitude.toFixed(6)}
Longitude: ${longitude.toFixed(6)}
Accuracy: ${accuracyText}

🗺️ GOOGLE MAPS
${mapsUrl}

🕐 RECEIVED
${receivedDate}
${receivedTime}

━━━━━━━━━━━━━━━━━━
RECIEVED FROM HZR
━━━━━━━━━━━━━━━━━━
`.trim();

        console.log("\n================================");
        console.log("NEW HZR LOCATION");
        console.log("================================");
        console.log("ID:", id);
        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);
        console.log("Accuracy:", accuracyText);
        console.log("Device:", deviceText);
        console.log("User-Agent:", userAgent || "Unknown");
        console.log("================================");

        // WhatsApp configuration
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const recipientNumber = process.env.WHATSAPP_RECIPIENT_NUMBER;

        if (
            !accessToken ||
            !phoneNumberId ||
            !recipientNumber
        ) {
            console.error(
                "WhatsApp environment variables are missing."
            );

            return res.status(500).json({
                success: false,
                whatsapp: false,
                message: "WhatsApp is not configured on the server."
            });
        }

        // Send message through WhatsApp Cloud API
        const whatsappResponse = await fetch(
            `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: recipientNumber,
                    type: "text",
                    text: {
                        preview_url: true,
                        body: whatsappMessage
                    }
                })
            }
        );

        const whatsappData = await whatsappResponse.json();

        if (!whatsappResponse.ok) {
            console.error(
                "================================"
            );
            console.error("WHATSAPP API ERROR");
            console.error(
                JSON.stringify(whatsappData, null, 2)
            );
            console.error(
                "================================"
            );

            return res.status(502).json({
                success: false,
                whatsapp: false,
                message: "WhatsApp message was not sent.",
                error: whatsappData
            });
        }

        console.log(
            "================================"
        );
        console.log("WHATSAPP MESSAGE SENT");
        console.log(
            JSON.stringify(whatsappData, null, 2)
        );
        console.log(
            "================================\n"
        );

        return res.json({
            success: true,
            whatsapp: true,
            message: "Location sent successfully.",
            id: id
        });

    } catch (error) {
        console.error(
            "================================"
        );
        console.error("SERVER ERROR");
        console.error(error);
        console.error(
            "================================"
        );

        return res.status(500).json({
            success: false,
            whatsapp: false,
            message: "Server didn't respond."
        });
    }
});

// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Not Found"
    });
});

// Start server
app.listen(PORT, () => {
    console.log("================================");
    console.log(HZR_HEADER);
    console.log("HZR SERVER STARTED");
    console.log("Port:", PORT);
    console.log("================================");
});
