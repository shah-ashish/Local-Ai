export function parseStreamMarkers(rawAccumulated) {
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

    return {
        thinking: thinking.trim(),
        text: text.replace(/^\n+|\n+$/g, ""),
        askChoice
    };
}
