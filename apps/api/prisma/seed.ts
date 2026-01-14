import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Arcana database...');

  // Seed family members
  const familyMembers = [
    { name: 'Aliou', birthDate: new Date('1985-05-05'), isChild: false },
    { name: 'Sylvia', birthDate: new Date('1986-09-05'), isChild: false },
    { name: 'Sacha', birthDate: new Date('2016-11-08'), isChild: true },
    { name: 'Lisa', birthDate: new Date('2019-10-31'), isChild: true },
  ];

  for (const member of familyMembers) {
    const user = await prisma.user.upsert({
      where: { name: member.name },
      update: {
        birthDate: member.birthDate,
        isChild: member.isChild,
      },
      create: member,
    });
    console.log(`  ✅ ${user.isChild ? '👶' : '👤'} ${user.name} (${user.birthDate.toLocaleDateString('fr-FR')})`);
  }

  console.log('\n✨ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
