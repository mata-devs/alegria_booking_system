import Footer from '@/app/components/Footer'
import HomeHero from './_components/HomeHero'
import HomeCarousels from './_components/HomeCarousels'
import { getHomepageCmsServer } from '@/app/lib/homepage-cms.server'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const cms = await getHomepageCmsServer()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <HomeHero cms={cms} />
      <HomeCarousels />
      <Footer />
    </div>
  )
}

