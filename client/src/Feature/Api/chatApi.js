/**
 * Central API module for Chat Feature
 * Connects to FastAPI /api/chat streaming endpoint.
 */
import { parseStreamMarkers } from './streamParser';

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

            const parsed = parseStreamMarkers(rawAccumulated);
            onChunk({
                ...parsed,
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
    const parsed = parseStreamMarkers(rawAccumulated);
    onChunk({
        ...parsed,
        text: parsed.text.trim(),
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
