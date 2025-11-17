import { model } from "@medusajs/framework/utils"

const Product = model.define("product", {
  vendor_id: model.text().nullable(),
  condition: model.text().nullable(),
  approval_status: model.text().default("pending"),
})

export default Product