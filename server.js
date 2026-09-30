const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// HZR CONFIG
// --------------------------------------------------

const HZR_HEADER = "𝕳𝖅𝕽𝟏⁹";

// JSON body
app.use(express.json());

// Serve website
app.use(express.static(path.join(__dirname)));

// --------------------------------------------------
// MAIN PAGE
// --------------------------------------------------

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// --------------------------------------------------
// HZR LOCATION API
// --------------------------------------------------

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

        // Basic validation
        if (
            !id ||
            typeof latitude !== "number" ||
            typeof longitude !== "number"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid location data"
            });
        }

        const now = new Date();

        const date =
            String(now.getFullYear()) + "-" +
            String(now.getMonth() + 1).padStart(2, "0") + "-" +
            String(now.getDate()).padStart(2, "0");

        const time =
            String(now.getHours()).padStart(2, "0") + ":" +
            String(now.getMinutes()).padStart(2, "0") + ":" +
            String(now.getSeconds()).padStart(2, "0");


        const mapsUrl =
            `https://maps.google.com/?q=${latitude},${longitude}`;


        // --------------------------------------------------
        // WHATSAPP MESSAGE
        // --------------------------------------------------

        const whatsappMessage = `
━━━━━━━━━━━━━━━━━━
${HZR_HEADER}
━━━━━━━━━━━━━━━━━━

📍 HZR LOCATION

🆔 ID
${id}

📱 DEVICE
${device || "Unknown"}

🌐 LOCATION
Latitude: ${latitude.toFixed(6)}
Longitude: ${longitude.toFixed(6)}
Accuracy: ${accuracy ? Number(accuracy).toFixed(1) + " m" : "Unknown"}

🗺️ GOOGLE MAPS
${mapsUrl}

🕐 RECEIVED
${date}
${time}

━━━━━━━━━━━━━━━━━━
RECIEVED FROM HZR
━━━━━━━━━━━━━━━━━━
`.trim();


        console.log("\n==============================");
        console.log(HZR_HEADER);
        console.log("New location received");
        console.log("==============================");
        console.log(whatsappMessage);
        console.log("==============================\n");


        // --------------------------------------------------
        // WHATSAPP CLOUD API
        // --------------------------------------------------

        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const recipientNumber = process.env.WHATSAPP_RECIPIENT_NUMBER;

        /*
         * If WhatsApp credentials are not configured,
         * return success for testing without sending.
         */

        if (
            !accessToken ||
            !phoneNumberId ||
            !recipientNumber
        ) {

            return res.json({
                success: true,
                whatsapp: false,
                message: "Location received. WhatsApp is not configured yet."
            });

        }


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
                "WhatsApp API Error:",
                whatsappData
            );

            return res.status(502).json({
                success: false,
                whatsapp: false,
                message: "WhatsApp server did not respond correctly."
            });

        }


        return res.json({
            success: true,
            whatsapp: true,
            message: "Location received successfully.",
            id: id
        });


    } catch (error) {

        console.error("Server Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server didn't respond"
        });

    }

});


// --------------------------------------------------
// 404
// --------------------------------------------------

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "Not Found"
    });

});


// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {

    console.log("================================");
    console.log(HZR_HEADER);
    console.log("HZR SERVER STARTED");
    console.log(`Port: ${PORT}`);
    console.log("================================");

});
