import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DropBuy from '@/components/DropBuy'
import { allDropProductSlugs, findDropProduct } from '@/lib/drops'
import { crashWeekPromoLine, formatPriceWithShipping } from '@/lib/fulfillment-copy'

export function generateStaticParams() {
  return allDropProductSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const found = findDropProduct(params.slug)
  if (!found) return { title: 'Mug · stonkmugs' }
  const promo = crashWeekPromoLine()
  const price = formatPriceWithShipping(found.product.productType)
  const description = `${found.product.blurb} ${price}${promo ? ` · ${promo}` : ''}`
  return {
    title: `${found.product.title} · stonkmugs`,
    description,
    openGraph: {
      title: `${found.product.title} · stonkmugs`,
      description,
      url: `/drop/${found.product.slug}`,
      siteName: 'stonkmugs',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${found.product.title} · stonkmugs`,
      description,
    },
  }
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
