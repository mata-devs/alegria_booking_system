import Navbar from '@/app/components/Navbar'

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
