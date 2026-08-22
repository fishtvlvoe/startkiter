-- CreateTable
CREATE TABLE "SidebarGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SidebarGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SidebarGroupItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SidebarGroupItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SidebarGroupItem_groupId_idx" ON "SidebarGroupItem"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "SidebarGroupItem_menuItemId_key" ON "SidebarGroupItem"("menuItemId");

-- AddForeignKey
ALTER TABLE "SidebarGroupItem" ADD CONSTRAINT "SidebarGroupItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SidebarGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
