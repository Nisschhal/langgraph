// import { User, Bot } from "lucide-react"

// export const MessageItem = ({
//   msg,
// }: {
//   msg: { role: string; content: string }
// }) => {
//   const isBot = msg.role === "assistant"
//   // The "Loading" state is simply when the bot message has no text yet
//   const isLoading = isBot && msg.content === ""

//   return (
//     <div
//       className={`w-full py-6 ${isBot ? "bg-[#2f2f2f]/30" : "bg-transparent"}`}
//     >
//       <div
//         className={`max-w-3xl mx-auto flex px-4 md:px-0 gap-4 ${isBot ? "flex-row" : "flex-row-reverse"}`}
//       >
//         {/* Avatar: Static position helps UX */}
//         <div
//           className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-md ${
//             isBot ? "bg-emerald-600" : "bg-blue-600"
//           }`}
//         >
//           {isBot ? <Bot size={20} /> : <User size={20} />}
//         </div>

//         {/* Content Area */}
//         <div
//           className={`flex flex-col gap-2 w-full max-w-[85%] ${isBot ? "items-start" : "items-end"}`}
//         >
//           <span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">
//             {isBot ? "Wellness AI" : "You"}
//           </span>

//           <div
//             className={`p-4 rounded-2xl text-[15px] leading-relaxed transition-all duration-300 ${
//               isBot
//                 ? "bg-[#2f2f2f] text-[#ececf1] rounded-tl-none shadow-sm"
//                 : "bg-blue-700 text-white rounded-tr-none shadow-blue-900/20 shadow-lg"
//             }`}
//           >
//             {/* UX Logic: Replace dots with text once data arrives */}
//             {isLoading ? (
//               <div className="flex space-x-1.5 items-center h-5 px-1">
//                 <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
//                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
//                 <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
//               </div>
//             ) : (
//               <div className="prose prose-invert max-w-none break-words">
//                 {msg.content}
//                 {/* Optional: Add a blinking cursor while loading more tokens */}
//                 {isBot && (
//                   <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-500 animate-pulse" />
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

import { User, Bot } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MessageItemProps {
  msg: {
    role: string
    content: string
  }
}

export const MessageItem = ({ msg }: MessageItemProps) => {
  const isBot = msg.role === "assistant"
  const isEmpty = msg.content.length === 0

  return (
    <div
      className={`w-full py-6 transition-all ${isBot ? "bg-[#2f2f2f]/30" : "bg-transparent"}`}
    >
      <div
        className={`max-w-3xl mx-auto flex px-4 md:px-0 gap-4 ${isBot ? "flex-row" : "flex-row-reverse"}`}
      >
        {/* AVATAR ICON */}
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-lg ${
            isBot ? "bg-emerald-600" : "bg-blue-600"
          }`}
        >
          {isBot ? (
            <Bot size={20} className="text-white" />
          ) : (
            <User size={20} className="text-white" />
          )}
        </div>

        {/* CONTENT AREA */}
        <div
          className={`flex flex-col gap-2 w-full max-w-[85%] ${isBot ? "items-start" : "items-end"}`}
        >
          {/* ROLE LABEL */}
          <span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">
            {isBot ? "Wellness Nepal AI" : "You"}
          </span>

          {/* MESSAGE BUBBLE */}
          <div
            className={`p-4 rounded-2xl text-[15px] leading-relaxed transition-all duration-300 ${
              isBot
                ? "bg-[#2f2f2f] text-[#ececf1] rounded-tl-none border border-white/5"
                : "bg-blue-700 text-white rounded-tr-none shadow-blue-900/20 shadow-lg"
            }`}
          >
            {/* 1. THINKING STATE (Dots) */}
            {isBot && isEmpty ? (
              <div className="flex space-x-1.5 items-center h-5 px-1">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
              </div>
            ) : (
              /* 2. MARKDOWN CONTENT (Text/Tables/Code) */
              <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#1e1e1e] prose-pre:p-0 max-w-none break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Logic to handle code blocks with highlighting
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "")
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md border border-white/10"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          className="bg-black/30 rounded px-1.5 py-0.5 font-mono text-sm"
                          {...props}
                        >
                          {children}
                        </code>
                      )
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
                {/* 3. STREAMING CURSOR
                {isBot && !isEmpty && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />
                )} */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
