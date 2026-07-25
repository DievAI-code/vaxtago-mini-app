"use client";

export const mapsService = {
  openGoogleMaps(address: string) {
    // Redirected to Yandex Maps
    window.open(
      `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`,
      "_blank",
      "noopener,noreferrer"
    );
  },

  openGoogleMapsCoordinates(lat: number, lng: number) {
    window.open(
      `https://yandex.ru/maps/?ll=${lng},${lat}&z=15`,
      "_blank",
      "noopener,noreferrer"
    );
  },

  createRouteToLocation(address: string) {
    window.open(
      `https://yandex.ru/maps/?rtext=~${encodeURIComponent(address)}`,
      "_blank",
      "noopener,noreferrer"
    );
  },

  createRouteToCoordinates(lat: number, lng: number) {
    window.open(
      `https://yandex.ru/maps/?rtext=~${lat},${lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  },

  async searchCompany(name: string, city: string) {
    const query = `${name}, ${city}`;
    return {
      name,
      city,
      formatted_address: query,
      confidence: "high",
      placesUrl: `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`,
    };
  },
};