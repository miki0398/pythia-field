export interface HealthcareCoordinatorRequest {
  action: "call_gp" | "find_lab" | "schedule_appointment" | "call_hospital";
  details: {
    gpName?: string;
    hospitalName?: string;
    labType?: string;
    appointmentType?: string;
    location?: string;
  };
}

export async function handleHealthcareCoordination(
  request: HealthcareCoordinatorRequest,
  userLocation: { lat: number; lng: number }
): Promise<string> {
  switch (request.action) {
    case "call_gp":
      return await callGP(request.details);
    case "find_lab":
      return await findNearestLab(userLocation, request.details.labType || "blood");
    case "schedule_appointment":
      return await scheduleAppointment(request.details);
    case "call_hospital":
      return await callHospital(request.details);
    default:
      return "Unknown healthcare action";
  }
}

async function callGP(details: any): Promise<string> {
  return `Calling ${details.gpName || "your GP"}...`;
}

async function callHospital(details: any): Promise<string> {
  return `Calling ${details.hospitalName || "the hospital"}...`;
}

async function findNearestLab(
  location: { lat: number; lng: number },
  labType: string
): Promise<string> {
  const query = `${labType} test facility`;
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${location.lat},${location.lng},15z`;
  return `Found nearby ${labType} facilities: ${mapsUrl}`;
}

async function scheduleAppointment(details: any): Promise<string> {
  return `Scheduling ${details.appointmentType} appointment...`;
}