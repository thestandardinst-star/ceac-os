// Where location is the point rather than a number in text: the office pin
// and its radius, where people signed in, an event venue.
//
// Static image from OpenStreetMap — no mapping library, no API key, no
// tracking of the person viewing it.
export default function MapPin({ lat, lng, radius, label, height = 200, zoom = 0.004 }) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return <div className="card small">No location set yet.</div>;
  }
  const la = Number(lat), ln = Number(lng);
  const bbox = [ln - zoom, la - zoom / 2, ln + zoom, la + zoom / 2].join("%2C");
  const src = "https://www.openstreetmap.org/export/embed.html?bbox=" + bbox
    + "&layer=mapnik&marker=" + la + "%2C" + ln;
  return (
    <div className="mapwrap" style={{ height }}>
      <iframe title={label || "Location"} src={src} loading="lazy"
              style={{ width: "100%", height: "100%", border: 0, borderRadius: "var(--ceac-radius-small)" }} />
      {(label || radius) && (
        <div className="small" style={{ marginTop: 6 }}>
          {label}{radius ? " · anyone within " + radius + "m counts as here" : ""}
        </div>)}
    </div>);
}
