# Quick Integration: Adding Custom Fields to Inventory Component

## Current State

Your current `Inventory.tsx` component uses static fields:
- Name, Category, Price, Stock, Notes

## Goal

Update it to dynamically support custom fields.

## Step-by-Step Integration

### Step 1: Update ProductTable Call

**Current:**
```typescript
<ProductTable
  products={products}
  openSell={openSell}
  onEdit={setEditItem}
  onRestock={setRestockItem}
  onDelete={deleteProduct}
  loading={loading.isLoading}
/>
```

**New:**
```typescript
import { useCustomFields } from "@/hooks/useCustomFields";

export default function Inventory(props: InventoryProps) {
  const { data: customFields = [] } = useCustomFields();
  
  // ... existing code ...

  return (
    <ProductTable
      products={products}
      customFields={customFields}  // ← ADD THIS
      openSell={openSell}
      onEdit={setEditItem}
      onRestock={setRestockItem}
      onDelete={deleteProduct}
      loading={loading.isLoading}
    />
  );
}
```

### Step 2: Add Custom Fields State to Inventory

**Add to component state:**
```typescript
const [customData, setCustomData] = useState<Record<string, any>>({});

// When editing a product, also set its custom data
const handleEdit = (product: Product) => {
  setEditItem(product);
  setCustomData(product.custom_data || {});
};
```

### Step 3: Update AddProductForm

**Current code:**
```typescript
const addProductHandler = async () => {
  if (!name.trim()) {
    showMessage("error", "Product name is required");
    return;
  }
  
  const success = await addProduct({
    name,
    category,
    price,
    stock,
    notes: note,
  });
  // ...
};
```

**Updated code:**
```typescript
const addProductHandler = async () => {
  if (!name.trim()) {
    showMessage("error", "Product name is required");
    return;
  }
  
  // Validate required custom fields
  const missingRequired = customFields.filter(
    f => f.is_required && !customData[f.field_name]
  );
  if (missingRequired.length > 0) {
    showMessage(
      "error", 
      `Required: ${missingRequired.map(f => f.display_name).join(", ")}`
    );
    return;
  }
  
  const success = await addProduct({
    name,
    category,
    price,
    stock,
    notes: note,
    custom_data: customData,  // ← ADD THIS
  });
  
  if (success) {
    // Reset custom data
    setCustomData({});
    // ... rest of reset logic
  }
};
```

### Step 4: Render Custom Fields in Form

**Add after standard fields in JSX:**
```typescript
{/* Custom Fields Section */}
{customFields.length > 0 && (
  <div className="mt-6 pt-6 border-t border-white/10">
    <h4 className="text-sm font-semibold text-gray-300 mb-4">
      Additional Fields
    </h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {customFields
        .sort((a, b) => a.field_order - b.field_order)
        .map((field) => (
          <CustomFieldInput
            key={field.id}
            field={field}
            value={customData[field.field_name]}
            onChange={(val) =>
              setCustomData({
                ...customData,
                [field.field_name]: val,
              })
            }
          />
        ))}
    </div>
  </div>
)}
```

**Don't forget to import:**
```typescript
import { CustomFieldInput } from "@/components/CustomFieldInput";
import { useCustomFields } from "@/hooks/useCustomFields";
```

### Step 5: Update EditProductModal

**Similar changes to ProductForm:**
```typescript
// In edit modal/form
const [customData, setCustomData] = useState<Record<string, any>>(
  editItem?.custom_data || {}
);

// When submitting
const updateHandler = async () => {
  const success = await updateProduct(editItem.id, {
    name,
    category,
    price,
    stock,
    notes,
    custom_data: customData,  // ← ADD THIS
  });
};
```

**Then add custom field inputs same as Step 4**

### Step 6: Update RestockModal

**Keep as-is (doesn't need custom fields)**

### Step 7: Test Everything

```
1. Go to Settings → Business Type
2. Select a business type (e.g., "Pharmacy")
3. Go to Settings → Custom Fields
4. Add custom field (e.g., "batch_number")
5. Go to Inventory → Add Product
6. Fill standard fields
7. Fill custom field (should appear below)
8. Click Add Product
9. Product appears in table with custom column
10. Click Edit - custom field is editable
11. Verify changes save
```

## Complete Updated Inventory Component Structure

```typescript
"use client";

import { useEffect, useState } from "react";
import { Product, BulkSaleItem, ProductForm } from "../../types";
import { useCustomFields } from "@/hooks/useCustomFields";
import ProductTable from "./ProductTable";
import SellModal from "./SellModal";
import BulkSellModal from "./BulkSellModal";
import AddProductForm from "./components/AddProductForm";
import RestockModal from "./components/RestockModal";
import EditProductModal from "./components/EditProductModal";
import { CustomFieldInput } from "@/components/CustomFieldInput";

export default function Inventory(props: InventoryProps) {
  const { products, categories, loading, addProduct, updateProduct, ... } = props;
  
  // NEW: Get custom fields
  const { data: customFields = [] } = useCustomFields();
  
  // State for form
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories?.[0] ?? "");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [note, setNote] = useState("");
  const [customData, setCustomData] = useState<Record<string, any>>({});
  
  // ... other state ...

  const addProductHandler = async () => {
    if (!name.trim()) {
      showMessage("error", "Product name is required");
      return;
    }

    // NEW: Validate required custom fields
    const missingRequired = customFields.filter(
      f => f.is_required && !customData[f.field_name]
    );
    if (missingRequired.length > 0) {
      showMessage(
        "error", 
        `Required: ${missingRequired.map(f => f.display_name).join(", ")}`
      );
      return;
    }

    const success = await addProduct({
      name,
      category,
      price,
      stock,
      notes: note,
      custom_data: customData,  // NEW
    });

    if (success) {
      setName("");
      setPrice(0);
      setStock(0);
      setNote("");
      setCustomData({});  // NEW
      showMessage("success", "Product added!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Product Form */}
      <div className="space-y-4">
        <AddProductForm
          name={name}
          setName={setName}
          category={category}
          setCategory={setCategory}
          price={price}
          setPrice={setPrice}
          stock={stock}
          setStock={setStock}
          categories={categories}
          loadingCategories={false}
          addProductHandler={addProductHandler}
        />

        {/* NEW: Custom Fields Section */}
        {customFields.length > 0 && (
          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customFields
                .sort((a, b) => a.field_order - b.field_order)
                .map((field) => (
                  <CustomFieldInput
                    key={field.id}
                    field={field}
                    value={customData[field.field_name]}
                    onChange={(val) =>
                      setCustomData({
                        ...customData,
                        [field.field_name]: val,
                      })
                    }
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Table with Custom Columns */}
      <ProductTable
        products={products}
        customFields={customFields}  // NEW
        openSell={openSell}
        onEdit={handleEdit}
        onRestock={setRestockItem}
        onDelete={deleteProduct}
        loading={loading.isLoading}
      />

      {/* Other modals - no changes needed */}
      {sellItem && <SellModal ... />}
      {editItem && <EditProductModal ... />}
      {restockItem && <RestockModal ... />}
    </div>
  );
}
```

## Common Pitfalls

### ❌ Forgetting to import useCustomFields
```typescript
// WRONG
const { data: customFields } = useQuery(...);

// RIGHT
import { useCustomFields } from "@/hooks/useCustomFields";
const { data: customFields } = useCustomFields();
```

### ❌ Not resetting customData after add/edit
```typescript
// WRONG
if (success) {
  setName("");
  // missing: setCustomData({});
}

// RIGHT
if (success) {
  setName("");
  setCustomData({});  // Always reset
}
```

### ❌ Not validating required fields
```typescript
// WRONG - Missing validation
const success = await addProduct({ ... });

// RIGHT - Check required fields
const missingRequired = customFields.filter(
  f => f.is_required && !customData[f.field_name]
);
if (missingRequired.length > 0) return;
```

### ❌ Not sorting fields by field_order
```typescript
// WRONG
{customFields.map(...)}

// RIGHT
{customFields.sort((a,b) => a.field_order - b.field_order).map(...)}
```

## How to Verify It Works

### Test Checklist

```
[ ] Custom field appears in Add form
[ ] All 7 field types work (text, number, currency, etc.)
[ ] Required fields show validation error
[ ] Custom field value saves with product
[ ] Custom column appears in product table
[ ] Column header shows custom field name
[ ] Edit product shows custom field value
[ ] Can update custom field value
[ ] Field order respected in form and table
[ ] Hidden fields don't appear
[ ] Mobile view looks good
```

### Console Debugging

```javascript
// In browser console
// Check what's being sent to API
console.log(customData);

// Check what comes back from API
// In ProductTable component
products.forEach(p => console.log(p.custom_data));
```

## Testing Edge Cases

### No Custom Fields
- Add product without any custom fields
- Should work normally with just standard fields

### All Custom Fields Required
- Add product without filling custom field
- Should show error: "Required: [Field Name]"

### Mixed Required/Optional
- Some fields required, some not
- Only required fields should error if missing

### Different Field Types
```typescript
// All should work:
✓ Text: "batch_number"
✓ Number: 24
✓ Date: "2025-06-15"
✓ Currency: 12.50
✓ Select: "Location A"
✓ Checkbox: true
✓ Textarea: "Multi-line text..."
```

---

That's it! Your Inventory component now supports unlimited custom fields.

**Estimated integration time: 1-2 hours**

Have questions? Check the component source files or the IMPLEMENTATION_GUIDE.md
