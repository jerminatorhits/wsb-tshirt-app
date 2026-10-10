import { notFound } from 'next/navigation'
import DropBuy from '@/components/DropBuy'
import { allDropProductSlugs, findDropProduct } from '@/lib/drops'

export function generateStaticParams() {
  return allDropProductSlugs().map((slug) => ({ slug }))
}

export default function DropProductPage({ params }: { params: { slug: string } }) {
  const found = findDropProduct(params.slug)
  if (!found) notFound()

  return (
    <div className="h-full min-h-0">
      <DropBuy drop={found.drop} product={found.product} />
    </div>
  )
}
