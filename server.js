const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const HZR_HEADER = "𝕳𝖅𝕽𝟏⁹";

app.use(express.json({ limit: "50kb" }));

app.use(express.static(path.join(__dirname)));


// ================================
// HOME
// ================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});


// ================================
// LOCATION API
// ================================

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


        // ================================
        // VALIDATION
        // ================================

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


        // ================================
        // DATE / TIME
        // ================================

        const now = new Date();


        const date =
            String(now.getDate()).padStart(2, "0") +
            " " +
            now.toLocaleString(
                "en-US",
                {
                    month: "long"
                }
            ) +
            " " +
            now.getFullYear();


        const time =
            String(now.getHours()).padStart(2, "0") +
            ":" +
            String(now.getMinutes()).padStart(2, "0") +
            ":" +
            String(now.getSeconds()).padStart(2, "0");


        // ================================
        // ACCURACY
        // ================================

        const accuracyText =
            typeof accuracy === "number" &&
            Number.isFinite(accuracy)

                ? accuracy.toFixed(1) + " m"

                : "Unknown";


        // ================================
        // DEVICE
        // ================================

        const deviceText =
            typeof device === "string" &&
            device.trim()

                ? device.trim()

                : "Unknown";


        // ================================
        // GOOGLE MAPS
        // ================================

        const mapsUrl =
            `https://maps.google.com/?q=${latitude},${longitude}`;


        // ================================
        // WHATSAPP MESSAGE
        // ================================

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
${date}
${time}

━━━━━━━━━━━━━━━━━━
RECIEVED FROM HZR
━━━━━━━━━━━━━━━━━━
`.trim();


        // ================================
        // SERVER LOG
        // ================================

        console.log("");
        console.log("================================");
        console.log("NEW HZR LOCATION");
        console.log("================================");

        console.log(
            "ID:",
            id
        );

        console.log(
            "Latitude:",
            latitude
        );

        console.log(
            "Longitude:",
            longitude
        );

        console.log(
            "Accuracy:",
            accuracyText
        );

        console.log(
            "Device:",
            deviceText
        );

        console.log(
            "User-Agent:",
            userAgent || "Unknown"
        );

        console.log(
            "================================"
        );


        // ================================
        // WASENDER VARIABLES
        // ================================

        const wasenderToken =
            process.env.WASENDER_TOKEN;

        const whatsappTo =
            process.env.WHATSAPP_TO;


        if (
            !wasenderToken ||
            !whatsappTo
        ) {

            console.error(
                "Wasender environment variables are missing."
            );


            return res.status(500).json({

                success: false,

                whatsapp: false,

                message:
                    "Wasender is not configured."

            });

        }


        // ================================
        // RECIPIENT NUMBER
        // ================================

        let recipient =
            String(whatsappTo).trim();


        /*
            Wasender accepts the recipient
            in international format.

            If Render contains:

            937XXXXXXXX

            convert it to:

            +937XXXXXXXX
        */

        if (
            recipient.length > 0 &&
            !recipient.startsWith("+")
        ) {

            recipient =
                "+" + recipient;

        }


        // ================================
        // WASENDER API
        // ================================

        console.log(
            "Sending message through Wasender..."
        );


        const wasenderResponse =
            await fetch(
                "https://www.wasenderapi.com/api/send-message",
                {

                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${wasenderToken}`,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            to:
                                recipient,

                            text:
                                whatsappMessage

                        })

                }
            );


        let wasenderData;


        try {

            wasenderData =
                await wasenderResponse.json();

        } catch (error) {

            wasenderData = null;

        }


        console.log(
            "Wasender HTTP status:",
            wasenderResponse.status
        );


        console.log(
            "Wasender response:",
            wasenderData
        );


        // ================================
        // WASENDER ERROR
        // ================================

        if (
            !wasenderResponse.ok ||
            !wasenderData ||
            wasenderData.success !== true
        ) {

            console.error(
                "================================"
            );

            console.error(
                "WASENDER API ERROR"
            );

            console.error(
                JSON.stringify(
                    wasenderData,
                    null,
                    2
                )
            );

            console.error(
                "================================"
            );


            return res.status(502).json({

                success: false,

                whatsapp: false,

                message:
                    "Wasender did not send the message."

            });

        }


        // ================================
        // SUCCESS
        // ================================

        console.log(
            "================================"
        );

        console.log(
            "WHATSAPP MESSAGE ACCEPTED BY WASENDER"
        );

        console.log(
            JSON.stringify(
                wasenderData,
                null,
                2
            )
        );

        console.log(
            "================================"
        );


        return res.json({

            success: true,

            whatsapp: true,

            message:
                "Location sent successfully.",

            id: id,

            wasender:
                wasenderData

        });


    } catch (error) {

        console.error(
            "================================"
        );

        console.error(
            "SERVER ERROR"
        );

        console.error(error);

        console.error(
            "================================"
        );


        return res.status(500).json({

            success: false,

            whatsapp: false,

            message:
                "Server didn't respond."

        });

    }

});


// ================================
// 404
// ================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: "Not Found"

    });

});


// ================================
// START SERVER
// ================================

app.listen(PORT, () => {

    console.log(
        "================================"
    );

    console.log(
        HZR_HEADER
    );

    console.log(
        "HZR SERVER STARTED"
    );

    console.log(
        "Port:",
        PORT
    );

    console.log(
        "Wasender API:",
        "Enabled"
    );

    console.log(
        "================================"
    );

});
