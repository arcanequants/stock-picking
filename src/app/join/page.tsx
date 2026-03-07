export default function JoinPage() {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-4">Join the Community</h1>
        <p className="text-zinc-400 text-lg">
          Recibe picks diarios directamente en tu Telegram. Accede a research
          exclusivo y construye tu portafolio paso a paso.
        </p>
      </section>

      {/* Pricing Card */}
      <div className="border border-blue-500/30 bg-blue-500/5 rounded-2xl p-8 mx-auto max-w-md">
        <p className="text-sm text-blue-400 font-medium uppercase tracking-wider mb-2">
          Monthly Membership
        </p>
        <div className="flex items-baseline justify-center gap-1 mb-4">
          <span className="text-5xl font-bold">$1.99</span>
          <span className="text-zinc-400">/month</span>
        </div>

        <ul className="text-left space-y-3 mb-8 text-sm">
          <li className="flex items-start gap-2 text-zinc-300">
            <span className="text-emerald-400 mt-0.5">&#10003;</span>
            Daily stock picks (7 per week)
          </li>
          <li className="flex items-start gap-2 text-zinc-300">
            <span className="text-emerald-400 mt-0.5">&#10003;</span>
            Full research reports for every stock
          </li>
          <li className="flex items-start gap-2 text-zinc-300">
            <span className="text-emerald-400 mt-0.5">&#10003;</span>
            Portfolio dashboard with allocations
          </li>
          <li className="flex items-start gap-2 text-zinc-300">
            <span className="text-emerald-400 mt-0.5">&#10003;</span>
            Dividend-focused strategy
          </li>
          <li className="flex items-start gap-2 text-zinc-300">
            <span className="text-emerald-400 mt-0.5">&#10003;</span>
            Private Telegram group access
          </li>
        </ul>

        <a
          href="#"
          className="block w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors text-center"
        >
          Join Now
        </a>
        <p className="text-xs text-zinc-500 mt-3">Cancel anytime. No lock-in.</p>
      </div>

      {/* FAQ */}
      <section className="text-left space-y-4 mt-12">
        <h2 className="text-xl font-bold text-center mb-6">FAQ</h2>
        <FaqItem
          q="How many stocks do you pick per week?"
          a="7 picks per week: 2 on Monday, 2 on Tuesday, 1 on Wednesday, 1 on Thursday, 1 on Friday. Alternating between new stocks and rebuys in cycles of 5."
        />
        <FaqItem
          q="What kind of stocks do you pick?"
          a="We focus on stocks that generate cash flow through dividends AND have capital appreciation potential. Quality businesses with strong fundamentals across all sectors and regions."
        />
        <FaqItem
          q="Is this financial advice?"
          a="No. This is for educational and informational purposes only. Always consult a licensed financial advisor before making investment decisions."
        />
        <FaqItem
          q="How do I receive the picks?"
          a="Through our private Telegram group. You'll get a brief summary message for each pick plus a link to the full research on our website."
        />
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border border-zinc-800 rounded-xl p-4">
      <h3 className="font-semibold text-white mb-1">{q}</h3>
      <p className="text-sm text-zinc-400">{a}</p>
    </div>
  );
}
