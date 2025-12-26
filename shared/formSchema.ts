export interface FormField {
  id: string;
  label: string;
  section: string;
  type: "text" | "number" | "date" | "checkbox";
  required: boolean;
  description?: string;
  pdfMapping: {
    page: number;
    x: number;
    y: number;
    width: number;
    align?: "left" | "center";
  };
}

export interface FormSchema {
  name: string;
  description: string;
  fields: FormField[];
}

export const financialStatementSchema: FormSchema = {
  name: "Massachusetts Court Financial Statement",
  description: "Financial statement form for family court proceedings",
  fields: [
    { id: "p1_division", label: "Division", section: "caseInfo", type: "text", required: true, description: "Court division", pdfMapping: { page: 0, x: 74.591, y: 745.973, width: 86.824 } },
    { id: "p1_trial_court_docket_n", label: "Trial Court Docket No.", section: "caseInfo", type: "text", required: true, description: "Case number", pdfMapping: { page: 0, x: 488.642, y: 744.485, width: 95.773 } },
    { id: "p1_plaintiff", label: "Plaintiff", section: "caseInfo", type: "text", required: true, description: "Name of plaintiff", pdfMapping: { page: 0, x: 25.585, y: 663.97, width: 237.83 } },
    { id: "p1_defendant", label: "Defendant", section: "caseInfo", type: "text", required: true, description: "Name of defendant", pdfMapping: { page: 0, x: 355.585, y: 663.97, width: 237.83 } },
    
    { id: "p1_your_name", label: "Your Name", section: "personalInfo", type: "text", required: true, description: "Full legal name", pdfMapping: { page: 0, x: 95.705, y: 606.035, width: 264.036 } },
    { id: "p1_social_security_no", label: "Social Security No.", section: "personalInfo", type: "text", required: true, description: "SSN (XXX-XX-XXXX)", pdfMapping: { page: 0, x: 455.39, y: 606.126, width: 115.16 } },
    { id: "p1_address", label: "Address", section: "personalInfo", type: "text", required: true, description: "Street address", pdfMapping: { page: 0, x: 87.841, y: 587.436, width: 203.196 } },
    { id: "p1_city_town", label: "City/Town", section: "personalInfo", type: "text", required: true, description: "City or town", pdfMapping: { page: 0, x: 300.196, y: 587.622, width: 39.83 } },
    { id: "p1_state", label: "State", section: "personalInfo", type: "text", required: true, description: "State abbreviation", pdfMapping: { page: 0, x: 480.21, y: 587.619, width: 50.341 } },
    { id: "p1_zip_code", label: "Zip Code", section: "personalInfo", type: "text", required: true, description: "ZIP code", pdfMapping: { page: 0, x: 530.21, y: 587.619, width: 50.341 } },
    { id: "p1_tel_no", label: "Telephone", section: "personalInfo", type: "text", required: false, description: "Phone number", pdfMapping: { page: 0, x: 82.742, y: 559.235, width: 123.673 } },
    { id: "p1_date_of_birth", label: "Date of Birth", section: "personalInfo", type: "date", required: true, description: "Birth date (MM/DD/YYYY)", pdfMapping: { page: 0, x: 271.194, y: 559.235, width: 125.091 } },
    { id: "p1_no_of_children_livi", label: "No. of Children", section: "personalInfo", type: "number", required: false, description: "Number of children living with you", pdfMapping: { page: 0, x: 535.013, y: 559.195, width: 35.492 } },
    
    { id: "p1_occupation", label: "Occupation", section: "employment", type: "text", required: false, description: "Job title or occupation", pdfMapping: { page: 0, x: 94.096, y: 541.235, width: 193.319 } },
    { id: "p1_employer", label: "Employer", section: "employment", type: "text", required: false, description: "Employer name", pdfMapping: { page: 0, x: 337.562, y: 540.033, width: 232.683 } },
    { id: "p1_employers_address", label: "Employer's Address", section: "employment", type: "text", required: false, description: "Employer street address", pdfMapping: { page: 0, x: 140.815, y: 522.404, width: 184.031 } },
    { id: "p1_employers_city_town", label: "Employer City", section: "employment", type: "text", required: false, description: "Employer city", pdfMapping: { page: 0, x: 329.407, y: 521.387, width: 138.83 } },
    { id: "p1_employers_state", label: "Employer State", section: "employment", type: "text", required: false, description: "Employer state", pdfMapping: { page: 0, x: 473.407, y: 520.872, width: 39.83 } },
    { id: "p1_employers_zip", label: "Employer Zip", section: "employment", type: "text", required: false, description: "Employer ZIP code", pdfMapping: { page: 0, x: 527.693, y: 521.055, width: 53.15 } },
    { id: "p1_if_yes_name_of_heal", label: "Health Insurance Provider", section: "employment", type: "text", required: false, description: "Name of health insurance provider", pdfMapping: { page: 0, x: 223.263, y: 472.835, width: 347.784 } },
    
    { id: "p1_income_2a_base_pay", label: "Base Pay", section: "income", type: "number", required: false, description: "Weekly base pay from employment", pdfMapping: { page: 0, x: 489.162, y: 435.417, width: 96.671 } },
    { id: "p1_income_2b_overtime", label: "Overtime", section: "income", type: "number", required: false, description: "Weekly overtime pay", pdfMapping: { page: 0, x: 489.168, y: 416.671, width: 96.671 } },
    { id: "p1_income_2c_part_time", label: "Part-time Job", section: "income", type: "number", required: false, description: "Weekly part-time income", pdfMapping: { page: 0, x: 489.162, y: 399.417, width: 96.671 } },
    { id: "p1_income_2d_self_emp", label: "Self-Employment", section: "income", type: "number", required: false, description: "Weekly self-employment income", pdfMapping: { page: 0, x: 489.162, y: 381.417, width: 96.671 } },
    { id: "p1_income_2e_tips", label: "Tips", section: "income", type: "number", required: false, description: "Weekly tips", pdfMapping: { page: 0, x: 489.46, y: 362.671, width: 96.671 } },
    { id: "p1_income_2f_commissions", label: "Commissions", section: "income", type: "number", required: false, description: "Weekly commissions", pdfMapping: { page: 0, x: 489.162, y: 345.417, width: 96.671 } },
    { id: "p1_income_2g_dividends", label: "Dividends/Interest", section: "income", type: "number", required: false, description: "Weekly dividends and interest", pdfMapping: { page: 0, x: 489.162, y: 327.417, width: 96.671 } },
    { id: "p1_income_2h_trusts", label: "Trusts", section: "income", type: "number", required: false, description: "Weekly trust income", pdfMapping: { page: 0, x: 489.162, y: 309.417, width: 96.671 } },
    { id: "p1_income_2i_pensions", label: "Pensions", section: "income", type: "number", required: false, description: "Weekly pension income", pdfMapping: { page: 0, x: 489.162, y: 291.417, width: 96.671 } },
    { id: "p1_income_2j_social_sec", label: "Social Security", section: "income", type: "number", required: false, description: "Weekly Social Security", pdfMapping: { page: 0, x: 489.162, y: 273.417, width: 96.671 } },
    { id: "p1_income_2k_disability", label: "Disability", section: "income", type: "number", required: false, description: "Weekly disability income", pdfMapping: { page: 0, x: 489.162, y: 255.417, width: 96.671 } },
    { id: "p1_income_2l_public_assist", label: "Public Assistance", section: "income", type: "number", required: false, description: "Weekly public assistance", pdfMapping: { page: 0, x: 489.162, y: 237.417, width: 96.671 } },
    { id: "p1_income_2m_child_support", label: "Child Support Received", section: "income", type: "number", required: false, description: "Weekly child support received", pdfMapping: { page: 0, x: 489.162, y: 219.417, width: 96.671 } },
    { id: "p1_income_2n_rental", label: "Rental Income", section: "income", type: "number", required: false, description: "Weekly rental income", pdfMapping: { page: 0, x: 489.162, y: 201.417, width: 96.671 } },
    { id: "p1_income_2o_royalties", label: "Royalties", section: "income", type: "number", required: false, description: "Weekly royalties", pdfMapping: { page: 0, x: 489.163, y: 183.417, width: 96.671 } },
    { id: "p1_income_2p_household_contrib", label: "Household Contributions", section: "income", type: "number", required: false, description: "Weekly household contributions", pdfMapping: { page: 0, x: 489.162, y: 165.417, width: 96.671 } },
    { id: "p1_ther_specify", label: "Other Income Type", section: "income", type: "text", required: false, description: "Specify other income source", pdfMapping: { page: 0, x: 58.585, y: 131.555, width: 291.83 } },
    { id: "p1_income_2q_other", label: "Other Income Amount", section: "income", type: "number", required: false, description: "Weekly other income", pdfMapping: { page: 0, x: 489.162, y: 129.417, width: 96.671 } },
    { id: "p1_income_2r_total", label: "Total Weekly Income", section: "income", type: "number", required: true, description: "Total weekly gross income", pdfMapping: { page: 0, x: 489.46, y: 110.422, width: 96.671 } },
    
    { id: "p2_deduction_3a_federal_tax", label: "Federal Income Tax", section: "deductions", type: "number", required: false, description: "Weekly federal tax", pdfMapping: { page: 1, x: 489.162, y: 660.351, width: 96.671 } },
    { id: "p2_deduction_3b_state_tax", label: "State Income Tax", section: "deductions", type: "number", required: false, description: "Weekly state tax", pdfMapping: { page: 1, x: 489.162, y: 642.351, width: 96.671 } },
    { id: "p2_deduction_3c_fica", label: "FICA/Medicare", section: "deductions", type: "number", required: false, description: "Weekly FICA", pdfMapping: { page: 1, x: 489.162, y: 624.351, width: 96.671 } },
    { id: "p2_deduction_3d_medical", label: "Medical Insurance", section: "deductions", type: "number", required: false, description: "Weekly medical insurance", pdfMapping: { page: 1, x: 489.162, y: 606.351, width: 96.671 } },
    { id: "p2_deduction_3e_union", label: "Union Dues", section: "deductions", type: "number", required: false, description: "Weekly union dues", pdfMapping: { page: 1, x: 489.162, y: 588.351, width: 96.671 } },
    { id: "p2_deduction_3f_total", label: "Total Deductions", section: "deductions", type: "number", required: false, description: "Total weekly deductions", pdfMapping: { page: 1, x: 489.162, y: 570.416, width: 96.671 } },
    { id: "p2_s_3f_adjusted_net_w", label: "Adjusted Net Weekly Income", section: "deductions", type: "number", required: true, description: "Net weekly income after deductions", pdfMapping: { page: 1, x: 492.583, y: 544.835, width: 96.58 } },
    
    { id: "p2_a_rent_or_mortage", label: "Rent/Mortgage", section: "expenses", type: "number", required: false, description: "Weekly rent or mortgage", pdfMapping: { page: 1, x: 187.748, y: 291.117, width: 96.671 } },
    { id: "p2_b_homeowners_tenant", label: "Homeowners/Tenant Insurance", section: "expenses", type: "number", required: false, description: "Weekly insurance", pdfMapping: { page: 1, x: 187.748, y: 276.717, width: 96.671 } },
    { id: "p2_c_maintenance_and_r", label: "Maintenance and Repair", section: "expenses", type: "number", required: false, description: "Weekly maintenance", pdfMapping: { page: 1, x: 187.748, y: 262.317, width: 96.671 } },
    { id: "p2_d_heat", label: "Heat", section: "expenses", type: "number", required: false, description: "Weekly heating cost", pdfMapping: { page: 1, x: 187.36, y: 248.216, width: 96.671 } },
    { id: "p2_e_electricity_and_o", label: "Electricity/Gas", section: "expenses", type: "number", required: false, description: "Weekly utilities", pdfMapping: { page: 1, x: 187.36, y: 233.816, width: 96.671 } },
    { id: "p2_f_telephone", label: "Telephone", section: "expenses", type: "number", required: false, description: "Weekly phone", pdfMapping: { page: 1, x: 187.36, y: 219.416, width: 96.671 } },
    { id: "p2_g_water_sewer", label: "Water/Sewer", section: "expenses", type: "number", required: false, description: "Weekly water/sewer", pdfMapping: { page: 1, x: 187.36, y: 205.016, width: 96.671 } },
    { id: "p2_h_food", label: "Food", section: "expenses", type: "number", required: false, description: "Weekly food", pdfMapping: { page: 1, x: 187.36, y: 190.616, width: 96.671 } },
    { id: "p2_i_house_supplies", label: "House Supplies", section: "expenses", type: "number", required: false, description: "Weekly supplies", pdfMapping: { page: 1, x: 187.36, y: 176.216, width: 96.671 } },
    { id: "p2_j_laundry_and_clean", label: "Laundry/Cleaning", section: "expenses", type: "number", required: false, description: "Weekly laundry", pdfMapping: { page: 1, x: 187.36, y: 161.816, width: 96.671 } },
    { id: "p2_k_clothing_", label: "Clothing", section: "expenses", type: "number", required: false, description: "Weekly clothing", pdfMapping: { page: 1, x: 187.36, y: 147.416, width: 96.671 } },
    { id: "p2_l_life_insurance", label: "Life Insurance", section: "expenses", type: "number", required: false, description: "Weekly life insurance", pdfMapping: { page: 1, x: 498.162, y: 291.416, width: 96.671 } },
    { id: "p2_m_medical_insurance", label: "Medical Insurance", section: "expenses", type: "number", required: false, description: "Weekly medical insurance", pdfMapping: { page: 1, x: 498.162, y: 277.016, width: 96.671 } },
    { id: "p2_n_uninsured_medical", label: "Uninsured Medical", section: "expenses", type: "number", required: false, description: "Weekly uninsured medical", pdfMapping: { page: 1, x: 498.162, y: 262.616, width: 96.671 } },
    { id: "p2_o_incidentals_and_t", label: "Incidentals/Toiletries", section: "expenses", type: "number", required: false, description: "Weekly incidentals", pdfMapping: { page: 1, x: 498.162, y: 248.216, width: 96.671 } },
    { id: "p2_p_motor_vehicle_exp", label: "Motor Vehicle Expenses", section: "expenses", type: "number", required: false, description: "Weekly vehicle expenses", pdfMapping: { page: 1, x: 498.162, y: 233.816, width: 96.671 } },
    { id: "p2_q_motor_vehicle_pay", label: "Motor Vehicle Payment", section: "expenses", type: "number", required: false, description: "Weekly vehicle payment", pdfMapping: { page: 1, x: 498.162, y: 219.416, width: 96.671 } },
    { id: "p2_r_child_care", label: "Child Care", section: "expenses", type: "number", required: false, description: "Weekly child care", pdfMapping: { page: 1, x: 498.162, y: 205.016, width: 96.671 } },
    { id: "p2_total_weekly_expenses", label: "Total Weekly Expenses", section: "expenses", type: "number", required: true, description: "Total weekly expenses", pdfMapping: { page: 1, x: 498.536, y: 123.612, width: 96.671 } },
    
    { id: "p3_location", label: "Real Estate Location", section: "assets", type: "text", required: false, description: "Property address", pdfMapping: { page: 2, x: 85.604, y: 652.835, width: 363.846 } },
    { id: "p3_title_held_in_the_name_of", label: "Title Held By", section: "assets", type: "text", required: false, description: "Name on property title", pdfMapping: { page: 2, x: 146.568, y: 634.835, width: 301.047 } },
    { id: "p3_real_estate_fair_market_value", label: "Real Estate Value", section: "assets", type: "number", required: false, description: "Fair market value", pdfMapping: { page: 2, x: 131.601, y: 616.835, width: 137.265 } },
    { id: "p3_real_estate_mortgage", label: "Real Estate Mortgage", section: "assets", type: "number", required: false, description: "Mortgage amount", pdfMapping: { page: 2, x: 329.028, y: 616.835, width: 119.838 } },
    { id: "p3_real_estate_equity", label: "Real Estate Equity", section: "assets", type: "number", required: false, description: "Equity in property", pdfMapping: { page: 2, x: 498.162, y: 615.417, width: 87.671 } },
    { id: "p3_h_total_assets", label: "Total Assets", section: "assets", type: "number", required: true, description: "Total value of all assets", pdfMapping: { page: 2, x: 489.162, y: 237.417, width: 96.671 } },
    
    { id: "p4_date", label: "Signature Date", section: "signature", type: "date", required: true, description: "Date of signature", pdfMapping: { page: 3, x: 58.57, y: 603.923, width: 144.789 } },
  ],
};

export const formSections = [
  { id: "caseInfo", label: "Case Information", description: "Court and case details" },
  { id: "personalInfo", label: "Personal Information", description: "Your personal details" },
  { id: "employment", label: "Employment", description: "Job and employer information" },
  { id: "income", label: "Weekly Income", description: "All sources of weekly income" },
  { id: "deductions", label: "Payroll Deductions", description: "Tax and other deductions" },
  { id: "expenses", label: "Weekly Expenses", description: "Living and household expenses" },
  { id: "assets", label: "Assets", description: "Property, accounts, and investments" },
  { id: "signature", label: "Signature", description: "Date and signature" },
];

export function getFieldsBySection(sectionId: string): FormField[] {
  return financialStatementSchema.fields.filter(f => f.section === sectionId);
}

export function getAllFieldIds(): string[] {
  return financialStatementSchema.fields.map(f => f.id);
}
