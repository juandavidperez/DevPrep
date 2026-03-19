import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  console.log('Starting seeding...')

  const seedDir = path.join(__dirname, 'seeds')
  const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'))

  let totalCreated = 0

  for (const file of files) {
    const filePath = path.join(seedDir, file)
    const rawData = fs.readFileSync(filePath, 'utf-8')
    const questions = JSON.parse(rawData)

    console.log(`Processing ${file} (${questions.length} questions)...`)

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const externalId = `${file.replace('.json', '')}-${i}`

      // Check if this seed question already exists by matching on source + questionText
      const existing = await prisma.questionBank.findFirst({
        where: {
          source: 'curated',
          questionText: q.questionText,
        },
      })

      if (!existing) {
        await prisma.questionBank.create({
          data: {
            ...q,
            source: 'curated',
          },
        })
        totalCreated++
      }
    }
  }

  console.log(`Seeding complete. Created ${totalCreated} new questions.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
