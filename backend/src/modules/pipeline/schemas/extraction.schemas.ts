import Anthropic from '@anthropic-ai/sdk';
import { DocumentType } from '../../documents/enums/document.enums';

/**
 * One Anthropic Tool per DocumentType.
 *
 * Using tool_choice: { type: 'tool' } forces the model to call the tool,
 * guaranteeing a parsed, schema-validated object in ToolUseBlock.input —
 * no JSON.parse, no format errors, no hallucinated keys.
 *
 * Every schema includes `extractionConfidence` (required) — the model's
 * self-assessed confidence in the overall extraction quality (0.0–1.0).
 * This is used by stepValidate to apply confidence thresholds and set
 * BorrowerFlag.LOW_EXTRACTION_CONFIDENCE on the borrower profile.
 */
export const EXTRACTION_TOOLS: Record<DocumentType, Anthropic.Tool> = {
  [DocumentType.FORM_1040]: {
    name: 'extract_form_1040',
    description:
      'Extract financial data from a Form 1040 US Individual Income Tax Return.',
    input_schema: {
      type: 'object' as const,
      properties: {
        taxpayerName: {
          type: 'string',
          description: 'Primary taxpayer full name',
        },
        coTaxpayerName: {
          type: 'string',
          description: 'Co-taxpayer / spouse full name',
        },
        ssn: {
          type: 'string',
          description: 'Primary taxpayer SSN (XXX-XX-XXXX)',
        },
        coSsn: { type: 'string', description: 'Co-taxpayer SSN (XXX-XX-XXXX)' },
        taxYear: { type: 'integer', description: 'Tax year e.g. 2023' },
        filingStatus: {
          type: 'string',
          enum: [
            'single',
            'married_filing_jointly',
            'married_filing_separately',
            'head_of_household',
            'qualifying_widow',
          ],
        },
        address: { type: 'string', description: 'Current home address' },
        adjustedGrossIncome: { type: 'number' },
        totalTaxableIncome: { type: 'number' },
        totalTax: { type: 'number' },
        federalTaxWithheld: { type: 'number' },
        refundAmount: { type: 'number' },
        amountOwed: { type: 'number' },
        jointFiling: { type: 'boolean' },
        extractionConfidence: {
          type: 'number',
          description:
            'Self-assessed confidence in the overall extraction quality (0.0–1.0)',
        },
      },
      required: [
        'taxpayerName',
        'taxYear',
        'adjustedGrossIncome',
        'extractionConfidence',
      ],
    },
  },

  [DocumentType.BANK_STATEMENT]: {
    name: 'extract_bank_statement',
    description: 'Extract financial data from a bank account statement.',
    input_schema: {
      type: 'object' as const,
      properties: {
        bankName: { type: 'string' },
        accountNumber: {
          type: 'string',
          description: 'Full or masked account number',
        },
        accountType: {
          type: 'string',
          enum: ['checking', 'savings', 'investment', 'retirement', 'other'],
        },
        accountHolderName: { type: 'string' },
        statementPeriodStart: { type: 'string', description: 'ISO 8601 date' },
        statementPeriodEnd: { type: 'string', description: 'ISO 8601 date' },
        beginningBalance: { type: 'number' },
        endingBalance: { type: 'number' },
        totalDeposits: { type: 'number' },
        totalWithdrawals: { type: 'number' },
        address: { type: 'string' },
        extractionConfidence: {
          type: 'number',
          description:
            'Self-assessed confidence in the overall extraction quality (0.0–1.0)',
        },
      },
      required: [
        'bankName',
        'accountType',
        'endingBalance',
        'statementPeriodStart',
        'statementPeriodEnd',
        'extractionConfidence',
      ],
    },
  },

  [DocumentType.CLOSING_DISCLOSURE]: {
    name: 'extract_closing_disclosure',
    description:
      'Extract financial data from a TRID Closing Disclosure (CD) form.',
    input_schema: {
      type: 'object' as const,
      properties: {
        borrowerName: { type: 'string' },
        coborrowerName: { type: 'string' },
        address: { type: 'string', description: 'Borrower mailing address' },
        propertyAddress: { type: 'string' },
        lenderName: { type: 'string' },
        loanType: {
          type: 'string',
          enum: ['conventional', 'fha', 'va', 'usda', 'other'],
        },
        loanAmount: { type: 'number' },
        interestRate: {
          type: 'number',
          description: 'Annual interest rate as a decimal e.g. 0.065',
        },
        monthlyPrincipalAndInterest: { type: 'number' },
        estimatedTotalMonthlyPayment: { type: 'number' },
        closingCosts: { type: 'number' },
        cashToClose: { type: 'number' },
        closingDate: { type: 'string', description: 'ISO 8601 date' },
        extractionConfidence: {
          type: 'number',
          description:
            'Self-assessed confidence in the overall extraction quality (0.0–1.0)',
        },
      },
      required: [
        'borrowerName',
        'loanAmount',
        'closingCosts',
        'cashToClose',
        'extractionConfidence',
      ],
    },
  },

  [DocumentType.UUTS]: {
    name: 'extract_uuts',
    description:
      'Extract data from a Uniform Underwriting and Transmittal Summary (Form 1008).',
    input_schema: {
      type: 'object' as const,
      properties: {
        borrowerName: { type: 'string' },
        coborrowerName: { type: 'string' },
        propertyAddress: { type: 'string' },
        loanPurpose: {
          type: 'string',
          enum: ['purchase', 'refinance', 'cash_out_refinance', 'other'],
        },
        occupancyType: {
          type: 'string',
          enum: ['primary_residence', 'second_home', 'investment_property'],
        },
        propertyType: {
          type: 'string',
          enum: [
            'single_family',
            'condo',
            'multi_family',
            'manufactured',
            'other',
          ],
        },
        loanAmount: { type: 'number' },
        appraisedValue: { type: 'number' },
        ltv: {
          type: 'number',
          description: 'Loan-to-value ratio as a decimal e.g. 0.80',
        },
        cltv: { type: 'number', description: 'Combined LTV as a decimal' },
        debtToIncomeRatio: {
          type: 'number',
          description: 'DTI as a decimal e.g. 0.43',
        },
        creditScore: { type: 'integer' },
        extractionConfidence: {
          type: 'number',
          description:
            'Self-assessed confidence in the overall extraction quality (0.0–1.0)',
        },
      },
      required: [
        'borrowerName',
        'loanAmount',
        'loanPurpose',
        'extractionConfidence',
      ],
    },
  },

  [DocumentType.VOI]: {
    name: 'extract_voi',
    description: 'Extract data from a Verification of Income (VOI) letter.',
    input_schema: {
      type: 'object' as const,
      properties: {
        borrowerName: { type: 'string' },
        employerName: { type: 'string' },
        employerAddress: { type: 'string' },
        employmentStartDate: { type: 'string', description: 'ISO 8601 date' },
        employmentStatus: {
          type: 'string',
          enum: ['full_time', 'part_time', 'seasonal', 'self_employed'],
        },
        jobTitle: { type: 'string' },
        annualSalary: { type: 'number' },
        ytdEarnings: { type: 'number' },
        hourlyRate: { type: 'number' },
        hoursPerWeek: { type: 'number' },
        verificationDate: { type: 'string', description: 'ISO 8601 date' },
        extractionConfidence: {
          type: 'number',
          description:
            'Self-assessed confidence in the overall extraction quality (0.0–1.0)',
        },
      },
      required: [
        'borrowerName',
        'employerName',
        'annualSalary',
        'extractionConfidence',
      ],
    },
  },

  [DocumentType.LETTER_OF_EXPLANATION]: {
    name: 'extract_letter_of_explanation',
    description: 'Extract data from a borrower Letter of Explanation (LOE).',
    input_schema: {
      type: 'object' as const,
      properties: {
        borrowerName: { type: 'string' },
        date: { type: 'string', description: 'ISO 8601 date' },
        subject: {
          type: 'string',
          description:
            'Topic being explained e.g. credit inquiry, employment gap',
        },
        explanation: {
          type: 'string',
          description: 'Full text of the explanation',
        },
        referencedAmount: {
          type: 'number',
          description: 'Dollar amount referenced in the letter if any',
        },
        extractionConfidence: {
          type: 'number',
          description:
            'Self-assessed confidence in the overall extraction quality (0.0–1.0)',
        },
      },
      required: [
        'borrowerName',
        'subject',
        'explanation',
        'extractionConfidence',
      ],
    },
  },

  [DocumentType.PAY_STUB]: {
    name: 'extract_pay_stub',
    description: 'Extract earnings data from a pay stub.',
    input_schema: {
      type: 'object' as const,
      properties: {
        employeeName: { type: 'string' },
        employerName: { type: 'string' },
        address: { type: 'string', description: 'Employee address if present' },
        payPeriodStart: { type: 'string', description: 'ISO 8601 date' },
        payPeriodEnd: { type: 'string', description: 'ISO 8601 date' },
        payDate: { type: 'string', description: 'ISO 8601 date' },
        grossPay: {
          type: 'number',
          description: 'Gross pay for this pay period',
        },
        netPay: { type: 'number', description: 'Net pay for this pay period' },
        ytdGross: {
          type: 'number',
          description: 'Year-to-date gross earnings',
        },
        ytdNet: { type: 'number', description: 'Year-to-date net earnings' },
        hoursWorked: { type: 'number' },
        hourlyRate: { type: 'number' },
        extractionConfidence: {
          type: 'number',
          description:
            'Self-assessed confidence in the overall extraction quality (0.0–1.0)',
        },
      },
      required: [
        'employeeName',
        'employerName',
        'grossPay',
        'ytdGross',
        'payPeriodEnd',
        'extractionConfidence',
      ],
    },
  },

  [DocumentType.ALTA_TITLE]: {
    name: 'extract_alta_title',
    description:
      'Extract data from an ALTA Settlement Statement or title commitment.',
    input_schema: {
      type: 'object' as const,
      properties: {
        buyerName: { type: 'string' },
        sellerName: { type: 'string' },
        lenderName: { type: 'string' },
        propertyAddress: { type: 'string' },
        settlementDate: { type: 'string', description: 'ISO 8601 date' },
        purchasePrice: { type: 'number' },
        loanAmount: { type: 'number' },
        titleInsurancePremium: { type: 'number' },
        totalBuyerCharges: { type: 'number' },
        totalSellerCredits: { type: 'number' },
        cashFromBorrower: { type: 'number' },
        extractionConfidence: {
          type: 'number',
          description:
            'Self-assessed confidence in the overall extraction quality (0.0–1.0)',
        },
      },
      required: [
        'buyerName',
        'propertyAddress',
        'purchasePrice',
        'extractionConfidence',
      ],
    },
  },

  [DocumentType.W2]: {
    name: 'extract_w2',
    description: 'Extract wage and tax data from a W-2 Wage and Tax Statement.',
    input_schema: {
      type: 'object' as const,
      properties: {
        employeeName: { type: 'string' },
        employeeSsn: {
          type: 'string',
          description: 'Employee SSN (XXX-XX-XXXX)',
        },
        employerName: { type: 'string' },
        employerEin: {
          type: 'string',
          description: 'Employer Identification Number',
        },
        employerAddress: { type: 'string' },
        taxYear: { type: 'integer' },
        wagesAndTips: {
          type: 'number',
          description: 'Box 1: Wages, tips, other compensation',
        },
        federalTaxWithheld: {
          type: 'number',
          description: 'Box 2: Federal income tax withheld',
        },
        socialSecurityWages: { type: 'number', description: 'Box 3' },
        socialSecurityTaxWithheld: { type: 'number', description: 'Box 4' },
        medicareWages: { type: 'number', description: 'Box 5' },
        medicareTaxWithheld: { type: 'number', description: 'Box 6' },
        stateWages: { type: 'number', description: 'Box 16' },
        stateTaxWithheld: { type: 'number', description: 'Box 17' },
        extractionConfidence: {
          type: 'number',
          description:
            'Self-assessed confidence in the overall extraction quality (0.0–1.0)',
        },
      },
      required: [
        'employeeName',
        'employerName',
        'taxYear',
        'wagesAndTips',
        'extractionConfidence',
      ],
    },
  },

  [DocumentType.UNKNOWN]: {
    name: 'extract_unknown_document',
    description:
      'Extract any identifiable financial or identity fields from an unrecognized document.',
    input_schema: {
      type: 'object' as const,
      properties: {
        borrowerName: { type: 'string' },
        address: { type: 'string' },
        date: { type: 'string', description: 'ISO 8601 date' },
        documentTitle: {
          type: 'string',
          description: 'Best guess at document type or title',
        },
        anyAmounts: {
          type: 'array',
          description: 'Any dollar amounts found with their labels',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              amount: { type: 'number' },
            },
          },
        },
        rawNotes: {
          type: 'string',
          description: 'Any other relevant information found',
        },
        extractionConfidence: {
          type: 'number',
          description:
            'Self-assessed confidence in the overall extraction quality (0.0–1.0)',
        },
      },
      required: [],
    },
  },
};
