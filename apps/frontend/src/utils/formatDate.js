export default function formatDate(date) {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    // hour: "numeric",
    // minute: "2-digit",
    // hour12: true,
  });
  return formattedDate;
}
