# CSV Import Guide

This guide explains how to use the CSV import feature to bulk import financial transactions into Kenfinly.

## CSV Format

The CSV file should contain the following columns:

1. **Date**: Month in format `MM/YYYY` (e.g., `12/2023`, `01/2024`)
2. **Income**: Monthly income amount (positive number or 0)
3. **Expense**: Monthly expense amount (negative number or 0)
4. **Total**: Net total for the month (Income + Expense)

Example:
```csv
Date,Income,Expense,Total
12/2023,4800000,-1809000,2991000
01/2024,500000,-17286600,-16786600
```

## Import Command

Use the Artisan command to import your CSV:

```bash
php artisan transactions:import-csv "path/to/your/file.csv" user@example.com
```

**Parameters:**
- `path/to/your/file.csv`: Full path to your CSV file
- `user@example.com`: Email address of the user account to import data into

## What Happens During Import

1. **Account Creation**: A VND account is created (or existing one is used)
2. **Category Creation**: Import categories are created for tracking
3. **Transaction Generation**:
   - One income transaction per month on the 1st day
   - Daily expense transactions distributed evenly across the month
   - Final day gets adjusted amount to match exact total
4. **Balance Updates**: Account balance updated after each transaction

## Example Output

```
Starting CSV import for user: John Doe (john@example.com)
Created new VND account: VND Wallet (Imported)
Found 24 months of data to import.
Processing December 2023 - Income: 4800000 VND, Expense: 1809000 VND
...
✅ Import completed successfully!
Total transactions created: 741
Total income: 22,811,000 VND
Total expense: 608,074,853 VND
Final account balance: -585,263,853.00 VND
```

## Currency

All amounts in the CSV are assumed to be in Vietnamese Dong (VND). The system will:
- Create a VND account if one doesn't exist
- Store all transactions in VND
- Display amounts with proper VND formatting (no decimal places)

## Notes

- The import is wrapped in a database transaction - if any error occurs, all changes are rolled back
- Existing transactions are not affected
- You can run the import multiple times (it will create duplicate transactions)
- The command validates that the user exists before starting
