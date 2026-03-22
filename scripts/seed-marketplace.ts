/**
 * Seed marketplace data: place slots + demo products
 * Run with: npx tsx scripts/seed-marketplace.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PLACE_SLOTS = [
  { placeSlug: 'cite-de-carcassonne', maxSlots: 4, pricePerMonth: 50 },
  { placeSlug: 'chateau-de-montsegur', maxSlots: 2, pricePerMonth: 50 },
  { placeSlug: 'canal-du-midi', maxSlots: 3, pricePerMonth: 50 },
  { placeSlug: 'rennes-le-chateau', maxSlots: 2, pricePerMonth: 50 },
  { placeSlug: 'abbaye-de-fontfroide', maxSlots: 2, pricePerMonth: 50 },
  { placeSlug: 'machu-picchu', maxSlots: 4, pricePerMonth: 50 },
  { placeSlug: 'petra', maxSlots: 3, pricePerMonth: 50 },
  { placeSlug: 'angkor-wat', maxSlots: 3, pricePerMonth: 50 },
]

// Demo seller account (admin creates products for demo)
const DEMO_SELLER = {
  email: 'demo-seller@lastcathar.com',
  name: 'Artisan du Midi',
  hashedPassword: '$2a$12$dummyhashnotusedforlogin000000000000000000000000',
  role: 'SELLER' as const,
}

const DEMO_PRODUCTS = [
  {
    placeSlug: 'cite-de-carcassonne',
    title: 'Cassoulet de Castelnaudary',
    description: 'Le véritable cassoulet artisanal, mijoté selon la recette traditionnelle du Languedoc. Haricots lingots, confit de canard, saucisse de Toulouse. Livraison en France métropolitaine.',
    price: '24,90 €',
    imageUrls: ['https://images.unsplash.com/photo-1515516969-d4008c6e0d05?w=400&h=300&fit=crop'],
    externalUrl: 'https://example.com/cassoulet',
  },
  {
    placeSlug: 'cite-de-carcassonne',
    title: 'Miel des Corbières',
    description: 'Miel toutes fleurs récolté dans les collines des Corbières, au pied de la Cité. Apiculteur local depuis 3 générations. Pot de 500g.',
    price: '12,50 €',
    imageUrls: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop'],
    externalUrl: 'https://example.com/miel',
  },
  {
    placeSlug: 'cite-de-carcassonne',
    title: 'Visite guidée cathare',
    description: 'Découvrez les secrets des Cathares avec un guide passionné. 2h de visite immersive dans la Cité médiévale. Petit groupe de 12 personnes max.',
    price: '25 € / personne',
    imageUrls: ['https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400&h=300&fit=crop'],
    externalUrl: 'https://example.com/visite',
  },
  {
    placeSlug: 'cite-de-carcassonne',
    title: 'Vin de Carcassonne AOC',
    description: 'Cuvée du Château — Cabernet-Sauvignon élevé en fûts de chêne. Domaine familial aux portes de la Cité. Carton de 6 bouteilles.',
    price: '48 € / carton',
    imageUrls: ['https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop'],
    externalUrl: 'https://example.com/vin',
  },
  {
    placeSlug: 'chateau-de-montsegur',
    title: 'Randonnée Montségur',
    description: 'Trek guidé jusqu\'au sommet du pog de Montségur. Histoire cathare et paysages époustouflants. Départ à 9h, retour à 14h. Pique-nique inclus.',
    price: '35 € / personne',
    imageUrls: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop'],
    externalUrl: 'https://example.com/rando-montsegur',
  },
  {
    placeSlug: 'canal-du-midi',
    title: 'Croisière sur le Canal',
    description: 'Navigation douce sur le Canal du Midi. Location de pénichette à la journée ou à la semaine. Permis non requis.',
    price: '190 € / jour',
    imageUrls: ['https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=400&h=300&fit=crop'],
    externalUrl: 'https://example.com/croisiere',
  },
  {
    placeSlug: 'rennes-le-chateau',
    title: 'Guide des Mystères',
    description: 'Livre illustré sur les mystères de Rennes-le-Château. L\'abbé Saunière, le trésor des Wisigoths, les secrets de l\'église Sainte-Marie-Madeleine. 280 pages.',
    price: '19,90 €',
    imageUrls: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop'],
    externalUrl: 'https://example.com/guide-rennes',
  },
]

async function main() {
  console.log('🏪 Seeding marketplace data...')

  // Create demo seller
  const seller = await prisma.user.upsert({
    where: { email: DEMO_SELLER.email },
    update: {},
    create: DEMO_SELLER,
  })
  console.log(`  ✓ Demo seller: ${seller.name} (${seller.id})`)

  // Create place slots
  for (const slot of PLACE_SLOTS) {
    await prisma.placeSlot.upsert({
      where: { placeSlug: slot.placeSlug },
      update: { maxSlots: slot.maxSlots, pricePerMonth: slot.pricePerMonth },
      create: slot,
    })
    console.log(`  ✓ Slot: ${slot.placeSlug} (${slot.maxSlots} emplacements)`)
  }

  // Create demo products
  for (const product of DEMO_PRODUCTS) {
    const slot = await prisma.placeSlot.findUnique({
      where: { placeSlug: product.placeSlug },
    })
    if (!slot) continue

    await prisma.product.create({
      data: {
        sellerId: seller.id,
        placeSlotId: slot.id,
        title: product.title,
        description: product.description,
        price: product.price,
        imageUrls: product.imageUrls,
        externalUrl: product.externalUrl,
        status: 'APPROVED',
      },
    })
    console.log(`  ✓ Product: ${product.title} → ${product.placeSlug}`)
  }

  console.log('\n✅ Marketplace seeded!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
