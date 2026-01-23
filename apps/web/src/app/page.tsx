import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-600">
            માપાપ
          </h1>
          <div className="text-sm text-gray-600">
            maapaap
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            તમારા પરિવારના માપ સાચવો
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Save accurate body & garment measurements
          </p>
          <p className="text-base text-gray-500">
            ટેલર સાથે શેર કરવા માટે આસાન
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 mb-8">
          <Link
            href="/profiles"
            className="card hover:shadow-md transition-shadow tap-target flex items-center justify-between group"
          >
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                પ્રોફાઇલ્સ
              </h3>
              <p className="text-gray-600">
                Profiles • View and manage family profiles
              </p>
            </div>
            <div className="text-primary-600 group-hover:translate-x-1 transition-transform">
              →
            </div>
          </Link>

          <Link
            href="/new-measurement"
            className="card hover:shadow-md transition-shadow tap-target flex items-center justify-between group bg-primary-50 border-primary-200"
          >
            <div>
              <h3 className="text-xl font-semibold text-primary-900 mb-1">
                + નવું માપ
              </h3>
              <p className="text-primary-700">
                New Measurement • Start measuring now
              </p>
            </div>
            <div className="text-primary-600 group-hover:translate-x-1 transition-transform">
              →
            </div>
          </Link>

          <Link
            href="/settings"
            className="card hover:shadow-md transition-shadow tap-target flex items-center justify-between group"
          >
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                સેટિંગ્સ
              </h3>
              <p className="text-gray-600">
                Settings • Language, units, and preferences
              </p>
            </div>
            <div className="text-primary-600 group-hover:translate-x-1 transition-transform">
              →
            </div>
          </Link>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            📱 વોટ્સએપ પર શેર કરો
          </h3>
          <p className="text-blue-800 text-sm">
            Share measurements directly on WhatsApp with your tailor in Gujarati or English
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>maapaap • માપાપ</p>
          <p className="mt-1 text-xs text-gray-500">
            Privacy-friendly • Offline-first • Made for families
          </p>
        </div>
      </footer>
    </div>
  )
}
