import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center px-4">
      <h2 className="text-3xl font-black text-white">404 - Page Not Found</h2>
      <p className="text-sm text-zinc-400 mt-2">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-4 px-4 py-2 bg-orange-600 text-white font-bold rounded-lg text-sm">
        Return Home
      </Link>
    </div>
  );
}
