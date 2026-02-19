export const metadata = {
  title: "Privacy Policy",
}

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-4">
        This Privacy Policy explains how we collect, use, and share information when you use our services. If you have questions, contact us at <a href="mailto:info@disputeai.xyz" className="underline">info@disputeai.xyz</a>.
      </p>

      <h2 className="text-xl font-semibold mt-6">Information We Collect</h2>
      <p className="text-sm text-muted-foreground">We may collect account information, usage data, cookies, and information you provide when contacting support.</p>

      <h2 className="text-xl font-semibold mt-6">How We Use Information</h2>
      <p className="text-sm text-muted-foreground">To provide and improve services, send transactional emails, and for analytics. We may use affiliate links to recommend third-party tools.</p>

      <h2 className="text-xl font-semibold mt-6">Third-Party Links</h2>
      <p className="text-sm text-muted-foreground">Our site includes affiliate links. When you click or purchase via these links, we may earn a commission. We only promote services we find useful.</p>

      <h2 className="text-xl font-semibold mt-6">Contact</h2>
      <p className="text-sm text-muted-foreground">Questions? Email <a href="mailto:info@disputeai.xyz" className="underline">info@disputeai.xyz</a>.</p>

      <p className="text-xs text-muted-foreground mt-8">This template is provided for convenience. Please review and customize with legal counsel to ensure compliance.</p>
    </main>
  )
}
