"use client";

export const is2GISAvailable = (): boolean => {
  return Boolean(import.meta.env.VITE_2GIS_MAP_KEY);
};

export const get2GISKey = (): string => {
  return import.meta.env.VITE_2GIS_MAP_KEY || "";
};