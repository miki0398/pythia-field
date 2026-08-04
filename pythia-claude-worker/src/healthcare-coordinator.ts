export interface HealthcareCoordinatorRequest {
  action: "call_gp" | "find_lab" | "schedule_appointment" | "call_hospital";
  details: {
    gpName?: string;
    hospitalName?: string;
    labType?: string;
    appointmentType?: string;
  };
}

export async function handleHealthcareCoordination(
  request: HealthcareCoordinatorRequest,
  userLocation: { lat: number; lng: number }
): Promise<string> {
  switch (request.action) {
    case "call_gp":
      return `Calling ${request.details.gpName || "your GP"}... Stand by.`;
    
    case "call_hospital":
      return `Calling ${request.details.hospitalName || "the hospital"}... Stand by.`;
    
    case "find_lab":
  const labType = request.details.labType || "blood";
  const mapsQuery = encodeURIComponent(`${labType} test facility`);
  const mapsUrl = `https://www.google.com/maps/search/${mapsQuery}`;
  return `🔍 Finding nearby ${labType} test facilities. Maps: ${mapsUrl}`;
  
    case "schedule_appointment":
      return `Scheduling ${request.details.appointmentType || "your"} appointment...`;
    
    default:
      return "Healthcare action not recognized.";
  }
}