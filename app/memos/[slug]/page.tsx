import { notFound } from "next/navigation";
import { findMemo, loadMemos, memoHtml } from "@/lib/memos";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadMemos().map((m) => ({ slug: m.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export default async function MemoPage({ params }: PageProps) {
  const { slug } = await params;
  const memo = findMemo(slug);
  if (!memo) notFound();

  return (
    <>
      <p className="muted" style={{ margin: 0 }}>
        <a href="/">← Ranking</a>
      </p>
      <p className="badge" style={{ marginTop: 12 }}>{memo.classification}</p>
      <p className="muted" style={{ fontSize: 14 }}>
        Price {memo.price.toFixed(2)} · base value {memo.base_value.toFixed(2)} · data as of {memo.data_date}
      </p>
      <article className="memo" dangerouslySetInnerHTML={{ __html: memoHtml(slug) }} />
    </>
  );
}
