/**
 * Central API module for Chat Feature
 * Connects to FastAPI /api/chat streaming endpoint.
 */

export async function streamChatMessage({ message, modelName, onChunk }) {
    const apiHost = window.location.port === "5173" ? "http://localhost:8000" : "";

    const response = await fetch(`${apiHost}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "modelname": modelName,
        },
        body: JSON.stringify({ message }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let rawAccumulated = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        rawAccumulated += chunk;

        let thinking = "";
        let text = "";

        if (rawAccumulated.includes("[THINKING]")) {
            const thinkingParts = rawAccumulated.split("[THINKING]");
            const afterThinkingStart = thinkingParts[1] || "";

            if (afterThinkingStart.includes("[/THINKING]")) {
                const [thinkingContent, rest] = afterThinkingStart.split("[/THINKING]");
                thinking = thinkingContent;
                text = rest.replace(/\[RESPONSE\]|\[\/RESPONSE\]/g, "");
            } else {
                thinking = afterThinkingStart;
            }
        } else {
            text = rawAccumulated.replace(/\[RESPONSE\]|\[\/RESPONSE\]/g, "");
        }

        onChunk({
            thinking: thinking.trim(),
            text: text.replace(/^\n+|\n+$/g, ""),
            isDone: false,
        });
    }

    // Final chunk emit
    let thinking = "";
    let text = "";

    if (rawAccumulated.includes("[THINKING]")) {
        const thinkingParts = rawAccumulated.split("[THINKING]");
        const afterThinkingStart = thinkingParts[1] || "";

        if (afterThinkingStart.includes("[/THINKING]")) {
            const [thinkingContent, rest] = afterThinkingStart.split("[/THINKING]");
            thinking = thinkingContent;
            text = rest.replace(/\[RESPONSE\]|\[\/RESPONSE\]/g, "");
        } else {
            thinking = afterThinkingStart;
        }
    } else {
        text = rawAccumulated.replace(/\[RESPONSE\]|\[\/RESPONSE\]/g, "");
    }

    onChunk({
        thinking: thinking.trim(),
        text: text.trim(),
        isDone: true,
    });
}
