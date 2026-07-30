import { useState } from "react";
function Chat() {
  // holds what the user is currently typing in the input box
  const [input, setInput] = useState("");

  // holds the full conversation so far -> [{ role: "user"|"assistant", text: "..." }]
  const [messages, setMessages] = useState([]);

  // true while we are waiting for / streaming a response
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return; // don't send empty messages

    const userMessage = { role: "user", text: input };

    // add the user's message to the chat immediately
    setMessages((prev) => [...prev, userMessage]);

    // add an empty assistant message that we will fill in as chunks arrive
    setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

    setInput(""); // clear the input box
    setLoading(true);

    try {
      // call the FastAPI streaming endpoint
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          modelname: "gemma3:270m", // model name sent as a header
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      // response.body is a ReadableStream - we read it chunk by chunk
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          // convert the raw bytes chunk into text
          const chunkText = decoder.decode(value, { stream: true });

          // append this chunk to the last assistant message in the list
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              text: updated[lastIndex].text + chunkText,
            };
            return updated;
          });
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
    }

    setLoading(false);
  }

  // send message when user presses Enter
  function handleKeyDown(e) {
    if (e.key === "Enter") sendMessage();
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Simple Chat</h2>

      {/* chat display area */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 6,
          height: 400,
          overflowY: "auto",
          padding: 10,
          marginBottom: 10,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.role === "user" ? "right" : "left",
              margin: "8px 0",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "6px 10px",
                borderRadius: 6,
                background: msg.role === "user" ? "#daf1ff" : "#f0f0f0",
                whiteSpace: "pre-wrap", // preserves line breaks from the stream
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      {/* chat input area */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 8 }}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Chat