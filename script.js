const map = L.map("map", { zoomControl: true, minZoom: 2, maxZoom: 18 }).setView([6.8833,116.8333], 7);

// Satellite map only: no extra stock/background photo is used.
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { attribution: "Tiles © Esri", maxZoom: 18 }
).addTo(map);

let marker = L.marker([6.8833,116.8333], {draggable:true}).addTo(map);

function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

function scoreFromLocation(lat, lng){
  const seed = Math.abs(Math.sin(lat*12.9898 + lng*78.233) * 43758.5453);
  const noise = seed - Math.floor(seed);
  const score = Math.round(clamp(42 + noise*48, 35, 92));
  const rainfall = score < 52 ? "Below baseline" : score < 72 ? "Near baseline" : "Above baseline";
  const water = score < 48 ? "High" : score < 65 ? "Moderate" : "Low";
  const heat = ((Math.abs(lat) + (lng%17)) % 10) > 5 ? "High" : "Moderate";
  const vegetation = score < 50 ? "Declining" : score < 70 ? "Watch" : "Healthy";
  return {score,rainfall,water,heat,vegetation};
}

async function reverseGeocode(lat,lng){
  try{
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`, {
      headers: {"Accept":"application/json"}
    });
    const d = await r.json();
    const a = d.address || {};
    const city = a.city || a.town || a.municipality || a.village || a.county || a.state || "Selected field";
    const country = a.country || "";
    return country ? `${city}, ${country}` : city;
  }catch(e){
    return "Selected field";
  }
}

function updateAnalysis(lat,lng){
  const d = scoreFromLocation(lat,lng);
  document.getElementById("healthScore").textContent=d.score;
  document.getElementById("healthRingText").textContent=d.score;
  document.getElementById("healthRing").style.borderColor = d.score >= 70 ? "#67e5ff" : d.score >= 50 ? "#ffd166" : "#ff6b6b";
  document.getElementById("rainfall").textContent=d.rainfall;
  document.getElementById("waterStress").textContent=d.water;
  document.getElementById("heatRisk").textContent=d.heat;
  document.getElementById("vegetation").textContent=d.vegetation;
  document.getElementById("whyText").textContent =
    `At ${lat.toFixed(4)}°, ${lng.toFixed(4)}°, the FieldShift indicators suggest ${d.rainfall.toLowerCase()} rainfall, ${d.water.toLowerCase()} water stress, ${d.heat.toLowerCase()} heat risk and ${d.vegetation.toLowerCase()} vegetation conditions.`;
}

async function updateLocation(lat,lng){
  document.getElementById("coords").textContent = `${Math.abs(lat).toFixed(4)}° ${lat>=0?"N":"S"} · ${Math.abs(lng).toFixed(4)}° ${lng>=0?"E":"W"}`;
  document.getElementById("placeName").textContent = "Locating field…";
  updateAnalysis(lat,lng);
  const name = await reverseGeocode(lat,lng);
  document.getElementById("placeName").textContent = name;
}

map.on("click", e=>{
  marker.setLatLng(e.latlng);
  updateLocation(e.latlng.lat,e.latlng.lng);
});
marker.on("dragend", e=>{
  const p=e.target.getLatLng();
  updateLocation(p.lat,p.lng);
});

document.getElementById("runAnalysis").addEventListener("click",()=>{
  const p=marker.getLatLng();
  updateLocation(p.lat,p.lng);
});

updateLocation(6.8833,116.8333);
