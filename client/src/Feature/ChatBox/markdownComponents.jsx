import React from 'react'
import CodeBlock from './CodeBlock'

export const getMarkdownComponents = () => ({
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
});

export const reasoningComponents = {
    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-gray-400">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-gray-400">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    code: ({ children }) => <code className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded font-mono text-[11px]">{children}</code>
};
