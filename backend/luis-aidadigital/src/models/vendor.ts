import { model } from "@medusajs/framework/utils"

const Vendor = model.define("vendor", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  status: model.text().default("pending"),
  verified: model.boolean().default(false),
  products_count: model.number().default(0),
  total_sales: model.bigNumber().default(0),
  commission: model.bigNumber().default(0),
  rating: model.number().default(0),
  stripe_account_id: model.text().nullable(),
  avatar: model.text().nullable(),
})

export default Vendor