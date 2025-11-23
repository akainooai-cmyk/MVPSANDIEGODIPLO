import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-8 text-center">
        <div className="relative h-20 w-80 mx-auto mb-4">
          <Image
            src="/logo-sddc.jpg"
            alt="San Diego Diplomacy Council"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-primary-blue">
          IVLP Proposal Manager
        </h1>
      </div>
      {children}
    </div>
  );
}
