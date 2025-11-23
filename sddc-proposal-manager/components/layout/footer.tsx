export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} San Diego Diplomacy Council. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <a
              href="https://sandiegodiplomacy.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-blue transition-colors"
            >
              Website
            </a>
            <span>•</span>
            <a
              href="mailto:lulu@sandiegodiplomacy.org"
              className="hover:text-primary-blue transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
