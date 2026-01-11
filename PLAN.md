let's consider this a new feature, and plan accordingly. no changes yet to be applied until we curate the plan correctly, okay?

There will be a new form with fields:
0. Transfer Amount (Big on the top, center aligned; the rest are left-aligned, though are hooked to the edges; just the amount is centered annd a bit smaller)
1. Type of transfer: Withdraw, Transfer, Deposit
- Withdraw is for transactions Bank to Cash
- Transfer is Bank to Bank (or eWallets as well like GCash and Maya)
- Deposit is Cash to Bank/eWallet
2. Source Account
3. Destination Account
(Accounts are selected from existing On budget and unclosed accounts)
4. Fee  (Transfer Fee or withdraw fee)
4.1 Checkbox - No Fee (Free transfer/Withdraw)
- If Checkbox is unchecked, then we don't have a Fee field visible
- Otherwise, visible
4. ATM / Source (As Payee)
- Basically if it's a withdraw, then usually it would be a bank atm
- If it's a transfer, usually we pay the origin/source bank/wallet e.g. Maya, GCash
Submit
- If Type of transfer was "Transfer", then we don't need this field
- If type is either Withdraw or Deposit, we will need this field

How this record reflects in Actual Budget:
1. If it's no fee, then we just see one single record
- Payee is just the destination account
- Category is usually "Transfer", which is not from the list of categories
- Notes would include the ATM / Source Bank (e.g. BPI ATM or if source, Maya/GCash/etc)
2. If there is a fee, then we'll have a split transaction
- Main record:
-- Payee is the ATM/Source e.g. BPI ATM or Maya/GCash (as Payee, not the accounts; hard distinguish because they are listed as payees even if they are accounts)
-- Category is Split (this automatically happens when the main transaction has children)
-- Amount is the total amount (Transfer Amount + Fee)

- Child record 1:
--- Payee is the destination account