export default function Disclaimer() {
  return (
    <div className="min-h-screen pb-20 pt-20">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Disclaimer</h1>
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. No Financial Advice</h2>
            <p className="text-muted-foreground">
              The information provided on Cylendra Labs and its associated tools, including but not limited to Orbitra AI, Cylendra Alerts, and the Cylendra Calculator, is for educational and informational purposes only. It does not constitute financial, investment, or trading advice. You should not make any decision, financial, investment, trading or otherwise, based on any of the information presented on this website without undertaking independent due diligence and consultation with a professional broker or financial advisory.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Risk Warning</h2>
            <p className="text-muted-foreground">
              Trading cryptocurrencies and derivatives involves a high degree of risk and may result in the loss of your entire capital. You should carefully consider whether trading is suitable for you in light of your financial condition. Past performance is not indicative of future results.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Accuracy of Information</h2>
            <p className="text-muted-foreground">
              While we strive to ensure the accuracy of the data and tools provided, Cylendra Labs makes no warranties or representations regarding the accuracy, completeness, or reliability of any information or calculations. Market data may be delayed or inaccurate.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Third-Party Links</h2>
            <p className="text-muted-foreground">
              Our website may contain links to third-party websites or services that are not owned or controlled by Cylendra Labs. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              In no event shall Cylendra Labs, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
