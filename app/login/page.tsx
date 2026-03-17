import Auth from '@/components/Auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-gray-400 bg-white px-6 py-8 sm:px-10 sm:py-12 shadow-2xl shadow-gray-400">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center leading-snug">
            Alegria
            <br />
            Canyoneering
          </h1>

          <div className="mt-8 sm:mt-12 flex justify-center w-full">
            <Auth />
          </div>
        </div>
      </main>
    </div>
  );
}
