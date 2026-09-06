import { ShortenerForm } from '@/components/ShortenerForm';

const App = () => (
  <div className="relative min-h-full overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-orange-50">
    <div className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-indigo-300/40 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-orange-300/40 blur-3xl" />
    <div className="pointer-events-none absolute top-1/3 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-purple-200/30 blur-3xl" />

    <main className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          URL Shortener
        </h1>
        <p className="mt-3 text-slate-600">Paste a long URL, get a short one.</p>
      </div>
      <ShortenerForm />
    </main>
  </div>
);

export default App;
