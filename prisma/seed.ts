import { PrismaClient } from '../lib/generated/prisma-client'
import bcrypt from 'bcryptjs'


const prisma = new PrismaClient()

async function main() {
  try {
    // Seed Institute data
    const institute = await prisma.institute.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        id: 'singleton',
        prapok: 'উপ-পরিচালক, কৃষি সম্প্রসারণ অধিদপ্তর',
        name: 'মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট আঞ্চলিক গবেষণাগার',
        address: 'যশোর',
        issuedby: 'মোঃ জয়নাল আবেদিন',
        phone: '01717171717',
        updatedAt: new Date()
      },
    })

    // Seed default user
    const defaultPassword = 'Admin123!@#' // Meets all password requirements
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)
    
    const defaultUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        imageUrl: 'https://avatar.vercel.sh/Admin%20User.png?text=AD'
      },
    })

    console.log({ institute, defaultUser })
  } catch (error) {
    console.error('Error seeding data:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })