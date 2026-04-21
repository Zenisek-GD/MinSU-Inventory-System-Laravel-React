export function formatOfficeLabel(office) {
  if (!office) return "";
  const name = office.name || office.office_name || "";
  const roomId = office.room_id || "";
  if (roomId && name) return `${roomId} — ${name}`;
  return roomId || name || "";
}

export function formatOfficeTooltip(office) {
  if (!office) return "";
  const parts = [
    office.room_id,
    office.name || office.office_name,
    office.building,
    office.floor,
    office.room_number,
  ].filter(Boolean);
  return parts.join(" • ");
}
