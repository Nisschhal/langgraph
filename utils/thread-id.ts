export const getChatThreadId = () => {
  let threadId = localStorage.getItem("wellness_nepal_chat_id")

  if (!threadId) {
    // Generate a new random ID if it doesn't exist
    threadId = crypto.randomUUID()
    localStorage.setItem("wellness_nepal_chat_id", threadId)
  }

  return threadId
}
