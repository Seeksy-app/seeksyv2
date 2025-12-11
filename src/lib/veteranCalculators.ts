// Veteran Benefits Calculator Logic
// Based on OPM regulations and DoD military pay tables

export interface MilitaryBuyBackInput {
  branch: string;
  payEntryDate: Date;
  separationDate: Date;
  separationGrade: string;
  fedStartDate: Date;
  retirementPlan: 'fers' | 'csrs';
  yearsToRetirement: number;
  annualBasePay: number;
}

export interface MilitaryBuyBackResult {
  totalMilitaryService: number;
  depositAmount: number;
  monthlyPaymentOption: number;
  interestAmount: number;
  annuityIncrease: number;
  breakEvenYears: number;
  lifetimeBenefit: number;
  recommendation: string;
}

export function calculateMilitaryBuyBack(input: MilitaryBuyBackInput): MilitaryBuyBackResult {
  const serviceYears = 
    (input.separationDate.getTime() - input.payEntryDate.getTime()) / 
    (1000 * 60 * 60 * 24 * 365.25);

  const depositRate = input.retirementPlan === 'fers' ? 0.03 : 0.07;
  const estimatedMilitaryPay = estimateMilitaryPay(input.separationGrade, input.separationDate.getFullYear());
  const baseDeposit = estimatedMilitaryPay * serviceYears * depositRate;

  const yearsOfInterest = 
    (input.fedStartDate.getTime() - input.separationDate.getTime()) / 
    (1000 * 60 * 60 * 24 * 365.25);
  
  const estimatedInterestRate = getEstimatedInterestRate(input.separationDate.getFullYear(), input.fedStartDate.getFullYear());
  const interestAmount = baseDeposit * Math.pow(1 + estimatedInterestRate, Math.max(0, yearsOfInterest)) - baseDeposit;

  const totalDeposit = baseDeposit + Math.max(0, interestAmount);

  const annuityRate = input.retirementPlan === 'fers' ? 0.01 : 0.0175;
  const annualAnnuityIncrease = input.annualBasePay * serviceYears * annuityRate;

  const breakEvenYears = totalDeposit / annualAnnuityIncrease;
  const lifetimeBenefit = annualAnnuityIncrease * 20; // 20-year retirement assumption

  let recommendation = "";
  if (breakEvenYears < 5) {
    recommendation = "Strongly recommended! You'll recoup your investment quickly and gain significant lifetime benefits.";
  } else if (breakEvenYears < 10) {
    recommendation = "Recommended. The investment pays off within a typical retirement period.";
  } else {
    recommendation = "Consider carefully. Consult a benefits specialist to evaluate your specific situation.";
  }

  return {
    totalMilitaryService: serviceYears,
    depositAmount: totalDeposit,
    monthlyPaymentOption: totalDeposit / (input.yearsToRetirement * 12),
    interestAmount: Math.max(0, interestAmount),
    annuityIncrease: annualAnnuityIncrease,
    breakEvenYears,
    lifetimeBenefit,
    recommendation,
  };
}

function estimateMilitaryPay(grade: string, separationYear: number): number {
  const payTable2024: { [key: string]: number } = {
    e1: 24000, e2: 27000, e3: 30000, e4: 35000, e5: 42000,
    e6: 50000, e7: 58000, e8: 67000, e9: 77000,
    w1: 55000, w2: 63000, w3: 72000, w4: 84000, w5: 95000,
    o1: 42000, o2: 51000, o3: 66000, o4: 82000, o5: 97000, o6: 115000,
  };
  
  const basePay = payTable2024[grade.toLowerCase()] || 35000;
  const yearDiff = 2024 - separationYear;
  const adjustmentFactor = Math.pow(0.97, Math.max(0, yearDiff));
  
  return basePay * adjustmentFactor;
}

function getEstimatedInterestRate(separationYear: number, startYear: number): number {
  let totalRate = 0;
  let years = 0;
  
  for (let year = separationYear; year < startYear; year++) {
    years++;
    if (year >= 2025) totalRate += 0.04375;
    else if (year === 2024) totalRate += 0.035;
    else if (year === 2023) totalRate += 0.01875;
    else if (year >= 2020) totalRate += 0.025;
    else totalRate += 0.03;
  }
  
  return years > 0 ? totalRate / years : 0.03;
}

// MRA Calculator
export interface MRAInput {
  dateOfBirth: Date;
  startDate: Date;
  hasMilitaryService: boolean;
  hasSpecialProvisions: boolean;
}

export interface MRAResult {
  minimumRetirementAge: number;
  mraYears: number;
  mraMonths: number;
  retirementEligibilityDate: Date;
  yearsOfServiceNeeded: number;
  monthsOfServiceNeeded: number;
  canRetireAt: string;
  specialProvisionAge?: number;
}

export function calculateMRA(input: MRAInput): MRAResult {
  const birthYear = input.dateOfBirth.getFullYear();
  
  let mraYears = 55;
  let mraMonths = 0;

  if (birthYear < 1948) {
    mraYears = 55;
  } else if (birthYear === 1948) {
    mraYears = 55; mraMonths = 0;
  } else if (birthYear === 1949) {
    mraYears = 55; mraMonths = 2;
  } else if (birthYear === 1950) {
    mraYears = 55; mraMonths = 4;
  } else if (birthYear === 1951) {
    mraYears = 55; mraMonths = 6;
  } else if (birthYear === 1952) {
    mraYears = 55; mraMonths = 8;
  } else if (birthYear === 1953) {
    mraYears = 55; mraMonths = 10;
  } else if (birthYear >= 1954 && birthYear <= 1964) {
    mraYears = 56;
  } else if (birthYear === 1965) {
    mraYears = 56; mraMonths = 2;
  } else if (birthYear === 1966) {
    mraYears = 56; mraMonths = 4;
  } else if (birthYear === 1967) {
    mraYears = 56; mraMonths = 6;
  } else if (birthYear === 1968) {
    mraYears = 56; mraMonths = 8;
  } else if (birthYear === 1969) {
    mraYears = 56; mraMonths = 10;
  } else {
    mraYears = 57;
  }

  let specialProvisionAge;
  if (input.hasSpecialProvisions) {
    specialProvisionAge = 50;
  }

  const retirementDate = new Date(input.dateOfBirth);
  retirementDate.setFullYear(retirementDate.getFullYear() + mraYears);
  retirementDate.setMonth(retirementDate.getMonth() + mraMonths);

  const serviceTime = retirementDate.getTime() - input.startDate.getTime();
  const totalMonths = serviceTime / (1000 * 60 * 60 * 24 * 30.44);
  const yearsOfService = Math.floor(totalMonths / 12);
  const monthsOfService = Math.floor(totalMonths % 12);

  let canRetireAt;
  if (input.hasSpecialProvisions) {
    canRetireAt = `Age ${specialProvisionAge} with 20 years of service, or age ${mraYears} with 30 years`;
  } else if (input.hasMilitaryService) {
    canRetireAt = `MRA (age ${mraYears} years ${mraMonths} months) with 30 years, or age 60 with 20 years (military time may count)`;
  } else {
    canRetireAt = `MRA (age ${mraYears} years ${mraMonths} months) with 30 years, or age 60 with 20 years, or age 62 with 5 years`;
  }

  return {
    minimumRetirementAge: mraYears + mraMonths / 12,
    mraYears,
    mraMonths,
    retirementEligibilityDate: retirementDate,
    yearsOfServiceNeeded: yearsOfService,
    monthsOfServiceNeeded: monthsOfService,
    canRetireAt,
    specialProvisionAge,
  };
}

// Sick Leave Calculator
export interface SickLeaveInput {
  unusedSickLeaveHours: number;
  currentSalary?: number;
}

export interface SickLeaveResult {
  totalHours: number;
  daysEquivalent: number;
  monthsCredit: number;
  yearsCredit: number;
  pensionIncrease: string;
  estimatedAnnualBenefit: number;
  description: string;
}

export function calculateSickLeave(input: SickLeaveInput): SickLeaveResult {
  const totalHours = input.unusedSickLeaveHours;
  const daysEquivalent = totalHours / 8;
  
  const yearsCredit = totalHours / 2087;
  const monthsCredit = (yearsCredit % 1) * 12;
  
  const pensionIncreasePercent = (yearsCredit * 1).toFixed(2);
  const estimatedAnnualBenefit = input.currentSalary 
    ? input.currentSalary * yearsCredit * 0.01 
    : 0;

  let description = "";
  if (yearsCredit >= 1) {
    description = `Your unused sick leave will add ${Math.floor(yearsCredit)} year(s) and ${Math.floor(monthsCredit)} month(s) to your total service time.`;
  } else {
    description = `Your unused sick leave will add ${Math.floor(monthsCredit)} month(s) to your total service time.`;
  }

  return {
    totalHours,
    daysEquivalent: Math.floor(daysEquivalent),
    monthsCredit: Math.floor(monthsCredit),
    yearsCredit: Math.floor(yearsCredit),
    pensionIncrease: `${pensionIncreasePercent}%`,
    estimatedAnnualBenefit,
    description,
  };
}
