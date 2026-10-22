import { notFound } from 'next/navigation';
import { ROSTER } from '@/lib/battle/roster';
import { DexPage } from './DexPage';

export const dynamicParams = false;

export const generateStaticParams = () => ROSTER.map((c) => ({ id: c.id }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = ROSTER.find((r) => r.id === id);
  return { title: c ? `${c.name} · Ranedex` : 'Ranedex' };
}

export default async function RanedexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = ROSTER.findIndex((c) => c.id === id);
  if (index < 0) notFound();
  return <DexPage index={index} />;
}
