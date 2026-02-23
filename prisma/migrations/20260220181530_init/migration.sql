-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "costPrice" REAL NOT NULL,
    "sellingPrice" REAL NOT NULL,
    "supplier" TEXT NOT NULL,
    "expirationDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "inventory_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "cuisineType" TEXT NOT NULL,
    "prepTime" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TO_TRY',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recipes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    CONSTRAINT "recipe_ingredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_RecipeSharedWith" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RecipeSharedWith_A_fkey" FOREIGN KEY ("A") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RecipeSharedWith_B_fkey" FOREIGN KEY ("B") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipeId_idx" ON "recipe_ingredients"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "_RecipeSharedWith_AB_unique" ON "_RecipeSharedWith"("A", "B");

-- CreateIndex
CREATE INDEX "_RecipeSharedWith_B_index" ON "_RecipeSharedWith"("B");
