import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
  decimal,
  integer,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const variantStatusEnum = pgEnum("variant_status", [
  "active",
  "inactive",
]);
export const billingTypeEnum = pgEnum("billing_type", [
  "one_time",
  "recurring",
  "usage_based",
]);
export const frequencyEnum = pgEnum("frequency", [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
  "lifetime",
]);
export const planStatusEnum = pgEnum("plan_status", ["active", "inactive"]);
export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);
export const customerStatusEnum = pgEnum("customer_status", [
  "active",
  "inactive",
  "churned",
  "prospect",
  "lead",
]);
export const customerTypeEnum = pgEnum("customer_type", [
  "individual",
  "business",
  "enterprise",
]);
export const platformEnum = pgEnum("platform", [
  "web",
  "mobile",
  "whatsapp",
  "telegram",
  "slack",
  "email",
  "phone",
  "sms",
]);
export const organizationRoleEnum = pgEnum("organization_role", [
  "admin",
  "member",
  "viewer",
]);
export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "inactive",
  "pending",
]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "cancelled",
]);

// 1. Tenants Table
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    workosOrganizationId: varchar("workos_organization_id", {
      length: 255,
    }).unique(),
    domain: varchar("domain", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    workosOrgIdx: index("tenants_workos_org_idx").on(
      table.workosOrganizationId,
    ),
  }),
);

// 2. Products Table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Product Variants Table
export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  status: variantStatusEnum("status").default("active").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Pricing Plans Table
export const pricingPlans = pgTable("pricing_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  billingType: billingTypeEnum("billing_type").notNull(),
  frequency: frequencyEnum("frequency"),
  unit: varchar("unit", { length: 100 }),
  status: planStatusEnum("status").default("active").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Pricing Tiers Table
export const pricingTiers = pgTable("pricing_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => pricingPlans.id, { onDelete: "cascade" }),
  startQuantity: integer("start_quantity").notNull(),
  endQuantity: integer("end_quantity"),
  pricePerUnit: decimal("price_per_unit", {
    precision: 10,
    scale: 4,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Users Table
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    workosUserId: varchar("workos_user_id", { length: 255 }).unique(),
    workosProfileId: varchar("workos_profile_id", { length: 255 }).unique(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    tenantEmailIdx: index("users_tenant_email_idx").on(
      table.tenantId,
      table.email,
    ),
    workosUserIdx: index("users_workos_user_idx").on(table.workosUserId),
    workosProfileIdx: index("users_workos_profile_idx").on(
      table.workosProfileId,
    ),
  }),
);

// 7. Customers Table
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Core Identity
    email: varchar("email", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    phone: varchar("phone", { length: 50 }),

    // Classification
    status: customerStatusEnum("status").default("prospect").notNull(),
    customerType: customerTypeEnum("customer_type").default("individual"),

    // Integration (for CRM sync)
    externalIds: jsonb("external_ids")
      .$type<Record<string, string>>()
      .default({}),

    // Flexible metadata
    metadata: jsonb("metadata").$type<Record<string, any>>().default({}),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    tenantEmailIdx: index("customers_tenant_email_idx").on(
      table.tenantId,
      table.email,
    ),
  }),
);

// 8. Conversations Table
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id),

    // Platform identification
    platform: platformEnum("platform").notNull(),

    // Timing
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),

    // Metadata
    metadata: jsonb("metadata").$type<Record<string, any>>(),
  },
  (table) => ({
    uniqueCustomerPlatform: unique("conversations_customer_platform_unique").on(
      table.tenantId,
      table.customerId,
      table.platform,
    ),
    customerIdx: index("conversations_customer_idx").on(table.customerId),
  }),
);

// 9. Messages Table
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdx: index("messages_conversation_idx").on(
      table.conversationId,
    ),
  }),
);

// 10. Customer Segments Table
export const customerSegments = pgTable(
  "customer_segments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Segment Definition
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("customer_segments_tenant_idx").on(table.tenantId),
  }),
);

// 11. Customer Segment Membership Table
export const customerSegmentMembership = pgTable(
  "customer_segment_membership",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    segmentId: uuid("segment_id")
      .notNull()
      .references(() => customerSegments.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueMembership: unique("customer_segment_membership_unique").on(
      table.customerId,
      table.segmentId,
    ),
  }),
);

// 12. Agent Configs Table
export const agentConfigs = pgTable("agent_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" })
    .unique(),
  agentName: varchar("agent_name", { length: 255 }).notNull(),
  agentIdentity: text("agent_identity"),
  systemPrompt: text("system_prompt"),
  personality: varchar("personality", { length: 100 }),
  enabledDomains: jsonb("enabled_domains")
    .notNull()
    .default(["public", "product", "customer", "operational"]),
  features: jsonb("features").default({}),
  mcpServers: jsonb("mcp_servers").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 13. Organization Memberships Table
export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    role: organizationRoleEnum("role").notNull().default("member"),
    status: membershipStatusEnum("status").notNull().default("active"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueMembership: unique("organization_memberships_unique").on(
      table.userId,
      table.organizationId,
    ),
    userIdx: index("organization_memberships_user_idx").on(table.userId),
    organizationIdx: index("organization_memberships_organization_idx").on(
      table.organizationId,
    ),
  }),
);

// 14. Organization Invitations Table
export const organizationInvitations = pgTable(
  "organization_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: organizationRoleEnum("role").notNull().default("member"),
    status: invitationStatusEnum("status").notNull().default("pending"),
    invitedBy: uuid("invited_by").references(() => users.id),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index("organization_invitations_organization_idx").on(
      table.organizationId,
    ),
    emailIdx: index("organization_invitations_email_idx").on(table.email),
    statusIdx: index("organization_invitations_status_idx").on(table.status),
  }),
);

// Relations
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  products: many(products),
  productVariants: many(productVariants),
  pricingPlans: many(pricingPlans),
  pricingTiers: many(pricingTiers),
  users: many(users),
  customers: many(customers),
  conversations: many(conversations),
  messages: many(messages),
  customerSegments: many(customerSegments),
  agentConfig: one(agentConfigs),
  memberships: many(organizationMemberships),
  invitations: many(organizationInvitations),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [productVariants.tenantId],
      references: [tenants.id],
    }),
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    pricingPlans: many(pricingPlans),
  }),
);

export const pricingPlansRelations = relations(
  pricingPlans,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [pricingPlans.tenantId],
      references: [tenants.id],
    }),
    variant: one(productVariants, {
      fields: [pricingPlans.variantId],
      references: [productVariants.id],
    }),
    tiers: many(pricingTiers),
  }),
);

export const pricingTiersRelations = relations(pricingTiers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [pricingTiers.tenantId],
    references: [tenants.id],
  }),
  plan: one(pricingPlans, {
    fields: [pricingTiers.planId],
    references: [pricingPlans.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  memberships: many(organizationMemberships),
  sentInvitations: many(organizationInvitations),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  conversations: many(conversations),
  segmentMemberships: many(customerSegmentMembership),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [conversations.tenantId],
      references: [tenants.id],
    }),
    customer: one(customers, {
      fields: [conversations.customerId],
      references: [customers.id],
    }),
    messages: many(messages),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  tenant: one(tenants, {
    fields: [messages.tenantId],
    references: [tenants.id],
  }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const customerSegmentsRelations = relations(
  customerSegments,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [customerSegments.tenantId],
      references: [tenants.id],
    }),
    memberships: many(customerSegmentMembership),
  }),
);

export const customerSegmentMembershipRelations = relations(
  customerSegmentMembership,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerSegmentMembership.customerId],
      references: [customers.id],
    }),
    segment: one(customerSegments, {
      fields: [customerSegmentMembership.segmentId],
      references: [customerSegments.id],
    }),
  }),
);

export const agentConfigsRelations = relations(agentConfigs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [agentConfigs.tenantId],
    references: [tenants.id],
  }),
}));

export const organizationMembershipsRelations = relations(
  organizationMemberships,
  ({ one }) => ({
    user: one(users, {
      fields: [organizationMemberships.userId],
      references: [users.id],
    }),
    organization: one(tenants, {
      fields: [organizationMemberships.organizationId],
      references: [tenants.id],
    }),
  }),
);

export const organizationInvitationsRelations = relations(
  organizationInvitations,
  ({ one }) => ({
    organization: one(tenants, {
      fields: [organizationInvitations.organizationId],
      references: [tenants.id],
    }),
    invitedBy: one(users, {
      fields: [organizationInvitations.invitedBy],
      references: [users.id],
    }),
  }),
);

// Type exports
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

export type PricingPlan = typeof pricingPlans.$inferSelect;
export type NewPricingPlan = typeof pricingPlans.$inferInsert;

export type PricingTier = typeof pricingTiers.$inferSelect;
export type NewPricingTier = typeof pricingTiers.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type CustomerSegment = typeof customerSegments.$inferSelect;
export type NewCustomerSegment = typeof customerSegments.$inferInsert;

export type CustomerSegmentMembership =
  typeof customerSegmentMembership.$inferSelect;
export type NewCustomerSegmentMembership =
  typeof customerSegmentMembership.$inferInsert;

export type AgentConfig = typeof agentConfigs.$inferSelect;
export type NewAgentConfig = typeof agentConfigs.$inferInsert;

export type OrganizationMembership =
  typeof organizationMemberships.$inferSelect;
export type NewOrganizationMembership =
  typeof organizationMemberships.$inferInsert;

export type OrganizationInvitation =
  typeof organizationInvitations.$inferSelect;
export type NewOrganizationInvitation =
  typeof organizationInvitations.$inferInsert;
