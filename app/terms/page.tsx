export const metadata = {
  title: "Terms of Service",
}

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-4">These Terms govern your use of AgentScrape. By using the service you agree to these terms.</p>

      <h2 className="text-xl font-semibold mt-6">Using the Service</h2>
      <p className="text-sm text-muted-foreground">You may use the service for lawful purposes only. Do not use it to violate others' rights or scrape content you are not permitted to access.</p>

      <h2 className="text-xl font-semibold mt-6">Subscription & Billing</h2>
      <p className="text-sm text-muted-foreground">Paid features and upgrades are handled via third-party payment providers (Stripe, Whop). Billing questions: <a href="mailto:info@disputeai.xyz" className="underline">info@disputeai.xyz</a>.</p>

      <h2 className="text-xl font-semibold mt-6">Affiliate Links</h2>
      <p className="text-sm text-muted-foreground">We may include affiliate links. Commissions do not affect pricing for users. Use of affiliate links is subject to the partners' terms.</p>

      <h2 className="text-xl font-semibold mt-6">Contact</h2>
      <p className="text-sm text-muted-foreground">For questions, email <a href="mailto:info@disputeai.xyz" className="underline">info@disputeai.xyz</a>.</p>

      <p className="text-xs text-muted-foreground mt-8">This page is a starting point. For legally binding terms, consult a lawyer and adapt to your jurisdiction.</p>
    </main>
  )
}
