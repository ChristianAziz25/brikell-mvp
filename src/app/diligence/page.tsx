import { createChat } from "@/lib/prisma/models/chat";
import { redirect } from "next/navigation";

// make sure the chat id and its chat messages get detryed with the same expiry time as the chatid[] cookies
export default async function Page() {
  const chat = await createChat();
  redirect(`/diligence/${chat.id}`);
}
