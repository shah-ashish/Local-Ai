/**
 * Central API module for Chat Feature
 * Connects to FastAPI /api/chat streaming endpoint.
 */

export async function streamChatMessage({ message, modelName, resume = null, signal = null, onRequestId, onChunk }) {
    const apiHost = window.location.port === "5173" ? "http://localhost:8000" : "";
    const requestId = crypto.randomUUID();

    if (onRequestId) {
        onRequestId(requestId);
    }

    const response = await fetch(`${apiHost}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "modelname": modelName,
            "x-request-id": requestId,
        },
        body: JSON.stringify({ message, resume }),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let rawAccumulated = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            rawAccumulated += chunk;

            let thinking = "";
            let text = "";
            let askChoice = null;

            // Parse askChoice payload if [ASK_CHOICE] tag is present
            let parsedAccumulated = rawAccumulated;
            if (parsedAccumulated.includes("[ASK_CHOICE]")) {
                const parts = parsedAccumulated.split("[ASK_CHOICE]");
                const afterStart = parts[1] || "";
                if (afterStart.includes("[/ASK_CHOICE]")) {
                    const [choiceJson, rest] = afterStart.split("[/ASK_CHOICE]");
                    try {
                        askChoice = JSON.parse(choiceJson.trim());
                    } catch (e) {
                        console.error("Failed to parse askChoice JSON", e);
                    }
                    parsedAccumulated = parts[0] + rest;
                } else {
                    parsedAccumulated = parts[0];
                }
            }

            if (parsedAccumulated.includes("[THINKING]")) {
                const thinkingParts = parsedAccumulated.split("[THINKING]");
                const afterThinkingStart = thinkingParts[1] || "";

                if (afterThinkingStart.includes("[/THINKING]")) {
                    const [thinkingContent, rest] = afterThinkingStart.split("[/THINKING]");
                    thinking = thinkingContent;
                    text = rest.replace(/\[RESPONSE\]|\[\/RESPONSE\]/g, "");
                } else {
                    thinking = afterThinkingStart;
                }
            } else {
                text = parsedAccumulated.replace(/\[RESPONSE\]|\[\/RESPONSE\]/g, "");
            }

            onChunk({
                thinking: thinking.trim(),
                text: text.replace(/^\n+|\n+$/g, ""),
                askChoice,
                isDone: false,
            });
        }
    } catch (err) {
        // Catch AbortError specifically and treat it as a clean stop
        if (err.name === 'AbortError' || (signal && signal.aborted)) {
            console.log("Stream aborted cleanly by client");
            return;
        }
        throw err;
    }

    // Final chunk emit
    let thinking = "";
    let text = "";
    let askChoice = null;

    let parsedAccumulated = rawAccumulated;
    if (parsedAccumulated.includes("[ASK_CHOICE]")) {
        const parts = parsedAccumulated.split("[ASK_CHOICE]");
        const afterStart = parts[1] || "";
        if (afterStart.includes("[/ASK_CHOICE]")) {
            const [choiceJson, rest] = afterStart.split("[/ASK_CHOICE]");
            try {
                askChoice = JSON.parse(choiceJson.trim());
            } catch (e) {
                console.error("Failed to parse askChoice JSON", e);
            }
            parsedAccumulated = parts[0] + rest;
        } else {
            parsedAccumulated = parts[0];
        }
    }

    if (parsedAccumulated.includes("[THINKING]")) {
        const thinkingParts = parsedAccumulated.split("[THINKING]");
        const afterThinkingStart = thinkingParts[1] || "";

        if (afterThinkingStart.includes("[/THINKING]")) {
            const [thinkingContent, rest] = afterThinkingStart.split("[/THINKING]");
            thinking = thinkingContent;
            text = rest.replace(/\[RESPONSE\]|\[\/RESPONSE\]/g, "");
        } else {
            thinking = afterThinkingStart;
        }
    } else {
        text = parsedAccumulated.replace(/\[RESPONSE\]|\[\/RESPONSE\]/g, "");
    }

    onChunk({
        thinking: thinking.trim(),
        text: text.trim(),
        askChoice,
        isDone: true,
    });
}

export async function stopChatMessage(requestId) {
    const apiHost = window.location.port === "5173" ? "http://localhost:8000" : "";
    try {
        const response = await fetch(`${apiHost}/api/chat/stop`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ request_id: requestId }),
        });
        if (!response.ok) {
            console.warn(`Stop request returned status ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        console.error("Failed to call stopChatMessage endpoint:", err);
    }
}
