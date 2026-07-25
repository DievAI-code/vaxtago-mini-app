"use client";

export const mapProvider = {
  isYandexAvailable(): boolean {
    return true;
  },

  is2GISAvailable(): boolean {
    return true;
  },

  getActiveProvider(): "yandex" | "2gis" {
    return "yandex";
  },
};