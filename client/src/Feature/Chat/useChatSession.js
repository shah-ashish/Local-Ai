import { useState } from 'react';
import { streamChatMessage, stopChatMessage } from '../Api/chatApi';

export function useChatSession() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeRequestId, setActiveRequestId] = useState(null);
    const [abortController, setAbortController] = useState(null);
    const [lastUserMessage, setLastUserMessage] = useState('');

    const sendMessage = async (text, modelName) => {
        if (!text) return;
        setLastUserMessage(text);

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: text,
        };

        const aiMsgId = Date.now() + 1;
        const aiMsg = {
            id: aiMsgId,
            sender: 'ai',
            modelName: modelName,
            text: '',
            thinking: '',
        };

        setMessages((prev) => [...prev, userMsg, aiMsg]);

        const controller = new AbortController();
        setAbortController(controller);
        setLoading(true);

        try {
            await streamChatMessage({
                message: text,
                modelName: modelName,
                signal: controller.signal,
                onRequestId: (id) => setActiveRequestId(id),
                onChunk: ({ text: responseText, thinking: thinkingText, askChoice }) => {
                    setMessages((prev) => {
                        const updated = [...prev];
                        const targetIdx = updated.findIndex((m) => m.id === aiMsgId);
                        if (targetIdx !== -1) {
                            updated[targetIdx] = {
                                ...updated[targetIdx],
                                text: responseText,
                                thinking: thinkingText,
                                askChoice: askChoice || null,
                            };
                        }
                        return updated;
                    });
                },
            });
        } catch (err) {
            setMessages((prev) => {
                const updated = [...prev];
                const targetIdx = updated.findIndex((m) => m.id === aiMsgId);
                if (targetIdx !== -1) {
                    if (err.name === 'AbortError' || controller.signal.aborted) {
                        return updated;
                    }
                    updated[targetIdx] = {
                        ...updated[targetIdx],
                        text: `Error: ${err.message || 'Failed to stream response from backend.'}`,
                    };
                }
                return updated;
            });
        } finally {
            setLoading(false);
            setAbortController(null);
            setActiveRequestId(null);
        }
    };

    const resumeWithAnswer = async (aiMsg, answerText) => {
        if (!aiMsg.askChoice) return;
        const { question, options, tool_call_id } = aiMsg.askChoice;
        
        // Find the original user query for this turn
        const idx = messages.findIndex(m => m.id === aiMsg.id);
        const originalUserMsg = idx > 0 ? messages[idx - 1] : null;
        const originalText = originalUserMsg ? originalUserMsg.text : lastUserMessage;
        
        setMessages((prev) => {
            const updated = [...prev];
            const targetIdx = updated.findIndex((m) => m.id === aiMsg.id);
            if (targetIdx !== -1) {
                updated[targetIdx] = {
                    ...updated[targetIdx],
                    askChoice: null,
                    text: '',
                    thinking: '',
                };
            }
            return updated;
        });

        const controller = new AbortController();
        setAbortController(controller);
        setLoading(true);

        try {
            await streamChatMessage({
                message: originalText,
                modelName: aiMsg.modelName,
                resume: {
                    question,
                    options,
                    tool_call_id,
                    answer: answerText
                },
                signal: controller.signal,
                onRequestId: (id) => setActiveRequestId(id),
                onChunk: ({ text: responseText, thinking: thinkingText }) => {
                    setMessages((prev) => {
                        const updated = [...prev];
                        const targetIdx = updated.findIndex((m) => m.id === aiMsg.id);
                        if (targetIdx !== -1) {
                            updated[targetIdx] = {
                                ...updated[targetIdx],
                                text: responseText,
                                thinking: thinkingText,
                            };
                        }
                        return updated;
                    });
                }
            });
        } catch (err) {
            setMessages((prev) => {
                const updated = [...prev];
                const targetIdx = updated.findIndex((m) => m.id === aiMsg.id);
                if (targetIdx !== -1) {
                    if (err.name === 'AbortError' || controller.signal.aborted) {
                        return updated;
                    }
                    updated[targetIdx] = {
                        ...updated[targetIdx],
                        text: `Error: ${err.message || 'Failed to resume response.'}`,
                    };
                }
                return updated;
            });
        } finally {
            setLoading(false);
            setAbortController(null);
            setActiveRequestId(null);
        }
    };

    const stopMessage = () => {
        if (abortController) {
            abortController.abort();
        }
        if (activeRequestId) {
            stopChatMessage(activeRequestId);
        }
        setLoading(false);
    };

    return {
        messages,
        loading,
        sendMessage,
        resumeWithAnswer,
        stopMessage
    };
}
