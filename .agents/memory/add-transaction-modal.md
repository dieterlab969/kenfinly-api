---
name: AddTransactionModal defaultType prop
description: Modal accepts defaultType to pre-select income/expense from FAB picker
---

## Change made
Added optional `defaultType = 'expense'` prop. A useEffect resets the internal `type` state whenever the modal opens:

```js
useEffect(() => {
    if (isOpen) setType(defaultType);
}, [isOpen, defaultType]);
```

**Why:** FAB picker lets users select "Add Income" or "Add Expense" before opening the modal.
Without this, the modal always defaults to 'expense' regardless of which FAB option was tapped.

## Usage
```jsx
<AddTransactionModal
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    onSuccess={handleTransactionAdded}
    defaultType={modalType}   // 'income' | 'expense'
/>
```
