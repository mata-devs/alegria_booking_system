import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-14 pb-8">
      <div className="w-full px-10 lg:px-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-16">
        <div>
          <h3 className="text-xl font-bold text-white mb-3">VisitCebu</h3>
          <p className="text-sm text-white/60 leading-relaxed mb-5">
            Showcasing the natural wonders of Cebu through sustainable and curated travel experiences.
          </p>
          <div className="flex gap-4 items-center">
            <a href="#" aria-label="Facebook" className="opacity-80 hover:opacity-100 transition-opacity">
              <Image src="/images/icons/fb.png" alt="Facebook" width={24} height={24} className="object-contain" />
            </a>
            <a href="#" aria-label="X" className="opacity-80 hover:opacity-100 transition-opacity">
              <Image src="/images/icons/x.png" alt="X" width={24} height={24} className="object-contain" />
            </a>
            <a href="#" aria-label="Instagram" className="opacity-80 hover:opacity-100 transition-opacity">
              <Image src="/images/icons/insta.png" alt="Instagram" width={24} height={24} className="object-contain" />
            </a>
            <a href="#" aria-label="YouTube" className="opacity-80 hover:opacity-100 transition-opacity">
              <Image src="/images/icons/yt.png" alt="YouTube" width={24} height={24} className="object-contain" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-4">Links</h4>
          <ul className="space-y-2.5 text-sm text-white/60">
            <li><Link href="/locations" className="hover:text-white transition-colors">Locations</Link></li>
            <li><Link href="/activities" className="hover:text-white transition-colors">Activities</Link></li>
            <li><Link href="/accommodations" className="hover:text-white transition-colors">Accommodations</Link></li>
            <li><Link href="/tour-packages" className="hover:text-white transition-colors">Tour Packages</Link></li>
            <li><Link href="/operators" className="hover:text-white transition-colors">Local Partners</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-4">Support</h4>
          <ul className="space-y-2.5 text-sm text-white/60">
            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Eco-Tourism Initiatives</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Visitor Guide</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-4">Island Updates</h4>
          <p className="text-sm text-white/60 mb-4">Get the best Cebu travel deals and local guides</p>
          <div className="flex w-full">
            <input
              type="email"
              id="footer-email"
              name="email"
              autoComplete="email"
              aria-label="Email address for island updates"
              placeholder="Email"
              className="flex-1 min-w-0 px-4 py-2 rounded-l-full text-sm text-gray-800 bg-white outline-none"
            />
            <button className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2 rounded-r-full text-sm font-semibold transition-colors shrink-0">
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-10 lg:px-20 mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/40">
        © {new Date().getFullYear()} VisitCebu. All rights reserved.
      </div>
    </footer>
  )
}
