import { Chat } from "@/components/Chat";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Parent Coach</h1>
      <Chat />
    </main>
  );
}
