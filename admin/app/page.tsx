import type { Metadata } from "next";
import { getChatGPTUser } from "./chatgpt-auth";
import { ResearchDesk } from "./research-desk";

export const metadata: Metadata = {
  title: "Spot Research Desk",
  description: "地域の日常を探し、根拠を確認して旅程データへつなぐ管理画面",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return <ResearchDesk displayName={user?.displayName ?? "Local editor"} />;
}
