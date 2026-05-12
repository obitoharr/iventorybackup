# Custom Fields & Multi-Business Type Setup Guide

## Overview

This inventory system now supports **unlimited custom fields** per tenant, allowing each user/business to customize their product table based on their specific business type.

## Supported Business Types

1. **Pharmacy** - Medicines, health products (batch number, expiry date, manufacturer)
2. **NGO** - Non-profit organizations (donor info, program type, date distributed)
3. **Warehouse** - Bulk storage and distribution (location/bin, quantity per unit, supplier)
4. **Supermarket** - Retail grocery and general goods (shelf location, barcode, supplier)
5. **Retail Shop** - Small retail store (vendor, supplier, reorder level)
6. **Distributor** - Wholesale distributor (warehouse location, minimum order qty, lead time)
7. **Custom** - Define your own business type

## Setting Up Your Inventory

### Step 1: Go to Settings

1. Click **Settings** in the left sidebar
2. Click the **Business Type** tab

### Step 2: Select Your Business Type

Choose the business type that best matches your operation. If you're not sure or have a unique setup, select **Custom** and describe your business.

**Why this matters:**
- Helps us provide relevant recommendations
- Pre-populates common fields for your industry (coming soon)
- Determines default table layouts

### Step 3: Customize Your Product Table

1. Go to **Settings** → **Custom Fields** tab
2. Click **Add Custom Field**
3. Fill in the field details:

#### Field Details Form

| Field | Description | Example |
|-------|-------------|---------|
| **Field Name (database)** | Internal name (no spaces, lowercase) | `batch_number`, `shelf_location` |
| **Display Name** | What users see in the table | `Batch Number`, `Shelf Location` |
| **Field Type** | Data type for this field | Text, Number, Date, Select, etc. |
| **Default Value** | Auto-fill when creating products | "TBD", "0" |
| **Description** | Help text (shown as tooltip) | "Leave blank if not applicable" |
| **Required Field** | Must be filled when creating products | ✓ for critical fields |
| **Visible in Table** | Show in product list (can hide if for internal use) | ✓ for important fields |

## Field Types Explained

### 1. **Text**
- Single-line text input
- Use for: Batch number, lot code, supplier name, SKU
- Example: "LOT2024001"

### 2. **Textarea**
- Multi-line text input
- Use for: Detailed notes, specifications, warnings
- Example: "Keep refrigerated, handle with care"

### 3. **Number**
- Numeric input only
- Use for: Quantity per unit, reorder level, minimum stock
- Example: "24" (units per case)

### 4. **Currency**
- Money value with $ prefix
- Use for: Cost price, wholesale price, supplier price
- Example: "$12.50"

### 5. **Date**
- Date picker
- Use for: Expiry date, manufacturing date, purchase date
- Example: "2025-06-15"

### 6. **Select (Dropdown)**
- Choose from predefined options
- Use for: Categories, storage location, supplier
- **Add options one per line:**
  ```
  Location A
  Location B
  Location C
  ```

### 7. **Checkbox**
- True/False toggle
- Use for: In stock, fragile, requires refrigeration
- Example: ✓ (checked = yes)

## Example Setups by Business Type

### Pharmacy Example

```
Field Name           | Display Name        | Type     | Required | Visible
--------------------|---------------------|----------|----------|--------
batch_number         | Batch Number        | Text     | Yes      | Yes
expiry_date          | Expiry Date         | Date     | Yes      | Yes
manufacturer         | Manufacturer        | Text     | Yes      | Yes
strength             | Strength/Dosage     | Text     | No       | Yes
storage_temp         | Storage Temperature | Text     | No       | No
requires_refrigeration | Needs Refrigeration | Checkbox | No       | Yes
```

### Warehouse Example

```
Field Name              | Display Name         | Type    | Required | Visible
------------------------|----------------------|---------|----------|--------
bin_location            | Bin Location         | Text    | Yes      | Yes
quantity_per_unit       | Qty Per Unit         | Number  | Yes      | Yes
supplier_name           | Supplier Name        | Text    | Yes      | Yes
cost_price              | Cost Price           | Currency | Yes      | Yes
last_received_date      | Last Received        | Date    | No       | No
reorder_level           | Reorder Level        | Number  | Yes      | No
```

### Supermarket Example

```
Field Name             | Display Name        | Type     | Required | Visible
-----------------------|---------------------|----------|----------|--------
barcode                | Barcode             | Text     | No       | No
shelf_location         | Shelf Location      | Select   | Yes      | Yes
supplier               | Supplier            | Text     | Yes      | Yes
shelf_life_days        | Shelf Life (days)   | Number   | No       | No
is_promotional         | On Promotion        | Checkbox | No       | Yes
promo_discount_percent | Discount %          | Number   | No       | No
```

### NGO Example

```
Field Name             | Display Name        | Type     | Required | Visible
-----------------------|---------------------|----------|----------|--------
donor_name             | Donor Name          | Text     | Yes      | Yes
program_type           | Program Type        | Select   | Yes      | Yes
date_received          | Date Received       | Date     | Yes      | Yes
distribution_location  | Distribution Area   | Text     | Yes      | Yes
beneficiaries_count    | # of Beneficiaries  | Number   | No       | No
is_restricted          | Restricted Use      | Checkbox | No       | No
```

## Managing Custom Fields

### Reordering Fields

- Use **⬆️ Up** and **⬇️ Down** buttons to reorder fields in your table
- Order is preserved when viewing products

### Editing Fields

1. Click **✏️ Edit** on any field
2. Modify the field details
3. Click **Update Field**

**Note:** Cannot change field name after creation (to prevent data loss)

### Deleting Fields

1. Click **🗑️ Delete** on any field
2. Confirm deletion

**Warning:** This removes the field definition but keeps historical data

### Hiding Fields

- Uncheck **Visible in Table** to hide field from product list
- Useful for internal-only fields (like notes, supplier cost)
- Data is still stored and visible in detail view

## Using Custom Fields

### When Adding Products

1. Go to **Inventory** → **Add New Product**
2. Fill in standard fields (Name, Category, Price, Stock)
3. Scroll down to see your custom fields
4. Fill in required custom fields (marked with *)
5. Click **Add Product**

### In the Product Table

- Custom fields appear as columns after standard columns
- Click on any product to see all custom field values
- Hover over column headers to see field descriptions

### When Editing Products

1. Click **✏️ Edit** on a product
2. Standard and custom fields are all editable
3. Save changes

### In Reports

Custom fields are included in:
- Product exports (CSV, Excel)
- Analytics data
- Audit logs

## Best Practices

### 1. **Keep Field Names Simple**
- Use lowercase with underscores: `expiry_date` not `Expiry Date!`
- This makes exports and integrations easier

### 2. **Use Descriptions**
- Add helpful descriptions for complex fields
- Helps team members understand what to fill in

### 3. **Make Required Only When Necessary**
- Too many required fields = data entry friction
- Use for critical business data only

### 4. **Organize by Importance**
- Reorder fields so most important appear first
- Consider your typical workflow

### 5. **Use Select for Standard Values**
- Instead of free text, use dropdown for consistency
- Makes reporting and filtering easier
- Example: `location` as select, not text

### 6. **Test Before Wide Rollout**
- Create fields and test on a few products first
- Adjust before team members start using it

## Field Type Recommendations by Use Case

| Use Case | Recommended Type | Why |
|----------|------------------|-----|
| Expiry Date | Date | Easy filtering/sorting, built-in date validation |
| Binary Choice | Checkbox | Clear yes/no, not confusing |
| Fixed Options | Select | Consistent data, better reports |
| Measurement | Number | Calculations, comparisons |
| Money | Currency | Auto-formatted, Excel-friendly |
| Notes | Textarea | Unlimited space, formatting support |

## API Integration

### Creating a Product with Custom Fields

```javascript
const product = {
  name: "Ibuprofen 200mg",
  category: "Pain Relief",
  price: 5.99,
  stock: 100,
  notes: "Regular strength",
  custom_data: {
    batch_number: "LOT2024001",
    expiry_date: "2025-06-15",
    manufacturer: "Generic Pharma",
    strength: "200mg",
    requires_refrigeration: false
  }
};

await fetch("/api/products", {
  method: "POST",
  body: JSON.stringify(product)
});
```

### Fetching Products with Custom Fields

```javascript
const response = await fetch("/api/products");
const { data: products } = await response.json();

// Access custom fields
products.forEach(p => {
  console.log(p.name, p.custom_data.batch_number);
});
```

## Troubleshooting

### Issue: Custom field not showing in product table

**Solution:**
- Check that `is_visible` is enabled for the field
- Refresh the page
- Make sure products have been created after field was added

### Issue: Cannot delete a field

**Solution:**
- Fields are soft-deleted (can be restored)
- Contact support if you need to permanently remove historical data

### Issue: Field values not saving

**Solution:**
- Check that field name has no spaces or special characters
- Verify data type matches field type (e.g., number field with text)
- Check browser console for error messages

### Issue: Select dropdown options not showing

**Solution:**
- Make sure each option is on a new line
- Options are case-sensitive
- No leading/trailing spaces

## Migration from Standard to Custom

If you started with just standard fields and want to add custom fields:

1. Go to Settings → Custom Fields
2. Click "Add Custom Field"
3. Create your fields
4. **Optional:** Edit existing products to fill in new custom data
5. New products will require custom field data (if marked required)

## Data Export

When exporting products:
- Custom fields are included in CSV/Excel exports
- Field names are used as column headers
- All field types are exported as text
- Use Excel formulas to convert types as needed

## Performance Notes

- Custom fields are stored as JSONB in database
- Indexed for fast queries
- No performance impact up to 50+ fields
- Custom fields are loaded with products automatically

---

## Next Steps

1. ✅ Choose your business type (Settings → Business Type)
2. ✅ Define your custom fields (Settings → Custom Fields)
3. ✅ Add a test product with the new fields
4. ✅ Customize table order and visibility
5. ✅ Train your team on filling in custom fields

**Questions?** Check the in-app help or contact support.
