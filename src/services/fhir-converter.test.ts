import { prescriptionToFHIRBundle, validateFHIRBundle } from "./fhir-converter";

// Test data: prescription extracted from Gmail
const testPrescription = {
  labType: "blood test",
  urgency: "urgent",
  doctorName: "Dr. Sarah Johnson",
  prescriptionDate: "2026-08-14",
  patientId: "google-oauth2|110933147854803292336",
};

// Convert to FHIR
const fhirBundle = prescriptionToFHIRBundle(testPrescription);

console.log("✅ FHIR Bundle Generated:");
console.log(JSON.stringify(fhirBundle, null, 2));

// Validate
const isValid = validateFHIRBundle(fhirBundle);
console.log(`✅ Bundle validation: ${isValid ? "PASSED" : "FAILED"}`);

// Check structure
console.log("\n📋 Bundle Structure:");
console.log(`- Resource Type: ${fhirBundle.resourceType}`);
console.log(`- Type: ${fhirBundle.type}`);
console.log(`- Entries: ${fhirBundle.entry.length}`);
console.log(`- ServiceRequest ID: ${fhirBundle.entry[0].resource.id}`);
console.log(`- Practitioner: ${(fhirBundle.entry[1].resource as any).name[0].text}`);