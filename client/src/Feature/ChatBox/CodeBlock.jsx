import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

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

export default CodeBlock;
