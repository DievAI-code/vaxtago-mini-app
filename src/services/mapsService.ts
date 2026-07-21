"use client";

export const mapsService = {
  openGoogleMaps(address: string) {
    if (!address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, "_blank");
  },

  openGoogleMapsCoordinates(lat: number, lng: number) {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank");
  },

  createRouteToLocation(address: string) {
    if (!address) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, "_blank");
  },

  createRouteToCoordinates(lat: number, lng: number) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  },

  async searchCompany(name: string, city: string) {
    // Архитектурная заглушка для интеграции Google Places API
    console.log(`[Google Places] Searching company: ${name} in ${city}`);
    const query = `${name}, ${city}`;
    return {
      name,
      city,
      formatted_address: query,
      confidence: "high",
      placesUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    };
  }
};