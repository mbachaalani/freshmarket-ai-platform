import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: "ADMIN" },
    create: {
      name: "Admin User",
      email: "admin@example.com",
      role: "ADMIN"
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: { role: "MANAGER" },
    create: {
      name: "Manager User",
      email: "manager@example.com",
      role: "MANAGER"
    }
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: { role: "STAFF" },
    create: {
      name: "Staff User",
      email: "staff@example.com",
      role: "STAFF"
    }
  });

  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.inventoryItem.deleteMany();

  await prisma.inventoryItem.createMany({
    data: [
      {
        name: "Gala Apples",
        category: "Fruit",
        quantity: 24,
        unit: "kg",
        costPrice: 1.2,
        sellingPrice: 2.4,
        supplier: "Orchard Farms",
        expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12),
        status: "IN_STOCK",
        createdById: admin.id
      },
      {
        name: "Baby Spinach",
        category: "Vegetable",
        quantity: 6,
        unit: "box",
        costPrice: 8,
        sellingPrice: 14.5,
        supplier: "Green Leaf Co.",
        expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
        status: "LOW_STOCK",
        createdById: manager.id
      },
      {
        name: "Bell Peppers Mix",
        category: "Vegetable",
        quantity: 11,
        unit: "box",
        costPrice: 7.5,
        sellingPrice: 13,
        supplier: "Sunrise Produce",
        expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9),
        status: "IN_STOCK",
        createdById: staff.id
      }
    ]
  });

  await prisma.recipe.create({
    data: {
      name: "Mediterranean Veggie Bowl",
      ingredients: {
        create: [
          { name: "chickpeas" },
          { name: "spinach" },
          { name: "tomato" },
          { name: "olive oil" },
          { name: "lemon" }
        ]
      },
      instructions: "Roast chickpeas, saute spinach, combine with diced tomatoes and drizzle with lemon olive oil.",
      cuisineType: "Mediterranean",
      prepTime: 25,
      status: "FAVORITE",
      createdById: admin.id,
      sharedWith: {
        connect: [{ id: manager.id }, { id: staff.id }]
      }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
