import Link from "next/link";

export default function ThanksPage() {
  return (
    <main className="memory-shell center-shell">
      <section className="memory-card thanks-card">
        <p className="kicker">Memory received</p>
        <h1>Thank you for leaving this with me.</h1>
        <p>
          Your original submission was saved privately for Yeriel / MOFUNDO to review. It is not public and it is not story material until a separate review happens.
        </p>
        <Link className="primary-action" href="/remember">Share another memory</Link>
      </section>
    </main>
  );
}
