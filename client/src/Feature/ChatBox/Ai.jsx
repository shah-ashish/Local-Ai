import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import AskChoice from './AskChoice'

// Custom hook to throttle state updates for smooth typing effect and high performance
function useThrottledValue(value, delay = 60) {
    const [throttledValue, setThrottledValue] = useState(value);
    const lastUpdate = useRef(0);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const now = Date.now();
        const timePassed = now - lastUpdate.current;

        if (timePassed >= delay) {
            setThrottledValue(value);
            lastUpdate.current = now;
        } else {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setThrottledValue(value);
                lastUpdate.current = Date.now();
            }, delay - timePassed);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [value, delay]);

    // Force immediate update if value becomes empty (e.g. starting a new response)
    useEffect(() => {
        if (!value) {
            setThrottledValue("");
            lastUpdate.current = 0;
        }
    }, [value]);

    return throttledValue;
}

// Code Block Component with copy button and language label
const CodeBlock = ({ language, code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-4 overflow-hidden rounded-xl border border-gray-200 shadow-xs bg-gray-900 text-gray-100 font-mono text-xs">
            {/* Code Block Header */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-gray-800 border-b border-gray-700 select-none">
                <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                    {language || 'code'}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-200 transition-colors focus:outline-hidden cursor-pointer"
                >
                    <span className="material-symbols-outlined text-sm">
                        {copied ? 'check' : 'content_copy'}
                    </span>
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>
            
            {/* Code Highlighter */}
            <div className="overflow-x-auto p-4">
                <SyntaxHighlighter
                    language={language || 'text'}
                    style={oneDark}
                    customStyle={{
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                    }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

const Ai = ({ 
    message = "",
    modelName = "gemma3:270m",
    thinking = "",
    askChoice = null,
    onAnswer,
    onRegenerate
}) => {
    const [copied, setCopied] = useState(false);
    const [showThinking, setShowThinking] = useState(true);

    const throttledMessage = useThrottledValue(message, 60);
    const throttledThinking = useThrottledValue(thinking, 60);

    const handleCopy = () => {
        if (!message) return;
        navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const hasThinkingContent = Boolean(thinking && thinking.trim() !== "");

    // Custom renderer for main markdown responses
    const markdownComponents = {
        code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            
            if (isInline) {
                return (
                    <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-xs font-semibold border border-gray-200/50" {...props}>
                        {children}
                    </code>
                );
            }

            return (
                <CodeBlock 
                    language={match[1]} 
                    code={String(children).replace(/\n$/, '')} 
                    {...props} 
                />
            );
        },
        table({ children }) {
            return (
                <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 shadow-xs">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                        {children}
                    </table>
                </div>
            );
        },
        thead({ children }) {
            return <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider">{children}</thead>;
        },
        tbody({ children }) {
            return <tbody className="bg-white divide-y divide-gray-100">{children}</tbody>;
        },
        tr({ children }) {
            return <tr className="hover:bg-gray-50/50 odd:bg-white even:bg-gray-50/30 transition-colors">{children}</tr>;
        },
        th({ children }) {
            return <th className="px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">{children}</th>;
        },
        td({ children }) {
            return <td className="px-4 py-2.5 text-gray-600 whitespace-normal">{children}</td>;
        },
        h1({ children }) {
            return <h1 className="text-xl font-bold text-gray-900 mt-5 mb-2.5 tracking-tight border-b border-gray-100 pb-1.5">{children}</h1>;
        },
        h2({ children }) {
            return <h2 className="text-lg font-bold text-gray-800 mt-4 mb-2 tracking-tight">{children}</h2>;
        },
        h3({ children }) {
            return <h3 className="text-base font-semibold text-gray-800 mt-3.5 mb-1.5">{children}</h3>;
        },
        ul({ children }) {
            return <ul className="list-disc pl-5 my-2.5 space-y-1.5 text-gray-700">{children}</ul>;
        },
        ol({ children }) {
            return <ol className="list-decimal pl-5 my-2.5 space-y-1.5 text-gray-700">{children}</ol>;
        },
        li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
        },
        blockquote({ children }) {
            return (
                <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/40 px-4 py-2 my-4 rounded-r-lg text-gray-600 italic leading-relaxed">
                    {children}
                </blockquote>
            );
        },
        p({ children }) {
            return <p className="mb-3 last:mb-0 leading-relaxed text-gray-700">{children}</p>;
        },
        hr() {
            return <hr className="my-5 border-t border-gray-200/80" />;
        },
        a({ href, children }) {
            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium">{children}</a>;
        }
    };

    // Custom renderer for reasoning process
    const reasoningComponents = {
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        h1: ({ children }) => <h4 className="font-semibold text-amber-900 mt-2 mb-1">{children}</h4>,
        h2: ({ children }) => <h4 className="font-semibold text-amber-900 mt-2 mb-1">{children}</h4>,
        h3: ({ children }) => <h4 className="font-semibold text-amber-900 mt-2 mb-1">{children}</h4>,
        ul: ({ children }) => <ul className="list-disc pl-4 my-1.5 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5 space-y-1">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        code: ({ children }) => <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono text-[10px]">{children}</code>
    };

    return (
        <div className="flex justify-start w-full my-3">
            <div className="flex items-start gap-3 max-w-[85%]">
                {/* AI Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-lg select-none">smart_toy</span>
                </div>

                {/* AI Content Wrapper */}
                <div className="flex flex-col gap-1 w-full">
                    {/* Model Badge */}
                    {modelName && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 select-none px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{modelName}</span>
                        </div>
                    )}

                    {/* Thinking Section */}
                    {hasThinkingContent && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 shadow-xs mb-1">
                            <div 
                                onClick={() => setShowThinking((prev) => !prev)}
                                className="flex items-center justify-between cursor-pointer select-none font-semibold text-amber-800 mb-1"
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base">psychology</span>
                                    <span>Reasoning Process</span>
                                </div>
                                <span className="material-symbols-outlined text-sm">
                                    {showThinking ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>
                            {showThinking && (
                                <div className="text-amber-800/80 leading-relaxed pt-1 border-t border-amber-200/50 mt-1">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
                                        components={reasoningComponents}
                                    >
                                        {throttledThinking}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Message Content with full Markdown / LaTeX */}
                    <div className="text-gray-800 px-3 py-1 text-sm leading-relaxed">
                        {askChoice ? (
                            <AskChoice
                                question={askChoice.question}
                                options={askChoice.options}
                                onAnswer={onAnswer}
                            />
                        ) : message ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
                                components={markdownComponents}
                            >
                                {throttledMessage}
                            </ReactMarkdown>
                        ) : (
                            <span className="italic text-gray-400">Thinking...</span>
                        )}
                    </div>

                    {/* AI Actions Bar */}
                    <div className="flex items-center gap-1 text-gray-400 select-none px-1">
                        <button
                            onClick={handleCopy}
                            title="Copy response"
                            className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1 text-xs cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">
                                {copied ? 'check' : 'content_copy'}
                            </span>
                            {copied && <span className="text-[11px] font-medium text-emerald-600">Copied</span>}
                        </button>

                        <button
                            onClick={onRegenerate}
                            title="Regenerate response"
                            className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1 text-xs cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">refresh</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Ai