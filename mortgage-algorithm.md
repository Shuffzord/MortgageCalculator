Below is a general-purpose algorithm (in pseudocode) for building an amortization schedule that handles:

1. **Initial costs** (e.g. arrangement fees, valuation fees) either paid up-front or added to the financed principal
2. **Multiple interest‐rate periods**, each with its own rate and duration
3. **Overpayment strategies**, both one-off lump sums and recurring extra contributions

---

## 1. Inputs

```text
Principal             ← the base loan amount
InitialCosts          ← total of fees/costs
FinanceInitialCosts?  ← boolean: true if InitialCosts are added to Principal
TermMonths            ← total term length in months
RatePeriods[]         ← list of (MonthsInPeriod, AnnualInterestRate) tuples, summing to TermMonths
PaymentFreqPerYear    ← e.g. 12 for monthly
Overpayments[]        ← list of overpayment rules, each rule is:
    {
      StartMonth,       ← month number (1…TermMonths) when overpayment begins
      EndMonth,         ← month number when it stops (or TermMonths)
      AmountPerPayment  ← extra per payment
    }
```

---

## 2. Pre-processing

1. **Adjust principal**

   ```
   if FinanceInitialCosts? then
     OutstandingPrincipal ← Principal + InitialCosts
   else
     OutstandingPrincipal ← Principal
     UpfrontCostPaid       ← InitialCosts
   ```

2. **Build flat lookup of Overpayment per month**

   ```
   for m in 1…TermMonths:
     Extra[m] ← sum of AmountPerPayment for all Overpayments rules covering month m
   ```

3. **Expand RatePeriods into each period’s start and end month**

   ```
   currentMonth ← 1
   for each (MonthsInPeriod, Rate) in RatePeriods:
     Period.start ← currentMonth
     Period.end   ← currentMonth + MonthsInPeriod – 1
     Period.rate  ← Rate
     add Period to PeriodSchedule
     currentMonth += MonthsInPeriod
   ```

---

## 3. Core Amortization Loop

```pseudocode
Schedule ← empty list

for each Period in PeriodSchedule:
  r_monthly ← Period.rate / PaymentFreqPerYear

  // Number of payments in this rate period
  n     ← Period.end – Period.start + 1

  // Compute the (fixed) payment amount for this segment,
  // using the annuity formula on the CURRENT outstanding principal:
  if r_monthly > 0:
    Payment ← r_monthly * OutstandingPrincipal
               / (1 – (1 + r_monthly)^(-n))
  else:
    Payment ← OutstandingPrincipal / n

  // Now simulate each month in this rate‐period
  for m in Period.start … Period.end:
    interest    ← OutstandingPrincipal * r_monthly
    principalRepaid ← Payment - interest

    // apply overpayment
    extra ← Extra[m]
    totalRepaid ← principalRepaid + extra

    OutstandingPrincipal ← OutstandingPrincipal - totalRepaid

    record = {
      Month: m,
      Rate: Period.rate,
      ScheduledPayment: Payment,
      InterestPortion: interest,
      PrincipalPortion: principalRepaid,
      Overpayment: extra,
      RemainingPrincipal: OutstandingPrincipal
    }
    append record to Schedule

    if OutstandingPrincipal ≤ 0:
      break out of both loops  // loan fully repaid

  if OutstandingPrincipal ≤ 0:
    break
```

---

## 4. Post-processing & Outputs

* **Schedule** will contain one entry per payment date, showing how much goes to interest, principal, extra, and what remains outstanding.
* **TotalCost** = sum of ScheduledPayment + sum of Overpayments + any UpfrontCostPaid.
* **InterestPaidTotal** = sum of all InterestPortion entries.
* **LoanEndDate** = the month index (or calendar date) when OutstandingPrincipal reached zero.

---

### Notes & Extensions

* You can easily adapt this for **bi-weekly** or **quarterly** payments by changing `PaymentFreqPerYear` and interpreting “months” accordingly.
* If you want to allow the borrower to **re-amortize** (i.e. recalculate Payment when they make a big lump overpayment), simply insert a check inside the loop: whenever an overpayment rule says “recalc payment after month m,” recompute `Payment` for the remaining term with the current principal and remaining months.
* To include **upfront costs** in the amortization schedule itself (rather than just TCO), treat them as an extra “negative payment” at month 0.

---

This framework can be implemented in any programming language (Python, Excel, Java, etc.) or even set up in a spreadsheet by turning each pseudocode step into cell formulas. Let me know if you’d like a concrete Excel layout or a short Python script!
