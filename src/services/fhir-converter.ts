// Why: Convert prescription data to FHIR R4 format for healthcare interoperability
// Reference: FHIR R4 (https://www.hl7.org/fhir/R4/)

export interface PrescriptionData {
  labType: string;
  urgency: string;
  doctorName: string;
  prescriptionDate: string;
  patientId: string;
}

export interface FHIRBundle {
  resourceType: "Bundle";
  type: "transaction";
  entry: FHIREntry[];
}

export interface FHIREntry {
  resource: FHIRResource;
  request: {
    method: "POST" | "PUT";
    url: string;
  };
}

export type FHIRResource = FHIRServiceRequest | FHIRPractitioner | FHIRPatient;

export interface FHIRServiceRequest {
  resourceType: "ServiceRequest";
  id: string;
  status: "draft" | "active" | "on-hold" | "revoked" | "completed" | "entered-in-error" | "unknown";
  intent: "proposal" | "plan" | "directive" | "order" | "original-order" | "reflex-order" | "filler-order" | "instance-order" | "option";
  category: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
  priority: "routine" | "urgent" | "asap" | "stat";
  code: { coding: Array<{ system: string; code: string; display: string }> };
  subject: { reference: string };
  authoredOn: string;
  requester: { reference: string };
  reasonCode?: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
}

export interface FHIRPractitioner {
  resourceType: "Practitioner";
  id: string;
  name: Array<{ text: string }>;
}

export interface FHIRPatient {
  resourceType: "Patient";
  id: string;
  identifier: Array<{ system: string; value: string }>;
}

// Why: Convert prescription urgency to FHIR priority
function mapUrgencyToPriority(urgency: string): "routine" | "urgent" | "asap" | "stat" {
  switch (urgency.toLowerCase()) {
    case "stat":
      return "stat";
    case "urgent":
      return "urgent";
    case "asap":
      return "asap";
    default:
      return "routine";
  }
}

// Why: Convert lab type to FHIR service code
function mapLabTypeToCode(labType: string) {
  const codeMap: Record<string, { code: string; display: string }> = {
    "blood test": { code: "26604007", display: "Complete blood count (procedure)" },
    "imaging": { code: "363679005", display: "Imaging (procedure)" },
    "follow-up": { code: "281604006", display: "Patient follow-up (procedure)" },
    "other": { code: "108241001", display: "Laboratory procedure (procedure)" },
  };

  const mapped = codeMap[labType.toLowerCase()] || codeMap["other"];
  return {
    system: "http://snomed.info/sct",
    code: mapped.code,
    display: mapped.display,
  };
}

// Why: Convert extracted prescription to FHIR Bundle (transaction format)
export function prescriptionToFHIRBundle(prescription: PrescriptionData): FHIRBundle {
  const baseId = `prescription-${Date.now()}`;
  const practitionerId = `practitioner-${Date.now()}`;
  const patientId = prescription.patientId;

  const labCode = mapLabTypeToCode(prescription.labType);
  const priority = mapUrgencyToPriority(prescription.urgency);

  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: [
      {
        resource: {
          resourceType: "ServiceRequest",
          id: baseId,
          status: "active",
          intent: "order",
          category: [
            {
              coding: [
                {
                  system: "http://snomed.info/sct",
                  code: "721963008",
                  display: "Order (record artifact)",
                },
              ],
            },
          ],
          priority: priority,
          code: {
            coding: [labCode],
          },
          subject: {
            reference: `Patient/${patientId}`,
          },
          authoredOn: prescription.prescriptionDate,
          requester: {
            reference: `Practitioner/${practitionerId}`,
          },
        },
        request: {
          method: "POST",
          url: "ServiceRequest",
        },
      },
      {
        resource: {
          resourceType: "Practitioner",
          id: practitionerId,
          name: [{ text: prescription.doctorName }],
        },
        request: {
          method: "POST",
          url: "Practitioner",
        },
      },
    ],
  };
}

// Why: Validate FHIR Bundle structure
export function validateFHIRBundle(bundle: FHIRBundle): boolean {
  return (
    bundle.resourceType === "Bundle" &&
    bundle.type === "transaction" &&
    bundle.entry &&
    bundle.entry.length > 0 &&
    bundle.entry.every((entry) => entry.resource && entry.request)
  );
}